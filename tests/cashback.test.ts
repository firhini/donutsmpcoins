import { afterAll, describe, expect, it } from 'vitest';
// api-helpers MUST be imported first – it relocates the file store before loading the API.
import { cleanupTestData, lib, orderBody, post } from './api-helpers';
import type { PublicOrder } from '../src/shared/types';

afterAll(() => cleanupTestData());

describe('cashback', () => {
  it('credits a % of the order once it is delivered, only once, and takes it back on refund', async () => {
    const res = await post<{ order: PublicOrder }>('/orders', orderBody({ username: 'CashbackKid' }), { ip: '10.77.0.1' });
    expect(res.status).toBe(201);
    const order = (await lib.orders.getOrder(res.data.order.id))!;
    const expected = Math.round((order.totalCents * 5) / 100);

    await lib.orders.setOrderStatus(order, 'paid', 'test');
    expect((await lib.credit.getCredit('CashbackKid')).balanceCents).toBe(0); // not before delivery
    await lib.orders.setOrderStatus(order, 'delivered', 'test');
    expect((await lib.credit.getCredit('CashbackKid')).balanceCents).toBe(expected);
    expect((await lib.orders.getOrder(order.id))!.cashbackCents).toBe(expected);

    await lib.orders.setOrderStatus(order, 'delivered', 'again'); // no-op, no double credit
    expect((await lib.credit.getCredit('CashbackKid')).balanceCents).toBe(expected);

    await lib.orders.setOrderStatus((await lib.orders.getOrder(order.id))!, 'refunded', 'test');
    expect((await lib.credit.getCredit('CashbackKid')).balanceCents).toBe(0);
  });
});
