import type { ReactNode } from 'react';
import type { Product } from '../../shared/types';
import { ProductCard, ProductCardSkeleton } from './ProductCard';
import { Icon } from '../ui/Icons';

/** Responsive 4/3/2/1 grid of ProductCards with loading skeletons and an empty state. */
export function ProductGrid({
  products,
  loading = false,
  skeletons = 8,
  empty,
  columns = 4,
  compact = false,
  eagerCount = 0,
}: {
  products: Product[];
  loading?: boolean;
  skeletons?: number;
  empty?: ReactNode;
  columns?: 2 | 3 | 4;
  compact?: boolean;
  /** how many leading images load eagerly (above the fold) */
  eagerCount?: number;
}) {
  if (loading && products.length === 0) {
    return (
      <div className={`pgrid pgrid-${columns}`} aria-busy="true">
        {Array.from({ length: skeletons }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (products.length === 0) {
    return (
      <div className="empty pgrid-empty card">
        <div className="pgrid-empty-icon">
          <Icon name="search" size={28} />
        </div>
        {empty ?? (
          <>
            <h3>Nothing here yet</h3>
            <p className="muted">Try another category or a different search term.</p>
          </>
        )}
      </div>
    );
  }
  return (
    <div className={`pgrid pgrid-${columns}`}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} compact={compact} eager={i < eagerCount} />
      ))}
    </div>
  );
}
