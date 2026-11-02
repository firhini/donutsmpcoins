import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { saleActive } from '../../shared/pricing';
import { Countdown } from '../free/Countdown';
import { Icon } from '../ui/Icons';

/** Countdown text only after hydration – the static HTML cannot know the visitor's clock. */
function SaleTimer({ to }: { to?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!to) return null;
  return (
    <span className="sale-timer">
      <Icon name="clock" size={14} /> Ends in {mounted ? <Countdown to={to} format="compact" doneText="a moment" /> : '…'}
    </span>
  );
}

/** Running sale: what is discounted, by how much and until when. Renders nothing without an active sale. */
export function SaleBanner({ variant = 'hero' }: { variant?: 'hero' | 'strip' }) {
  const { config, categories } = useStore();
  const sale = config.sale;
  if (!saleActive(sale)) return null;
  const scoped = (sale.categoryIds ?? []).map((id) => categories.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c);
  const what = scoped.length ? scoped.map((c) => c.name.toLowerCase()).join(' & ') : 'everything';
  const to = scoped.length === 1 ? `/shop/${scoped[0].slug}` : '/shop';
  const label = sale.label?.trim() || 'Sale';

  if (variant === 'strip') {
    return (
      <div className="sale-strip" role="status">
        <span className="sale-strip-pct">−{sale.percent}%</span>
        <span>
          <strong>{label}</strong> – price already reduced
        </span>
        <SaleTimer to={sale.endsAt} />
      </div>
    );
  }
  const isBoxes = scoped.length === 1 && scoped[0].id === 'mystery';
  return (
    <Link to={to} className="box-deal sale-hero">
      <img src={isBoxes ? '/img/products/god-mystery-box.svg' : '/img/products/money-100m.svg'} alt="" width={84} height={84} loading="lazy" decoding="async" />
      <div>
        <span className="box-deal-tag">{label}</span>
        <strong>
          −{sale.percent}% on {what}
        </strong>
        <span className="muted">Discount already applied to every price.</span>
        <SaleTimer to={sale.endsAt} />
      </div>
      <span className="sale-hero-cta">
        Shop now <Icon name="arrowRight" size={16} />
      </span>
    </Link>
  );
}
