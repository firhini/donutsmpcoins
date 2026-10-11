import { useStore } from '../../context/StoreContext';

/** Price in the user's display currency, with optional strike-through compare price. */
export function Price({ cents, compareAtCents, size = 'md', className = '' }: { cents: number; compareAtCents?: number; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const { fmt } = useStore();
  return (
    <span className={`price price-${size} ${className}`}>
      <span className="price-now">{fmt(cents)}</span>
      {compareAtCents && compareAtCents > cents ? <s className="price-was">{fmt(compareAtCents)}</s> : null}
    </span>
  );
}

export function usePrice() {
  const { fmt, currency } = useStore();
  return { fmt, currency };
}
