import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../shared/types';
import { formatMillions } from '../../shared/pricing';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../ui/Icons';
import { Modal } from '../ui/Modal';
import { Price } from '../ui/Price';
import { BoxContents } from './BoxContents';
import { ProductImage } from './ProductImage';
import { QtyStepper } from './QtyStepper';
import { badgeClassForTag, discountPercent, hasContents, isMillionsProduct, linePrice, lowestBulkTier, stockState } from './productUtils';
import '../../styles/shop.css';

/**
 * Storefront product card. Exported for other builders (cart upsells, free-stuff pages…).
 */
export function ProductCard({ product, compact = false, eager = false }: { product: Product; compact?: boolean; eager?: boolean }) {
  const { add } = useCart();
  const { fmt } = useStore();
  const stock = stockState(product);
  const off = discountPercent(product);
  const millions = isMillionsProduct(product);
  const minQty = product.minQty ?? 1;
  const maxQty = Math.min(product.maxQty ?? 10000, product.stock ?? Infinity);
  const [qty, setQty] = useState(millions ? Math.max(minQty, 10) : minQty);
  const [inside, setInside] = useState(false);
  const [added, setAdded] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const line = linePrice(product, qty);
  const bulk = lowestBulkTier(product);
  const tags = (product.tags ?? []).slice(0, 3);
  const perMillion = product.kind === 'money' && !millions && product.moneyMillions ? Math.round(product.priceCents / product.moneyMillions) : null;

  const onAdd = () => {
    if (stock.soldOut) return;
    add(product.id, qty);
    setAdded(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article className={`pcard card hover ${compact ? 'pcard-compact' : ''} ${stock.soldOut ? 'pcard-out' : ''}`} data-kind={product.kind}>
      {/* duplicate of the title link below – hidden from assistive tech and the tab order */}
      <Link to={`/product/${product.slug}`} className="pcard-media" aria-hidden="true" tabIndex={-1}>
        <ProductImage product={product} size={compact ? 'sm' : 'md'} eager={eager} />
        {tags.length > 0 && (
          <div className="pcard-badges">
            {tags.map((t) => (
              <span key={t} className={badgeClassForTag(t)}>
                {t}
              </span>
            ))}
          </div>
        )}
        {off && <span className="pcard-off">-{off}%</span>}
        {stock.soldOut && <span className="pcard-soldout pixel">Sold out</span>}
      </Link>

      <div className="pcard-body">
        <div className="pcard-meta">
          <span className={stock.className}>
            <i aria-hidden="true" /> {stock.label}
          </span>
          {product.unitLabel && <span className="pcard-unit">{product.unitLabel}</span>}
          {perMillion !== null && <span className="pcard-unit">≈ {fmt(perMillion)} per 1M</span>}
        </div>
        <h3 className="pcard-name">
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        {product.shortDesc && <p className="pcard-desc">{product.shortDesc}</p>}
        {hasContents(product) && (
          <button type="button" className="pcard-inside" onClick={() => setInside(true)}>
            <Icon name="eye" size={14} /> What's inside?
          </button>
        )}

        <div className="pcard-pricing">
          <Price cents={product.priceCents} compareAtCents={product.compareAtCents} size={compact ? 'sm' : 'md'} />
          {bulk && bulk.priceCents < product.priceCents && (
            <span className="pcard-bulk">
              from {fmt(bulk.priceCents)} at {bulk.minQty}+
            </span>
          )}
        </div>

        {millions && (
          <div className="pcard-calc" aria-live="polite">
            <strong>{formatMillions(line.qty)}</strong> = <strong className="gold-text">{fmt(line.totalCents)}</strong>
            <span className="muted"> · {fmt(line.unitCents)} per 1M</span>
            {line.bulk && <span className="badge badge-green pcard-calc-badge">bulk</span>}
          </div>
        )}
        {!millions && qty > 1 && !compact && (
          <div className="pcard-calc" aria-live="polite">
            {qty}× = <strong className="gold-text">{fmt(line.totalCents)}</strong>
            {line.bulk && <span className="badge badge-green pcard-calc-badge">bulk price</span>}
          </div>
        )}

        <div className="pcard-actions">
          <QtyStepper value={qty} onChange={setQty} min={minQty} max={maxQty} suffix={millions ? 'M' : undefined} step={millions ? 5 : 1} disabled={stock.soldOut} label={millions ? 'Millions' : 'Quantity'} />
          <button type="button" className={`btn ${added ? 'btn-success' : 'btn-primary'} pcard-add`} onClick={onAdd} disabled={stock.soldOut} aria-label={stock.soldOut ? `${product.name} – sold out` : `Add ${product.name} to cart`}>
            {added ? (
              <>
                <Icon name="check" size={16} /> Added
              </>
            ) : stock.soldOut ? (
              'Sold out'
            ) : (
              <>
                <Icon name="cart" size={16} /> Add
              </>
            )}
          </button>
        </div>
      </div>

      {hasContents(product) && (
        <Modal open={inside} onClose={() => setInside(false)} title={`What's inside ${product.name}?`} size="md">
          <BoxContents product={product} />
          <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end', gap: 8 }}>
            <Link to={`/product/${product.slug}`} className="btn btn-secondary btn-sm" onClick={() => setInside(false)}>
              View product
            </Link>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={stock.soldOut}
              onClick={() => {
                setInside(false);
                onAdd();
              }}
            >
              <Icon name="cart" size={14} /> Add to cart
            </button>
          </div>
        </Modal>
      )}
    </article>
  );
}

/** Skeleton placeholder with the same footprint as a ProductCard. */
export function ProductCardSkeleton() {
  return (
    <div className="pcard pcard-skel card" aria-hidden="true">
      <div className="skeleton pcard-skel-media" />
      <div className="pcard-body">
        <div className="skeleton" style={{ height: 12, width: '40%' }} />
        <div className="skeleton" style={{ height: 18, width: '75%' }} />
        <div className="skeleton" style={{ height: 12, width: '90%' }} />
        <div className="skeleton" style={{ height: 22, width: '35%', marginTop: 6 }} />
        <div className="skeleton" style={{ height: 38, width: '100%', marginTop: 8 }} />
      </div>
    </div>
  );
}
