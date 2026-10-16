import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatMillions } from '../shared/pricing';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { Seo } from '../components/ui/Seo';
import { breadcrumbSchema, faqSchema, productPng, productSchema } from '../seo/schema';
import { copyFor } from '../data/productCopy';
import { Accordion } from '../components/shop/Accordion';
import { Icon } from '../components/ui/Icons';
import { Price } from '../components/ui/Price';
import { ProductImage } from '../components/shop/ProductImage';
import { ProductGrid } from '../components/shop/ProductGrid';
import { BoxContents } from '../components/shop/BoxContents';
import { QtyStepper } from '../components/shop/QtyStepper';
import { badgeClassForTag, bulkTable, discountPercent, hasContents, isMillionsProduct, linePrice, stockState } from '../components/shop/productUtils';
import NotFound from './NotFound';
import '../styles/shop.css';

export default function ProductPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { config, products, categories, productBySlug, fmt, loading } = useStore();
  const { add } = useCart();
  const product = productBySlug(slug);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (product) setQty(isMillionsProduct(product) ? Math.max(product.minQty ?? 1, 50) : product.minQty ?? 1);
    setAdded(false);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const related = useMemo(() => {
    if (!product) return [];
    const same = products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id);
    return same.sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || (a.sortOrder ?? 999) - (b.sortOrder ?? 999)).slice(0, 4);
  }, [products, product]);

  if (!product) {
    if (loading) {
      return (
        <div className="container page">
          <div className="pp">
            <div className="skeleton" style={{ aspectRatio: '1 / 1', borderRadius: 28 }} />
            <div className="stack">
              <div className="skeleton" style={{ height: 36, width: '70%' }} />
              <div className="skeleton" style={{ height: 20, width: '40%' }} />
              <div className="skeleton" style={{ height: 120 }} />
            </div>
          </div>
        </div>
      );
    }
    return <NotFound />;
  }

  const category = categories.find((c) => c.id === product.categoryId);
  const stock = stockState(product);
  const off = discountPercent(product);
  const millions = isMillionsProduct(product);
  const minQty = product.minQty ?? 1;
  const maxQty = Math.min(product.maxQty ?? 10000, product.stock ?? Infinity);
  const line = linePrice(product, qty);
  const table = bulkTable(product);
  const activeTier = [...table].reverse().find((t) => qty >= t.minQty) ?? table[0];
  const isMoneyKind = product.kind === 'money';
  const deliveryText = product.deliveryNote ?? (isMoneyKind ? config.delivery.moneyText : config.delivery.itemText);
  const perMillion = isMoneyKind && !millions && product.moneyMillions ? Math.round(product.priceCents / product.moneyMillions) : null;

  const onAdd = () => {
    if (stock.soldOut) return;
    add(product.id, qty);
    setAdded(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1600);
  };

  const copy = copyFor(product.id);
  const description = copy?.description.split(/\n\n+/)[0] ?? product.description ?? product.shortDesc ?? `${product.name} for ${config.serverName}, delivered in-game by our staff.`;
  const paragraphs = copy ? copy.description.split(/\n\n+/) : [description];
  const seoTitle = copy?.seoTitle ?? `${product.name} | ${config.storeName}`;
  const metaDescription = copy?.metaDescription ?? `${description} ${fmt(product.priceCents)}${product.unitLabel ? ` ${product.unitLabel}` : ''}. Fast delivery on ${config.serverName}.`;

  return (
    <div className="container page">
      <Seo
        title={seoTitle}
        description={metaDescription}
        canonical={`/product/${product.slug}`}
        type="product"
        image={productPng(product)} twitterCard="summary"
        jsonLd={[
          breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Shop', path: '/shop' }, ...(category ? [{ name: category.name, path: `/shop/${category.slug}` }] : []), { name: product.name, path: `/product/${product.slug}` }]),
          productSchema(product, config, category, copy?.metaDescription ?? description),
          ...(copy?.faq?.length ? [faqSchema(copy.faq)!] : []),
        ]}
      />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to="/shop">Shop</Link>
        {category && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/shop/${category.slug}`}>{category.name}</Link>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="pp">
        <div className="pp-hero">
          {product.tags && product.tags.length > 0 && (
            <div className="pp-hero-tags">
              {product.tags.map((t) => (
                <span key={t} className={badgeClassForTag(t)}>
                  {t}
                </span>
              ))}
            </div>
          )}
          {off && <span className="pcard-off pp-hero-off">-{off}%</span>}
          <ProductImage product={product} size="xl" eager />
        </div>

        <div className="pp-info">
          <div className="pp-meta">
            <span className={stock.className}>
              <i aria-hidden="true" /> {stock.label}
            </span>
            {category && (
              <Link to={`/shop/${category.slug}`} className="badge">
                {category.name}
              </Link>
            )}
            <span className="badge">{kindLabel(product.kind)}</span>
          </div>
          <h1>{product.name}</h1>
          <div className="pp-price">
            <Price cents={product.priceCents} compareAtCents={product.compareAtCents} size="xl" />
            {product.unitLabel && <span className="muted">{product.unitLabel}</span>}
            {perMillion !== null && <span className="muted">≈ {fmt(perMillion)} per 1M</span>}
            {off && <span className="badge badge-pink">Save {off}%</span>}
          </div>
          <div className="pp-desc">
            {paragraphs.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          {copy?.bullets?.length ? (
            <ul className="pp-bullets">
              {copy.bullets.map((b, i) => (
                <li key={i}>
                  <Icon name="check" size={14} /> {b}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="pp-buy">
            <div className="pp-buy-row">
              <QtyStepper value={qty} onChange={setQty} min={minQty} max={maxQty} step={millions ? 5 : 1} suffix={millions ? 'M' : undefined} label={millions ? 'Millions' : 'Quantity'} size="lg" disabled={stock.soldOut} />
              <button type="button" className={`btn btn-lg ${added ? 'btn-success' : 'btn-primary'}`} onClick={onAdd} disabled={stock.soldOut}>
                {added ? (
                  <>
                    <Icon name="check" size={18} /> Added to cart
                  </>
                ) : stock.soldOut ? (
                  'Sold out'
                ) : (
                  <>
                    <Icon name="cart" size={18} /> Add to cart
                  </>
                )}
              </button>
            </div>
            <div className="pp-line" aria-live="polite">
              {millions ? (
                <>
                  <strong>{formatMillions(line.qty)}</strong> = <strong className="gold-text">{fmt(line.totalCents)}</strong> · {fmt(line.unitCents)} per 1M
                </>
              ) : (
                <>
                  {line.qty}× {product.name} = <strong className="gold-text">{fmt(line.totalCents)}</strong>
                  {line.qty > 1 && <> · {fmt(line.unitCents)} each</>}
                </>
              )}
              {line.savingsCents > 0 && <span className="badge badge-green">bulk: you save {fmt(line.savingsCents)}</span>}
              {stock.low && <span className="badge badge-red">only {product.stock} left</span>}
            </div>
            {maxQty < Infinity && !stock.soldOut && (
              <span className="xs muted">
                Max {millions ? formatMillions(maxQty) : maxQty} per order – need more? Ask on Discord for a custom quote.
              </span>
            )}
          </div>

          {table.length > 1 && (
            <div className="pp-block">
              <h2>
                <Icon name="percent" size={16} /> Bulk pricing
              </h2>
              <table className="bulk-table">
                <thead>
                  <tr>
                    <th>Quantity</th>
                    <th>Unit price</th>
                    <th>You save</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((t) => (
                    <tr key={t.minQty} className={t.minQty === activeTier.minQty ? 'active' : ''}>
                      <td>
                        {millions ? formatMillions(t.minQty) : t.minQty}+{millions ? '' : ' pcs'}
                      </td>
                      <td>
                        {fmt(t.priceCents)}
                        {product.unitLabel ? ` ${product.unitLabel}` : ''}
                      </td>
                      <td>{t.savePercent > 0 ? `${t.savePercent}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {hasContents(product) && (
            <div className="pp-block">
              <h2>
                <Icon name="eye" size={16} /> What's inside?
              </h2>
              <BoxContents product={product} />
            </div>
          )}

          <div className="pp-block">
            <h2>
              <Icon name="truck" size={16} /> Delivery
            </h2>
            <p className="small text-2">{deliveryText}</p>
            <p className="xs muted" style={{ marginTop: 8 }}>
              <Icon name="clock" size={12} /> {config.delivery.etaText}
            </p>
          </div>

          <div className="pp-trust">
            <div>
              <Icon name="shield" size={16} /> Order tracked by ID
            </div>
            <div>
              <Icon name="users" size={16} /> Delivered by real staff
            </div>
            <div>
              <Icon name="discord" size={16} /> Support on Discord
            </div>
          </div>
          <p className="xs muted pp-rules">
            Buying is against {config.serverName}'s rules on real-money trading and at your own risk – we deliver with normal player actions and are not affiliated with the server or
            Mojang. <Link to="/terms#server-rules">Details</Link>
          </p>
        </div>
      </div>

      {copy?.faq?.length ? (

        <section className="pp-faq">

          <h2>{product.name} – questions &amp; answers</h2>

          <Accordion items={copy.faq.map((f, i) => ({ id: `${product.id}-faq-${i}`, q: f.q, a: f.a }))} />

        </section>

      ) : null}

      {related.length > 0 && (
        <section className="pp-section">
          <div className="section-head">
            <span className="eyebrow">You might also like</span>
            <h2>More {category ? category.name.toLowerCase() : 'products'}</h2>
          </div>
          <ProductGrid products={related} columns={4} />
        </section>
      )}
    </div>
  );
}

function kindLabel(kind: string): string {
  switch (kind) {
    case 'money':
      return 'In-game money';
    case 'box':
      return 'Mystery box';
    case 'kit':
      return 'Kit';
    case 'bundle':
      return 'Bundle';
    case 'base':
      return 'Base';
    default:
      return 'Item';
  }
}
