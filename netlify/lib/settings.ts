import type { PublicConfig, SiteSettings, PaymentMethodConfig } from '../../src/shared/types';
import { defaultSettings } from '../../src/data/settings';
import { kvGet, kvSet } from './store';

const KEY = 'site';

function deepMerge<T>(base: T, patch: Partial<T> | null | undefined): T {
  if (!patch) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch)) {
    const cur = out[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && cur && typeof cur === 'object' && !Array.isArray(cur)) {
      out[k] = deepMerge(cur, v as Record<string, unknown>);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}

/** Merged settings: defaults ⟵ admin overrides stored in Blobs. */
export async function getSettings(): Promise<SiteSettings> {
  const stored = await kvGet<Partial<SiteSettings>>('settings', KEY);
  return normalize(deepMerge(defaultSettings, stored));
}

/** Empty strings sent by the admin UI to clear optional dates become undefined. */
function normalize(s: SiteSettings): SiteSettings {
  if (s.sale && (s.sale.endsAt as unknown) === '') s.sale = { ...s.sale, endsAt: undefined };
  return s;
}

export async function saveSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  const stored = (await kvGet<Partial<SiteSettings>>('settings', KEY)) ?? {};
  const next = deepMerge(stored as SiteSettings, patch);
  await kvSet('settings', KEY, next);
  return normalize(deepMerge(defaultSettings, next));
}

export function integrations() {
  return {
    stripe: !!process.env.STRIPE_SECRET_KEY,
    paypal: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
    nowpayments: !!process.env.NOWPAYMENTS_API_KEY,
    discord: !!process.env.DISCORD_WEBHOOK_URL,
    discordOAuth: !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET),
  };
}

/** A payment method is usable when enabled AND (manual OR its integration is configured). */
export function usablePaymentMethods(settings: SiteSettings): PaymentMethodConfig[] {
  const integ = integrations();
  return settings.paymentMethods
    .filter((m) => m.enabled)
    .filter((m) => m.type === 'manual' || (m.type === 'stripe' && integ.stripe) || (m.type === 'paypal' && integ.paypal) || (m.type === 'nowpayments' && integ.nowpayments))
    .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
}

export function toPublicConfig(settings: SiteSettings): PublicConfig {
  return {
    storeName: settings.storeName,
    tagline: settings.tagline,
    discordInvite: settings.discordInvite,
    supportEmail: settings.supportEmail,
    announcement: settings.announcement,
    sale: settings.sale,
    spendingTiers: settings.spendingTiers,
    paymentMethods: usablePaymentMethods(settings).map((m) => ({
      id: m.id,
      type: m.type,
      name: m.name,
      description: m.description,
      icon: m.icon,
      feePercent: m.feePercent,
      minCents: m.minCents,
      sortOrder: m.sortOrder,
      referenceLabel: m.referenceLabel,
    })),
    spinEnabled: settings.spin.enabled,
    spinRequireUsername: settings.spin.requireUsername,
    spinCooldownHours: settings.spin.cooldownHours,
    spinRequireLogin: settings.spin.requireLogin && integrations().discordOAuth,
    spinRequireGuild: settings.spin.requireGuild && integrations().discordOAuth && !!process.env.DISCORD_GUILD_ID,
    referral: settings.referral,
    reviewRewardPercent: settings.reviewRewardPercent,
    welcomeCoupon: settings.welcomeCoupon,
    currencies: settings.currencies,
    delivery: settings.delivery,
    maintenance: settings.maintenance,
    serverName: settings.serverName,
    serverIp: settings.serverIp,
    integrations: integrations(),
    paypalClientId: process.env.PAYPAL_CLIENT_ID || undefined,
  };
}

/** Render manual payment instructions with placeholders. */
export function renderTemplate(tpl: string | undefined, vars: Record<string, string>): string | undefined {
  if (!tpl) return undefined;
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => vars[k] ?? '');
}
