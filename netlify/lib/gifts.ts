/**
 * Gift codes – admin-created codes that give a product away for free
 * ("redeem GIFT-XXXXXXXX → free order"). Stored in the `misc` store:
 *   gift:<CODE>              → GiftCode
 *   giftuse:<CODE>:<user>    → GiftRedemption (one redemption per player per code)
 */
import { kvDelete, kvGet, kvList, kvSet } from './store';
import { randomCode } from './ids';
import { HttpError, nowIso } from './http';
import type { GiftCode as SharedGiftCode } from '../../src/shared/types';

export type GiftCode = SharedGiftCode & { createdAt: string };

export interface GiftRedemption {
  code: string;
  /** lowercase */
  username: string;
  orderId: string;
  at: string;
}

export interface CreateGiftInput {
  productId: string;
  qty: number;
  maxUses?: number;
  validDays?: number;
  code?: string;
  note?: string;
}

export const GIFT_CODE_RE = /^[A-Z0-9][A-Z0-9_-]{2,39}$/;

export function normalizeGiftCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export function generateGiftCode(): string {
  return `GIFT-${randomCode(8)}`;
}

const giftKey = (code: string) => `gift:${normalizeGiftCode(code)}`;
const useKey = (code: string, username: string) => `giftuse:${normalizeGiftCode(code)}:${username.trim().toLowerCase()}`;

export async function getGift(code: string): Promise<GiftCode | null> {
  const c = normalizeGiftCode(code);
  if (!GIFT_CODE_RE.test(c)) return null;
  return kvGet<GiftCode>('misc', giftKey(c));
}

export async function saveGift(gift: GiftCode): Promise<void> {
  const code = normalizeGiftCode(gift.code);
  await kvSet('misc', giftKey(code), { ...gift, code });
}

export async function deleteGift(code: string): Promise<void> {
  await kvDelete('misc', giftKey(code));
}

/** All gift codes, newest first. */
export async function listGifts(): Promise<GiftCode[]> {
  const keys = await kvList('misc', 'gift:');
  const out: GiftCode[] = [];
  for (const k of keys) {
    const g = await kvGet<GiftCode>('misc', k);
    if (g && typeof g.code === 'string') out.push(g);
  }
  return out.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

/** Create and persist a gift code. Generates a unique `GIFT-XXXXXXXX` unless one is given. */
export async function createGift(input: CreateGiftInput): Promise<GiftCode> {
  let code = input.code ? normalizeGiftCode(input.code) : '';
  if (code) {
    if (!GIFT_CODE_RE.test(code)) throw new HttpError(400, 'Gift codes are 3–40 letters, numbers, dashes or underscores.', 'validation');
    if (await kvGet('misc', giftKey(code))) throw new HttpError(409, `Gift code ${code} already exists.`, 'conflict');
  } else {
    for (let i = 0; i < 6 && !code; i++) {
      const candidate = generateGiftCode();
      if (!(await kvGet('misc', giftKey(candidate)))) code = candidate;
    }
    if (!code) code = generateGiftCode();
  }
  const gift: GiftCode = {
    code,
    productId: input.productId,
    qty: Math.max(1, Math.floor(input.qty)),
    uses: 0,
    maxUses: input.maxUses !== undefined ? Math.max(1, Math.floor(input.maxUses)) : undefined,
    expiresAt: input.validDays ? new Date(Date.now() + input.validDays * 86400_000).toISOString() : undefined,
    note: input.note?.trim() || undefined,
    createdAt: nowIso(),
  };
  await saveGift(gift);
  return gift;
}

/** Why a code cannot be redeemed right now (null = fine). */
export function giftProblem(gift: GiftCode, now = Date.now()): { status: number; message: string; code: string } | null {
  if (gift.expiresAt && new Date(gift.expiresAt).getTime() < now) return { status: 410, message: 'This gift code has expired.', code: 'expired' };
  if (gift.maxUses !== undefined && gift.uses >= gift.maxUses) return { status: 410, message: 'This gift code has already been fully redeemed.', code: 'exhausted' };
  return null;
}

export async function getRedemption(code: string, username: string): Promise<GiftRedemption | null> {
  return kvGet<GiftRedemption>('misc', useKey(code, username));
}

/** Count a redemption: bump `uses` and remember who redeemed it. */
export async function recordRedemption(gift: GiftCode, username: string, orderId: string): Promise<GiftCode> {
  const fresh = (await getGift(gift.code)) ?? gift;
  fresh.uses = (fresh.uses ?? 0) + 1;
  await saveGift(fresh);
  const redemption: GiftRedemption = { code: normalizeGiftCode(gift.code), username: username.trim().toLowerCase(), orderId, at: nowIso() };
  await kvSet('misc', useKey(gift.code, username), redemption);
  return fresh;
}
