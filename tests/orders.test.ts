import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
// api-helpers MUST be imported first – it relocates the file store before loading the API.
import { call, cleanupTestData, get, lib, orderBody, post } from './api-helpers';
import { defaultSettings } from '../src/data/settings';
import { products as defaultProducts } from '../src/data/catalog';
import type { Catalog, PublicConfig, PublicOrder, Quote, SiteStats } from '../src/shared/types';

afterAll(() => cleanupTestData());

async function createOrder(overrides: Record<string, unknown> = {}, ip?: string): Promise<PublicOrder> {
  const res = await post<{ order: PublicOrder }>('/orders', orderBody(overrides), { ip });
  expect(res.status, JSON.stringify(res.data)).toBe(201);
  return res.data.order;
}

describe('GET /catalog, /config, /stats, /products/:id/odds', () => {
  it('serves the public catalog with a short cache header', async () => {
    const res = await get<Catalog>('/catalog');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('max-age=30');
    expect(res.data.categories.length).toBeGreaterThan(0);
    expect(res.data.products.length).toBe(defaultProducts.filter((p) => !p.hidden).length);
    expect(res.data.products.some((p) => p.hidden)).toBe(false);
  });

  it('exposes only usable payment methods and no secrets in /config', async () => {
    const res = await get<PublicConfig>('/config');
    expect(res.status).toBe(200);
    expect(res.data.storeName).toBe(defaultSettings.storeName);
    const ids = res.data.paymentMethods.map((m) => m.id);
    expect(ids).toEqual(expect.arrayContaining(['paypal', 'crypto-ltc']));
    expect(ids).not.toContain('stripe'); // no key configured → not usable
    for (const m of res.data.paymentMethods) {
      expect(m).not.toHaveProperty('handle');
      expect(m).not.toHaveProperty('instructions');
    }
    expect(res.data.integrations).toEqual({ stripe: false, paypal: false, nowpayments: false, discord: false });
  });

  it('returns live stats (zero on a fresh store)', async () => {
    const res = await get<SiteStats>('/stats');
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ ordersDelivered: 0, reviewCount: 0, averageRating: 0 });
  });

  it('prefers the _stats document written by the social module', async () => {
    await lib.store.kvSet('reviews', '_stats', { count: 7, averageRating: 4.86 });
    const res = await get<SiteStats>('/stats');
    expect(res.data.reviewCount).toBe(7);
    expect(res.data.averageRating).toBe(4.9);
    await lib.store.kvDelete('reviews', '_stats');
  });

  it('computes box odds', async () => {
    const res = await get<{ odds: { name: string; percent: number }[]; rolls: number }>('/products/mystery-box/odds');
    expect(res.status).toBe(200);
    expect(res.data.rolls).toBe(3);
    const elytra = res.data.odds.find((o) => o.name === 'Elytra');
    expect(elytra?.percent).toBeGreaterThan(0);
    expect(elytra?.percent).toBeLessThan(5);
    const sum = res.data.odds.reduce((s, o) => s + o.percent, 0);
    expect(Math.abs(sum - 100)).toBeLessThan(1);
    expect((await get('/products/not-a-product/odds')).status).toBe(404);
  });
});

describe('POST /quote', () => {
  it('prices the cart server-side with bulk tiers', async () => {
    const res = await post<Quote>('/quote', { items: [{ productId: 'money-1m', qty: 50 }] });
    expect(res.status).toBe(200);
    expect(res.data.subtotalCents).toBe(850);
    expect(res.data.lines[0]).toMatchObject({ unitPriceCents: 17, bulkApplied: true });
    expect(res.data.totalCents).toBe(850);
    expect(res.data.nextTier).toEqual({ minCents: 1500, percent: 5, missingCents: 650 });
  });

  it('looks up coupons and reports unknown ones', async () => {
    await lib.coupons.createCoupon({ code: 'TEST10', type: 'percent', value: 10, source: 'admin' });
    const ok = await post<Quote>('/quote', { items: [{ productId: 'money-1m', qty: 50 }], discountCode: 'test10' });
    expect(ok.data.couponCode).toBe('TEST10');
    expect(ok.data.couponDiscountCents).toBe(85);
    expect(ok.data.totalCents).toBe(765);
    const bad = await post<Quote>('/quote', { items: [{ productId: 'money-1m', qty: 50 }], discountCode: 'NOPE' });
    expect(bad.data.couponDiscountCents).toBe(0);
    expect(bad.data.warnings).toContain('Unknown discount code.');
  });

  it('rejects malformed carts', async () => {
    expect((await post('/quote', { items: [{ productId: 'money-1m', qty: 'ten' }] })).status).toBe(400);
    expect((await post('/quote', { items: 'nope' })).status).toBe(400);
    const empty = await post<Quote>('/quote', {});
    expect(empty.status).toBe(200);
    expect(empty.data.totalCents).toBe(0);
  });
});

describe('POST /orders (manual payment)', () => {
  it('creates an awaiting_payment order with rendered instructions', async () => {
    const order = await createOrder({ email: 'buyer@example.com', customerNote: 'hi there' });
    expect(order.id).toMatch(/^DC-[A-Z2-9]{6}$/);
    expect(order.status).toBe('awaiting_payment');
    expect(order.username).toBe('TestPlayer');
    expect(order.totalCents).toBe(850);
    expect(order.payment).toMatchObject({ methodId: 'paypal', type: 'manual', status: 'unpaid' });
    expect(order.payment.instructions).toContain('$8.50');
    expect(order.payment.instructions).toContain(order.id);
    expect(order.payment.instructions).toContain('YourPayPalName');
    expect(order.payment.payLink).toBe('https://paypal.me/YourPayPalName/8.50USD');
    expect(order.timeline[0]).toMatchObject({ status: 'awaiting_payment' });
    expect(order.items[0]).toMatchObject({ productId: 'money-1m', qty: 50, unitPriceCents: 17, lineTotalCents: 850, moneyMillions: 1 });
    expect(order.customerNote).toBe('hi there');

    // public view hides private fields but keeps a masked e-mail
    expect(order).not.toHaveProperty('ipHash');
    expect(order).not.toHaveProperty('deviceId');
    expect(order).not.toHaveProperty('adminNote');
    expect(order).not.toHaveProperty('email');
    expect(order.emailMasked).toBe('bu***@example.com');

    // …while the stored order carries the hashed ip
    const stored = await lib.orders.getOrder(order.id);
    expect(stored?.ipHash).toMatch(/^[0-9a-f]{24}$/);
    expect(stored?.email).toBe('buyer@example.com');
    expect(stored?.source).toBe('checkout');
  });

  it('requires accepting the terms', async () => {
    const res = await post('/orders', orderBody({ tosAccepted: false }));
    expect(res.status).toBe(400);
    expect(res.data.code).toBe('tos_required');
    expect((await post('/orders', orderBody({ tosAccepted: undefined }))).status).toBe(400);
  });

  it('rejects invalid usernames and bodies', async () => {
    const bad = await post('/orders', orderBody({ username: 'bad name!' }));
    expect(bad.status).toBe(400);
    expect(bad.data.error).toMatch(/3–16 letters/);
    expect((await post('/orders', orderBody({ username: 'ab' }))).status).toBe(400);
    expect((await post('/orders', orderBody({ username: '' }))).status).toBe(400);
    expect((await post('/orders', orderBody({ items: [] }))).status).toBe(400);
    expect((await post('/orders', orderBody({ items: [{ productId: 'money-1m', qty: 0 }] }))).status).toBe(400);
    expect((await post('/orders', orderBody({ email: 'not-an-email' }))).status).toBe(400);
    expect((await post('/orders', orderBody({ paymentMethodId: 'stripe' }))).status).toBe(400); // not usable
    expect((await post('/orders', orderBody({ paymentMethodId: undefined }))).status).toBe(400);
    expect((await post('/orders', orderBody({ items: [{ productId: 'ghost', qty: 1 }] }))).status).toBe(400);
    expect((await call('POST', '/orders', undefined, { rawBody: '{not json' })).status).toBe(400);
  });

  it('turns a fully credit-covered order into a free, paid order and consumes the credit', async () => {
    await lib.credit.addCredit('CreditKing', 2000, 'test top-up');
    const order = await createOrder({ username: 'CreditKing', items: [{ productId: 'money-1m', qty: 10 }], applyCredit: true });
    expect(order.status).toBe('paid');
    expect(order.totalCents).toBe(0);
    expect(order.payment.type).toBe('free');
    expect(order.payment.status).toBe('paid');
    expect(order.creditAppliedCents).toBe(180);
    expect(order.quote.creditAppliedCents).toBe(180);
    expect((await lib.credit.getCredit('CreditKing')).balanceCents).toBe(1820);
  });

  it('rate limits order creation per IP (10 / 10 min)', async () => {
    const ip = '203.0.113.9';
    for (let i = 0; i < 10; i++) {
      const res = await post('/orders', orderBody({ username: `Spammer${i}` }), { ip });
      expect(res.status).toBe(201);
    }
    const blocked = await post('/orders', orderBody({ username: 'Spammer10' }), { ip });
    expect(blocked.status).toBe(429);
    expect(blocked.data.code).toBe('rate_limited');
  });

  it('decrements stock and refuses sold-out items', async () => {
    const overrides = await lib.catalog.getOverrides();
    overrides.overrides.elytra = { ...(overrides.overrides.elytra ?? {}), stock: 3 };
    await lib.catalog.saveOverrides(overrides);

    await createOrder({ username: 'Flyer', items: [{ productId: 'elytra', qty: 2 }] });
    let catalog = (await get<Catalog>('/catalog')).data;
    expect(catalog.products.find((p) => p.id === 'elytra')?.stock).toBe(1);

    // asking for more than is left clamps to the remaining stock
    const last = await createOrder({ username: 'Flyer2', items: [{ productId: 'elytra', qty: 5 }] });
    expect(last.items[0].qty).toBe(1);
    catalog = (await get<Catalog>('/catalog')).data;
    expect(catalog.products.find((p) => p.id === 'elytra')?.stock).toBe(0);

    const soldOut = await post('/orders', orderBody({ username: 'Flyer3', items: [{ productId: 'elytra', qty: 1 }] }));
    expect(soldOut.status).toBe(400);
    expect(soldOut.data.error).toMatch(/sold out/i);
  });

  it('rolls mystery boxes server-side and records fixed kit contents', async () => {
    const order = await createOrder({ username: 'Gambler', items: [{ productId: 'mystery-box', qty: 2 }, { productId: 'legendary-crate', qty: 1 }, { productId: 'pvp-kit', qty: 1 }, { productId: 'starter-bundle', qty: 1 }] });
    const box = order.items.find((i) => i.productId === 'mystery-box')!;
    expect(box.rolled).toHaveLength(2);
    const pool = defaultProducts.find((p) => p.id === 'mystery-box')!.contents!;
    for (const roll of box.rolled!) {
      expect(roll).toHaveLength(3);
      for (const drop of roll) {
        const line = pool.find((c) => c.name === drop.name)!;
        expect(line).toBeDefined();
        expect(drop.qty).toBeGreaterThanOrEqual(line.min);
        expect(drop.qty).toBeLessThanOrEqual(line.max);
      }
      // no duplicate lines within one box (drawn without replacement)
      expect(new Set(roll.map((d) => d.name)).size).toBe(roll.length);
    }

    const crate = order.items.find((i) => i.productId === 'legendary-crate')!;
    expect(crate.rolled![0].map((d) => d.name)).toEqual(expect.arrayContaining(['Elytra (guaranteed)', '50M Money (guaranteed)']));
    expect(crate.rolled![0]).toHaveLength(8); // 2 guaranteed + 6 rolls

    const kit = order.items.find((i) => i.productId === 'pvp-kit')!;
    expect(kit.contents?.map((c) => c.name)).toContain('Totem of Undying');
    const bundle = order.items.find((i) => i.productId === 'starter-bundle')!;
    expect(bundle.contents?.map((c) => c.name)).toEqual(['20M Money', 'Skeleton Spawner', 'Diamond Armor Shulker']);
  });
});

describe('GET /orders/:id', () => {
  it('returns the public view (case-insensitive id) and 404 for unknown orders', async () => {
    const created = await createOrder({ email: 'someone@example.com' });
    const res = await get<{ order: PublicOrder }>(`/orders/${created.id.toLowerCase()}`);
    expect(res.status).toBe(200);
    expect(res.data.order.id).toBe(created.id);
    expect(res.data.order).not.toHaveProperty('email');
    expect(res.data.order).not.toHaveProperty('ipHash');
    expect(res.data.order.emailMasked).toBe('so***@example.com');
    expect((await get('/orders/DC-ZZZZZZ')).status).toBe(404);
    expect((await get('/orders/whatever')).status).toBe(404);
  });
});

describe('POST /orders/:id/reference', () => {
  it('stores the reference and moves the payment to pending_review', async () => {
    const order = await createOrder();
    const res = await post<{ order: PublicOrder }>(`/orders/${order.id}/reference`, { reference: 'TX-ABC-123', note: 'paid from my mum' });
    expect(res.status).toBe(200);
    expect(res.data.order.status).toBe('awaiting_payment');
    expect(res.data.order.payment).toMatchObject({ status: 'pending_review', reference: 'TX-ABC-123', referenceNote: 'paid from my mum' });
    const last = res.data.order.timeline[res.data.order.timeline.length - 1];
    expect(last.status).toBe('payment_reference');
    expect(last.note).toContain('TX-ABC-123');

    // can be corrected while still unpaid
    const again = await post<{ order: PublicOrder }>(`/orders/${order.id}/reference`, { reference: 'TX-ABC-124' });
    expect(again.status).toBe(200);
    expect(again.data.order.payment.reference).toBe('TX-ABC-124');
  });

  it('validates the reference and refuses paid / unknown orders', async () => {
    const order = await createOrder();
    expect((await post(`/orders/${order.id}/reference`, { reference: 'ab' })).status).toBe(400);
    expect((await post(`/orders/${order.id}/reference`, {})).status).toBe(400);
    expect((await post('/orders/DC-ZZZZZZ/reference', { reference: 'TX-1' })).status).toBe(404);

    const stored = (await lib.orders.getOrder(order.id))!;
    await lib.orders.setOrderStatus(stored, 'paid', 'test');
    const paid = await post(`/orders/${order.id}/reference`, { reference: 'TX-late' });
    expect(paid.status).toBe(409);
    expect(paid.data.code).toBe('already_paid');
  });
});

describe('POST /orders/:id/cancel', () => {
  it('cancels an unpaid order and returns applied store credit', async () => {
    await lib.credit.addCredit('Canceller', 500, 'test top-up');
    const order = await createOrder({ username: 'Canceller', applyCredit: true });
    expect(order.status).toBe('awaiting_payment');
    expect(order.creditAppliedCents).toBe(500);
    expect(order.totalCents).toBe(350);
    expect((await lib.credit.getCredit('Canceller')).balanceCents).toBe(0);

    const res = await post<{ order: PublicOrder }>(`/orders/${order.id}/cancel`);
    expect(res.status).toBe(200);
    expect(res.data.order.status).toBe('cancelled');
    expect(res.data.order.timeline.some((t) => t.status === 'cancelled' && t.note === 'Cancelled by customer')).toBe(true);
    expect(res.data.order.creditRestored).toBe(true);
    const credit = await lib.credit.getCredit('Canceller');
    expect(credit.balanceCents).toBe(500);
    expect(credit.history[0]).toMatchObject({ deltaCents: 500, orderId: order.id });

    expect((await post(`/orders/${order.id}/cancel`)).status).toBe(409);
    expect((await post(`/orders/${order.id}/reference`, { reference: 'TX-after-cancel' })).status).toBe(409);
  });

  it('refuses to cancel paid orders and orders with a reported payment', async () => {
    const reported = await createOrder();
    await post(`/orders/${reported.id}/reference`, { reference: 'TX-999' });
    const res = await post(`/orders/${reported.id}/cancel`);
    expect(res.status).toBe(409);
    expect(res.data.code).toBe('pending_review');

    const paidOrder = await createOrder();
    await lib.orders.setOrderStatus((await lib.orders.getOrder(paidOrder.id))!, 'paid', 'test');
    expect((await post(`/orders/${paidOrder.id}/cancel`)).data.code).toBe('already_paid');
    expect((await post('/orders/DC-ZZZZZZ/cancel')).status).toBe(404);
  });
});

describe('POST /mc/validate', () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeAll(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => fetchMock.mockReset());
  afterAll(() => vi.unstubAllGlobals());

  it('rejects bad syntax before asking Mojang', async () => {
    const res = await post('/mc/validate', { username: 'ab' });
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('confirms an existing account and caches the result', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: '069a79f444e94726a5befca90e38aaf5', name: 'Notch' }), { status: 200 }));
    const res = await post('/mc/validate', { username: 'notch' });
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ valid: true, name: 'Notch', uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://api.mojang.com/users/profiles/minecraft/notch');

    const cached = await post('/mc/validate', { username: 'NOTCH' });
    expect(cached.data.name).toBe('Notch');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports unknown names', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ errorMessage: "Couldn't find any profile" }), { status: 404 }));
    const res = await post('/mc/validate', { username: 'NotRealName_99' });
    expect(res.data.valid).toBe(false);
    expect(res.data.reason).toMatch(/not found|no minecraft/i);
  });

  it('degrades to unverified when Mojang is unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    const res = await post('/mc/validate', { username: 'SomeoneElse' });
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ valid: true, name: 'SomeoneElse', unverified: true });

    fetchMock.mockResolvedValueOnce(new Response('', { status: 429 }));
    const limited = await post('/mc/validate', { username: 'SomeoneElse' });
    expect(limited.data.unverified).toBe(true);
  });
});

describe('payment integrations', () => {
  it('answer 503 while not configured', async () => {
    const order = await createOrder();
    const stripe = await post(`/payments/stripe/session`, { orderId: order.id });
    expect(stripe.status).toBe(503);
    expect(stripe.data.error).toBe('Stripe is not configured');
    expect((await post('/payments/paypal/create', { orderId: order.id })).status).toBe(503);
    expect((await post('/payments/paypal/capture', { orderId: order.id, paypalOrderId: 'X' })).status).toBe(503);
    expect((await post('/payments/nowpayments/invoice', { orderId: order.id })).status).toBe(503);
    expect((await post('/payments/nowpayments/ipn', {})).status).toBe(503);
    expect((await post('/payments/stripe/webhook', {})).status).toBe(503);
  });

  it('stripe/verify is harmless for manual orders', async () => {
    const order = await createOrder();
    const res = await get(`/payments/stripe/verify?orderId=${order.id}`);
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ paid: false, status: 'awaiting_payment' });
    expect((await get('/payments/stripe/verify?orderId=DC-ZZZZZZ')).status).toBe(404);
    expect((await get('/payments/stripe/verify')).status).toBe(400);
  });

  describe('with keys configured', () => {
    beforeAll(async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_dummy';
      process.env.NOWPAYMENTS_API_KEY = 'np_dummy';
      process.env.NOWPAYMENTS_IPN_SECRET = 'ipn-secret';
      await lib.settings.saveSettings({
        paymentMethods: defaultSettings.paymentMethods.map((m) => ({ ...m, enabled: m.enabled || m.type === 'stripe' || m.type === 'nowpayments' })),
      });
    });
    afterAll(async () => {
      for (const k of ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'NOWPAYMENTS_API_KEY', 'NOWPAYMENTS_IPN_SECRET']) delete process.env[k];
      await lib.settings.saveSettings({ paymentMethods: defaultSettings.paymentMethods });
    });

    it('marks an order paid from a signed Stripe webhook, exactly once', async () => {
      const order = await createOrder({ username: 'CardUser', paymentMethodId: 'stripe' });
      expect(order.payment.type).toBe('stripe');
      const session = { id: 'cs_test_123', object: 'checkout.session', payment_status: 'paid', amount_total: order.totalCents, metadata: { orderId: order.id }, client_reference_id: order.id, payment_intent: 'pi_test_1' };
      const payload = JSON.stringify({ id: 'evt_1', object: 'event', type: 'checkout.session.completed', data: { object: session } });
      const header = lib.stripe.getStripe().webhooks.generateTestHeaderString({ payload, secret: 'whsec_test_dummy' });

      const unsigned = await call('POST', '/payments/stripe/webhook', undefined, { rawBody: payload, headers: { 'stripe-signature': 't=1,v1=bad' } });
      expect(unsigned.status).toBe(400);

      const res = await call('POST', '/payments/stripe/webhook', undefined, { rawBody: payload, headers: { 'stripe-signature': header } });
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ received: true, paid: true });
      const stored = (await lib.orders.getOrder(order.id))!;
      expect(stored.status).toBe('paid');
      expect(stored.payment).toMatchObject({ status: 'paid', providerId: 'cs_test_123', reference: 'pi_test_1' });
      expect(stored.payment.paidAt).toBeTruthy();
      const paidEntries = stored.timeline.filter((t) => t.status === 'paid').length;

      // replayed webhook → no second "paid" transition
      const replay = await call('POST', '/payments/stripe/webhook', undefined, { rawBody: payload, headers: { 'stripe-signature': header } });
      expect(replay.status).toBe(200);
      expect((await lib.orders.getOrder(order.id))!.timeline.filter((t) => t.status === 'paid').length).toBe(paidEntries);

      const verify = await get(`/payments/stripe/verify?orderId=${order.id}`);
      expect(verify.data).toEqual({ paid: true, status: 'paid' });
    });

    it('flags a Stripe payment whose amount does not match instead of marking it paid', async () => {
      const order = await createOrder({ username: 'CardUser2', paymentMethodId: 'stripe' });
      const session = { id: 'cs_test_456', object: 'checkout.session', payment_status: 'paid', amount_total: order.totalCents - 100, metadata: { orderId: order.id } };
      const payload = JSON.stringify({ id: 'evt_2', object: 'event', type: 'checkout.session.completed', data: { object: session } });
      const header = lib.stripe.getStripe().webhooks.generateTestHeaderString({ payload, secret: 'whsec_test_dummy' });
      const res = await call('POST', '/payments/stripe/webhook', undefined, { rawBody: payload, headers: { 'stripe-signature': header } });
      expect(res.data).toEqual({ received: true, paid: false });
      const stored = (await lib.orders.getOrder(order.id))!;
      expect(stored.status).toBe('awaiting_payment');
      expect(stored.payment.status).toBe('pending_review');
      expect(stored.timeline[stored.timeline.length - 1].note).toMatch(/review manually/);
    });

    it('confirms a NOWPayments IPN only with a valid signature and matching amount', async () => {
      const order = await createOrder({ username: 'CryptoUser', paymentMethodId: 'nowpayments' });
      expect(order.payment.type).toBe('nowpayments');
      const ipn = { payment_id: 987654321, invoice_id: 555, payment_status: 'finished', order_id: order.id, price_amount: order.totalCents / 100, price_currency: 'usd', pay_amount: 0.0123, actually_paid: 0.0123, pay_currency: 'ltc', outcome_amount: 0.0121, outcome_currency: 'ltc' };
      const raw = JSON.stringify(ipn);

      const forged = await call('POST', '/payments/nowpayments/ipn', undefined, { rawBody: raw, headers: { 'x-nowpayments-sig': lib.nowpayments.signIpn(ipn, 'wrong-secret') } });
      expect(forged.status).toBe(401);
      expect((await lib.orders.getOrder(order.id))!.status).toBe('awaiting_payment');

      // underpaid → flagged for review, not paid
      const partial = { ...ipn, payment_status: 'partially_paid', actually_paid: 0.005 };
      const partialRes = await call('POST', '/payments/nowpayments/ipn', undefined, { rawBody: JSON.stringify(partial), headers: { 'x-nowpayments-sig': lib.nowpayments.signIpn(partial, 'ipn-secret') } });
      expect(partialRes.status).toBe(200);
      expect((await lib.orders.getOrder(order.id))!.payment.status).toBe('pending_review');

      // wrong price (someone paying a cheaper invoice) → flagged, not paid
      const cheap = { ...ipn, price_amount: 0.5 };
      await call('POST', '/payments/nowpayments/ipn', undefined, { rawBody: JSON.stringify(cheap), headers: { 'x-nowpayments-sig': lib.nowpayments.signIpn(cheap, 'ipn-secret') } });
      expect((await lib.orders.getOrder(order.id))!.status).toBe('awaiting_payment');

      const ok = await call('POST', '/payments/nowpayments/ipn', undefined, { rawBody: raw, headers: { 'x-nowpayments-sig': lib.nowpayments.signIpn(ipn, 'ipn-secret') } });
      expect(ok.status).toBe(200);
      expect(ok.data).toEqual({ ok: true, paid: true });
      const stored = (await lib.orders.getOrder(order.id))!;
      expect(stored.status).toBe('paid');
      expect(stored.payment).toMatchObject({ status: 'paid', providerId: '555', reference: '987654321' });

      // replay is a no-op
      const replay = await call('POST', '/payments/nowpayments/ipn', undefined, { rawBody: raw, headers: { 'x-nowpayments-sig': lib.nowpayments.signIpn(ipn, 'ipn-secret') } });
      expect(replay.data).toEqual({ ok: true, paid: true });
      expect((await lib.orders.getOrder(order.id))!.timeline.filter((t) => t.status === 'paid')).toHaveLength(1);
    });

    it('verifies the IPN signature the way the official NOWPayments sample does', () => {
      const body = { b: 1, a: 'x', payment_status: 'finished' };
      const official = lib.nowpayments.signIpn(body, 's');
      expect(lib.nowpayments.verifyIpnSignature(body, official, 's')).toBe(true);
      expect(lib.nowpayments.verifyIpnSignature(body, official.toUpperCase(), 's')).toBe(true);
      expect(lib.nowpayments.verifyIpnSignature(body, 'ff'.repeat(64), 's')).toBe(false);
      expect(lib.nowpayments.verifyIpnSignature(body, official, undefined)).toBe(false);
    });
  });
});
