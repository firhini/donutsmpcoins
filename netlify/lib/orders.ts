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

export function toPublicOrder(o: Order): PublicOrder {
  const { ipHash, deviceId, adminNote, email, ...rest } = o;
  return { ...rest, emailMasked: email ? maskEmail(email) : undefined };
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

export async function setOrderStatus(o: Order, status: OrderStatus, note?: string): Promise<Order> {
  if (o.status === status) return o;
  const from = o.status;
  const reviving = (from === 'cancelled' || from === 'refunded') && status !== 'cancelled' && status !== 'refunded';
  if (reviving) await reclaimOrder(o); // throws 409 when credit/stock are no longer available

  // Atomic transition: a concurrent webhook / verify / admin click cannot apply the same
  // transition twice (and 'paid' can never be re-applied over delivering/delivered).
  try {
    await kvUpdate<Order>('orders', o.id, (cur) => {
      const stored = cur ?? o;
      if (stored.status === status) throw new NoTransition();
      if (status === 'paid' && PAID_LIKE.has(stored.status)) throw new NoTransition();
      o.status = status;
      if (status === 'paid') {
        o.payment.status = 'paid';
        o.payment.paidAt = o.payment.paidAt ?? nowIso();
      }
      if (status === 'refunded') o.payment.status = 'refunded';
      // keep bookkeeping flags that another writer may have set meanwhile
      o.referralRewarded = o.referralRewarded || stored.referralRewarded;
      o.referralRewardCents = o.referralRewardCents ?? stored.referralRewardCents;
      o.reviewed = o.reviewed || stored.reviewed;
      pushTimeline(o, status, note);
      o.updatedAt = nowIso();
      return o;
    });
  } catch (err) {
    if (err instanceof NoTransition) {
      const fresh = await getOrder(o.id);
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

/** Count delivered orders (for the public stats) */
export async function countDelivered(): Promise<number> {
  const idx = await listOrderIndex();
  return idx.filter((e) => e.status === 'delivered').length;
}
