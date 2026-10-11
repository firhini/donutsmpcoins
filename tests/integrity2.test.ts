import { afterAll, describe, expect, it } from 'vitest';
// api-helpers MUST be imported first – it relocates the file store before loading the API.
import { call, cleanupTestData, get, lib, orderBody, post } from './api-helpers';
import type { Giveaway, PublicOrder, SiteSettings } from '../src/shared/types';

afterAll(() => cleanupTestData());

async function adminToken(): Promise<string> {
  const res = await post<{ token: string }>('/admin/login', { password: process.env.ADMIN_PASSWORD });
  return res.data.token;
}
const auth = (token: string) => ({ headers: { authorization: `Bearer ${token}` } });

describe('abuse resistance (review round 2)', () => {
  it('parallel spins from one IP/device grant exactly one prize', async () => {
    await lib.settings.saveSettings({ spin: { enabled: true, cooldownHours: 24, requireUsername: false, prizes: [{ id: 'c', label: 'credit', type: 'credit', creditCents: 100, weight: 1 }] } } as Partial<SiteSettings>);
    const ip = '10.9.9.9';
    const results = await Promise.all(Array.from({ length: 8 }, () => post('/spin', { deviceId: 'dev-race', username: 'SpinRacer' }, { ip })));
    expect(results.filter((r) => r.status === 200).length).toBe(1);
    expect(results.filter((r) => r.status === 429).length).toBe(7);
    expect((await lib.credit.getCredit('SpinRacer')).balanceCents).toBe(100);
  });

  it('weekly free-item slot per username holds under concurrency', async () => {
    await lib.settings.saveSettings({ spin: { enabled: true, cooldownHours: 24, requireUsername: true, prizes: [{ id: 'f', label: '1M', type: 'free_item', productId: 'money-1m', qty: 1, weight: 1 }] } } as Partial<SiteSettings>);
    const results = await Promise.all(Array.from({ length: 6 }, (_, i) => post<{ orderId?: string; prize: { type: string } }>('/spin', { deviceId: `dev-free-${i}`, username: 'FreeFarmer' }, { ip: `10.8.8.${i + 1}` })));
    const freeOrders = results.filter((r) => r.status === 200 && r.data.orderId);
    expect(freeOrders.length).toBe(1);
    const idx = await lib.orders.listOrderIndex();
    expect(idx.filter((e) => e.username === 'FreeFarmer').length).toBe(1);
  });

  it('rate limiter holds under parallel requests', async () => {
    const results = await Promise.all(Array.from({ length: 12 }, () => post('/admin/login', { password: 'wrong' }, { ip: '10.7.7.7' })));
    expect(results.filter((r) => r.status === 401).length).toBe(5);
    expect(results.filter((r) => r.status === 429).length).toBe(7);
  });

  it('giveaway entries: one per username, one per device, max 3 per IP, counter exact', async () => {
    const token = await adminToken();
    const gw = await call<{ giveaway: Giveaway }>('POST', '/admin/giveaways', { title: 'Race', prize: '10M', endsAt: new Date(Date.now() + 3600_000).toISOString(), maxWinners: 1 }, auth(token));
    const id = gw.data.giveaway.id;
    const dup = await Promise.all(Array.from({ length: 5 }, () => post(`/giveaways/${id}/enter`, { username: 'GwRacer', deviceId: 'gw-dev-1' }, { ip: '10.6.6.1' })));
    expect(dup.filter((r) => r.status === 200).length).toBe(1);
    const dev = await post(`/giveaways/${id}/enter`, { username: 'OtherName', deviceId: 'gw-dev-1' }, { ip: '10.6.6.1' });
    expect(dev.data.code).toBe('device_entered');
    const ipResults = [];
    for (let i = 0; i < 4; i++) ipResults.push(await post(`/giveaways/${id}/enter`, { username: `IpUser${i}`, deviceId: `gw-dev-ip-${i}` }, { ip: '10.6.6.2' }));
    expect(ipResults.filter((r) => r.status === 200).length).toBe(3);
    expect(ipResults[3].data.code).toBe('ip_limit');
    const list = await get<{ giveaways: Giveaway[] }>('/giveaways');
    expect(list.data.giveaways.find((g) => g.id === id)?.entriesCount).toBe(4);
  });

  it('one review per order even with parallel submissions; public reviews hide order ids', async () => {
    const token = await adminToken();
    const o = await post<{ order: PublicOrder }>('/orders', orderBody({ username: 'Reviewer' }));
    await call('PATCH', `/admin/orders/${o.data.order.id}`, { status: 'paid' }, auth(token));
    await call('PATCH', `/admin/orders/${o.data.order.id}`, { status: 'delivered' }, auth(token));
    const results = await Promise.all(Array.from({ length: 5 }, (_, i) => post('/reviews', { orderId: o.data.order.id, rating: 5, comment: `great stuff number ${i}` }, { ip: `10.5.5.${i + 1}` })));
    expect(results.filter((r) => r.status === 201).length).toBe(1);
    const pending = await call<{ reviews: { id: string }[] }>('GET', '/admin/reviews?status=pending', undefined, auth(token));
    const mine = pending.data.reviews;
    expect(mine.length).toBeGreaterThanOrEqual(1);
    await call('PATCH', `/admin/reviews/${mine[0].id}`, { status: 'approved' }, auth(token));
    const pub = await get<{ reviews: Record<string, unknown>[] }>('/reviews?limit=5');
    expect(pub.data.reviews.length).toBeGreaterThanOrEqual(1);
    for (const r of pub.data.reviews) {
      expect(r).not.toHaveProperty('orderId');
      expect(r).not.toHaveProperty('rewardCode');
    }
  });

  it('rejects corrupt settings and blank gift max-uses means unlimited', async () => {
    const token = await adminToken();
    expect((await call('PUT', '/admin/settings', { sale: { enabled: true, percent: 'ten' } }, auth(token))).status).toBe(400);
    expect((await call('PUT', '/admin/settings', { spendingTiers: [{ minCents: 1000, percent: NaN }] }, auth(token))).status).toBe(400);
    expect((await call('PUT', '/admin/settings', { announcement: { enabled: true, text: 'x', link: 'javascript:alert(1)' } }, auth(token))).status).toBe(400);
    expect((await call('PUT', '/admin/settings', { currencies: [{ code: 'EUR', symbol: '€', rate: 0.9 }] }, auth(token))).status).toBe(400);
    const ok = await call<SiteSettings>('PUT', '/admin/settings', { sale: { enabled: true, percent: '15', label: 'Test' } }, auth(token));
    expect(ok.status).toBe(200);
    expect(ok.data.sale.percent).toBe(15);
    const gift = await call<{ gift: { maxUses?: number } }>('POST', '/admin/gifts', { productId: 'money-1m', qty: 1 }, auth(token));
    expect(gift.data.gift.maxUses).toBeUndefined();
  });

  it('reopening a cancelled order re-applies credit and stock, and refuses when credit is gone', async () => {
    const token = await adminToken();
    await lib.catalog.saveOverrides({ overrides: { elytra: { stock: 2 } }, custom: [], deleted: [] });
    await lib.credit.addCredit('Reopener', 500, 'test');
    const o = await post<{ order: PublicOrder }>('/orders', orderBody({ username: 'Reopener', items: [{ productId: 'elytra', qty: 2 }], applyCredit: true }));
    expect(o.status).toBe(201);
    await post(`/orders/${o.data.order.id}/cancel`);
    expect((await lib.credit.getCredit('Reopener')).balanceCents).toBe(500);
    const reopened = await call<{ order: PublicOrder }>('PATCH', `/admin/orders/${o.data.order.id}`, { status: 'paid' }, auth(token));
    expect(reopened.status).toBe(200);
    expect(reopened.data.order.status).toBe('paid');
    expect((await lib.credit.getCredit('Reopener')).balanceCents).toBe(0);
    expect((await lib.catalog.getFullCatalog()).products.find((p) => p.id === 'elytra')!.stock).toBe(0);
    // cancel again, spend the credit elsewhere, then reopening must fail with 409
    await call('PATCH', `/admin/orders/${o.data.order.id}`, { status: 'cancelled' }, auth(token));
    await lib.credit.debitCredit('Reopener', 500, 'spent elsewhere');
    const fail = await call('PATCH', `/admin/orders/${o.data.order.id}`, { status: 'paid' }, auth(token));
    expect(fail.status).toBe(409);
    expect((await lib.orders.getOrder(o.data.order.id))!.status).toBe('cancelled');
  });

  it('hidden products can still be granted as free prizes / gifts', async () => {
    await lib.catalog.saveOverrides({ overrides: { 'nether-star': { hidden: true } }, custom: [], deleted: [] });
    const order = await (await import('../netlify/lib/orderBuilder')).createFreeOrder('HiddenWinner', [{ productId: 'nether-star', qty: 3 }], 'admin', 'test');
    expect(order.items[0].productId).toBe('nether-star');
    expect(order.status).toBe('paid');
  });
});
