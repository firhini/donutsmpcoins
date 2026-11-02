/**
 * First-party, cookieless visitor statistics for the admin dashboard.
 * Nothing is stored on the visitor's device and no personal profile is kept: one document per day holds
 * counters, and "unique visitors" are a daily-rotating hash of (IP hash + browser), so a visitor cannot be
 * recognised across days.
 */
import { createHash } from 'node:crypto';
import { kvGet, kvUpdate } from './store';

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
