/**
 * Customer reviews. Stored in the `reviews` store:
 *   rev:<id>  → Review
 *   _index    → string[] of ids, newest first
 *   _stats    → { count, averageRating, pending } (approved reviews only; read by GET /stats)
 */
import type { Order, Review, ReviewStats } from '../../src/shared/types';
import { kvGet, kvList, kvSet, kvUpdate } from './store';
import { uuid } from './ids';
import { nowIso } from './http';

const INDEX_KEY = '_index';
const STATS_KEY = '_stats';
const MAX_INDEX = 5000;
const ID_RE = /^[a-f0-9]{32}$/;

export interface StoredReviewStats extends ReviewStats {
  /** reviews waiting for approval (admin dashboard) */
  pending: number;
  updatedAt: string;
}

export const COMMENT_MIN = 3;
export const COMMENT_MAX = 500;

const key = (id: string) => `rev:${id}`;

/** Strip control characters, collapse runs of whitespace, trim. */
export function cleanComment(raw: string): string {
  return raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function getReview(id: string): Promise<Review | null> {
  const clean = id.trim().toLowerCase();
  if (!ID_RE.test(clean)) return null;
  return kvGet<Review>('reviews', key(clean));
}

export async function listReviewIds(): Promise<string[]> {
  const ids = await kvGet<string[]>('reviews', INDEX_KEY);
  if (Array.isArray(ids) && ids.length) return ids.filter((x) => typeof x === 'string');
  // index missing (e.g. hand-edited store) – rebuild from the keys
  const keys = await kvList('reviews', 'rev:');
  return keys.map((k) => k.slice(4)).reverse();
}

export async function saveReview(review: Review): Promise<void> {
  await kvSet('reviews', key(review.id), review);
  await kvUpdate<string[]>('reviews', INDEX_KEY, (cur) => {
    const list = (cur ?? []).filter((x) => x !== review.id);
    list.unshift(review.id);
    return list.slice(0, MAX_INDEX);
  });
}

async function loadMany(ids: string[]): Promise<Review[]> {
  const out: Review[] = [];
  for (let i = 0; i < ids.length; i += 25) {
    const chunk = await Promise.all(ids.slice(i, i + 25).map((id) => kvGet<Review>('reviews', key(id))));
    for (const r of chunk) if (r && typeof r.id === 'string') out.push(r);
  }
  return out;
}

export interface ListReviewsOptions {
  status?: Review['status'] | 'all';
  /** max reviews to return (after the status filter) */
  limit?: number;
}

/** Reviews newest first, filtered by status ('approved' by default). */
export async function listReviews(opts: ListReviewsOptions = {}): Promise<Review[]> {
  const status = opts.status ?? 'approved';
  const limit = opts.limit && opts.limit > 0 ? Math.floor(opts.limit) : Infinity;
  const ids = await listReviewIds();
  const out: Review[] = [];
  // load in pages so a short "latest approved" listing never reads the whole store
  for (let i = 0; i < ids.length && out.length < limit; i += 50) {
    const page = await loadMany(ids.slice(i, i + 50));
    for (const r of page) {
      if (status !== 'all' && r.status !== status) continue;
      out.push(r);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** Create a pending review for a delivered order. (Caller validates order state.) */
export async function createReview(order: Order, rating: Review['rating'], comment: string): Promise<Review> {
  const review: Review = {
    id: uuid(),
    orderId: order.id,
    username: order.username,
    rating,
    comment,
    status: 'pending',
    createdAt: nowIso(),
    productNames: Array.from(new Set(order.items.map((i) => i.name))).slice(0, 8),
  };
  await saveReview(review);
  await recomputeStats();
  return review;
}

/** Recompute `_stats` from every review (approved only for count/average). */
export async function recomputeStats(): Promise<StoredReviewStats> {
  const all = await listReviews({ status: 'all' });
  let count = 0;
  let sum = 0;
  let pending = 0;
  for (const r of all) {
    if (r.status === 'approved' && r.rating >= 1 && r.rating <= 5) {
      count += 1;
      sum += r.rating;
    } else if (r.status === 'pending') pending += 1;
  }
  const stats: StoredReviewStats = {
    count,
    averageRating: count ? Math.round((sum / count) * 10) / 10 : 0,
    pending,
    updatedAt: nowIso(),
  };
  await kvSet('reviews', STATS_KEY, stats);
  return stats;
}

/** Cached stats (recomputed when missing). */
export async function getReviewStats(): Promise<StoredReviewStats> {
  const cached = await kvGet<Partial<StoredReviewStats>>('reviews', STATS_KEY);
  if (cached && typeof cached.count === 'number' && typeof cached.pending === 'number') {
    const avg = Number(cached.averageRating);
    return { count: Math.max(0, cached.count), averageRating: Number.isFinite(avg) ? avg : 0, pending: Math.max(0, cached.pending), updatedAt: cached.updatedAt ?? nowIso() };
  }
  return recomputeStats();
}

export function toPublicStats(s: StoredReviewStats): ReviewStats {
  return { count: s.count, averageRating: s.averageRating };
}
