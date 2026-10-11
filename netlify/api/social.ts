/**
 * Social: customer reviews and giveaways.
 *
 *  GET  /reviews?limit=        approved reviews (newest first) + stats
 *  POST /reviews               { orderId, rating, comment } → pending review
 *  GET  /giveaways             live giveaways + the last 5 ended/drawn
 *  POST /giveaways/:id/enter   { username, deviceId } → one entry per player / device
 */
import { kvUpdate } from '../lib/store';
import type { Order, Review } from '../../src/shared/types';
import type { Route } from '../lib/http';
import { HttpError, getIp, hashIp, json, readJson, requireString, requireUsername } from '../lib/http';
import { rateLimit } from '../lib/ratelimit';
import { getOrder, pushTimeline, saveOrder } from '../lib/orders';
import { COLORS, notifyDiscord, siteUrl } from '../lib/discord';
import { COMMENT_MAX, COMMENT_MIN, cleanComment, createReview, getReviewStats, listReviews, toPublicStats } from '../lib/reviews';
import { addEntry, getGiveaway, isLive, listGiveaways, refreshGiveawayStatus } from '../lib/giveaways';

const DEVICE_RE = /^[A-Za-z0-9_\-:.]{4,80}$/;

function cleanDeviceId(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s && s !== 'nodevice' && DEVICE_RE.test(s) ? s : undefined;
}

function parseLimit(v: string | null, fallback: number, max: number): number {
  const n = Number.parseInt(v ?? '', 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(max, n);
}

function requireRating(v: unknown): Review['rating'] {
  const n = typeof v === 'string' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > 5) throw new HttpError(400, 'Pick a rating from 1 to 5 stars.', 'validation');
  return n as Review['rating'];
}

export const routes: Route[] = [
  {
    method: 'GET',
    path: '/reviews',
    handler: async ({ url }) => {
      const limit = parseLimit(url.searchParams.get('limit'), 50, 100);
      const [reviews, stats] = await Promise.all([listReviews({ status: 'approved', limit }), getReviewStats()]);
      // never publish the order id (it is the key to the order page) or the reward code
      const publicReviews = reviews.map(({ orderId: _o, rewardCode: _r, ...rest }) => rest);
      return json({ reviews: publicReviews, stats: toPublicStats(stats) }, 200, { 'cache-control': 'public, max-age=30' });
    },
  },

  {
    method: 'POST',
    path: '/reviews',
    handler: async ({ req, context }) => {
      const body = await readJson<{ orderId?: unknown; rating?: unknown; comment?: unknown }>(req);
      const orderId = requireString(body.orderId, 'Order ID', { min: 3, max: 24 }).toUpperCase();
      const rating = requireRating(body.rating);
      const comment = cleanComment(requireString(body.comment, 'Comment', { min: 1, max: 2000 }));
      if (comment.length < COMMENT_MIN) throw new HttpError(400, `Tell us a bit more – at least ${COMMENT_MIN} characters.`, 'validation');
      if (comment.length > COMMENT_MAX) throw new HttpError(400, `Keep it under ${COMMENT_MAX} characters.`, 'validation');
      await rateLimit(`reviews:${hashIp(getIp(req, context))}`, 5, 600);

      const existing = await getOrder(orderId);
      if (!existing) throw new HttpError(404, 'Order not found – check the ID (it looks like DC-XXXXXX).', 'not_found');
      if (existing.reviewed) throw new HttpError(409, 'This order has already been reviewed – thank you!', 'already_reviewed');
      if (existing.status !== 'delivered') throw new HttpError(400, 'You can review an order once it has been delivered.', 'not_delivered');

      // flip the flag atomically first – parallel submissions cannot create several reviews
      const order = await kvUpdate<Order>('orders', existing.id, (cur) => {
        if (!cur || cur.reviewed) throw new HttpError(409, 'This order has already been reviewed – thank you!', 'already_reviewed');
        if (cur.status !== 'delivered') throw new HttpError(400, 'You can review an order once it has been delivered.', 'not_delivered');
        cur.reviewed = true;
        pushTimeline(cur, 'note', `Review submitted (${rating}★) – pending approval`);
        return cur;
      });
      let review;
      try {
        review = await createReview(order, rating, comment);
      } catch (err) {
        await kvUpdate<Order>('orders', order.id, (cur) => (cur ? { ...cur, reviewed: false } : (cur as unknown as Order))).catch(() => undefined);
        throw err;
      }
      await saveOrder(order);

      await notifyDiscord({
        title: `📝 New review pending · ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`,
        color: COLORS.gray,
        url: `${siteUrl()}/admin/reviews`,
        description: comment.slice(0, 1000),
        fields: [
          { name: 'Player', value: `\`${order.username}\``, inline: true },
          { name: 'Order', value: order.id, inline: true },
        ],
        footer: { text: 'Approve it in the admin panel to publish it and send the thank-you coupon.' },
      });
      return json({ review }, 201);
    },
  },

  {
    method: 'GET',
    path: '/giveaways',
    handler: async () => {
      const all = await listGiveaways();
      const now = Date.now();
      const live = all.filter((g) => isLive(g, now)).sort((a, b) => a.endsAt.localeCompare(b.endsAt));
      const past = all
        .filter((g) => !isLive(g, now))
        .sort((a, b) => b.endsAt.localeCompare(a.endsAt))
        .slice(0, 5);
      return json({ giveaways: [...live, ...past] }, 200, { 'cache-control': 'public, max-age=15' });
    },
  },

  {
    method: 'POST',
    path: '/giveaways/:id/enter',
    handler: async ({ req, context, params }) => {
      const body = await readJson<{ username?: unknown; deviceId?: unknown }>(req);
      const username = requireUsername(body.username);
      const deviceId = cleanDeviceId(body.deviceId);
      const ipHash = hashIp(getIp(req, context));
      await rateLimit(`giveaway-enter:${ipHash}`, 20, 600);

      const found = await getGiveaway(params.id);
      if (!found) throw new HttpError(404, 'This giveaway does not exist (anymore).', 'not_found');
      const g = await refreshGiveawayStatus(found);
      if (!isLive(g)) throw new HttpError(409, g.status === 'drawn' ? 'This giveaway is over – the winners were already drawn.' : 'This giveaway has ended – entries are closed.', 'ended');

      const { giveaway } = await addEntry(g, { username, deviceId, ipHash });
      return json({ entered: true, entriesCount: giveaway.entriesCount, giveaway });
    },
  },
];
