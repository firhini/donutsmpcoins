# DonutCoins – Architecture & Build Contract

A DonutSMP (Minecraft) item/money store. Vite + React 19 + TypeScript SPA, Netlify Functions backend
(single catch-all function `netlify/functions/api.ts` routing `/api/*`), storage in **Netlify Blobs**
(local fallback: JSON files in `.data/`). Hosted on Netlify from GitHub.

The store owner (one person) fulfils orders **manually** in-game (no delivery bot). The site therefore:
1. takes orders (Minecraft username + items), 2. shows payment instructions / redirects to a payment
provider, 3. lets the customer report the payment reference, 4. notifies the owner on Discord,
5. the owner marks orders paid/delivered in `/admin`, 6. the customer tracks the order at `/order/:id`.

Original inspiration: donut.market (we do NOT copy their assets/text – everything is original).

## Repo map

```
src/
  shared/types.ts      ← ALL domain types (frontend + backend). Read this first.
  shared/pricing.ts    ← computeQuote() – bulk tiers, sale, spending tiers, coupon, referral, credit.
  data/catalog.ts      ← default products/categories (admin overrides merged server-side)
  data/settings.ts     ← default SiteSettings (payment methods, spin prizes, tiers, currencies…)
  lib/api.ts           ← api()/apiGet/apiPost… fetch wrapper (throws ApiClientError{status,message})
  lib/device.ts        ← getDeviceId(), storageGet/Set
  context/StoreContext ← useStore(): config (PublicConfig), catalog, products, categories, stats, fmt(cents), currency
  context/CartContext  ← useCart(): items/lines/count/add/setQty/remove/clear/quote/open/close, discountCode, referralCode
  context/ToastContext ← useToast().toast(msg, 'success'|'error'|'info'|'gold')
  components/ui/       ← Icon (name list in Icons.tsx), Modal, Price, Seo
  components/layout/   ← Header, Footer, Layout (Outlet + CartDrawer)
  components/cart/CartDrawer.tsx ← PLACEHOLDER (cart builder replaces)
  pages/…              ← one file per route (see App.tsx). PLACEHOLDER files exist – overwrite them.
  styles/tokens.css    ← design tokens (colors, fonts, radii, shadows)
  styles/base.css      ← reset + primitives: .container .section .card .btn(-primary/-pink/-secondary/-ghost/-outline/-danger/-sm/-lg/-block/-icon) .badge(-gold/-pink/-green/-blue/-violet/-red) .pill .input .select .textarea .label .field .checkbox .qty .alert(-info/-success/-warn/-danger) .skeleton .spinner .mc-chat .code-box .rarity-*
  styles/ui.css        ← toasts, modal, price, header, footer, .page, .page-head, .breadcrumbs, .empty
netlify/
  functions/api.ts     ← entry: dispatch(routes)
  api/routes.ts        ← aggregates route modules below (each exports `routes: Route[]`)
  api/catalog.ts  mc.ts  orders.ts  payments.ts  promo.ts  social.ts  admin.ts   ← PLACEHOLDERS, backend builders fill them
  lib/http.ts          ← json(), error(), readJson(), HttpError, Route/dispatch (':param' and '*' patterns), requireString/optionalString/requireUsername, getIp/hashIp, nowIso
  lib/store.ts         ← kvGet/kvSet/kvDelete/kvList/kvUpdate(store, key) – stores: orders, coupons, reviews, giveaways, giveaway-entries, spins, credit, settings, catalog, ratelimit, misc
  lib/orders.ts        ← getOrder, saveOrder, listOrderIndex, toPublicOrder, pushTimeline, setOrderStatus (side effects: referral reward, discord), announceNewOrder, countDelivered
  lib/orderBuilder.ts  ← serverQuote(input) → {quote, products}; buildOrder(input) → Order (validates, rolls boxes, stock, coupon use, credit, saves, discord); createFreeOrder(username, items, source, reason) – USE THESE, do not re-implement order creation
  lib/catalog.ts       ← getCatalog (public), getFullCatalog (admin), getProduct, getOverrides/saveOverrides, decrementStock
  lib/settings.ts      ← getSettings, saveSettings, toPublicConfig, usablePaymentMethods, integrations, renderTemplate
  lib/coupons.ts       ← getCoupon, createCoupon, consumeCoupon, listCoupons, deleteCoupon, normalizeCode
  lib/credit.ts        ← getCredit(username), addCredit(username, delta, reason, orderId)
  lib/boxes.ts         ← rollBox(product) → RolledContent[], kitContents, boxOdds
  lib/ratelimit.ts     ← rateLimit(key, max, windowSeconds) throws 429
  lib/auth.ts          ← checkPassword, issueToken, verifyToken, requireAdmin(req)
  lib/ids.ts           ← orderId(), couponCode(prefix), uuid(), weightedIndex(weights), secureInt
  lib/discord.ts       ← notifyDiscord(embed), COLORS, siteUrl()
scripts/gen-art.mjs    ← generates /public/img/**/*.svg (art builder)
scripts/vite-api-plugin.ts ← serves /api in `vite` dev by calling the function directly
public/img/products/<slug>.svg, public/img/categories/<id>.svg, public/img/brand/{logo,favicon,mascot}.svg, public/img/payments/*.svg
```

Dev: `npm run dev:vite` (Vite + local API, storage in .data/) or `npm run dev` (Netlify CLI, real Blobs sandbox).
Checks: `npm run typecheck`, `npm run build`, `npm test`.

## Conventions

* **TypeScript strict.** Import types from `src/shared/types.ts`. Never duplicate type definitions.
* **Money is USD cents (integers)** everywhere. Display via `useStore().fmt(cents)` or `<Price cents />`.
* **Server is authoritative** for prices: the frontend preview uses `computeQuote` from `src/shared/pricing.ts`, the server recomputes it from its own catalog in `POST /api/orders`.
* **Styling:** plain CSS. Each feature adds `src/styles/<feature>.css` and imports it from its page/component
  (`import '../styles/shop.css'`). Use tokens (`var(--gold-400)`, `var(--bg-2)`, `var(--r-lg)`…) and the
  primitives in base.css. Dark theme only. Must look great on mobile (375px) and desktop (1440px).
  Fonts: `var(--font-sans)` (Plus Jakarta Sans), `var(--font-pixel)` (Pixelify Sans – Minecraft flavour, use sparingly for badges/hotbar/headlines accents), `var(--font-mono)`.
* **Icons:** `<Icon name="cart" />` from `components/ui/Icons.tsx` (add new paths there if needed).
* **No fake social proof.** Never hard-code fake review counts/order counts/testimonials. Use live `useStore().stats`
  (may be null/0 → show neutral copy like "Fast delivery · Secure checkout").
* **Accessibility:** buttons have labels, inputs have labels, focus states are visible (base.css handles).
* **Routes** (App.tsx) – do not rename; add new ones only inside your area.
* Pages set `<Seo title="…" description="…" />`.
* Everything English (storefront). Keep copy short, confident, friendly. Site name: **DonutCoins** (from `config.storeName`).
* The site must build with `npm run build` and pass `npm run typecheck` – run them before you finish.

## API (all under /api, JSON). `Route` objects are matched in order.

### Public – catalog (netlify/api/catalog.ts)
* `GET /catalog` → `Catalog` (public, hidden products filtered). Cache-Control: public, max-age=30.
* `GET /config` → `PublicConfig` (toPublicConfig(getSettings())).
* `GET /stats` → `SiteStats { ordersDelivered (countDelivered + settings.stats.ordersOffset), reviewCount, averageRating }`.
* `GET /products/:id/odds` → `{ odds: {name, percent}[] }` (boxOdds).

### Public – Minecraft (netlify/api/mc.ts)
* `POST /mc/validate { username }` → `{ valid: boolean, name?: string, uuid?: string, reason?: string }` –
  validate syntax, then query `https://api.mojang.com/users/profiles/minecraft/<name>` (200 → valid; 204/404 → not found;
  on network error/429 → `{ valid: true, unverified: true }`). Rate limit 30/min per IP. Cache results in store `misc` key `mc:<lower>` for 24h.

### Public – orders (netlify/api/orders.ts)
* `POST /quote` (`QuoteRequest`) → `Quote` – simply `serverQuote(body).quote` from lib/orderBuilder.ts (coupon/referral/credit lookups are inside).
* `POST /orders` (`CreateOrderRequest`) → `{ order: PublicOrder }`.
  Validate `tosAccepted` (400 if false), rate limit 10/10min per IP (`rateLimit('orders:'+hashIp(ip), 10, 600)`), optional email format check,
  then `buildOrder({...body, ipHash, source:'checkout'})` from lib/orderBuilder.ts (it validates username/items/payment method, rolls boxes,
  decrements stock, consumes the coupon, deducts credit, saves, announces on Discord). Return `toPublicOrder(order)`.
  For `stripe`/`paypal`/`nowpayments` methods the frontend calls the payment routes next.
* `GET /orders/:id` → `{ order: PublicOrder }` (404 if unknown).
* `POST /orders/:id/reference { reference, note? }` → marks `payment.status='pending_review'`, stores reference, timeline `payment_reference`, Discord notify (COLORS.gold "Payment reported"). Only when status is `awaiting_payment`.
* `POST /orders/:id/cancel` → customer can cancel while `awaiting_payment` (restores credit, no stock restore needed).

### Public – payments (netlify/api/payments.ts) – all optional integrations, env-driven
* `POST /payments/stripe/session { orderId }` → `{ url }` – Stripe Checkout Session (line item = order total, metadata.orderId, success_url `${siteUrl()}/order/:id?paid=1`, cancel_url `/order/:id`). Store `payment.providerId`.
* `POST /payments/stripe/webhook` – verify signature with STRIPE_WEBHOOK_SECRET (raw body via `req.text()`), on `checkout.session.completed` → `setOrderStatus(order,'paid')`.
* `GET /payments/stripe/verify?orderId=` → fallback: retrieve session, if paid → mark paid (used by the order page after redirect).
* `POST /payments/paypal/create { orderId }` → `{ paypalOrderId }` (PayPal Orders v2, env PAYPAL_ENV live|sandbox).
* `POST /payments/paypal/capture { orderId, paypalOrderId }` → capture, if COMPLETED → mark paid.
* `POST /payments/nowpayments/invoice { orderId }` → `{ url }` (NOWPayments `/v1/invoice`, ipn_callback_url `${siteUrl()}/api/payments/nowpayments/ipn`, order_id = our id).
* `POST /payments/nowpayments/ipn` – verify HMAC-SHA512 with NOWPAYMENTS_IPN_SECRET (sorted-keys JSON), `payment_status` in `finished|confirmed` → paid.

### Public – promo (netlify/api/promo.ts)
* `POST /coupons/validate { code, username?, subtotalCents? }` → `{ valid, coupon?: {code,type,value,minOrderCents,expiresAt}, message }`.
* `GET /spin/status?deviceId=` → `SpinStatus` (prizes WITHOUT weights, `canSpin` from store `spins` key `${ipHash}` and `${deviceId}` last spin + cooldown).
* `POST /spin { deviceId, username? }` → `SpinResult`. Server picks prize with `weightedIndex`. Side effects:
  coupon → `createCoupon({type:'percent', value, source:'spin', prefix:'SPIN', validDays, minOrderCents, boundUsername: username})`;
  free_item → requires username (`settings.spin.requireUsername`) → creates a FREE order (status 'paid', payment.type 'free', source 'spin', `totalCents:0`) via the same order-building helper and returns `orderId`; max 1 free-item win per username per 7 days (else downgrade to a 5% coupon with message);
  credit → `addCredit`; nothing → message. Records spin for ip+device. Rate limit 10/min. Discord notify wins (COLORS.pink).
* `POST /redeem { code, username }` → redeem a *gift code* (coupons with `type:'fixed'` and `note` starting with `GIFT:` are "item codes"?) – SIMPLER: gift codes are stored in store `misc` under `gift:<CODE>` as `{ productId, qty, uses, maxUses, expiresAt, note }` (admin creates them). Redeeming creates a free order for `username`. Returns `{ order }`.
* `GET /credit?username=` → `{ balanceCents }` ; `GET /referral?username=` → `{ code, referrals, earnedCents }` (code = username).

### Public – social (netlify/api/social.ts)
* `GET /reviews?limit=50` → `{ reviews: Review[] (approved only, newest first), stats: ReviewStats }`.
* `POST /reviews { orderId, rating, comment }` → requires order status `delivered` and `!order.reviewed`; creates `status:'pending'` review; sets `order.reviewed=true`. Rate limit. Returns `{ review }`.
* `GET /giveaways` → `{ giveaways: Giveaway[] }` (active + last 5 drawn; `entriesCount` included; winners when drawn).
* `POST /giveaways/:id/enter { username, deviceId }` → one entry per username (and per device) per giveaway → `{ entered: true, entriesCount }`.

### Admin (netlify/api/admin.ts) – every route except login calls `requireAdmin(req)`.
* `POST /admin/login { password }` → `{ token, expiresAt }` (rate limit 5/15min per IP). `GET /admin/me` → `{ ok: true }`.
* `GET /admin/dashboard` → `{ counts: {awaiting, paid, delivering, delivered}, revenueCents (paid+delivered), today: {orders, revenueCents}, recent: OrderIndexEntry[10], pendingReviews, activeGiveaways, integrations }`.
* `GET /admin/orders?status=&q=&page=` → `{ orders: OrderIndexEntry[], total }` ; `GET /admin/orders/:id` → `{ order: Order }` (full).
* `PATCH /admin/orders/:id { status?, adminNote?, paymentStatus? }` → `setOrderStatus` + note → `{ order }`.
* `GET /admin/products` → full catalog + overrides; `PUT /admin/products/:id` (partial Product patch → overrides); `POST /admin/products` (custom product) ; `DELETE /admin/products/:id` (default → `deleted`, custom → removed).
* `GET /admin/coupons`, `POST /admin/coupons` (CreateCouponInput), `DELETE /admin/coupons/:code`, `PATCH /admin/coupons/:code { active }`.
* `GET /admin/gifts`, `POST /admin/gifts { productId, qty, maxUses, validDays, code? }`, `DELETE /admin/gifts/:code`.
* `GET /admin/settings` → `SiteSettings` (full); `PUT /admin/settings` (partial deep patch) → `SiteSettings`.
* `GET /admin/reviews?status=pending`, `PATCH /admin/reviews/:id { status }` – approving creates a reward coupon (`reviewRewardPercent`, source 'review', boundUsername, 30 days) stored in `review.rewardCode` and also on the order (`order.timeline` note).
* `GET /admin/giveaways`, `POST /admin/giveaways`, `PATCH /admin/giveaways/:id`, `POST /admin/giveaways/:id/draw` (secure random, `maxWinners`), `GET /admin/giveaways/:id/entries`.
* `GET /admin/credit?username=`, `POST /admin/credit { username, deltaCents, reason }`.
* `GET /admin/export/orders.csv` → CSV of the order index.

Errors: `{ error: string, code?: string }` with proper status. Validation 400, auth 401, not found 404, rate limit 429.

## Frontend route ownership

| Route | File | Builder |
|---|---|---|
| `/` | pages/Home.tsx | storefront |
| `/shop`, `/shop/:category` | pages/Shop.tsx | storefront |
| `/product/:slug` | pages/ProductPage.tsx | storefront |
| `/donutsmp-money` `/donutsmp-spawners` `/donutsmp-irl-trade` | pages/landing/* | storefront |
| `/faq` `/terms` `/refund-policy` `/privacy` `*` | pages/Faq.tsx, pages/legal/*, NotFound.tsx | storefront |
| `/cart` `/checkout` `/order/:id` `/track` + CartDrawer | pages/Cart.tsx, Checkout.tsx, OrderPage.tsx, Track.tsx, components/cart/* | cart |
| `/spin` `/free` `/redeem` `/referral` `/giveaways` `/reviews` | pages/Spin.tsx … components/free/* | free-stuff |
| `/admin/*` | pages/admin/*, components/admin/* | admin |

Shared components the storefront builder must export (others may use them):
`components/shop/ProductCard.tsx` (`<ProductCard product />` with image, badges, stock, price, qty + Add button, "What's inside?" for boxes/kits/bundles),
`components/shop/ProductGrid.tsx`, `components/shop/BoxContents.tsx` (`<BoxContents product />` list with rarity colors + odds),
`components/shop/ProductImage.tsx` (`<ProductImage product size />` – img with glow background).

## Product images
`/img/products/<slug>.svg` – every product in `src/data/catalog.ts` has `image` set; the art builder generates them.
Until then a missing image must not break layout (use `onError` fallback to `/img/products/_fallback.svg`).


## SEO / pre-rendering (added later)

* `npm run build` = client build → SSR build (`src/entry-server.tsx` → `dist-ssr/`) → `scripts/prerender.mjs`, which
  renders every route from `src/seo/routes.ts` to `dist/<route>/index.html` (home → `dist/index.html`, 404 → `dist/404.html`),
  injects per-page head tags collected by `<Seo>` (`src/seo/head.tsx`), inlines the page chunk's CSS from the Vite manifest,
  and writes `sitemap.xml` + `robots.txt`. `npm run seo:check` validates the output.
* `<Seo>` (re-exported from `components/ui/Seo`) takes `title, description, canonical, robots, image, type, jsonLd, status`.
  JSON-LD builders live in `src/seo/schema.ts`. `ContentPage` emits Breadcrumb + Article + FAQPage automatically (`faq` prop).
* Persisted client state (cart, currency, remembered username…) is loaded in effects, never in `useState` initialisers,
  so server HTML and the first client render match (hydration). New pages must follow that rule and must not touch
  `window`/`document` during render.
* Netlify: static files win over the SPA redirects in `netlify.toml`; unknown URLs get `dist/404.html` with a real 404.
* Env at build time: `SITE_URL` (falls back to Netlify `URL`), `GOOGLE_SITE_VERIFICATION`, `GA_MEASUREMENT_ID`.
