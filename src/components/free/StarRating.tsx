import { useId, useState } from 'react';

const LABELS = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Awesome'];
const STAR = 'm12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z';

function Star({ fill, size }: { fill: number; size: number }) {
  // fill: 0..1 – partial fill via a clip rectangle
  const id = useId();
  const w = Math.max(0, Math.min(1, fill)) * 24;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="star-svg">
      <defs>
        <clipPath id={`clip-${id}`}>
          <rect x="0" y="0" width={w} height="24" />
        </clipPath>
      </defs>
      <path d={STAR} className="star-bg" />
      <path d={STAR} className="star-fg" clipPath={`url(#clip-${id})`} />
    </svg>
  );
}

interface DisplayProps {
  value: number;
  size?: number;
  className?: string;
}
interface InputProps extends DisplayProps {
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
  disabled?: boolean;
  showLabel?: boolean;
}

/**
 * Star rating. Display mode: `<StarRating value={4.3} />` (supports fractions).
 * Input mode: pass `onChange` – keyboard accessible radio group with hover preview.
 */
export function StarRating(props: DisplayProps | InputProps) {
  const size = props.size ?? 18;
  if ('onChange' in props) return <StarInput {...props} size={size} />;
  const v = Math.max(0, Math.min(5, props.value));
  return (
    <span className={`stars-display ${props.className ?? ''}`} role="img" aria-label={`${v.toFixed(1)} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} fill={v - i} size={size} />
      ))}
    </span>
  );
}

function StarInput({ value, onChange, size, disabled, showLabel = true, className }: InputProps & { size: number }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const groupId = useId();
  return (
    <div className={`stars-input ${className ?? ''}`}>
      <div role="radiogroup" aria-labelledby={`${groupId}-label`} className="stars-input-row" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''} – ${LABELS[n]}`}
            className={`star-btn ${n <= shown ? 'on' : ''} ${hover && n <= hover ? 'hovering' : ''}`}
            disabled={disabled}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(n as 1 | 2 | 3 | 4 | 5)}
          >
            <Star fill={n <= shown ? 1 : 0} size={size} />
          </button>
        ))}
      </div>
      {showLabel && (
        <span id={`${groupId}-label`} className={`stars-label ${shown ? '' : 'muted'}`}>
          {shown ? LABELS[shown] : 'Tap a star to rate'}
        </span>
      )}
    </div>
  );
}
