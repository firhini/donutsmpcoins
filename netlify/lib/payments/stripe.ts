/**
 * Stripe Checkout (card / Apple Pay / Google Pay). Optional – only active
 * when STRIPE_SECRET_KEY is set. Webhook verification needs STRIPE_WEBHOOK_SECRET.
 */
import Stripe from 'stripe';
import type { Order } from '../../../src/shared/types';
import { HttpError } from '../http';
import { siteUrl } from '../discord';
import { ProviderError, itemsSummary } from './common';

/**
 * Smallest card order. Stripe's floor is 0.50 in the account's settlement currency (EUR here),
 * so $0.50–0.54 is converted below €0.50 and refused – 60¢ leaves room for exchange-rate swings.
 */
export const STRIPE_MIN_CENTS = 60;

/** Euro-area countries: buyers there get a EUR checkout, which unlocks Klarna, EPS, Bancontact, Revolut Pay & co. */
export const EURO_COUNTRIES = new Set(['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK']);

export interface ChargeCurrency {
  /** lowercase ISO code Stripe charges in */
  currency: 'usd' | 'eur';
  /** amount in the smallest unit of that currency */
  amount: number;
}

/**
 * What a Checkout Session charges for an order. Prices live in USD; European buyers (EUR picked in the
 * currency switcher, or a euro-area country) are charged the EUR equivalent at the admin's EUR rate,
 * because Stripe only offers local methods like Klarna, EPS or Bancontact for EUR payments.
 */
export function chargeFor(order: Pick<Order, 'totalCents' | 'displayCurrency'>, opts: { country?: string; eurRate?: number }): ChargeCurrency {
  const rate = opts.eurRate ?? 0;
  const wantsEur = order.displayCurrency === 'EUR' || (!!opts.country && EURO_COUNTRIES.has(opts.country.toUpperCase()) && (!order.displayCurrency || order.displayCurrency === 'USD'));
  if (wantsEur && rate > 0.5 && rate < 2) {
    const amount = Math.round(order.totalCents * rate);
    if (amount >= 50) return { currency: 'eur', amount };
  }
  return { currency: 'usd', amount: order.totalCents };
}

let client: Stripe | null = null;
let clientKey = '';

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/** Lazily constructed Stripe client (re-created if the key changes, e.g. in tests). */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new HttpError(503, 'Stripe is not configured', 'not_configured');
  if (!client || clientKey !== key) {
    client = new Stripe(key, { timeout: 20_000, maxNetworkRetries: 1 });
    clientKey = key;
  }
  return client;
}

/**
 * Create (or re-use) a Checkout Session for an order. If the order already has
 * an open session with the same amount we hand that one back instead of
 * creating a new one every time the customer clicks "Pay now".
 */
export async function createCheckoutSession(order: Order, charge: ChargeCurrency = { currency: 'usd', amount: order.totalCents }): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  if (order.totalCents < STRIPE_MIN_CENTS) {
    throw new HttpError(400, `Card payments need a minimum of $${(STRIPE_MIN_CENTS / 100).toFixed(2)} – please pick another payment method.`, 'validation');
  }
  try {
    if (order.payment.providerId?.startsWith('cs_')) {
      const existing = await stripe.checkout.sessions.retrieve(order.payment.providerId);
      if (existing.status === 'open' && existing.url && existing.currency === charge.currency && existing.amount_total === charge.amount && existing.metadata?.usdCents === String(order.totalCents)) return existing;
    }
  } catch (err) {
    // a stale/invalid session id must not block a fresh checkout
    console.warn('[payments:stripe] could not reuse session', (err as Error).message);
  }

  try {
    return await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: charge.currency,
            product_data: { name: `Order ${order.id} – ${itemsSummary(order)}` },
            unit_amount: charge.amount,
          },
          quantity: 1,
        },
      ],
      // usdCents ties the session to the order total; chargeCents is what this session must collect
      metadata: { orderId: order.id, username: order.username, usdCents: String(order.totalCents), chargeCurrency: charge.currency, chargeCents: String(charge.amount) },
      client_reference_id: order.id,
      success_url: `${siteUrl()}/order/${order.id}?paid=1`,
      cancel_url: `${siteUrl()}/order/${order.id}`,
      customer_email: order.email || undefined,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 2, // 2h – long enough, not forever
    });
  } catch (err) {
    throw new ProviderError('Stripe', 'Stripe could not start the checkout – please try again or choose another payment method.', err);
  }
}

export async function retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  try {
    return await getStripe().checkout.sessions.retrieve(sessionId);
  } catch (err) {
    throw new ProviderError('Stripe', 'Stripe could not confirm the payment yet – if you were charged, it will be confirmed shortly.', err);
  }
}

/** Verify a webhook payload. Throws HttpError(400) on a bad signature. */
export function constructWebhookEvent(rawBody: string, signature: string | null): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new HttpError(503, 'Stripe webhook is not configured (set STRIPE_WEBHOOK_SECRET)', 'not_configured');
  if (!signature) throw new HttpError(400, 'Missing stripe-signature header', 'bad_signature');
  try {
    return getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    throw new HttpError(400, `Webhook signature verification failed: ${(err as Error).message}`, 'bad_signature');
  }
}

/**
 * Does a paid session cover the order? USD sessions must match the total exactly; EUR sessions must
 * collect the amount we asked for when we created them for this exact order total.
 */
export function sessionCoversOrder(session: Pick<Stripe.Checkout.Session, 'amount_total' | 'currency' | 'metadata'>, order: Pick<Order, 'totalCents'>): boolean {
  if (typeof session.amount_total !== 'number') return true; // older API objects without amounts: trust payment_status
  const cur = (session.currency ?? 'usd').toLowerCase();
  if (cur === 'usd') return session.amount_total === order.totalCents;
  return session.metadata?.chargeCurrency === cur && session.metadata?.usdCents === String(order.totalCents) && session.metadata?.chargeCents === String(session.amount_total);
}

/** Our order id from a Checkout Session (metadata first, client_reference_id as fallback). */
export function sessionOrderId(session: Stripe.Checkout.Session): string | null {
  return session.metadata?.orderId || session.client_reference_id || null;
}
