import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { useCart } from '../../context/CartContext';
import { dealOfTheDay } from '../../shared/pricing';
import { Countdown } from '../free/Countdown';
import { Icon } from '../ui/Icons';
import { ProductImage } from './ProductImage';

/** Today's rotating deal: big discount, limited per player, new product every day at 00:00 UTC. */
export function DealOfTheDay({ compact = false }: { compact?: boolean }) {
  const { config, productById, fmt } = useStore();
  const { add } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const today = dealOfTheDay(config.dailyDeal);
  const product = today ? productById(today.productId) : undefined;
  if (!today || !product?.dailyDeal) return null;
  const tomorrow = dealOfTheDay(config.dailyDeal, new Date(new Date(today.endsAt).getTime() + 1000));
  const nextProduct = tomorrow && tomorrow.productId !== today.productId ? productById(tomorrow.productId) : undefined;
  const regular = product.dailyDeal.regularCents;
  const off = Math.round((1 - product.priceCents / regular) * 100);

  return (
    <section className={`deal ${compact ? 'deal-compact' : ''}`} aria-labelledby="deal-title">
      <div className="deal-badge">
        <Icon name="bolt" size={14} /> Deal of the day
      </div>
      <Link to={`/product/${product.slug}`} className="deal-img" aria-hidden="true" tabIndex={-1}>
        <ProductImage product={product} size="md" />
        <span className="deal-off">−{off}%</span>
      </Link>
      <div className="deal-body">
        <h2 id="deal-title">
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h2>
        <div className="deal-price">
          <strong>{fmt(product.priceCents)}</strong>
          <s>{fmt(regular)}</s>
          <span className="deal-limit">max {product.dailyDeal.maxPerPlayer} per player</span>
        </div>
        <div className="deal-timer">
          <Icon name="clock" size={14} /> New deal in {mounted ? <Countdown to={today.endsAt} /> : '…'}
          {nextProduct && !compact && <span className="deal-next">· tomorrow: {nextProduct.name}</span>}
        </div>
        <button type="button" className="btn btn-primary btn-lg deal-cta" onClick={() => add(product.id, 1)} data-track="deal of the day add">
          <Icon name="cart" size={18} /> Grab the deal
        </button>
      </div>
    </section>
  );
}
