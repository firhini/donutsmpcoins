/**
 * Central order creation. Used by:
 *  - POST /orders (checkout)
 *  - spin wheel free items, gift-code redemption, giveaways, admin (free orders)
 */
import type { CartLineInput, Order, OrderItem, PaymentMethodConfig, Product, Quote } from '../../src/shared/types';
import { dealUsed, releaseDeal, reserveDeal } from './dailyDeal';
import { applyDailyDeal, applySale, computeQuote, dealOfTheDay } from '../../src/shared/pricing';
import { getCatalog, getFullCatalog, decrementStock, restoreStock } from './catalog';
import { getSettings, usablePaymentMethods, renderTemplate } from './settings';
import { getCoupon, consumeCoupon, unconsumeCoupon, normalizeCode } from './coupons';
import { listOrderIndex } from './orders';
import { getCredit, addCredit, debitCredit } from './credit';
import { rollBox, kitContents } from './boxes';
import { saveNewOrder, announceNewOrder } from './orders';
import { orderId } from './ids';
import { HttpError, MC_USERNAME_RE, nowIso } from './http';

export interface BuildOrderInput {
  username: string;
  email?: string;
  items: CartLineInput[];
  discountCode?: string;
  referralCode?: string;
  applyCredit?: boolean;
  paymentMethodId?: string;
  displayCurrency?: string;
  customerNote?: string;
  deviceId?: string;
  sessionId?: string;
  ipHash?: string;
  source?: Order['source'];
  /** Discord account of the buyer (from the session cookie) */
  discordUserId?: string;
  discordUsername?: string;
  /** force a free order (spin / redeem / giveaway / admin). Items are given away regardless of price. */
  free?: boolean;
  freeReason?: string;
}

export interface ServerQuoteInput {
  items: CartLineInput[];
  discountCode?: string;
  referralCode?: string;
  username?: string;
  applyCredit?: boolean;
  /** free orders (spin / gift / admin) may contain products hidden from the public shop */
  includeHidden?: boolean;
  /** hashed IP – the daily deal limit also counts per connection */
  ipHash?: string;
}

/** Server-side quote with coupon / referral / credit lookups. */
export async function serverQuote(input: ServerQuoteInput): Promise<{ quote: Quote; products: Product[] }> {
  const [catalog, settings] = await Promise.all([input.includeHidden ? getFullCatalog() : getCatalog(), getSettings()]);
  const username = input.username?.trim();
  let coupon = input.discountCode ? await getCoupon(input.discountCode) : null;
  const welcomeWarnings: string[] = [];
  if (input.discountCode && settings.welcomeCoupon.enabled && normalizeCode(input.discountCode) === normalizeCode(settings.welcomeCoupon.code)) {
    // The advertised welcome code is virtual (no stored record needed) and only valid for a player's first order.
    if (username && (await hasPreviousOrder(username))) {
      coupon = null;
      welcomeWarnings.push('The welcome code is only valid on your first order.');
    } else if (!coupon) {
      coupon = {
        code: normalizeCode(settings.welcomeCoupon.code),
        type: 'percent',
        value: settings.welcomeCoupon.percent,
        uses: 0,
        source: 'welcome',
        active: true,
        createdAt: '',
      };
    }
  }

  let referralPercent = 0;
  let referralCode: string | undefined;
  if (settings.referral.enabled && input.referralCode) {
    const ref = input.referralCode.trim();
    if (MC_USERNAME_RE.test(ref) && (!username || ref.toLowerCase() !== username.toLowerCase())) {
      referralPercent = settings.referral.friendPercent;
      referralCode = ref;
    }
  }

  let creditAvailableCents = 0;
  if (input.applyCredit && username) {
    creditAvailableCents = (await getCredit(username)).balanceCents;
  }

  // a running sale is baked into the product prices (same helper as the storefront)
  // free orders (prizes/gifts) ignore deal prices and limits
  const products = input.includeHidden ? applySale(catalog.products, settings.sale) : applyDailyDeal(applySale(catalog.products, settings.sale), settings.dailyDeal);
  // how many deal units this player may still get today (the rest of the line is priced normally)
  let dealAllowance: Record<string, number> | undefined;
  const deal = input.includeHidden ? null : dealOfTheDay(settings.dailyDeal);
  if (deal && (username || input.ipHash) && input.items.some((i) => i.productId === deal.productId)) {
    const used = await dealUsed(deal.date, deal.productId, username, input.ipHash).catch(() => 0);
    dealAllowance = { [deal.productId]: Math.max(0, deal.maxPerPlayer - used) };
  }
  const quote = computeQuote(products, input.items, {
    dealAllowance,
    tiers: settings.spendingTiers,
    coupon,
    couponCode: input.discountCode?.trim() || undefined,
    referralPercent,
    referralCode,
    creditAvailableCents,
    applyCredit: !!input.applyCredit,
    username,
    allowHidden: !!input.includeHidden,
  });
  if (input.referralCode && !referralCode && username && input.referralCode.trim().toLowerCase() === username.toLowerCase()) {
    quote.warnings.push('You cannot refer yourself.');
  }
  if (welcomeWarnings.length) {
    quote.warnings = quote.warnings.filter((w) => w !== 'Unknown discount code.');
    quote.warnings.push(...welcomeWarnings);
  }
  return { quote, products };
}

/** True when the player already has an open or completed order (welcome code is first-order only). */
export async function hasPreviousOrder(username: string): Promise<boolean> {
  const u = username.toLowerCase();
  const idx = await listOrderIndex();
  return idx.some((e) => e.username.toLowerCase() === u && e.status !== 'cancelled' && e.status !== 'refunded');
}

function buildItems(quote: Quote, products: Product[]): OrderItem[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return quote.lines.map((l) => {
    const p = byId.get(l.productId)!;
    const item: OrderItem = {
      productId: p.id,
      name: p.name,
      image: p.image,
      kind: p.kind,
      qty: l.qty,
      unitPriceCents: l.unitPriceCents,
      lineTotalCents: l.lineTotalCents,
      moneyMillions: p.moneyMillions,
    };
    if (p.kind === 'box') {
      item.rolled = Array.from({ length: Math.min(l.qty, 100) }, () => rollBox(p));
    } else if (p.kind === 'kit') {
      item.contents = kitContents(p);
    } else if (p.kind === 'bundle') {
      item.contents = (p.bundleItems ?? []).map((b) => {
        const bp = byId.get(b.productId);
        return { name: bp ? (bp.kind === 'money' ? `${b.quantity * (bp.moneyMillions ?? 1)}M Money` : bp.name) : b.productId, qty: bp?.kind === 'money' ? 1 : b.quantity, image: bp?.image };
      });
      // boxes inside a bundle are rolled like standalone boxes, so the fulfiller knows what to hand out
      const rolled = (p.bundleItems ?? []).flatMap((b) => {
        const bp = byId.get(b.productId);
        return bp?.kind === 'box' ? Array.from({ length: Math.min(b.quantity * l.qty, 100) }, () => rollBox(bp)) : [];
      });
      if (rolled.length) item.rolled = rolled;
    }
    return item;
  });
}

export async function buildOrder(input: BuildOrderInput): Promise<Order> {
  const username = input.username.trim();
  if (!MC_USERNAME_RE.test(username)) throw new HttpError(400, 'Invalid Minecraft username.', 'validation');
  if (!input.items?.length) throw new HttpError(400, 'Your cart is empty.', 'validation');
  if (input.items.length > 20) throw new HttpError(400, 'Too many different items in one order (max 20).', 'validation');

  const settings = await getSettings();
  if (settings.maintenance.enabled && !input.free) throw new HttpError(503, settings.maintenance.message, 'maintenance');

  const { quote, products } = await serverQuote({
    items: input.items,
    discountCode: input.free ? undefined : input.discountCode,
    referralCode: input.free ? undefined : input.referralCode,
    username,
    applyCredit: input.free ? false : input.applyCredit,
    includeHidden: !!input.free,
    ipHash: input.ipHash,
  });
  if (!quote.lines.length) throw new HttpError(400, quote.warnings[0] || 'No purchasable items in cart.', 'validation');

  const isFree = !!input.free || quote.totalCents === 0;
  let method: PaymentMethodConfig | undefined;
  if (!isFree) {
    method = usablePaymentMethods(settings).find((m) => m.id === input.paymentMethodId);
    if (!method) throw new HttpError(400, 'Please choose a valid payment method.', 'validation');
    if (method.minCents && quote.totalCents < method.minCents)
      throw new HttpError(400, `${method.name} needs a minimum order of $${(method.minCents / 100).toFixed(2)}.`, 'validation');
  }

  const totalCents = isFree ? 0 : quote.totalCents + (method?.feePercent ? Math.round((quote.totalCents * method.feePercent) / 100) : 0);
  const id = orderId();
  const now = nowIso();
  const totalStr = `$${(totalCents / 100).toFixed(2)}`;
  const vars = { orderId: id, total: totalStr, amount: (totalCents / 100).toFixed(2), username, handle: method?.handle ?? '' };

  const order: Order = {
    id,
    createdAt: now,
    updatedAt: now,
    username,
    email: input.email?.trim() || undefined,
    items: buildItems(quote, products),
    quote: isFree ? { ...quote, totalCents: 0 } : quote,
    totalCents,
    displayCurrency: input.displayCurrency,
    discountCode: quote.couponCode,
    referralCode: quote.referralCode,
    creditAppliedCents: input.free ? 0 : quote.creditAppliedCents,
    payment: isFree
      ? { methodId: 'free', methodName: input.freeReason ?? (quote.creditAppliedCents > 0 ? 'Store credit' : 'Free'), type: 'free', status: 'paid', paidAt: now }
      : {
          methodId: method!.id,
          methodName: method!.name,
          type: method!.type,
          status: 'unpaid',
          instructions: renderTemplate(method!.instructions, vars),
          payLink: renderTemplate(method!.linkTemplate, vars),
          handle: method!.type === 'manual' ? method!.handle : undefined,
        },
    status: isFree ? 'paid' : 'awaiting_payment',
    timeline: [{ at: now, status: isFree ? 'paid' : 'awaiting_payment', note: isFree ? input.freeReason ?? (quote.creditAppliedCents > 0 ? 'Paid with store credit' : 'Free order') : `Order placed · ${method!.name}` }],
    customerNote: input.customerNote?.trim().slice(0, 500) || undefined,
    ipHash: input.ipHash,
    deviceId: input.deviceId,
    sessionId: input.sessionId,
    source: input.source ?? 'checkout',
    discordUserId: input.discordUserId,
    discordUsername: input.discordUsername,
  };

  // daily deal: at most `maxPerPlayer` units per player and day at the deal price
  const dealProduct = input.free ? undefined : products.find((p) => p.dailyDeal && quote.lines.some((l) => l.productId === p.id));
  const dealLine = dealProduct ? quote.lines.find((l) => l.productId === dealProduct.id && (l.dealQty ?? 0) > 0) : undefined;
  if (dealProduct?.dailyDeal && dealLine) {
    // the deal's own UTC day (it ends at the next midnight)
    order.dealUsage = { date: new Date(new Date(dealProduct.dailyDeal.endsAt).getTime() - 86_400_000).toISOString().slice(0, 10), productId: dealProduct.id, qty: dealLine.dealQty ?? dealLine.qty, ipHash: input.ipHash };
  }

  // side effects – each step is atomic; later failures roll earlier steps back
  const stockLines = quote.lines.map((l) => ({ productId: l.productId, qty: l.qty }));
  let dealTaken = false;
  let creditTaken = false;
  let couponTaken = false;
  let stockTaken = false;
  try {
    if (order.dealUsage && dealProduct?.dailyDeal) {
      await reserveDeal(order.dealUsage.date, order.dealUsage.productId, username, input.ipHash, order.dealUsage.qty, dealProduct.dailyDeal.maxPerPlayer);
      dealTaken = true;
    }
    if (!input.free && quote.creditAppliedCents > 0) {
      await debitCredit(username, quote.creditAppliedCents, 'Applied to order', id);
      creditTaken = true;
    }
    if (!input.free && quote.couponCode) {
      await consumeCoupon(quote.couponCode, username);
      couponTaken = true;
    }
    await decrementStock(stockLines);
    stockTaken = true;
    await saveNewOrder(order);
  } catch (err) {
    if (stockTaken) await restoreStock(stockLines).catch(() => undefined);
    if (dealTaken && order.dealUsage) await releaseDeal(order.dealUsage.date, order.dealUsage.productId, username, input.ipHash, order.dealUsage.qty).catch(() => undefined);
    if (couponTaken && quote.couponCode) await unconsumeCoupon(quote.couponCode).catch(() => undefined);
    if (creditTaken) await addCredit(username, quote.creditAppliedCents, 'Order failed – credit returned', id).catch(() => undefined);
    throw err;
  }
  await announceNewOrder(order);
  return order;
}

/** Convenience: free order for prizes / gifts. */
export async function createFreeOrder(username: string, items: CartLineInput[], source: Order['source'], reason: string, extra: Partial<BuildOrderInput> = {}): Promise<Order> {
  return buildOrder({ username, items, free: true, freeReason: reason, source, ...extra });
}
