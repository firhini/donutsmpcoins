import { useId } from 'react';
import { Icon } from '../ui/Icons';

/** Accessible quantity stepper built on the shared .qty primitive. */
export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 10000,
  step = 1,
  suffix,
  label = 'Quantity',
  disabled,
  size = 'md',
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** e.g. "M" for millions */
  suffix?: string;
  label?: string;
  disabled?: boolean;
  size?: 'md' | 'lg';
}) {
  const id = useId();
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.floor(Number.isFinite(n) ? n : min)));
  const dec = () => onChange(clamp(value - step));
  const inc = () => onChange(clamp(value + step));
  return (
    <div className={`qty qty-${size} ${suffix ? 'qty-suffix' : ''}`} role="group" aria-label={label}>
      <button type="button" onClick={dec} disabled={disabled || value <= min} aria-label={`Decrease ${label.toLowerCase()}`}>
        <Icon name="minus" size={14} strokeWidth={2.5} />
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
        step={step}
        value={value}
        disabled={disabled}
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
      <button type="button" onClick={inc} disabled={disabled || value >= max} aria-label={`Increase ${label.toLowerCase()}`}>
        <Icon name="plus" size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
