import { useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Coupon } from '../../shared/types';
import { Seo } from '../../components/ui/Seo';
import { Icon } from '../../components/ui/Icons';
import { useToast } from '../../context/ToastContext';
import { createCoupon, createGift, deleteCoupon, deleteGift, listCoupons, listGifts, setCouponActive, type GiftCode } from '../../lib/adminApi';
import { useAction, useAdminQuery } from '../../components/admin/hooks';
import { useAdminProducts } from '../../components/admin/useProducts';
import { CopyButton, PageHead, Panel } from '../../components/admin/Bits';
import { DataTable, type Column } from '../../components/admin/DataTable';
import { ConfirmDialog, type ConfirmState } from '../../components/admin/ConfirmDialog';
import { Field, MoneyInput, NumberInput, SelectInput, TextInput, Toggle } from '../../components/admin/Field';
import { formatDate, relativeTime, usd } from '../../components/admin/adminUtils';

const SOURCE_BADGE: Record<string, string> = { admin: '', spin: 'badge-pink', review: 'badge-gold', referral: 'badge-blue', giveaway: 'badge-violet', welcome: 'badge-green' };

function isExpired(iso?: string): boolean {
  return !!iso && new Date(iso).getTime() < Date.now();
}

/* ───────────────────────── coupons tab ───────────────────────── */

function CouponsTab() {
  const { toast } = useToast();
  const list = useAdminQuery(listCoupons, []);
  const { run, isBusy } = useAction();
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ code: '', type: 'percent' as 'percent' | 'fixed', value: 10 as number | undefined, minOrderCents: null as number | null, maxUses: undefined as number | undefined, validDays: 30 as number | undefined, boundUsername: '', note: '' });

  const rows = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return (list.data ?? []).filter((c) => !f || c.code.toLowerCase().includes(f) || (c.boundUsername ?? '').includes(f) || c.source.includes(f));
  }, [list.data, filter]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.value || form.value <= 0) {
      toast('Enter a discount value.', 'error');
      return;
    }
    if (form.type === 'percent' && form.value > 100) {
      toast('Percent must be 1–100.', 'error');
      return;
    }
    const created = await run('create', () =>
      createCoupon({
        source: 'admin',
        type: form.type,
        value: form.type === 'percent' ? Math.round(form.value!) : Math.round(form.value! * 100),
        code: form.code.trim() || undefined,
        minOrderCents: form.minOrderCents ?? undefined,
        maxUses: form.maxUses,
        validDays: form.validDays,
        boundUsername: form.boundUsername.trim() || undefined,
        note: form.note.trim() || undefined,
      }),
    );
    if (!created) return;
    toast(`Coupon ${created.code} created`, 'success');
    setForm((f) => ({ ...f, code: '', boundUsername: '', note: '' }));
    void list.reload(true);
  };

  const toggle = async (c: Coupon, active: boolean) => {
    list.setData((d) => (d ? d.map((x) => (x.code === c.code ? { ...x, active } : x)) : d));
    const r = await run(`toggle:${c.code}`, () => setCouponActive(c.code, active));
    if (r === undefined) list.setData((d) => (d ? d.map((x) => (x.code === c.code ? { ...x, active: !active } : x)) : d));
  };

  const remove = (c: Coupon) =>
    setConfirm({
      title: `Delete ${c.code}?`,
      message: 'Customers can no longer use this code. This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        const r = await run(`del:${c.code}`, () => deleteCoupon(c.code), `${c.code} deleted`);
        if (r !== undefined) list.setData((d) => (d ? d.filter((x) => x.code !== c.code) : d));
      },
    });

  const cols: Column<Coupon>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (c) => (
        <span className="row" style={{ gap: 4 }}>
          <span className="adm-id">{c.code}</span>
          <CopyButton text={c.code} iconOnly label="Copy code" className="btn btn-ghost btn-sm" />
        </span>
      ),
    },
    { key: 'value', header: 'Discount', render: (c) => <strong>{c.type === 'percent' ? `${c.value}% off` : `${usd(c.value)} off`}</strong> },
    { key: 'uses', header: 'Uses', className: 'num', render: (c) => `${c.uses}${c.maxUses !== undefined ? ` / ${c.maxUses}` : ''}` },
    { key: 'min', header: 'Min order', className: 'num', render: (c) => (c.minOrderCents ? usd(c.minOrderCents) : <span className="muted">—</span>) },
    {
      key: 'exp',
      header: 'Expires',
      render: (c) => (c.expiresAt ? <span className={isExpired(c.expiresAt) ? 'danger-text' : ''} title={formatDate(c.expiresAt)}>{isExpired(c.expiresAt) ? 'expired' : relativeTime(c.expiresAt)}</span> : <span className="muted">never</span>),
    },
    { key: 'bound', header: 'Player', render: (c) => c.boundUsername || <span className="muted">anyone</span> },
    { key: 'source', header: 'Source', render: (c) => <span className={`badge ${SOURCE_BADGE[c.source] ?? ''}`}>{c.source}</span> },
    { key: 'active', header: 'Active', render: (c) => <Toggle sm checked={c.active} disabled={isBusy(`toggle:${c.code}`)} onChange={(v) => void toggle(c, v)} /> },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <div className="cell-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(c)} aria-label={`Delete ${c.code}`} disabled={isBusy(`del:${c.code}`)}>
            <Icon name="trash" size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="adm-cols adm-cols-main">
      <div className="adm-stack">
        <div className="adm-toolbar">
          <div className="adm-search">
            <Icon name="search" size={16} />
            <input className="input adm-input" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by code, player, source" aria-label="Filter coupons" />
          </div>
          <span className="muted small">{rows.length} codes</span>
          <button type="button" className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => void list.reload(true)}>
            <Icon name="refresh" size={14} /> Refresh
          </button>
        </div>
        <div className="adm-panel">
          <DataTable columns={cols} rows={rows} rowKey={(c) => c.code} rowClassName={(c) => (!c.active || isExpired(c.expiresAt) ? 'muted-row' : '')} loading={list.loading} error={list.error} onRetry={() => void list.reload()} empty="No coupons yet – create one on the right." emptyIcon="🎟️" minWidth={900} />
        </div>
      </div>

      <Panel title="Create coupon" icon="ticket" sub="Leave the code empty to generate one.">
        <form className="stack" style={{ gap: 12 }} onSubmit={submit}>
          <Field label="Code" optional htmlFor="cp-code">
            <TextInput id="cp-code" className="mono" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SUMMER20" />
          </Field>
          <div className="adm-form-grid cols-2">
            <Field label="Type" htmlFor="cp-type">
              <SelectInput id="cp-type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'percent' | 'fixed' }))}>
                <option value="percent">Percent off</option>
                <option value="fixed">Fixed amount off</option>
              </SelectInput>
            </Field>
            <Field label={form.type === 'percent' ? 'Percent' : 'Amount (USD)'} htmlFor="cp-value">
              <div className="adm-input-affix">
                {form.type === 'fixed' && <span className="affix">$</span>}
                <NumberInput id="cp-value" className={form.type === 'fixed' ? 'has-prefix' : 'has-suffix'} value={form.value} onChange={(v) => setForm((f) => ({ ...f, value: v }))} min={0} step={form.type === 'percent' ? 1 : 0.01} />
                {form.type === 'percent' && <span className="affix right">%</span>}
              </div>
            </Field>
            <Field label="Min order" optional htmlFor="cp-min">
              <MoneyInput id="cp-min" valueCents={form.minOrderCents} onChange={(c) => setForm((f) => ({ ...f, minOrderCents: c }))} placeholder="—" />
            </Field>
            <Field label="Max uses" optional htmlFor="cp-max">
              <NumberInput id="cp-max" value={form.maxUses} onChange={(v) => setForm((f) => ({ ...f, maxUses: v === undefined ? undefined : Math.max(1, Math.round(v)) }))} min={1} step={1} placeholder="∞" />
            </Field>
            <Field label="Valid for (days)" optional htmlFor="cp-days">
              <NumberInput id="cp-days" value={form.validDays} onChange={(v) => setForm((f) => ({ ...f, validDays: v === undefined ? undefined : Math.max(1, Math.round(v)) }))} min={1} step={1} placeholder="forever" />
            </Field>
            <Field label="Bound to player" optional htmlFor="cp-user">
              <TextInput id="cp-user" value={form.boundUsername} onChange={(e) => setForm((f) => ({ ...f, boundUsername: e.target.value }))} placeholder="Minecraft name" />
            </Field>
          </div>
          <Field label="Note" optional htmlFor="cp-note">
            <TextInput id="cp-note" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Why / where it was shared" />
          </Field>
          <button type="submit" className="btn btn-primary" disabled={isBusy('create')}>
            {isBusy('create') ? <span className="spinner" /> : <Icon name="plus" size={15} />} Create coupon
          </button>
          <p className="adm-help">Coupons are capped so total discounts never exceed 60%. A coupon replaces the referral discount on an order.</p>
        </form>
      </Panel>
      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}

/* ───────────────────────── gift codes tab ───────────────────────── */

function GiftsTab() {
  const { toast } = useToast();
  const list = useAdminQuery(listGifts, []);
  const { products } = useAdminProducts();
  const { run, isBusy } = useAction();
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [form, setForm] = useState({ productId: '', qty: 1 as number | undefined, maxUses: 1 as number | undefined, validDays: 30 as number | undefined, code: '', note: '' });
  const productName = useMemo(() => new Map(products.map((p) => [p.id, p.name])), [products]);
  const productId = form.productId || products[0]?.id || '';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!productId || !form.qty || form.qty < 1) {
      toast('Pick a product and quantity.', 'error');
      return;
    }
    const created = await run('create', () =>
      createGift({
        productId,
        qty: Math.round(form.qty!),
        maxUses: form.maxUses,
        validDays: form.validDays,
        code: form.code.trim() || undefined,
        note: form.note.trim() || undefined,
      }),
    );
    if (!created) return;
    toast(`Gift code ${created.code} created`, 'success');
    setForm((f) => ({ ...f, code: '', note: '' }));
    void list.reload(true);
  };

  const remove = (g: GiftCode) =>
    setConfirm({
      title: `Delete ${g.code}?`,
      message: 'The code can no longer be redeemed.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        const r = await run(`del:${g.code}`, () => deleteGift(g.code), `${g.code} deleted`);
        if (r !== undefined) list.setData((d) => (d ? d.filter((x) => x.code !== g.code) : d));
      },
    });

  const cols: Column<GiftCode>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (g) => (
        <span className="row" style={{ gap: 4 }}>
          <span className="adm-id">{g.code}</span>
          <CopyButton text={g.code} iconOnly label="Copy code" className="btn btn-ghost btn-sm" />
        </span>
      ),
    },
    { key: 'item', header: 'Gives', render: (g) => <strong>{`${g.qty}× ${productName.get(g.productId) ?? g.productId}`}</strong> },
    { key: 'uses', header: 'Uses', className: 'num', render: (g) => `${g.uses ?? 0}${g.maxUses !== undefined ? ` / ${g.maxUses}` : ''}` },
    { key: 'exp', header: 'Expires', render: (g) => (g.expiresAt ? <span className={isExpired(g.expiresAt) ? 'danger-text' : ''} title={formatDate(g.expiresAt)}>{isExpired(g.expiresAt) ? 'expired' : relativeTime(g.expiresAt)}</span> : <span className="muted">never</span>) },
    { key: 'note', header: 'Note', className: 'ellipsis', render: (g) => <span className="text-2">{g.note || '—'}</span> },
    {
      key: 'actions',
      header: '',
      render: (g) => (
        <div className="cell-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(g)} aria-label={`Delete ${g.code}`} disabled={isBusy(`del:${g.code}`)}>
            <Icon name="trash" size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="adm-cols adm-cols-main">
      <div className="adm-stack">
        <div className="adm-toolbar">
          <span className="muted small">Customers redeem these at /redeem – a free order is created for them and lands in your queue.</span>
          <button type="button" className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => void list.reload(true)}>
            <Icon name="refresh" size={14} /> Refresh
          </button>
        </div>
        <div className="adm-panel">
          <DataTable columns={cols} rows={list.data} rowKey={(g) => g.code} rowClassName={(g) => (isExpired(g.expiresAt) || (g.maxUses !== undefined && (g.uses ?? 0) >= g.maxUses) ? 'muted-row' : '')} loading={list.loading} error={list.error} onRetry={() => void list.reload()} empty="No gift codes yet." emptyIcon="🎁" minWidth={760} />
        </div>
      </div>

      <Panel title="Create gift code" icon="gift" sub="Perfect for giveaways, streamers and apologies.">
        <form className="stack" style={{ gap: 12 }} onSubmit={submit}>
          <Field label="Product" htmlFor="gf-product">
            <SelectInput id="gf-product" value={productId} onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.hidden ? ' (hidden)' : ''}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div className="adm-form-grid cols-2">
            <Field label="Quantity" hint="For money: number of millions" htmlFor="gf-qty">
              <NumberInput id="gf-qty" value={form.qty} onChange={(v) => setForm((f) => ({ ...f, qty: v }))} min={1} step={1} allowEmpty={false} />
            </Field>
            <Field label="Max uses" optional htmlFor="gf-max">
              <NumberInput id="gf-max" value={form.maxUses} onChange={(v) => setForm((f) => ({ ...f, maxUses: v === undefined ? undefined : Math.max(1, Math.round(v)) }))} min={1} step={1} placeholder="∞" />
            </Field>
            <Field label="Valid for (days)" optional htmlFor="gf-days">
              <NumberInput id="gf-days" value={form.validDays} onChange={(v) => setForm((f) => ({ ...f, validDays: v === undefined ? undefined : Math.max(1, Math.round(v)) }))} min={1} step={1} placeholder="forever" />
            </Field>
            <Field label="Code" optional htmlFor="gf-code">
              <TextInput id="gf-code" className="mono" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="auto" />
            </Field>
          </div>
          <Field label="Note" optional htmlFor="gf-note">
            <TextInput id="gf-note" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="e.g. TikTok giveaway" />
          </Field>
          <button type="submit" className="btn btn-pink" disabled={isBusy('create') || !productId}>
            {isBusy('create') ? <span className="spinner" /> : <Icon name="gift" size={15} />} Create gift code
          </button>
        </form>
      </Panel>
      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}

/* ───────────────────────── page ───────────────────────── */

export default function Coupons() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'gifts' ? 'gifts' : 'coupons';
  const setTab = (t: 'coupons' | 'gifts') => {
    const next = new URLSearchParams(params);
    if (t === 'gifts') next.set('tab', 'gifts');
    else next.delete('tab');
    setParams(next, { replace: true });
  };
  return (
    <div className="adm-page">
      <Seo robots="noindex,nofollow" title="Coupons · Admin · DonutCoins" description="DonutCoins back office" />
      <PageHead title="Coupons & gift codes" sub="Discount codes for checkout and gift codes that give away items." />
      <div className="adm-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'coupons'} className={`adm-tab ${tab === 'coupons' ? 'active' : ''}`} onClick={() => setTab('coupons')}>
          <Icon name="ticket" size={15} /> Coupons
        </button>
        <button type="button" role="tab" aria-selected={tab === 'gifts'} className={`adm-tab ${tab === 'gifts' ? 'active' : ''}`} onClick={() => setTab('gifts')}>
          <Icon name="gift" size={15} /> Gift codes
        </button>
      </div>
      {tab === 'coupons' ? <CouponsTab /> : <GiftsTab />}
    </div>
  );
}
