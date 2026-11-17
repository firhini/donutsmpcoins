import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatMillions } from '../../shared/pricing';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { track } from '../../lib/track';
import { Icon } from '../ui/Icons';
import '../../styles/quickbuy.css';

/** Per-million rates are fractions of a cent – show three decimals. */
function perMillion(cents: number, cur: { code: string; symbol: string; rate: number }): string {
  const v = (cents / 100) * (cur.code === 'USD' ? 1 : cur.rate);
  return `${cur.code === 'USD' ? '$' : cur.symbol}${v < 1 ? v.toFixed(3) : v.toFixed(2)}`;
}

const PACK_IDS = ['money-25m', 'money-50m', 'money-100m', 'money-250m', 'money-500m', 'money-1b'];
const POPULAR = 'money-100m';

/**
 * Pick a money pack and go straight to checkout – the first thing a visitor from search or ads sees.
 * Uses the fixed packs (they are the cheapest way to buy round amounts).
 */
export function QuickBuy({ title = 'How much money do you want?', compact = false, source = 'quickbuy' }: { title?: string; compact?: boolean; source?: string }) {
  const { products, fmt, config, currency } = useStore();
  const { add } = useCart();
  const navigate = useNavigate();
  const packs = useMemo(() => PACK_IDS.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p && !p.hidden), [products]);
  const [sel, setSel] = useState(POPULAR);
  const unit = products.find((p) => p.id === 'money-1m');
  const bonus = config.firstOrderBonus?.enabled ? config.firstOrderBonus.percent : 0;
  const picked = packs.find((p) => p.id === sel) ?? packs[0];
  if (!picked) return null;
  const millions = picked.moneyMillions ?? 0;
  const extra = Math.floor((millions * bonus) / 100);

  const buy = () => {
    add(picked.id, 1, { silent: true, open: false });
    track('click', `${source} › Buy ${formatMillions(millions)}`);
    navigate('/checkout');
  };

  return (
    <section className={`qb ${compact ? 'qb-compact' : ''}`} aria-label="Buy money">
      <div className="qb-head">
        <h2 className="qb-title">{title}</h2>
        {bonus > 0 && <span className="qb-bonus-tag">First order: +{bonus}% free</span>}
      </div>

      <div className="qb-grid" role="radiogroup" aria-label="Money pack">
        {packs.map((p) => {
          const m = p.moneyMillions ?? 0;
          const per = m ? p.priceCents / m : 0;
          const active = p.id === picked.id;
          return (
            <button key={p.id} type="button" role="radio" aria-checked={active} className={`qb-pack ${active ? 'is-active' : ''}`} onClick={() => setSel(p.id)}>
              {p.id === POPULAR && <span className="qb-ribbon">Most bought</span>}
              <span className="qb-amount">{formatMillions(m)}</span>
              <span className="qb-price">{fmt(p.priceCents)}</span>
              <span className="qb-per">{perMillion(per, currency)}/1M</span>
            </button>
          );
        })}
      </div>

      <button type="button" className="btn btn-primary btn-lg btn-block qb-cta" onClick={buy}>
        Buy {formatMillions(millions)} for {fmt(picked.priceCents)} <Icon name="arrowRight" size={18} />
      </button>

      <ul className="qb-facts">
        {extra > 0 && (
          <li className="qb-fact-bonus">
            <Icon name="gift" size={14} /> First order? You get <strong>{formatMillions(millions + extra)}</strong> – {formatMillions(extra)} on us
          </li>
        )}
        <li>
          <Icon name="bolt" size={14} /> Paid to your balance with /pay, usually in 5–30 min
        </li>
        <li>
          <Icon name="shield" size={14} /> Card, Apple Pay, Google Pay{config.integrations.nowpayments ? ', crypto' : ''} – no account needed
        </li>
      </ul>
      {unit && !compact && (
        <Link to={`/product/${unit.slug}`} className="qb-custom">
          Need an odd amount? Pick any number of millions <Icon name="arrowRight" size={13} />
        </Link>
      )}
    </section>
  );
}
