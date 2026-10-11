import type { SVGProps } from 'react';
import type { PrizeGlyph } from './Wheel';

/** 24px stroke icon for a wheel prize type (HTML contexts: prize table, modal, last prize). */
export function PrizeIcon({ kind, size = 18, ...rest }: { kind: PrizeGlyph; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {kind === 'coupon' && (
        <>
          <path d="M19 5 5 19" />
          <circle cx="7.5" cy="7.5" r="2.4" />
          <circle cx="16.5" cy="16.5" r="2.4" />
        </>
      )}
      {kind === 'coins' && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5v9M9.5 9.5h3.8a1.6 1.6 0 0 1 0 3.2H9.5h4.2a1.6 1.6 0 0 1 0 3.2H9.5" />
        </>
      )}
      {kind === 'item' && (
        <>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
        </>
      )}
      {kind === 'credit' && (
        <>
          <rect x="3" y="6" width="18" height="12" rx="2.5" />
          <path d="M3 10h18M7 14.5h4" />
        </>
      )}
      {kind === 'nothing' && <path d="M7 7l10 10M17 7 7 17" />}
    </svg>
  );
}
