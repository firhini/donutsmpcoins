/**
 * Scheduled function: cancel orders that stayed unpaid for 24 hours so their reserved
 * stock, coupon uses and store credit come back. Runs hourly on Netlify; the same logic
 * also runs (throttled) after each new order via expireUnpaidOrdersThrottled().
 */
import type { Config } from '@netlify/functions';
import { expireUnpaidOrders } from '../lib/orders';
import { purgeOldJourneys } from '../lib/analytics';

export default async () => {
  const cancelled = await expireUnpaidOrders({ max: 50 });
  console.log(`[expire-orders] cancelled ${cancelled.length} unpaid order(s)${cancelled.length ? ': ' + cancelled.join(', ') : ''}`);
  // visitor journeys (consented analytics) are kept for 90 days
  const purged = await purgeOldJourneys().catch(() => 0);
  if (purged) console.log(`[expire-orders] removed ${purged} visitor journey(s) older than 90 days`);
  return new Response(JSON.stringify({ cancelled }), { headers: { 'content-type': 'application/json' } });
};

export const config: Config = { schedule: '@hourly' };
