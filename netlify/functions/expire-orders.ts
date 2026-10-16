/**
 * Scheduled function: cancel orders that stayed unpaid for 24 hours so their reserved
 * stock, coupon uses and store credit come back. Runs hourly on Netlify; the same logic
 * also runs (throttled) after each new order via expireUnpaidOrdersThrottled().
 */
import type { Config } from '@netlify/functions';
import { expireUnpaidOrders } from '../lib/orders';

export default async () => {
  const cancelled = await expireUnpaidOrders({ max: 50 });
  console.log(`[expire-orders] cancelled ${cancelled.length} unpaid order(s)${cancelled.length ? ': ' + cancelled.join(', ') : ''}`);
  return new Response(JSON.stringify({ cancelled }), { headers: { 'content-type': 'application/json' } });
};

export const config: Config = { schedule: '@hourly' };
