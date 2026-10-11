import { useState } from 'react';
import { FALLBACK_IMG } from './cartUtils';

/** Small product/drop artwork tile with a safe fallback – never breaks layout. */
export function Thumb({
  src,
  alt = '',
  size = 56,
  className = '',
  rarity,
  eager = false,
}: {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
  rarity?: string;
  /** load immediately (e.g. tiles inside the animated case strip) */
  eager?: boolean;
}) {
  const [cur, setCur] = useState<{ src?: string; failed: boolean; key?: string }>({ src, failed: false, key: src });
  if (cur.key !== src) setCur({ src, failed: false, key: src });
  const url = cur.failed ? FALLBACK_IMG : cur.src || FALLBACK_IMG;
  return (
    <span className={`thumb ${rarity ? `thumb-${rarity}` : ''} ${className}`} style={{ width: size, height: size }} aria-hidden={alt ? undefined : true}>
      <img src={url} alt={alt} width={size} height={size} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} onError={() => setCur((s) => (s.failed ? s : { ...s, failed: true }))} />
    </span>
  );
}
