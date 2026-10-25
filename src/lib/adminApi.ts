/**
 * Typed wrappers around the /api/admin/* routes (contract: docs/ARCHITECTURE.md → "Admin").
 * Every call sends the bearer token from lib/api.ts. A 401 clears the token and
 * broadcasts ADMIN_UNAUTHORIZED_EVENT so the admin shell can fall back to the login screen.
 */
import { api, ApiClientError, getAdminToken, setAdminToken } from './api';
import type {
  Catalog,
  Category,
  Coupon,
  CouponSource,
  CreditAccount,
  Giveaway,
  GiveawayEntry,
  Order,
  OrderIndexEntry,
  OrderStatus,
  PaymentStatus,
  Product,
  Review,
  SiteSettings,
} from '../shared/types';

export const ADMIN_UNAUTHORIZED_EVENT = 'dc-admin-unauthorized';

// ───────────────────────── response shapes ─────────────────────────

export interface AdminIntegrations {
  stripe: boolean;
  paypal: boolean;
  nowpayments: boolean;
  discord: boolean;
}

export interface AdminDashboard {
  counts: { awaiting: number; paid: number; delivering: number; delivered: number };
  revenueCents: number;
  today: { orders: number; revenueCents: number };
  recent: OrderIndexEntry[];
  pendingReviews: number;
  activeGiveaways: number;
  integrations: AdminIntegrations;
}

export interface AdminOrdersPage {
  orders: OrderIndexEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OrderListQuery {
  status?: OrderStatus | '';
  q?: string;
  page?: number;
}

export interface OrderPatch {
  status?: OrderStatus;
  adminNote?: string;
  paymentStatus?: PaymentStatus;
}

export interface CatalogOverridesInfo {
  overrides: Record<string, Partial<Product>>;
  custom: Product[];
  deleted: string[];
}

export interface AdminCatalog {
  products: Product[];
  categories: Category[];
  overrides: CatalogOverridesInfo;
}

/** Partial product patch (merged over the default product on the server). `stock: null` = unlimited, `compareAtCents: 0` = no strike price. */
export type ProductPatch = Partial<Product>;

export type CreateProductInput = Omit<Product, 'id'> & { id?: string };

/** Mirrors netlify/lib/coupons.ts CreateCouponInput (frontend copy – do not import netlify code in the SPA). */
export interface CreateCouponInput {
  type: 'percent' | 'fixed';
  value: number;
  source: CouponSource;
  prefix?: string;
  code?: string;
  minOrderCents?: number;
  maxUses?: number;
  validDays?: number;
  boundUsername?: string;
  note?: string;
}

import type { GiftCode } from '../shared/types';
export type { GiftCode };

export interface CreateGiftInput {
  productId: string;
  qty: number;
  maxUses?: number;
  validDays?: number;
  code?: string;
  note?: string;
}

export interface CreateGiveawayInput {
  title: string;
  description?: string;
  prize: string;
  endsAt: string;
  maxWinners: number;
  image?: string;
}

export interface GiveawayPatch {
  status?: Giveaway['status'];
  title?: string;
  description?: string;
  prize?: string;
  endsAt?: string;
  maxWinners?: number;
  image?: string;
}

export interface CreditAdjustInput {
  username: string;
  deltaCents: number;
  reason: string;
}

// ───────────────────────── plumbing ─────────────────────────

function broadcastUnauthorized(): void {
  setAdminToken(null);
  try {
    window.dispatchEvent(new CustomEvent(ADMIN_UNAUTHORIZED_EVENT));
  } catch {
    /* ignore (SSR / tests) */
  }
}

async function adminCall<T>(path: string, opts: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown } = {}): Promise<T> {
  try {
    return await api<T>(path, { ...opts, admin: true });
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 401) broadcastUnauthorized();
    throw err;
  }
}

const get = <T,>(path: string) => adminCall<T>(path);
const post = <T,>(path: string, body: unknown) => adminCall<T>(path, { method: 'POST', body });
const put = <T,>(path: string, body: unknown) => adminCall<T>(path, { method: 'PUT', body });
const patch = <T,>(path: string, body: unknown) => adminCall<T>(path, { method: 'PATCH', body });
const del = <T,>(path: string) => adminCall<T>(path, { method: 'DELETE' });

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Accept `{ key: value }` as well as a bare value (keeps the UI tolerant to small backend differences). */
function unwrap<T>(res: unknown, key: string): T {
  if (isObj(res) && key in res) return res[key] as T;
  return res as T;
}

function unwrapList<T>(res: unknown, key: string): T[] {
  const v = unwrap<unknown>(res, key);
  return Array.isArray(v) ? (v as T[]) : [];
}

/** Human-readable message for any thrown value. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiClientError) {
    if (err.status === 404 && /No route/i.test(err.message)) return 'This API route is not available yet.';
    return err.message;
  }
  if (err instanceof Error) return err.message || 'Something went wrong.';
  return 'Something went wrong.';
}

export function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiClientError && err.status === 401;
}

// ───────────────────────── auth ─────────────────────────

export async function adminLogin(password: string, remember: boolean): Promise<{ token: string; expiresAt: string }> {
  // NOT via adminCall: a wrong password is a 401 here and must not trigger the logout broadcast.
  const res = await api<{ token: string; expiresAt: string }>('/admin/login', { method: 'POST', body: { password } });
  setAdminToken(res.token, remember);
  return res;
}

export async function adminMe(): Promise<boolean> {
  const res = await get<{ ok?: boolean }>('/admin/me');
  return !isObj(res) || res.ok !== false;
}

export function adminLogout(): void {
  setAdminToken(null);
}

// ───────────────────────── dashboard / orders ─────────────────────────

export async function getDashboard(): Promise<AdminDashboard> {
  const r = unwrap<Partial<AdminDashboard>>(await get('/admin/dashboard'), 'dashboard');
  return {
    counts: { awaiting: 0, paid: 0, delivering: 0, delivered: 0, ...(r.counts ?? {}) },
    revenueCents: r.revenueCents ?? 0,
    today: { orders: 0, revenueCents: 0, ...(r.today ?? {}) },
    recent: Array.isArray(r.recent) ? r.recent : [],
    pendingReviews: r.pendingReviews ?? 0,
    activeGiveaways: r.activeGiveaways ?? 0,
    integrations: { stripe: false, paypal: false, nowpayments: false, discord: false, ...(r.integrations ?? {}) },
  };
}

export async function listOrders(q: OrderListQuery = {}): Promise<AdminOrdersPage> {
  const sp = new URLSearchParams();
  if (q.status) sp.set('status', q.status);
  if (q.q?.trim()) sp.set('q', q.q.trim());
  if (q.page && q.page > 1) sp.set('page', String(q.page));
  const qs = sp.toString();
  const r = await get<{ orders?: OrderIndexEntry[]; total?: number; page?: number; pageSize?: number; perPage?: number }>(`/admin/orders${qs ? `?${qs}` : ''}`);
  const orders = Array.isArray(r?.orders) ? r.orders : [];
  return {
    orders,
    total: typeof r?.total === 'number' ? r.total : orders.length,
    page: r?.page ?? q.page ?? 1,
    pageSize: r?.pageSize ?? r?.perPage ?? 50,
  };
}

export async function getOrder(id: string): Promise<Order> {
  return unwrap<Order>(await get(`/admin/orders/${encodeURIComponent(id)}`), 'order');
}

export async function patchOrder(id: string, body: OrderPatch): Promise<Order> {
  return unwrap<Order>(await patch(`/admin/orders/${encodeURIComponent(id)}`, body), 'order');
}

/** Download the order index as CSV (fetched with the bearer header, then saved via a blob URL). */
export async function downloadOrdersCsv(): Promise<void> {
  const token = getAdminToken();
  const res = await fetch('/api/admin/export/orders.csv', { headers: token ? { authorization: `Bearer ${token}` } : {} });
  if (res.status === 401) {
    broadcastUnauthorized();
    throw new ApiClientError(401, 'Admin login required', 'unauthorized');
  }
  if (!res.ok) {
    let msg = `Export failed (${res.status})`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) msg = j.error;
    } catch {
      /* not json */
    }
    throw new ApiClientError(res.status, msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `donutcoins-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ───────────────────────── products ─────────────────────────

export async function listAdminProducts(): Promise<AdminCatalog> {
  const r = await get<unknown>('/admin/products');
  const o = isObj(r) ? r : {};
  const catalog = isObj(o.catalog) ? (o.catalog as Partial<Catalog>) : (o as Partial<Catalog>);
  const ov = isObj(o.overrides) && ('overrides' in (o.overrides as object) || 'custom' in (o.overrides as object)) ? (o.overrides as Partial<CatalogOverridesInfo>) : {};
  // a flat response may also carry `custom`/`deleted` at the top level
  const flatOverrides = isObj(o.overrides) && !('custom' in (o.overrides as object)) && !('overrides' in (o.overrides as object)) ? (o.overrides as Record<string, Partial<Product>>) : undefined;
  return {
    products: Array.isArray(catalog.products) ? catalog.products : [],
    categories: Array.isArray(catalog.categories) ? catalog.categories : [],
    overrides: {
      overrides: ov.overrides ?? flatOverrides ?? {},
      custom: ov.custom ?? (Array.isArray(o.custom) ? (o.custom as Product[]) : []),
      deleted: ov.deleted ?? (Array.isArray(o.deleted) ? (o.deleted as string[]) : []),
    },
  };
}

export async function updateProduct(id: string, body: ProductPatch): Promise<Product | null> {
  const r = await put<unknown>(`/admin/products/${encodeURIComponent(id)}`, body);
  const p = unwrap<Product | null>(r, 'product');
  return isObj(p) && typeof (p as Product).id === 'string' ? (p as Product) : null;
}

export async function createProduct(body: CreateProductInput): Promise<Product | null> {
  const r = await post<unknown>('/admin/products', body);
  const p = unwrap<Product | null>(r, 'product');
  return isObj(p) && typeof (p as Product).id === 'string' ? (p as Product) : null;
}

export async function deleteProduct(id: string): Promise<void> {
  await del(`/admin/products/${encodeURIComponent(id)}`);
}

// ───────────────────────── coupons & gift codes ─────────────────────────

export async function listCoupons(): Promise<Coupon[]> {
  return unwrapList<Coupon>(await get('/admin/coupons'), 'coupons');
}

export async function createCoupon(body: CreateCouponInput): Promise<Coupon> {
  return unwrap<Coupon>(await post('/admin/coupons', body), 'coupon');
}

export async function deleteCoupon(code: string): Promise<void> {
  await del(`/admin/coupons/${encodeURIComponent(code)}`);
}

export async function setCouponActive(code: string, active: boolean): Promise<Coupon | null> {
  const r = await patch<unknown>(`/admin/coupons/${encodeURIComponent(code)}`, { active });
  const c = unwrap<Coupon | null>(r, 'coupon');
  return isObj(c) && typeof (c as Coupon).code === 'string' ? (c as Coupon) : null;
}

export async function listGifts(): Promise<GiftCode[]> {
  return unwrapList<GiftCode>(await get('/admin/gifts'), 'gifts');
}

export async function createGift(body: CreateGiftInput): Promise<GiftCode> {
  return unwrap<GiftCode>(await post('/admin/gifts', body), 'gift');
}

export async function deleteGift(code: string): Promise<void> {
  await del(`/admin/gifts/${encodeURIComponent(code)}`);
}

// ───────────────────────── settings ─────────────────────────

export async function getAdminSettings(): Promise<SiteSettings> {
  return unwrap<SiteSettings>(await get('/admin/settings'), 'settings');
}

/** Deep-partial PUT – send only the sections that changed. */
export async function saveAdminSettings(patchBody: Partial<SiteSettings>): Promise<SiteSettings> {
  return unwrap<SiteSettings>(await put('/admin/settings', patchBody), 'settings');
}

// ───────────────────────── reviews ─────────────────────────

export async function listReviews(status: Review['status'] | 'all' = 'pending'): Promise<Review[]> {
  const qs = status === 'all' ? '' : `?status=${status}`;
  return unwrapList<Review>(await get(`/admin/reviews${qs}`), 'reviews');
}

export async function setReviewStatus(id: string, status: Review['status']): Promise<Review | null> {
  const r = await patch<unknown>(`/admin/reviews/${encodeURIComponent(id)}`, { status });
  const rv = unwrap<Review | null>(r, 'review');
  return isObj(rv) && typeof (rv as Review).id === 'string' ? (rv as Review) : null;
}

// ───────────────────────── giveaways ─────────────────────────

export async function listAdminGiveaways(): Promise<Giveaway[]> {
  return unwrapList<Giveaway>(await get('/admin/giveaways'), 'giveaways');
}

export async function createGiveaway(body: CreateGiveawayInput): Promise<Giveaway> {
  return unwrap<Giveaway>(await post('/admin/giveaways', body), 'giveaway');
}

export async function patchGiveaway(id: string, body: GiveawayPatch): Promise<Giveaway | null> {
  const r = await patch<unknown>(`/admin/giveaways/${encodeURIComponent(id)}`, body);
  const g = unwrap<Giveaway | null>(r, 'giveaway');
  return isObj(g) && typeof (g as Giveaway).id === 'string' ? (g as Giveaway) : null;
}

export async function drawGiveaway(id: string): Promise<{ giveaway: Giveaway | null; winners: string[] }> {
  const r = await post<unknown>(`/admin/giveaways/${encodeURIComponent(id)}/draw`, {});
  const g = unwrap<Giveaway | null>(r, 'giveaway');
  const giveaway = isObj(g) && typeof (g as Giveaway).id === 'string' ? (g as Giveaway) : null;
  const winners = isObj(r) && Array.isArray(r.winners) ? (r.winners as string[]) : (giveaway?.winners ?? []);
  return { giveaway, winners };
}

export async function listGiveawayEntries(id: string): Promise<GiveawayEntry[]> {
  return unwrapList<GiveawayEntry>(await get(`/admin/giveaways/${encodeURIComponent(id)}/entries`), 'entries');
}

// ───────────────────────── store credit ─────────────────────────

function toAccount(res: unknown, username: string): CreditAccount {
  const a = unwrap<Partial<CreditAccount>>(res, 'account');
  const acc = isObj(a) ? a : {};
  return {
    username: typeof acc.username === 'string' ? acc.username : username.toLowerCase(),
    balanceCents: typeof acc.balanceCents === 'number' ? acc.balanceCents : 0,
    history: Array.isArray(acc.history) ? acc.history : [],
  };
}

export async function getCreditAccount(username: string): Promise<CreditAccount> {
  return toAccount(await get(`/admin/credit?username=${encodeURIComponent(username.trim())}`), username);
}

export async function adjustCredit(body: CreditAdjustInput): Promise<CreditAccount> {
  return toAccount(await post('/admin/credit', body), body.username);
}

// ───────────────────────── discord bot ─────────────────────────

export interface DiscordBotStatus {
  configured: boolean;
  missing: string[];
  interactionsUrl: string;
  inviteUrl: string | null;
  setupAt: string | null;
  channels: number;
  roles: number;
}
export function getDiscordBot(): Promise<DiscordBotStatus> {
  return adminCall<DiscordBotStatus>('/admin/discord');
}
export function registerDiscordCommands(): Promise<{ registered: string[] }> {
  return adminCall('/admin/discord/register', { method: 'POST', body: {} });
}
export function runDiscordSetup(): Promise<{ ok: boolean; done: boolean; created: string[]; channels: number }> {
  return adminCall('/admin/discord/setup', { method: 'POST', body: {} });
}
