import type { OrderStatus, PaymentStatus } from '../../shared/types';
import { PAYMENT_BADGE, PAYMENT_LABEL, STATUS_BADGE, STATUS_LABEL } from './adminUtils';

export function StatusBadge({ status }: { status: OrderStatus | string }) {
  const s = status as OrderStatus;
  const label = STATUS_LABEL[s] ?? status;
  const cls = STATUS_BADGE[s] ?? '';
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function PaymentBadge({ status }: { status: PaymentStatus | string }) {
  const s = status as PaymentStatus;
  const label = PAYMENT_LABEL[s] ?? status;
  const cls = PAYMENT_BADGE[s] ?? '';
  return (
    <span className={`badge ${cls}`} title="Payment status">
      {label}
    </span>
  );
}

export function GiveawayBadge({ status }: { status: 'active' | 'ended' | 'drawn' | string }) {
  const map: Record<string, { cls: string; label: string }> = {
    active: { cls: 'badge-green', label: 'Active' },
    ended: { cls: 'badge-gold', label: 'Ended – draw' },
    drawn: { cls: 'badge-violet', label: 'Drawn' },
  };
  const m = map[status] ?? { cls: '', label: status };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}

export function ReviewBadge({ status }: { status: 'pending' | 'approved' | 'rejected' | string }) {
  const map: Record<string, { cls: string; label: string }> = {
    pending: { cls: 'badge-gold', label: 'Pending' },
    approved: { cls: 'badge-green', label: 'Approved' },
    rejected: { cls: 'badge-red', label: 'Rejected' },
  };
  const m = map[status] ?? { cls: '', label: status };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}
