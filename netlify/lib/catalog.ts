import type { Catalog, Product } from '../../src/shared/types';
import { defaultCatalog } from '../../src/data/catalog';
import { kvGet, kvSet, kvUpdate } from './store';
import { HttpError } from './http';

import { mergeCatalog, type CatalogOverrides } from '../../src/shared/catalogMerge';

export type { CatalogOverrides };

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
  return mergeCatalog(defaultCatalog, await getOverrides());
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

function mergeLines(lines: { productId: string; qty: number }[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of lines) m.set(l.productId, (m.get(l.productId) ?? 0) + Math.max(0, Math.floor(l.qty)));
  return m;
}

function stockOf(p: Product, o: CatalogOverrides): number | null {
  const ov = o.overrides[p.id];
  const stock = ov && 'stock' in ov ? ov.stock : p.stock;
  return stock === undefined ? null : stock;
}

/**
 * Reserve stock for purchased lines atomically (null stock = unlimited).
 * Throws 409 when a product no longer has enough stock at write time.
 */
export async function decrementStock(lines: { productId: string; qty: number }[]): Promise<void> {
  const wanted = mergeLines(lines);
  if (!wanted.size) return;
  const base = new Map<string, Product>();
  for (const p of defaultCatalog.products) base.set(p.id, p);
  await kvUpdate<CatalogOverrides>('catalog', KEY, (cur) => {
    const o: CatalogOverrides = { overrides: cur?.overrides ?? {}, custom: cur?.custom ?? [], deleted: cur?.deleted ?? [] };
    for (const c of o.custom) base.set(c.id, c);
    for (const [id, qty] of wanted) {
      const p = base.get(id);
      if (!p) continue;
      const stock = stockOf(p, o);
      if (stock === null) continue;
      if (stock < qty) throw new HttpError(409, stock <= 0 ? `${p.name} is sold out.` : `Only ${stock}× ${p.name} left – please lower the quantity.`, 'out_of_stock');
      o.overrides[id] = { ...(o.overrides[id] ?? {}), stock: stock - qty };
    }
    return o;
  });
}

/** Give reserved stock back (order cancelled / refunded). Unlimited products are untouched. */
export async function restoreStock(lines: { productId: string; qty: number }[]): Promise<void> {
  const wanted = mergeLines(lines);
  if (!wanted.size) return;
  const base = new Map<string, Product>();
  for (const p of defaultCatalog.products) base.set(p.id, p);
  await kvUpdate<CatalogOverrides>('catalog', KEY, (cur) => {
    const o: CatalogOverrides = { overrides: cur?.overrides ?? {}, custom: cur?.custom ?? [], deleted: cur?.deleted ?? [] };
    for (const c of o.custom) base.set(c.id, c);
    for (const [id, qty] of wanted) {
      const p = base.get(id);
      if (!p) continue;
      const stock = stockOf(p, o);
      if (stock === null) continue;
      o.overrides[id] = { ...(o.overrides[id] ?? {}), stock: stock + qty };
    }
    return o;
  });
}
