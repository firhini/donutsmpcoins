import type { Order, OrderIndexEntry, OrderStatus, PublicOrder, TimelineEntry } from '../../src/shared/types';
import { kvGet, kvSet, kvUpdate } from './store';
import { nowIso } from './http';
import { COLORS, notifyDiscord, siteUrl } from './discord';
import { addCredit } from './credit';
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
export async function setOrderStatus(o: Order, status: OrderStatus, note?: string): Promise<Order> {
  if (o.status === status) return o;
  o.status = status;
  if (status === 'paid') {
    o.payment.status = 'paid';
    o.payment.paidAt = o.payment.paidAt ?? nowIso();
  }
  if (status === 'refunded') o.payment.status = 'refunded';
  pushTimeline(o, status, note);
  await saveOrder(o);

  if (status === 'paid' && o.referralCode && !o.referralRewarded) {
    try {
      const settings = await getSettings();
      if (settings.referral.enabled && settings.referral.referrerPercent > 0 && o.referralCode.toLowerCase() !== o.username.toLowerCase()) {
        const reward = Math.round((o.totalCents * settings.referral.referrerPercent) / 100);
        if (reward > 0) {
          await addCredit(o.referralCode, reward, `Referral reward (${o.username})`, o.id);
          o.referralRewarded = true;
          await saveOrder(o);
        }
      }
    } catch (err) {
      console.warn('[orders] referral reward failed', err);
    }
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
