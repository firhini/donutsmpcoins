import type { Catalog, Product } from '../../src/shared/types';
import { defaultCatalog } from '../../src/data/catalog';
import { kvGet, kvSet } from './store';

/**
 * Catalog overrides stored by the admin panel:
 *  - overrides: partial product patches keyed by product id (price, stock, hidden, tags, name ...)
 *  - custom: fully custom products added in the admin
 *  - deleted: ids of default products the admin removed
 */
export interface CatalogOverrides {
  overrides: Record<string, Partial<Product>>;
  custom: Product[];
  deleted: string[];
}

const KEY = 'overrides';

export async function getOverrides(): Promise<CatalogOverrides> {
  const o = await kvGet<CatalogOverrides>('catalog', KEY);
  return { overrides: o?.overrides ?? {}, custom: o?.custom ?? [], deleted: o?.deleted ?? [] };
}

export async function saveOverrides(o: CatalogOverrides): Promise<void> {
  await kvSet('catalog', KEY, o);
}

/** Full merged catalog INCLUDING hidden products (admin use). */
export async function getFullCatalog(): Promise<Catalog> {
  const o = await getOverrides();
  const products: Product[] = defaultCatalog.products
    .filter((p) => !o.deleted.includes(p.id))
    .map((p) => ({ ...p, ...(o.overrides[p.id] ?? {}) }));
  for (const c of o.custom) {
    const idx = products.findIndex((p) => p.id === c.id);
    const merged = { ...c, ...(o.overrides[c.id] ?? {}) };
    if (idx >= 0) products[idx] = merged;
    else products.push(merged);
  }
  products.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
  return { categories: defaultCatalog.categories, products };
}

/** Public catalog (hidden products removed). */
export async function getCatalog(): Promise<Catalog> {
  const full = await getFullCatalog();
  return { ...full, products: full.products.filter((p) => !p.hidden) };
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const c = await getCatalog();
  return c.products.find((p) => p.id === id);
}

/** Decrement stock for purchased lines (null stock = unlimited). */
export async function decrementStock(lines: { productId: string; qty: number }[]): Promise<void> {
  const o = await getOverrides();
  const full = await getFullCatalog();
  let changed = false;
  for (const l of lines) {
    const p = full.products.find((x) => x.id === l.productId);
    if (!p || p.stock === null || p.stock === undefined) continue;
    const next = Math.max(0, p.stock - l.qty);
    o.overrides[p.id] = { ...(o.overrides[p.id] ?? {}), stock: next };
    changed = true;
  }
  if (changed) await saveOverrides(o);
}
