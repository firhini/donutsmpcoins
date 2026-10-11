import { afterAll, describe, expect, it } from 'vitest';
// api-helpers MUST be imported first – it relocates the file store before loading the API.
import { cleanupTestData, get, lib, orderBody, post, call } from './api-helpers';
import type { PublicOrder, Quote } from '../src/shared/types';
import { computeQuote } from '../src/shared/pricing';
import { products } from '../src/data/catalog';

afterAll(() => cleanupTestData());

const gifts = await import('../netlify/lib/gifts');

async function adminToken(): Promise<string> {
  const res = await post<{ token: string }>('/admin/login', { password: process.env.ADMIN_PASSWORD });
  return res.data.token;
}

describe('order integrity (review fixes)', () => {
  it('store credit cannot be spent twice by concurrent checkouts', async () => {
    await lib.credit.addCredit('Racer', 1000, 'test top-up');
    const results = await Promise.all(
      Array.from({ length: 5 }, () => post<{ order: PublicOrder }>('/orders', orderBody({ username: 'Racer', items: [{ productId: 'money-1m', qty: 50 }], applyCredit: true }))),
    );
    const created = results.filter((r) => r.status === 201);
    const rejected = results.filter((r) => r.status === 409);
    expect(created.length).toBe(1);
    expect(rejected.length).toBe(4);
    expect(created[0].data.order.creditAppliedCents).toBe(850);
    expect((await lib.credit.getCredit('Racer')).balanceCents).toBe(150);
  });

  it('single-use coupons cannot be consumed by concurrent orders', async () => {
    await lib.coupons.createCoupon({ code: 'ONCE25', type: 'percent', value: 25, source: 'admin', maxUses: 1 });
    const results = await Promise.all(Array.from({ length: 4 }, () => post<{ order: PublicOrder }>('/orders', orderBody({ username: 'CouponRacer', discountCode: 'ONCE25' }))));
    const withCoupon = results.filter((r) => r.status === 201 && r.data.order.discountCode === 'ONCE25');
    expect(withCoupon.length).toBe(1);
    expect(results.filter((r) => r.status === 409).length).toBe(3);
    expect((await lib.coupons.getCoupon('ONCE25'))?.uses).toBe(1);
  });

  it('merges duplicate cart lines so maxQty and stock apply once', () => {
    const elytra = products.find((p) => p.id === 'elytra')!;
    const q = computeQuote(products, Array.from({ length: 20 }, () => ({ productId: 'elytra', qty: 20 })));
    expect(q.lines.length).toBe(1);
    expect(q.lines[0].qty).toBe(elytra.maxQty);
  });

  it('decrements stock once for duplicate lines and refuses over-selling', async () => {
    await lib.catalog.saveOverrides({ overrides: { 'starter-base': { stock: 1 } }, custom: [], deleted: [] });
    const res = await post<{ order: PublicOrder }>('/orders', orderBody({ username: 'BaseBuyer', items: [{ productId: 'starter-base', qty: 1 }, { productId: 'starter-base', qty: 1 }] }));
    expect(res.status).toBe(201);
    expect(res.data.order.items[0].qty).toBe(1);
    const cat = await lib.catalog.getFullCatalog();
    expect(cat.products.find((p) => p.id === 'starter-base')!.stock).toBe(0);
    const again = await post('/orders', orderBody({ username: 'BaseBuyer2', items: [{ productId: 'starter-base', qty: 1 }] }));
    expect(again.status).toBe(400);
  });

  it('restores stock and credit when an order is cancelled (customer) or refunded (admin)', async () => {
    await lib.catalog.saveOverrides({ overrides: { elytra: { stock: 3 } }, custom: [], deleted: [] });
    await lib.credit.addCredit('Restorer', 300, 'test');
    const res = await post<{ order: PublicOrder }>('/orders', orderBody({ username: 'Restorer', items: [{ productId: 'elytra', qty: 3 }], applyCredit: true }));
    expect(res.status).toBe(201);
    expect((await lib.catalog.getFullCatalog()).products.find((p) => p.id === 'elytra')!.stock).toBe(0);
    expect((await lib.credit.getCredit('Restorer')).balanceCents).toBe(0);

    const cancel = await post<{ order: PublicOrder }>(`/orders/${res.data.order.id}/cancel`);
    expect(cancel.status).toBe(200);
    expect((await lib.catalog.getFullCatalog()).products.find((p) => p.id === 'elytra')!.stock).toBe(3);
    expect((await lib.credit.getCredit('Restorer')).balanceCents).toBe(300);

    // admin refund path restores too, exactly once
    const token = await adminToken();
    const o2 = await post<{ order: PublicOrder }>('/orders', orderBody({ username: 'Restorer', items: [{ productId: 'elytra', qty: 2 }], applyCredit: true }));
    expect(o2.status).toBe(201);
    expect((await lib.credit.getCredit('Restorer')).balanceCents).toBe(0);
    await call('PATCH', `/admin/orders/${o2.data.order.id}`, { status: 'paid' }, { headers: { authorization: `Bearer ${token}` } });
    await call('PATCH', `/admin/orders/${o2.data.order.id}`, { status: 'refunded' }, { headers: { authorization: `Bearer ${token}` } });
    expect((await lib.credit.getCredit('Restorer')).balanceCents).toBe(300);
    expect((await lib.catalog.getFullCatalog()).products.find((p) => p.id === 'elytra')!.stock).toBe(3);
    await call('PATCH', `/admin/orders/${o2.data.order.id}`, { status: 'cancelled' }, { headers: { authorization: `Bearer ${token}` } });
    expect((await lib.credit.getCredit('Restorer')).balanceCents).toBe(300);
  });

  it('reverts the referral reward when a paid order is refunded', async () => {
    const token = await adminToken();
    const res = await post<{ order: PublicOrder }>('/orders', orderBody({ username: 'Referred', referralCode: 'Referrer', items: [{ productId: 'money-1m', qty: 100 }] }));
    expect(res.status).toBe(201);
    expect(res.data.order.referralCode).toBe('Referrer');
    await call('PATCH', `/admin/orders/${res.data.order.id}`, { status: 'paid' }, { headers: { authorization: `Bearer ${token}` } });
    const after = (await lib.credit.getCredit('Referrer')).balanceCents;
    expect(after).toBeGreaterThan(0);
    await call('PATCH', `/admin/orders/${res.data.order.id}`, { status: 'refunded' }, { headers: { authorization: `Bearer ${token}` } });
    expect((await lib.credit.getCredit('Referrer')).balanceCents).toBe(0);
  });

  it('welcome code is accepted once per player (open orders count)', async () => {
    const first = await post<Quote>('/quote', { items: [{ productId: 'money-1m', qty: 10 }], discountCode: 'WELCOME5', username: 'Newbie' });
    expect(first.data.couponCode).toBe('WELCOME5');
    const o = await post<{ order: PublicOrder }>('/orders', orderBody({ username: 'Newbie', discountCode: 'WELCOME5', items: [{ productId: 'money-1m', qty: 10 }] }));
    expect(o.status).toBe(201);
    expect(o.data.order.discountCode).toBe('WELCOME5');
    const second = await post<Quote>('/quote', { items: [{ productId: 'money-1m', qty: 10 }], discountCode: 'WELCOME5', username: 'Newbie' });
    expect(second.data.couponCode).toBeUndefined();
    expect(second.data.warnings.join(' ')).toMatch(/first order/i);
  });

  it('caps the total discount at 60% even when sale + tier alone exceed it', () => {
    const q = computeQuote(products, [{ productId: 'elytra', qty: 1 }], { salePercent: 90, tiers: [{ minCents: 1000, percent: 12 }] });
    expect(q.totalCents).toBe(q.subtotalCents - Math.round(q.subtotalCents * 0.6));
    expect(q.warnings).toContain('Discounts are capped at 60%.');
    const q2 = computeQuote(products, [{ productId: 'elytra', qty: 1 }], { salePercent: 10, tiers: [{ minCents: 1000, percent: 12 }] });
    expect(q2.warnings).not.toContain('Discounts are capped at 60%.');
  });

  it('gift codes with maxUses 1 produce exactly one free order under concurrency', async () => {
    const gift = await gifts.createGift({ productId: 'skeleton-spawner', qty: 2, maxUses: 1 });
    const results = await Promise.all(['GiftA', 'GiftB', 'GiftC'].map((u) => post<{ order: PublicOrder }>('/redeem', { code: gift.code, username: u })));
    expect(results.filter((r) => r.status === 201).length).toBe(1);
    expect((await gifts.getGift(gift.code))?.uses).toBe(1);
    // the same player cannot redeem twice
    const winner = results.find((r) => r.status === 201)!.data.order.username;
    const again = await post('/redeem', { code: gift.code, username: winner });
    expect([409, 410]).toContain(again.status);
  });

  it('does not revive a cancelled order when a provider confirms payment later', async () => {
    const res = await post<{ order: PublicOrder }>('/orders', orderBody({ username: 'LatePayer' }));
    await post(`/orders/${res.data.order.id}/cancel`);
    const order = (await lib.orders.getOrder(res.data.order.id))!;
    const common = await import('../netlify/lib/payments/common');
    const marked = await common.markPaid(order, 'Test provider confirmation');
    expect(marked.order.status).toBe('cancelled');
    expect(marked.order.payment.status).toBe('pending_review');
    expect((await get(`/orders/${order.id}`)).data.order.status).toBe('cancelled');
  });
});
