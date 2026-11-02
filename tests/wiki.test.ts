import { describe, expect, it } from 'vitest';
import { wikiArticles } from '../src/data/wiki';

const words = (a: (typeof wikiArticles)[number]) =>
  [a.intro, ...a.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.list ?? [])]), ...a.faq.flatMap((f) => [f.q, f.a])].join(' ').split(/\s+/).length;

describe('wiki', () => {
  it('has unique slugs, titles and descriptions', () => {
    for (const k of ['slug', 'seoTitle', 'metaDescription', 'title'] as const) {
      const v = wikiArticles.map((a) => a[k]);
      expect(new Set(v).size, k).toBe(v.length);
    }
  });
  it('every article meets the SEO limits and links to existing wiki pages', () => {
    const slugs = new Set(wikiArticles.map((a) => a.slug));
    for (const a of wikiArticles) {
      expect(a.seoTitle.length, a.slug).toBeLessThanOrEqual(48);
      expect(a.metaDescription.length, a.slug).toBeGreaterThanOrEqual(100);
      expect(a.metaDescription.length, a.slug).toBeLessThanOrEqual(160);
      expect(words(a), a.slug).toBeGreaterThanOrEqual(350);
      for (const r of a.related) expect(slugs.has(r), `${a.slug} → ${r}`).toBe(true);
      const links = [a.intro, ...a.sections.flatMap((s) => [...s.paragraphs, ...(s.list ?? [])]), ...a.faq.map((f) => f.a)].join(' ').match(/\]\(\/wiki\/([a-z0-9-]+)\)/g) ?? [];
      for (const l of links) expect(slugs.has(l.slice(8, -1)), `${a.slug} links ${l}`).toBe(true);
    }
  });
});
