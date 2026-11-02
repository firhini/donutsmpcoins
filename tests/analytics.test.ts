import { afterAll, describe, expect, it } from 'vitest';
// api-helpers MUST be imported first – it relocates the file store before loading the API.
import { call, cleanupTestData, get, post } from './api-helpers';

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
