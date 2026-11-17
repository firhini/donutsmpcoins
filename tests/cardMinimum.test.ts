import { afterEach, describe, expect, it } from 'vitest';
import { usablePaymentMethods } from '../netlify/lib/settings';
import { STRIPE_MIN_CENTS } from '../netlify/lib/payments/stripe';
import { defaultSettings } from '../src/data/settings';

describe('card minimum', () => {
  const prev = process.env.STRIPE_SECRET_KEY;
  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = prev;
  });
  it('is above Stripe EUR floor ($0.50 converts below €0.50)', () => {
    expect(STRIPE_MIN_CENTS).toBeGreaterThanOrEqual(60);
  });
  it('is applied to the card method even when the admin left it empty', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    const settings = structuredClone(defaultSettings);
    for (const m of settings.paymentMethods) if (m.type === 'stripe') { m.enabled = true; m.minCents = undefined; }
    const card = usablePaymentMethods(settings).find((m) => m.type === 'stripe');
    expect(card?.minCents).toBe(STRIPE_MIN_CENTS);
  });
});

describe('EUR checkout for European buyers', () => {
  it('charges euro-area buyers in EUR at the configured rate, everyone else in USD', async () => {
    const { chargeFor } = await import('../netlify/lib/payments/stripe');
    expect(chargeFor({ totalCents: 249, displayCurrency: 'USD' }, { country: 'DE', eurRate: 0.92 })).toEqual({ currency: 'eur', amount: 229 });
    expect(chargeFor({ totalCents: 249, displayCurrency: 'EUR' }, { country: 'US', eurRate: 0.92 })).toEqual({ currency: 'eur', amount: 229 });
    expect(chargeFor({ totalCents: 249, displayCurrency: 'USD' }, { country: 'US', eurRate: 0.92 })).toEqual({ currency: 'usd', amount: 249 });
    // a buyer in Germany who picked GBP keeps USD (only EUR has local methods we want)
    expect(chargeFor({ totalCents: 249, displayCurrency: 'GBP' }, { country: 'DE', eurRate: 0.92 })).toEqual({ currency: 'usd', amount: 249 });
    // nonsense rates or amounts under Stripe's €0.50 floor fall back to USD
    expect(chargeFor({ totalCents: 249, displayCurrency: 'EUR' }, { eurRate: 34 })).toEqual({ currency: 'usd', amount: 249 });
    expect(chargeFor({ totalCents: 52, displayCurrency: 'EUR' }, { eurRate: 0.92 })).toEqual({ currency: 'usd', amount: 52 });
  });

  it('only accepts a paid EUR session that collected what was asked for this order', async () => {
    const { sessionCoversOrder } = await import('../netlify/lib/payments/stripe');
    const meta = { usdCents: '249', chargeCurrency: 'eur', chargeCents: '229' };
    expect(sessionCoversOrder({ amount_total: 229, currency: 'eur', metadata: meta }, { totalCents: 249 })).toBe(true);
    expect(sessionCoversOrder({ amount_total: 100, currency: 'eur', metadata: meta }, { totalCents: 249 })).toBe(false);
    expect(sessionCoversOrder({ amount_total: 229, currency: 'eur', metadata: meta }, { totalCents: 500 })).toBe(false);
    expect(sessionCoversOrder({ amount_total: 249, currency: 'usd', metadata: {} }, { totalCents: 249 })).toBe(true);
    expect(sessionCoversOrder({ amount_total: 248, currency: 'usd', metadata: {} }, { totalCents: 249 })).toBe(false);
  });
});
