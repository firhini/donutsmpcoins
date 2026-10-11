import type { OrderStatus, PaymentStatus, TimelineEntry } from '../../shared/types';
import { Icon } from '../ui/Icons';
import { formatDate, STATUS_LABEL } from './cartUtils';

type StepState = 'done' | 'current' | 'todo' | 'bad' | 'off';
interface Step {
  key: string;
  label: string;
  icon: string;
  hint?: string;
  state: StepState;
}

const BASE: { key: OrderStatus; label: string; icon: string; hint: string }[] = [
  { key: 'awaiting_payment', label: 'Awaiting payment', icon: 'clock', hint: 'Pay & report it' },
  { key: 'paid', label: 'Paid', icon: 'check', hint: 'Payment confirmed' },
  { key: 'delivering', label: 'Delivering', icon: 'truck', hint: 'Staff is on the way' },
  { key: 'delivered', label: 'Delivered', icon: 'sparkles', hint: 'Enjoy your loot' },
];

const LOG_LABEL: Record<TimelineEntry['status'], string> = {
  ...STATUS_LABEL,
  note: 'Note',
  payment_reference: 'Payment reported',
  payment_pending: 'Payment pending',
};

function buildSteps(status: OrderStatus, paymentStatus: PaymentStatus): Step[] {
  if (status === 'cancelled') {
    return [
      { key: 'placed', label: 'Order placed', icon: 'cart', state: 'done' },
      { key: 'cancelled', label: 'Cancelled', icon: 'close', hint: 'No payment needed', state: 'bad' },
    ];
  }
  if (status === 'refunded') {
    return [
      { key: 'placed', label: 'Order placed', icon: 'cart', state: 'done' },
      { key: 'paid', label: 'Paid', icon: 'check', state: 'done' },
      { key: 'refunded', label: 'Refunded', icon: 'refresh', hint: 'Money sent back', state: 'bad' },
    ];
  }
  const idx = BASE.findIndex((s) => s.key === status);
  return BASE.map((s, i) => {
    let state: StepState = i < idx ? 'done' : i === idx ? 'current' : 'todo';
    if (status === 'delivered' && i === idx) state = 'done';
    let label = s.label;
    let hint: string | undefined = s.hint;
    if (s.key === 'awaiting_payment' && status === 'awaiting_payment' && paymentStatus === 'pending_review') {
      label = 'Payment reported';
      hint = 'Being verified';
    }
    if (state === 'done') hint = undefined;
    return { key: s.key, label, icon: s.icon, hint, state };
  });
}

/** Horizontal stepper (vertical on phones) + compact activity log. */
export function StatusTimeline({ status, paymentStatus, timeline }: { status: OrderStatus; paymentStatus: PaymentStatus; timeline: TimelineEntry[] }) {
  const steps = buildSteps(status, paymentStatus);
  const terminal = status === 'cancelled' || status === 'refunded';
  const log = [...timeline].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return (
    <section className={`steps card ${terminal ? 'steps-terminal' : ''}`} aria-label="Order progress">
      <ol className="steps-track" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => (
          <li key={s.key} className={`step step-${s.state}`} aria-current={s.state === 'current' ? 'step' : undefined}>
            <span className="step-dot">
              <Icon name={s.state === 'done' ? 'check' : s.icon} size={16} strokeWidth={2.5} />
            </span>
            <span className="step-label">{s.label}</span>
            {s.hint && <span className="step-hint">{s.hint}</span>}
            {i < steps.length - 1 && <span className="step-line" aria-hidden="true" />}
          </li>
        ))}
      </ol>
      {log.length > 0 && (
        <details className="tl">
          <summary>
            <Icon name="list" size={14} /> Activity log <span className="tl-count">{log.length}</span>
          </summary>
          <ul>
            {log.map((e, i) => (
              <li key={i} className={`tl-${e.status}`}>
                <time dateTime={e.at}>{formatDate(e.at)}</time>
                <span className="tl-status">{LOG_LABEL[e.status] ?? e.status}</span>
                {e.note && <span className="tl-note">{e.note}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
