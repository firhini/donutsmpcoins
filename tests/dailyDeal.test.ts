import { afterAll, describe, expect, it } from 'vitest';
// api-helpers MUST be imported first – it relocates the file store before loading the API.
import { cleanupTestData, lib, orderBody, post } from './api-helpers';
import type { PublicOrder, SiteSettings } from '../src/shared/types';
import { applyDailyDeal, computeQuote, dealOfTheDay, unitPriceCents } from '../src/shared/pricing';
import { products } from '../src/data/catalog';

afterAll(() => cleanupTestData());

const pool = [
  { productId: 'money-100m', priceCents: 179 },
  { productId: 'cow-spawner', priceCents: 179 },
];

describe('daily deal', () => {
  it('rotates one product per UTC day and ends at midnight', () => {
    const d1 = dealOfTheDay({ enabled: true, maxPerPlayer: 3, pool }, new Date('2026-11-03T10:00:00Z'))!;
    const d2 = dealOfTheDay({ enabled: true, maxPerPlayer: 3, pool }, new Date('2026-11-04T10:00:00Z'))!;
    expect(d1.productId).not.toBe(d2.productId);
    expect(d1.endsAt).toBe('2026-11-04T00:00:00.000Z');
    expect(d1.date).toBe('2026-11-03');
    expect(dealOfTheDay({ enabled: false, maxPerPlayer: 3, pool })).toBeNull();
  });

  it('prices the deal product, crosses out the regular price and keeps normal quantities', () => {
    const now = new Date('2026-11-03T10:00:00Z');
    const id = dealOfTheDay({ enabled: true, maxPerPlayer: 3, pool }, now)!.productId;
    const p = applyDailyDeal(products, { enabled: true, maxPerPlayer: 3, pool }, now).find((x) => x.id === id)!;
    const regular = products.find((x) => x.id === id)!;
    expect(p.priceCents).toBe(179);
    expect(p.compareAtCents).toBe(regular.priceCents);
    expect(p.maxQty).toBe(regular.maxQty); // no silent cap at 3 any more
    expect(p.dailyDeal?.regularBulk).toEqual(regular.bulkPricing);
  });

  it('sells the first 3 at the deal price and the rest at the regular price', () => {
    const now = new Date('2026-11-03T10:00:00Z');
    const id = dealOfTheDay({ enabled: true, maxPerPlayer: 3, pool }, now)!.productId;
    const list = applyDailyDeal(products, { enabled: true, maxPerPlayer: 3, pool }, now);
    const regular = products.find((x) => x.id === id)!;
    const q = computeQuote(list, [{ productId: id, qty: 5 }]);
    expect(q.lines[0].qty).toBe(5);
    expect(q.lines[0].dealQty).toBe(3);
    expect(q.lines[0].lineTotalCents).toBe(3 * 179 + 2 * unitPriceCents(regular, 5).price);
    // a player who already used 2 of 3 today gets 1 more at the deal price
    const q2 = computeQuote(list, [{ productId: id, qty: 2 }], { dealAllowance: { [id]: 1 } });
    expect(q2.lines[0].dealQty).toBe(1);
    expect(q2.lines[0].lineTotalCents).toBe(179 + unitPriceCents(regular, 2).price);
  });

  it('counts the deal per player (name and IP), prices extra units normally and frees it on cancel', async () => {
    await lib.settings.saveSettings({ dailyDeal: { enabled: true, maxPerPlayer: 3, pool: [{ productId: 'money-100m', priceCents: 179 }] } } as Partial<SiteSettings>);
    const regular = products.find((x) => x.id === 'money-100m')!.priceCents;
    const buy = (username: string, qty: number, ip: string) => post<{ order: PublicOrder }>('/orders', orderBody({ username, items: [{ productId: 'money-100m', qty }] }), { ip });
    const total = (r: Awaited<ReturnType<typeof buy>>) => r.data.order.items[0].lineTotalCents;
    const first = await buy('DealHunter', 2, '10.44.0.1');
    expect(first.status).toBe(201);
    expect(total(first)).toBe(2 * 179);
    const second = await buy('DealHunter', 2, '10.44.0.2'); // 1 deal unit left for this name
    expect(second.status).toBe(201);
    expect(total(second)).toBe(179 + regular);
    const alt = await buy('DealHunterAlt', 2, '10.44.0.1'); // same connection already used 2
    expect(alt.status).toBe(201);
    expect(total(alt)).toBe(179 + regular);
    const none = await buy('DealHunter', 1, '10.44.0.3'); // name used all 3
    expect(total(none)).toBe(regular);
    // cancelling frees the allowance again
    const o = (await lib.orders.getOrder(first.data.order.id))!;
    await lib.orders.setOrderStatus(o, 'cancelled', 'test');
    const again = await buy('DealHunter', 2, '10.44.0.4');
    expect(total(again)).toBe(2 * 179);
  });
});
