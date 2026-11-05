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
