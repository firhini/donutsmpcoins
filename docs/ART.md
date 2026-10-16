# Art pipeline

All images under `public/img/**` are generated – never hand-edit them. Everything is original pixel/voxel-style art drawn from data in `scripts/gen-art.mjs` (zero dependencies, deterministic output).

1. **Regenerate everything:** `npm run art` (= `node scripts/gen-art.mjs`). Add `--no-og` to skip the OG image; `og.png` is rendered from an in-memory HTML template with Playwright (`PLAYWRIGHT_MODULE=<path to playwright/index.mjs>` if it is not at `/opt/node-tools/...` or installed locally).
2. **Verify references:** `node scripts/check-art.mjs` – greps every image path in `src/data/catalog.ts`, the payment icon keys in `src/data/settings.ts` and the brand files, and fails if a file is missing.
3. **Add a product image:** set `image: '/img/products/<slug>.svg'` on the product in `catalog.ts`, then add a builder `'<slug>': (S) => { frame(S, { glowColor }); S.add(...) }` to the matching group (`money`, `spawners`, `boxes`, `investments`, `armor`, `tools`, `bundles`, `bases`) in `gen-art.mjs` and run step 1 + 2.
4. **Drawing primitives:** `spriteC()` renders a pixel map (array of strings, one char per pixel, palette char → colour, `.` = transparent) centred at `cx/cy` with a 1px outline; `isoCube()` projects a 16×16 texture (string map, colour or `fn(i,j,face)`) onto an isometric cube with 100/80/60 % face lighting; `giftBox()`, `crate()`, `vault()`, `shulker()`, `spawnerCube()`, `coinStack()`, `coinFace()`, `moneyBag()`, `goldBar()`, `treasureChest()`, `blockWorld()` are higher-level renderers; `frame()` adds the per-category glow aura + drop shadow.
5. **Conventions:** 256×256 viewBox, transparent background, item centred and ~70 % fill, glow colour = category/rarity, crisp pixels (`shape-rendering="crispEdges"`), no text except pixel-font badges (`text()` / `pill()`).
6. **Category icons** (`public/img/categories/<id>.svg`, 64×64) come from `CATEGORY_ICONS`; **payment badges** (`public/img/payments/<key>.svg`, 48×32) from `PAYMENTS` – add a key there when a new `PaymentMethodConfig.icon` value is introduced.
7. **Brand:** `logo.svg` (header, must read at 36px), `favicon.svg`, `mascot.svg` (hero), `wordmark.svg`, `og.png` (1200×630) is built by `logoSvg()/faviconSvg()/mascotSvg()/wordmarkSvg()/ogHtml()`.
8. Keep files small: textures with few colour runs stay ≈10–25 KB; the generator merges horizontal runs and emits one `<path>` per colour.
