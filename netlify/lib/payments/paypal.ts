/**
 * PayPal Checkout (Orders API v2) – automatic confirmation via Smart Buttons.
 * Optional: needs PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET (PAYPAL_ENV live|sandbox).
 */
import type { Order } from '../../../src/shared/types';
import { HttpError } from '../http';
import { siteUrl } from '../discord';
import { ProviderError, fetchWithTimeout, itemsSummary, readBody, usdString } from './common';

export interface PayPalCapture {
  id?: string;
  status?: string;
  amount?: { currency_code?: string; value?: string };
}

export interface PayPalOrder {
  id: string;
  status: string;
  purchase_units?: {
    reference_id?: string;
    custom_id?: string;
    amount?: { currency_code?: string; value?: string };
    payments?: { captures?: PayPalCapture[] };
  }[];
}

interface PayPalErrorBody {
  name?: string;
  message?: string;
  details?: { issue?: string; description?: string }[];
}

export function paypalConfigured(): boolean {
  return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

export function paypalBase(): string {
  return (process.env.PAYPAL_ENV || 'live').trim().toLowerCase() === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
}

let tokenCache: { token: string; exp: number; key: string } | null = null;

async function accessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new HttpError(503, 'PayPal Checkout is not configured', 'not_configured');
  const cacheKey = `${paypalBase()}|${id}`;
  if (tokenCache && tokenCache.key === cacheKey && tokenCache.exp > Date.now() + 60_000) return tokenCache.token;

  const res = await fetchWithTimeout(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
    },
    body: 'grant_type=client_credentials',
  });
  const body = (await readBody(res)) as { access_token?: string; expires_in?: number } | null;
  if (!res.ok || !body?.access_token) throw new ProviderError('PayPal', 'PayPal is not accepting payments right now – please try again shortly.', { status: res.status, body });
  tokenCache = { token: body.access_token, exp: Date.now() + (body.expires_in ?? 300) * 1000, key: cacheKey };
  return body.access_token;
}

async function paypalRequest<T>(method: 'GET' | 'POST', path: string, payload?: unknown, headers: Record<string, string> = {}): Promise<{ status: number; body: T | PayPalErrorBody | null }> {
  const token = await accessToken();
  const res = await fetchWithTimeout(`${paypalBase()}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json', ...headers },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  return { status: res.status, body: (await readBody(res)) as T | PayPalErrorBody | null };
}

function issueOf(body: unknown): string | undefined {
  const b = body as PayPalErrorBody | null;
  return b?.details?.[0]?.issue;
}

/** Create a PayPal order (intent CAPTURE) for our order; returns the PayPal order id. */
export async function createPayPalOrder(order: Order, brandName: string): Promise<string> {
  const { status, body } = await paypalRequest<PayPalOrder>(
    'POST',
    '/v2/checkout/orders',
    {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: order.id,
          custom_id: order.id,
          description: `Order ${order.id} – ${itemsSummary(order, 80)}`.slice(0, 127),
          amount: { currency_code: 'USD', value: usdString(order.totalCents) },
        },
      ],
      application_context: {
        brand_name: brandName.slice(0, 127),
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: `${siteUrl()}/order/${order.id}?paid=1`,
        cancel_url: `${siteUrl()}/order/${order.id}`,
      },
    },
    { 'PayPal-Request-Id': `${order.id}-${order.totalCents}-${Date.now()}` },
  );
  const po = body as PayPalOrder | null;
  if ((status !== 201 && status !== 200) || !po?.id) {
    throw new ProviderError('PayPal', 'PayPal could not start the checkout – please try again or choose another payment method.', { status, body });
  }
  return po.id;
}

export async function getPayPalOrder(paypalOrderId: string): Promise<PayPalOrder> {
  const { status, body } = await paypalRequest<PayPalOrder>('GET', `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`);
  const po = body as PayPalOrder | null;
  if (status !== 200 || !po?.id) throw new ProviderError('PayPal', 'PayPal could not confirm the payment – if you were charged, contact us with your order ID.', { status, body });
  return po;
}

/**
 * Capture an approved PayPal order. If PayPal says it was already captured
 * (double click / retry) we fetch the order instead so the result is idempotent.
 */
export async function capturePayPalOrder(paypalOrderId: string): Promise<PayPalOrder> {
  const { status, body } = await paypalRequest<PayPalOrder>('POST', `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {}, { Prefer: 'return=representation' });
  if (status === 201 || status === 200) {
    const po = body as PayPalOrder | null;
    if (po?.id) return po;
  }
  if (status === 422 && issueOf(body) === 'ORDER_ALREADY_CAPTURED') return getPayPalOrder(paypalOrderId);
  const issue = issueOf(body);
  if (issue === 'INSTRUMENT_DECLINED') throw new HttpError(402, 'PayPal declined this payment method – please try a different card or funding source.', 'declined');
  if (issue === 'ORDER_NOT_APPROVED') throw new HttpError(400, 'The PayPal payment was not approved yet – please complete the PayPal window first.', 'not_approved');
  throw new ProviderError('PayPal', 'PayPal could not complete the payment – if you were charged, contact us with your order ID.', { status, body });
}

/** The completed capture of a PayPal order, if any. */
export function completedCapture(po: PayPalOrder): PayPalCapture | undefined {
  for (const unit of po.purchase_units ?? []) {
    for (const cap of unit.payments?.captures ?? []) {
      if (cap.status === 'COMPLETED') return cap;
    }
  }
  return undefined;
}

/** Any capture (pending / declined …) – used for status messages. */
export function anyCapture(po: PayPalOrder): PayPalCapture | undefined {
  return po.purchase_units?.[0]?.payments?.captures?.[0];
}
