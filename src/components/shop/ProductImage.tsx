import { useState } from 'react';
import type { Product } from '../../shared/types';

const FALLBACK = '/img/products/_fallback.svg';

export type ProductImageSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Product artwork with a radial glow tinted by category. Falls back to
 * /img/products/_fallback.svg and finally to an inline placeholder, so a
 * missing image never breaks the layout.
 */
export function ProductImage({
  product,
  size = 'md',
  className = '',
  glow = true,
  eager = false,
}: {
  product: Product;
  size?: ProductImageSize;
  className?: string;
  glow?: boolean;
  eager?: boolean;
}) {
  const [state, setState] = useState<{ image: string; src: string; failed: boolean }>({ image: product.image, src: product.image, failed: false });
  // derive state from props when the product changes (React-recommended pattern)
  if (state.image !== product.image) setState({ image: product.image, src: product.image, failed: false });

  return (
    <div className={`pimg pimg-${size} pimg-cat-${product.categoryId} ${glow ? 'pimg-glow' : ''} ${className}`} data-kind={product.kind}>
      {!state.failed ? (
        <img
          src={state.src}
          alt={product.name}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onError={() => setState((s) => (s.src !== FALLBACK ? { ...s, src: FALLBACK } : { ...s, failed: true }))}
        />
      ) : (
        <PlaceholderGlyph kind={product.kind} />
      )}
    </div>
  );
}

/** Inline, dependency-free placeholder: a glossy isometric cube. */
function PlaceholderGlyph({ kind }: { kind: Product['kind'] }) {
  const id = `pg-${kind}`;
  return (
    <svg viewBox="0 0 64 64" className="pimg-placeholder" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.15)" />
        </linearGradient>
      </defs>
      <polygon points="32,6 56,19 32,32 8,19" fill={`url(#${id}-top)`} />
      <polygon points="8,19 32,32 32,58 8,45" fill="rgba(255,255,255,0.22)" />
      <polygon points="56,19 32,32 32,58 56,45" fill="rgba(255,255,255,0.1)" />
      {kind === 'money' && <circle cx="32" cy="22" r="6" fill="rgba(255,194,51,0.9)" />}
      {kind === 'box' && <rect x="29" y="8" width="6" height="48" fill="rgba(255,94,168,0.6)" />}
    </svg>
  );
}
