import { useState } from 'react';
import type { PaymentMethodConfig, PaymentMethodType, SiteSettings } from '../../../shared/types';
import { useStore } from '../../../context/StoreContext';
import { Icon } from '../../ui/Icons';
import { Field, MoneyInput, NumberInput, PercentInput, SelectInput, TextArea, TextInput, Toggle } from '../Field';
import { ConfirmDialog, type ConfirmState } from '../ConfirmDialog';
import { INTEGRATION_ENV, slugify } from '../adminUtils';
import { SectionCard, type SaveFn } from './SectionCard';

const ICONS = ['paypal', 'card', 'bitcoin', 'ethereum', 'litecoin', 'tether', 'bank', 'revolut', 'giftcard', 'generic'];
const TYPES: { id: PaymentMethodType; label: string }[] = [
  { id: 'manual', label: 'Manual – customer sends money, you confirm' },
  { id: 'stripe', label: 'Stripe (automatic)' },
  { id: 'paypal', label: 'PayPal Checkout (automatic)' },
  { id: 'nowpayments', label: 'NOWPayments crypto (automatic)' },
];

function newMethod(existing: PaymentMethodConfig[]): PaymentMethodConfig {
  const base = 'custom';
  let id = base;
  let n = 2;
  while (existing.some((m) => m.id === id)) id = `${base}-${n++}`;
  return {
    id,
    type: 'manual',
    enabled: false,
    name: 'New payment method',
    description: '',
    icon: 'generic',
    handle: '',
    linkTemplate: '',
    instructions: 'Send **{{total}}** to **{{handle}}** and mention order **{{orderId}}**. Paste the reference below.',
    referenceLabel: 'Transaction reference',
    sortOrder: (existing.reduce((m, x) => Math.max(m, x.sortOrder ?? 0), 0) || 0) + 1,
  };
}

function MethodEditor({ m, update, remove, integrations }: { m: PaymentMethodConfig; update: (patch: Partial<PaymentMethodConfig>) => void; remove: () => void; integrations: Record<string, boolean> }) {
  const [open, setOpen] = useState(false);
  const needsEnv = m.type !== 'manual' ? INTEGRATION_ENV[m.type] : null;
  const configured = m.type === 'manual' || !!integrations[m.type];
  const iconSrc = `/img/payments/${ICONS.includes(m.icon ?? '') ? m.icon : 'generic'}.svg`;
  return (
    <div className={`adm-method ${m.enabled ? '' : 'disabled'}`}>
      <div className="adm-method-head" onClick={() => setOpen((o) => !o)} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpen((o) => !o))} aria-expanded={open}>
        <img src={iconSrc} alt="" width={34} height={34} onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/img/payments/generic.svg')} />
        <div className="t">
          <strong>
            {m.name || m.id} <span className="badge" style={{ marginLeft: 6 }}>{m.type}</span>
            {!configured && (
              <span className="badge badge-red" style={{ marginLeft: 6 }}>
                needs env vars
              </span>
            )}
          </strong>
          <span>{m.type === 'manual' ? m.handle || 'no handle set' : needsEnv ? `requires ${needsEnv.vars.join(', ')}` : ''}</span>
        </div>
        <span onClick={(e) => e.stopPropagation()}>
          <Toggle sm checked={m.enabled} onChange={(v) => update({ enabled: v })} label={m.enabled ? 'On' : 'Off'} />
        </span>
        <Icon name="chevron" size={16} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }} />
      </div>
      {open && (
        <div className="adm-method-body">
          {needsEnv && (
            <div className={`alert ${configured ? 'alert-success' : 'alert-warn'}`}>
              <Icon name={configured ? 'check' : 'warning'} size={16} />
              <span>
                {configured ? 'Integration configured.' : 'Not configured yet.'} {needsEnv.label} needs these Netlify environment variables: {needsEnv.vars.map((v) => (
                  <code className="adm-code" key={v} style={{ marginRight: 4 }}>
                    {v}
                  </code>
                ))}
                {!configured && ' – the method stays hidden at checkout until they are set.'}
              </span>
            </div>
          )}
          <div className="adm-form-grid cols-3">
            <Field label="Name" htmlFor={`pm-${m.id}-name`}>
              <TextInput id={`pm-${m.id}-name`} value={m.name} onChange={(e) => update({ name: e.target.value })} />
            </Field>
            <Field label="Type" htmlFor={`pm-${m.id}-type`}>
              <SelectInput id={`pm-${m.id}-type`} value={m.type} onChange={(e) => update({ type: e.target.value as PaymentMethodType })}>
                {TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Icon" htmlFor={`pm-${m.id}-icon`}>
              <SelectInput id={`pm-${m.id}-icon`} value={m.icon ?? 'generic'} onChange={(e) => update({ icon: e.target.value })}>
                {ICONS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Description" optional className="span-2" htmlFor={`pm-${m.id}-desc`}>
              <TextInput id={`pm-${m.id}-desc`} value={m.description ?? ''} onChange={(e) => update({ description: e.target.value })} placeholder="Shown under the name at checkout" />
            </Field>
            <Field label="Sort order" htmlFor={`pm-${m.id}-sort`}>
              <NumberInput id={`pm-${m.id}-sort`} value={m.sortOrder} onChange={(v) => update({ sortOrder: v })} min={0} step={1} />
            </Field>
            {m.type === 'manual' && (
              <>
                <Field label="Handle / address" hint="PayPal.me name, wallet address, IBAN, e-mail… → {{handle}}" className="span-2" htmlFor={`pm-${m.id}-handle`}>
                  <TextInput id={`pm-${m.id}-handle`} className="mono" value={m.handle ?? ''} onChange={(e) => update({ handle: e.target.value })} />
                </Field>
                <Field label="Reference label" hint="What you ask the customer to paste back" htmlFor={`pm-${m.id}-ref`}>
                  <TextInput id={`pm-${m.id}-ref`} value={m.referenceLabel ?? ''} onChange={(e) => update({ referenceLabel: e.target.value })} placeholder="Transaction ID" />
                </Field>
                <Field label="Pay link template" optional hint="Placeholders: {{handle}} {{total}} {{orderId}}" className="span-2" htmlFor={`pm-${m.id}-link`}>
                  <TextInput id={`pm-${m.id}-link`} className="mono" value={m.linkTemplate ?? ''} onChange={(e) => update({ linkTemplate: e.target.value })} placeholder="https://paypal.me/{{handle}}/{{total}}USD" />
                </Field>
                <Field label="Instructions" hint={<>Shown after the order is placed. Placeholders: <code>{'{{orderId}}'}</code> <code>{'{{total}}'}</code> <code>{'{{username}}'}</code> <code>{'{{handle}}'}</code> · **bold** is supported.</>} className="span-2" htmlFor={`pm-${m.id}-instr`}>
                  <TextArea id={`pm-${m.id}-instr`} rows={4} value={m.instructions ?? ''} onChange={(e) => update({ instructions: e.target.value })} />
                </Field>
              </>
            )}
            <Field label="Fee" optional hint="Added to the total (e.g. 10% for gift cards)" htmlFor={`pm-${m.id}-fee`}>
              <PercentInput id={`pm-${m.id}-fee`} value={m.feePercent} onChange={(v) => update({ feePercent: v })} />
            </Field>
            <Field label="Minimum order" optional htmlFor={`pm-${m.id}-min`}>
              <MoneyInput id={`pm-${m.id}-min`} valueCents={m.minCents ?? null} onChange={(c) => update({ minCents: c ?? undefined })} placeholder="—" />
            </Field>
          </div>
          <div className="row between wrap">
            <span className="muted xs mono">id: {m.id}</span>
            <button type="button" className="btn btn-danger btn-sm" onClick={remove}>
              <Icon name="trash" size={14} /> Remove method
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PaymentMethodsSection({ settings, onSave }: { settings: SiteSettings; onSave: SaveFn }) {
  const { config } = useStore();
  const integrations: Record<string, boolean> = { ...config.integrations };
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  return (
    <SectionCard<PaymentMethodConfig[]>
      id="payments"
      title="Payment methods"
      icon="card"
      sub="Manual methods need no verification – you confirm payments yourself. Automatic ones need API keys as environment variables."
      value={settings.paymentMethods}
      toPatch={(d) => ({
        paymentMethods: d.map((m) => ({
          ...m,
          id: m.id || slugify(m.name) || 'method',
          name: m.name.trim() || m.id,
          handle: m.handle?.trim(),
          linkTemplate: m.linkTemplate?.trim() || undefined,
          description: m.description?.trim() || undefined,
          feePercent: m.feePercent && m.feePercent > 0 ? m.feePercent : undefined,
          minCents: m.minCents && m.minCents > 0 ? m.minCents : undefined,
        })),
      })}
      validate={(d) => {
        if (!d.some((m) => m.enabled)) return 'Enable at least one payment method.';
        const bad = d.find((m) => m.type === 'manual' && m.enabled && !m.instructions?.trim());
        return bad ? `"${bad.name}" needs instructions.` : null;
      }}
      onSave={onSave}
    >
      {(d, set) => (
        <div className="stack" style={{ gap: 10 }}>
          {[...d]
            .map((m, i) => ({ m, i }))
            .sort((a, b) => (a.m.sortOrder ?? 99) - (b.m.sortOrder ?? 99))
            .map(({ m, i }) => (
              <MethodEditor
                key={m.id}
                m={m}
                integrations={integrations}
                update={(patch) => set(d.map((x, j) => (j === i ? { ...x, ...patch } : x)))}
                remove={() =>
                  setConfirm({
                    title: `Remove "${m.name}"?`,
                    message: 'Existing orders keep their payment info. You need to save the section afterwards.',
                    confirmLabel: 'Remove',
                    danger: true,
                    onConfirm: () => set(d.filter((_, j) => j !== i)),
                  })
                }
              />
            ))}
          <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => set([...d, newMethod(d)])}>
            <Icon name="plus" size={14} /> Add payment method
          </button>
          <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
        </div>
      )}
    </SectionCard>
  );
}
