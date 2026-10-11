import { useState } from 'react';
import type { PublicConfig } from '../../shared/types';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../ui/Icons';

export type PublicPaymentMethod = PublicConfig['paymentMethods'][number];

/** Payment provider logo from /img/payments/<icon>.svg with a generic fallback. */
export function PaymentIcon({ icon, size = 44, className = '' }: { icon?: string; size?: number; className?: string }) {
  const [src, setSrc] = useState(`/img/payments/${icon || 'generic'}.svg`);
  return (
    <span className={`pm-icon ${className}`} style={{ width: size, height: size * 0.68 }}>
      <img src={src} alt="" width={size} height={size * 0.68} draggable={false} onError={() => setSrc('/img/payments/generic.svg')} />
    </span>
  );
}

export const AUTOMATIC_TYPES = new Set(['stripe', 'paypal', 'nowpayments']);

/** Radio-card picker for the configured payment methods. */
export function PaymentMethodPicker({
  methods,
  value,
  onChange,
  totalCents,
}: {
  methods: PublicPaymentMethod[];
  value: string;
  onChange: (id: string) => void;
  totalCents: number;
}) {
  const { fmt, config } = useStore();
  if (!methods.length) {
    return (
      <div className="alert alert-warn" role="status">
        <Icon name="warning" size={18} />
        <div>
          <strong>Payments are not configured yet.</strong> Contact us on{' '}
          <a href={config.discordInvite} target="_blank" rel="noreferrer" className="link">
            Discord
          </a>{' '}
          and we will sort your order out manually.
        </div>
      </div>
    );
  }
  return (
    <div className="pm-grid" role="radiogroup" aria-label="Payment method">
      {methods.map((m) => {
        const tooSmall = !!m.minCents && totalCents < m.minCents;
        const auto = AUTOMATIC_TYPES.has(m.type);
        const selected = value === m.id;
        return (
          <label key={m.id} className={`pm ${selected ? 'is-selected' : ''} ${tooSmall ? 'is-disabled' : ''}`}>
            <input type="radio" name="paymentMethod" className="sr-only" value={m.id} checked={selected} disabled={tooSmall} onChange={() => onChange(m.id)} />
            <PaymentIcon icon={m.icon} />
            <span className="pm-body">
              <span className="pm-name">{m.name}</span>
              {m.description && <span className="pm-desc">{m.description}</span>}
              <span className="pm-tags">
                <span className={`badge ${auto ? 'badge-green' : 'badge-blue'}`}>{auto ? 'Automatic' : 'Manual confirmation'}</span>
                {m.feePercent ? <span className="badge badge-gold">+{m.feePercent}% fee</span> : null}
                {m.minCents ? <span className={`badge ${tooSmall ? 'badge-red' : ''}`}>min {fmt(m.minCents)}</span> : null}
              </span>
            </span>
            <span className="pm-check" aria-hidden="true">
              <Icon name="check" size={14} strokeWidth={3} />
            </span>
          </label>
        );
      })}
    </div>
  );
}
