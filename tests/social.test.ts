import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// api-helpers MUST be imported first – it relocates the file store before loading the API.
import { call, cleanupTestData, freshIp, get, lib, orderBody, post } from './api-helpers';
import type { Giveaway, GiveawayEntry, Order, PublicOrder, Review, ReviewStats, SiteStats } from '../src/shared/types';

process.env.ADMIN_PASSWORD = 'test-pass';

afterAll(() => cleanupTestData());

let token = '';
const auth = () => ({ headers: { authorization: `Bearer ${token}` } });
const aget = <T = any>(p: string) => call<T>('GET', p, undefined, auth()); // eslint-disable-line @typescript-eslint/no-explicit-any
const apost = <T = any>(p: string, body?: unknown) => call<T>('POST', p, body ?? {}, auth()); // eslint-disable-line @typescript-eslint/no-explicit-any
const apatch = <T = any>(p: string, body: unknown) => call<T>('PATCH', p, body, auth()); // eslint-disable-line @typescript-eslint/no-explicit-any

let deviceCounter = 0;
const freshDevice = () => `dev-${++deviceCounter}-${Math.random().toString(36).slice(2, 10)}`;

/** Checkout → admin marks paid → delivered, exactly like the real flow. */
async function deliveredOrder(username: string): Promise<PublicOrder> {
  const res = await post<{ order: PublicOrder }>('/orders', orderBody({ username, items: [{ productId: 'mystery-box', qty: 1 }, { productId: 'money-1m', qty: 10 }] }));
  expect(res.status, JSON.stringify(res.data)).toBe(201);
  const id = res.data.order.id;
  expect((await apatch(`/admin/orders/${id}`, { status: 'paid' })).status).toBe(200);
  const delivered = await apatch<{ order: Order }>(`/admin/orders/${id}`, { status: 'delivered' });
  expect(delivered.data.order.status).toBe('delivered');
  return res.data.order;
}

beforeAll(async () => {
  const res = await post<{ token: string }>('/admin/login', { password: 'test-pass' });
  expect(res.status).toBe(200);
  token = res.data.token;
});

describe('reviews', () => {
  it('starts empty', async () => {
    const res = await get<{ reviews: Review[]; stats: ReviewStats }>('/reviews');
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ reviews: [], stats: { count: 0, averageRating: 0 } });
    expect(res.headers.get('cache-control')).toContain('max-age');
  });

  it('only accepts reviews for delivered, un-reviewed orders', async () => {
    const open = await post<{ order: PublicOrder }>('/orders', orderBody({ username: 'EarlyBird' }));
    const early = await post('/reviews', { orderId: open.data.order.id, rating: 5, comment: 'Not delivered yet but hyped' });
    expect(early.status).toBe(400);
    expect(early.data.code).toBe('not_delivered');
    expect((await post('/reviews', { orderId: 'DC-ZZZZZZ', rating: 5, comment: 'ghost order' })).status).toBe(404);
  });

  it('validates rating and comment', async () => {
    const order = await deliveredOrder('Picky');
    expect((await post('/reviews', { orderId: order.id, rating: 6, comment: 'too good' })).status).toBe(400);
    expect((await post('/reviews', { orderId: order.id, rating: 4.5, comment: 'half stars' })).status).toBe(400);
    expect((await post('/reviews', { orderId: order.id, rating: 'five', comment: 'words' })).status).toBe(400);
    expect((await post('/reviews', { orderId: order.id, rating: 5, comment: 'ok' })).status).toBe(400);
    expect((await post('/reviews', { orderId: order.id, rating: 5, comment: 'x'.repeat(501) })).status).toBe(400);
    expect((await post('/reviews', { orderId: order.id, rating: 5 })).status).toBe(400);
    // none of those marked the order as reviewed
    expect((await lib.orders.getOrder(order.id))!.reviewed).toBeFalsy();
  });

  it('creates a pending review, marks the order, and publishes it only after approval with a reward coupon', async () => {
    const order = await deliveredOrder('HappyBuyer');
    const res = await post<{ review: Review }>('/reviews', { orderId: order.id.toLowerCase(), rating: 5, comment: '  Super\u0000 fast   delivery,\u0007 10/10  ' });
    expect(res.status, JSON.stringify(res.data)).toBe(201);
    const review = res.data.review;
    expect(review).toMatchObject({ orderId: order.id, username: 'HappyBuyer', rating: 5, status: 'pending', comment: 'Super fast delivery, 10/10' });
    expect(review.id).toMatch(/^[a-f0-9]{32}$/);
    expect(review.productNames).toEqual(['Mystery Box', '1M DonutSMP Money']);

    const stored = (await lib.orders.getOrder(order.id))!;
    expect(stored.reviewed).toBe(true);
    expect(stored.timeline[stored.timeline.length - 1]).toMatchObject({ status: 'note', note: expect.stringMatching(/Review submitted/) });

    const dup = await post('/reviews', { orderId: order.id, rating: 1, comment: 'changed my mind' });
    expect(dup.status).toBe(409);
    expect(dup.data.error).toMatch(/already/);

    // pending reviews are invisible to the public but counted for the admin
    expect((await get<{ reviews: Review[] }>('/reviews')).data.reviews).toEqual([]);
    expect((await aget('/admin/dashboard')).data.pendingReviews).toBe(1);
    const pending = await aget<{ reviews: Review[] }>('/admin/reviews?status=pending');
    expect(pending.data.reviews.map((r) => r.id)).toEqual([review.id]);
    expect((await aget<{ reviews: Review[] }>('/admin/reviews')).data.reviews).toHaveLength(1);
    expect((await aget('/admin/reviews?status=weird')).status).toBe(400);
    expect((await aget<{ reviews: Review[] }>('/admin/reviews?status=approved')).data.reviews).toEqual([]);

    // approve → reward coupon + order note + public listing + stats
    const approved = await apatch<{ review: Review; stats: ReviewStats }>(`/admin/reviews/${review.id}`, { status: 'approved' });
    expect(approved.status, JSON.stringify(approved.data)).toBe(200);
    expect(approved.data.review.status).toBe('approved');
    expect(approved.data.review.approvedAt).toBeTruthy();
    expect(approved.data.review.rewardCode).toMatch(/^THANKS-[A-Z2-9]{8}$/);
    const coupon = await lib.coupons.getCoupon(approved.data.review.rewardCode!);
    expect(coupon).toMatchObject({ type: 'percent', value: 5, source: 'review', boundUsername: 'happybuyer', maxUses: 1, active: true });
    expect(Date.parse(coupon!.expiresAt!)).toBeGreaterThan(Date.now() + 29 * 86400_000);
    const afterOrder = (await lib.orders.getOrder(order.id))!;
    expect(afterOrder.timeline[afterOrder.timeline.length - 1].note).toContain(approved.data.review.rewardCode!);

    const pub = await get<{ reviews: Review[]; stats: ReviewStats }>('/reviews?limit=10');
    expect(pub.data.reviews.map((r) => r.id)).toEqual([review.id]);
    expect(pub.data.stats).toEqual({ count: 1, averageRating: 5 });
    const site = await get<SiteStats>('/stats');
    expect(site.data.reviewCount).toBe(1);
    expect(site.data.averageRating).toBe(5);
    expect((await aget('/admin/dashboard')).data.pendingReviews).toBe(0);

    // approving again does not mint a second coupon
    const again = await apatch<{ review: Review }>(`/admin/reviews/${review.id}`, { status: 'approved' });
    expect(again.data.review.rewardCode).toBe(approved.data.review.rewardCode);
  });

  it('rejects reviews, recomputes stats and orders newest first', async () => {
    const o1 = await deliveredOrder('MehBuyer');
    const r1 = await post<{ review: Review }>('/reviews', { orderId: o1.id, rating: 2, comment: 'Took a while, items fine.' });
    const rejected = await apatch<{ review: Review }>(`/admin/reviews/${r1.data.review.id}`, { status: 'rejected' });
    expect(rejected.data.review.status).toBe('rejected');
    expect(rejected.data.review.rewardCode).toBeUndefined();
    expect((await get<{ stats: ReviewStats }>('/reviews')).data.stats).toEqual({ count: 1, averageRating: 5 });

    const o2 = await deliveredOrder('LateBuyer');
    const r2 = await post<{ review: Review }>('/reviews', { orderId: o2.id, rating: 4, comment: 'Solid service, would buy again.' });
    await apatch(`/admin/reviews/${r2.data.review.id}`, { status: 'approved' });
    const pub = await get<{ reviews: Review[]; stats: ReviewStats }>('/reviews');
    expect(pub.data.reviews.map((r) => r.username)).toEqual(['LateBuyer', 'HappyBuyer']);
    expect(pub.data.stats).toEqual({ count: 2, averageRating: 4.5 });
    expect((await get<{ reviews: Review[] }>('/reviews?limit=1')).data.reviews).toHaveLength(1);

    expect((await apatch(`/admin/reviews/${r2.data.review.id}`, { status: 'famous' })).status).toBe(400);
    expect((await apatch('/admin/reviews/ffffffffffffffffffffffffffffffff', { status: 'approved' })).status).toBe(404);
    expect((await call('PATCH', `/admin/reviews/${r2.data.review.id}`, { status: 'rejected' })).status).toBe(401);
  });

  it('rate limits review submissions (5 / 10 min per IP)', async () => {
    const ip = freshIp();
    for (let i = 0; i < 5; i++) await post('/reviews', { orderId: 'DC-ZZZZZZ', rating: 5, comment: 'spam spam' }, { ip });
    expect((await post('/reviews', { orderId: 'DC-ZZZZZZ', rating: 5, comment: 'spam spam' }, { ip })).status).toBe(429);
  });
});

describe('giveaways', () => {
  let gw: Giveaway;

  it('admin creates a giveaway that shows up publicly', async () => {
    expect((await apost('/admin/giveaways', { title: 'Past', prize: 'x', endsAt: new Date(Date.now() - 1000).toISOString() })).status).toBe(400);
    expect((await apost('/admin/giveaways', { title: 'No end', prize: 'x' })).status).toBe(400);
    expect((await post('/admin/giveaways', { title: 'Hacker', prize: 'x', endsAt: new Date(Date.now() + 3600_000).toISOString() })).status).toBe(401);

    const endsAt = new Date(Date.now() + 2 * 3600_000).toISOString();
    const res = await apost<{ giveaway: Giveaway }>('/admin/giveaways', { title: 'Weekend Elytra', description: 'One lucky player gets an Elytra.', prize: '1× Elytra', endsAt, maxWinners: 2 });
    expect(res.status, JSON.stringify(res.data)).toBe(201);
    gw = res.data.giveaway;
    expect(gw).toMatchObject({ title: 'Weekend Elytra', prize: '1× Elytra', status: 'active', entriesCount: 0, maxWinners: 2, endsAt });
    expect(gw.id).toMatch(/^[a-f0-9]{32}$/);

    const pub = await get<{ giveaways: Giveaway[] }>('/giveaways');
    expect(pub.status).toBe(200);
    expect(pub.data.giveaways.map((g) => g.id)).toEqual([gw.id]);
    expect((await aget('/admin/dashboard')).data.activeGiveaways).toBe(1);
  });

  it('accepts one entry per username and per device', async () => {
    const device = freshDevice();
    const first = await post(`/giveaways/${gw.id}/enter`, { username: 'EntrantOne', deviceId: device });
    expect(first.status, JSON.stringify(first.data)).toBe(200);
    expect(first.data).toMatchObject({ entered: true, entriesCount: 1 });

    const dupUser = await post(`/giveaways/${gw.id}/enter`, { username: 'entrantone', deviceId: freshDevice() });
    expect(dupUser.status).toBe(409);
    expect(dupUser.data.code).toBe('already_entered');
    const dupDevice = await post(`/giveaways/${gw.id}/enter`, { username: 'EntrantAlt', deviceId: device });
    expect(dupDevice.status).toBe(409);
    expect(dupDevice.data.code).toBe('device_entered');

    expect((await post(`/giveaways/${gw.id}/enter`, { username: 'EntrantTwo', deviceId: freshDevice() })).data.entriesCount).toBe(2);
    expect((await post(`/giveaways/${gw.id}/enter`, { username: 'EntrantThree', deviceId: freshDevice() })).data.entriesCount).toBe(3);
    expect((await post(`/giveaways/${gw.id}/enter`, { username: 'bad name', deviceId: freshDevice() })).status).toBe(400);
    expect((await post('/giveaways/ffffffffffffffffffffffffffffffff/enter', { username: 'Steve', deviceId: freshDevice() })).status).toBe(404);
    expect((await post('/giveaways/not-an-id/enter', { username: 'Steve', deviceId: freshDevice() })).status).toBe(404);

    expect((await get<{ giveaways: Giveaway[] }>('/giveaways')).data.giveaways[0].entriesCount).toBe(3);
    const entries = await aget<{ entries: GiveawayEntry[] }>(`/admin/giveaways/${gw.id}/entries`);
    expect(entries.data.entries.map((e) => e.username)).toEqual(['EntrantOne', 'EntrantTwo', 'EntrantThree']);
    expect(entries.data.entries[0].deviceId).toBe(device);
    expect((await get(`/admin/giveaways/${gw.id}/entries`)).status).toBe(401);
  });

  it('closes entries when ended and draws unique winners securely', async () => {
    const ended = await apatch<{ giveaway: Giveaway }>(`/admin/giveaways/${gw.id}`, { status: 'ended' });
    expect(ended.data.giveaway.status).toBe('ended');
    const late = await post(`/giveaways/${gw.id}/enter`, { username: 'TooLate', deviceId: freshDevice() });
    expect(late.status).toBe(409);
    expect(late.data.code).toBe('ended');
    expect((await aget('/admin/dashboard')).data.activeGiveaways).toBe(0);

    const draw = await apost<{ giveaway: Giveaway; winners: string[] }>(`/admin/giveaways/${gw.id}/draw`);
    expect(draw.status, JSON.stringify(draw.data)).toBe(200);
    expect(draw.data.winners).toHaveLength(2);
    expect(new Set(draw.data.winners).size).toBe(2);
    for (const w of draw.data.winners) expect(['EntrantOne', 'EntrantTwo', 'EntrantThree']).toContain(w);
    expect(draw.data.giveaway).toMatchObject({ status: 'drawn', winners: draw.data.winners, entriesCount: 3 });
    expect((await apost(`/admin/giveaways/${gw.id}/draw`)).status).toBe(409);
    expect((await apatch(`/admin/giveaways/${gw.id}`, { status: 'active' })).status).toBe(409);

    const pub = await get<{ giveaways: Giveaway[] }>('/giveaways');
    expect(pub.data.giveaways[0]).toMatchObject({ id: gw.id, status: 'drawn', winners: draw.data.winners });
    expect((await post(`/giveaways/${gw.id}/enter`, { username: 'Stragglers', deviceId: freshDevice() })).status).toBe(409);
  });

  it('auto-ends giveaways whose end time passed and keeps only the last 5 past ones', async () => {
    const future = new Date(Date.now() + 3600_000).toISOString();
    const created = await apost<{ giveaway: Giveaway }>('/admin/giveaways', { title: 'Expiring', prize: '10M', endsAt: future });
    expect((await get<{ giveaways: Giveaway[] }>('/giveaways')).data.giveaways.find((g) => g.id === created.data.giveaway.id)?.status).toBe('active');
    await apatch(`/admin/giveaways/${created.data.giveaway.id}`, { endsAt: new Date(Date.now() - 60_000).toISOString() });
    const pub = await get<{ giveaways: Giveaway[] }>('/giveaways');
    expect(pub.data.giveaways.find((g) => g.id === created.data.giveaway.id)?.status).toBe('ended');
    expect((await lib.store.kvGet<Giveaway>('giveaways', `gw:${created.data.giveaway.id}`))?.status).toBe('ended');
    const entry = await post(`/giveaways/${created.data.giveaway.id}/enter`, { username: 'Steve', deviceId: freshDevice() });
    expect(entry.status).toBe(409);

    for (let i = 0; i < 6; i++) {
      const g = await apost<{ giveaway: Giveaway }>('/admin/giveaways', { title: `Old ${i}`, prize: 'coins', endsAt: new Date(Date.now() + 3600_000).toISOString() });
      await apatch(`/admin/giveaways/${g.data.giveaway.id}`, { status: 'ended' });
    }
    const live = await apost<{ giveaway: Giveaway }>('/admin/giveaways', { title: 'Live now', prize: 'coins', endsAt: new Date(Date.now() + 3600_000).toISOString() });
    const list = (await get<{ giveaways: Giveaway[] }>('/giveaways')).data.giveaways;
    expect(list[0].id).toBe(live.data.giveaway.id);
    expect(list.filter((g) => g.status !== 'active')).toHaveLength(5);
    expect(list).toHaveLength(6);
    expect((await aget<{ giveaways: Giveaway[] }>('/admin/giveaways')).data.giveaways.length).toBe(9);
  });

  it('rate limits entries (20 / 10 min per IP)', async () => {
    const ip = freshIp();
    for (let i = 0; i < 20; i++) await post('/giveaways/ffffffffffffffffffffffffffffffff/enter', { username: `Spam${i}`, deviceId: freshDevice() }, { ip });
    expect((await post('/giveaways/ffffffffffffffffffffffffffffffff/enter', { username: 'Spam21', deviceId: freshDevice() }, { ip })).status).toBe(429);
  });
});
