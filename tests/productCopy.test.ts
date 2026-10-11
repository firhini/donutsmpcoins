import { describe, expect, it } from 'vitest';
import { products } from '../src/data/catalog';
import { copyFor, productCopy } from '../src/data/productCopy';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

describe('productCopy', () => {
  it('has copy for every catalog product', () => {
    const missing = products.filter((p) => !productCopy[p.id]).map((p) => p.id);
    expect(missing).toEqual([]);
  });

  it('has no copy for ids that are not in the catalog', () => {
    const ids = new Set(products.map((p) => p.id));
    const orphans = Object.keys(productCopy).filter((id) => !ids.has(id));
    expect(orphans).toEqual([]);
  });

  it('copyFor() returns the entry or undefined', () => {
    expect(copyFor('money-1m')).toBe(productCopy['money-1m']);
    expect(copyFor('does-not-exist')).toBeUndefined();
    expect(copyFor('toString')).toBeUndefined();
  });

  for (const p of products) {
    describe(p.id, () => {
      const c = productCopy[p.id];

      it('seoTitle is at most 65 characters and non-empty', () => {
        expect(c.seoTitle.length).toBeGreaterThan(10);
        expect(c.seoTitle.length).toBeLessThanOrEqual(65);
      });

      it('metaDescription is 100–160 characters', () => {
        expect(c.metaDescription.length).toBeGreaterThanOrEqual(100);
        expect(c.metaDescription.length).toBeLessThanOrEqual(160);
      });

      it('description has at least 80 words in 2–3 paragraphs', () => {
        expect(words(c.description)).toBeGreaterThanOrEqual(80);
        const paragraphs = c.description.split('\n\n').filter((s) => s.trim());
        expect(paragraphs.length).toBeGreaterThanOrEqual(2);
        expect(paragraphs.length).toBeLessThanOrEqual(3);
      });

      it('has 3–5 bullets and at least 2 FAQ entries', () => {
        expect(c.bullets.length).toBeGreaterThanOrEqual(3);
        expect(c.bullets.length).toBeLessThanOrEqual(5);
        expect(c.faq.length).toBeGreaterThanOrEqual(2);
        for (const f of c.faq) {
          expect(f.q.trim().length).toBeGreaterThan(5);
          expect(f.a.trim().length).toBeGreaterThan(20);
        }
      });

      it('seoTitle quotes the catalog price', () => {
        const price = `$${(p.priceCents / 100).toFixed(2)}`;
        // money-1m advertises its best bulk rate instead of the base price
        const expected = p.id === 'money-1m' ? '$0.13' : price;
        expect(c.seoTitle).toContain(expected);
      });
    });
  }
});
