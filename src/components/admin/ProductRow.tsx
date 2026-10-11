import { useEffect, useState } from 'react';
import type { Product } from '../../shared/types';
import { Icon } from '../ui/Icons';
import type { ProductPatch } from '../../lib/adminApi';
import { MoneyInput, NumberInput, TextInput, Toggle } from './Field';
import { ProductThumb } from './Bits';

interface Draft {
  priceCents: number | null;
  compareAtCents: number | null;
  stock: number | null;
  featured: boolean;
  hidden: boolean;
  tags: string;
}

function toDraft(p: Product): Draft {
  return {
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents && p.compareAtCents > 0 ? p.compareAtCents : null,
    stock: p.stock === null || p.stock === undefined ? null : p.stock,
    featured: !!p.featured,
    hidden: !!p.hidden,
    tags: (p.tags ?? []).join(', '),
  };
}

function same(a: Draft, b: Draft): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function diffToPatch(p: Product, d: Draft): ProductPatch {
  const base = toDraft(p);
  const patch: ProductPatch = {};
  if (d.priceCents !== null && d.priceCents !== base.priceCents) patch.priceCents = Math.max(0, d.priceCents);
  if (d.compareAtCents !== base.compareAtCents) patch.compareAtCents = d.compareAtCents === null ? 0 : Math.max(0, d.compareAtCents);
  if (d.stock !== base.stock) patch.stock = d.stock === null ? null : Math.max(0, Math.round(d.stock));
  if (d.featured !== base.featured) patch.featured = d.featured;
  if (d.hidden !== base.hidden) patch.hidden = d.hidden;
  if (d.tags !== base.tags) {
    patch.tags = d.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return patch;
}

export function ProductRow({
  product,
  categoryName,
  overridden,
  custom,
  busy,
  onSave,
  onDelete,
}: {
  product: Product;
  categoryName: string;
  overridden: boolean;
  custom: boolean;
  busy: boolean;
  onSave: (patch: ProductPatch) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(product));
  useEffect(() => setDraft(toDraft(product)), [product]);
  const dirty = !same(draft, toDraft(product));
  const invalid = draft.priceCents === null || draft.priceCents < 0;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const save = async () => {
    const ok = await onSave(diffToPatch(product, draft));
    if (!ok) return;
  };

  return (
    <tr className={`${dirty ? 'adm-row-dirty' : ''} ${draft.hidden ? 'adm-row-hidden' : ''}`}>
      <td className="keep">
        <div className="adm-prod-name">
          <ProductThumb src={product.image} alt="" />
          <div className="t">
            <strong title={product.name}>{product.name}</strong>
            <span className="meta">
              <span className="mono">{product.id}</span>
              <span className="badge" style={{ height: 18, fontSize: 9 }}>
                {product.kind}
              </span>
              {custom ? <span className="badge badge-pink" style={{ height: 18, fontSize: 9 }}>custom</span> : overridden ? <span className="badge badge-gold" style={{ height: 18, fontSize: 9 }}>edited</span> : null}
            </span>
          </div>
        </div>
      </td>
      <td>
        <span className="small text-2">{categoryName}</span>
      </td>
      <td>
        <MoneyInput xs className="w-sm" valueCents={draft.priceCents} onChange={(c) => set('priceCents', c)} aria-label={`Price of ${product.name}`} />
      </td>
      <td>
        <MoneyInput xs className="w-sm" valueCents={draft.compareAtCents} onChange={(c) => set('compareAtCents', c)} placeholder="—" aria-label={`Compare-at price of ${product.name}`} />
      </td>
      <td>
        <NumberInput xs className="w-xs" value={draft.stock} onChange={(n) => set('stock', n === undefined ? null : Math.max(0, Math.round(n)))} placeholder="∞" min={0} step={1} aria-label={`Stock of ${product.name}`} />
      </td>
      <td>
        <Toggle sm checked={draft.featured} onChange={(v) => set('featured', v)} />
      </td>
      <td className="keep">
        <Toggle sm checked={draft.hidden} onChange={(v) => set('hidden', v)} />
      </td>
      <td>
        <TextInput xs className="w-md" value={draft.tags} onChange={(e) => set('tags', e.target.value)} placeholder="none" aria-label={`Tags of ${product.name}`} />
      </td>
      <td className="keep">
        <div className="cell-actions">
          {dirty && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft(toDraft(product))} disabled={busy} title="Discard changes">
              <Icon name="close" size={14} />
            </button>
          )}
          <button type="button" className={`btn btn-sm ${dirty ? 'btn-primary' : 'btn-secondary'}`} disabled={!dirty || invalid || busy} onClick={() => void save()}>
            {busy ? <span className="spinner" /> : <Icon name="check" size={14} />} Save
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDelete} disabled={busy} aria-label={`Delete ${product.name}`} title={custom ? 'Delete product' : 'Remove from store'}>
            <Icon name="trash" size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
