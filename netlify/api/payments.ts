/**
 * Optional payment integrations – all env-driven. Manual methods (PayPal.me,
 * crypto addresses …) never touch these routes.
 *
 *  Stripe       POST /payments/stripe/session · POST /payments/stripe/webhook · GET /payments/stripe/verify
 *  PayPal       POST /payments/paypal/create  · POST /payments/paypal/capture
 *  NOWPayments  POST /payments/nowpayments/invoice · POST /payments/nowpayments/ipn
 */
import type Stripe from 'stripe';
import type { Order } from '../../src/shared/types';
import type { Route } from '../lib/http';
import { HttpError, getIp, hashIp, json, readJson, requireString } from '../lib/http';
import { rateLimit } from '../lib/ratelimit';
import { getOrder, pushTimeline, saveOrder, toPublicOrder } from '../lib/orders';
import { getSettings } from '../lib/settings';
import { COLORS, notifyDiscord, siteUrl } from '../lib/discord';
import { PAID_STATUSES, amountMatches, attachProvider, loadPayableOrder, markPaid, toHttpError } from '../lib/payments/common';
import { constructWebhookEvent, createCheckoutSession, retrieveSession, sessionOrderId, stripeConfigured } from '../lib/payments/stripe';
import { anyCapture, capturePayPalOrder, completedCapture, createPayPalOrder, paypalConfigured } from '../lib/payments/paypal';
import { NOW_PAID_STATUSES, createInvoice, ipnCoversOrder, nowpaymentsConfigured, verifyIpnSignature, type NowIpn } from '../lib/payments/nowpayments';

const ORDER_ID_MAX = 24;

function orderIdFrom(v: unknown): string {
  return requireString(v, 'orderId', { min: 3, max: ORDER_ID_MAX }).toUpperCase();
}

async function limitPaymentStarts(req: Request, context: Parameters<Route['handler']>[0]['context']): Promise<void> {
  await rateLimit(`pay:${hashIp(getIp(req, context))}`, 20, 600);
}

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Flag an order whose payment needs a human look (amount mismatch etc.) without marking it paid. */
async function flagForReview(order: Order, provider: string, reason: string): Promise<void> {
  if (PAID_STATUSES.has(order.status)) return;
  order.payment.status = 'pending_review';
  pushTimeline(order, 'note', `${provider}: ${reason} – please review manually`);
  await saveOrder(order);
  await notifyDiscord({
    title: `⚠️ ${provider} payment needs review · ${order.id}`,
    color: COLORS.red,
    url: `${siteUrl()}/admin/orders/${order.id}`,
    description: reason,
    fields: [
      { name: 'Player', value: `\`${order.username}\``, inline: true },
      { name: 'Order total', value: usd(order.totalCents), inline: true },
    ],
  });
}

/** Add a timeline note unless the previous entry already says the same thing (IPN retries). */
async function noteOnce(order: Order, status: 'note' | 'payment_pending', note: string): Promise<void> {
  const last = order.timeline[order.timeline.length - 1];
  if (last && last.note === note) return;
  pushTimeline(order, status, note);
  await saveOrder(order);
}

/** Shared by the webhook and the verify fallback: mark the order paid when Stripe says so. */
async function settleStripeSession(session: Stripe.Checkout.Session): Promise<{ paid: boolean; order?: Order }> {
  const orderId = sessionOrderId(session);
  if (!orderId) return { paid: false };
  const order = await getOrder(orderId);
  if (!order) {
    console.warn('[payments:stripe] session for unknown order', orderId, session.id);
    return { paid: false };
  }
  if (PAID_STATUSES.has(order.status)) return { paid: true, order };
  if (session.payment_status !== 'paid') return { paid: false, order };
  if (typeof session.amount_total === 'number' && session.amount_total !== order.totalCents) {
    await flagForReview(order, 'Stripe', `Stripe charged ${usd(session.amount_total)} but the order total is ${usd(order.totalCents)} (session ${session.id})`);
    return { paid: false, order };
  }
  const intent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  await markPaid(order, `Stripe payment confirmed (${session.id})`, { providerId: session.id, reference: intent });
  return { paid: true, order };
}

export const routes: Route[] = [
  // ───────────── Stripe ─────────────
  {
    method: 'POST',
    path: '/payments/stripe/session',
    handler: async ({ req, context }) => {
      if (!stripeConfigured()) throw new HttpError(503, 'Stripe is not configured', 'not_configured');
      const body = await readJson<{ orderId?: unknown }>(req);
      const id = orderIdFrom(body.orderId);
      await limitPaymentStarts(req, context);
      const order = await loadPayableOrder(id, 'stripe', 'Stripe');
      try {
        const session = await createCheckoutSession(order);
        if (!session.url) throw new HttpError(502, 'Stripe did not return a checkout link – please try again.', 'provider_error');
        if (order.payment.providerId !== session.id) await attachProvider(order, session.id, session.url, 'Stripe Checkout started');
        return json({ url: session.url, sessionId: session.id });
      } catch (err) {
        throw toHttpError(err, 'Stripe');
      }
    },
  },
  {
    method: 'POST',
    path: '/payments/stripe/webhook',
    handler: async ({ req }) => {
      if (!stripeConfigured()) throw new HttpError(503, 'Stripe is not configured', 'not_configured');
      const raw = await req.text();
      const event = constructWebhookEvent(raw, req.headers.get('stripe-signature'));
      if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
        const session = event.data.object as Stripe.Checkout.Session;
        const result = await settleStripeSession(session);
        return json({ received: true, paid: result.paid });
      }
      return json({ received: true, ignored: event.type });
    },
  },
  {
    method: 'GET',
    path: '/payments/stripe/verify',
    handler: async ({ req, context, url }) => {
      const id = orderIdFrom(url.searchParams.get('orderId'));
      await rateLimit(`verify:${hashIp(getIp(req, context))}`, 30, 60);
      const order = await getOrder(id);
      if (!order) throw new HttpError(404, 'Order not found.', 'not_found');
      if (PAID_STATUSES.has(order.status)) return json({ paid: true, status: order.status });
      if (order.payment.type !== 'stripe' || !order.payment.providerId) return json({ paid: false, status: order.status });
      if (!stripeConfigured()) throw new HttpError(503, 'Stripe is not configured', 'not_configured');
      try {
        const session = await retrieveSession(order.payment.providerId);
        const result = await settleStripeSession(session);
        return json({ paid: result.paid, status: result.order?.status ?? order.status, sessionStatus: session.payment_status });
      } catch (err) {
        throw toHttpError(err, 'Stripe');
      }
    },
  },

  // ───────────── PayPal Checkout ─────────────
  {
    method: 'POST',
    path: '/payments/paypal/create',
    handler: async ({ req, context }) => {
      if (!paypalConfigured()) throw new HttpError(503, 'PayPal Checkout is not configured', 'not_configured');
      const body = await readJson<{ orderId?: unknown }>(req);
      const id = orderIdFrom(body.orderId);
      await limitPaymentStarts(req, context);
      const order = await loadPayableOrder(id, 'paypal', 'PayPal Checkout');
      try {
        const settings = await getSettings();
        const paypalOrderId = await createPayPalOrder(order, settings.storeName);
        await attachProvider(order, paypalOrderId, undefined, 'PayPal Checkout started');
        return json({ paypalOrderId });
      } catch (err) {
        throw toHttpError(err, 'PayPal');
      }
    },
  },
  {
    method: 'POST',
    path: '/payments/paypal/capture',
    handler: async ({ req, context }) => {
      if (!paypalConfigured()) throw new HttpError(503, 'PayPal Checkout is not configured', 'not_configured');
      const body = await readJson<{ orderId?: unknown; paypalOrderId?: unknown }>(req);
      const id = orderIdFrom(body.orderId);
      const paypalOrderId = requireString(body.paypalOrderId, 'paypalOrderId', { min: 3, max: 64 });
      await rateLimit(`capture:${hashIp(getIp(req, context))}`, 30, 600);

      const order = await getOrder(id);
      if (!order) throw new HttpError(404, 'Order not found.', 'not_found');
      if (PAID_STATUSES.has(order.status)) return json({ status: 'COMPLETED', paid: true, order: toPublicOrder(order) });
      if (order.payment.type !== 'paypal') throw new HttpError(400, `This order was placed with ${order.payment.methodName} – it cannot be captured through PayPal Checkout.`, 'wrong_method');
      if (order.status === 'refunded') throw new HttpError(409, 'This order was refunded.', 'refunded');

      let po;
      try {
        po = await capturePayPalOrder(paypalOrderId);
      } catch (err) {
        throw toHttpError(err, 'PayPal');
      }
      const unit = po.purchase_units?.[0];
      const belongs = order.payment.providerId === po.id || unit?.reference_id === order.id || unit?.custom_id === order.id;
      if (!belongs) throw new HttpError(400, 'This PayPal payment does not belong to this order.', 'mismatch');

      const capture = completedCapture(po);
      if (po.status === 'COMPLETED' && capture) {
        if (capture.amount?.currency_code !== 'USD' || !amountMatches(capture.amount.value, order.totalCents)) {
          await flagForReview(order, 'PayPal', `captured ${capture.amount?.value ?? '?'} ${capture.amount?.currency_code ?? ''} but the order total is ${usd(order.totalCents)} (PayPal order ${po.id})`);
          throw new HttpError(409, 'The captured amount does not match the order total – please contact us on Discord with your order ID.', 'amount_mismatch');
        }
        await markPaid(order, `PayPal payment captured (${capture.id ?? po.id})`, { providerId: po.id, reference: capture.id });
        return json({ status: 'COMPLETED', paid: true, order: toPublicOrder(order) });
      }

      // approved but not completed yet (e.g. PENDING review on PayPal's side)
      const pending = anyCapture(po);
      order.payment.providerId = po.id;
      order.payment.reference = pending?.id ?? order.payment.reference;
      order.payment.status = 'pending_review';
      pushTimeline(order, 'payment_pending', `PayPal capture ${pending?.status ?? po.status} – waiting for PayPal to clear it`);
      await saveOrder(order);
      return json({ status: pending?.status ?? po.status, paid: false, order: toPublicOrder(order) });
    },
  },

  // ───────────── NOWPayments (crypto) ─────────────
  {
    method: 'POST',
    path: '/payments/nowpayments/invoice',
    handler: async ({ req, context }) => {
      if (!nowpaymentsConfigured()) throw new HttpError(503, 'NOWPayments is not configured', 'not_configured');
      const body = await readJson<{ orderId?: unknown }>(req);
      const id = orderIdFrom(body.orderId);
      await limitPaymentStarts(req, context);
      const order = await loadPayableOrder(id, 'nowpayments', 'NOWPayments');
      if (order.payment.providerId && order.payment.providerUrl) return json({ url: order.payment.providerUrl, invoiceId: order.payment.providerId });
      try {
        const settings = await getSettings();
        const invoice = await createInvoice(order, settings.storeName);
        await attachProvider(order, invoice.id, invoice.invoice_url, 'NOWPayments invoice created');
        return json({ url: invoice.invoice_url, invoiceId: invoice.id });
      } catch (err) {
        throw toHttpError(err, 'NOWPayments');
      }
    },
  },
  {
    method: 'POST',
    path: '/payments/nowpayments/ipn',
    handler: async ({ req }) => {
      if (!process.env.NOWPAYMENTS_IPN_SECRET) throw new HttpError(503, 'NOWPayments IPN is not configured (set NOWPAYMENTS_IPN_SECRET)', 'not_configured');
      const raw = await req.text();
      let ipn: NowIpn;
      try {
        ipn = JSON.parse(raw) as NowIpn;
      } catch {
        throw new HttpError(400, 'Invalid JSON body', 'bad_json');
      }
      if (!verifyIpnSignature(ipn, req.headers.get('x-nowpayments-sig'))) throw new HttpError(401, 'Invalid IPN signature', 'bad_signature');

      const status = String(ipn.payment_status ?? '').toLowerCase();
      const order = typeof ipn.order_id === 'string' ? await getOrder(ipn.order_id) : null;
      if (!order) return json({ ok: true, ignored: 'unknown order' });
      if (order.payment.type !== 'nowpayments') return json({ ok: true, ignored: 'order does not use NOWPayments' });
      const payCur = String(ipn.pay_currency ?? '').toUpperCase();

      if (NOW_PAID_STATUSES.has(status)) {
        if (PAID_STATUSES.has(order.status)) return json({ ok: true, paid: true });
        const check = ipnCoversOrder(ipn, order.totalCents);
        if (!check.ok) {
          await flagForReview(order, 'NOWPayments', `payment ${status} but ${check.reason} (payment ${ipn.payment_id ?? '?'})`);
          return json({ ok: true, flagged: true });
        }
        const paid = ipn.actually_paid ?? ipn.pay_amount;
        await markPaid(order, `Crypto payment ${status} via NOWPayments${paid ? ` (${paid} ${payCur})` : ''}`, {
          providerId: ipn.invoice_id ? String(ipn.invoice_id) : undefined,
          reference: ipn.payment_id ? String(ipn.payment_id) : undefined,
        });
        return json({ ok: true, paid: true });
      }

      if (PAID_STATUSES.has(order.status)) return json({ ok: true });
      if (status === 'partially_paid') {
        await flagForReview(order, 'NOWPayments', `partially paid – ${ipn.actually_paid ?? '?'} of ${ipn.pay_amount ?? '?'} ${payCur} received`);
      } else if (status === 'failed' || status === 'expired' || status === 'refunded') {
        await noteOnce(order, 'note', `NOWPayments: payment ${status}`);
      } else if (status === 'waiting' || status === 'confirming' || status === 'sending') {
        await noteOnce(order, 'payment_pending', `NOWPayments: ${status}${payCur ? ` (${payCur})` : ''}`);
      }
      return json({ ok: true });
    },
  },
];
