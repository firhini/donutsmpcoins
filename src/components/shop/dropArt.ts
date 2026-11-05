import type { BoxContent, Product } from '../../shared/types';

const MONEY_ART: [number, string][] = [
  [1000, '/img/products/money-1b.svg'],
  [500, '/img/products/money-500m.svg'],
  [250, '/img/products/money-250m.svg'],
  [100, '/img/products/money-100m.svg'],
  [50, '/img/products/money-50m.svg'],
  [25, '/img/products/money-25m.svg'],
  [10, '/img/products/money-10m.svg'],
  [0, '/img/products/money-1m.svg'],
];

/** Artwork for a box drop line: the matching shop product's image, money art by size, or the fallback. */
export function dropImage(c: BoxContent, products: Product[]): string {
  const m = c.name.match(/^(\d+)([MB]) Money/);
  if (m) {
    const millions = Number(m[1]) * (m[2] === 'B' ? 1000 : 1);
    return (MONEY_ART.find(([min]) => millions >= min) ?? MONEY_ART[MONEY_ART.length - 1])[1];
  }
  const byId = c.productId ? products.find((p) => p.id === c.productId) : undefined;
  if (byId) return byId.image;
  const base = c.name.replace(/\s*\((?:guaranteed|God|maxed)\)$/i, '').trim();
  const exact = products.find((p) => p.name === c.name || p.name === base);
  if (exact) return exact.image;
  const loose = products.find((p) => p.name.toLowerCase().startsWith(base.toLowerCase()));
  return loose?.image ?? '/img/products/_fallback.svg';
}

export const RARITY_ORDER: Record<NonNullable<BoxContent['rarity']>, number> = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };

/** Random lines of a box, best first (rarest tier, then rarest line). */
export function sortedDrops(p: Product): BoxContent[] {
  return (p.contents ?? [])
    .filter((c) => (c.weight ?? 1) > 0)
    .sort((a, b) => RARITY_ORDER[a.rarity ?? 'common'] - RARITY_ORDER[b.rarity ?? 'common'] || (a.weight ?? 1) - (b.weight ?? 1));
}

/** Short label for tiles: "100M", "Elytra", "Iron Golem Spawner" → "Iron Golem". */
export function shortDropName(name: string): string {
  const m = name.match(/^(\d+[MB]) Money/);
  if (m) return `${m[1]} Money`;
  return name.replace(/\s*\((?:guaranteed|God|maxed)\)$/i, '').replace(/ Spawner$/, ' Spawner');
}
