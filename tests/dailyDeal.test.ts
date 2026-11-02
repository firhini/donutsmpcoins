import { afterAll, describe, expect, it } from 'vitest';
// api-helpers MUST be imported first – it relocates the file store before loading the API.
import { cleanupTestData, lib, orderBody, post } from './api-helpers';
import type { PublicOrder, SiteSettings } from '../src/shared/types';
import { applyDailyDeal, dealOfTheDay } from '../src/shared/pricing';
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

  it('prices the deal product, crosses out the regular price and caps the quantity', () => {
    const now = new Date('2026-11-03T10:00:00Z');
    const id = dealOfTheDay({ enabled: true, maxPerPlayer: 3, pool }, now)!.productId;
    const p = applyDailyDeal(products, { enabled: true, maxPerPlayer: 3, pool }, now).find((x) => x.id === id)!;
    const regular = products.find((x) => x.id === id)!;
    expect(p.priceCents).toBe(179);
    expect(p.compareAtCents).toBe(regular.priceCents);
    expect(p.maxQty).toBe(3);
    expect(p.bulkPricing).toBeUndefined();
  });

  it('limits each player (name and IP) to the daily maximum and frees it on cancel', async () => {
    await lib.settings.saveSettings({ dailyDeal: { enabled: true, maxPerPlayer: 3, pool: [{ productId: 'money-100m', priceCents: 179 }] } } as Partial<SiteSettings>);
    const buy = (username: string, qty: number, ip: string) => post<{ order: PublicOrder }>('/orders', orderBody({ username, items: [{ productId: 'money-100m', qty }] }), { ip });
    const first = await buy('DealHunter', 2, '10.44.0.1');
    expect(first.status).toBe(201);
    expect(first.data.order.items[0].unitPriceCents).toBe(179);
    const tooMany = await buy('DealHunter', 2, '10.44.0.2');
    expect(tooMany.status).toBe(409);
    expect((tooMany.data as unknown as { code: string }).code).toBe('daily_deal_limit');
    const alt = await buy('DealHunterAlt', 2, '10.44.0.1'); // same connection, second name
    expect(alt.status).toBe(409);
    expect((await buy('DealHunter', 1, '10.44.0.3')).status).toBe(201); // exactly the 3rd unit
    // cancelling frees the allowance again
    const o = (await lib.orders.getOrder(first.data.order.id))!;
    await lib.orders.setOrderStatus(o, 'cancelled', 'test');
    expect((await buy('DealHunter', 2, '10.44.0.4')).status).toBe(201);
  });
});
