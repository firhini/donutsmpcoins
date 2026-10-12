/** Simple text/toggle sections: store identity, announcement bar, sale, delivery texts, stats + maintenance. */
import type { SiteSettings } from '../../../shared/types';
import { Field, NumberInput, PercentInput, TextArea, TextInput, Toggle } from '../Field';
import { SectionCard, type SaveFn } from './SectionCard';
import { isoToLocalInput, localInputToIso } from '../adminUtils';

type StoreSlice = Pick<SiteSettings, 'storeName' | 'tagline' | 'discordInvite' | 'supportEmail' | 'serverName' | 'serverIp'>;

export function StoreSection({ settings, onSave }: { settings: SiteSettings; onSave: SaveFn }) {
  const value: StoreSlice = {
    storeName: settings.storeName,
    tagline: settings.tagline,
    discordInvite: settings.discordInvite,
    supportEmail: settings.supportEmail ?? '',
    serverName: settings.serverName,
    serverIp: settings.serverIp,
  };
  return (
    <SectionCard<StoreSlice>
      id="store"
      title="Store"
      icon="home"
      sub="Name, tagline and where customers reach you."
      value={value}
      toPatch={(d) => ({ ...d, storeName: d.storeName.trim() || 'DonutCoins', supportEmail: d.supportEmail?.trim() ?? '' })}
      validate={(d) => (!d.storeName.trim() ? 'Store name is required.' : !/^https?:\/\//.test(d.discordInvite.trim()) ? 'Discord invite must be a full https:// link.' : null)}
      onSave={onSave}
    >
      {(d, set) => (
        <div className="adm-form-grid cols-2">
          <Field label="Store name" htmlFor="st-name">
            <TextInput id="st-name" value={d.storeName} onChange={(e) => set({ ...d, storeName: e.target.value })} />
          </Field>
          <Field label="Tagline" htmlFor="st-tag">
            <TextInput id="st-tag" value={d.tagline} onChange={(e) => set({ ...d, tagline: e.target.value })} />
          </Field>
          <Field label="Discord invite" hint="Shown in the header, footer and on every order page." htmlFor="st-discord">
            <TextInput id="st-discord" value={d.discordInvite} onChange={(e) => set({ ...d, discordInvite: e.target.value })} placeholder="https://discord.gg/…" />
          </Field>
          <Field label="Support e-mail" optional htmlFor="st-mail">
            <TextInput id="st-mail" type="email" value={d.supportEmail ?? ''} onChange={(e) => set({ ...d, supportEmail: e.target.value })} placeholder="help@yourstore.com" />
          </Field>
          <Field label="Server name" htmlFor="st-server">
            <TextInput id="st-server" value={d.serverName} onChange={(e) => set({ ...d, serverName: e.target.value })} />
          </Field>
          <Field label="Server IP" htmlFor="st-ip">
            <TextInput id="st-ip" className="mono" value={d.serverIp} onChange={(e) => set({ ...d, serverIp: e.target.value })} />
          </Field>
        </div>
      )}
    </SectionCard>
  );
}

export function LegalSection({ settings, onSave }: { settings: SiteSettings; onSave: SaveFn }) {
  const value: SiteSettings['legal'] = { ...settings.legal };
  return (
    <SectionCard<SiteSettings['legal']>
      id="legal"
      title="Legal notice & prices"
      icon="info"
      sub={
        <>
          Shown on <code className="kbd">/imprint</code>, in the footer and at checkout. A store run from Germany/the EU must publish an Impressum with name, address and e-mail
          (§ 5 DDG) – the page stays empty until you fill this in.
        </>
      }
      value={value}
      toPatch={(d) => ({ legal: Object.fromEntries(Object.entries(d).map(([k, v]) => [k, (v ?? '').toString().trim()])) as SiteSettings['legal'] })}
      validate={(d) => (d.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim()) ? 'The legal contact e-mail does not look valid.' : null)}
      onSave={onSave}
    >
      {(d, set) => (
        <div className="adm-form-grid cols-2">
          <Field label="Operator / business name" hint="Your full name, or the business name plus the responsible person." htmlFor="lg-name">
            <TextInput id="lg-name" value={d.operatorName} onChange={(e) => set({ ...d, operatorName: e.target.value })} placeholder="Max Mustermann" />
          </Field>
          <Field label="Contact e-mail" hint="Required in the legal notice. Can be the same as the support e-mail." htmlFor="lg-mail">
            <TextInput id="lg-mail" type="email" value={d.email} onChange={(e) => set({ ...d, email: e.target.value })} placeholder="legal@yourstore.com" />
          </Field>
          <Field label="Postal address" hint="Street, postcode, city, country – one per line." htmlFor="lg-addr">
            <TextArea id="lg-addr" rows={3} value={d.address} onChange={(e) => set({ ...d, address: e.target.value })} placeholder={'Musterstraße 1\n12345 Musterstadt\nGermany'} />
          </Field>
          <Field label="Phone / other contact" optional htmlFor="lg-phone">
            <TextInput id="lg-phone" value={d.phone} onChange={(e) => set({ ...d, phone: e.target.value })} placeholder="+49 …" />
          </Field>
          <Field label="VAT id / tax note" optional hint="E.g. “VAT not charged – small business under § 19 UStG” or your VAT id." htmlFor="lg-vat">
            <TextInput id="lg-vat" value={d.vatId} onChange={(e) => set({ ...d, vatId: e.target.value })} placeholder="DE123456789 or § 19 UStG note" />
          </Field>
          <Field label="Price note" hint="Shown under the order total and in the footer. Consumers must see final prices." htmlFor="lg-price">
            <TextInput id="lg-price" value={d.priceNote} onChange={(e) => set({ ...d, priceNote: e.target.value })} />
          </Field>
          <Field label="Additional legal text" optional hint="Anything else your legal notice must contain (register number, supervisory authority, responsible for content …)." htmlFor="lg-extra" className="span-2">
            <TextArea id="lg-extra" rows={3} value={d.extra} onChange={(e) => set({ ...d, extra: e.target.value })} />
          </Field>
        </div>
      )}
    </SectionCard>
  );
}

export function AnnouncementSection({ settings, onSave }: { settings: SiteSettings; onSave: SaveFn }) {
  const value = { ...settings.announcement, link: settings.announcement.link ?? '' };
  return (
    <SectionCard<SiteSettings['announcement']>
      id="announcement"
      title="Announcement bar"
      icon="sparkles"
      sub="The gradient bar above the header."
      value={value}
      toPatch={(d) => ({ announcement: { enabled: d.enabled, text: d.text.trim(), link: d.link?.trim() ?? '' } })}
      validate={(d) => (d.enabled && !d.text.trim() ? 'Enter a text or disable the bar.' : null)}
      onSave={onSave}
    >
      {(d, set) => (
        <div className="stack" style={{ gap: 14 }}>
          <Toggle checked={d.enabled} onChange={(v) => set({ ...d, enabled: v })} label="Show announcement bar" />
          <div className="adm-form-grid cols-2">
            <Field label="Text" htmlFor="an-text">
              <TextInput id="an-text" value={d.text} onChange={(e) => set({ ...d, text: e.target.value })} placeholder="🎡 Spin the wheel every day!" />
            </Field>
            <Field label="Link" optional hint="Internal path (/spin) or full URL." htmlFor="an-link">
              <TextInput id="an-link" value={d.link ?? ''} onChange={(e) => set({ ...d, link: e.target.value })} placeholder="/spin" />
            </Field>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

interface SaleDraft {
  enabled: boolean;
  percent: number | undefined;
  label: string;
  endsAtLocal: string;
}

export function SaleSection({ settings, onSave }: { settings: SiteSettings; onSave: SaveFn }) {
  const value: SaleDraft = { enabled: settings.sale.enabled, percent: settings.sale.percent, label: settings.sale.label, endsAtLocal: isoToLocalInput(settings.sale.endsAt) };
  return (
    <SectionCard<SaleDraft>
      id="sale"
      title="Site-wide sale"
      icon="percent"
      sub="Applies to every product before coupons. Discounts are capped at 60% in total."
      value={value}
      toPatch={(d) => ({ sale: { enabled: d.enabled, percent: Math.max(0, Math.min(90, Math.round(d.percent ?? 0))), label: d.label.trim() || 'Sale', endsAt: localInputToIso(d.endsAtLocal) ?? '' } })}
      validate={(d) => (d.enabled && !(d.percent && d.percent > 0) ? 'Set a percentage above 0 or disable the sale.' : null)}
      onSave={onSave}
    >
      {(d, set) => (
        <div className="stack" style={{ gap: 14 }}>
          <Toggle checked={d.enabled} onChange={(v) => set({ ...d, enabled: v })} label="Sale is running" />
          <div className="adm-form-grid cols-3">
            <Field label="Discount" htmlFor="sa-pct">
              <PercentInput id="sa-pct" value={d.percent} onChange={(v) => set({ ...d, percent: v })} />
            </Field>
            <Field label="Label" htmlFor="sa-label">
              <TextInput id="sa-label" value={d.label} onChange={(e) => set({ ...d, label: e.target.value })} placeholder="Weekend Sale" />
            </Field>
            <Field label="Ends at" optional hint="Shown as a countdown. Leave empty for no end." htmlFor="sa-end">
              <TextInput id="sa-end" type="datetime-local" value={d.endsAtLocal} onChange={(e) => set({ ...d, endsAtLocal: e.target.value })} />
            </Field>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

export function DeliverySection({ settings, onSave }: { settings: SiteSettings; onSave: SaveFn }) {
  const value = { ...settings.delivery, staffUsername: settings.delivery.staffUsername ?? '' };
  return (
    <SectionCard<SiteSettings['delivery']>
      id="delivery"
      title="Delivery texts"
      icon="truck"
      sub="What customers read on the order page while they wait."
      value={value}
      toPatch={(d) => ({ delivery: { moneyText: d.moneyText.trim(), itemText: d.itemText.trim(), staffUsername: d.staffUsername?.trim() ?? '', etaText: d.etaText.trim() } })}
      onSave={onSave}
    >
      {(d, set) => (
        <div className="adm-form-grid cols-2">
          <Field label="Money delivery" className="span-2" htmlFor="dl-money">
            <TextArea id="dl-money" rows={2} value={d.moneyText} onChange={(e) => set({ ...d, moneyText: e.target.value })} />
          </Field>
          <Field label="Item delivery" className="span-2" htmlFor="dl-item">
            <TextArea id="dl-item" rows={2} value={d.itemText} onChange={(e) => set({ ...d, itemText: e.target.value })} />
          </Field>
          <Field label="Delivery account" optional hint="Your in-game name – customers accept teleports from it." htmlFor="dl-staff">
            <TextInput id="dl-staff" value={d.staffUsername ?? ''} onChange={(e) => set({ ...d, staffUsername: e.target.value })} placeholder="Minecraft username" />
          </Field>
          <Field label="ETA text" htmlFor="dl-eta">
            <TextInput id="dl-eta" value={d.etaText} onChange={(e) => set({ ...d, etaText: e.target.value })} />
          </Field>
        </div>
      )}
    </SectionCard>
  );
}

interface OpsDraft {
  ordersOffset: number | undefined;
  maintenanceEnabled: boolean;
  maintenanceMessage: string;
}

export function MaintenanceSection({ settings, onSave }: { settings: SiteSettings; onSave: SaveFn }) {
  const value: OpsDraft = { ordersOffset: settings.stats.ordersOffset, maintenanceEnabled: settings.maintenance.enabled, maintenanceMessage: settings.maintenance.message };
  return (
    <SectionCard<OpsDraft>
      id="maintenance"
      title="Stats & maintenance"
      icon="server"
      sub="Counter offset for orders from before this site, and the emergency switch."
      value={value}
      toPatch={(d) => ({ stats: { ordersOffset: Math.max(0, Math.round(d.ordersOffset ?? 0)) }, maintenance: { enabled: d.maintenanceEnabled, message: d.maintenanceMessage.trim() || 'We are restocking – back in a few minutes!' } })}
      onSave={onSave}
    >
      {(d, set) => (
        <div className="stack" style={{ gap: 14 }}>
          <div className="adm-form-grid cols-2">
            <Field label="Delivered-orders offset" hint="Added to the live 'orders delivered' counter. Use it for orders you fulfilled before launching this site – not for made-up numbers." htmlFor="op-offset">
              <NumberInput id="op-offset" value={d.ordersOffset} onChange={(v) => set({ ...d, ordersOffset: v })} min={0} step={1} />
            </Field>
          </div>
          <div className={`alert ${d.maintenanceEnabled ? 'alert-warn' : ''}`} style={{ flexDirection: 'column', gap: 12 }}>
            <Toggle checked={d.maintenanceEnabled} onChange={(v) => set({ ...d, maintenanceEnabled: v })} label="Maintenance mode – block new orders" />
            <Field label="Message" htmlFor="op-msg">
              <TextInput id="op-msg" value={d.maintenanceMessage} onChange={(e) => set({ ...d, maintenanceMessage: e.target.value })} />
            </Field>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
