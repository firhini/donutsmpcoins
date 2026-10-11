import type {
  CartLineInput,
  Coupon,
  Product,
  Quote,
  QuoteLine,
  SpendingTier,
} from './types';

export const MAX_TOTAL_DISCOUNT_PERCENT = 60;

/** Unit price for a product at a given quantity (bulk tiers applied). */
export function unitPriceCents(product: Product, qty: number): { price: number; bulk: boolean } {
  let price = product.priceCents;
  let bulk = false;
  if (product.bulkPricing && product.bulkPricing.length) {
    const tiers = [...product.bulkPricing].sort((a, b) => a.minQty - b.minQty);
    for (const t of tiers) {
      if (qty >= t.minQty) {
        price = t.priceCents;
        bulk = true;
      }
    }
  }
  return { price, bulk };
}

export function spendingTierFor(subtotalCents: number, tiers: SpendingTier[]): { current?: SpendingTier; next?: SpendingTier } {
  const sorted = [...tiers].sort((a, b) => a.minCents - b.minCents);
  let current: SpendingTier | undefined;
  let next: SpendingTier | undefined;
  for (const t of sorted) {
    if (subtotalCents >= t.minCents) current = t;
    else if (!next) next = t;
  }
  return { current, next };
}

export function clampQty(product: Product, qty: number): number {
  const min = product.minQty ?? 1;
  const max = product.maxQty ?? 10000;
  let q = Math.floor(Number.isFinite(qty) ? qty : min);
  if (q < min) q = min;
  if (q > max) q = max;
  if (product.stock !== null && product.stock !== undefined && q > product.stock) q = product.stock;
  return q;
}

export interface QuoteOptions {
  salePercent?: number;
  tiers?: SpendingTier[];
  coupon?: Coupon | null;
  couponCode?: string;
  /** referral code accepted → friendPercent applies (only when no coupon) */
  referralPercent?: number;
  referralCode?: string;
  /** store credit available to apply */
  creditAvailableCents?: number;
  applyCredit?: boolean;
  /** username (lowercase) for bound coupons */
  username?: string;
  now?: Date;
}

/**
 * Deterministic quote computation. The SERVER result is authoritative; the
 * client uses the same function for the live preview.
 */
export function computeQuote(products: Product[], items: CartLineInput[], opts: QuoteOptions = {}): Quote {
  const byId = new Map(products.map((p) => [p.id, p]));
  const warnings: string[] = [];
  const lines: QuoteLine[] = [];

  for (const it of items) {
    const p = byId.get(it.productId);
    if (!p || p.hidden) {
      warnings.push(`Item ${it.productId} is no longer available.`);
      continue;
    }
    if (p.stock !== null && p.stock <= 0) {
      warnings.push(`${p.name} is sold out.`);
      continue;
    }
    const qty = clampQty(p, it.qty);
    if (qty <= 0) continue;
    const { price, bulk } = unitPriceCents(p, qty);
    lines.push({
      productId: p.id,
      name: p.name,
      image: p.image,
      qty,
      unitPriceCents: price,
      basePriceCents: p.priceCents,
      lineTotalCents: price * qty,
      bulkApplied: bulk,
      kind: p.kind,
    });
  }

  const subtotalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0);

  // 1) site-wide sale
  const salePercent = Math.max(0, Math.min(90, opts.salePercent ?? 0));
  const saleDiscountCents = Math.round((subtotalCents * salePercent) / 100);
  let running = subtotalCents - saleDiscountCents;

  // 2) spending tier (based on subtotal before coupons)
  const tiers = opts.tiers ?? [];
  const { current, next } = spendingTierFor(subtotalCents, tiers);
  const tierPercent = current?.percent ?? 0;
  const tierDiscountCents = Math.round((running * tierPercent) / 100);
  running -= tierDiscountCents;

  // 3) coupon OR referral (coupon wins)
  let couponDiscountCents = 0;
  let referralDiscountCents = 0;
  let couponCode: string | undefined;
  let referralCode: string | undefined;
  const now = opts.now ?? new Date();

  if (opts.coupon) {
    const c = opts.coupon;
    const problems: string[] = [];
    if (!c.active) problems.push('This code is no longer active.');
    if (c.expiresAt && new Date(c.expiresAt).getTime() < now.getTime()) problems.push('This code has expired.');
    if (c.maxUses !== undefined && c.uses >= c.maxUses) problems.push('This code has already been used.');
    if (c.boundUsername && opts.username && c.boundUsername !== opts.username.toLowerCase())
      problems.push('This code belongs to a different Minecraft account.');
    if (c.minOrderCents && subtotalCents < c.minOrderCents)
      problems.push(`This code needs a minimum order of ${formatUsd(c.minOrderCents)}.`);
    if (problems.length) {
      warnings.push(...problems);
    } else {
      couponCode = c.code;
      couponDiscountCents = c.type === 'percent' ? Math.round((running * c.value) / 100) : Math.min(running, c.value);
    }
  } else if (opts.couponCode) {
    warnings.push('Unknown discount code.');
  }

  if (!couponCode && opts.referralPercent && opts.referralCode) {
    referralCode = opts.referralCode;
    referralDiscountCents = Math.round((running * opts.referralPercent) / 100);
  } else if (couponCode && opts.referralCode) {
    warnings.push('Referral discount cannot be combined with a coupon – the coupon was applied.');
  }
  running -= couponDiscountCents + referralDiscountCents;

  // cap total discount
  const maxDiscount = Math.round((subtotalCents * MAX_TOTAL_DISCOUNT_PERCENT) / 100);
  const totalDiscount = saleDiscountCents + tierDiscountCents + couponDiscountCents + referralDiscountCents;
  if (totalDiscount > maxDiscount) {
    const overflow = totalDiscount - maxDiscount;
    // reduce the coupon/referral part first
    if (couponDiscountCents >= overflow) couponDiscountCents -= overflow;
    else if (referralDiscountCents >= overflow) referralDiscountCents -= overflow;
    running = subtotalCents - (saleDiscountCents + tierDiscountCents + couponDiscountCents + referralDiscountCents);
    warnings.push(`Discounts are capped at ${MAX_TOTAL_DISCOUNT_PERCENT}%.`);
  }

  // 4) store credit
  let creditAppliedCents = 0;
  if (opts.applyCredit && (opts.creditAvailableCents ?? 0) > 0) {
    creditAppliedCents = Math.min(running, opts.creditAvailableCents ?? 0);
    running -= creditAppliedCents;
  }

  const totalCents = Math.max(0, running);

  return {
    lines,
    subtotalCents,
    salePercent,
    saleDiscountCents,
    tierPercent,
    tierDiscountCents,
    nextTier: next ? { minCents: next.minCents, percent: next.percent, missingCents: Math.max(0, next.minCents - subtotalCents) } : undefined,
    couponCode,
    couponDiscountCents,
    referralCode,
    referralDiscountCents,
    creditAppliedCents,
    totalCents,
    warnings,
  };
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Format cents in a display currency (rate = 1 USD in that currency). */
export function formatMoney(cents: number, currency?: { code: string; symbol: string; rate: number } | null): string {
  if (!currency || currency.code === 'USD') return formatUsd(cents);
  const v = (cents / 100) * currency.rate;
  const zeroDecimal = ['JPY', 'KRW'].includes(currency.code);
  return `${currency.symbol}${zeroDecimal ? Math.round(v).toLocaleString('en-US') : v.toFixed(2)}`;
}

/** "25M", "1.5B", "250K" style formatter for in-game money */
export function formatMillions(millions: number): string {
  if (millions >= 1000) {
    const b = millions / 1000;
    return `${Number.isInteger(b) ? b : b.toFixed(1)}B`;
  }
  if (millions < 1) return `${Math.round(millions * 1000)}K`;
  return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`;
}
