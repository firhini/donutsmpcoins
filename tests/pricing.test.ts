import { describe, expect, it } from 'vitest';
import type { Coupon, Product, SpendingTier } from '../src/shared/types';
import { MAX_TOTAL_DISCOUNT_PERCENT, clampQty, computeQuote, formatMillions, formatMoney, formatUsd, spendingTierFor, unitPriceCents } from '../src/shared/pricing';

const product = (over: Partial<Product> & { id: string; priceCents: number }): Product => ({
  slug: over.id,
  name: over.id,
  categoryId: 'spawners',
  kind: 'item',
  stock: null,
  image: `/img/products/${over.id}.svg`,
  ...over,
});

/** $10.00 plain item */
const plain = product({ id: 'plain', priceCents: 1000 });
/** $1.00 item with (deliberately unsorted) bulk tiers */
const bulk = product({ id: 'bulk', priceCents: 100, bulkPricing: [{ minQty: 50, priceCents: 80 }, { minQty: 10, priceCents: 90 }] });
const limited = product({ id: 'limited', priceCents: 500, stock: 3 });
const soldOut = product({ id: 'soldout', priceCents: 500, stock: 0 });
const hidden = product({ id: 'hidden', priceCents: 500, hidden: true });
const products = [plain, bulk, limited, soldOut, hidden];

const tiers: SpendingTier[] = [
  { minCents: 1500, percent: 5 },
  { minCents: 4000, percent: 8 },
  { minCents: 10000, percent: 12 },
];

const coupon = (over: Partial<Coupon> = {}): Coupon => ({
  code: 'TEST',
  type: 'percent',
  value: 20,
  uses: 0,
  source: 'admin',
  active: true,
  createdAt: new Date().toISOString(),
  ...over,
});

describe('bulk pricing', () => {
  it('uses the base price below the first tier', () => {
    expect(unitPriceCents(bulk, 9)).toEqual({ price: 100, bulk: false });
    const q = computeQuote(products, [{ productId: 'bulk', qty: 9 }]);
    expect(q.lines[0]).toMatchObject({ unitPriceCents: 100, basePriceCents: 100, lineTotalCents: 900, bulkApplied: false });
  });

  it('applies the highest matching tier even when tiers are unsorted', () => {
    expect(unitPriceCents(bulk, 10)).toEqual({ price: 90, bulk: true });
    expect(unitPriceCents(bulk, 49)).toEqual({ price: 90, bulk: true });
    expect(unitPriceCents(bulk, 50)).toEqual({ price: 80, bulk: true });
    const q = computeQuote(products, [{ productId: 'bulk', qty: 50 }]);
    expect(q.lines[0]).toMatchObject({ unitPriceCents: 80, lineTotalCents: 4000, bulkApplied: true });
  });

  it('clamps quantity to min/max/stock', () => {
    expect(clampQty(product({ id: 'x', priceCents: 1, minQty: 5, maxQty: 20 }), 1)).toBe(5);
    expect(clampQty(product({ id: 'x', priceCents: 1, minQty: 5, maxQty: 20 }), 99)).toBe(20);
    expect(clampQty(limited, 10)).toBe(3);
    expect(clampQty(plain, Number.NaN)).toBe(1);
    expect(clampQty(plain, 2.9)).toBe(2);
  });

  it('skips unavailable products with a warning', () => {
    const q = computeQuote(products, [
      { productId: 'soldout', qty: 1 },
      { productId: 'hidden', qty: 1 },
      { productId: 'does-not-exist', qty: 1 },
      { productId: 'plain', qty: 1 },
    ]);
    expect(q.lines.map((l) => l.productId)).toEqual(['plain']);
    expect(q.subtotalCents).toBe(1000);
    expect(q.warnings).toHaveLength(3);
    expect(q.warnings.join(' ')).toMatch(/sold out/);
  });
});

describe('sale and spending tiers', () => {
  it('finds the current and next spending tier', () => {
    expect(spendingTierFor(850, tiers)).toEqual({ current: undefined, next: tiers[0] });
    expect(spendingTierFor(1500, tiers)).toEqual({ current: tiers[0], next: tiers[1] });
    expect(spendingTierFor(50000, tiers)).toEqual({ current: tiers[2], next: undefined });
  });

  it('reports the missing amount to the next tier', () => {
    const q = computeQuote(products, [{ productId: 'plain', qty: 1 }], { tiers });
    expect(q.tierPercent).toBe(0);
    expect(q.tierDiscountCents).toBe(0);
    expect(q.nextTier).toEqual({ minCents: 1500, percent: 5, missingCents: 500 });
  });

  it('applies the tier discount on the subtotal after the sale', () => {
    const q = computeQuote(products, [{ productId: 'plain', qty: 2 }], { tiers, salePercent: 10 });
    expect(q.salePercent).toBe(10);
    expect(q.saleDiscountCents).toBe(200);
    expect(q.tierPercent).toBe(5);
    expect(q.tierDiscountCents).toBe(90); // 5% of 1800
    expect(q.totalCents).toBe(1710);
    expect(q.nextTier).toEqual({ minCents: 4000, percent: 8, missingCents: 2000 });
  });

  it('clamps the sale percent to a sane range', () => {
    expect(computeQuote(products, [{ productId: 'plain', qty: 1 }], { salePercent: 500 }).salePercent).toBe(90);
    expect(computeQuote(products, [{ productId: 'plain', qty: 1 }], { salePercent: -5 }).salePercent).toBe(0);
  });
});

describe('coupon rules', () => {
  const items = [{ productId: 'plain', qty: 1 }];

  it('applies a percent coupon', () => {
    const q = computeQuote(products, items, { coupon: coupon() });
    expect(q.couponCode).toBe('TEST');
    expect(q.couponDiscountCents).toBe(200);
    expect(q.totalCents).toBe(800);
    expect(q.warnings).toEqual([]);
  });

  it('applies a fixed coupon, never below zero', () => {
    expect(computeQuote(products, items, { coupon: coupon({ type: 'fixed', value: 300 }) }).totalCents).toBe(700);
    const q = computeQuote(products, items, { coupon: coupon({ type: 'fixed', value: 5000 }) });
    expect(q.couponDiscountCents).toBeLessThanOrEqual(1000);
    expect(q.totalCents).toBeGreaterThanOrEqual(0);
  });

  it('rejects inactive, expired and exhausted coupons', () => {
    const inactive = computeQuote(products, items, { coupon: coupon({ active: false }) });
    expect(inactive.couponDiscountCents).toBe(0);
    expect(inactive.warnings[0]).toMatch(/no longer active/);

    const expired = computeQuote(products, items, { coupon: coupon({ expiresAt: new Date(Date.now() - 1000).toISOString() }) });
    expect(expired.couponDiscountCents).toBe(0);
    expect(expired.warnings[0]).toMatch(/expired/);

    const used = computeQuote(products, items, { coupon: coupon({ maxUses: 1, uses: 1 }) });
    expect(used.couponDiscountCents).toBe(0);
    expect(used.warnings[0]).toMatch(/already been used/);
  });

  it('honours bound usernames (case-insensitive)', () => {
    const bound = coupon({ boundUsername: 'steve' });
    expect(computeQuote(products, items, { coupon: bound, username: 'Steve' }).couponDiscountCents).toBe(200);
    const other = computeQuote(products, items, { coupon: bound, username: 'Alex' });
    expect(other.couponDiscountCents).toBe(0);
    expect(other.warnings[0]).toMatch(/different Minecraft account/);
  });

  it('enforces the minimum order', () => {
    const q = computeQuote(products, items, { coupon: coupon({ minOrderCents: 2000 }) });
    expect(q.couponDiscountCents).toBe(0);
    expect(q.warnings[0]).toMatch(/minimum order of \$20\.00/);
  });

  it('warns about unknown codes', () => {
    const q = computeQuote(products, items, { couponCode: 'NOPE' });
    expect(q.couponCode).toBeUndefined();
    expect(q.warnings).toEqual(['Unknown discount code.']);
  });
});

describe('referral', () => {
  const items = [{ productId: 'plain', qty: 1 }];

  it('applies the friend discount when no coupon is used', () => {
    const q = computeQuote(products, items, { referralPercent: 5, referralCode: 'Friend' });
    expect(q.referralCode).toBe('Friend');
    expect(q.referralDiscountCents).toBe(50);
    expect(q.totalCents).toBe(950);
  });

  it('is not combined with a coupon – the coupon wins', () => {
    const q = computeQuote(products, items, { referralPercent: 5, referralCode: 'Friend', coupon: coupon() });
    expect(q.couponDiscountCents).toBe(200);
    expect(q.referralDiscountCents).toBe(0);
    expect(q.referralCode).toBeUndefined();
    expect(q.warnings.join(' ')).toMatch(/cannot be combined/);
  });

  it('falls back to the referral when the coupon is invalid', () => {
    const q = computeQuote(products, items, { referralPercent: 5, referralCode: 'Friend', coupon: coupon({ active: false }) });
    expect(q.couponDiscountCents).toBe(0);
    expect(q.referralDiscountCents).toBe(50);
  });
});

describe('store credit', () => {
  const items = [{ productId: 'plain', qty: 1 }];

  it('is only applied when requested', () => {
    expect(computeQuote(products, items, { creditAvailableCents: 300 }).creditAppliedCents).toBe(0);
    const q = computeQuote(products, items, { creditAvailableCents: 300, applyCredit: true });
    expect(q.creditAppliedCents).toBe(300);
    expect(q.totalCents).toBe(700);
  });

  it('never applies more than the remaining total', () => {
    const q = computeQuote(products, items, { creditAvailableCents: 5000, applyCredit: true, coupon: coupon() });
    expect(q.creditAppliedCents).toBe(800);
    expect(q.totalCents).toBe(0);
  });
});

describe('discount cap', () => {
  it(`caps combined discounts at ${MAX_TOTAL_DISCOUNT_PERCENT}% and trims the coupon first`, () => {
    const q = computeQuote(products, [{ productId: 'plain', qty: 1 }], {
      salePercent: 30,
      tiers: [{ minCents: 0, percent: 20 }],
      coupon: coupon({ value: 50 }),
    });
    const totalDiscount = q.saleDiscountCents + q.tierDiscountCents + q.couponDiscountCents + q.referralDiscountCents;
    expect(totalDiscount).toBe(Math.round((q.subtotalCents * MAX_TOTAL_DISCOUNT_PERCENT) / 100));
    expect(q.saleDiscountCents).toBe(300);
    expect(q.tierDiscountCents).toBe(140);
    expect(q.couponDiscountCents).toBe(160);
    expect(q.totalCents).toBe(400);
    expect(q.warnings.join(' ')).toMatch(/capped at 60%/);
  });

  it('does not warn when under the cap', () => {
    const q = computeQuote(products, [{ productId: 'plain', qty: 1 }], { salePercent: 10, coupon: coupon() });
    expect(q.warnings).toEqual([]);
    expect(q.totalCents).toBe(720);
  });
});

describe('formatters', () => {
  it('formats USD cents', () => {
    expect(formatUsd(850)).toBe('$8.50');
    expect(formatUsd(0)).toBe('$0.00');
  });

  it('converts into display currencies', () => {
    expect(formatMoney(1000, { code: 'EUR', symbol: '€', rate: 0.92 })).toBe('€9.20');
    expect(formatMoney(1000, { code: 'JPY', symbol: '¥', rate: 150 })).toBe('¥1,500');
    expect(formatMoney(1000, null)).toBe('$10.00');
  });

  it('formats in-game money amounts', () => {
    expect(formatMillions(1)).toBe('1M');
    expect(formatMillions(2.5)).toBe('2.5M');
    expect(formatMillions(0.25)).toBe('250K');
    expect(formatMillions(1000)).toBe('1B');
    expect(formatMillions(1500)).toBe('1.5B');
  });
});
