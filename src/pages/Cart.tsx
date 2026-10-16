import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { QuoteRequest } from '../shared/types';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { Seo } from '../components/ui/Seo';
import { Icon } from '../components/ui/Icons';
import { ProductGrid } from '../components/shop/ProductGrid';
import { CartLineRow } from '../components/cart/CartLineRow';
import { TierProgress } from '../components/cart/TierProgress';
import { PromoCodes } from '../components/cart/PromoCodes';
import { OrderSummary } from '../components/cart/OrderSummary';
import { useServerQuote } from '../components/cart/useServerQuote';
import '../styles/cart.css';

export default function Page() {
  const { lines, quote: localQuote, discountCode, referralCode, clear } = useCart();
  const { products, config } = useStore();
  const [confirmClear, setConfirmClear] = useState(false);

  const items = useMemo(() => lines.map((l) => ({ productId: l.productId, qty: l.qty })), [lines]);
  const req = useMemo<QuoteRequest | null>(
    () => (items.length ? { items, discountCode: discountCode || undefined, referralCode: referralCode || undefined } : null),
    [items, discountCode, referralCode],
  );
  const sq = useServerQuote(req, localQuote);
  const quoteById = useMemo(() => new Map(sq.quote.lines.map((l) => [l.productId, l])), [sq.quote.lines]);

  const suggestions = useMemo(() => {
    const inCart = new Set(lines.map((l) => l.productId));
    const pool = products.filter((p) => !p.hidden && !inCart.has(p.id) && !(p.stock !== null && p.stock <= 0));
    const featured = pool.filter((p) => p.featured);
    return [...featured, ...pool.filter((p) => !p.featured)].slice(0, 4);
  }, [products, lines]);

  const title = `Your cart | ${config.storeName}`;

  if (!lines.length) {
    return (
      <div className="container page cart-page">
        <Seo robots="noindex,follow" title={title} description="Your DonutCoins cart – DonutSMP money, spawners and mystery boxes delivered in-game." />
        <div className="cart-empty card">
          <div className="cart-empty-icon">
            <Icon name="cart" size={30} />
          </div>
          <h1>Your cart is empty</h1>
          <p className="muted">Pick up some DonutSMP money, a few spawners or try your luck with a mystery box.</p>
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            <Link to="/shop" className="btn btn-primary btn-lg">
              Browse the store <Icon name="arrowRight" size={18} />
            </Link>
            <Link to="/shop/mystery-boxes" className="btn btn-secondary btn-lg">
              <Icon name="box" size={18} /> Mystery boxes
            </Link>
          </div>
        </div>
        {suggestions.length > 0 && (
          <section className="cart-more">
            <div className="section-head">
              <div className="eyebrow">Popular</div>
              <h2>Start with these</h2>
            </div>
            <ProductGrid products={suggestions} columns={4} />
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="container page cart-page">
      <Seo robots="noindex,follow" title={title} description="Review your DonutCoins order, apply discount codes and continue to checkout." />
      <div className="page-head cart-head">
        <div>
          <div className="eyebrow">Step 1 of 2</div>
          <h1>Your cart</h1>
          <p className="muted">
            {lines.length} {lines.length === 1 ? 'item' : 'items'} · delivered in-game to your Minecraft account
          </p>
        </div>
        {confirmClear ? (
          <div className="row">
            <span className="small muted">Clear everything?</span>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                clear();
                setConfirmClear(false);
              }}
            >
              Yes, clear
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmClear(false)}>
              Keep
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmClear(true)}>
            <Icon name="trash" size={14} /> Clear cart
          </button>
        )}
      </div>

      <div className="cart-layout">
        <div className="cart-main">
          <div className="card cart-table">
            <div className="cart-table-head" aria-hidden="true">
              <span>Product</span>
              <span>Quantity</span>
              <span>Total</span>
              <span />
            </div>
            {lines.map((l) => (
              <CartLineRow key={l.productId} line={l} quoteLine={quoteById.get(l.productId)} variant="page" />
            ))}
          </div>

          <div className="card pad cart-tier">
            <TierProgress quote={sq.quote} />
          </div>

          <div className="card pad cart-codes">
            <h3 className="cart-h3">
              <Icon name="tag" size={18} /> Discount &amp; referral codes
            </h3>
            <PromoCodes subtotalCents={sq.quote.subtotalCents} quote={sq.quote} live={sq.live} onApplied={sq.refresh} />
          </div>

          <Link to="/shop" className="cart-continue">
            <Icon name="arrowRight" size={16} className="flip" /> Continue shopping
          </Link>
        </div>

        <div className="cart-side">
          <OrderSummary quote={sq.quote} live={sq.live} loading={sq.loading} sticky showLines={false} warnings={sq.live ? sq.quote.warnings : undefined}>
            <Link to="/checkout" className="btn btn-primary btn-lg btn-block summary-cta">
              Continue to checkout <Icon name="arrowRight" size={18} />
            </Link>
            {sq.unavailable && (discountCode || referralCode) && <p className="summary-note">Codes will be verified when you place the order.</p>}
          </OrderSummary>
        </div>
      </div>

      {suggestions.length > 0 && (
        <section className="cart-more">
          <div className="section-head">
            <div className="eyebrow">Add-ons</div>
            <h2>Complete your order</h2>
          </div>
          <ProductGrid products={suggestions} columns={4} compact />
        </section>
      )}
    </div>
  );
}
