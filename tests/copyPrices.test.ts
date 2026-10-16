/**
 * Every dollar amount quoted in the SEO copy must be derivable from the catalog
 * (price, compare-at, bulk tiers, quantities, bundle part sums, spending tiers …).
 * Catches copy that drifts after a price change.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { products } from '../src/data/catalog';
import { defaultSettings } from '../src/data/settings';

const valid = new Set<number>();
const add = (cents: number) => valid.add(Math.round(cents));
const byId = new Map(products.map((p) => [p.id, p]));
const unitAt = (p: (typeof products)[number], q: number) => {
  let pr = p.priceCents;
  for (const t of [...(p.bulkPricing ?? [])].sort((a, b) => a.minQty - b.minQty)) if (q >= t.minQty) pr = t.priceCents;
  return pr;
};
const QTYS = [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 13, 15, 16, 20, 24, 25, 27, 30, 32, 36, 37, 45, 50, 64, 100, 120, 128, 150, 250, 300, 320, 500, 1000];

for (const p of products) {
  add(p.priceCents);
  if (p.compareAtCents) add(p.compareAtCents);
  for (const t of p.bulkPricing ?? []) add(t.priceCents);
  for (const q of QTYS) {
    add(unitAt(p, q) * q);
    add(p.priceCents * q);
  }
  if (p.moneyMillions) add(p.priceCents / p.moneyMillions);
  if (p.contents?.length && p.kind === 'kit') {
    const sum = p.contents.reduce((s, c) => {
      const cp = products.find((x) => x.name === c.name);
      return s + (cp ? unitAt(cp, c.max) * c.max : 0);
    }, 0);
    add(sum);
  }
  if (p.bundleItems) {
    let tier = 0;
    let pack = 0;
    for (const b of p.bundleItems) {
      const bp = byId.get(b.productId);
      if (!bp) continue;
      tier += unitAt(bp, b.quantity) * b.quantity;
      const moneyPack = bp.kind === 'money' ? products.find((x) => x.kind === 'money' && x.moneyMillions === b.quantity) : undefined;
      pack += moneyPack ? moneyPack.priceCents : unitAt(bp, b.quantity) * b.quantity;
    }
    add(tier);
    add(pack);
    add(tier - p.priceCents);
    add(pack - p.priceCents);
  }
  for (const pct of defaultSettings.spendingTiers.map((t) => t.percent)) {
    add(p.priceCents * (1 - pct / 100));
    add(p.priceCents * 0.95 * (1 - pct / 100));
  }
}
for (const t of defaultSettings.spendingTiers) add(t.minCents);
for (const id of ['netherite-pickaxes-27', 'netherite-swords-27', 'diamond-helmet-shulker']) {
  const p = byId.get(id);
  if (p) add(p.priceCents / 27);
}
const block = byId.get('netherite-block');
const ingot = byId.get('netherite-ingot');
if (block) add(block.priceCents / 9);
if (ingot) add(ingot.priceCents * 9);

// amounts that are rounded comparisons or sums of two lines – each checked by hand:
const APPROXIMATE = new Set<string>([
  'productCopy:12', // 250M pack: $45.00 base − $32.99 = $12.01
  'productCopy:0.10', // 1B pack after 12% tier: $101.19 / 1000M = $0.101 per 1M
  'productCopy:35.98', // elytra $28.49 + 50M $7.49
  'productCopy:53', // Value Investment Box parts ≈ $53
  'productCopy:92', // Elite Investment Box parts ≈ $92
  'categoryCopy:1.10', // 50 spawners $20.00 − 45 spawners $18.90
  'landingCopy:2.40', // Basehunter parts $40.40 − $37.99 = $2.41
  'landingCopy:2.01', // 100 flexible millions at the 100M tier $16.00 − 100M pack $13.99
  'landingCopy:40.48', // 250M $32.99 + 50M $7.49
  'landingCopy:37.24', // $40.48 − 8% spending tier
  'landingCopy:0.10', // $101.19 / 1000M
  'landingCopy:91.07', // $101.19 − 10% spin coupon
]);

const FILES = ['productCopy', 'categoryCopy', 'landingCopy', 'guides', 'faq'];
const RE = /\$(\d{1,3}(?:,\d{3})*(?:\.\d{1,3})?)/g;

describe('SEO copy prices match the catalog', () => {
  for (const f of FILES) {
    it(`${f}.ts quotes only derivable amounts`, () => {
      const lines = readFileSync(`src/data/${f}.ts`, 'utf8').split('\n');
      const miss: string[] = [];
      lines.forEach((line, i) => {
        if (/^\s*(\/\/|\*)/.test(line)) return; // comments
        for (const m of line.matchAll(RE)) {
          const v = Number(m[1].replace(/,/g, ''));
          const cents = v * 100;
          const ok = valid.has(Math.round(cents)) || [...valid].some((k) => Math.abs(k - cents) < 0.6) || APPROXIMATE.has(`${f}:${m[1]}`);
          if (!ok) miss.push(`${f}.ts:${i + 1} $${m[1]} :: ${line.trim().slice(0, 100)}`);
        }
      });
      expect(miss, miss.join('\n')).toEqual([]);
    });
  }
});
