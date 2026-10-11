import { useEffect, useId, useState } from 'react';
import { Icon } from '../ui/Icons';
import { avatarUrl, isValidUsername, usernameProblem } from './username';

interface Props {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  hint?: string;
  /** external error message (e.g. from the server) – overrides local validation */
  error?: string | null;
  /** show local validation problems once the user has typed something */
  validate?: boolean;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  size?: 'md' | 'lg';
  id?: string;
}

/**
 * Minecraft username field with a live avatar preview (mc-heads.net).
 * Validation follows the Java edition rules: 3–16 chars, A–Z, 0–9 and "_".
 */
export function UsernameInput({ value, onChange, label = 'Minecraft username', hint, error, validate = true, placeholder = 'e.g. Notch', disabled, autoFocus, size = 'md', id }: Props) {
  const autoId = useId();
  const inputId = id ?? `username-${autoId}`;
  const [touched, setTouched] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [imgOk, setImgOk] = useState(true);

  // debounce the avatar preview so we do not hammer the avatar API while typing
  useEffect(() => {
    const name = value.trim();
    if (!isValidUsername(name)) {
      setPreview('');
      return;
    }
    const t = window.setTimeout(() => {
      setPreview(name);
      setImgOk(true);
    }, 350);
    return () => window.clearTimeout(t);
  }, [value]);

  const localProblem = validate && touched && value.trim() ? usernameProblem(value) : null;
  const problem = error ?? localProblem;
  const valid = !problem && isValidUsername(value);

  return (
    <div className={`field uname ${size === 'lg' ? 'uname-lg' : ''}`}>
      {label && (
        <label className="label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className="uname-wrap">
        <span className="uname-avatar" aria-hidden="true">
          {preview && imgOk ? (
            <img src={avatarUrl(preview, 64)} alt="" width={32} height={32} onError={() => setImgOk(false)} />
          ) : (
            <Icon name="user" size={16} />
          )}
        </span>
        <input
          id={inputId}
          className={`input ${problem ? 'error' : ''} ${valid ? 'success' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\s+/g, ''))}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          maxLength={16}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={problem ? 'true' : undefined}
          aria-describedby={problem ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
        />
        {valid && (
          <span className="uname-ok" aria-hidden="true">
            <Icon name="check" size={16} />
          </span>
        )}
      </div>
      {problem ? (
        <div className="err" id={`${inputId}-err`} role="alert">
          {problem}
        </div>
      ) : hint ? (
        <div className="hint" id={`${inputId}-hint`}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}
