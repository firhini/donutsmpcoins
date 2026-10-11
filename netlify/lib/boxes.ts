import type { BoxContent, Product, RolledContent } from '../../src/shared/types';
import { randomInt } from 'node:crypto';
import { weightedIndex } from './ids';

/**
 * Roll the contents of ONE mystery box. Lines with weight 0 are guaranteed
 * (always included); the remaining `boxRolls` lines are drawn by weight
 * without replacement.
 */
export function rollBox(product: Product): RolledContent[] {
  const pool = product.contents ?? [];
  const guaranteed = pool.filter((c) => c.weight === 0);
  const randomPool = pool.filter((c) => (c.weight ?? 1) > 0);
  const rolls = Math.max(1, product.boxRolls ?? 3);
  const picked: RolledContent[] = guaranteed.map(toRolled);
  const remaining = [...randomPool];
  for (let i = 0; i < rolls && remaining.length; i++) {
    const idx = weightedIndex(remaining.map((c) => c.weight ?? 1));
    picked.push(toRolled(remaining[idx]));
    remaining.splice(idx, 1);
  }
  return picked;
}

function toRolled(c: BoxContent): RolledContent {
  const qty = c.min === c.max ? c.min : randomInt(c.min, c.max + 1);
  return { name: c.name, qty, rarity: c.rarity, image: c.image };
}

/** Fixed contents of a kit (what the fulfiller must hand over). */
export function kitContents(product: Product): RolledContent[] {
  return (product.contents ?? []).map((c) => ({ name: c.name, qty: c.max, rarity: c.rarity, image: c.image }));
}

/** Drop chance per line (percentage) for the UI – approximate for multi-roll boxes. */
export function boxOdds(product: Product): { name: string; percent: number }[] {
  const pool = product.contents ?? [];
  const total = pool.reduce((s, c) => s + (c.weight ?? 1), 0) || 1;
  return pool.map((c) => ({ name: c.name, percent: c.weight === 0 ? 100 : Math.round(((c.weight ?? 1) / total) * 1000) / 10 }));
}
