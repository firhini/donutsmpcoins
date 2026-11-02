/**
 * First-party, cookieless visitor statistics for the admin dashboard.
 * Nothing is stored on the visitor's device and no personal profile is kept: one document per day holds
 * counters, and "unique visitors" are a daily-rotating hash of (IP hash + browser), so a visitor cannot be
 * recognised across days.
 */
import { createHash } from 'node:crypto';
import { kvDelete, kvGet, kvUpdate } from './store';

export const EVENT_NAMES = ['pv', 'click', 'add_to_cart', 'begin_checkout', 'order_created', 'product_view', 'login_click'] as const;
export type EventName = (typeof EVENT_NAMES)[number];

export interface TrackEvent {
  e: EventName;
  /** page path (pv), button label (click), product id (add_to_cart / product_view) */
  v?: string;
  /** referrer host, only on the first page view of a visit */
  ref?: string;
  /** utm_source of the landing page */
  src?: string;
  qty?: number;
}

export interface DayStats {
  date: string;
  pv: number;
  visitors: string[];
  pages: Record<string, number>;
  refs: Record<string, number>;
  clicks: Record<string, number>;
  events: Record<string, number>;
  productViews: Record<string, number>;
  cartAdds: Record<string, number>;
  devices: Record<string, number>;
  countries: Record<string, number>;
}

const MAX_KEYS = 300;
const MAX_VISITORS = 20000;

const day = (d = new Date()) => d.toISOString().slice(0, 10);
const empty = (date: string): DayStats => ({ date, pv: 0, visitors: [], pages: {}, refs: {}, clicks: {}, events: {}, productViews: {}, cartAdds: {}, devices: {}, countries: {} });

function bump(map: Record<string, number>, key: string | undefined, by = 1) {
  if (!key) return;
  const k = key.slice(0, 80);
  if (!(k in map) && Object.keys(map).length >= MAX_KEYS) return;
  map[k] = (map[k] ?? 0) + by;
}

/** Strip ids and query strings so pages group nicely ("/order/DC-1234" → "/order/:id"). */
export function normalizePath(p: string): string {
  const path = (p || '/').split(/[?#]/)[0].slice(0, 120) || '/';
  return path.replace(/^\/order\/[^/]+/i, '/order/:id').replace(/\/+$/, '') || '/';
}

export function visitorId(ipHash: string, userAgent: string, date = day()): string {
  return createHash('sha256').update(`${date}:${ipHash}:${userAgent.slice(0, 200)}`).digest('hex').slice(0, 16);
}

export function deviceOf(userAgent: string): string {
  if (/bot|crawl|spider|slurp|lighthouse|headless/i.test(userAgent)) return 'bot';
  if (/ipad|tablet/i.test(userAgent)) return 'tablet';
  return /mobi|android|iphone/i.test(userAgent) ? 'mobile' : 'desktop';
}

export async function recordEvents(events: TrackEvent[], meta: { visitor: string; device: string; country?: string }, now = new Date()): Promise<void> {
  if (!events.length || meta.device === 'bot') return;
  const date = day(now);
  await kvUpdate<DayStats>('analytics', `day:${date}`, (cur) => {
    const s = cur ?? empty(date);
    let newVisitor = false;
    if (!s.visitors.includes(meta.visitor) && s.visitors.length < MAX_VISITORS) {
      s.visitors.push(meta.visitor);
      newVisitor = true;
    }
    if (newVisitor) {
      bump(s.devices, meta.device);
      bump(s.countries, meta.country || '??');
    }
    for (const ev of events) {
      bump(s.events, ev.e);
      if (ev.e === 'pv') {
        s.pv += 1;
        bump(s.pages, normalizePath(ev.v ?? '/'));
        if (ev.ref) bump(s.refs, ev.ref.toLowerCase());
        if (ev.src) bump(s.refs, `utm:${ev.src.toLowerCase()}`);
      } else if (ev.e === 'click' || ev.e === 'login_click') bump(s.clicks, ev.v);
      else if (ev.e === 'product_view') bump(s.productViews, ev.v);
      else if (ev.e === 'add_to_cart') bump(s.cartAdds, ev.v, Math.max(1, Math.min(1000, Math.round(ev.qty ?? 1))));
    }
    return s;
  });
}

export async function getDays(days: number, now = new Date()): Promise<DayStats[]> {
  const dates = Array.from({ length: days }, (_, i) => day(new Date(now.getTime() - i * 86400000))).reverse();
  return Promise.all(dates.map(async (d) => (await kvGet<DayStats>('analytics', `day:${d}`)) ?? empty(d)));
}

/** Validate untrusted beacon input – unknown events and odd values are dropped, not rejected. */
export function sanitizeEvents(raw: unknown): TrackEvent[] {
  const list = Array.isArray((raw as { events?: unknown })?.events) ? ((raw as { events: unknown[] }).events as unknown[]) : [];
  const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max) : undefined);
  const out: TrackEvent[] = [];
  for (const r of list.slice(0, 30)) {
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    if (!EVENT_NAMES.includes(o.e as EventName)) continue;
    const host = clean(o.ref, 80);
    out.push({
      e: o.e as EventName,
      v: clean(o.v, 80),
      ref: host && /^[a-z0-9.-]+$/i.test(host) ? host : undefined,
      src: clean(o.src, 40),
      qty: typeof o.qty === 'number' && Number.isFinite(o.qty) ? o.qty : undefined,
    });
  }
  return out;
}

// ───────────────────────── per-visitor journeys (only with cookie consent) ─────────────────────────

export interface SessionSource {
  /** referring site of the first page view, e.g. google.com, discord.com */
  ref?: string;
  /** utm_source / utm_campaign or ?ref= creator code from the landing URL */
  src?: string;
  campaign?: string;
  creator?: string;
  landing?: string;
}
export interface JourneyEvent {
  /** ms since session start */
  t: number;
  e: EventName;
  v?: string;
}
export interface Session {
  id: string;
  startedAt: string;
  lastAt: string;
  source: SessionSource;
  device: string;
  country?: string;
  events: JourneyEvent[];
  orderIds: string[];
  /** logged-in account, when there is one */
  userId?: string;
}

export const SESSION_ID_RE = /^[a-z0-9]{16,40}$/;
const MAX_JOURNEY = 300;

export function sanitizeSource(raw: unknown): SessionSource {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max) || undefined : undefined);
  const ref = clean(o.ref, 80);
  return {
    ref: ref && /^[a-z0-9.-]+$/i.test(ref) ? ref.toLowerCase() : undefined,
    src: clean(o.src, 40)?.toLowerCase(),
    campaign: clean(o.campaign, 60),
    creator: clean(o.creator, 32),
    landing: clean(o.landing, 120),
  };
}

/** Human label for where a visit came from: creator code > utm_source > referring site > direct. */
export function sourceLabel(s: SessionSource | undefined): string {
  if (!s) return 'unknown';
  if (s.creator) return `creator: ${s.creator}`;
  if (s.src) return `utm: ${s.src}${s.campaign ? ` / ${s.campaign}` : ''}`;
  if (s.ref) return s.ref.replace(/^www\./, '');
  return 'direct';
}

export async function recordJourney(sid: string, events: TrackEvent[], meta: { device: string; country?: string; source: SessionSource; userId?: string }, now = new Date()): Promise<void> {
  if (!SESSION_ID_RE.test(sid) || meta.device === 'bot' || !events.length) return;
  let created = false;
  await kvUpdate<Session>('analytics', `sess:${sid}`, (cur) => {
    const s: Session = cur ?? { id: sid, startedAt: now.toISOString(), lastAt: now.toISOString(), source: meta.source, device: meta.device, country: meta.country, events: [], orderIds: [] };
    created = !cur;
    const start = new Date(s.startedAt).getTime();
    for (const ev of events) {
      if (s.events.length >= MAX_JOURNEY) break;
      s.events.push({ t: Math.max(0, now.getTime() - start), e: ev.e, v: ev.e === 'pv' ? normalizePath(ev.v ?? '/') : ev.v });
    }
    s.lastAt = now.toISOString();
    if (meta.userId) s.userId = meta.userId;
    return s;
  });
  if (created) {
    await kvUpdate<string[]>('analytics', `sessidx:${day(now)}`, (cur) => {
      const list = cur ?? [];
      if (!list.includes(sid) && list.length < 5000) list.push(sid);
      return list;
    });
  }
}

export async function linkOrderToSession(sid: string, orderId: string): Promise<void> {
  if (!SESSION_ID_RE.test(sid)) return;
  await kvUpdate<Session>('analytics', `sess:${sid}`, (cur) => {
    if (!cur) throw new Error('no session');
    if (!cur.orderIds.includes(orderId)) cur.orderIds.push(orderId);
    return cur;
  }).catch(() => undefined);
}

export async function getSession(sid: string): Promise<Session | null> {
  return SESSION_ID_RE.test(sid) ? kvGet<Session>('analytics', `sess:${sid}`) : null;
}

/** Sessions started in the last `days` days, newest first (capped). */
export async function recentSessions(days: number, cap = 400, now = new Date()): Promise<Session[]> {
  const dates = Array.from({ length: days }, (_, i) => day(new Date(now.getTime() - i * 86400000)));
  const ids = (await Promise.all(dates.map((d) => kvGet<string[]>('analytics', `sessidx:${d}`)))).flatMap((l) => [...(l ?? [])].reverse()).slice(0, cap);
  const list = await Promise.all(ids.map((id) => kvGet<Session>('analytics', `sess:${id}`)));
  return list.filter((s): s is Session => !!s).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

/** Journeys are kept for 90 days: drop the day indexes (and their sessions) from 91–100 days ago. */
export const JOURNEY_RETENTION_DAYS = 90;
export async function purgeOldJourneys(now = new Date()): Promise<number> {
  let removed = 0;
  for (let d = JOURNEY_RETENTION_DAYS + 1; d <= JOURNEY_RETENTION_DAYS + 10; d++) {
    const key = `sessidx:${day(new Date(now.getTime() - d * 86400000))}`;
    const ids = await kvGet<string[]>('analytics', key);
    if (!ids) continue;
    for (const id of ids) {
      await kvDelete('analytics', `sess:${id}`).catch(() => undefined);
      removed++;
    }
    await kvDelete('analytics', key);
  }
  return removed;
}
