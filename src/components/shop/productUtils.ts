import type { BulkTier, Product } from '../../shared/types';
import { clampQty, unitPriceCents } from '../../shared/pricing';

/** Badge class for a product tag ("Instant" → green, "Hot" → red …). */
export function badgeClassForTag(tag: string): string {
  const t = tag.trim().toLowerCase();
  if (t === 'instant' || t === 'fast') return 'badge badge-green';
  if (t === 'hot') return 'badge badge-red';
  if (t === 'new') return 'badge badge-blue';
  if (t === 'popular' || t === 'best value') return 'badge badge-gold';
  if (t === 'whale') return 'badge badge-violet';
  if (t.startsWith('guaranteed')) return 'badge badge-gold';
  if (t === 'rare') return 'badge badge-violet';
  if (t === 'cheap') return 'badge badge-green';
  return 'badge';
}

export type StockState = { label: string; className: string; soldOut: boolean; low: boolean };

export function stockState(p: Product): StockState {
  if (p.stock === null || p.stock === undefined) return { label: 'In stock', className: 'stock stock-ok', soldOut: false, low: false };
  if (p.stock <= 0) return { label: 'Sold out', className: 'stock stock-out', soldOut: true, low: false };
  if (p.stock <= 10) return { label: `${p.stock} left`, className: 'stock stock-low', soldOut: false, low: true };
  return { label: 'In stock', className: 'stock stock-ok', soldOut: false, low: false };
}

/** Percentage saved vs the compare-at price, or null. */
export function discountPercent(p: Product): number | null {
  if (!p.compareAtCents || p.compareAtCents <= p.priceCents) return null;
  const pct = Math.round((1 - p.priceCents / p.compareAtCents) * 100);
  return pct > 0 ? pct : null;
}

/** The cheapest bulk tier (highest quantity), or null. */
export function lowestBulkTier(p: Product): BulkTier | null {
  if (!p.bulkPricing || !p.bulkPricing.length) return null;
  return [...p.bulkPricing].sort((a, b) => a.priceCents - b.priceCents)[0] ?? null;
}

/** Sorted bulk table including the base row. */
export function bulkTable(p: Product): { minQty: number; priceCents: number; savePercent: number }[] {
  const base = { minQty: p.minQty ?? 1, priceCents: p.priceCents, savePercent: 0 };
  const tiers = [...(p.bulkPricing ?? [])]
    .sort((a, b) => a.minQty - b.minQty)
    .map((t) => ({ minQty: t.minQty, priceCents: t.priceCents, savePercent: Math.max(0, Math.round((1 - t.priceCents / p.priceCents) * 100)) }));
  return [base, ...tiers];
}

/** Line price for a quantity (bulk tiers applied). */
export function linePrice(p: Product, qty: number): { qty: number; unitCents: number; totalCents: number; bulk: boolean; savingsCents: number } {
  const q = clampQty(p, qty);
  const { price, bulk } = unitPriceCents(p, q);
  return { qty: q, unitCents: price, totalCents: price * q, bulk, savingsCents: Math.max(0, (p.priceCents - price) * q) };
}

/** True for the "pick your millions" money product (quantity = millions). */
export function isMillionsProduct(p: Product): boolean {
  return p.kind === 'money' && (p.moneyMillions ?? 0) === 1 && (p.maxQty ?? 0) > 1;
}

/** Products whose contents can be shown in a "What's inside?" panel. */
export function hasContents(p: Product): boolean {
  if (p.kind === 'box' || p.kind === 'kit') return !!p.contents && p.contents.length > 0;
  if (p.kind === 'bundle') return !!p.bundleItems && p.bundleItems.length > 0;
  return false;
}

export type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'name';

export function sortProducts(list: Product[], key: SortKey): Product[] {
  const arr = [...list];
  switch (key) {
    case 'price-asc':
      return arr.sort((a, b) => a.priceCents - b.priceCents || a.name.localeCompare(b.name));
    case 'price-desc':
      return arr.sort((a, b) => b.priceCents - a.priceCents || a.name.localeCompare(b.name));
    case 'name':
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return arr.sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name.localeCompare(b.name));
  }
}

export function matchesSearch(p: Product, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const hay = [p.name, p.shortDesc ?? '', p.description ?? '', ...(p.tags ?? []), p.categoryId].join(' ').toLowerCase();
  return s.split(/\s+/).every((w) => hay.includes(w));
}
