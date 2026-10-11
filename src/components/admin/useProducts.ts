import { useMemo } from 'react';
import type { Category, Product } from '../../shared/types';
import { useStore } from '../../context/StoreContext';
import { listAdminProducts, type AdminCatalog } from '../../lib/adminApi';
import { useAdminQuery } from './hooks';

/**
 * Full catalog for admin screens (includes hidden products + override info).
 * Falls back to the public catalog from the store context while the admin API is unavailable,
 * so selects and tables still render.
 */
export function useAdminProducts() {
  const { products: publicProducts, categories: publicCategories } = useStore();
  const q = useAdminQuery<AdminCatalog>(listAdminProducts, []);
  const products: Product[] = useMemo(() => (q.data?.products.length ? q.data.products : publicProducts), [q.data, publicProducts]);
  const categories: Category[] = useMemo(() => {
    const list = q.data?.categories.length ? q.data.categories : publicCategories;
    return [...list].sort((a, b) => a.order - b.order);
  }, [q.data, publicCategories]);
  return { ...q, products, categories, overrides: q.data?.overrides ?? { overrides: {}, custom: [], deleted: [] }, fromFallback: !q.data };
}
