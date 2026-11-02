import { afterAll, describe, expect, it } from 'vitest';
// api-helpers MUST be imported first – it relocates the file store before loading the API.
import { call, cleanupTestData, get, lib, orderBody, post } from './api-helpers';

afterAll(() => cleanupTestData());

async function adminToken(): Promise<string> {
  const r = await post<{ token: string }>('/admin/login', { password: process.env.ADMIN_PASSWORD });
  return r.data.token;
}

describe('cookieless analytics', () => {
  it('accepts beacons, drops junk and aggregates per day for the admin', async () => {
    const ua = { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile' };
    const send = (events: unknown[], ip = '10.9.0.1') => call('POST', '/t', undefined, { headers: { ...ua, 'content-type': 'application/json' }, rawBody: JSON.stringify({ events }), ip });
    expect((await send([{ e: 'pv', v: '/', ref: 'google.com' }, { e: 'pv', v: '/order/DC-ABC123' }, { e: 'nope' }])).status).toBe(204);
    await send([{ e: 'click', v: 'home › Shop now' }, { e: 'product_view', v: 'mystery-box' }, { e: 'add_to_cart', v: 'mystery-box', qty: 2 }, { e: 'begin_checkout' }]);
    await send([{ e: 'pv', v: '/' }], '10.9.0.2');
    expect((await call('POST', '/t', undefined, { rawBody: 'not json' })).status).toBe(204);

    const token = await adminToken();
    expect((await get('/admin/analytics')).status).toBe(401);
    const res = await get<any>('/admin/analytics?days=1', { headers: { authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
    const t = res.data.totals;
    expect(t.visitors).toBe(2);
    expect(t.pageViews).toBe(3);
    expect(t.addToCart).toBe(1);
    expect(t.checkouts).toBe(1);
    expect(res.data.pages).toEqual(expect.arrayContaining([{ key: '/', count: 2 }, { key: '/order/:id', count: 1 }]));
    expect(res.data.referrers).toEqual([{ key: 'google.com', count: 1 }]);
    expect(res.data.clicks[0]).toEqual({ key: 'home › Shop now', count: 1 });
    expect(res.data.cartAdds[0]).toEqual({ key: 'mystery-box', count: 2 });
    expect(res.data.devices[0].key).toBe('mobile');
  });

  it('ignores bots and lists logged-in users for the admin', async () => {
    await call('POST', '/t', undefined, { headers: { 'user-agent': 'Googlebot/2.1', 'content-type': 'application/json' }, rawBody: JSON.stringify({ events: [{ e: 'pv', v: '/bot' }] }), ip: '10.9.0.3' });
    const token = await adminToken();
    const a = await get<any>('/admin/analytics?days=1', { headers: { authorization: `Bearer ${token}` } });
    expect(a.data.pages.find((p: { key: string }) => p.key === '/bot')).toBeUndefined();
    const users = await import('../netlify/lib/users');
    await users.upsertUser({ id: '700000000000000001', username: 'statsguy' });
    const u = await get<any>('/admin/users', { headers: { authorization: `Bearer ${token}` } });
    expect(u.status).toBe(200);
    expect(u.data.users.find((x: { id: string }) => x.id === '700000000000000001')).toMatchObject({ provider: 'discord', username: 'statsguy' });
  });
});

describe('visitor journeys (cookie consent)', () => {
  it('records a consented visit, links the order and attributes the sale to its source', async () => {
    const sid = 'abc123def456ghi789jk';
    const ua = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/120', 'content-type': 'application/json' };
    const src = { ref: 'youtube.com', creator: 'BigTuber', landing: '/' };
    const send = (events: unknown[]) => call('POST', '/t', undefined, { headers: ua, rawBody: JSON.stringify({ events, sid, src }), ip: '10.9.1.1' });
    await send([{ e: 'pv', v: '/' }, { e: 'click', v: 'home › Shop now' }]);
    await send([{ e: 'product_view', v: 'elytra-crate' }, { e: 'add_to_cart', v: 'elytra-crate', qty: 1 }, { e: 'begin_checkout' }]);

    const order = await post<{ order: { id: string } }>('/orders', orderBody({ username: 'JourneyGuy', sessionId: sid }), { ip: '10.9.1.2' });
    expect(order.status).toBe(201);
    const id = order.data.order.id;
    expect((order.data.order as Record<string, unknown>).sessionId).toBeUndefined(); // never public
    const stored = (await lib.orders.getOrder(id))!;
    expect(stored.sessionId).toBe(sid);
    await lib.orders.setOrderStatus(stored, 'paid', 'test');

    const token = await adminToken();
    const auth = { headers: { authorization: `Bearer ${token}` } };
    const detail = await get<any>(`/admin/sessions/${sid}`, auth);
    expect(detail.status).toBe(200);
    expect(detail.data.session.sourceLabel).toBe('creator: BigTuber');
    expect(detail.data.session.events.map((e: { e: string }) => e.e)).toEqual(['pv', 'click', 'product_view', 'add_to_cart', 'begin_checkout']);
    expect(detail.data.orders.map((o: { id: string }) => o.id)).toEqual([id]);

    const list = await get<any>('/admin/sessions?days=1', auth);
    expect(list.data.sessions.find((s: { id: string }) => s.id === sid)).toMatchObject({ source: 'creator: BigTuber', pages: 1, cartAdds: 1, orders: 1 });
    const stats = await get<any>('/admin/analytics?days=1', auth);
    expect(stats.data.sources.find((r: { source: string }) => r.source === 'creator: BigTuber')).toMatchObject({ visits: 1, orders: 1 });
    expect((await get('/admin/sessions?days=1')).status).toBe(401);
  });

  it('ignores invalid session ids', async () => {
    await call('POST', '/t', undefined, { headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0' }, rawBody: JSON.stringify({ events: [{ e: 'pv', v: '/' }], sid: '../../etc' }), ip: '10.9.1.3' });
    const token = await adminToken();
    const r = await get<any>('/admin/sessions/..%2F..%2Fetc', { headers: { authorization: `Bearer ${token}` } });
    expect(r.status).toBe(404);
  });
});
