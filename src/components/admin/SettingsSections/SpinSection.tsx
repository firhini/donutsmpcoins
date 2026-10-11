import type { SiteSettings, SpinPrize, SpinPrizeType } from '../../../shared/types';
import { Icon } from '../../ui/Icons';
import { useAdminProducts } from '../useProducts';
import { Field, MoneyInput, NumberInput, SelectInput, TextInput, Toggle } from '../Field';
import { SectionCard, type SaveFn } from './SectionCard';

const TYPES: { id: SpinPrizeType; label: string }[] = [
  { id: 'coupon', label: 'Coupon' },
  { id: 'free_item', label: 'Free item' },
  { id: 'credit', label: 'Store credit' },
  { id: 'nothing', label: 'Nothing' },
];
const PALETTE = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#f97316', '#ef4444', '#eab308', '#475569'];

function newPrize(existing: SpinPrize[]): SpinPrize {
  return { id: `p${Date.now().toString(36)}`, label: '5% OFF', type: 'coupon', percent: 5, weight: 10, color: PALETTE[existing.length % PALETTE.length], validDays: 7 };
}

export function SpinSection({ settings, onSave }: { settings: SiteSettings; onSave: SaveFn }) {
  const { products } = useAdminProducts();
  return (
    <SectionCard<SiteSettings['spin']>
      id="spin"
      title="Daily spin"
      icon="spin"
      sub="The free wheel. Probability = weight ÷ total weight. The server picks the prize – the wheel only animates it."
      value={settings.spin}
      toPatch={(d) => ({
        spin: {
          enabled: d.enabled,
          cooldownHours: Math.max(1, Math.round(d.cooldownHours || 24)),
          requireUsername: d.requireUsername,
          prizes: d.prizes.map((p) => ({
            ...p,
            label: p.label.trim() || p.type,
            weight: Math.max(0, p.weight),
            percent: p.type === 'coupon' ? Math.max(1, Math.min(90, Math.round(p.percent ?? 5))) : undefined,
            minOrderCents: p.type === 'coupon' && p.minOrderCents ? p.minOrderCents : undefined,
            validDays: p.type === 'coupon' ? Math.max(1, Math.round(p.validDays ?? 7)) : undefined,
            productId: p.type === 'free_item' ? p.productId : undefined,
            qty: p.type === 'free_item' ? Math.max(1, Math.round(p.qty ?? 1)) : undefined,
            creditCents: p.type === 'credit' ? Math.max(1, p.creditCents ?? 100) : undefined,
          })),
        },
      })}
      validate={(d) => {
        if (d.prizes.length < 2) return 'Add at least two prizes.';
        if (d.prizes.every((p) => p.weight <= 0)) return 'At least one prize needs a weight above 0.';
        const bad = d.prizes.find((p) => p.type === 'free_item' && !p.productId);
        return bad ? `"${bad.label}" needs a product.` : null;
      }}
      onSave={onSave}
    >
      {(d, set) => {
        const total = d.prizes.reduce((s, p) => s + Math.max(0, p.weight), 0) || 1;
        const setPrize = (i: number, patch: Partial<SpinPrize>) => set({ ...d, prizes: d.prizes.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
        return (
          <div className="stack" style={{ gap: 16 }}>
            <div className="adm-form-grid cols-3">
              <div className="stack" style={{ gap: 10, justifyContent: 'center' }}>
                <Toggle checked={d.enabled} onChange={(v) => set({ ...d, enabled: v })} label="Spin wheel enabled" />
                <Toggle checked={d.requireUsername} onChange={(v) => set({ ...d, requireUsername: v })} label="Require Minecraft name to spin" />
              </div>
              <Field label="Cooldown (hours)" hint="Per device and IP" htmlFor="sp-cd">
                <NumberInput id="sp-cd" value={d.cooldownHours} onChange={(v) => set({ ...d, cooldownHours: v ?? 24 })} min={1} max={168} step={1} allowEmpty={false} />
              </Field>
            </div>

            <div className="adm-table-wrap" style={{ border: '1px solid var(--border-1)', borderRadius: 12 }}>
              <table className="adm-table" style={{ minWidth: 1000 }}>
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Type</th>
                    <th>Prize</th>
                    <th>Weight</th>
                    <th>Chance</th>
                    <th>Color</th>
                    <th>Valid days</th>
                    <th>Min order</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {d.prizes.map((p, i) => (
                    <tr key={p.id}>
                      <td>
                        <TextInput xs className="w-md" value={p.label} onChange={(e) => setPrize(i, { label: e.target.value })} aria-label="Prize label" />
                      </td>
                      <td>
                        <SelectInput value={p.type} style={{ height: 34, width: 130, fontSize: 13 }} onChange={(e) => setPrize(i, { type: e.target.value as SpinPrizeType })} aria-label="Prize type">
                          {TYPES.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </SelectInput>
                      </td>
                      <td>
                        {p.type === 'coupon' && (
                          <div className="adm-input-affix" style={{ width: 90 }}>
                            <NumberInput xs className="has-suffix" value={p.percent} onChange={(v) => setPrize(i, { percent: v })} min={1} max={90} step={1} aria-label="Percent off" />
                            <span className="affix right">%</span>
                          </div>
                        )}
                        {p.type === 'free_item' && (
                          <span className="row" style={{ gap: 6 }}>
                            <SelectInput value={p.productId ?? ''} style={{ height: 34, width: 190, fontSize: 13 }} onChange={(e) => setPrize(i, { productId: e.target.value })} aria-label="Product">
                              <option value="">Pick a product…</option>
                              {products.map((pr) => (
                                <option key={pr.id} value={pr.id}>
                                  {pr.name}
                                </option>
                              ))}
                            </SelectInput>
                            <NumberInput xs className="w-xs" value={p.qty ?? 1} onChange={(v) => setPrize(i, { qty: v })} min={1} step={1} aria-label="Quantity" />
                          </span>
                        )}
                        {p.type === 'credit' && <MoneyInput xs className="w-sm" valueCents={p.creditCents ?? null} onChange={(c) => setPrize(i, { creditCents: c ?? undefined })} aria-label="Credit amount" />}
                        {p.type === 'nothing' && <span className="muted small">—</span>}
                      </td>
                      <td>
                        <NumberInput xs className="w-xs" value={p.weight} onChange={(v) => setPrize(i, { weight: v ?? 0 })} min={0} step={1} aria-label="Weight" allowEmpty={false} />
                      </td>
                      <td>
                        <span className="adm-prob">
                          <span className="bar">
                            <i style={{ width: `${Math.min(100, (Math.max(0, p.weight) / total) * 100)}%` }} />
                          </span>
                          {((Math.max(0, p.weight) / total) * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <span className="row" style={{ gap: 6 }}>
                          <span className="adm-color-dot" style={{ background: p.color ?? '#475569' }}>
                            <input type="color" value={p.color ?? '#475569'} onChange={(e) => setPrize(i, { color: e.target.value })} aria-label="Segment color" />
                          </span>
                          <span className="mono xs muted">{p.color}</span>
                        </span>
                      </td>
                      <td>{p.type === 'coupon' ? <NumberInput xs className="w-xs" value={p.validDays ?? 7} onChange={(v) => setPrize(i, { validDays: v })} min={1} step={1} aria-label="Valid days" /> : <span className="muted">—</span>}</td>
                      <td>{p.type === 'coupon' ? <MoneyInput xs className="w-sm" valueCents={p.minOrderCents ?? null} onChange={(c) => setPrize(i, { minOrderCents: c ?? undefined })} placeholder="—" aria-label="Minimum order" /> : <span className="muted">—</span>}</td>
                      <td>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ ...d, prizes: d.prizes.filter((_, j) => j !== i) })} aria-label="Remove prize">
                          <Icon name="trash" size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row between wrap">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => set({ ...d, prizes: [...d.prizes, newPrize(d.prizes)] })}>
                <Icon name="plus" size={14} /> Add prize
              </button>
              <span className="muted xs">Free items create a paid $0 order you deliver like any other. Max one free-item win per player per week (then a 5% coupon instead).</span>
            </div>
          </div>
        );
      }}
    </SectionCard>
  );
}
