import type { SiteSettings } from '../../../shared/types';
import { dealOfTheDay } from '../../../shared/pricing';
import { Field, NumberInput, Toggle } from '../Field';
import { SectionCard, type SaveFn } from './SectionCard';
import { useAdminProducts } from '../useProducts';
import { usd } from '../adminUtils';

type Draft = SiteSettings['dailyDeal'];

/** Daily deal: rotation pool (one product per UTC day), deal price and per-player limit. */
export function DailyDealSection({ settings, onSave }: { settings: SiteSettings; onSave: SaveFn }) {
  const { products } = useAdminProducts();
  const value: Draft = settings.dailyDeal ?? { enabled: false, maxPerPlayer: 3, pool: [] };
  const name = (id: string) => products.find((p) => p.id === id)?.name ?? id;
  const regular = (id: string) => products.find((p) => p.id === id)?.priceCents ?? 0;
  return (
    <SectionCard<Draft>
      id="deal"
      title="Deal of the day"
      icon="bolt"
      sub="One product per day (switches at 00:00 UTC), shown big on the home page. Keep the deal price above your in-game cost."
      value={value}
      toPatch={(d) => ({ dailyDeal: { enabled: d.enabled, maxPerPlayer: Math.max(1, Math.min(20, Math.round(d.maxPerPlayer || 3))), pool: d.pool.filter((r) => r.productId && r.priceCents > 0) } })}
      validate={(d) => (d.pool.some((r) => regular(r.productId) && r.priceCents >= regular(r.productId)) ? 'A deal price must be below the regular price.' : null)}
      onSave={onSave}
    >
      {(d, set) => {
        const today = dealOfTheDay(d);
        const tomorrow = today ? dealOfTheDay(d, new Date(new Date(today.endsAt).getTime() + 1000)) : null;
        return (
          <div className="stack" style={{ gap: 14 }}>
            <div className="row wrap" style={{ gap: 16 }}>
              <Toggle checked={d.enabled} onChange={(v) => set({ ...d, enabled: v })} label="Deal of the day is running" />
              <Field label="Deal units per player / day (more are sold at the regular price)" htmlFor="dd-max">
                <NumberInput id="dd-max" value={d.maxPerPlayer} onChange={(v) => set({ ...d, maxPerPlayer: v ?? 3 })} />
              </Field>
            </div>
            {today && (
              <p className="adm-help">
                Today: <strong>{name(today.productId)}</strong> for {usd(today.priceCents)}
                {tomorrow ? (
                  <>
                    {' '}
                    · tomorrow: <strong>{name(tomorrow.productId)}</strong>
                  </>
                ) : null}
              </p>
            )}
            <table className="an-sources">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th className="num">Regular</th>
                  <th className="num">Deal price ($)</th>
                  <th className="num">Off</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {d.pool.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      <select className="select" value={r.productId} onChange={(e) => set({ ...d, pool: d.pool.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)) })}>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="num">{usd(regular(r.productId))}</td>
                    <td className="num">
                      <input
                        className="input"
                        style={{ width: 90, textAlign: 'right' }}
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={(r.priceCents / 100).toFixed(2)}
                        onChange={(e) => set({ ...d, pool: d.pool.map((x, j) => (j === i ? { ...x, priceCents: Math.round(Number(e.target.value) * 100) || 0 } : x)) })}
                      />
                    </td>
                    <td className="num">{regular(r.productId) ? `${Math.round((1 - r.priceCents / regular(r.productId)) * 100)}%` : '—'}</td>
                    <td>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ ...d, pool: d.pool.filter((_, j) => j !== i) })}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => set({ ...d, pool: [...d.pool, { productId: products[0]?.id ?? '', priceCents: 100 }] })}>
              + Add product to the rotation
            </button>
          </div>
        );
      }}
    </SectionCard>
  );
}
