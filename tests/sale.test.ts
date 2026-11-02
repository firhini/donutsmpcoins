import { describe, expect, it } from 'vitest';
import { applySale, computeQuote, saleActive } from '../src/shared/pricing';
import { products } from '../src/data/catalog';

const box = products.find((p) => p.id === 'mystery-box')!;
const money = products.find((p) => p.id === 'money-1m')!;
const now = new Date('2026-11-02T12:00:00Z');

describe('timed sale', () => {
  it('is only active while enabled, above 0% and before its end', () => {
    expect(saleActive({ enabled: true, percent: 30 }, now)).toBe(true);
    expect(saleActive({ enabled: false, percent: 30 }, now)).toBe(false);
    expect(saleActive({ enabled: true, percent: 0 }, now)).toBe(false);
    expect(saleActive({ enabled: true, percent: 30, endsAt: '2026-11-02T11:59:00Z' }, now)).toBe(false);
    expect(saleActive({ enabled: true, percent: 30, endsAt: '2026-11-03T00:00:00Z' }, now)).toBe(true);
  });

  it('lowers only the chosen categories and shows the regular price crossed out', () => {
    const sale = { enabled: true, percent: 30, endsAt: '2026-11-05T00:00:00Z', categoryIds: ['mystery'] };
    const out = applySale(products, sale, now);
    const b = out.find((p) => p.id === box.id)!;
    expect(b.priceCents).toBe(Math.round(box.priceCents * 0.7));
    expect(b.compareAtCents).toBe(box.priceCents);
    expect(b.salePercent).toBe(30);
    expect(b.saleEndsAt).toBe(sale.endsAt);
    expect(out.find((p) => p.id === money.id)).toBe(money); // untouched
  });

  it('feeds the reduced prices into the quote and stops when the sale ends', () => {
    const sale = { enabled: true, percent: 30, endsAt: '2026-11-05T00:00:00Z', categoryIds: ['mystery'] };
    const during = computeQuote(applySale(products, sale, now), [{ productId: box.id, qty: 2 }]);
    expect(during.subtotalCents).toBe(Math.round(box.priceCents * 0.7) * 2);
    const after = computeQuote(applySale(products, sale, new Date('2026-11-06T00:00:00Z')), [{ productId: box.id, qty: 2 }]);
    expect(after.subtotalCents).toBe(box.priceCents * 2);
  });

  it('reduces bulk tiers by the same percentage', () => {
    const out = applySale(products, { enabled: true, percent: 20 }, now);
    const m = out.find((p) => p.id === money.id)!;
    expect(m.bulkPricing![0].priceCents).toBe(Math.round(money.bulkPricing![0].priceCents * 0.8));
  });
});
