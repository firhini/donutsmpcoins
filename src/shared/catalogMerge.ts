import type { Catalog, Product } from './types';

/**
 * Admin catalog overrides (stored in Netlify Blobs, edited in /admin → Products):
 *  - overrides: partial product patches keyed by product id (price, stock, hidden, tags, name …)
 *  - custom: products added in the admin
 *  - deleted: ids of default products the admin removed
 */
export interface CatalogOverrides {
  overrides: Record<string, Partial<Product>>;
  custom: Product[];
  deleted: string[];
}

/** Defaults from the code ⟵ admin overrides. Shared by the API and the build-time pre-renderer. */
export function mergeCatalog(defaults: Catalog, o: CatalogOverrides): Catalog {
  const products: Product[] = defaults.products.filter((p) => !o.deleted.includes(p.id)).map((p) => ({ ...p, ...(o.overrides[p.id] ?? {}) }));
  for (const c of o.custom) {
    const idx = products.findIndex((p) => p.id === c.id);
    const merged = { ...c, ...(o.overrides[c.id] ?? {}) };
    if (idx >= 0) products[idx] = merged;
    else products.push(merged);
  }
  products.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
  return { categories: defaults.categories, products };
}
