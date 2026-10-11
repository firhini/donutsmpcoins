import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Seo } from '../components/ui/Seo';
import { Icon } from '../components/ui/Icons';
import { CategoryHotbar, type HotbarValue } from '../components/shop/CategoryHotbar';
import { ProductGrid } from '../components/shop/ProductGrid';
import { matchesSearch, sortProducts, type SortKey } from '../components/shop/productUtils';
import NotFound from './NotFound';
import '../styles/shop.css';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'featured', label: 'Featured' },
  { key: 'price-asc', label: 'Price: low to high' },
  { key: 'price-desc', label: 'Price: high to low' },
  { key: 'name', label: 'Name A–Z' },
];

const LANDING: Partial<Record<string, { to: string; label: string }>> = {
  money: { to: '/donutsmp-money', label: 'Full money price guide' },
  spawners: { to: '/donutsmp-spawners', label: 'Spawner buying guide' },
};

export default function Shop() {
  const { category: slug } = useParams<{ category?: string }>();
  const { config, products, categories, loading } = useStore();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('featured');

  const category = slug ? categories.find((c) => c.slug === slug) : undefined;
  const value: HotbarValue = category ? category.id : 'all';

  const counts = useMemo(() => {
    const c: Partial<Record<HotbarValue, number>> = { all: products.length };
    for (const p of products) c[p.categoryId] = (c[p.categoryId] ?? 0) + 1;
    return c;
  }, [products]);

  const list = useMemo(() => {
    const base = products.filter((p) => (!category || p.categoryId === category.id) && matchesSearch(p, q));
    return sortProducts(base, sort);
  }, [products, category, q, sort]);

  if (slug && !category && !loading) return <NotFound />;

  const title = category ? category.name : 'Shop';
  const tagline = category ? category.tagline : `Everything we sell on ${config.serverName} – money, spawners, mystery boxes, gear and bundles.`;
  const landing = category ? LANDING[category.id] : undefined;

  return (
    <div className="container page">
      <Seo title={`${title} · ${config.storeName}`} description={`${tagline} Fast in-game delivery, bulk discounts and daily free spins.`} />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        {category ? (
          <>
            <Link to="/shop">Shop</Link>
            <span aria-hidden="true">/</span>
            <span>{category.name}</span>
          </>
        ) : (
          <span>Shop</span>
        )}
      </nav>
      <div className="shop-head">
        <h1>{title}</h1>
        <p className="lead">{tagline}</p>
        {landing && (
          <Link to={landing.to} className="shop-landing-link">
            <Icon name="info" size={14} /> {landing.label}
          </Link>
        )}
      </div>

      <CategoryHotbar value={value} mode="link" counts={counts} />

      <div className="shop-toolbar">
        <div className="shop-search">
          <Icon name="search" size={18} />
          <input className="input" type="search" placeholder={`Search ${category ? category.name.toLowerCase() : 'all products'}…`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
          {q && (
            <button type="button" className="shop-clear" onClick={() => setQ('')} aria-label="Clear search">
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
        <select className="select shop-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort products">
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="shop-count">
          {list.length} {list.length === 1 ? 'product' : 'products'}
        </span>
      </div>

      <ProductGrid
        products={list}
        loading={loading}
        eagerCount={4}
        empty={
          q ? (
            <>
              <h3>No matches for “{q}”</h3>
              <p className="muted">Try a shorter search or another category.</p>
            </>
          ) : (
            <>
              <h3>Nothing in this category right now</h3>
              <p className="muted">We are restocking – check back soon or ask on Discord.</p>
            </>
          )
        }
      />
    </div>
  );
}
