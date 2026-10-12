import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { SiteSettings } from '../../shared/types';
import { defaultSettings } from '../../data/settings';
import { Seo } from '../../components/ui/Seo';
import { Icon } from '../../components/ui/Icons';
import { useToast } from '../../context/ToastContext';
import { getAdminSettings, saveAdminSettings, errorMessage } from '../../lib/adminApi';
import { useAdminQuery } from '../../components/admin/hooks';
import { ErrorBlock, PageHead } from '../../components/admin/Bits';
import { AnnouncementSection, DeliverySection, LegalSection, MaintenanceSection, SaleSection, StoreSection } from '../../components/admin/SettingsSections/StoreSections';
import { CurrenciesSection, RewardsSection, TiersSection } from '../../components/admin/SettingsSections/TiersCurrenciesRewards';
import { PaymentMethodsSection } from '../../components/admin/SettingsSections/PaymentMethodsSection';
import { SpinSection } from '../../components/admin/SettingsSections/SpinSection';

const JUMP: { id: string; label: string }[] = [
  { id: 'store', label: 'Store' },
  { id: 'legal', label: 'Legal' },
  { id: 'announcement', label: 'Announcement' },
  { id: 'sale', label: 'Sale' },
  { id: 'tiers', label: 'Tiers' },
  { id: 'payments', label: 'Payments' },
  { id: 'spin', label: 'Spin' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'currencies', label: 'Currencies' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'maintenance', label: 'Maintenance' },
];

export default function Settings() {
  const { toast } = useToast();
  const q = useAdminQuery<SiteSettings>(getAdminSettings, []);
  const { hash } = useLocation();

  // jump to #payments etc. once the sections are rendered
  const ready = !q.loading || !!q.data;
  useEffect(() => {
    if (!hash || !ready) return;
    const el = document.getElementById(hash.slice(1));
    if (el) window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }, [hash, ready]);

  const save = async (patch: Partial<SiteSettings>): Promise<boolean> => {
    try {
      const next = await saveAdminSettings(patch);
      q.setData(next && typeof next === 'object' && 'storeName' in next ? next : (prev) => (prev ? { ...prev, ...patch } : prev));
      toast('Settings saved', 'success');
      return true;
    } catch (err) {
      toast(errorMessage(err), 'error');
      return false;
    }
  };

  const settings = q.data ?? defaultSettings;

  return (
    <div className="adm-page">
      <Seo robots="noindex,nofollow" title="Settings · Admin · DonutCoins" description="DonutCoins back office" />
      <PageHead title="Settings" sub="Everything here is stored in Netlify Blobs and applied instantly to the store." />

      <div className="alert alert-info adm-settings-intro">
        <Icon name="lock" size={16} style={{ flex: '0 0 auto', marginTop: 2 }} />
        <span>
          <strong>Secrets are not stored here.</strong> Stripe / PayPal / NOWPayments keys, the Discord webhook and the admin password are set as environment variables in Netlify (Site configuration → Environment variables) – see the README. Settings below are safe, non-secret configuration.
        </span>
      </div>

      {q.error && <ErrorBlock message={q.data ? q.error : `${q.error} Showing default values – saving will retry the API.`} onRetry={() => void q.reload()} />}

      <nav className="adm-settings-nav" aria-label="Sections">
        {JUMP.map((j) => (
          <a key={j.id} href={`#${j.id}`} className="adm-chip">
            {j.label}
          </a>
        ))}
      </nav>

      {q.loading && !q.data ? (
        <div className="adm-loading">
          <span className="spinner" /> Loading settings…
        </div>
      ) : (
        <div className="adm-stack" key={q.data ? 'live' : 'defaults'}>
          <StoreSection settings={settings} onSave={save} />
          <LegalSection settings={settings} onSave={save} />
          <AnnouncementSection settings={settings} onSave={save} />
          <SaleSection settings={settings} onSave={save} />
          <TiersSection settings={settings} onSave={save} />
          <PaymentMethodsSection settings={settings} onSave={save} />
          <SpinSection settings={settings} onSave={save} />
          <RewardsSection settings={settings} onSave={save} />
          <CurrenciesSection settings={settings} onSave={save} />
          <DeliverySection settings={settings} onSave={save} />
          <MaintenanceSection settings={settings} onSave={save} />
        </div>
      )}
    </div>
  );
}
