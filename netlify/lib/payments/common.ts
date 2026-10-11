/**
 * Shared helpers for the payment provider integrations (Stripe, PayPal,
 * NOWPayments). Everything here is provider-agnostic: loading a payable
 * order, marking it paid exactly once, and talking to provider HTTP APIs
 * with a timeout and friendly error messages.
 */
import type { Order, OrderPayment } from '../../../src/shared/types';
import { HttpError } from '../http';
import { getOrder, pushTimeline, saveOrder, setOrderStatus } from '../orders';

/** Statuses that mean "money already arrived" – never charge or mark again. */
export const PAID_STATUSES = new Set<Order['status']>(['paid', 'delivering', 'delivered']);

/** Thrown when a provider API misbehaves – surfaced to the customer as a 502. */
export class ProviderError extends Error {
  provider: string;
  detail?: unknown;
  constructor(provider: string, message: string, detail?: unknown) {
    super(message);
    this.provider = provider;
    this.detail = detail;
  }
}

/** Translate anything a provider helper throws into an HttpError the router understands. */
export function toHttpError(err: unknown, provider: string): HttpError {
  if (err instanceof HttpError) return err;
  const msg = err instanceof ProviderError ? err.message : `${provider} is temporarily unavailable – please try again in a moment or choose another payment method.`;
  console.error(`[payments:${provider.toLowerCase()}]`, err instanceof ProviderError ? err.detail ?? err.message : err);
  return new HttpError(502, msg, 'provider_error');
}

/** `fetch` with an AbortController timeout (providers occasionally hang). */
export async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 15_000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Parse a JSON response body, tolerating empty / non-JSON bodies. */
export async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/**
 * Load an order that is about to be paid through `type` and make sure it is
 * actually payable (right provider, still awaiting payment, non-zero total).
 */
export async function loadPayableOrder(orderId: string, type: OrderPayment['type'], providerLabel: string): Promise<Order> {
  const order = await getOrder(orderId);
  if (!order) throw new HttpError(404, 'Order not found.', 'not_found');
  if (order.payment.type !== type) {
    throw new HttpError(400, `This order was placed with ${order.payment.methodName} – it cannot be paid through ${providerLabel}.`, 'wrong_method');
  }
  if (PAID_STATUSES.has(order.status)) throw new HttpError(409, 'This order is already paid.', 'already_paid');
  if (order.status === 'cancelled') throw new HttpError(409, 'This order was cancelled. Please place a new order.', 'cancelled');
  if (order.status === 'refunded') throw new HttpError(409, 'This order was refunded and cannot be paid again.', 'refunded');
  if (order.totalCents <= 0) throw new HttpError(400, 'This order has nothing to pay.', 'validation');
  return order;
}

/**
 * Mark an order as paid exactly once. Safe to call from webhooks, IPNs and
 * the "verify" fallback at the same time: an order that is already paid (or
 * further along) is left untouched. A cancelled order that receives money
 * anyway is revived and marked paid so the owner sees the payment and can
 * deliver or refund.
 */
export async function markPaid(order: Order, note: string, extra: Partial<Pick<OrderPayment, 'providerId' | 'providerUrl' | 'reference'>> = {}): Promise<{ order: Order; changed: boolean }> {
  if (PAID_STATUSES.has(order.status) || order.status === 'refunded') return { order, changed: false };
  if (extra.providerId) order.payment.providerId = extra.providerId;
  if (extra.providerUrl) order.payment.providerUrl = extra.providerUrl;
  if (extra.reference) order.payment.reference = extra.reference;
  const revived = order.status === 'cancelled';
  await setOrderStatus(order, 'paid', revived ? `${note} (payment arrived after cancellation – please deliver or refund)` : note);
  return { order, changed: true };
}

/** Remember the provider session/order on our order and log it on the timeline. */
export async function attachProvider(order: Order, providerId: string, providerUrl: string | undefined, note: string): Promise<void> {
  order.payment.providerId = providerId;
  if (providerUrl) order.payment.providerUrl = providerUrl;
  pushTimeline(order, 'payment_pending', note);
  await saveOrder(order);
}

/** "2× Skeleton Spawner, 1× Elytra" – short enough for provider product names. */
export function itemsSummary(order: Order, max = 90): string {
  const s = order.items.map((i) => `${i.qty}× ${i.name}`).join(', ');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function usdString(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Compare a provider-reported decimal amount with our cents total (tolerates float formatting). */
export function amountMatches(value: string | number | undefined | null, cents: number): boolean {
  if (value === undefined || value === null) return false;
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(n)) return false;
  return Math.round(n * 100) === cents;
}
