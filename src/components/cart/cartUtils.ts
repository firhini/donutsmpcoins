/** Helpers shared by the cart drawer, cart page, checkout, order page and tracking. */
import type { BoxContent, OrderItem, OrderStatus, Product, RolledContent } from '../../shared/types';
import { formatMillions } from '../../shared/pricing';
import { storageGet, storageSet } from '../../lib/device';

export const FALLBACK_IMG = '/img/products/_fallback.svg';
export const RECENT_ORDERS_KEY = 'dc_recent_orders';
export const REVEALED_KEY = 'dc_revealed_orders';
export const USERNAME_KEY = 'dc_username';
export const EMAIL_KEY = 'dc_email';
export const PAY_METHOD_KEY = 'dc_pay_method';

export type Rarity = NonNullable<BoxContent['rarity']>;
export const RARITY_RANK: Record<Rarity, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };

/* ───────── recent orders (this device) ───────── */

export interface RecentOrder {
  id: string;
  createdAt: string;
  totalCents?: number;
  username?: string;
}

export function getRecentOrders(): RecentOrder[] {
  const raw = storageGet<unknown>(RECENT_ORDERS_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r): RecentOrder | null => {
      if (typeof r === 'string') return { id: r, createdAt: '' };
      if (r && typeof r === 'object' && typeof (r as RecentOrder).id === 'string') return r as RecentOrder;
      return null;
    })
    .filter((r): r is RecentOrder => !!r)
    .slice(0, 12);
}

export function rememberOrder(o: RecentOrder): void {
  const list = getRecentOrders().filter((r) => r.id !== o.id);
  list.unshift(o);
  storageSet(RECENT_ORDERS_KEY, list.slice(0, 12));
}

export function forgetOrder(id: string): void {
  storageSet(RECENT_ORDERS_KEY, getRecentOrders().filter((r) => r.id !== id));
}

/* ───────── order ids ───────── */

export const ORDER_ID_RE = /^DC-[A-Z0-9]{6,10}$/;

/** "dc-abc123", "ABC123", "#DC-ABC123" → "DC-ABC123" */
export function normalizeOrderId(input: string): string {
  let s = input.trim().toUpperCase().replace(/[\s#]+/g, '');
  if (s.startsWith('DC-')) return s;
  if (s.startsWith('DC') && s.length > 6) s = s.slice(2).replace(/^-/, '');
  return `DC-${s}`;
}

/* ───────── box reveal persistence ───────── */

export function isRevealed(orderId: string): boolean {
  return storageGet<string[]>(REVEALED_KEY, []).includes(orderId);
}

export function markRevealed(orderId: string): void {
  const list = storageGet<string[]>(REVEALED_KEY, []).filter((x) => x !== orderId);
  list.unshift(orderId);
  storageSet(REVEALED_KEY, list.slice(0, 50));
}

/* ───────── titles ───────── */

/** The "pick your millions" product: quantity = millions. */
export function isMillionsProduct(p: Product): boolean {
  return p.kind === 'money' && (p.moneyMillions ?? 0) === 1 && (p.maxQty ?? 0) > 1;
}

export function lineTitle(p: Product, qty: number): string {
  if (isMillionsProduct(p)) return `${formatMillions(qty)} DonutSMP Money`;
  return p.name;
}

export function itemTitle(item: OrderItem): string {
  if (item.kind === 'money' && item.moneyMillions === 1 && item.qty > 1) return `${formatMillions(item.qty)} DonutSMP Money`;
  return item.name;
}

/** "3×" for items, "50M" for money lines. */
export function itemQtyLabel(item: OrderItem): string {
  if (item.kind === 'money' && item.moneyMillions === 1 && item.qty > 1) return `${formatMillions(item.qty)}`;
  return `${item.qty}×`;
}

/* ───────── statuses ───────── */

export const STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  paid: 'Paid',
  delivering: 'Delivering',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const STATUS_BADGE: Record<OrderStatus, string> = {
  awaiting_payment: 'badge-gold',
  paid: 'badge-green',
  delivering: 'badge-blue',
  delivered: 'badge-green',
  cancelled: 'badge-red',
  refunded: 'badge',
};

export function formatDate(iso: string, withTime = true): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return withTime ? d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 14) return `${d} d ago`;
  return formatDate(iso, false);
}

/* ───────── drops / rarity ───────── */

export function topRarity(drops: RolledContent[]): Rarity {
  let best: Rarity = 'common';
  for (const d of drops) if (d.rarity && RARITY_RANK[d.rarity] > RARITY_RANK[best]) best = d.rarity;
  return best;
}

/** Best-effort artwork for a drop name ("Netherite Ingot", "10M Money", "Elytra (guaranteed)"). */
export function findDropImage(name: string, products: Product[], explicit?: string): string | undefined {
  if (explicit) return explicit;
  const clean = name.replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase();
  const money = /^(\d+(?:\.\d+)?)\s*([mbk])\b/.exec(clean);
  if (money && /money|coins?/.test(clean)) {
    const n = money[1];
    const unit = money[2];
    const direct = products.find((p) => p.id === `money-${n}${unit}`);
    if (direct) return direct.image;
    return products.find((p) => p.id === 'money-1m')?.image;
  }
  const exact = products.find((p) => p.name.toLowerCase() === clean);
  if (exact) return exact.image;
  const starts = products.find((p) => clean.startsWith(p.name.toLowerCase()) || p.name.toLowerCase().startsWith(clean));
  if (starts) return starts.image;
  const words = clean.split(/\s+/).filter((w) => w.length > 3);
  const loose = products.find((p) => words.length > 0 && words.every((w) => p.name.toLowerCase().includes(w)));
  return loose?.image;
}

/* ───────── clipboard ───────── */

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/** Fee the server adds for a payment method (mirrors netlify/lib/orderBuilder.ts). */
export function feeFor(totalCents: number, feePercent?: number): number {
  return feePercent ? Math.round((totalCents * feePercent) / 100) : 0;
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
