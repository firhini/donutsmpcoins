/** Screenshot every public route at desktop + mobile widths. Usage: BASE=http://localhost:5173 OUT=/tmp/shots node scripts/screenshot-all.mjs */
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:5173';
const OUT = process.env.OUT || './.shots';
fs.mkdirSync(OUT, { recursive: true });
const routes = (process.env.ROUTES || '/,/shop,/shop/mystery-boxes,/product/mystery-box,/product/donutsmp-money,/cart,/checkout,/track,/spin,/free,/redeem,/referral,/giveaways,/reviews,/faq,/donutsmp-money,/donutsmp-spawners,/donutsmp-irl-trade,/terms,/refund-policy,/privacy,/admin,/nope').split(',');
const browser = await chromium.launch();
const errors = [];
for (const [label, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${label} ${page.url()}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${label} ${page.url()}: console ${m.text().slice(0, 200)}`); });
  if (process.env.CART) await page.addInitScript((cart) => localStorage.setItem('dc_cart_v1', cart), process.env.CART);
  for (const r of routes) {
    try {
      await page.goto(BASE + r, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(600);
      const name = (r === '/' ? 'home' : r.replace(/^\//, '').replace(/[\/:?=]/g, '_'));
      await page.screenshot({ path: `${OUT}/${name}.${label}.png`, fullPage: true });
      const hs = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      console.log(`${label} ${r} ok${hs ? '  ⚠ horizontal scroll' : ''}`);
    } catch (e) { console.log(`${label} ${r} FAIL ${e.message}`); }
  }
  await ctx.close();
}
await browser.close();
if (errors.length) { console.log('\nPage errors:'); errors.forEach((e) => console.log(' -', e)); }
