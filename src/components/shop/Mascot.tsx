import { useState } from 'react';

/**
 * Brand mascot (/img/brand/mascot.svg) with an inline donut fallback so the
 * hero never shows a broken image while the art builder is working.
 */
export function Mascot({ size = 260, className = '', float = true }: { size?: number; className?: string; float?: boolean }) {
  const [ok, setOk] = useState(true);
  const cls = `mascot ${float ? 'float' : ''} ${className}`;
  if (ok) {
    return <img src="/img/brand/mascot.svg" alt="" width={size} height={size} className={cls} draggable={false} fetchPriority="high" decoding="async" onError={() => setOk(false)} />;
  }
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={cls} aria-hidden="true">
      <defs>
        <radialGradient id="mascot-dough" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ffd9a8" />
          <stop offset="1" stopColor="#d9924a" />
        </radialGradient>
        <linearGradient id="mascot-glaze" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8fc2" />
          <stop offset="1" stopColor="#ff3d93" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="104" r="78" fill="url(#mascot-dough)" />
      <path
        d="M100 28c42 0 76 31 76 72 0 6-4 10-9 10-7 0-9-8-16-8s-8 10-16 10-9-9-16-9-8 12-18 12-9-12-17-12-9 9-17 9-8-12-16-12-9 9-15 9c-5 0-8-4-8-9 0-41 34-72 72-72z"
        fill="url(#mascot-glaze)"
      />
      <circle cx="100" cy="104" r="26" fill="#0b0d14" />
      <circle cx="100" cy="104" r="22" fill="#171b27" />
      <g fill="#fff">
        <rect x="62" y="70" width="8" height="3" rx="1.5" transform="rotate(-25 66 71)" />
        <rect x="128" y="62" width="8" height="3" rx="1.5" transform="rotate(30 132 63)" />
        <rect x="90" y="50" width="8" height="3" rx="1.5" transform="rotate(10 94 51)" />
        <rect x="150" y="90" width="8" height="3" rx="1.5" transform="rotate(-50 154 91)" />
        <rect x="46" y="100" width="8" height="3" rx="1.5" transform="rotate(60 50 101)" />
      </g>
      <g>
        <ellipse cx="78" cy="132" rx="7" ry="9" fill="#10121a" />
        <ellipse cx="122" cy="132" rx="7" ry="9" fill="#10121a" />
        <circle cx="80" cy="129" r="2.5" fill="#fff" />
        <circle cx="124" cy="129" r="2.5" fill="#fff" />
        <path d="M86 152c8 8 20 8 28 0" stroke="#10121a" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="66" cy="148" r="6" fill="#ff5ea8" opacity="0.5" />
        <circle cx="134" cy="148" r="6" fill="#ff5ea8" opacity="0.5" />
      </g>
      <g>
        <circle cx="160" cy="48" r="16" fill="#ffc233" />
        <circle cx="160" cy="48" r="11" fill="none" stroke="#d98f00" strokeWidth="2" />
        <text x="160" y="53" textAnchor="middle" fontSize="13" fontWeight="800" fill="#7a4b00" fontFamily="sans-serif">
          $
        </text>
      </g>
    </svg>
  );
}
