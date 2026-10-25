/**
 * Admin API – everything the owner's back office needs. Every route except
 * POST /admin/login requires a bearer token (lib/auth.ts requireAdmin).
 */
import type { CategoryId, Order, OrderIndexEntry, OrderStatus, PaymentStatus, Product, ProductKind, Review, SiteSettings } from '../../src/shared/types';
import { defaultSettings } from '../../src/data/settings';
import type { Handler, Route } from '../lib/http';
import { HttpError, getIp, hashIp, json, optionalString, readJson, requireString, requireUsername } from '../lib/http';
import { rateLimit } from '../lib/ratelimit';
import { checkPassword, issueToken, requireAdmin } from '../lib/auth';
import { getOrder, listOrderIndex, pushTimeline, saveOrder, setOrderStatus } from '../lib/orders';
import { getFullCatalog, getOverrides, saveOverrides } from '../lib/catalog';
import { getSettings, integrations, saveSettings } from '../lib/settings';
import { createCoupon, deleteCoupon, getCoupon, listCoupons, normalizeCode, saveCoupon } from '../lib/coupons';
import { addCredit, getCredit } from '../lib/credit';
import { COLORS, notifyDiscord, siteUrl } from '../lib/discord';
import { createGift, deleteGift, getGift, listGifts, normalizeGiftCode } from '../lib/gifts';
import { getReview, getReviewStats, listReviews, recomputeStats, saveReview } from '../lib/reviews';
import { createGiveaway, drawGiveaway, getGiveaway, isLive, listEntries, listGiveaways, refreshGiveawayStatus, saveGiveaway } from '../lib/giveaways';

// ───────────── helpers ─────────────

const ORDER_STATUSES: OrderStatus[] = ['awaiting_payment', 'paid', 'delivering', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'pending_review', 'paid', 'refunded', 'failed'];
const REVIEW_STATUSES: Review['status'][] = ['pending', 'approved', 'rejected'];
const PRODUCT_KINDS: ProductKind[] = ['money', 'item', 'box', 'bundle', 'kit', 'base'];
const REVENUE_STATUSES = new Set<OrderStatus>(['paid', 'delivering', 'delivered']);
const PAGE_SIZE = 50;

/** Route whose handler runs only with a valid admin token. */
function admin(method: Route['method'], path: string, handler: Handler): Route {
  return {
    method,
    path,
    handler: (ctx) => {
      requireAdmin(ctx.req);
      return handler(ctx);
    },
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], name: string): T {
  if (typeof v !== 'string' || !allowed.includes(v as T)) throw new HttpError(400, `${name} must be one of: ${allowed.join(', ')}.`, 'validation');
  return v as T;
}

function requireInt(v: unknown, name: string, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}): number {
  const n = typeof v === 'string' && v.trim() ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n) || !Number.isInteger(n)) throw new HttpError(400, `${name} must be a whole number.`, 'validation');
  if (n < min) throw new HttpError(400, `${name} must be at least ${min}.`, 'validation');
  if (n > max) throw new HttpError(400, `${name} must be at most ${max}.`, 'validation');
  return n;
}

function optionalInt(v: unknown, name: string, opts: { min?: number; max?: number } = {}): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  return requireInt(v, name, opts);
}

function optionalBool(v: unknown, name: string): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'boolean') throw new HttpError(400, `${name} must be true or false.`, 'validation');
  return v;
}

function requireIsoDate(v: unknown, name: string): string {
  const s = requireString(v, name, { min: 4, max: 40 });
  const t = Date.parse(s);
  if (!Number.isFinite(t)) throw new HttpError(400, `${name} must be a valid date.`, 'validation');
  return new Date(t).toISOString();
}

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function csvCell(v: unknown): string {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function loadOrder(id: string): Promise<Order> {
  const order = await getOrder(id);
  if (!order) throw new HttpError(404, 'Order not found.', 'not_found');
  return order;
}

// ───────────── products ─────────────

/** Fields the admin may patch on a product (everything else is ignored). */
const PATCHABLE: (keyof Product)[] = [
  'name', 'slug', 'shortDesc', 'description', 'categoryId', 'priceCents', 'compareAtCents', 'stock', 'bulkPricing', 'tags', 'featured', 'sortOrder',
  'image', 'kind', 'unitLabel', 'moneyMillions', 'contents', 'bundleItems', 'boxRolls', 'minQty', 'maxQty', 'hidden', 'deliveryNote',
];

const CATEGORY_IDS: CategoryId[] = ['money', 'spawners', 'mystery', 'investments', 'armor', 'tools', 'bundles', 'bases'];

function validateProductPatch(body: unknown): Partial<Product> {
  if (!isObj(body)) throw new HttpError(400, 'Expected a product object.', 'validation');
  const patch: Record<string, unknown> = {};
  for (const k of PATCHABLE) {
    if (!(k in body) || body[k] === undefined) continue;
    const v = body[k];
    switch (k) {
      case 'priceCents':
        patch[k] = requireInt(v, 'Price', { min: 0, max: 100_000_000 });
        break;
      case 'compareAtCents':
      case 'sortOrder':
      case 'boxRolls':
      case 'minQty':
      case 'maxQty':
        patch[k] = v === null ? undefined : requireInt(v, k, { min: 0, max: 100_000_000 });
        break;
      case 'moneyMillions':
        if (v === null) patch[k] = undefined;
        else if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) throw new HttpError(400, 'moneyMillions must be a number ≥ 0.', 'validation');
        else patch[k] = v;
        break;
      case 'stock':
        patch[k] = v === null ? null : requireInt(v, 'Stock', { min: 0, max: 10_000_000 });
        break;
      case 'featured':
      case 'hidden':
        patch[k] = optionalBool(v, k) ?? false;
        break;
      case 'tags':
        if (v === null) patch[k] = [];
        else if (!Array.isArray(v) || v.some((t) => typeof t !== 'string')) throw new HttpError(400, 'tags must be a list of strings.', 'validation');
        else patch[k] = (v as string[]).map((t) => t.trim()).filter(Boolean).slice(0, 10);
        break;
      case 'bulkPricing':
        if (v === null) patch[k] = [];
        else if (!Array.isArray(v)) throw new HttpError(400, 'bulkPricing must be a list.', 'validation');
        else patch[k] = v.map((t) => ({ minQty: requireInt(isObj(t) ? t.minQty : undefined, 'Bulk tier minQty', { min: 1 }), priceCents: requireInt(isObj(t) ? t.priceCents : undefined, 'Bulk tier price', { min: 0 }) }));
        break;
      case 'bundleItems':
        if (v === null) patch[k] = [];
        else if (!Array.isArray(v)) throw new HttpError(400, 'bundleItems must be a list.', 'validation');
        else patch[k] = v.map((t) => ({ productId: requireString(isObj(t) ? t.productId : undefined, 'bundle productId', { max: 80 }), quantity: requireInt(isObj(t) ? t.quantity : undefined, 'bundle quantity', { min: 1 }) }));
        break;
      case 'contents':
        if (v === null) patch[k] = [];
        else if (!Array.isArray(v)) throw new HttpError(400, 'contents must be a list.', 'validation');
        else
          patch[k] = v.map((c) => {
            if (!isObj(c)) throw new HttpError(400, 'Each content line must be an object.', 'validation');
            const min = requireInt(c.min, 'content min', { min: 0 });
            const max = requireInt(c.max, 'content max', { min });
            return {
              name: requireString(c.name, 'content name', { max: 80 }),
              min,
              max,
              weight: c.weight === undefined || c.weight === null ? undefined : requireInt(c.weight, 'content weight', { min: 0 }),
              productId: optionalString(c.productId, 'content productId', 80),
              image: optionalString(c.image, 'content image', 300),
              rarity: c.rarity === undefined || c.rarity === null || c.rarity === '' ? undefined : oneOf(c.rarity, ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const, 'rarity'),
            };
          });
        break;
      case 'categoryId':
        patch[k] = oneOf(v, CATEGORY_IDS, 'categoryId');
        break;
      case 'kind':
        patch[k] = oneOf(v, PRODUCT_KINDS, 'kind');
        break;
      case 'name':
      case 'slug':
        patch[k] = requireString(v, k, { min: 1, max: 120 });
        if (k === 'slug' && !/^[a-z0-9][a-z0-9-]*$/.test(patch[k] as string)) throw new HttpError(400, 'slug may only contain lowercase letters, numbers and dashes.', 'validation');
        break;
      default:
        // free text: shortDesc, description, image, unitLabel, deliveryNote
        patch[k] = optionalString(v, k, k === 'description' ? 4000 : 500);
    }
  }
  return patch as Partial<Product>;
}

// ───────────── settings ─────────────

const SETTINGS_KEYS = new Set(Object.keys(defaultSettings));
const SETTINGS_ARRAYS: (keyof SiteSettings)[] = ['spendingTiers', 'paymentMethods', 'currencies'];

/** Keep only known top-level keys and sanity-check shapes; deep merge happens in saveSettings. */
function validateSettingsPatch(body: unknown): Partial<SiteSettings> {
  if (!isObj(body)) throw new HttpError(400, 'Expected a settings object.', 'validation');
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!SETTINGS_KEYS.has(k) || v === undefined) continue;
    const def = (defaultSettings as unknown as Record<string, unknown>)[k];
    if (SETTINGS_ARRAYS.includes(k as keyof SiteSettings) && !Array.isArray(v)) throw new HttpError(400, `${k} must be a list.`, 'validation');
    if (isObj(def) && !isObj(v)) throw new HttpError(400, `${k} must be an object.`, 'validation');
    if (typeof def === 'string' && typeof v !== 'string') throw new HttpError(400, `${k} must be text.`, 'validation');
    if (typeof def === 'number' && (typeof v !== 'number' || !Number.isFinite(v))) throw new HttpError(400, `${k} must be a number.`, 'validation');
    patch[k] = v;
  }
  const spin = patch.spin;
  if (isObj(spin) && spin.prizes !== undefined) {
    if (!Array.isArray(spin.prizes)) throw new HttpError(400, 'spin.prizes must be a list.', 'validation');
    for (const p of spin.prizes) {
      if (!isObj(p) || typeof p.id !== 'string' || typeof p.label !== 'string' || typeof p.type !== 'string') throw new HttpError(400, 'Every spin prize needs id, label and type.', 'validation');
      if (typeof p.weight !== 'number' || !Number.isFinite(p.weight) || p.weight < 0) throw new HttpError(400, `Prize "${p.label}" needs a weight ≥ 0.`, 'validation');
    }
    if (spin.prizes.length > 24) throw new HttpError(400, 'A wheel can have at most 24 segments.', 'validation');
  }
  if (isObj(spin) && spin.cooldownHours !== undefined && (typeof spin.cooldownHours !== 'number' || spin.cooldownHours < 0 || spin.cooldownHours > 24 * 30)) {
    throw new HttpError(400, 'spin.cooldownHours must be between 0 and 720.', 'validation');
  }
  if (patch.reviewRewardPercent !== undefined && ((patch.reviewRewardPercent as number) < 0 || (patch.reviewRewardPercent as number) > 100)) throw new HttpError(400, 'reviewRewardPercent must be 0–100.', 'validation');
  if (Array.isArray(patch.paymentMethods)) {
    const TYPES = new Set(['manual', 'stripe', 'paypal', 'nowpayments']);
    for (const m of patch.paymentMethods) {
      if (!isObj(m) || typeof m.id !== 'string' || typeof m.name !== 'string' || typeof m.type !== 'string') throw new HttpError(400, 'Every payment method needs id, name and type.', 'validation');
      if (!TYPES.has(m.type)) throw new HttpError(400, `Payment method "${m.name}" has an unknown type.`, 'validation');
      if (m.enabled !== undefined && typeof m.enabled !== 'boolean') throw new HttpError(400, `Payment method "${m.name}": enabled must be true/false.`, 'validation');
      numField(m, 'feePercent', `Payment method "${m.name}" fee`, 0, 100);
      numField(m, 'minCents', `Payment method "${m.name}" minimum`, 0, 10_000_000, false, true);
      numField(m, 'sortOrder', `Payment method "${m.name}" sort order`, -1000, 1000);
      for (const k of ['description', 'icon', 'instructions', 'handle', 'linkTemplate', 'referenceLabel']) {
        if (m[k] !== undefined && m[k] !== null && typeof m[k] !== 'string') throw new HttpError(400, `Payment method "${m.name}": ${k} must be text.`, 'validation');
      }
      if (typeof m.linkTemplate === 'string' && m.linkTemplate.trim() && !/^https?:\/\//i.test(m.linkTemplate.trim())) {
        throw new HttpError(400, `Payment method "${m.name}": the pay link must start with https://`, 'validation');
      }
    }
  }
  const legal = patch.legal;
  if (isObj(legal)) {
    for (const [k, v] of Object.entries(legal)) {
      if (v === undefined) continue;
      if (typeof v !== 'string') throw new HttpError(400, `legal.${k} must be text.`, 'validation');
      if (v.length > 2000) throw new HttpError(400, `legal.${k} is too long (max 2000 characters).`, 'validation');
    }
  }
  // nested numeric fields – a bad type here would corrupt every quote
  const sale = patch.sale;
  if (isObj(sale)) numField(sale, 'percent', 'Sale percent', 0, 90, true);
  const referral = patch.referral;
  if (isObj(referral)) {
    numField(referral, 'friendPercent', 'Referral friend percent', 0, 100, true);
    numField(referral, 'referrerPercent', 'Referral referrer percent', 0, 100, true);
  }
  const welcome = patch.welcomeCoupon;
  if (isObj(welcome)) {
    numField(welcome, 'percent', 'Welcome coupon percent', 0, 100, true);
    if (welcome.code !== undefined && (typeof welcome.code !== 'string' || !/^[A-Z0-9_-]{2,40}$/i.test(welcome.code))) throw new HttpError(400, 'Welcome code: 2–40 letters, numbers, - or _.', 'validation');
  }
  if (Array.isArray(patch.spendingTiers)) {
    for (const t of patch.spendingTiers) {
      if (!isObj(t)) throw new HttpError(400, 'Every spending tier needs minCents and percent.', 'validation');
      numField(t, 'minCents', 'Spending tier minimum', 0, 100_000_000, true, true);
      numField(t, 'percent', 'Spending tier percent', 0, 90, true, true);
    }
  }
  if (Array.isArray(patch.currencies)) {
    for (const c of patch.currencies) {
      if (!isObj(c) || typeof c.code !== 'string' || !/^[A-Z]{3}$/.test(c.code) || typeof c.symbol !== 'string') throw new HttpError(400, 'Every currency needs a 3-letter code and a symbol.', 'validation');
      numField(c, 'rate', `Currency ${c.code} rate`, 0.000001, 1_000_000, true);
    }
    if (!patch.currencies.some((c) => isObj(c) && c.code === 'USD')) throw new HttpError(400, 'USD must stay in the currency list.', 'validation');
  }
  if (isObj(spin) && Array.isArray(spin.prizes)) {
    for (const p of spin.prizes as Record<string, unknown>[]) {
      numField(p, 'percent', `Prize "${p.label}" percent`, 1, 100);
      numField(p, 'qty', `Prize "${p.label}" quantity`, 1, 100_000);
      numField(p, 'creditCents', `Prize "${p.label}" credit`, 1, 10_000_000);
      numField(p, 'minOrderCents', `Prize "${p.label}" minimum order`, 0, 10_000_000);
      numField(p, 'validDays', `Prize "${p.label}" valid days`, 1, 365);
    }
  }
  const stats = patch.stats;
  if (isObj(stats)) {
    numField(stats, 'ordersOffset', 'Orders offset', 0, 10_000_000, true, true);
    if (stats.pastReviews !== undefined) {
      if (!isObj(stats.pastReviews)) throw new HttpError(400, 'stats.pastReviews must be an object.', 'validation');
      for (const k of ['count5', 'count4', 'count3']) numField(stats.pastReviews, k, `Earlier ${k.slice(-1)}-star reviews`, 0, 100_000, false, true);
    }
  }
  const ann = patch.announcement;
  if (isObj(ann) && typeof ann.link === 'string' && ann.link.trim() && !/^(https?:\/\/|\/(?!\/))/i.test(ann.link.trim())) {
    throw new HttpError(400, 'Announcement link must start with https:// or /', 'validation');
  }
  return patch as Partial<SiteSettings>;
}

/** Validate an optional numeric field in place (NaN / strings / out of range → 400). */
function numField(obj: Record<string, unknown>, k: string, label: string, min: number, max: number, required = false, integer = false): void {
  const v = obj[k];
  if (v === undefined || v === null || v === '') {
    if (required) throw new HttpError(400, `${label} is required.`, 'validation');
    delete obj[k];
    return;
  }
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) {
    throw new HttpError(400, `${label} must be a number between ${min} and ${max}.`, 'validation');
  }
  obj[k] = n;
}

// ───────────── routes ─────────────

export const routes: Route[] = [
  // ───── auth ─────
  {
    method: 'POST',
    path: '/admin/login',
    handler: async ({ req, context }) => {
      const body = await readJson<{ password?: unknown }>(req);
      const password = requireString(body.password, 'Password', { min: 1, max: 200 });
      await rateLimit(`admin-login:${hashIp(getIp(req, context))}`, 5, 900);
      if (!checkPassword(password)) throw new HttpError(401, 'Wrong password.', 'bad_password');
      return json(issueToken());
    },
  },
  admin('GET', '/admin/me', async () => json({ ok: true })),

  // ───── dashboard ─────
  admin('GET', '/admin/dashboard', async () => {
    const [idx, stats, giveaways] = await Promise.all([listOrderIndex(), getReviewStats(), listGiveaways()]);
    const counts = { awaiting: 0, paid: 0, delivering: 0, delivered: 0, cancelled: 0, refunded: 0 };
    let revenueCents = 0;
    const today = new Date().toISOString().slice(0, 10);
    const todayStats = { orders: 0, revenueCents: 0 };
    for (const e of idx) {
      if (e.status === 'awaiting_payment') counts.awaiting += 1;
      else if (e.status in counts) counts[e.status as keyof typeof counts] += 1;
      const revenue = REVENUE_STATUSES.has(e.status);
      if (revenue) revenueCents += e.totalCents;
      if (e.createdAt.slice(0, 10) === today) {
        todayStats.orders += 1;
        if (revenue) todayStats.revenueCents += e.totalCents;
      }
    }
    return json({
      counts,
      revenueCents,
      today: todayStats,
      recent: idx.slice(0, 10),
      pendingReviews: stats.pending,
      activeGiveaways: giveaways.filter((g) => isLive(g)).length,
      totalOrders: idx.length,
      integrations: integrations(),
    });
  }),

  // ───── orders ─────
  admin('GET', '/admin/orders', async ({ url }) => {
    const status = url.searchParams.get('status')?.trim();
    const q = url.searchParams.get('q')?.trim().toLowerCase();
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    let list = await listOrderIndex();
    if (status) {
      if (!ORDER_STATUSES.includes(status as OrderStatus)) throw new HttpError(400, 'Unknown status filter.', 'validation');
      list = list.filter((e) => e.status === status);
    }
    if (q) list = list.filter((e) => e.id.toLowerCase().includes(q) || e.username.toLowerCase().includes(q));
    const total = list.length;
    const orders = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return json({ orders, total, page, pageSize: PAGE_SIZE });
  }),
  admin('GET', '/admin/orders/:id', async ({ params }) => json({ order: await loadOrder(params.id) })),
  admin('PATCH', '/admin/orders/:id', async ({ req, params }) => {
    const body = await readJson<{ status?: unknown; adminNote?: unknown; paymentStatus?: unknown }>(req);
    const status = body.status === undefined || body.status === null ? undefined : oneOf(body.status, ORDER_STATUSES, 'status');
    const paymentStatus = body.paymentStatus === undefined || body.paymentStatus === null ? undefined : oneOf(body.paymentStatus, PAYMENT_STATUSES, 'paymentStatus');
    const hasNote = body.adminNote !== undefined;
    const adminNote = hasNote ? (optionalString(body.adminNote, 'Note', 2000) ?? '') : undefined;
    if (status === undefined && paymentStatus === undefined && !hasNote) throw new HttpError(400, 'Nothing to update.', 'validation');

    let order = await loadOrder(params.id);
    if (adminNote !== undefined) order.adminNote = adminNote || undefined;
    if (status && status !== order.status) {
      order = await setOrderStatus(order, status, 'Updated by admin');
    } else if (adminNote !== undefined) {
      await saveOrder(order);
    }
    if (paymentStatus && paymentStatus !== order.payment.status) {
      order.payment.status = paymentStatus;
      if (paymentStatus === 'paid' && !order.payment.paidAt) order.payment.paidAt = new Date().toISOString();
      pushTimeline(order, 'note', `Payment marked ${paymentStatus.replace('_', ' ')} by admin`);
      await saveOrder(order);
    }
    return json({ order });
  }),

  // ───── products ─────
  admin('GET', '/admin/products', async () => {
    const [catalog, overrides] = await Promise.all([getFullCatalog(), getOverrides()]);
    return json({ categories: catalog.categories, products: catalog.products, overrides });
  }),
  admin('PUT', '/admin/products/:id', async ({ req, params }) => {
    const id = params.id.trim();
    const patch = validateProductPatch(await readJson(req));
    const [catalog, o] = await Promise.all([getFullCatalog(), getOverrides()]);
    const existing = catalog.products.find((p) => p.id === id);
    if (!existing) throw new HttpError(404, 'Product not found.', 'not_found');
    const current = { ...(o.overrides[id] ?? {}) };
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) delete current[k as keyof Product];
      else (current as Record<string, unknown>)[k] = v;
    }
    o.overrides[id] = current;
    await saveOverrides(o);
    const merged = (await getFullCatalog()).products.find((p) => p.id === id) ?? { ...existing, ...patch };
    return json({ product: merged });
  }),
  admin('POST', '/admin/products', async ({ req }) => {
    const body = await readJson<Record<string, unknown>>(req);
    if (!isObj(body)) throw new HttpError(400, 'Expected a product object.', 'validation');
    const slug = requireString(body.slug, 'slug', { min: 1, max: 120 }).toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw new HttpError(400, 'slug may only contain lowercase letters, numbers and dashes.', 'validation');
    const id = (optionalString(body.id, 'id', 80) ?? slug).toLowerCase();
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(id)) throw new HttpError(400, 'id may only contain lowercase letters, numbers, dashes and underscores.', 'validation');
    const name = requireString(body.name, 'name', { min: 1, max: 120 });
    const categoryId = oneOf(body.categoryId, CATEGORY_IDS, 'categoryId');
    const kind = oneOf(body.kind, PRODUCT_KINDS, 'kind');
    const priceCents = requireInt(body.priceCents, 'Price', { min: 0, max: 100_000_000 });
    const image = requireString(body.image, 'image', { min: 1, max: 300 });
    const rest = validateProductPatch({ ...body, id: undefined, slug: undefined, name: undefined, categoryId: undefined, kind: undefined, priceCents: undefined, image: undefined });

    const [catalog, o] = await Promise.all([getFullCatalog(), getOverrides()]);
    if (catalog.products.some((p) => p.id === id)) throw new HttpError(409, `A product with id "${id}" already exists.`, 'conflict');
    if (catalog.products.some((p) => p.slug === slug)) throw new HttpError(409, `A product with slug "${slug}" already exists.`, 'conflict');
    const product: Product = {
      ...rest,
      id,
      slug,
      name,
      categoryId,
      kind,
      priceCents,
      image,
      stock: rest.stock === undefined ? null : rest.stock,
    };
    o.custom = o.custom.filter((p) => p.id !== id);
    o.custom.push(product);
    o.deleted = o.deleted.filter((d) => d !== id);
    await saveOverrides(o);
    return json({ product }, 201);
  }),
  admin('DELETE', '/admin/products/:id', async ({ params }) => {
    const id = params.id.trim();
    const [catalog, o] = await Promise.all([getFullCatalog(), getOverrides()]);
    if (!catalog.products.some((p) => p.id === id)) throw new HttpError(404, 'Product not found.', 'not_found');
    const custom = o.custom.some((p) => p.id === id);
    if (custom) o.custom = o.custom.filter((p) => p.id !== id);
    else if (!o.deleted.includes(id)) o.deleted.push(id);
    delete o.overrides[id];
    await saveOverrides(o);
    return json({ ok: true, id, removed: custom ? 'custom' : 'default' });
  }),

  // ───── coupons ─────
  admin('GET', '/admin/coupons', async () => json({ coupons: await listCoupons() })),
  admin('POST', '/admin/coupons', async ({ req }) => {
    const body = await readJson<Record<string, unknown>>(req);
    if (!isObj(body)) throw new HttpError(400, 'Expected a coupon object.', 'validation');
    const type = oneOf(body.type, ['percent', 'fixed'] as const, 'type');
    const value = requireInt(body.value, 'Value', { min: 1, max: type === 'percent' ? 100 : 100_000_000 });
    const source = body.source === undefined ? 'admin' : oneOf(body.source, ['admin', 'spin', 'review', 'referral', 'giveaway', 'welcome'] as const, 'source');
    const code = optionalString(body.code, 'Code', 40);
    if (code && !/^[A-Za-z0-9_-]{3,40}$/.test(normalizeCode(code))) throw new HttpError(400, 'Codes are 3–40 letters, numbers, dashes or underscores.', 'validation');
    const prefix = optionalString(body.prefix, 'Prefix', 12);
    if (prefix && !/^[A-Za-z0-9]{1,12}$/.test(prefix)) throw new HttpError(400, 'Prefix must be letters or numbers.', 'validation');
    const boundUsername = body.boundUsername ? requireUsername(body.boundUsername) : undefined;
    if (code && (await getCoupon(code))) throw new HttpError(409, `Coupon ${normalizeCode(code)} already exists.`, 'conflict');
    const coupon = await createCoupon({
      type,
      value,
      source,
      code,
      prefix: prefix?.toUpperCase(),
      minOrderCents: optionalInt(body.minOrderCents, 'Minimum order', { min: 0 }),
      maxUses: optionalInt(body.maxUses, 'Max uses', { min: 1 }),
      validDays: optionalInt(body.validDays, 'Valid days', { min: 1, max: 3650 }),
      boundUsername,
      note: optionalString(body.note, 'Note', 300),
    });
    return json({ coupon }, 201);
  }),
  admin('PATCH', '/admin/coupons/:code', async ({ req, params }) => {
    const body = await readJson<{ active?: unknown }>(req);
    const active = optionalBool(body.active, 'active');
    if (active === undefined) throw new HttpError(400, 'active (true/false) is required.', 'validation');
    const coupon = await getCoupon(params.code);
    if (!coupon) throw new HttpError(404, 'Coupon not found.', 'not_found');
    coupon.active = active;
    await saveCoupon(coupon);
    return json({ coupon });
  }),
  admin('DELETE', '/admin/coupons/:code', async ({ params }) => {
    const coupon = await getCoupon(params.code);
    if (!coupon) throw new HttpError(404, 'Coupon not found.', 'not_found');
    await deleteCoupon(coupon.code);
    return json({ ok: true, code: coupon.code });
  }),

  // ───── gift codes ─────
  admin('GET', '/admin/gifts', async () => json({ gifts: await listGifts() })),
  admin('POST', '/admin/gifts', async ({ req }) => {
    const body = await readJson<Record<string, unknown>>(req);
    if (!isObj(body)) throw new HttpError(400, 'Expected a gift object.', 'validation');
    const productId = requireString(body.productId, 'productId', { max: 80 });
    const catalog = await getFullCatalog();
    if (!catalog.products.some((p) => p.id === productId)) throw new HttpError(400, 'Unknown product for this gift code.', 'validation');
    const gift = await createGift({
      productId,
      qty: requireInt(body.qty ?? 1, 'Quantity', { min: 1, max: 100_000 }),
      maxUses: optionalInt(body.maxUses, 'Max uses', { min: 1, max: 1_000_000 }),
      validDays: optionalInt(body.validDays, 'Valid days', { min: 1, max: 3650 }),
      code: optionalString(body.code, 'Code', 40),
      note: optionalString(body.note, 'Note', 300),
    });
    return json({ gift }, 201);
  }),
  admin('DELETE', '/admin/gifts/:code', async ({ params }) => {
    const gift = await getGift(params.code);
    if (!gift) throw new HttpError(404, 'Gift code not found.', 'not_found');
    await deleteGift(gift.code);
    return json({ ok: true, code: normalizeGiftCode(gift.code) });
  }),

  // ───── settings ─────
  admin('GET', '/admin/settings', async () => json(await getSettings())),
  admin('PUT', '/admin/settings', async ({ req }) => {
    const patch = validateSettingsPatch(await readJson(req));
    if (!Object.keys(patch).length) throw new HttpError(400, 'Nothing to update.', 'validation');
    return json(await saveSettings(patch));
  }),

  // ───── reviews ─────
  admin('GET', '/admin/reviews', async ({ url }) => {
    const raw = url.searchParams.get('status')?.trim();
    const status = !raw || raw === 'all' ? 'all' : oneOf(raw, REVIEW_STATUSES, 'status');
    const [reviews, stats] = await Promise.all([listReviews({ status }), getReviewStats()]);
    return json({ reviews, stats });
  }),
  admin('PATCH', '/admin/reviews/:id', async ({ req, params }) => {
    const body = await readJson<{ status?: unknown }>(req);
    const status = oneOf(body.status, REVIEW_STATUSES, 'status');
    const review = await getReview(params.id);
    if (!review) throw new HttpError(404, 'Review not found.', 'not_found');
    const wasApproved = review.status === 'approved';
    review.status = status;
    if (status === 'approved') {
      review.approvedAt = review.approvedAt ?? new Date().toISOString();
      if (!wasApproved && !review.rewardCode) {
        const settings = await getSettings();
        const percent = Math.floor(settings.reviewRewardPercent);
        if (percent > 0) {
          const coupon = await createCoupon({ type: 'percent', value: percent, source: 'review', prefix: 'THANKS', boundUsername: review.username, validDays: 30, maxUses: 1, note: `Review reward · order ${review.orderId}` });
          review.rewardCode = coupon.code;
          const order = await getOrder(review.orderId);
          if (order) {
            pushTimeline(order, 'note', `Review approved – thank-you code ${coupon.code} (${percent}% off, 30 days)`);
            await saveOrder(order);
          }
        }
      }
    }
    await saveReview(review);
    const stats = await recomputeStats();
    return json({ review, stats });
  }),

  // ───── giveaways ─────
  admin('GET', '/admin/giveaways', async () => json({ giveaways: await listGiveaways() })),
  admin('POST', '/admin/giveaways', async ({ req }) => {
    const body = await readJson<Record<string, unknown>>(req);
    if (!isObj(body)) throw new HttpError(400, 'Expected a giveaway object.', 'validation');
    const endsAt = requireIsoDate(body.endsAt, 'End date');
    if (Date.parse(endsAt) <= Date.now()) throw new HttpError(400, 'The end date must be in the future.', 'validation');
    const giveaway = await createGiveaway({
      title: requireString(body.title, 'Title', { min: 2, max: 120 }),
      description: optionalString(body.description, 'Description', 1000),
      prize: requireString(body.prize, 'Prize', { min: 1, max: 200 }),
      endsAt,
      maxWinners: optionalInt(body.maxWinners, 'Winners', { min: 1, max: 100 }) ?? 1,
      image: optionalString(body.image, 'Image', 300),
    });
    await notifyDiscord({
      title: `🎁 Giveaway started · ${giveaway.title}`,
      color: COLORS.pink,
      url: `${siteUrl()}/giveaways`,
      fields: [
        { name: 'Prize', value: giveaway.prize, inline: true },
        { name: 'Ends', value: giveaway.endsAt.replace('T', ' ').slice(0, 16) + ' UTC', inline: true },
      ],
    });
    return json({ giveaway }, 201);
  }),
  admin('PATCH', '/admin/giveaways/:id', async ({ req, params }) => {
    const body = await readJson<Record<string, unknown>>(req);
    if (!isObj(body)) throw new HttpError(400, 'Expected a giveaway patch.', 'validation');
    const g = await getGiveaway(params.id);
    if (!g) throw new HttpError(404, 'Giveaway not found.', 'not_found');
    if (body.status !== undefined) {
      const status = oneOf(body.status, ['active', 'ended'] as const, 'status');
      if (g.status === 'drawn') throw new HttpError(409, 'Winners were already drawn – this giveaway cannot be reopened.', 'drawn');
      g.status = status;
      if (status === 'active' && Date.parse(g.endsAt) <= Date.now() && body.endsAt === undefined) throw new HttpError(400, 'Set a new end date in the future to reopen this giveaway.', 'validation');
    }
    if (body.title !== undefined) g.title = requireString(body.title, 'Title', { min: 2, max: 120 });
    if (body.description !== undefined) g.description = optionalString(body.description, 'Description', 1000);
    if (body.prize !== undefined) g.prize = requireString(body.prize, 'Prize', { min: 1, max: 200 });
    if (body.image !== undefined) g.image = optionalString(body.image, 'Image', 300);
    if (body.maxWinners !== undefined) g.maxWinners = requireInt(body.maxWinners, 'Winners', { min: 1, max: 100 });
    if (body.endsAt !== undefined) g.endsAt = requireIsoDate(body.endsAt, 'End date');
    await saveGiveaway(g);
    return json({ giveaway: await refreshGiveawayStatus(g) });
  }),
  admin('POST', '/admin/giveaways/:id/draw', async ({ params }) => {
    const g = await getGiveaway(params.id);
    if (!g) throw new HttpError(404, 'Giveaway not found.', 'not_found');
    if (g.status === 'drawn') throw new HttpError(409, 'Winners were already drawn for this giveaway.', 'drawn');
    const { giveaway, winners } = await drawGiveaway(g);
    await notifyDiscord({
      title: `🎉 Giveaway drawn · ${giveaway.title}`,
      color: COLORS.gold,
      url: `${siteUrl()}/giveaways`,
      fields: [
        { name: 'Prize', value: giveaway.prize, inline: true },
        { name: 'Entries', value: String(giveaway.entriesCount), inline: true },
        { name: winners.length === 1 ? 'Winner' : 'Winners', value: winners.length ? winners.map((w) => `\`${w}\``).join(', ') : '_no entries_' },
      ],
      footer: { text: 'Deliver the prize in-game or create a gift code for each winner.' },
    });
    return json({ giveaway, winners });
  }),
  admin('GET', '/admin/giveaways/:id/entries', async ({ params }) => {
    const g = await getGiveaway(params.id);
    if (!g) throw new HttpError(404, 'Giveaway not found.', 'not_found');
    return json({ entries: await listEntries(g.id), giveaway: g });
  }),

  // ───── store credit ─────
  admin('GET', '/admin/credit', async ({ url }) => {
    const username = requireUsername(url.searchParams.get('username'));
    return json({ account: await getCredit(username) });
  }),
  admin('POST', '/admin/credit', async ({ req }) => {
    const body = await readJson<{ username?: unknown; deltaCents?: unknown; reason?: unknown }>(req);
    const username = requireUsername(body.username);
    const delta = requireInt(body.deltaCents, 'Amount', { min: -100_000_000, max: 100_000_000 });
    if (delta === 0) throw new HttpError(400, 'Amount must not be zero.', 'validation');
    const reason = requireString(body.reason, 'Reason', { min: 2, max: 200 });
    const account = await addCredit(username, delta, reason);
    return json({ account });
  }),

  // ───── export ─────
  admin('GET', '/admin/export/orders.csv', async () => {
    const idx = await listOrderIndex();
    const header = ['id', 'createdAt', 'updatedAt', 'username', 'status', 'paymentStatus', 'method', 'totalUsd', 'items'];
    const rows = idx.map((e: OrderIndexEntry) => [e.id, e.createdAt, e.updatedAt, e.username, e.status, e.paymentStatus, e.methodId, (e.totalCents / 100).toFixed(2), e.itemsSummary].map(csvCell).join(','));
    const csv = `${header.join(',')}\r\n${rows.join('\r\n')}${rows.length ? '\r\n' : ''}`;
    return new Response(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="donutcoins-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
        'cache-control': 'no-store',
      },
    });
  }),
];
