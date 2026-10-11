import { useMemo, useState, type FormEvent } from 'react';
import type { CategoryId, Product, ProductKind } from '../../shared/types';
import { Seo } from '../../components/ui/Seo';
import { Icon } from '../../components/ui/Icons';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { createProduct, deleteProduct, updateProduct, type CreateProductInput, type ProductPatch } from '../../lib/adminApi';
import { useAction } from '../../components/admin/hooks';
import { useAdminProducts } from '../../components/admin/useProducts';
import { ErrorBlock, PageHead } from '../../components/admin/Bits';
import { ConfirmDialog, type ConfirmState } from '../../components/admin/ConfirmDialog';
import { ProductRow } from '../../components/admin/ProductRow';
import { Field, MoneyInput, NumberInput, SelectInput, TextArea, TextInput, Toggle } from '../../components/admin/Field';
import { slugify } from '../../components/admin/adminUtils';

const KINDS: ProductKind[] = ['item', 'money', 'box', 'kit', 'bundle', 'base'];

interface NewProduct {
  name: string;
  slug: string;
  slugTouched: boolean;
  categoryId: CategoryId;
  kind: ProductKind;
  priceCents: number | null;
  compareAtCents: number | null;
  stock: number | null;
  image: string;
  shortDesc: string;
  description: string;
  tags: string;
  featured: boolean;
  moneyMillions: number | undefined;
  unitLabel: string;
  maxQty: number | undefined;
}

const emptyNew = (categoryId: CategoryId): NewProduct => ({
  name: '',
  slug: '',
  slugTouched: false,
  categoryId,
  kind: 'item',
  priceCents: null,
  compareAtCents: null,
  stock: null,
  image: '',
  shortDesc: '',
  description: '',
  tags: '',
  featured: false,
  moneyMillions: undefined,
  unitLabel: '',
  maxQty: undefined,
});

export default function Products() {
  const { toast } = useToast();
  const cat = useAdminProducts();
  const { run, isBusy } = useAction();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryId | ''>('');
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<NewProduct>(() => emptyNew('spawners'));

  const catName = useMemo(() => new Map(cat.categories.map((c) => [c.id, c.name])), [cat.categories]);
  const customIds = useMemo(() => new Set(cat.overrides.custom.map((p) => p.id)), [cat.overrides]);

  const catOrder = useMemo(() => new Map(cat.categories.map((c) => [c.id, c.order])), [cat.categories]);
  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return cat.products
      .filter((p) => (!category || p.categoryId === category) && (!s || p.name.toLowerCase().includes(s) || p.id.includes(s) || p.slug.includes(s)))
      .sort((a, b) => (catOrder.get(a.categoryId) ?? 99) - (catOrder.get(b.categoryId) ?? 99) || (a.sortOrder ?? 99) - (b.sortOrder ?? 99) || a.name.localeCompare(b.name));
  }, [cat.products, search, category, catOrder]);

  const save = async (p: Product, patch: ProductPatch): Promise<boolean> => {
    if (Object.keys(patch).length === 0) return true;
    const updated = await run(`save:${p.id}`, () => updateProduct(p.id, patch), `${p.name} saved`);
    if (updated === undefined) return false;
    cat.setData((d) => (d ? { ...d, products: d.products.map((x) => (x.id === p.id ? { ...x, ...patch, ...(updated ?? {}) } : x)), overrides: { ...d.overrides, overrides: { ...d.overrides.overrides, [p.id]: { ...(d.overrides.overrides[p.id] ?? {}), ...patch } } } } : d));
    void cat.reload(true);
    return true;
  };

  const remove = (p: Product) =>
    setConfirm({
      title: customIds.has(p.id) ? `Delete "${p.name}"?` : `Remove "${p.name}" from the store?`,
      message: customIds.has(p.id) ? 'This custom product is deleted permanently.' : 'Default products are only hidden from the catalog (marked as deleted) – you can restore them by resetting overrides in Blobs.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        const ok = await run(`del:${p.id}`, () => deleteProduct(p.id), `${p.name} removed`);
        if (ok !== undefined) {
          cat.setData((d) => (d ? { ...d, products: d.products.filter((x) => x.id !== p.id) } : d));
          void cat.reload(true);
        }
      },
    });

  const submitNew = async (e: FormEvent) => {
    e.preventDefault();
    const name = draft.name.trim();
    const slug = slugify(draft.slug || name);
    if (!name || !slug || draft.priceCents === null) {
      toast('Name, slug and price are required.', 'error');
      return;
    }
    const body: CreateProductInput = {
      id: slug,
      slug,
      name,
      categoryId: draft.categoryId,
      kind: draft.kind,
      priceCents: Math.max(0, draft.priceCents),
      compareAtCents: draft.compareAtCents && draft.compareAtCents > draft.priceCents ? draft.compareAtCents : undefined,
      stock: draft.stock,
      image: draft.image.trim() || '/img/products/_fallback.svg',
      shortDesc: draft.shortDesc.trim() || undefined,
      description: draft.description.trim() || undefined,
      tags: draft.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      featured: draft.featured,
      moneyMillions: draft.kind === 'money' ? draft.moneyMillions : undefined,
      unitLabel: draft.unitLabel.trim() || undefined,
      maxQty: draft.maxQty,
      sortOrder: 50,
    };
    const created = await run('create', () => createProduct(body), `${name} added`);
    if (created === undefined) return;
    setAdding(false);
    setDraft(emptyNew(draft.categoryId));
    void cat.reload(true);
  };

  const setD = <K extends keyof NewProduct>(k: K, v: NewProduct[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="adm-page">
      <Seo robots="noindex,nofollow" title="Products · Admin · DonutCoins" description="DonutCoins back office" />
      <PageHead title="Products" sub={`${cat.products.length} products · edit prices, stock and visibility inline`}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => void cat.reload(true)}>
          <Icon name="refresh" size={14} /> Refresh
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
          <Icon name="plus" size={14} /> Add custom product
        </button>
      </PageHead>

      {cat.error && (
        <ErrorBlock message={cat.fromFallback ? `${cat.error} Showing the public catalog read-only until the admin API responds.` : cat.error} onRetry={() => void cat.reload()} />
      )}

      <div className="adm-toolbar">
        <div className="adm-chips" role="tablist" aria-label="Category">
          <button type="button" className={`adm-chip ${category === '' ? 'active' : ''}`} onClick={() => setCategory('')}>
            All <span className="n">{cat.products.length}</span>
          </button>
          {cat.categories.map((c) => (
            <button key={c.id} type="button" className={`adm-chip ${category === c.id ? 'active' : ''}`} onClick={() => setCategory(c.id)}>
              {c.name} <span className="n">{cat.products.filter((p) => p.categoryId === c.id).length}</span>
            </button>
          ))}
        </div>
        <div className="adm-search">
          <Icon name="search" size={16} />
          <input className="input adm-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or id" aria-label="Search products" />
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-table-wrap">
          <table className="adm-table" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Compare at</th>
                <th>Stock</th>
                <th>Featured</th>
                <th>Hidden</th>
                <th>Tags</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  categoryName={catName.get(p.categoryId) ?? p.categoryId}
                  overridden={!!cat.overrides.overrides[p.id]}
                  custom={customIds.has(p.id)}
                  busy={isBusy(`save:${p.id}`) || isBusy(`del:${p.id}`)}
                  onSave={(patch) => save(p, patch)}
                  onDelete={() => remove(p)}
                />
              ))}
            </tbody>
          </table>
          {cat.loading && rows.length === 0 && (
            <div className="adm-skel-rows">
              <div className="skeleton" style={{ width: '70%' }} />
              <div className="skeleton" style={{ width: '85%' }} />
            </div>
          )}
          {!cat.loading && rows.length === 0 && <div className="adm-table-empty">No products match.</div>}
        </div>
      </div>
      <p className="adm-help">
        Stock blank = unlimited. Hidden products stay purchasable through gift codes and spin prizes but are not listed. Changes are stored as overrides over <code>src/data/catalog.ts</code>.
      </p>

      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />

      <Modal open={adding} onClose={() => setAdding(false)} title="Add custom product" size="lg">
        <form className="stack" style={{ gap: 16 }} onSubmit={submitNew}>
          <div className="adm-form-grid cols-2">
            <Field label="Name" htmlFor="np-name">
              <TextInput
                id="np-name"
                value={draft.name}
                autoFocus
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value, slug: d.slugTouched ? d.slug : slugify(e.target.value) }))}
                placeholder="e.g. Wither Skeleton Spawner"
              />
            </Field>
            <Field label="Slug / id" hint="Used in the product URL. Letters, numbers, dashes." htmlFor="np-slug">
              <TextInput id="np-slug" className="mono" value={draft.slug} onChange={(e) => setDraft((d) => ({ ...d, slug: slugify(e.target.value), slugTouched: true }))} placeholder="wither-skeleton-spawner" />
            </Field>
            <Field label="Category" htmlFor="np-cat">
              <SelectInput id="np-cat" value={draft.categoryId} onChange={(e) => setD('categoryId', e.target.value as CategoryId)}>
                {cat.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Kind" hint="box = random drops, kit/bundle = fixed contents (edit contents in code)." htmlFor="np-kind">
              <SelectInput id="np-kind" value={draft.kind} onChange={(e) => setD('kind', e.target.value as ProductKind)}>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Price (USD)" htmlFor="np-price">
              <MoneyInput id="np-price" valueCents={draft.priceCents} onChange={(c) => setD('priceCents', c)} />
            </Field>
            <Field label="Compare-at price" optional htmlFor="np-cmp">
              <MoneyInput id="np-cmp" valueCents={draft.compareAtCents} onChange={(c) => setD('compareAtCents', c)} placeholder="—" />
            </Field>
            <Field label="Stock" hint="Blank = unlimited" optional htmlFor="np-stock">
              <NumberInput id="np-stock" value={draft.stock} onChange={(n) => setD('stock', n === undefined ? null : Math.max(0, Math.round(n)))} min={0} step={1} placeholder="∞" />
            </Field>
            <Field label="Max quantity per order" optional htmlFor="np-max">
              <NumberInput id="np-max" value={draft.maxQty} onChange={(n) => setD('maxQty', n === undefined ? undefined : Math.max(1, Math.round(n)))} min={1} step={1} placeholder="100" />
            </Field>
            {draft.kind === 'money' && (
              <Field label="Millions per unit" hint="e.g. 10 for a 10M pack" htmlFor="np-mm">
                <NumberInput id="np-mm" value={draft.moneyMillions} onChange={(n) => setD('moneyMillions', n)} min={0} step={1} />
              </Field>
            )}
            <Field label="Unit label" optional htmlFor="np-unit">
              <TextInput id="np-unit" value={draft.unitLabel} onChange={(e) => setD('unitLabel', e.target.value)} placeholder="per 1M" />
            </Field>
            <Field label="Image path" hint="Put an SVG/PNG in public/img/products/ and enter its path." htmlFor="np-img" className="span-2">
              <TextInput id="np-img" className="mono" value={draft.image} onChange={(e) => setD('image', e.target.value)} placeholder="/img/products/my-item.svg" />
            </Field>
            <Field label="Short description" optional htmlFor="np-short" className="span-2">
              <TextInput id="np-short" value={draft.shortDesc} onChange={(e) => setD('shortDesc', e.target.value)} placeholder="One line shown on the card" />
            </Field>
            <Field label="Description" optional htmlFor="np-desc" className="span-2">
              <TextArea id="np-desc" value={draft.description} onChange={(e) => setD('description', e.target.value)} rows={3} />
            </Field>
            <Field label="Tags" hint="Comma separated: Hot, New, Popular" optional htmlFor="np-tags">
              <TextInput id="np-tags" value={draft.tags} onChange={(e) => setD('tags', e.target.value)} />
            </Field>
            <div className="field adm-field" style={{ justifyContent: 'flex-end' }}>
              <Toggle checked={draft.featured} onChange={(v) => setD('featured', v)} label="Featured on the home page" />
            </div>
          </div>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isBusy('create')}>
              {isBusy('create') ? <span className="spinner" /> : <Icon name="plus" size={15} />} Add product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
