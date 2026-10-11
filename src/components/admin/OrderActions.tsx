import { useState } from 'react';
import type { Order, OrderStatus } from '../../shared/types';
import { Icon } from '../ui/Icons';
import { ConfirmDialog, type ConfirmState } from './ConfirmDialog';

interface Action {
  status: OrderStatus;
  label: string;
  icon: string;
  cls: string;
  confirm?: { title: string; message: string; confirmLabel: string };
}

function actionsFor(status: OrderStatus): Action[] {
  const markPaid: Action = { status: 'paid', label: 'Mark as paid', icon: 'check', cls: 'btn-primary' };
  const deliver: Action = { status: 'delivering', label: 'Start delivering', icon: 'truck', cls: 'btn-primary' };
  const delivered: Action = { status: 'delivered', label: 'Mark delivered', icon: 'check', cls: 'btn-success' };
  const cancel: Action = {
    status: 'cancelled',
    label: 'Cancel',
    icon: 'close',
    cls: 'btn-danger',
    confirm: { title: 'Cancel this order?', message: 'The customer will see the order as cancelled. Applied store credit, reserved stock, a used coupon and any referral reward are returned automatically.', confirmLabel: 'Cancel order' },
  };
  const refund: Action = {
    status: 'refunded',
    label: 'Refund',
    icon: 'refresh',
    cls: 'btn-danger',
    confirm: { title: 'Mark as refunded?', message: 'Only do this after you sent the money back. The order is marked refunded; applied store credit, stock, coupon and referral reward are returned automatically.', confirmLabel: 'Mark refunded' },
  };
  const reopen: Action = { status: 'awaiting_payment', label: 'Reopen (awaiting payment)', icon: 'clock', cls: 'btn-secondary' };
  switch (status) {
    case 'awaiting_payment':
      return [markPaid, cancel];
    case 'paid':
      return [deliver, delivered, refund];
    case 'delivering':
      return [delivered, { ...markPaid, label: 'Back to paid', cls: 'btn-ghost', icon: 'minus' }, refund];
    case 'delivered':
      return [refund];
    case 'cancelled':
      return [reopen, markPaid];
    case 'refunded':
      return [];
    default:
      return [];
  }
}

export function OrderActions({ order, onChange, busy }: { order: Order; onChange: (status: OrderStatus) => Promise<void>; busy: boolean }) {
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const actions = actionsFor(order.status);
  if (!actions.length) return <span className="muted small">No further actions.</span>;
  return (
    <div className="adm-order-actions">
      {actions.map((a) => (
        <button
          key={a.status + a.label}
          type="button"
          className={`btn ${a.cls}`}
          disabled={busy}
          onClick={() => {
            if (a.confirm) setConfirm({ ...a.confirm, danger: true, onConfirm: () => onChange(a.status) });
            else void onChange(a.status);
          }}
        >
          {busy ? <span className="spinner" /> : <Icon name={a.icon} size={15} />}
          {a.label}
        </button>
      ))}
      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} busy={busy} />
    </div>
  );
}
