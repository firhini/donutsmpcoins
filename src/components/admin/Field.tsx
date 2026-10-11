/** Dense form helpers for the admin. All controls reuse the shared .input/.select/.textarea primitives. */
import { useEffect, useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { centsToDollarString, dollarStringToCents } from './adminUtils';

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  optional?: boolean;
  className?: string;
  children: ReactNode;
  htmlFor?: string;
}

export function Field({ label, hint, error, optional, className = '', children, htmlFor }: FieldProps) {
  return (
    <div className={`field adm-field ${className}`}>
      <label className="label" htmlFor={htmlFor}>
        <span>{label}</span>
        {optional && <span className="opt">optional</span>}
      </label>
      {children}
      {error ? <div className="err">{error}</div> : hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & { xs?: boolean };

export function TextInput({ className = '', xs, ...rest }: InputProps) {
  return <input className={`input adm-input ${xs ? 'adm-input-xs' : ''} ${className}`} {...rest} />;
}

export function SelectInput({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`select adm-select ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function TextArea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`textarea adm-textarea ${className}`} {...rest} />;
}

/** Number input that reports `undefined` when empty. */
export function NumberInput({
  value,
  onChange,
  className = '',
  xs,
  allowEmpty = true,
  ...rest
}: Omit<InputProps, 'value' | 'onChange'> & { value: number | undefined | null; onChange: (v: number | undefined) => void; allowEmpty?: boolean }) {
  const [text, setText] = useState(value === undefined || value === null ? '' : String(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(value === undefined || value === null ? '' : String(value));
  }, [value, focused]);
  return (
    <input
      type="number"
      inputMode="decimal"
      className={`input adm-input ${xs ? 'adm-input-xs' : ''} ${className}`}
      value={text}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        if (!allowEmpty && text.trim() === '') setText(value === undefined || value === null ? '' : String(value));
      }}
      onChange={(e) => {
        const t = e.target.value;
        setText(t);
        if (t.trim() === '') {
          if (allowEmpty) onChange(undefined);
          return;
        }
        const n = Number(t);
        if (Number.isFinite(n)) onChange(n);
      }}
      {...rest}
    />
  );
}

/** Dollar text input bound to USD cents. Empty → null (e.g. "no compare-at price", "unlimited stock"). */
export function MoneyInput({
  valueCents,
  onChange,
  className = '',
  xs,
  placeholder = '0.00',
  ...rest
}: Omit<InputProps, 'value' | 'onChange'> & { valueCents: number | null | undefined; onChange: (cents: number | null) => void }) {
  const [text, setText] = useState(centsToDollarString(valueCents));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(centsToDollarString(valueCents));
  }, [valueCents, focused]);
  return (
    <div className="adm-input-affix">
      <span className="affix">$</span>
      <input
        type="text"
        inputMode="decimal"
        className={`input adm-input money has-prefix ${xs ? 'adm-input-xs' : ''} ${className}`}
        value={text}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setText(centsToDollarString(dollarStringToCents(text)));
        }}
        onChange={(e) => {
          setText(e.target.value);
          onChange(dollarStringToCents(e.target.value));
        }}
        {...rest}
      />
    </div>
  );
}

export function PercentInput({ value, onChange, xs, className = '', ...rest }: Omit<InputProps, 'value' | 'onChange'> & { value: number | undefined; onChange: (v: number | undefined) => void }) {
  return (
    <div className="adm-input-affix">
      <NumberInput value={value} onChange={onChange} xs={xs} className={`has-suffix ${className}`} min={0} max={100} step={1} {...rest} />
      <span className="affix right">%</span>
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled, sm, className = '' }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; disabled?: boolean; sm?: boolean; className?: string }) {
  const id = useId();
  return (
    <label className={`switch ${sm ? 'sm' : ''} ${className}`} htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" aria-hidden="true" />
      {label && <span>{label}</span>}
    </label>
  );
}

export function Checkbox({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; disabled?: boolean }) {
  return (
    <label className="checkbox">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
