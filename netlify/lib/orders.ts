import type { Order, OrderIndexEntry, OrderStatus, PublicOrder, TimelineEntry } from '../../src/shared/types';
import { kvGet, kvSet, kvUpdate } from './store';
import { nowIso } from './http';
import { COLORS, notifyDiscord, siteUrl } from './discord';
import { addCredit, debitCredit } from './credit';
import { restoreStock, decrementStock } from './catalog';
import { consumeCoupon, unconsumeCoupon } from './coupons';
import { HttpError } from './http';
import { getSettings } from './settings';

const INDEX_KEY = '_index';
const MAX_INDEX = 5000;

export async function getOrder(id: string): Promise<Order | null> {
  const key = id.trim().toUpperCase();
  if (!/^DC-[A-Z0-9]{6,10}$/.test(key)) return null;
  return kvGet<Order>('orders', key);
}

export async function saveOrder(order: Order): Promise<void> {
  order.updatedAt = nowIso();
  await kvSet('orders', order.id, order);
  await updateIndex(order);
}

export function toIndexEntry(o: Order): OrderIndexEntry {
  return {
    id: o.id,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    username: o.username,
    totalCents: o.totalCents,
    status: o.status,
    paymentStatus: o.payment.status,
    methodId: o.payment.methodId,
    referralCode: o.referralCode,
    discordUserId: o.discordUserId,
    itemsSummary: o.items.map((i) => `${i.qty}× ${i.name}`).join(', ').slice(0, 140),
  };
}

async function updateIndex(order: Order): Promise<void> {
  await kvUpdate<OrderIndexEntry[]>('orders', INDEX_KEY, (cur) => {
    const list = (cur ?? []).filter((e) => e.id !== order.id);
    list.unshift(toIndexEntry(order));
    return list.slice(0, MAX_INDEX);
  });
}

export async function listOrderIndex(): Promise<OrderIndexEntry[]> {
  return (await kvGet<OrderIndexEntry[]>('orders', INDEX_KEY)) ?? [];
}

/** Box results stay hidden until the order is paid – otherwise "order, peek, cancel, retry" turns the odds into best-of-N for free. */
const ROLLS_HIDDEN = new Set<OrderStatus>(['awaiting_payment', 'cancelled']);

export function toPublicOrder(o: Order): PublicOrder {
  // the order page is reachable by anyone who has the id – never expose who the buyer is on Discord
  const { ipHash, deviceId, adminNote, email, discordUserId, discordUsername, ...rest } = o;
  const items = ROLLS_HIDDEN.has(o.status) ? rest.items.map((i) => (i.rolled ? { ...i, rolled: undefined } : i)) : rest.items;
  return { ...rest, items, emailMasked: email ? maskEmail(email) : undefined };
}

function maskEmail(e: string): string {
  const [u, d] = e.split('@');
  if (!d) return '***';
  return `${u.slice(0, 2)}***@${d}`;
}

export function pushTimeline(o: Order, status: TimelineEntry['status'], note?: string): void {
  o.timeline.push({ at: nowIso(), status, note });
}

/**
 * Transition an order's status. Handles side effects:
 *  - paid: referral reward to referrer (once), Discord notification
 *  - delivered: Discord notification
 */
const PAID_LIKE = new Set<OrderStatus>(['paid', 'delivering', 'delivered']);
class NoTransition extends Error {}
/** The stored order moved on since the caller loaded it (e.g. cancelled while a webhook was in flight). */
export class StaleOrderError extends HttpError {
  constructor(public readonly fresh: Order) {
    super(409, 'The order changed meanwhile – reload and try again.', 'stale');
  }
}

export async function setOrderStatus(o: Order, status: OrderStatus, note?: string): Promise<Order> {
  if (o.status === status) return o;
  const from = o.status;
  const reviving = (from === 'cancelled' || from === 'refunded') && status !== 'cancelled' && status !== 'refunded';
  if (reviving) await reclaimOrder(o); // throws 409 when credit/stock are no longer available

  // Atomic transition on the STORED order: a concurrent webhook / verify / admin click cannot
  // apply the same transition twice, 'paid' can never be re-applied over delivering/delivered,
  // and a caller holding a stale copy (status changed since it was loaded) is rejected instead
  // of silently overwriting the newer state (which would e.g. revive a cancelled order whose
  // stock and credit were already given back).
  let stale: Order | null = null;
  try {
    await kvUpdate<Order>('orders', o.id, (cur) => {
      const stored = cur ?? o;
      if (stored.status === status) throw new NoTransition();
      if (status === 'paid' && PAID_LIKE.has(stored.status)) throw new NoTransition();
      if (cur && cur.status !== from) {
        stale = cur;
        throw new NoTransition();
      }
      // apply the transition to the fresh copy and mirror the result into the caller's object
      const next: Order = { ...stored, payment: { ...stored.payment }, timeline: [...stored.timeline] };
      next.status = status;
      if (status === 'paid') {
        next.payment.status = 'paid';
        next.payment.paidAt = next.payment.paidAt ?? o.payment.paidAt ?? nowIso();
      }
      if (status === 'refunded') next.payment.status = 'refunded';
      // bookkeeping flags set by the caller (reclaimOrder) or by another writer meanwhile
      next.stockRestored = o.stockRestored ?? stored.stockRestored;
      next.creditRestored = o.creditRestored ?? stored.creditRestored;
      next.couponRestored = o.couponRestored ?? stored.couponRestored;
      next.referralRewarded = o.referralRewarded || stored.referralRewarded;
      next.referralRewardCents = o.referralRewardCents ?? stored.referralRewardCents;
      next.reviewed = o.reviewed || stored.reviewed;
      if (o.payment.providerId) next.payment.providerId = o.payment.providerId;
      if (o.payment.providerUrl) next.payment.providerUrl = o.payment.providerUrl;
      if (o.payment.reference) next.payment.reference = o.payment.reference;
      pushTimeline(next, status, note);
      next.updatedAt = nowIso();
      Object.assign(o, next);
      return next;
    });
  } catch (err) {
    if (err instanceof NoTransition) {
      if (stale) {
        if (reviving) await releaseOrder(o).catch(() => undefined); // undo reclaimOrder
        Object.assign(o, stale);
        throw new StaleOrderError(stale);
      }
      const fresh = await getOrder(o.id);
      if (fresh) Object.assign(o, fresh);
      return fresh ?? o;
    }
    throw err;
  }
  await updateIndex(o);

  if (status === 'paid' && o.referralCode && !o.referralRewarded) {
    try {
      const settings = await getSettings();
      if (settings.referral.enabled && settings.referral.referrerPercent > 0 && o.referralCode.toLowerCase() !== o.username.toLowerCase()) {
        const reward = Math.round(((o.quote?.totalCents ?? o.totalCents) * settings.referral.referrerPercent) / 100);
        if (reward > 0) {
          await addCredit(o.referralCode, reward, `Referral reward (${o.username})`, o.id);
          o.referralRewarded = true;
          o.referralRewardCents = reward;
          await saveOrder(o);
        }
      }
    } catch (err) {
      console.warn('[orders] referral reward failed', err);
    }
  }

  if (status === 'cancelled' || status === 'refunded') {
    await releaseOrder(o);
  }
  if (status === 'delivered' && o.discordUserId) {
    // Discord bot: buyers get the Customer role (no-op when the bot is not set up)
    await import('./discordBot').then((m) => m.grantCustomerRole(o.discordUserId)).catch(() => undefined);
  }

  const label: Record<OrderStatus, string> = {
    awaiting_payment: '🕒 Awaiting payment',
    paid: '💸 PAID – deliver now',
    delivering: '🚚 Delivering',
    delivered: '✅ Delivered',
    cancelled: '❌ Cancelled',
    refunded: '↩️ Refunded',
  };
  if (status === 'paid' || status === 'delivered' || status === 'cancelled') {
    await notifyDiscord({
      title: `${label[status]} · ${o.id}`,
      color: status === 'paid' ? COLORS.green : status === 'delivered' ? COLORS.blue : COLORS.gray,
      url: `${siteUrl()}/admin/orders/${o.id}`,
      fields: [
        { name: 'Player', value: `\`${o.username}\``, inline: true },
        { name: 'Total', value: `$${(o.totalCents / 100).toFixed(2)}`, inline: true },
        { name: 'Payment', value: o.payment.methodName, inline: true },
        { name: 'Items', value: o.items.map((i) => `• ${i.qty}× ${i.name}`).join('\n').slice(0, 1000) || '—' },
      ],
    });
  }
  return o;
}

/**
 * Give everything back that an order reserved or granted: applied store
 * credit, reserved stock and the referrer's reward. Each part runs once
 * (flags on the order) so repeated cancel/refund transitions are harmless.
 */
export async function releaseOrder(o: Order): Promise<void> {
  let changed = false;
  if (o.creditAppliedCents > 0 && !o.creditRestored) {
    try {
      await addCredit(o.username, o.creditAppliedCents, `Order ${o.status} – credit returned`, o.id);
      o.creditRestored = true;
      pushTimeline(o, 'note', `$${(o.creditAppliedCents / 100).toFixed(2)} store credit returned to ${o.username}`);
      changed = true;
    } catch (err) {
      console.warn('[orders] credit restore failed', err);
    }
  }
  if (!o.stockRestored) {
    try {
      await restoreStock(o.items.map((i) => ({ productId: i.productId, qty: i.qty })));
      o.stockRestored = true;
      changed = true;
    } catch (err) {
      console.warn('[orders] stock restore failed', err);
    }
  }
  if (o.discountCode && o.payment.type !== 'free' && !o.couponRestored) {
    try {
      await unconsumeCoupon(o.discountCode);
      o.couponRestored = true;
      pushTimeline(o, 'note', `Coupon ${o.discountCode} is usable again`);
      changed = true;
    } catch (err) {
      console.warn('[orders] coupon restore failed', err);
    }
  }
  if (o.referralRewarded && o.referralCode && (o.referralRewardCents ?? 0) > 0) {
    try {
      await addCredit(o.referralCode, -(o.referralRewardCents ?? 0), `Referral reward reverted (order ${o.id} ${o.status})`, o.id);
      pushTimeline(o, 'note', `Referral reward of $${((o.referralRewardCents ?? 0) / 100).toFixed(2)} reverted from ${o.referralCode}`);
      o.referralRewarded = false;
      o.referralRewardCents = 0;
      changed = true;
    } catch (err) {
      console.warn('[orders] referral revert failed', err);
    }
  }
  if (changed) await saveOrder(o);
}

/**
 * Re-apply what releaseOrder() gave back when a cancelled/refunded order is
 * reopened (e.g. the owner marks it paid after all). Throws 409 when the
 * customer's credit or the stock is no longer available.
 */
export async function reclaimOrder(o: Order): Promise<void> {
  const lines = o.items.map((i) => ({ productId: i.productId, qty: i.qty }));
  if (o.stockRestored) {
    await decrementStock(lines); // 409 when sold out meanwhile
    o.stockRestored = false;
  }
  if (o.creditRestored && o.creditAppliedCents > 0) {
    try {
      await debitCredit(o.username, o.creditAppliedCents, `Order ${o.id} reopened – credit re-applied`, o.id);
      o.creditRestored = false;
    } catch (err) {
      await restoreStock(lines).catch(() => undefined);
      o.stockRestored = true;
      if (err instanceof HttpError) throw new HttpError(409, `Cannot reopen: ${o.username} no longer has the $${(o.creditAppliedCents / 100).toFixed(2)} store credit that was applied to this order.`, 'insufficient_credit');
      throw err;
    }
  }
  if (o.couponRestored && o.discountCode) {
    try {
      await consumeCoupon(o.discountCode, o.username);
    } catch (err) {
      console.warn('[orders] coupon could not be re-consumed on reopen', (err as Error).message);
    }
    o.couponRestored = false;
  }
  pushTimeline(o, 'note', 'Order reopened – credit, stock and coupon re-applied');
}

/** Save a brand-new order; fails instead of overwriting if the id already exists. */
export async function saveNewOrder(order: Order): Promise<void> {
  await kvUpdate<Order>('orders', order.id, (cur) => {
    if (cur) throw new HttpError(500, 'Order id collision – please try again.', 'id_collision');
    return order;
  });
  await updateIndex(order);
}

/** Discord ping for a brand-new order. */
export async function announceNewOrder(o: Order): Promise<void> {
  await notifyDiscord({
    title: `🛒 New order ${o.id} (${o.payment.type === 'free' ? 'FREE' : o.payment.methodName})`,
    color: o.payment.type === 'free' ? COLORS.pink : COLORS.gold,
    url: `${siteUrl()}/admin/orders/${o.id}`,
    fields: [
      { name: 'Player', value: `\`${o.username}\``, inline: true },
      { name: 'Total', value: `$${(o.totalCents / 100).toFixed(2)}`, inline: true },
      { name: 'Status', value: o.status, inline: true },
      { name: 'Items', value: o.items.map((i) => `• ${i.qty}× ${i.name}`).join('\n').slice(0, 1000) || '—' },
      ...(o.discountCode ? [{ name: 'Code', value: o.discountCode, inline: true }] : []),
      ...(o.referralCode ? [{ name: 'Referral', value: o.referralCode, inline: true }] : []),
    ],
  });
}

/** Unpaid orders are cancelled after this long so reserved stock / coupon uses come back. */
export const UNPAID_ORDER_TTL_MS = 24 * 60 * 60 * 1000;
const EXPIRE_THROTTLE_KEY = 'expire-unpaid-last-run';

/**
 * Cancel orders that have been awaiting payment for longer than UNPAID_ORDER_TTL_MS.
 * Orders with a customer-reported payment (pending_review) are left for the owner.
 * Runs from the scheduled function (netlify/functions/expire-orders.ts) and, throttled,
 * after each new order so it also works without the scheduler (e.g. `netlify dev`).
 */
export async function expireUnpaidOrders(opts: { max?: number; now?: number } = {}): Promise<string[]> {
  const now = opts.now ?? Date.now();
  const idx = await listOrderIndex();
  const due = idx.filter((e) => e.status === 'awaiting_payment' && e.paymentStatus !== 'pending_review' && now - Date.parse(e.createdAt) > UNPAID_ORDER_TTL_MS).slice(0, opts.max ?? 25);
  const cancelled: string[] = [];
  for (const e of due) {
    const order = await getOrder(e.id);
    if (!order || order.status !== 'awaiting_payment' || order.payment.status === 'pending_review') continue;
    try {
      await setOrderStatus(order, 'cancelled', 'Expired – no payment within 24 hours (stock, coupon and credit returned)');
      cancelled.push(order.id);
    } catch (err) {
      console.warn('[orders] expiry failed for', order.id, (err as Error).message);
    }
  }
  return cancelled;
}

/** Fire-and-forget expiry, at most once per 15 minutes per deployment. */
export async function expireUnpaidOrdersThrottled(): Promise<void> {
  try {
    let run = false;
    await kvUpdate<{ at: number }>('giveaways', EXPIRE_THROTTLE_KEY, (cur) => {
      if (cur && Date.now() - cur.at < 15 * 60 * 1000) return cur;
      run = true;
      return { at: Date.now() };
    });
    if (run) await expireUnpaidOrders();
  } catch (err) {
    console.warn('[orders] throttled expiry failed', (err as Error).message);
  }
}

/** Count delivered orders (for the public stats) */
export async function countDelivered(): Promise<number> {
  const idx = await listOrderIndex();
  return idx.filter((e) => e.status === 'delivered').length;
}
