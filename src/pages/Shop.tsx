import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Seo } from '../components/ui/Seo';
import { breadcrumbSchema, collectionSchema, faqSchema } from '../seo/schema';
import { copyFor } from '../data/categoryCopy';
import { Accordion } from '../components/shop/Accordion';
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

  // `/shop?q=term` is the search URL advertised to Google (WebSite SearchAction in the
  // JSON-LD) – read it once on the client and keep the address bar in sync while typing.
  // Done in effects (not in the initial state) so the pre-rendered HTML hydrates cleanly.
  const synced = useRef(false);
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('q');
    if (initial) setQ(initial.slice(0, 60));
    synced.current = true;
  }, []);
  useEffect(() => {
    if (!synced.current) return;
    const url = new URL(window.location.href);
    const term = q.trim();
    if ((url.searchParams.get('q') ?? '') === term) return;
    if (term) url.searchParams.set('q', term);
    else url.searchParams.delete('q');
    window.history.replaceState(window.history.state, '', url);
  }, [q]);

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
  const copy = copyFor(value);

  return (
    <div className="container page">
      <Seo
        title={copy.seoTitle}
        description={copy.metaDescription}
        canonical={category ? `/shop/${category.slug}` : '/shop'}
        jsonLd={[
          breadcrumbSchema(category ? [{ name: 'Home', path: '/' }, { name: 'Shop', path: '/shop' }, { name: category.name, path: `/shop/${category.slug}` }] : [{ name: 'Home', path: '/' }, { name: 'Shop', path: '/shop' }]),
          collectionSchema(`${title} – ${config.serverName}`, category ? `/shop/${category.slug}` : '/shop', list, copy.metaDescription),
          faqSchema(copy.faq)!,
        ]}
      />
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
        <p className="shop-intro">{copy.intro}</p>
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

      <h2 className="sr-only">Products</h2>
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

      <section className="shop-copy">
        {copy.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
        {copy.faq.length > 0 && (
          <>
            <h2>{title} – questions &amp; answers</h2>
            <Accordion items={copy.faq.map((f, i) => ({ id: `${value}-faq-${i}`, q: f.q, a: f.a }))} />
          </>
        )}
      </section>
    </div>
  );
}
