/**
 * NOWPayments – hosted crypto invoices with automatic IPN confirmation.
 * Optional: needs NOWPAYMENTS_API_KEY (+ NOWPAYMENTS_IPN_SECRET for the IPN).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Order } from '../../../src/shared/types';
import { HttpError } from '../http';
import { siteUrl } from '../discord';
import { ProviderError, fetchWithTimeout, itemsSummary, readBody } from './common';

const API = 'https://api.nowpayments.io/v1';

export interface NowInvoice {
  id: string;
  invoice_url: string;
  order_id?: string;
  price_amount?: string | number;
  price_currency?: string;
}

/** Fields of an IPN callback we care about (the real payload has more). */
export interface NowIpn {
  payment_id?: number | string;
  invoice_id?: number | string;
  payment_status?: string;
  order_id?: string;
  price_amount?: number | string;
  price_currency?: string;
  pay_amount?: number | string;
  actually_paid?: number | string;
  pay_currency?: string;
  outcome_amount?: number | string;
  outcome_currency?: string;
}

/** IPN statuses that mean the money is in. */
export const NOW_PAID_STATUSES = new Set(['finished', 'confirmed']);

export function nowpaymentsConfigured(): boolean {
  return !!process.env.NOWPAYMENTS_API_KEY;
}

export async function createInvoice(order: Order, storeName: string): Promise<NowInvoice> {
  const key = process.env.NOWPAYMENTS_API_KEY;
  if (!key) throw new HttpError(503, 'NOWPayments is not configured', 'not_configured');
  const res = await fetchWithTimeout(`${API}/invoice`, {
    method: 'POST',
    headers: { 'x-api-key': key, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      price_amount: Number((order.totalCents / 100).toFixed(2)),
      price_currency: 'usd',
      order_id: order.id,
      order_description: `${storeName} order ${order.id} – ${itemsSummary(order, 80)}`.slice(0, 200),
      ipn_callback_url: `${siteUrl()}/api/payments/nowpayments/ipn`,
      success_url: `${siteUrl()}/order/${order.id}`,
      cancel_url: `${siteUrl()}/order/${order.id}`,
      is_fixed_rate: true,
      is_fee_paid_by_user: false,
    }),
  });
  const body = (await readBody(res)) as Partial<NowInvoice> & { message?: string } | null;
  if (!res.ok || !body?.invoice_url || !body.id) {
    const msg = typeof body?.message === 'string' && /minim/i.test(body.message)
      ? 'This amount is below the minimum for a crypto invoice – add something to your order or pick another payment method.'
      : 'The crypto payment page could not be created – please try again or choose another payment method.';
    throw new ProviderError('NOWPayments', msg, { status: res.status, body });
  }
  return { id: String(body.id), invoice_url: body.invoice_url, order_id: body.order_id, price_amount: body.price_amount, price_currency: body.price_currency };
}

/** Recursively sort object keys (NOWPayments signs the key-sorted JSON). */
export function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(src).sort()) out[k] = sortKeys(src[k]);
    return out;
  }
  return value;
}

function hmac(secret: string, payload: string): string {
  return createHmac('sha512', secret).update(payload).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a.toLowerCase(), 'utf8');
  const bb = Buffer.from(b.toLowerCase(), 'utf8');
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/**
 * Verify the `x-nowpayments-sig` header: HMAC-SHA512 over the key-sorted JSON
 * body. We accept both the recursive sort and the exact serialisation from the
 * official sample (`JSON.stringify(body, Object.keys(body).sort())`) – they are
 * identical for the flat IPN payloads but this keeps us safe if NOWPayments
 * ever nests fields.
 */
export function verifyIpnSignature(body: unknown, signature: string | null, secret = process.env.NOWPAYMENTS_IPN_SECRET): boolean {
  if (!secret || !signature || !body || typeof body !== 'object') return false;
  const sig = signature.trim();
  if (!/^[0-9a-f]{128}$/i.test(sig)) return false;
  const candidates = [JSON.stringify(sortKeys(body)), JSON.stringify(body, Object.keys(body as object).sort())];
  return candidates.some((payload) => safeEqualHex(hmac(secret, payload), sig));
}

/** Sign a payload the way NOWPayments does (used by tests and local tooling). */
export function signIpn(body: unknown, secret: string): string {
  return hmac(secret, JSON.stringify(sortKeys(body)));
}

function num(v: number | string | undefined | null): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

/**
 * Sanity check that a "finished|confirmed" IPN really covers the order:
 *  - the invoice price must match our total (±1 cent, USD)
 *  - when NOWPayments reports what was actually paid, it must be at least
 *    ~98% of the requested amount (dust/fee rounding tolerance)
 */
export function ipnCoversOrder(ipn: NowIpn, totalCents: number): { ok: boolean; reason?: string } {
  const price = num(ipn.price_amount);
  if (price === null || Math.abs(Math.round(price * 100) - totalCents) > 1) return { ok: false, reason: `price_amount ${ipn.price_amount ?? '?'} does not match order total ${(totalCents / 100).toFixed(2)}` };
  if (ipn.price_currency && ipn.price_currency.toLowerCase() !== 'usd') return { ok: false, reason: `unexpected price_currency ${ipn.price_currency}` };
  const expected = num(ipn.pay_amount);
  const paid = num(ipn.actually_paid);
  if (expected !== null && paid !== null && expected > 0 && paid < expected * 0.98) {
    return { ok: false, reason: `actually_paid ${paid} is below pay_amount ${expected}` };
  }
  return { ok: true };
}
