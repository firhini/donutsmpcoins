/**
 * Public order routes: quote, create, view, report payment, cancel.
 * Prices are ALWAYS recomputed on the server (lib/orderBuilder) – the client
 * only sends product ids and quantities.
 */
import { z } from 'zod';
import type { Order } from '../../src/shared/types';
import type { Route } from '../lib/http';
import { currentUser } from './auth';
import { linkOrder, updateUser } from '../lib/users';
import { HttpError, MC_USERNAME_RE, getIp, hashIp, json, optionalString, readJson, requireString } from '../lib/http';
import { rateLimit } from '../lib/ratelimit';
import { buildOrder, serverQuote } from '../lib/orderBuilder';
import { expireUnpaidOrdersThrottled, getOrder, pushTimeline, saveOrder, setOrderStatus, toPublicOrder } from '../lib/orders';
import { addCredit } from '../lib/credit';
import { COLORS, notifyDiscord, siteUrl } from '../lib/discord';
import { PAID_STATUSES } from '../lib/payments/common';
import { getStripe, stripeConfigured } from '../lib/payments/stripe';
import { integrations } from '../lib/settings';

// ───────────── validation ─────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Optional trimmed string: '', null and undefined all become undefined. */
const optionalText = (max: number) =>
  z.preprocess((v) => (v === null || v === undefined || (typeof v === 'string' && !v.trim()) ? undefined : v), z.string().trim().max(max).optional());

const lineSchema = z.object({
  productId: z.string().trim().min(1, 'Product id is required.').max(80, 'Product id is too long.'),
  qty: z.number('Quantity must be a number.').int('Quantity must be a whole number.').min(1, 'Quantity must be at least 1.').max(100_000, 'Quantity is too large.'),
});

const quoteSchema = z.object({
  items: z.array(lineSchema).max(20, 'Too many different items in one order (max 20).').default([]),
  discountCode: optionalText(40),
  referralCode: optionalText(16),
  username: optionalText(16),
  applyCredit: z.boolean().optional(),
});

const createOrderSchema = z.object({
  username: z.string('Please enter your Minecraft username.').trim().regex(MC_USERNAME_RE, 'Minecraft usernames are 3–16 letters, numbers or underscores.'),
  email: optionalText(120),
  items: z.array(lineSchema, 'Your cart is empty.').min(1, 'Your cart is empty.').max(20, 'Too many different items in one order (max 20).'),
  discountCode: optionalText(40),
  referralCode: optionalText(16),
  applyCredit: z.boolean().optional(),
  paymentMethodId: optionalText(60),
  displayCurrency: optionalText(8),
  tosAccepted: z.boolean().optional(),
  customerNote: optionalText(500),
  deviceId: optionalText(80),
});

const FIELD_LABELS: Record<string, string> = {
  username: 'Minecraft username',
  email: 'E-mail',
  items: 'Cart',
  discountCode: 'Discount code',
  referralCode: 'Referral code',
  paymentMethodId: 'Payment method',
  customerNote: 'Note',
  displayCurrency: 'Currency',
  deviceId: 'Device id',
  qty: 'Quantity',
  productId: 'Product',
};

/** Parse with zod and turn the first problem into a friendly 400. */
function parse<S extends z.ZodType>(schema: S, body: unknown): z.infer<S> {
  const result = schema.safeParse(body ?? {});
  if (result.success) return result.data;
  const issues = result.error.issues.map((i) => ({ path: i.path.map(String).join('.'), message: i.message }));
  const first = issues[0];
  const field = first?.path.split('.').find((seg) => Number.isNaN(Number(seg))) ?? '';
  const label = FIELD_LABELS[field];
  const custom = first?.message && !/^Invalid input/i.test(first.message);
  const message = custom ? first.message : label ? `${label} is invalid.` : 'Invalid request.';
  throw new HttpError(400, message, 'validation', issues);
}

/** Best effort: expire an open Stripe Checkout Session when the customer cancels. */
async function expireStripeSession(order: Order): Promise<void> {
  const id = order.payment.providerId;
  if (order.payment.type !== 'stripe' || !id?.startsWith('cs_') || !stripeConfigured()) return;
  try {
    await getStripe().checkout.sessions.expire(id);
  } catch (err) {
    console.warn('[orders] could not expire Stripe session', (err as Error).message);
  }
}

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ───────────── routes ─────────────

export const routes: Route[] = [
  {
    method: 'POST',
    path: '/quote',
    handler: async ({ req, context }) => {
      const body = parse(quoteSchema, await readJson(req));
      // generous, but stops coupon brute-forcing through the quote endpoint
      await rateLimit(`quote:${hashIp(getIp(req, context))}`, 60, 60);
      const { quote } = await serverQuote(body);
      return json(quote);
    },
  },

  {
    method: 'POST',
    path: '/orders',
    handler: async ({ req, context }) => {
      const body = parse(createOrderSchema, await readJson(req));
      if (body.tosAccepted !== true) throw new HttpError(400, 'Please accept the Terms of Service to continue.', 'tos_required');
      if (body.email && !EMAIL_RE.test(body.email)) throw new HttpError(400, 'That e-mail address does not look right.', 'validation');

      const ipHash = hashIp(getIp(req, context));
      const user = await currentUser(req);
      await rateLimit(`orders:${ipHash}`, 10, 600);
      // Store credit belongs to a Minecraft name. When Discord login is available, only the
      // player who proved that name (Account → Minecraft username) may spend it – otherwise
      // anyone could burn another player's credit by ordering under their name.
      if (body.applyCredit && integrations().login) {
        const owner = user?.mcUsername && user.mcUsername.toLowerCase() === body.username.toLowerCase();
        if (!owner) throw new HttpError(401, 'Log in and set this Minecraft username on your account to use store credit.', 'credit_login_required');
      }
      void expireUnpaidOrdersThrottled();

      const order = await buildOrder({
        username: body.username,
        email: body.email,
        items: body.items,
        discountCode: body.discountCode,
        referralCode: body.referralCode,
        applyCredit: body.applyCredit,
        paymentMethodId: body.paymentMethodId,
        displayCurrency: body.displayCurrency?.toUpperCase(),
        customerNote: body.customerNote,
        deviceId: body.deviceId,
        ipHash,
        source: 'checkout',
        discordUserId: user && user.provider !== 'google' ? user.id : undefined,
        discordUsername: user && user.provider !== 'google' ? user.username : undefined,
      });
      if (user) {
        await linkOrder(user.id, order.id).catch(() => undefined);
        if (!user.mcUsername) await updateUser(user.id, { mcUsername: order.username }).catch(() => undefined);
      }
      return json({ order: toPublicOrder(order) }, 201);
    },
  },

  {
    method: 'GET',
    path: '/orders/:id',
    handler: async ({ req, context, params }) => {
      await rateLimit(`order-view:${hashIp(getIp(req, context))}`, 60, 60);
      const order = await getOrder(params.id);
      if (!order) throw new HttpError(404, 'Order not found – check the ID (it looks like DC-XXXXXX).', 'not_found');
      return json({ order: toPublicOrder(order) });
    },
  },

  {
    method: 'POST',
    path: '/orders/:id/reference',
    handler: async ({ req, context, params }) => {
      const body = await readJson<{ reference?: unknown; note?: unknown }>(req);
      const reference = requireString(body.reference, 'Payment reference', { min: 3, max: 200 });
      const note = optionalString(body.note, 'Note', 300);
      await rateLimit(`reference:${hashIp(getIp(req, context))}`, 20, 600);

      const order = await getOrder(params.id);
      if (!order) throw new HttpError(404, 'Order not found.', 'not_found');
      if (PAID_STATUSES.has(order.status)) throw new HttpError(409, 'This order is already marked as paid.', 'already_paid');
      if (order.status !== 'awaiting_payment') throw new HttpError(409, 'This order is closed – a payment can no longer be reported for it.', 'closed');

      const changed = order.payment.reference && order.payment.reference !== reference;
      order.payment.status = 'pending_review';
      order.payment.reference = reference;
      order.payment.referenceNote = note;
      pushTimeline(order, 'payment_reference', `${changed ? 'Payment reference updated' : 'Payment reported'} · ${reference}${note ? ` (${note})` : ''}`);
      await saveOrder(order);

      await notifyDiscord({
        title: `💳 Payment reported · ${order.id}`,
        color: COLORS.gold,
        url: `${siteUrl()}/admin/orders/${order.id}`,
        description: changed ? 'The customer sent a **different** reference than before – re-check the payment.' : undefined,
        fields: [
          { name: 'Player', value: `\`${order.username}\``, inline: true },
          { name: 'Total', value: usd(order.totalCents), inline: true },
          { name: 'Method', value: order.payment.methodName, inline: true },
          { name: 'Reference', value: `\`${reference.slice(0, 200)}\`` },
          ...(note ? [{ name: 'Customer note', value: note.slice(0, 300) }] : []),
          { name: 'Items', value: order.items.map((i) => `• ${i.qty}× ${i.name}`).join('\n').slice(0, 1000) || '—' },
        ],
        footer: { text: 'Check the payment, then mark the order as paid in the admin panel.' },
      });

      return json({ order: toPublicOrder(order) });
    },
  },

  {
    method: 'POST',
    path: '/orders/:id/cancel',
    handler: async ({ req, context, params }) => {
      await rateLimit(`cancel:${hashIp(getIp(req, context))}`, 20, 600);
      const order = await getOrder(params.id);
      if (!order) throw new HttpError(404, 'Order not found.', 'not_found');
      if (order.status === 'cancelled') throw new HttpError(409, 'This order is already cancelled.', 'already_cancelled');
      if (PAID_STATUSES.has(order.status)) throw new HttpError(409, 'Paid orders cannot be cancelled here – message us on Discord and we will sort it out.', 'already_paid');
      if (order.status !== 'awaiting_payment') throw new HttpError(409, 'This order can no longer be cancelled.', 'closed');
      if (order.payment.status === 'pending_review') {
        throw new HttpError(409, 'You already reported a payment for this order – please contact us on Discord so nothing gets lost.', 'pending_review');
      }

      await expireStripeSession(order);
      await setOrderStatus(order, 'cancelled', 'Cancelled by customer');
      return json({ order: toPublicOrder(order) });
    },
  },
];
