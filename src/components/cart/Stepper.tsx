import { useId } from 'react';
import { Icon } from '../ui/Icons';

/** Compact quantity stepper on the shared .qty primitive (cart lines). */
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 10000,
  suffix,
  label = 'Quantity',
  size = 'sm',
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  label?: string;
  size?: 'sm' | 'md';
}) {
  const id = useId();
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.floor(Number.isFinite(n) ? n : min)));
  return (
    <div className={`qty cart-qty cart-qty-${size} ${suffix ? 'qty-suffix' : ''}`} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(clamp(value - 1))} disabled={value <= min} aria-label="Decrease quantity">
        <Icon name="minus" size={13} strokeWidth={2.5} />
      </button>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (Number.isFinite(n)) onChange(clamp(n));
        }}
        onBlur={(e) => {
          const n = parseInt(e.target.value, 10);
          onChange(clamp(Number.isFinite(n) ? n : min));
        }}
      />
      {suffix && (
        <span className="qty-unit" aria-hidden="true">
          {suffix}
        </span>
      )}
      <button type="button" onClick={() => onChange(clamp(value + 1))} disabled={value >= max} aria-label="Increase quantity">
        <Icon name="plus" size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
}
