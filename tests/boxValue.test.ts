import { describe, expect, it } from 'vitest';
import { products, findProduct } from '../src/data/catalog';
import { rollBox } from '../netlify/lib/boxes';

/**
 * Guard against loss-making mystery boxes: on average a box must pay out clearly less than its price,
 * valued at our own shop prices. (A box once rolled ~10× its price in items.)
 */
const MAX_PAYOUT_RATIO = 0.8;
const MONEY_PER_M = 0.15; // bulk money price per 1M, in dollars

const byName = new Map(products.map((p) => [p.name, p.priceCents / 100]));
const EXTRA: Record<string, number> = { 'Netherite Armor Set (maxed)': (findProduct('netherite-armor-set')?.priceCents ?? 0) / 100 };

function unitValue(name: string): number {
  const money = name.match(/^(\d+)M Money/);
  if (money) return Number(money[1]) * MONEY_PER_M;
  const base = name.replace(/\s*\(guaranteed\)$/, '');
  const v = EXTRA[base] ?? byName.get(base);
  if (v === undefined) throw new Error(`No shop price for box drop "${name}" – add the item to the catalog or to EXTRA`);
  return v;
}

describe('mystery box payout', () => {
  for (const box of products.filter((p) => p.kind === 'box')) {
    it(`${box.name} pays out at most ${MAX_PAYOUT_RATIO * 100}% of its price on average`, () => {
      for (const c of box.contents ?? []) unitValue(c.name);
      const N = 20000;
      let total = 0;
      for (let i = 0; i < N; i++) for (const d of rollBox(box)) total += unitValue(d.name) * d.qty;
      const ratio = total / N / (box.priceCents / 100);
      expect(ratio, `${box.name}: average payout ${(ratio * 100).toFixed(0)}% of price`).toBeLessThanOrEqual(MAX_PAYOUT_RATIO);
    });
  }
});
