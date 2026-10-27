import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Catalog, Category, CurrencyConfig, Product, PublicConfig, SiteStats } from '../shared/types';
import { apiGet } from '../lib/api';
import { formatMoney } from '../shared/pricing';
import { defaultCatalog } from '../data/catalog';
import { defaultSettings } from '../data/settings';
import { storageGet, storageSet } from '../lib/device';

interface StoreApi {
  config: PublicConfig;
  catalog: Catalog;
  products: Product[];
  categories: Category[];
  stats: SiteStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  productById: (id: string) => Product | undefined;
  productBySlug: (slug: string) => Product | undefined;
  /** currency */
  currency: CurrencyConfig;
  setCurrency: (code: string) => void;
  /** format USD cents in the selected display currency */
  fmt: (cents: number) => string;
}

const fallbackConfig: PublicConfig = {
  storeName: defaultSettings.storeName,
  tagline: defaultSettings.tagline,
  discordInvite: defaultSettings.discordInvite,
  legal: defaultSettings.legal,
  announcement: defaultSettings.announcement,
  sale: defaultSettings.sale,
  spendingTiers: defaultSettings.spendingTiers,
  paymentMethods: [],
  spinEnabled: defaultSettings.spin.enabled,
  spinRequireUsername: defaultSettings.spin.requireUsername,
  spinCooldownHours: defaultSettings.spin.cooldownHours,
  spinRequireLogin: false,
  spinRequireGuild: false,
  referral: defaultSettings.referral,
  reviewRewardPercent: defaultSettings.reviewRewardPercent,
  welcomeCoupon: defaultSettings.welcomeCoupon,
  currencies: defaultSettings.currencies,
  delivery: defaultSettings.delivery,
  maintenance: defaultSettings.maintenance,
  serverName: defaultSettings.serverName,
  serverIp: defaultSettings.serverIp,
  integrations: { stripe: false, paypal: false, nowpayments: false, discord: false, discordOAuth: false, googleOAuth: false, login: false },
};

const Ctx = createContext<StoreApi | null>(null);

/** Live config + catalog captured at build time (scripts/prerender.mjs) so the static HTML shows the admin's real settings and prices. */
export interface InitialState {
  config?: PublicConfig;
  catalog?: Catalog;
}
declare global {
  interface Window {
    __DC_STATE__?: InitialState;
  }
}

function bootState(initial?: InitialState): InitialState {
  if (initial) return initial;
  return (typeof window !== 'undefined' && window.__DC_STATE__) || {};
}

export function StoreProvider({ children, initial }: { children: ReactNode; initial?: InitialState }) {
  const boot = bootState(initial);
  const [config, setConfig] = useState<PublicConfig>(() => (boot.config?.storeName ? { ...fallbackConfig, ...boot.config } : fallbackConfig));
  const [catalog, setCatalog] = useState<Catalog>(() =>
    boot.catalog?.products?.length ? { ...boot.catalog, products: boot.catalog.products.filter((p) => !p.hidden) } : { ...defaultCatalog, products: defaultCatalog.products.filter((p) => !p.hidden) },
  );
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currencyCode, setCurrencyCode] = useState<string>('USD');
  useEffect(() => {
    const saved = storageGet<string>('dc_currency', 'USD');
    if (saved && saved !== 'USD') setCurrencyCode(saved);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, cat, st] = await Promise.all([
        apiGet<PublicConfig>('/config'),
        apiGet<Catalog>('/catalog'),
        apiGet<SiteStats>('/stats').catch(() => null),
      ]);
      setConfig(cfg);
      setCatalog(cat);
      setStats(st);
      setError(null);
    } catch (err) {
      // keep bundled defaults so the storefront still renders
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const currency = useMemo(
    () => config.currencies.find((c) => c.code === currencyCode) ?? config.currencies[0] ?? { code: 'USD', symbol: '$', rate: 1 },
    [config.currencies, currencyCode],
  );
  const setCurrency = useCallback((code: string) => {
    setCurrencyCode(code);
    storageSet('dc_currency', code);
  }, []);
  const fmt = useCallback((cents: number) => formatMoney(cents, currency), [currency]);

  const value = useMemo<StoreApi>(
    () => ({
      config,
      catalog,
      products: catalog.products,
      categories: [...catalog.categories].sort((a, b) => a.order - b.order),
      stats,
      loading,
      error,
      refresh,
      productById: (id) => catalog.products.find((p) => p.id === id),
      productBySlug: (slug) => catalog.products.find((p) => p.slug === slug),
      currency,
      setCurrency,
      fmt,
    }),
    [config, catalog, stats, loading, error, refresh, currency, setCurrency, fmt],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}
