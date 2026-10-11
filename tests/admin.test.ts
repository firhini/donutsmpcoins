import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// api-helpers MUST be imported first – it relocates the file store before loading the API.
import { call, cleanupTestData, freshIp, get, lib, orderBody, post } from './api-helpers';
import { defaultSettings } from '../src/data/settings';
import type { Catalog, Coupon, CreditAccount, Order, OrderIndexEntry, Product, PublicOrder, SiteSettings } from '../src/shared/types';
import type { GiftCode } from '../netlify/lib/gifts';

process.env.ADMIN_PASSWORD = 'test-pass';

afterAll(() => cleanupTestData());

let token = '';
const auth = () => ({ headers: { authorization: `Bearer ${token}` } });
const aget = <T = any>(p: string) => call<T>('GET', p, undefined, auth()); // eslint-disable-line @typescript-eslint/no-explicit-any
const apost = <T = any>(p: string, body?: unknown) => call<T>('POST', p, body ?? {}, auth()); // eslint-disable-line @typescript-eslint/no-explicit-any
const aput = <T = any>(p: string, body: unknown) => call<T>('PUT', p, body, auth()); // eslint-disable-line @typescript-eslint/no-explicit-any
const apatch = <T = any>(p: string, body: unknown) => call<T>('PATCH', p, body, auth()); // eslint-disable-line @typescript-eslint/no-explicit-any
const adel = <T = any>(p: string) => call<T>('DELETE', p, undefined, auth()); // eslint-disable-line @typescript-eslint/no-explicit-any

async function createOrder(overrides: Record<string, unknown> = {}): Promise<PublicOrder> {
  const res = await post<{ order: PublicOrder }>('/orders', orderBody(overrides));
  expect(res.status, JSON.stringify(res.data)).toBe(201);
  return res.data.order;
}

beforeAll(async () => {
  const res = await post<{ token: string; expiresAt: string }>('/admin/login', { password: 'test-pass' });
  expect(res.status).toBe(200);
  token = res.data.token;
});

describe('admin auth', () => {
  it('rejects wrong or missing passwords', async () => {
    const wrong = await post('/admin/login', { password: 'nope' });
    expect(wrong.status).toBe(401);
    expect(wrong.data.code).toBe('bad_password');
    expect((await post('/admin/login', {})).status).toBe(400);
    expect((await post('/admin/login', { password: '' })).status).toBe(400);
  });

  it('issues a token that unlocks /admin/me', async () => {
    const res = await post<{ token: string; expiresAt: string }>('/admin/login', { password: 'test-pass' });
    expect(res.status).toBe(200);
    expect(res.data.token.split('.')).toHaveLength(3);
    expect(Date.parse(res.data.expiresAt)).toBeGreaterThan(Date.now());
    const me = await call('GET', '/admin/me', undefined, { headers: { authorization: `Bearer ${res.data.token}` } });
    expect(me.data).toEqual({ ok: true });
  });

  it('answers 401 without, with a forged and with a tampered token', async () => {
    expect((await get('/admin/me')).status).toBe(401);
    expect((await get('/admin/dashboard')).status).toBe(401);
    expect((await call('GET', '/admin/me', undefined, { headers: { authorization: 'Bearer admin.99999999999999.abc' } })).status).toBe(401);
    const [scope, exp, sig] = token.split('.');
    const tampered = `${scope}.${Number(exp) + 1000}.${sig}`;
    expect((await call('GET', '/admin/me', undefined, { headers: { authorization: `Bearer ${tampered}` } })).status).toBe(401);
    expect((await call('GET', '/admin/export/orders.csv', undefined, { headers: { authorization: 'Basic abc' } })).status).toBe(401);
  });

  it('rate limits login attempts (5 / 15 min per IP)', async () => {
    const ip = freshIp();
    for (let i = 0; i < 5; i++) expect((await post('/admin/login', { password: 'wrong' }, { ip })).status).toBe(401);
    const blocked = await post('/admin/login', { password: 'test-pass' }, { ip });
    expect(blocked.status).toBe(429);
    expect(blocked.data.code).toBe('rate_limited');
  });
});

describe('dashboard & orders', () => {
  it('summarises the order index', async () => {
    const a = await createOrder({ username: 'DashOne', items: [{ productId: 'money-1m', qty: 100 }] }); // $16.00
    const b = await createOrder({ username: 'DashTwo', items: [{ productId: 'skeleton-spawner', qty: 10 }] }); // $4.30
    await createOrder({ username: 'DashThree' });
    const paid = await apatch<{ order: Order }>(`/admin/orders/${a.id}`, { status: 'paid' });
    expect(paid.status).toBe(200);
    expect(paid.data.order.status).toBe('paid');
    expect(paid.data.order.payment.status).toBe('paid');
    expect(paid.data.order.timeline[paid.data.order.timeline.length - 1]).toMatchObject({ status: 'paid', note: 'Updated by admin' });
    await apatch(`/admin/orders/${b.id}`, { status: 'paid' });
    await apatch(`/admin/orders/${b.id}`, { status: 'delivered' });

    const dash = await aget('/admin/dashboard');
    expect(dash.status).toBe(200);
    expect(dash.data.counts).toMatchObject({ awaiting: 1, paid: 1, delivering: 0, delivered: 1 });
    expect(dash.data.revenueCents).toBe(a.totalCents + b.totalCents);
    expect(dash.data.today).toEqual({ orders: 3, revenueCents: a.totalCents + b.totalCents });
    expect(dash.data.recent).toHaveLength(3);
    expect(dash.data.recent[0].id).not.toBe(a.id); // newest first
    expect(dash.data.pendingReviews).toBe(0);
    expect(dash.data.activeGiveaways).toBe(0);
    expect(dash.data.integrations).toEqual({ stripe: false, paypal: false, nowpayments: false, discord: false });
  });

  it('lists, filters and searches orders with paging info', async () => {
    const all = await aget<{ orders: OrderIndexEntry[]; total: number; page: number; pageSize: number }>('/admin/orders');
    expect(all.status).toBe(200);
    expect(all.data.total).toBe(3);
    expect(all.data.page).toBe(1);
    expect(all.data.pageSize).toBe(50);
    const delivered = await aget<{ orders: OrderIndexEntry[]; total: number }>('/admin/orders?status=delivered');
    expect(delivered.data.total).toBe(1);
    expect(delivered.data.orders[0].username).toBe('DashTwo');
    const search = await aget<{ orders: OrderIndexEntry[] }>('/admin/orders?q=dashthr');
    expect(search.data.orders.map((o) => o.username)).toEqual(['DashThree']);
    const byId = await aget<{ orders: OrderIndexEntry[] }>(`/admin/orders?q=${delivered.data.orders[0].id.slice(3).toLowerCase()}`);
    expect(byId.data.orders[0].id).toBe(delivered.data.orders[0].id);
    expect((await aget('/admin/orders?status=bogus')).status).toBe(400);
    const page2 = await aget<{ orders: OrderIndexEntry[]; page: number }>('/admin/orders?page=2');
    expect(page2.data.orders).toEqual([]);
    expect(page2.data.page).toBe(2);
  });

  it('returns the full order (with private fields) and patches notes / payment status', async () => {
    const o = await createOrder({ username: 'NoteGuy', email: 'note@example.com' });
    const full = await aget<{ order: Order }>(`/admin/orders/${o.id.toLowerCase()}`);
    expect(full.status).toBe(200);
    expect(full.data.order.email).toBe('note@example.com');
    expect(full.data.order.ipHash).toMatch(/^[0-9a-f]{24}$/);

    const noted = await apatch<{ order: Order }>(`/admin/orders/${o.id}`, { adminNote: 'paid via friend', paymentStatus: 'pending_review' });
    expect(noted.data.order.adminNote).toBe('paid via friend');
    expect(noted.data.order.payment.status).toBe('pending_review');
    expect(noted.data.order.status).toBe('awaiting_payment');
    expect((await lib.orders.getOrder(o.id))!.adminNote).toBe('paid via friend');

    const cleared = await apatch<{ order: Order }>(`/admin/orders/${o.id}`, { adminNote: '' });
    expect(cleared.data.order.adminNote).toBeUndefined();

    expect((await apatch(`/admin/orders/${o.id}`, { status: 'teleported' })).status).toBe(400);
    expect((await apatch(`/admin/orders/${o.id}`, {})).status).toBe(400);
    expect((await apatch('/admin/orders/DC-ZZZZZZ', { status: 'paid' })).status).toBe(404);
    expect((await aget('/admin/orders/DC-ZZZZZZ')).status).toBe(404);
  });

  it('exports the order index as CSV', async () => {
    const res = await aget<string>('/admin/export/orders.csv');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(res.headers.get('content-disposition')).toMatch(/attachment; filename="donutcoins-orders-\d{4}-\d{2}-\d{2}\.csv"/);
    const lines = res.data.trim().split(/\r?\n/);
    expect(lines[0]).toBe('id,createdAt,updatedAt,username,status,paymentStatus,method,totalUsd,items');
    expect(lines).toHaveLength(5);
    expect(lines.some((l) => l.includes('DashTwo') && l.includes('delivered'))).toBe(true);
  });
});

describe('products', () => {
  it('returns the full catalog with override info', async () => {
    const res = await aget<{ products: Product[]; categories: unknown[]; overrides: { overrides: Record<string, unknown>; custom: Product[]; deleted: string[] } }>('/admin/products');
    expect(res.status).toBe(200);
    expect(res.data.categories.length).toBeGreaterThan(0);
    expect(res.data.products.some((p) => p.id === 'money-1m')).toBe(true);
    expect(res.data.overrides).toEqual({ overrides: {}, custom: [], deleted: [] });
  });

  it('patches price / stock / visibility through overrides', async () => {
    const res = await aput<{ product: Product }>('/admin/products/elytra', { priceCents: 2599, stock: 5, tags: ['Hot', 'Limited'] });
    expect(res.status, JSON.stringify(res.data)).toBe(200);
    expect(res.data.product).toMatchObject({ id: 'elytra', priceCents: 2599, stock: 5, tags: ['Hot', 'Limited'] });
    let pub = (await get<Catalog>('/catalog')).data.products.find((p) => p.id === 'elytra')!;
    expect(pub.priceCents).toBe(2599);
    expect(pub.stock).toBe(5);

    await aput('/admin/products/elytra', { stock: null, hidden: true });
    pub = (await get<Catalog>('/catalog')).data.products.find((p) => p.id === 'elytra')!;
    expect(pub).toBeUndefined();
    const full = (await aget<{ products: Product[] }>('/admin/products')).data.products.find((p) => p.id === 'elytra')!;
    expect(full.hidden).toBe(true);
    expect(full.stock).toBeNull();
    expect(full.priceCents).toBe(2599);

    await aput('/admin/products/elytra', { hidden: false, priceCents: 2849 });
    pub = (await get<Catalog>('/catalog')).data.products.find((p) => p.id === 'elytra')!;
    expect(pub.priceCents).toBe(2849);
  });

  it('validates patches', async () => {
    expect((await aput('/admin/products/elytra', { priceCents: -1 })).status).toBe(400);
    expect((await aput('/admin/products/elytra', { priceCents: 'cheap' })).status).toBe(400);
    expect((await aput('/admin/products/elytra', { stock: 1.5 })).status).toBe(400);
    expect((await aput('/admin/products/elytra', { tags: 'hot' })).status).toBe(400);
    expect((await aput('/admin/products/elytra', { categoryId: 'pets' })).status).toBe(400);
    expect((await aput('/admin/products/elytra', { bulkPricing: [{ minQty: 0, priceCents: 1 }] })).status).toBe(400);
    expect((await aput('/admin/products/ghost', { priceCents: 1 })).status).toBe(404);
    expect((await aput('/admin/products/elytra', [])).status).toBe(400);
  });

  it('creates, lists and deletes custom products', async () => {
    const bad = await apost('/admin/products', { name: 'No slug' });
    expect(bad.status).toBe(400);
    const dup = await apost('/admin/products', { slug: 'elytra', name: 'Elytra 2', categoryId: 'spawners', kind: 'item', priceCents: 1, image: '/img/products/elytra.svg' });
    expect(dup.status).toBe(409);

    const res = await apost<{ product: Product }>('/admin/products', {
      slug: 'blaze-rod-stack',
      name: 'Blaze Rod Stack',
      categoryId: 'investments',
      kind: 'item',
      priceCents: 120,
      image: '/img/products/_fallback.svg',
      stock: 40,
      tags: ['New'],
      shortDesc: '64 blaze rods',
    });
    expect(res.status, JSON.stringify(res.data)).toBe(201);
    expect(res.data.product).toMatchObject({ id: 'blaze-rod-stack', slug: 'blaze-rod-stack', priceCents: 120, stock: 40, kind: 'item' });

    const pub = (await get<Catalog>('/catalog')).data.products.find((p) => p.id === 'blaze-rod-stack');
    expect(pub?.name).toBe('Blaze Rod Stack');
    const adminList = await aget<{ overrides: { custom: Product[] } }>('/admin/products');
    expect(adminList.data.overrides.custom.map((p) => p.id)).toEqual(['blaze-rod-stack']);

    // custom products can be patched like any other
    const patched = await aput<{ product: Product }>('/admin/products/blaze-rod-stack', { priceCents: 99 });
    expect(patched.data.product.priceCents).toBe(99);

    const del = await adel('/admin/products/blaze-rod-stack');
    expect(del.status).toBe(200);
    expect(del.data.removed).toBe('custom');
    expect((await get<Catalog>('/catalog')).data.products.some((p) => p.id === 'blaze-rod-stack')).toBe(false);
    expect((await adel('/admin/products/blaze-rod-stack')).status).toBe(404);
  });

  it('soft-deletes default products', async () => {
    const del = await adel('/admin/products/loaded-base');
    expect(del.status).toBe(200);
    expect(del.data.removed).toBe('default');
    expect((await get<Catalog>('/catalog')).data.products.some((p) => p.id === 'loaded-base')).toBe(false);
    const overrides = await lib.catalog.getOverrides();
    expect(overrides.deleted).toEqual(['loaded-base']);
    overrides.deleted = [];
    await lib.catalog.saveOverrides(overrides);
  });
});

describe('coupons & gift codes', () => {
  it('creates, toggles and deletes coupons', async () => {
    const created = await apost<{ coupon: Coupon }>('/admin/coupons', { type: 'percent', value: 15, code: 'summer15', minOrderCents: 1000, maxUses: 3, validDays: 10, note: 'July promo' });
    expect(created.status, JSON.stringify(created.data)).toBe(201);
    expect(created.data.coupon).toMatchObject({ code: 'SUMMER15', type: 'percent', value: 15, minOrderCents: 1000, maxUses: 3, uses: 0, source: 'admin', active: true, note: 'July promo' });
    expect(Date.parse(created.data.coupon.expiresAt!)).toBeGreaterThan(Date.now() + 9 * 86400_000);

    const generated = await apost<{ coupon: Coupon }>('/admin/coupons', { type: 'fixed', value: 250, prefix: 'vip', boundUsername: 'Steve' });
    expect(generated.data.coupon.code).toMatch(/^VIP-[A-Z2-9]{8}$/);
    expect(generated.data.coupon.boundUsername).toBe('steve');

    expect((await apost('/admin/coupons', { type: 'percent', value: 150 })).status).toBe(400);
    expect((await apost('/admin/coupons', { type: 'bogo', value: 1 })).status).toBe(400);
    expect((await apost('/admin/coupons', { type: 'percent', value: 5, code: 'SUMMER15' })).status).toBe(409);
    expect((await apost('/admin/coupons', { type: 'percent', value: 5, boundUsername: 'bad name' })).status).toBe(400);

    const list = await aget<{ coupons: Coupon[] }>('/admin/coupons');
    expect(list.data.coupons.map((c) => c.code)).toEqual(expect.arrayContaining(['SUMMER15', generated.data.coupon.code]));

    const off = await apatch<{ coupon: Coupon }>('/admin/coupons/summer15', { active: false });
    expect(off.data.coupon.active).toBe(false);
    const check = await post('/coupons/validate', { code: 'SUMMER15' });
    expect(check.data.valid).toBe(false);
    expect(check.data.message).toMatch(/no longer active/);
    expect((await apatch('/admin/coupons/summer15', { active: 'yes' })).status).toBe(400);

    expect((await adel('/admin/coupons/SUMMER15')).status).toBe(200);
    expect((await adel('/admin/coupons/SUMMER15')).status).toBe(404);
    expect(await lib.coupons.getCoupon('SUMMER15')).toBeNull();
  });

  it('creates gift codes with a generated GIFT-XXXXXXXX code', async () => {
    const res = await apost<{ gift: GiftCode }>('/admin/gifts', { productId: 'skeleton-spawner', qty: 3, maxUses: 2, validDays: 5, note: 'streamer drop' });
    expect(res.status, JSON.stringify(res.data)).toBe(201);
    expect(res.data.gift.code).toMatch(/^GIFT-[A-Z2-9]{8}$/);
    expect(res.data.gift).toMatchObject({ productId: 'skeleton-spawner', qty: 3, uses: 0, maxUses: 2, note: 'streamer drop' });
    expect(Date.parse(res.data.gift.expiresAt!)).toBeGreaterThan(Date.now() + 4 * 86400_000);

    const custom = await apost<{ gift: GiftCode }>('/admin/gifts', { productId: 'money-1m', qty: 10, code: 'youtube 10m' });
    expect(custom.data.gift.code).toBe('YOUTUBE10M');
    expect(custom.data.gift.maxUses).toBeUndefined(); // blank = unlimited
    expect(custom.data.gift.expiresAt).toBeUndefined();

    expect((await apost('/admin/gifts', { productId: 'ghost', qty: 1 })).status).toBe(400);
    expect((await apost('/admin/gifts', { productId: 'money-1m', qty: 0 })).status).toBe(400);
    expect((await apost('/admin/gifts', { productId: 'money-1m', qty: 1, code: 'YOUTUBE10M' })).status).toBe(409);

    const list = await aget<{ gifts: GiftCode[] }>('/admin/gifts');
    expect(list.data.gifts.map((g) => g.code)).toEqual(expect.arrayContaining([res.data.gift.code, 'YOUTUBE10M']));

    expect((await adel('/admin/gifts/youtube10m')).status).toBe(200);
    expect((await adel('/admin/gifts/youtube10m')).status).toBe(404);
    expect((await aget<{ gifts: GiftCode[] }>('/admin/gifts')).data.gifts.some((g) => g.code === 'YOUTUBE10M')).toBe(false);
  });
});

describe('settings', () => {
  it('returns the merged settings', async () => {
    const res = await aget<SiteSettings>('/admin/settings');
    expect(res.status).toBe(200);
    expect(res.data.storeName).toBe(defaultSettings.storeName);
    expect(res.data.paymentMethods.length).toBe(defaultSettings.paymentMethods.length);
    expect(res.data.spin.prizes.length).toBe(defaultSettings.spin.prizes.length);
  });

  it('deep-merges a partial PUT and strips unknown keys', async () => {
    const res = await aput<SiteSettings>('/admin/settings', { sale: { enabled: true, percent: 15 }, storeName: 'DonutCoins Test', hacker: { pwn: true } });
    expect(res.status, JSON.stringify(res.data)).toBe(200);
    expect(res.data.sale).toEqual({ ...defaultSettings.sale, enabled: true, percent: 15 });
    expect(res.data.storeName).toBe('DonutCoins Test');
    expect(res.data).not.toHaveProperty('hacker');
    expect(res.data.spin.cooldownHours).toBe(defaultSettings.spin.cooldownHours);

    // visible publicly and in a second read
    const cfg = await get('/config');
    expect(cfg.data.sale.percent).toBe(15);
    expect(cfg.data.storeName).toBe('DonutCoins Test');
    const again = await aget<SiteSettings>('/admin/settings');
    expect(again.data.sale.label).toBe(defaultSettings.sale.label);

    // arrays are replaced, not merged
    const tiers = await aput<SiteSettings>('/admin/settings', { spendingTiers: [{ minCents: 500, percent: 2 }] });
    expect(tiers.data.spendingTiers).toEqual([{ minCents: 500, percent: 2 }]);

    await aput('/admin/settings', { sale: defaultSettings.sale, storeName: defaultSettings.storeName, spendingTiers: defaultSettings.spendingTiers });
  });

  it('rejects malformed settings', async () => {
    expect((await aput('/admin/settings', [])).status).toBe(400);
    expect((await aput('/admin/settings', { spendingTiers: 'none' })).status).toBe(400);
    expect((await aput('/admin/settings', { sale: 'on' })).status).toBe(400);
    expect((await aput('/admin/settings', { storeName: 42 })).status).toBe(400);
    expect((await aput('/admin/settings', { spin: { prizes: [{ id: 'x' }] } })).status).toBe(400);
    expect((await aput('/admin/settings', { spin: { cooldownHours: -1 } })).status).toBe(400);
    expect((await aput('/admin/settings', { reviewRewardPercent: 500 })).status).toBe(400);
    expect((await aput('/admin/settings', { unknownOnly: true })).status).toBe(400);
    expect((await aget<SiteSettings>('/admin/settings')).data.storeName).toBe(defaultSettings.storeName);
  });
});

describe('store credit', () => {
  it('adjusts and reads balances', async () => {
    const add = await apost<{ account: CreditAccount }>('/admin/credit', { username: 'CreditFan', deltaCents: 750, reason: 'Goodwill' });
    expect(add.status).toBe(200);
    expect(add.data.account).toMatchObject({ username: 'creditfan', balanceCents: 750 });
    expect(add.data.account.history[0]).toMatchObject({ deltaCents: 750, reason: 'Goodwill' });

    const sub = await apost<{ account: CreditAccount }>('/admin/credit', { username: 'creditfan', deltaCents: -1000, reason: 'Oops' });
    expect(sub.data.account.balanceCents).toBe(0); // never negative

    const read = await aget<{ account: CreditAccount }>('/admin/credit?username=CreditFan');
    expect(read.data.account.history).toHaveLength(2);
    expect((await get('/credit?username=CreditFan')).data).toEqual({ balanceCents: 0 });

    expect((await apost('/admin/credit', { username: 'CreditFan', deltaCents: 0, reason: 'zero' })).status).toBe(400);
    expect((await apost('/admin/credit', { username: 'CreditFan', deltaCents: 5 })).status).toBe(400);
    expect((await aget('/admin/credit')).status).toBe(400);
  });
});
