import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatMillions, spendingTierFor } from '../../shared/pricing';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../ui/Icons';
import { ProductImage } from './ProductImage';
import { bulkTable, linePrice } from './productUtils';
import '../../styles/shop.css';

const QUICK = [10, 25, 50, 100, 250, 500, 1000];
const SLIDER_STEPS = 1000;

/** Log-scale slider mapping so small amounts are still easy to pick. */
function toSlider(m: number, min: number, max: number): number {
  const t = (Math.log(m) - Math.log(min)) / (Math.log(max) - Math.log(min));
  return Math.round(Math.max(0, Math.min(1, t)) * SLIDER_STEPS);
}
function fromSlider(v: number, min: number, max: number): number {
  const t = v / SLIDER_STEPS;
  const m = Math.exp(Math.log(min) + t * (Math.log(max) - Math.log(min)));
  // snap to friendly numbers
  const snap = m >= 1000 ? 50 : m >= 200 ? 10 : m >= 50 ? 5 : 1;
  return Math.max(min, Math.min(max, Math.round(m / snap) * snap));
}

/** Hero-ish "how much money do you want?" widget. Adds money-1m × millions to the cart. */
export function MoneyCalculator({ initial = 100, title = 'Money calculator' }: { initial?: number; title?: string }) {
  const { products, fmt, config } = useStore();
  const { add } = useCart();
  const id = useId();
  const product = useMemo(() => products.find((p) => p.id === 'money-1m') ?? products.find((p) => p.kind === 'money' && p.moneyMillions === 1), [products]);
  const min = product?.minQty ?? 1;
  const max = product?.maxQty ?? 5000;
  const [millions, setMillions] = useState(Math.max(min, Math.min(max, initial)));
  const [added, setAdded] = useState(false);

  if (!product) return null;
  const line = linePrice(product, millions);
  const table = bulkTable(product);
  const nextTier = table.find((t) => t.minQty > millions);
  const tier = spendingTierFor(line.totalCents, config.spendingTiers);
  const sale = config.sale.enabled ? config.sale.percent : 0;

  const set = (n: number) => {
    const v = Math.max(min, Math.min(max, Math.floor(Number.isFinite(n) ? n : min)));
    setMillions(v);
    setAdded(false);
  };

  return (
    <div className="calc card">
      <div className="calc-left">
        <div className="calc-head">
          <ProductImage product={product} size="sm" />
          <div>
            <div className="eyebrow">
              <Icon name="coin" size={14} /> {title}
            </div>
            <h3>How much {config.serverName} money do you need?</h3>
            <p className="muted small">Pick an amount – bulk prices apply automatically. Paid to your balance with /pay.</p>
          </div>
        </div>

        <div className="calc-input">
          <label htmlFor={`${id}-m`} className="label">
            Amount in millions
          </label>
          <div className="calc-field">
            <button type="button" className="btn btn-secondary btn-icon" onClick={() => set(millions - (millions > 100 ? 10 : 1))} aria-label="Less">
              <Icon name="minus" size={16} />
            </button>
            <div className="calc-number">
              <input id={`${id}-m`} type="number" inputMode="numeric" min={min} max={max} value={millions} onChange={(e) => set(parseInt(e.target.value, 10))} />
              <span className="pixel">M</span>
            </div>
            <button type="button" className="btn btn-secondary btn-icon" onClick={() => set(millions + (millions >= 100 ? 10 : 1))} aria-label="More">
              <Icon name="plus" size={16} />
            </button>
          </div>
          <input
            type="range"
            className="calc-slider"
            min={0}
            max={SLIDER_STEPS}
            value={toSlider(millions, min, max)}
            onChange={(e) => set(fromSlider(parseInt(e.target.value, 10), min, max))}
            aria-label="Amount slider"
            style={{ ['--pct' as string]: `${(toSlider(millions, min, max) / SLIDER_STEPS) * 100}%` }}
          />
          <div className="calc-quick" role="group" aria-label="Quick amounts">
            {QUICK.filter((q) => q >= min && q <= max).map((q) => (
              <button key={q} type="button" className={`chip ${millions === q ? 'active' : ''}`} onClick={() => set(q)} aria-pressed={millions === q}>
                {formatMillions(q)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="calc-right">
        <div className="calc-total">
          <span className="calc-total-label">
            {formatMillions(line.qty)} {config.serverName} money
          </span>
          <span className="calc-total-value grad-text" aria-live="polite">
            {fmt(line.totalCents)}
          </span>
          <span className="calc-total-rate">
            {fmt(line.unitCents)} per 1M {line.bulk && <span className="badge badge-green">bulk rate</span>}
          </span>
        </div>
        <ul className="calc-facts">
          <li>
            <Icon name="percent" size={14} />
            {line.savingsCents > 0 ? (
              <span>
                You save <strong className="success-text">{fmt(line.savingsCents)}</strong> vs the base rate ({fmt(product.priceCents)}/1M)
              </span>
            ) : nextTier ? (
              <span>
                Buy {formatMillions(nextTier.minQty)}+ to unlock <strong>{fmt(nextTier.priceCents)}</strong> per 1M
              </span>
            ) : (
              <span>Best rate unlocked</span>
            )}
          </li>
          {nextTier && line.savingsCents > 0 && (
            <li>
              <Icon name="bolt" size={14} />
              <span>
                Next tier: {formatMillions(nextTier.minQty)}+ at <strong>{fmt(nextTier.priceCents)}</strong>/1M
              </span>
            </li>
          )}
          {tier.current ? (
            <li>
              <Icon name="trophy" size={14} />
              <span>
                Spending tier: <strong className="gold-text">{tier.current.percent}% off</strong> applied at checkout
              </span>
            </li>
          ) : tier.next ? (
            <li>
              <Icon name="trophy" size={14} />
              <span>
                Spend {fmt(tier.next.minCents)}+ for a {tier.next.percent}% tier discount
              </span>
            </li>
          ) : null}
          {sale > 0 && (
            <li>
              <Icon name="tag" size={14} />
              <span>
                {config.sale.label || 'Sale'}: extra <strong className="pink-text">{sale}% off</strong> at checkout
              </span>
            </li>
          )}
          <li>
            <Icon name="clock" size={14} />
            <span>{config.delivery.etaText}</span>
          </li>
        </ul>
        <button
          type="button"
          className={`btn btn-lg btn-block ${added ? 'btn-success' : 'btn-primary'}`}
          onClick={() => {
            add(product.id, line.qty);
            setAdded(true);
          }}
        >
          {added ? (
            <>
              <Icon name="check" size={18} /> Added to cart
            </>
          ) : (
            <>
              <Icon name="cart" size={18} /> Add {formatMillions(line.qty)} to cart
            </>
          )}
        </button>
        <Link to="/donutsmp-money" className="calc-link">
          See the full price table <Icon name="arrowRight" size={14} />
        </Link>
      </div>
    </div>
  );
}
