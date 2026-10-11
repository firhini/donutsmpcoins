/** Small helpers shared by the admin pages (formatting, status labels, money/date conversions). */
import type { Order, OrderItem, OrderStatus, PaymentStatus, RolledContent } from '../../shared/types';
import { formatUsd } from '../../shared/pricing';

/** Admin always works in USD cents – the owner reconciles PayPal / crypto payments in USD. */
export const usd = (cents: number | undefined | null): string => formatUsd(cents ?? 0);

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
  delivered: 'badge-violet',
  cancelled: 'badge-red',
  refunded: 'badge',
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  pending_review: 'Reported – check',
  paid: 'Paid',
  refunded: 'Refunded',
  failed: 'Failed',
};

export const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  unpaid: 'badge',
  pending_review: 'badge-pink',
  paid: 'badge-green',
  refunded: 'badge',
  failed: 'badge-red',
};

export const ALL_STATUSES: OrderStatus[] = ['awaiting_payment', 'paid', 'delivering', 'delivered', 'cancelled', 'refunded'];

/** Head render of a player (public mc-heads.net service). */
export function avatarUrl(name: string, size = 32): string {
  return `https://mc-heads.net/avatar/${encodeURIComponent(name.trim() || 'steve')}/${size}`;
}

export function formatDate(iso: string | undefined, withTime = true): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return withTime ? d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function relativeTime(iso: string | undefined): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const future = diff < 0;
  const abs = Math.abs(diff);
  const m = Math.round(abs / 60000);
  let s: string;
  if (m < 1) s = 'just now';
  else if (m < 60) s = `${m} min`;
  else if (m < 60 * 24) s = `${Math.round(m / 60)} h`;
  else if (m < 60 * 24 * 14) s = `${Math.round(m / 1440)} d`;
  else return formatDate(iso, false);
  if (s === 'just now') return s;
  return future ? `in ${s}` : `${s} ago`;
}

/* ───────── money inputs ───────── */

export function centsToDollarString(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || Number.isNaN(cents)) return '';
  return (cents / 100).toFixed(2);
}

/** "12.5" → 1250 ; "" → null ; garbage → null */
export function dollarStringToCents(s: string): number | null {
  const t = s.trim().replace(',', '.').replace(/[^0-9.\-]/g, '');
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

/* ───────── dates for <input type="datetime-local"> ───────── */

export function isoToLocalInput(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function localInputToIso(s: string): string | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

/* ───────── misc ───────── */

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function prettyMethod(id: string): string {
  if (!id) return '—';
  if (id === 'free') return 'Free';
  return id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const ORDER_ID_RE = /^DC-[A-Z0-9]{6,10}$/;

/** "dc-abc123", "ABC123", "#DC-ABC123" → "DC-ABC123" (or null when it is not an id) */
export function normalizeOrderId(input: string): string | null {
  let s = input.trim().toUpperCase().replace(/[\s#]+/g, '');
  if (!s) return null;
  if (!s.startsWith('DC-')) {
    if (s.startsWith('DC') && s.length > 6) s = s.slice(2).replace(/^-/, '');
    s = `DC-${s}`;
  }
  return ORDER_ID_RE.test(s) ? s : null;
}

export function pluralize(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

/** "Netherite Ingot", "10M Money", "Elytra (guaranteed)" → millions of in-game money contained (0 if none). */
export function moneyMillionsFromName(name: string): number {
  const clean = name.replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase();
  if (!/money|coins?/.test(clean)) return 0;
  const m = /(\d+(?:\.\d+)?)\s*([mbk])\b/.exec(clean);
  if (!m) return 0;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return 0;
  if (m[2] === 'b') return n * 1000;
  if (m[2] === 'k') return n / 1000;
  return n;
}

export interface MoneyBreakdownLine {
  label: string;
  millions: number;
}

/**
 * How much in-game money the owner has to /pay for an order:
 * money products + money lines inside bundles + money drops rolled in boxes.
 */
export function moneyBreakdown(order: Pick<Order, 'items'>): { total: number; lines: MoneyBreakdownLine[] } {
  const lines: MoneyBreakdownLine[] = [];
  for (const it of order.items) {
    if (it.kind === 'money') {
      const millions = (it.moneyMillions ?? moneyMillionsFromName(it.name)) * it.qty;
      if (millions > 0) lines.push({ label: `${it.qty}× ${it.name}`, millions });
      continue;
    }
    if (it.contents?.length) {
      for (const c of it.contents) {
        const m = moneyMillionsFromName(c.name) * (c.qty || 1) * it.qty;
        if (m > 0) lines.push({ label: `${it.name} → ${c.qty}× ${c.name}`, millions: m });
      }
    }
    if (it.rolled?.length) {
      it.rolled.forEach((box, i) => {
        for (const d of box) {
          const m = moneyMillionsFromName(d.name) * (d.qty || 1);
          if (m > 0) lines.push({ label: `${it.name} #${i + 1} → ${d.name}`, millions: m });
        }
      });
    }
  }
  return { total: lines.reduce((s, l) => s + l.millions, 0), lines };
}

export function millionsToPayAmount(millions: number): string {
  return String(Math.round(millions * 1_000_000));
}

export function formatMillionsLabel(millions: number): string {
  if (millions >= 1000) {
    const b = millions / 1000;
    return `${Number.isInteger(b) ? b : b.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}B`;
  }
  if (millions < 1) return `${Math.round(millions * 1000)}K`;
  return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`;
}

export function itemTitle(item: OrderItem): string {
  if (item.kind === 'money' && item.moneyMillions === 1 && item.qty > 1) return `${formatMillionsLabel(item.qty)} DonutSMP Money`;
  return item.name;
}

export function rarityClass(r: RolledContent['rarity']): string {
  return r ? `rarity-${r}` : 'rarity-common';
}

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

/** Env vars needed per integration (shown as hints – secrets never live in settings). */
export const INTEGRATION_ENV: Record<'stripe' | 'paypal' | 'nowpayments' | 'discord', { label: string; vars: string[] }> = {
  stripe: { label: 'Stripe (card / Apple Pay / Google Pay)', vars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] },
  paypal: { label: 'PayPal Checkout', vars: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_ENV'] },
  nowpayments: { label: 'NOWPayments (crypto)', vars: ['NOWPAYMENTS_API_KEY', 'NOWPAYMENTS_IPN_SECRET'] },
  discord: { label: 'Discord notifications', vars: ['DISCORD_WEBHOOK_URL'] },
};
