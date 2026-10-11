import { afterAll, afterEach, describe, expect, it } from 'vitest';
// api-helpers MUST be imported first – it relocates the file store before loading the API.
import { cleanupTestData, freshIp, get, lib, orderBody, post } from './api-helpers';
import { defaultSettings } from '../src/data/settings';
import type { PublicOrder, SpinPrize, SpinResult, SpinStatus } from '../src/shared/types';

process.env.ADMIN_PASSWORD = 'test-pass';
// loaded after api-helpers relocated the store (same rule as the libs it re-exports)
const gifts = await import('../netlify/lib/gifts');

afterAll(() => cleanupTestData());

let deviceCounter = 0;
const freshDevice = () => `dev-${++deviceCounter}-${Math.random().toString(36).slice(2, 10)}`;

async function setPrizes(prizes: SpinPrize[], extra: Partial<typeof defaultSettings.spin> = {}): Promise<void> {
  await lib.settings.saveSettings({ spin: { ...defaultSettings.spin, ...extra, prizes } });
}

async function spin(username?: string, opts: { ip?: string; deviceId?: string } = {}) {
  return post<SpinResult & { error?: string; code?: string; nextSpinAt?: string }>('/spin', { deviceId: opts.deviceId ?? freshDevice(), username }, { ip: opts.ip ?? freshIp() });
}

describe('POST /coupons/validate', () => {
  it('reports unknown codes without leaking anything', async () => {
    const res = await post('/coupons/validate', { code: 'NOPE123' });
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ valid: false, message: expect.stringMatching(/unknown/i) });
    expect((await post('/coupons/validate', {})).status).toBe(400);
    expect((await post('/coupons/validate', { code: 'X', username: 'bad name' })).status).toBe(400);
  });

  it('validates active coupons with min order, expiry and bound usernames', async () => {
    await lib.coupons.createCoupon({ code: 'SAVE10', type: 'percent', value: 10, source: 'admin', minOrderCents: 1000 });
    const ok = await post('/coupons/validate', { code: 'save10', subtotalCents: 1500 });
    expect(ok.data.valid).toBe(true);
    expect(ok.data.coupon).toEqual({ code: 'SAVE10', type: 'percent', value: 10, minOrderCents: 1000, expiresAt: undefined });
    expect(ok.data.message).toMatch(/10% off/);

    const low = await post('/coupons/validate', { code: 'SAVE10', subtotalCents: 500 });
    expect(low.data.valid).toBe(false);
    expect(low.data.message).toMatch(/minimum order of \$10\.00/);

    await lib.coupons.createCoupon({ code: 'OLD', type: 'fixed', value: 300, source: 'admin', validDays: 1 });
    const old = await lib.coupons.getCoupon('OLD');
    old!.expiresAt = new Date(Date.now() - 1000).toISOString();
    await lib.coupons.saveCoupon(old!);
    expect((await post('/coupons/validate', { code: 'OLD' })).data.message).toMatch(/expired/);

    await lib.coupons.createCoupon({ code: 'USED', type: 'percent', value: 5, source: 'admin', maxUses: 1 });
    await lib.coupons.consumeCoupon('USED');
    expect((await post('/coupons/validate', { code: 'USED' })).data.message).toMatch(/already been used/);

    await lib.coupons.createCoupon({ code: 'MINE', type: 'percent', value: 5, source: 'spin', boundUsername: 'Steve' });
    expect((await post('/coupons/validate', { code: 'MINE', username: 'steve' })).data.valid).toBe(true);
    const other = await post('/coupons/validate', { code: 'MINE', username: 'Alex' });
    expect(other.data.valid).toBe(false);
    expect(other.data.message).toMatch(/different Minecraft account/);
    const anon = await post('/coupons/validate', { code: 'MINE' });
    expect(anon.data.valid).toBe(true);
    expect(anon.data.message).toMatch(/bound to steve/);
  });

  it('materialises the welcome coupon from settings and limits it to first orders', async () => {
    expect(await lib.coupons.getCoupon('WELCOME5')).toBeNull();
    const res = await post('/coupons/validate', { code: 'welcome5', username: 'Newbie' });
    expect(res.data.valid).toBe(true);
    expect(res.data.coupon).toMatchObject({ code: 'WELCOME5', type: 'percent', value: 5 });
    const stored = await lib.coupons.getCoupon('WELCOME5');
    expect(stored).toMatchObject({ source: 'welcome', active: true, value: 5 });

    // now the quote endpoint (outside this module) also finds it
    const quote = await post('/quote', { items: [{ productId: 'money-1m', qty: 50 }], discountCode: 'WELCOME5', username: 'Newbie' });
    expect(quote.data.couponCode).toBe('WELCOME5');

    const order = await post<{ order: PublicOrder }>('/orders', orderBody({ username: 'Newbie' }));
    await lib.orders.setOrderStatus((await lib.orders.getOrder(order.data.order.id))!, 'paid', 'test');
    const again = await post('/coupons/validate', { code: 'WELCOME5', username: 'newbie' });
    expect(again.data.valid).toBe(false);
    expect(again.data.message).toMatch(/first order/);
    expect((await post('/coupons/validate', { code: 'WELCOME5', username: 'SomeoneNew' })).data.valid).toBe(true);
  });

  it('rate limits validation attempts', async () => {
    const ip = freshIp();
    for (let i = 0; i < 30; i++) await post('/coupons/validate', { code: `GUESS${i}` }, { ip });
    expect((await post('/coupons/validate', { code: 'GUESS31' }, { ip })).status).toBe(429);
  });
});

describe('spin wheel', () => {
  afterEach(async () => {
    await lib.settings.saveSettings({ spin: defaultSettings.spin });
  });

  it('GET /spin/status hides prize weights', async () => {
    const res = await get<SpinStatus>(`/spin/status?deviceId=${freshDevice()}`);
    expect(res.status).toBe(200);
    expect(res.data.enabled).toBe(true);
    expect(res.data.canSpin).toBe(true);
    expect(res.data.nextSpinAt).toBeUndefined();
    expect(res.data.cooldownHours).toBe(defaultSettings.spin.cooldownHours);
    expect(res.data.prizes).toHaveLength(defaultSettings.spin.prizes.length);
    for (const p of res.data.prizes) expect(p).not.toHaveProperty('weight');
    expect(res.data.prizes.map((p) => p.id)).toEqual(defaultSettings.spin.prizes.map((p) => p.id));
  });

  it('requires a username when the wheel says so, and a deviceId always', async () => {
    const res = await spin(undefined);
    expect(res.status).toBe(400);
    expect(res.data.code).toBe('username_required');
    expect(res.data.error).toMatch(/username/i);
    expect((await post('/spin', { username: 'Steve' })).status).toBe(400);
    expect((await post('/spin', { deviceId: freshDevice(), username: 'no spaces!' })).status).toBe(400);
    // nothing was recorded for the failed attempts
    expect((await get<SpinStatus>(`/spin/status?deviceId=${freshDevice()}`)).data.canSpin).toBe(true);
  });

  it('spins, records the cooldown for ip AND device, and refuses a second spin', async () => {
    const ip = freshIp();
    const deviceId = freshDevice();
    const res = await spin('Spinner', { ip, deviceId });
    expect(res.status, JSON.stringify(res.data)).toBe(200);
    expect(res.data.prize).not.toHaveProperty('weight');
    expect(defaultSettings.spin.prizes.map((p) => p.id)).toContain(res.data.prize.id.replace(/-coupon$/, ''));
    expect(res.data.index).toBeGreaterThanOrEqual(0);
    expect(res.data.index).toBeLessThan(defaultSettings.spin.prizes.length);
    expect(res.data.message.length).toBeGreaterThan(10);
    expect(Date.parse(res.data.nextSpinAt)).toBeGreaterThan(Date.now() + 23 * 3600_000);

    const status = await get<SpinStatus>(`/spin/status?deviceId=${deviceId}`, { ip });
    expect(status.data.canSpin).toBe(false);
    expect(status.data.nextSpinAt).toBe(res.data.nextSpinAt);

    const again = await spin('Spinner', { ip, deviceId });
    expect(again.status).toBe(429);
    expect(again.data.code).toBe('cooldown');
    expect(again.data.nextSpinAt).toBe(res.data.nextSpinAt);

    // new device, same ip → still blocked
    const otherDevice = await spin('Spinner', { ip, deviceId: freshDevice() });
    expect(otherDevice.status).toBe(429);
    expect((await get<SpinStatus>(`/spin/status?deviceId=${freshDevice()}`, { ip })).data.canSpin).toBe(false);
    // same device, new ip → still blocked
    expect((await spin('Spinner', { ip: freshIp(), deviceId })).status).toBe(429);
    expect((await get<SpinStatus>(`/spin/status?deviceId=${deviceId}`, { ip: freshIp() })).data.canSpin).toBe(false);
    // genuinely new visitor → fine
    expect((await get<SpinStatus>(`/spin/status?deviceId=${freshDevice()}`, { ip: freshIp() })).data.canSpin).toBe(true);
  });

  it('creates a bound SPIN coupon', async () => {
    await setPrizes([{ id: 'c10', label: '10% OFF', type: 'coupon', percent: 10, weight: 1, validDays: 3, minOrderCents: 500 }]);
    const res = await spin('CouponWinner');
    expect(res.status, JSON.stringify(res.data)).toBe(200);
    expect(res.data.index).toBe(0);
    expect(res.data.prize.type).toBe('coupon');
    expect(res.data.code).toMatch(/^SPIN-[A-Z2-9]{8}$/);
    expect(res.data.message).toContain(res.data.code!);
    expect(res.data.message).toMatch(/3 days/);
    const c = await lib.coupons.getCoupon(res.data.code!);
    expect(c).toMatchObject({ type: 'percent', value: 10, source: 'spin', boundUsername: 'couponwinner', maxUses: 1, minOrderCents: 500, active: true });
    expect(Date.parse(c!.expiresAt!)).toBeLessThan(Date.now() + 3.1 * 86400_000);
    expect((await post('/coupons/validate', { code: res.data.code, username: 'CouponWinner', subtotalCents: 1000 })).data.valid).toBe(true);
  });

  it('creates a free, paid order for free items – once per username per week', async () => {
    await setPrizes([{ id: 'm5', label: '5M Coins', type: 'free_item', productId: 'money-1m', qty: 5, weight: 1 }]);
    const res = await spin('LuckyOne');
    expect(res.status, JSON.stringify(res.data)).toBe(200);
    expect(res.data.prize.type).toBe('free_item');
    expect(res.data.orderId).toMatch(/^DC-/);
    expect(res.data.code).toBeUndefined();
    const order = await lib.orders.getOrder(res.data.orderId!);
    expect(order).toMatchObject({ username: 'LuckyOne', status: 'paid', totalCents: 0, source: 'spin' });
    expect(order!.payment).toMatchObject({ type: 'free', status: 'paid', methodName: '🎡 Spin wheel prize: 5M Coins' });
    expect(order!.items[0]).toMatchObject({ productId: 'money-1m', qty: 5 });
    expect((await get(`/orders/${res.data.orderId}`)).status).toBe(200);

    // same player from a different device/ip within 7 days → downgraded to a coupon
    const second = await spin('luckyone');
    expect(second.status).toBe(200);
    expect(second.data.index).toBe(0);
    expect(second.data.prize.type).toBe('coupon');
    expect(second.data.orderId).toBeUndefined();
    expect(second.data.code).toMatch(/^SPIN-/);
    expect(second.data.message).toMatch(/already won a free item this week/);
    expect((await lib.coupons.getCoupon(second.data.code!))!.value).toBe(5);
  });

  it('downgrades free items to a coupon when no username is given and the wheel allows anonymous spins', async () => {
    await setPrizes([{ id: 'skel', label: '1 Skelly', type: 'free_item', productId: 'skeleton-spawner', qty: 1, weight: 1 }], { requireUsername: false });
    const res = await spin(undefined);
    expect(res.status, JSON.stringify(res.data)).toBe(200);
    expect(res.data.prize.type).toBe('coupon');
    expect(res.data.code).toMatch(/^SPIN-/);
    expect(res.data.message).toMatch(/username/);
    expect((await lib.coupons.getCoupon(res.data.code!))!.boundUsername).toBeUndefined();
  });

  it('downgrades to a coupon when the free item is sold out', async () => {
    await setPrizes([{ id: 'base', label: 'Starter Base', type: 'free_item', productId: 'starter-base', qty: 1, weight: 1 }]); // stock 0 in the default catalog
    const res = await spin('BaseHunter');
    expect(res.status).toBe(200);
    expect(res.data.prize.type).toBe('coupon');
    expect(res.data.message).toMatch(/out of stock/);
  });

  it('adds store credit', async () => {
    await setPrizes([{ id: 'cr', label: '$1 credit', type: 'credit', creditCents: 100, weight: 1 }]);
    const res = await spin('CreditWinner');
    expect(res.status, JSON.stringify(res.data)).toBe(200);
    expect(res.data.prize.type).toBe('credit');
    expect(res.data.creditCents).toBe(100);
    expect((await get('/credit?username=creditwinner')).data).toEqual({ balanceCents: 100 });
    expect((await lib.credit.getCredit('CreditWinner')).history[0].reason).toMatch(/Spin wheel/);
  });

  it('handles "nothing" prizes and weight-0 prizes', async () => {
    await setPrizes([
      { id: 'none', label: 'Try again', type: 'nothing', weight: 1 },
      { id: 'never', label: 'Never', type: 'coupon', percent: 99, weight: 0 },
    ]);
    const res = await spin('Unlucky');
    expect(res.status).toBe(200);
    expect(res.data.index).toBe(0);
    expect(res.data.prize.type).toBe('nothing');
    expect(res.data.code).toBeUndefined();
    expect(res.data.orderId).toBeUndefined();
    expect(res.data.message).toMatch(/No luck/);
  });

  it('refuses to spin while disabled and rate limits spam', async () => {
    await lib.settings.saveSettings({ spin: { ...defaultSettings.spin, enabled: false } });
    const status = await get<SpinStatus>(`/spin/status?deviceId=${freshDevice()}`);
    expect(status.data.enabled).toBe(false);
    expect(status.data.canSpin).toBe(false);
    const res = await spin('Steve');
    expect(res.status).toBe(403);
    expect(res.data.code).toBe('disabled');

    const ip = freshIp();
    for (let i = 0; i < 10; i++) await spin('Steve', { ip });
    const blocked = await spin('Steve', { ip });
    expect(blocked.status).toBe(429);
    expect(blocked.data.code).toBe('rate_limited');
  });
});

describe('POST /redeem', () => {
  it('redeems a gift code into a free order, once per player', async () => {
    const gift = await gifts.createGift({ productId: 'skeleton-spawner', qty: 4, maxUses: 2, validDays: 3, code: 'HELLO-SKEL' });
    expect(gift.code).toBe('HELLO-SKEL');

    const res = await post<{ order: PublicOrder }>('/redeem', { code: 'hello-skel', username: 'GiftFan' });
    expect(res.status, JSON.stringify(res.data)).toBe(201);
    expect(res.data.order).toMatchObject({ username: 'GiftFan', status: 'paid', totalCents: 0, source: 'redeem' });
    expect(res.data.order.payment).toMatchObject({ type: 'free', status: 'paid', methodName: '🎁 Gift code HELLO-SKEL' });
    expect(res.data.order.items[0]).toMatchObject({ productId: 'skeleton-spawner', qty: 4 });
    expect(res.data.order).not.toHaveProperty('ipHash');
    expect((await gifts.getGift('HELLO-SKEL'))!.uses).toBe(1);

    const again = await post('/redeem', { code: 'HELLO-SKEL', username: 'giftfan' });
    expect(again.status).toBe(409);
    expect(again.data.error).toContain(res.data.order.id);

    const second = await post<{ order: PublicOrder }>('/redeem', { code: 'HELLO-SKEL', username: 'Friend2' });
    expect(second.status).toBe(201);
    const exhausted = await post('/redeem', { code: 'HELLO-SKEL', username: 'Friend3' });
    expect(exhausted.status).toBe(410);
    expect(exhausted.data.error).toMatch(/fully redeemed/);
  });

  it('validates codes, usernames and expiry', async () => {
    expect((await post('/redeem', { code: 'DOES-NOT-EXIST', username: 'Steve' })).status).toBe(404);
    expect((await post('/redeem', { code: 'HELLO-SKEL', username: 'x' })).status).toBe(400);
    expect((await post('/redeem', { username: 'Steve' })).status).toBe(400);

    const gift = await gifts.createGift({ productId: 'money-1m', qty: 1, validDays: 1 });
    expect(gift.code).toMatch(/^GIFT-[A-Z2-9]{8}$/);
    gift.expiresAt = new Date(Date.now() - 1000).toISOString();
    await gifts.saveGift(gift);
    const expired = await post('/redeem', { code: gift.code, username: 'Steve' });
    expect(expired.status).toBe(410);
    expect(expired.data.code).toBe('expired');

    const soldOut = await gifts.createGift({ productId: 'starter-base', qty: 1 });
    const unavailable = await post('/redeem', { code: soldOut.code, username: 'Steve' });
    expect(unavailable.status).toBe(409);
    expect((await gifts.getGift(soldOut.code))!.uses).toBe(0);
  });

  it('rate limits guessing (10 / 10 min)', async () => {
    const ip = freshIp();
    for (let i = 0; i < 10; i++) await post('/redeem', { code: `GUESS-${i}`, username: 'Steve' }, { ip });
    expect((await post('/redeem', { code: 'GUESS-X', username: 'Steve' }, { ip })).status).toBe(429);
  });
});

describe('GET /credit and GET /referral', () => {
  it('reads balances', async () => {
    expect((await get('/credit?username=Nobody123')).data).toEqual({ balanceCents: 0 });
    await lib.credit.addCredit('RichKid', 1234, 'test');
    expect((await get('/credit?username=richkid')).data).toEqual({ balanceCents: 1234 });
    expect((await get('/credit')).status).toBe(400);
    expect((await get('/credit?username=bad%20name')).status).toBe(400);
  });

  it('counts paid referred orders and the credit they earned', async () => {
    const empty = await get('/referral?username=Referrer');
    expect(empty.status).toBe(200);
    expect(empty.data).toMatchObject({ code: 'Referrer', referrals: 0, earnedCents: 0, enabled: true, friendPercent: 5, referrerPercent: 5 });

    const order = await post<{ order: PublicOrder }>('/orders', orderBody({ username: 'Friend', referralCode: 'referrer', items: [{ productId: 'money-1m', qty: 100 }] }));
    expect(order.status).toBe(201);
    expect(order.data.order.referralCode).toBe('referrer');
    expect((await get('/referral?username=Referrer')).data.referrals).toBe(0); // not paid yet

    await lib.orders.setOrderStatus((await lib.orders.getOrder(order.data.order.id))!, 'paid', 'test');
    const after = await get('/referral?username=REFERRER');
    expect(after.data.referrals).toBe(1);
    expect(after.data.earnedCents).toBe(Math.round(order.data.order.totalCents * 0.05));
    expect((await get('/credit?username=referrer')).data.balanceCents).toBe(after.data.earnedCents);
    expect((await get('/referral')).status).toBe(400);
  });
});
