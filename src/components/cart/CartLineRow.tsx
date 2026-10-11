import { Link } from 'react-router-dom';
import type { QuoteLine } from '../../shared/types';
import { unitPriceCents } from '../../shared/pricing';
import { useCart, type CartLine } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../ui/Icons';
import { Thumb } from './Thumb';
import { Stepper } from './Stepper';
import { isMillionsProduct, lineTitle } from './cartUtils';

/** One cart line – used by the drawer (compact) and the cart page (wide). */
export function CartLineRow({ line, quoteLine, variant = 'page' }: { line: CartLine; quoteLine?: QuoteLine; variant?: 'drawer' | 'page' }) {
  const { setQty, remove } = useCart();
  const { fmt } = useStore();
  const p = line.product;
  const millions = isMillionsProduct(p);
  const unit = quoteLine?.unitPriceCents ?? unitPriceCents(p, line.qty).price;
  const total = quoteLine?.lineTotalCents ?? unit * line.qty;
  const bulk = quoteLine?.bulkApplied ?? unit < p.priceCents;
  const max = Math.min(p.maxQty ?? 10000, p.stock ?? Number.POSITIVE_INFINITY);
  const unitLabel = millions ? 'per 1M' : p.unitLabel ? p.unitLabel : 'each';
  const compact = variant === 'drawer';

  return (
    <div className={`cline cline-${variant}`} data-kind={p.kind}>
      <Link to={`/product/${p.slug}`} className="cline-media" tabIndex={-1} aria-hidden="true">
        <Thumb src={p.image} size={compact ? 56 : 72} />
      </Link>
      <div className="cline-info">
        <Link to={`/product/${p.slug}`} className="cline-name">
          {lineTitle(p, line.qty)}
        </Link>
        <div className="cline-meta">
          <span className="cline-unit">
            {fmt(unit)} <span className="muted">{unitLabel}</span>
          </span>
          {bulk && <span className="badge badge-green cline-bulk">Bulk price</span>}
          {!bulk && p.compareAtCents && p.compareAtCents > unit ? <s className="muted">{fmt(p.compareAtCents)}</s> : null}
        </div>
        {compact && (
          <div className="cline-row-mobile">
            <Stepper value={line.qty} min={p.minQty ?? 1} max={max} suffix={millions ? 'M' : undefined} onChange={(q) => setQty(p.id, q)} size="sm" />
            <strong className="cline-total-inline">{fmt(total)}</strong>
          </div>
        )}
      </div>
      {!compact && (
        <div className="cline-qty">
          <Stepper value={line.qty} min={p.minQty ?? 1} max={max} suffix={millions ? 'M' : undefined} onChange={(q) => setQty(p.id, q)} size="md" />
        </div>
      )}
      {!compact && <div className="cline-total">{fmt(total)}</div>}
      <button type="button" className="btn btn-ghost btn-icon cline-remove" onClick={() => remove(p.id)} aria-label={`Remove ${p.name} from cart`} title="Remove">
        <Icon name="trash" size={16} />
      </button>
    </div>
  );
}
