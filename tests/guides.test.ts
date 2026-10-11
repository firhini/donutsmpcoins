import { describe, expect, it } from 'vitest';
import { formatGuideDate, guideBySlug, guideExcerpt, guidePlainText, guideWordCount, guides, sectionId } from '../src/data/guides';
import { products } from '../src/data/catalog';
import { defaultSettings } from '../src/data/settings';

const vars = { store: defaultSettings.storeName, server: defaultSettings.serverName, eta: defaultSettings.delivery.etaText };
const productIds = new Set(products.map((p) => p.id));
const productSlugs = new Set(products.map((p) => p.slug));
const guideSlugs = new Set(guides.map((g) => g.slug));

/** every string a guide renders (intro, sections, lists, faq, meta) */
function allText(g: (typeof guides)[number]): string[] {
  return [g.title, g.seoTitle, g.metaDescription, g.intro, ...g.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.list ?? [])]), ...g.faq.flatMap((f) => [f.q, f.a])];
}

describe('guides data', () => {
  it('has exactly 7 guides with unique slugs', () => {
    expect(guides).toHaveLength(7);
    expect(guideSlugs.size).toBe(7);
    for (const g of guides) expect(g.slug).toMatch(/^[a-z0-9-]+$/);
  });

  it('every guide has at least 650 words of body copy (intro + sections)', () => {
    for (const g of guides) {
      const words = guideWordCount(g);
      expect(words, `${g.slug} has ${words} words`).toBeGreaterThanOrEqual(650);
      expect(words, `${g.slug} is too long (${words})`).toBeLessThanOrEqual(1300);
    }
  });

  it('meta descriptions are 100–160 characters once placeholders are filled', () => {
    for (const g of guides) {
      const d = guidePlainText(g.metaDescription, vars);
      expect(d.length, `${g.slug}: "${d}" (${d.length})`).toBeGreaterThanOrEqual(100);
      expect(d.length, `${g.slug}: "${d}" (${d.length})`).toBeLessThanOrEqual(160);
      expect(d).not.toMatch(/\{\{/);
    }
  });

  it('titles are set, SEO titles differ from the H1 and stay a sane length', () => {
    for (const g of guides) {
      expect(g.title.length).toBeGreaterThan(20);
      const seo = guidePlainText(g.seoTitle, vars);
      expect(seo).toContain(defaultSettings.storeName);
      expect(seo.length).toBeLessThanOrEqual(90);
    }
  });

  it('every guide has at least 3 FAQ entries with non-empty answers', () => {
    for (const g of guides) {
      expect(g.faq.length, g.slug).toBeGreaterThanOrEqual(3);
      for (const f of g.faq) {
        expect(f.q.trim().length).toBeGreaterThan(8);
        expect(f.a.trim().length).toBeGreaterThan(20);
      }
    }
  });

  it('relatedProductIds reference products that exist in the catalog', () => {
    for (const g of guides) {
      expect(g.relatedProductIds.length, g.slug).toBeGreaterThan(0);
      for (const id of g.relatedProductIds) expect(productIds.has(id), `${g.slug} → ${id}`).toBe(true);
      expect(new Set(g.relatedProductIds).size).toBe(g.relatedProductIds.length);
    }
  });

  it('relatedGuides reference other existing guides', () => {
    for (const g of guides) {
      expect(g.relatedGuides.length, g.slug).toBeGreaterThan(0);
      for (const s of g.relatedGuides) {
        expect(guideSlugs.has(s), `${g.slug} → ${s}`).toBe(true);
        expect(s).not.toBe(g.slug);
      }
    }
  });

  it('internal links inside the copy point at existing guides, products and routes', () => {
    const known = new Set(['/shop', '/track', '/refund-policy', '/faq', '/spin', '/donutsmp-money', '/donutsmp-spawners', '/donutsmp-irl-trade', '/guides']);
    for (const g of guides) {
      for (const text of allText(g)) {
        for (const m of text.matchAll(/\]\(([^)]+)\)/g)) {
          const href = m[1];
          expect(href, `${g.slug}: ${href}`).toMatch(/^\//);
          if (href.startsWith('/guides/')) expect(guideSlugs.has(href.slice('/guides/'.length)), `${g.slug}: ${href}`).toBe(true);
          else if (href.startsWith('/product/')) expect(productSlugs.has(href.slice('/product/'.length)), `${g.slug}: ${href}`).toBe(true);
          else expect(known.has(href), `${g.slug}: unknown link ${href}`).toBe(true);
        }
      }
    }
  });

  it('only uses supported placeholders', () => {
    for (const g of guides) {
      for (const text of allText(g)) {
        for (const m of text.matchAll(/\{\{(\w+)\}\}/g)) expect(['store', 'server', 'eta'], `${g.slug}: {{${m[1]}}}`).toContain(m[1]);
      }
    }
  });

  it('section anchors are unique within a guide and sections carry real copy', () => {
    for (const g of guides) {
      expect(g.sections.length, g.slug).toBeGreaterThanOrEqual(5);
      const ids = g.sections.map((s) => sectionId(s.heading));
      expect(new Set(ids).size, `${g.slug}: ${ids.join(',')}`).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
      for (const s of g.sections) expect(s.paragraphs.length, `${g.slug}/${s.heading}`).toBeGreaterThan(0);
    }
  });

  it('has a valid ISO date and a reading time derived from the word count', () => {
    for (const g of guides) {
      expect(g.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(g.readingMinutes).toBeGreaterThanOrEqual(3);
      expect(g.readingMinutes).toBe(Math.max(1, Math.round(guideWordCount(g) / 200)));
    }
  });

  it('never promises bots or automatic delivery', () => {
    for (const g of guides) {
      const body = allText(g).join(' ').toLowerCase();
      expect(body).not.toMatch(/delivery bot|auto-?delivery|instant(ly)? deliver/);
    }
  });
});

describe('guide helpers', () => {
  it('guidePlainText strips markup and fills placeholders', () => {
    expect(guidePlainText('**Bold** and [link](/shop) with `code` at {{store}}', { store: 'DonutCoins' })).toBe('Bold and link with code at DonutCoins');
  });

  it('sectionId slugifies headings', () => {
    expect(sectionId('Method 1: Spawner farms – the reliable grind')).toBe('method-1-spawner-farms-the-reliable-grind');
    expect(sectionId('What DonutSMP’s rules say – and what that means for you')).toBe('what-donutsmps-rules-say-and-what-that-means-for-you');
  });

  it('guideBySlug is case-insensitive and tolerant of undefined', () => {
    expect(guideBySlug(undefined)).toBeUndefined();
    expect(guideBySlug('nope')).toBeUndefined();
    expect(guideBySlug('DonutSMP-Elytra-Guide')?.slug).toBe('donutsmp-elytra-guide');
  });

  it('guideExcerpt cuts on a word boundary with an ellipsis', () => {
    const ex = guideExcerpt(guides[0], 120, vars);
    expect(ex.length).toBeLessThanOrEqual(121);
    expect(ex.endsWith('…')).toBe(true);
    expect(ex).not.toMatch(/\s…$/);
  });

  it('formatGuideDate renders without timezone drift', () => {
    expect(formatGuideDate('2026-10-11')).toBe('Oct 11, 2026');
    expect(formatGuideDate('bad')).toBe('bad');
  });
});
