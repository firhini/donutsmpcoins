/**
 * Shared domain types – used by BOTH the React frontend (src/) and the
 * Netlify functions (netlify/). Keep this file free of runtime imports.
 */

// ───────────────────────── Catalog ─────────────────────────

export type CategoryId =
  | 'money'
  | 'spawners'
  | 'mystery'
  | 'investments'
  | 'armor'
  | 'tools'
  | 'bundles'
  | 'bases';

export interface Category {
  id: CategoryId;
  name: string;
  slug: string;
  tagline: string;
  /** path under /public, e.g. /img/categories/money.svg */
  icon: string;
  order: number;
}

export interface BulkTier {
  minQty: number;
  priceCents: number;
}

/** One possible (box) or fixed (kit/bundle) content line. */
export interface BoxContent {
  name: string;
  min: number;
  max: number;
  /** relative weight for random boxes (default 1) */
  weight?: number;
  /** optional link to a catalog product (for image lookup) */
  productId?: string;
  /** optional explicit image path */
  image?: string;
  /** rarity label shown in UI */
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export type ProductKind = 'money' | 'item' | 'box' | 'bundle' | 'kit' | 'base';

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDesc?: string;
  description?: string;
  categoryId: CategoryId;
  /** base unit price in USD cents */
  priceCents: number;
  /** strike-through price (marketing) */
  compareAtCents?: number;
  /** null = unlimited */
  stock: number | null;
  bulkPricing?: BulkTier[];
  /** e.g. 'Instant', 'Hot', 'New', 'Best value', 'Popular' */
  tags?: string[];
  featured?: boolean;
  sortOrder?: number;
  /** path under /public, e.g. /img/products/skeleton-spawner.svg */
  image: string;
  kind: ProductKind;
  /** e.g. 'per 1M' */
  unitLabel?: string;
  /** for money products: how many millions one unit represents */
  moneyMillions?: number;
  /** box: random pool; kit/bundle: fixed list */
  contents?: BoxContent[];
  /** bundle: catalog products included */
  bundleItems?: { productId: string; quantity: number }[];
  /** how many random lines a box rolls (default 3) */
  boxRolls?: number;
  minQty?: number;
  maxQty?: number;
  hidden?: boolean;
  deliveryNote?: string;
}

export interface Catalog {
  categories: Category[];
  products: Product[];
}

// ───────────────────────── Pricing / Quote ─────────────────────────

export interface CartLineInput {
  productId: string;
  qty: number;
}

export interface QuoteLine {
  productId: string;
  name: string;
  image: string;
  qty: number;
  unitPriceCents: number;
  basePriceCents: number;
  lineTotalCents: number;
  bulkApplied: boolean;
  kind: ProductKind;
}

export interface Quote {
  lines: QuoteLine[];
  subtotalCents: number;
  salePercent: number;
  saleDiscountCents: number;
  tierPercent: number;
  tierDiscountCents: number;
  /** next spending tier the customer could reach, if any */
  nextTier?: { minCents: number; percent: number; missingCents: number };
  couponCode?: string;
  couponDiscountCents: number;
  referralCode?: string;
  referralDiscountCents: number;
  creditAppliedCents: number;
  totalCents: number;
  /** human readable warnings (e.g. coupon min order not met) */
  warnings: string[];
}

export interface SpendingTier {
  minCents: number;
  percent: number;
}

// ───────────────────────── Coupons ─────────────────────────

export type CouponSource = 'admin' | 'spin' | 'review' | 'referral' | 'giveaway' | 'welcome';

export interface Coupon {
  code: string;
  type: 'percent' | 'fixed';
  /** percent (1-100) or cents */
  value: number;
  minOrderCents?: number;
  /** total uses allowed (undefined = unlimited) */
  maxUses?: number;
  uses: number;
  expiresAt?: string;
  /** restrict to a Minecraft username (lowercase) */
  boundUsername?: string;
  source: CouponSource;
  active: boolean;
  createdAt: string;
  note?: string;
}

// ───────────────────────── Orders ─────────────────────────

export type OrderStatus =
  | 'awaiting_payment'
  | 'paid'
  | 'delivering'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'unpaid' | 'pending_review' | 'paid' | 'refunded' | 'failed';

export interface RolledContent {
  name: string;
  qty: number;
  rarity?: BoxContent['rarity'];
  image?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  kind: ProductKind;
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
  /** for mystery boxes: what the server rolled (one array per box opened) */
  rolled?: RolledContent[][];
  /** for bundles/kits: fixed contents for the fulfiller */
  contents?: RolledContent[];
  moneyMillions?: number;
}

export interface OrderPayment {
  /** payment method id from settings (e.g. 'paypal', 'stripe', 'crypto-btc', 'free') */
  methodId: string;
  methodName: string;
  type: 'manual' | 'stripe' | 'paypal' | 'nowpayments' | 'free';
  status: PaymentStatus;
  /** customer-supplied reference / tx id / paypal email */
  reference?: string;
  referenceNote?: string;
  /** provider ids */
  providerId?: string;
  providerUrl?: string;
  paidAt?: string;
  /** rendered instructions (manual methods) */
  instructions?: string;
  payLink?: string;
  /** manual methods: the pay-to handle / wallet address / e-mail (copyable in the UI) */
  handle?: string;
}

export interface TimelineEntry {
  at: string;
  status: OrderStatus | 'note' | 'payment_reference' | 'payment_pending';
  note?: string;
}

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  username: string;
  usernameUuid?: string;
  email?: string;
  items: OrderItem[];
  quote: Quote;
  totalCents: number;
  displayCurrency?: string;
  discountCode?: string;
  referralCode?: string;
  creditAppliedCents: number;
  payment: OrderPayment;
  status: OrderStatus;
  timeline: TimelineEntry[];
  customerNote?: string;
  adminNote?: string;
  ipHash?: string;
  deviceId?: string;
  reviewed?: boolean;
  /** store-credit reward already granted to referrer */
  referralRewarded?: boolean;
  /** amount granted to the referrer (reverted on refund/cancel) */
  referralRewardCents?: number;
  /** applied store credit was returned (cancel/refund) */
  creditRestored?: boolean;
  /** reserved stock was given back (cancel/refund) */
  stockRestored?: boolean;
  /** consumed coupon use was given back (cancel/refund) */
  couponRestored?: boolean;
  source?: 'checkout' | 'redeem' | 'spin' | 'giveaway' | 'admin';
  /** Discord account that placed the order (when logged in) */
  discordUserId?: string;
  discordUsername?: string;
}

/** What the public order page is allowed to see */
export type PublicOrder = Omit<Order, 'ipHash' | 'deviceId' | 'adminNote' | 'email'> & {
  emailMasked?: string;
};

export interface OrderIndexEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  username: string;
  totalCents: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  methodId: string;
  itemsSummary: string;
  referralCode?: string;
  discordUserId?: string;
}

// ───────────────────────── Gift codes ─────────────────────────

/** Admin-created code that a player redeems for a free item (creates a free order). */
export interface GiftCode {
  code: string;
  productId: string;
  qty: number;
  uses: number;
  maxUses?: number;
  expiresAt?: string;
  note?: string;
  createdAt?: string;
}

// ───────────────────────── Reviews ─────────────────────────

export interface Review {
  id: string;
  orderId: string;
  username: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  rewardCode?: string;
  productNames?: string[];
}

/** Review as published on the site – never exposes the order id or the reward code. */
export type PublicReview = Omit<Review, 'orderId' | 'rewardCode'>;

export interface ReviewStats {
  count: number;
  averageRating: number;
}

// ───────────────────────── Giveaways ─────────────────────────

export interface Giveaway {
  id: string;
  title: string;
  description?: string;
  prize: string;
  image?: string;
  startsAt: string;
  endsAt: string;
  status: 'active' | 'ended' | 'drawn';
  entriesCount: number;
  winners?: string[];
  maxWinners: number;
  createdAt: string;
}

export interface GiveawayEntry {
  giveawayId: string;
  username: string;
  createdAt: string;
  ipHash?: string;
  deviceId?: string;
}

// ───────────────────────── Spin wheel ─────────────────────────

export type SpinPrizeType = 'coupon' | 'free_item' | 'credit' | 'nothing';

export interface SpinPrize {
  id: string;
  label: string;
  type: SpinPrizeType;
  /** for coupon: percent off */
  percent?: number;
  /** for coupon: minimum order */
  minOrderCents?: number;
  /** for free_item: product + qty */
  productId?: string;
  qty?: number;
  /** for credit: store credit in cents */
  creditCents?: number;
  /** relative probability weight */
  weight: number;
  /** wheel segment color */
  color?: string;
  /** coupon validity in days (default 7) */
  validDays?: number;
}

export interface SpinResult {
  prize: SpinPrize;
  /** index of the prize in the public prize list (for the wheel animation) */
  index: number;
  code?: string;
  /** message to show */
  message: string;
  nextSpinAt: string;
  /** for free items: created order id (needs username) */
  orderId?: string;
  creditCents?: number;
}

export interface SpinStatus {
  enabled: boolean;
  canSpin: boolean;
  nextSpinAt?: string;
  prizes: Omit<SpinPrize, 'weight'>[];
  cooldownHours: number;
  /** Discord login gate */
  loginRequired?: boolean;
  loggedIn?: boolean;
  guildRequired?: boolean;
  inGuild?: boolean;
}

// ───────────────────────── Discord accounts ─────────────────────────

export interface WonPrize {
  at: string;
  label: string;
  type: SpinPrizeType | 'gift' | 'giveaway';
  code?: string;
  orderId?: string;
  creditCents?: number;
  expiresAt?: string;
}

/** Stored profile of a Discord-authenticated player (server-side). */
export interface UserProfile {
  id: string;
  username: string;
  globalName?: string;
  avatar?: string;
  /** saved Minecraft username (delivery target) */
  mcUsername?: string;
  inGuild?: boolean;
  guildCheckedAt?: string;
  createdAt: string;
  lastLoginAt: string;
  logins: number;
  prizes: WonPrize[];
  orderIds: string[];
}

/** What the browser sees about the logged-in user. */
export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  mcUsername?: string;
  inGuild?: boolean;
}

export interface AccountSummary {
  user: PublicUser;
  creditCents: number;
  orders: OrderIndexEntry[];
  prizes: WonPrize[];
  referral: { code?: string; referrals: number; earnedCents: number };
}

// ───────────────────────── Store credit / referral ─────────────────────────

export interface CreditAccount {
  username: string; // lowercase
  balanceCents: number;
  history: { at: string; deltaCents: number; reason: string; orderId?: string }[];
}

// ───────────────────────── Settings ─────────────────────────

export type PaymentMethodType = 'manual' | 'stripe' | 'paypal' | 'nowpayments';

export interface PaymentMethodConfig {
  id: string;
  type: PaymentMethodType;
  enabled: boolean;
  name: string;
  description?: string;
  /** icon key for the UI: 'paypal' | 'card' | 'bitcoin' | 'ethereum' | 'litecoin' | 'tether' | 'bank' | 'revolut' | 'giftcard' | 'generic' */
  icon?: string;
  /** manual: instructions shown after order creation. Placeholders: {{orderId}} {{total}} ($8.50) {{amount}} (8.50) {{username}} {{handle}} */
  instructions?: string;
  /** manual: your handle / address / IBAN / email */
  handle?: string;
  /** manual: optional pay link template. Placeholders: {{handle}} {{amount}} (e.g. 8.50) {{total}} (e.g. $8.50) {{orderId}} */
  linkTemplate?: string;
  /** label for the reference the customer sends back ("Transaction ID", "PayPal e-mail") */
  referenceLabel?: string;
  feePercent?: number;
  minCents?: number;
  sortOrder?: number;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  /** 1 USD = rate */
  rate: number;
}

export interface SiteSettings {
  storeName: string;
  tagline: string;
  discordInvite: string;
  supportEmail?: string;
  announcement: { enabled: boolean; text: string; link?: string };
  sale: { enabled: boolean; percent: number; label: string; endsAt?: string };
  spendingTiers: SpendingTier[];
  paymentMethods: PaymentMethodConfig[];
  spin: {
    enabled: boolean;
    cooldownHours: number;
    prizes: SpinPrize[];
    requireUsername: boolean;
    /** players must log in with Discord to spin (only effective when Discord OAuth is configured) */
    requireLogin: boolean;
    /** players must be a member of your Discord server (needs DISCORD_GUILD_ID) */
    requireGuild: boolean;
  };
  referral: { enabled: boolean; friendPercent: number; referrerPercent: number };
  reviewRewardPercent: number;
  welcomeCoupon: { enabled: boolean; code: string; percent: number };
  currencies: CurrencyConfig[];
  delivery: {
    moneyText: string;
    itemText: string;
    /** the in-game account that delivers (shown to customers) */
    staffUsername?: string;
    etaText: string;
  };
  stats: {
    /** optional manual offset added to the live delivered-orders counter (e.g. orders from before this site) */
    ordersOffset: number;
  };
  maintenance: { enabled: boolean; message: string };
  serverName: string;
  serverIp: string;
}

/** Settings subset exposed to the public frontend (no secrets, handles only for enabled manual methods) */
export interface PublicConfig {
  storeName: string;
  tagline: string;
  discordInvite: string;
  supportEmail?: string;
  announcement: SiteSettings['announcement'];
  sale: SiteSettings['sale'];
  spendingTiers: SpendingTier[];
  paymentMethods: Pick<PaymentMethodConfig, 'id' | 'type' | 'name' | 'description' | 'icon' | 'feePercent' | 'minCents' | 'sortOrder' | 'referenceLabel'>[];
  spinEnabled: boolean;
  spinRequireUsername: boolean;
  spinCooldownHours: number;
  spinRequireLogin: boolean;
  spinRequireGuild: boolean;
  referral: SiteSettings['referral'];
  reviewRewardPercent: number;
  welcomeCoupon: SiteSettings['welcomeCoupon'];
  currencies: CurrencyConfig[];
  delivery: SiteSettings['delivery'];
  maintenance: SiteSettings['maintenance'];
  serverName: string;
  serverIp: string;
  /** which integrations are configured on the server */
  integrations: { stripe: boolean; paypal: boolean; nowpayments: boolean; discord: boolean; discordOAuth: boolean };
  paypalClientId?: string;
}

export interface SiteStats {
  ordersDelivered: number;
  reviewCount: number;
  averageRating: number;
  spinsToday?: number;
}

// ───────────────────────── API payloads ─────────────────────────

export interface CreateOrderRequest {
  username: string;
  email?: string;
  items: CartLineInput[];
  discountCode?: string;
  referralCode?: string;
  applyCredit?: boolean;
  paymentMethodId: string;
  displayCurrency?: string;
  tosAccepted: boolean;
  customerNote?: string;
  deviceId?: string;
}

export interface QuoteRequest {
  items: CartLineInput[];
  discountCode?: string;
  referralCode?: string;
  username?: string;
  applyCredit?: boolean;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}
