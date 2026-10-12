import type { ReactNode } from 'react';
import type { Quote } from '../../shared/types';
import { formatUsd } from '../../shared/pricing';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../ui/Icons';
import { Thumb } from './Thumb';
import { feeFor, isMillionsProduct, lineTitle } from './cartUtils';

function Row({ label, value, tone }: { label: ReactNode; value: ReactNode; tone?: 'good' | 'warn' | 'muted' }) {
  return (
    <div className={`summary-row ${tone ? `summary-row-${tone}` : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/**
 * Order summary card (cart page + checkout). Shows the quote lines, every
 * discount line, an optional payment fee and the big total in the display
 * currency (with USD underneath when it differs).
 */
export function OrderSummary({
  quote,
  live = false,
  loading = false,
  feePercent,
  feeName,
  showLines = true,
  title = 'Order summary',
  children,
  sticky = false,
  showEta = true,
  warnings,
}: {
  quote: Quote;
  live?: boolean;
  loading?: boolean;
  feePercent?: number;
  feeName?: string;
  showLines?: boolean;
  title?: string;
  children?: ReactNode;
  sticky?: boolean;
  showEta?: boolean;
  warnings?: string[];
}) {
  const { fmt, currency, config, productById } = useStore();
  const fee = feeFor(quote.totalCents, feePercent);
  const total = quote.totalCents + fee;
  const savings = quote.saleDiscountCents + quote.tierDiscountCents + quote.couponDiscountCents + quote.referralDiscountCents;
  const saleLabel = config.sale?.label?.trim() || 'Sale';

  return (
    <aside className={`summary card ${sticky ? 'summary-sticky' : ''} ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
      <div className="summary-head">
        <h3>{title}</h3>
        {loading ? (
          <span className="summary-live">
            <span className="spinner" /> Updating
          </span>
        ) : live ? (
          <span className="summary-live is-live">
            <i /> Live prices
          </span>
        ) : (
          <span className="summary-live">Estimate</span>
        )}
      </div>

      {showLines && (
        <ul className="summary-lines">
          {quote.lines.map((l) => {
            const p = productById(l.productId);
            const millions = !!p && isMillionsProduct(p);
            return (
              <li key={l.productId}>
                <Thumb src={l.image} size={40} />
                <span className="summary-line-name">
                  {p ? lineTitle(p, l.qty) : l.name}
                  <small>
                    {millions ? `${fmt(l.unitPriceCents)} per 1M` : `${l.qty} × ${fmt(l.unitPriceCents)}`}
                    {l.bulkApplied && <em> · bulk</em>}
                  </small>
                </span>
                <span className="summary-line-total">{fmt(l.lineTotalCents)}</span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="summary-rows">
        <Row label="Subtotal" value={fmt(quote.subtotalCents)} />
        {quote.saleDiscountCents > 0 && <Row label={`${saleLabel} −${quote.salePercent}%`} value={`−${fmt(quote.saleDiscountCents)}`} tone="good" />}
        {quote.tierDiscountCents > 0 && <Row label={`Bulk tier −${quote.tierPercent}%`} value={`−${fmt(quote.tierDiscountCents)}`} tone="good" />}
        {quote.couponDiscountCents > 0 && <Row label={`Code ${quote.couponCode}`} value={`−${fmt(quote.couponDiscountCents)}`} tone="good" />}
        {quote.referralDiscountCents > 0 && <Row label={`Referral ${quote.referralCode}`} value={`−${fmt(quote.referralDiscountCents)}`} tone="good" />}
        {quote.creditAppliedCents > 0 && <Row label="Store credit" value={`−${fmt(quote.creditAppliedCents)}`} tone="good" />}
        {fee > 0 && <Row label={`${feeName ?? 'Payment'} fee +${feePercent}%`} value={`+${fmt(fee)}`} tone="warn" />}
      </div>

      <div className="summary-total">
        <span>Total</span>
        <div className="summary-total-amount">
          <strong>{fmt(total)}</strong>
          {currency.code !== 'USD' && <small>{formatUsd(total)} USD · charged in USD</small>}
        </div>
      </div>
      {config.legal.priceNote && <p className="xs muted summary-pricenote">{config.legal.priceNote}</p>}
      {savings > 0 && (
        <div className="summary-savings">
          <Icon name="sparkles" size={14} /> You save {fmt(savings)}
        </div>
      )}
      {warnings && warnings.length > 0 && (
        <ul className="summary-warnings">
          {warnings.map((w, i) => (
            <li key={i}>
              <Icon name="warning" size={13} /> {w}
            </li>
          ))}
        </ul>
      )}

      {children}

      {showEta && config.delivery?.etaText && (
        <div className="summary-eta">
          <Icon name="clock" size={15} />
          <span>{config.delivery.etaText}</span>
        </div>
      )}
      <ul className="trust">
        <li>
          <Icon name="lock" size={14} /> Secure checkout
        </li>
        <li>
          <Icon name="bolt" size={14} /> In-game delivery
        </li>
        <li>
          <Icon name="discord" size={14} /> Discord support
        </li>
      </ul>
    </aside>
  );
}
