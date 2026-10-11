import { useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Product } from '../../shared/types';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../ui/Icons';
import { CartLineRow } from './CartLineRow';
import { TierProgress } from './TierProgress';
import { Thumb } from './Thumb';
import { isMillionsProduct } from './cartUtils';
import '../../styles/cart.css';

/**
 * Right-side slide-in cart. Always mounted so the open/close transition can
 * run; closed state is inert + aria-hidden + visibility hidden (CSS).
 */
export function CartDrawer() {
  const { isOpen, close, lines, quote } = useCart();
  const { products, fmt } = useStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<Element | null>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  const { pathname } = useLocation();

  // close when navigating
  const firstPath = useRef(pathname);
  useEffect(() => {
    if (firstPath.current !== pathname) {
      firstPath.current = pathname;
      closeRef.current();
    }
  }, [pathname]);

  // escape, scroll lock, focus management
  useEffect(() => {
    if (!isOpen) return;
    lastFocus.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => panelRef.current?.focus({ preventScroll: true }), 40);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
      const el = lastFocus.current as HTMLElement | null;
      if (el && typeof el.focus === 'function' && document.contains(el)) el.focus({ preventScroll: true });
    };
  }, [isOpen]);

  const featured = useMemo(() => products.filter((p) => p.featured && !p.hidden && !(p.stock !== null && p.stock <= 0)).slice(0, 3), [products]);
  const quoteById = useMemo(() => new Map(quote.lines.map((l) => [l.productId, l])), [quote.lines]);
  const empty = lines.length === 0;

  return (
    <div className={`cd ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
      <div className="cd-overlay" onClick={close} />
      <div className="cd-panel" ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Shopping cart" inert={!isOpen}>
        <header className="cd-head">
          <div className="cd-title">
            <span className="cd-title-icon">
              <Icon name="cart" size={18} />
            </span>
            <span>Your cart</span>
            {!empty && <span className="cd-count">{lines.length}</span>}
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={close} aria-label="Close cart">
            <Icon name="close" size={20} />
          </button>
        </header>

        {empty ? (
          <div className="cd-body cd-empty">
            <EmptyArt />
            <h3>Your cart is empty</h3>
            <p className="muted small">Grab some coins or a mystery box – everything is delivered in-game.</p>
            <Link to="/shop" className="btn btn-primary" onClick={close}>
              Browse store <Icon name="arrowRight" size={16} />
            </Link>
            {featured.length > 0 && (
              <div className="cd-featured">
                <div className="cd-featured-title">
                  <Icon name="flame" size={14} /> Popular right now
                </div>
                {featured.map((p) => (
                  <FeaturedRow key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="cd-body">
              {lines.map((l) => (
                <CartLineRow key={l.productId} line={l} quoteLine={quoteById.get(l.productId)} variant="drawer" />
              ))}
            </div>
            <footer className="cd-foot">
              <TierProgress quote={quote} compact />
              <div className="cd-totals">
                <div className="cd-trow">
                  <span>Subtotal</span>
                  <span>{fmt(quote.subtotalCents)}</span>
                </div>
                {quote.saleDiscountCents > 0 && (
                  <div className="cd-trow is-good">
                    <span>Sale −{quote.salePercent}%</span>
                    <span>−{fmt(quote.saleDiscountCents)}</span>
                  </div>
                )}
                {quote.tierDiscountCents > 0 && (
                  <div className="cd-trow is-good">
                    <span>Bulk tier −{quote.tierPercent}%</span>
                    <span>−{fmt(quote.tierDiscountCents)}</span>
                  </div>
                )}
                <div className="cd-total">
                  <span>Total</span>
                  <strong>{fmt(quote.totalCents)}</strong>
                </div>
              </div>
              <div className="cd-actions">
                <Link to="/checkout" className="btn btn-primary btn-lg btn-block" onClick={close}>
                  Checkout <Icon name="arrowRight" size={18} />
                </Link>
                <Link to="/cart" className="btn btn-secondary btn-block" onClick={close}>
                  View cart
                </Link>
              </div>
              <p className="cd-note">
                <Icon name="tag" size={12} /> Discount codes &amp; store credit are applied at checkout.
              </p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

function FeaturedRow({ product }: { product: Product }) {
  const { add } = useCart();
  const { fmt } = useStore();
  const millions = isMillionsProduct(product);
  const qty = millions ? 10 : product.minQty ?? 1;
  return (
    <div className="cd-feat">
      <Thumb src={product.image} size={44} />
      <div className="cd-feat-info">
        <Link to={`/product/${product.slug}`} className="cd-feat-name">
          {product.name}
        </Link>
        <span className="cd-feat-price">
          {fmt(product.priceCents)} {product.unitLabel && <span className="muted">{product.unitLabel}</span>}
        </span>
      </div>
      <button type="button" className="btn btn-outline btn-sm" onClick={() => add(product.id, qty, { open: false })} aria-label={`Add ${product.name} to cart`}>
        <Icon name="plus" size={14} /> {millions ? '10M' : 'Add'}
      </button>
    </div>
  );
}

function EmptyArt() {
  return (
    <svg className="cd-empty-art" viewBox="0 0 120 100" width="140" height="116" aria-hidden="true">
      <defs>
        <linearGradient id="cd-ea-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd56a" />
          <stop offset="1" stopColor="#ff5ea8" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="90" rx="38" ry="6" fill="rgba(255,255,255,0.05)" />
      <path d="M14 20h12l9 44h48l8-30H32" fill="none" stroke="url(#cd-ea-g)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="78" r="5" fill="url(#cd-ea-g)" />
      <circle cx="76" cy="78" r="5" fill="url(#cd-ea-g)" />
      <circle cx="94" cy="24" r="10" fill="none" stroke="#ffc233" strokeWidth="3" strokeDasharray="4 4" opacity="0.8" />
      <circle cx="94" cy="24" r="3" fill="#ffc233" />
    </svg>
  );
}
