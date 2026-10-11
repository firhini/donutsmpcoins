import type { Quote } from '../../shared/types';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../ui/Icons';

/** Spending-tier progress bar: "Add $x more to unlock y% off" → "You unlocked 8% off!". */
export function TierProgress({ quote, compact = false }: { quote: Quote; compact?: boolean }) {
  const { config, fmt } = useStore();
  const tiers = [...config.spendingTiers].sort((a, b) => a.minCents - b.minCents);
  if (!tiers.length) return null;
  const maxCents = tiers[tiers.length - 1].minCents;
  const subtotal = quote.subtotalCents;
  const pct = Math.max(0, Math.min(100, (subtotal / maxCents) * 100));
  const unlockedAll = subtotal >= maxCents;
  const next = quote.nextTier;

  return (
    <div className={`tier ${compact ? 'tier-compact' : ''} ${quote.tierPercent > 0 ? 'tier-active' : ''}`} aria-live="polite">
      <div className="tier-msg">
        {next ? (
          <>
            <Icon name="bolt" size={14} />
            <span>
              Add <strong>{fmt(next.missingCents)}</strong> more to unlock <strong>{next.percent}% off</strong>
              {quote.tierPercent > 0 ? ` (currently ${quote.tierPercent}%)` : ''}
            </span>
          </>
        ) : (
          <>
            <Icon name="sparkles" size={14} />
            <span>
              You unlocked <strong>{quote.tierPercent}% off</strong>
              {unlockedAll ? ' – the maximum bulk discount!' : '!'}
            </span>
          </>
        )}
      </div>
      <div className="tier-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <i style={{ width: `${pct}%` }} />
        {tiers.map((t) => {
          const left = (t.minCents / maxCents) * 100;
          const hit = subtotal >= t.minCents;
          return (
            <span key={t.minCents} className={`tier-tick ${hit ? 'hit' : ''}`} style={{ left: `${left}%` }} title={`${t.percent}% off from ${fmt(t.minCents)}`}>
              <b>{t.percent}%</b>
            </span>
          );
        })}
      </div>
    </div>
  );
}
