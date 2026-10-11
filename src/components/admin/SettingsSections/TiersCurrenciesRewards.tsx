/** Spending tiers, currencies, referral / review / welcome rewards. */
import type { CurrencyConfig, SiteSettings, SpendingTier } from '../../../shared/types';
import { Icon } from '../../ui/Icons';
import { Field, MoneyInput, NumberInput, PercentInput, TextInput, Toggle } from '../Field';
import { SectionCard, type SaveFn } from './SectionCard';

/* ───────── spending tiers ───────── */

export function TiersSection({ settings, onSave }: { settings: SiteSettings; onSave: SaveFn }) {
  return (
    <SectionCard<SpendingTier[]>
      id="tiers"
      title="Spending tiers"
      icon="trophy"
      sub="Automatic discount once the cart subtotal reaches a threshold. Customers see a progress bar towards the next tier."
      value={settings.spendingTiers}
      toPatch={(d) => ({ spendingTiers: [...d].filter((t) => t.minCents > 0 && t.percent > 0).sort((a, b) => a.minCents - b.minCents) })}
      validate={(d) => (d.some((t) => t.percent > 60) ? 'Tier discounts cannot exceed 60%.' : null)}
      onSave={onSave}
    >
      {(d, set) => (
        <div className="adm-section-rows">
          {d.map((t, i) => (
            <div className="adm-row-edit tier" key={i}>
              <span className="label">From</span>
              <MoneyInput xs valueCents={t.minCents} onChange={(c) => set(d.map((x, j) => (j === i ? { ...x, minCents: c ?? 0 } : x)))} aria-label={`Tier ${i + 1} minimum`} />
              <span className="label">→</span>
              <PercentInput xs value={t.percent} onChange={(v) => set(d.map((x, j) => (j === i ? { ...x, percent: v ?? 0 } : x)))} aria-label={`Tier ${i + 1} percent`} />
              <button type="button" className="btn btn-ghost btn-sm rm" onClick={() => set(d.filter((_, j) => j !== i))} aria-label="Remove tier">
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => set([...d, { minCents: (d[d.length - 1]?.minCents ?? 1000) * 2, percent: Math.min(60, (d[d.length - 1]?.percent ?? 3) + 3) }])}>
            <Icon name="plus" size={14} /> Add tier
          </button>
        </div>
      )}
    </SectionCard>
  );
}

/* ───────── currencies ───────── */

export function CurrenciesSection({ settings, onSave }: { settings: SiteSettings; onSave: SaveFn }) {
  return (
    <SectionCard<CurrencyConfig[]>
      id="currencies"
      title="Display currencies"
      icon="coin"
      sub="Prices are converted for display only – you are always paid the USD amount. Rate = how much 1 USD is in that currency."
      value={settings.currencies}
      toPatch={(d) => ({
        currencies: [{ code: 'USD', symbol: '$', rate: 1 }, ...d.filter((c) => c.code.trim().toUpperCase() !== 'USD' && c.code.trim() && c.rate > 0).map((c) => ({ code: c.code.trim().toUpperCase().slice(0, 4), symbol: c.symbol || c.code.trim().toUpperCase() + ' ', rate: c.rate }))],
      })}
      onSave={onSave}
    >
      {(d, set) => (
        <div className="adm-section-rows">
          {d.map((c, i) => {
            const locked = c.code.toUpperCase() === 'USD';
            return (
              <div className="adm-row-edit currency" key={i}>
                <TextInput xs className="mono" value={c.code} disabled={locked} maxLength={4} onChange={(e) => set(d.map((x, j) => (j === i ? { ...x, code: e.target.value.toUpperCase() } : x)))} aria-label="Currency code" placeholder="EUR" />
                <TextInput xs value={c.symbol} disabled={locked} maxLength={5} onChange={(e) => set(d.map((x, j) => (j === i ? { ...x, symbol: e.target.value } : x)))} aria-label="Symbol" placeholder="€" />
                <div className="adm-input-affix">
                  <span className="affix">1 $ =</span>
                  <NumberInput xs className="has-prefix" style={{ paddingLeft: 48 }} value={c.rate} disabled={locked} min={0} step={0.01} onChange={(v) => set(d.map((x, j) => (j === i ? { ...x, rate: v ?? 0 } : x)))} aria-label="Rate" />
                </div>
                <button type="button" className="btn btn-ghost btn-sm rm" disabled={locked} onClick={() => set(d.filter((_, j) => j !== i))} aria-label="Remove currency">
                  <Icon name="trash" size={14} />
                </button>
              </div>
            );
          })}
          <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => set([...d, { code: '', symbol: '', rate: 1 }])}>
            <Icon name="plus" size={14} /> Add currency
          </button>
        </div>
      )}
    </SectionCard>
  );
}

/* ───────── rewards: referral, review, welcome ───────── */

interface RewardsDraft {
  referral: SiteSettings['referral'];
  reviewRewardPercent: number | undefined;
  welcomeCoupon: SiteSettings['welcomeCoupon'];
}

export function RewardsSection({ settings, onSave }: { settings: SiteSettings; onSave: SaveFn }) {
  const value: RewardsDraft = { referral: settings.referral, reviewRewardPercent: settings.reviewRewardPercent, welcomeCoupon: settings.welcomeCoupon };
  return (
    <SectionCard<RewardsDraft>
      id="rewards"
      title="Referral & rewards"
      icon="heart"
      sub="Friend discount, referrer store credit, review thank-you and the welcome code."
      value={value}
      toPatch={(d) => ({
        referral: { enabled: d.referral.enabled, friendPercent: Math.max(0, Math.min(50, Math.round(d.referral.friendPercent))), referrerPercent: Math.max(0, Math.min(50, Math.round(d.referral.referrerPercent))) },
        reviewRewardPercent: Math.max(0, Math.min(50, Math.round(d.reviewRewardPercent ?? 0))),
        welcomeCoupon: { enabled: d.welcomeCoupon.enabled, code: d.welcomeCoupon.code.trim().toUpperCase().replace(/\s+/g, '') || 'WELCOME5', percent: Math.max(1, Math.min(50, Math.round(d.welcomeCoupon.percent))) },
      })}
      onSave={onSave}
    >
      {(d, set) => (
        <div className="adm-form-grid cols-3">
          <div className="stack" style={{ gap: 12 }}>
            <Toggle checked={d.referral.enabled} onChange={(v) => set({ ...d, referral: { ...d.referral, enabled: v } })} label="Referral program" />
            <Field label="Friend gets" hint="Discount for the referred customer" htmlFor="rw-friend">
              <PercentInput id="rw-friend" value={d.referral.friendPercent} onChange={(v) => set({ ...d, referral: { ...d.referral, friendPercent: v ?? 0 } })} />
            </Field>
            <Field label="Referrer gets" hint="Store credit, % of the order" htmlFor="rw-ref">
              <PercentInput id="rw-ref" value={d.referral.referrerPercent} onChange={(v) => set({ ...d, referral: { ...d.referral, referrerPercent: v ?? 0 } })} />
            </Field>
          </div>
          <div className="stack" style={{ gap: 12 }}>
            <Field label="Review reward" hint="Coupon sent when you approve a review (0 = off)" htmlFor="rw-review">
              <PercentInput id="rw-review" value={d.reviewRewardPercent} onChange={(v) => set({ ...d, reviewRewardPercent: v })} />
            </Field>
          </div>
          <div className="stack" style={{ gap: 12 }}>
            <Toggle checked={d.welcomeCoupon.enabled} onChange={(v) => set({ ...d, welcomeCoupon: { ...d.welcomeCoupon, enabled: v } })} label="Welcome coupon" />
            <Field label="Code" htmlFor="rw-code">
              <TextInput id="rw-code" className="mono" value={d.welcomeCoupon.code} onChange={(e) => set({ ...d, welcomeCoupon: { ...d.welcomeCoupon, code: e.target.value.toUpperCase() } })} />
            </Field>
            <Field label="Discount" htmlFor="rw-wpct">
              <PercentInput id="rw-wpct" value={d.welcomeCoupon.percent} onChange={(v) => set({ ...d, welcomeCoupon: { ...d.welcomeCoupon, percent: v ?? 0 } })} />
            </Field>
            <p className="adm-help">The welcome code must also exist as a coupon (Coupons → create with this code) – this only controls the banner.</p>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
