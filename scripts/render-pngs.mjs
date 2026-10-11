/**
 * Renders every product SVG + the mascot to PNG (for Open Graph / Google rich results, which do not accept SVG).
 * Needs a local Chromium via Playwright – run once and commit public/img/products/png/*.png.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
const pw = process.env.PLAYWRIGHT_MODULE || '/opt/node-tools/node_modules/playwright/index.mjs';
const { chromium } = await import(pw).catch(() => import('playwright'));
const SRC = path.resolve('public/img/products');
const OUT = path.join(SRC, 'png');
await fs.mkdir(OUT, { recursive: true });
const files = (await fs.readdir(SRC)).filter((f) => f.endsWith('.svg') && !f.startsWith('_'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
for (const f of files) {
  const svg = await fs.readFile(path.join(SRC, f), 'utf8');
  await page.setContent(`<!doctype html><html><body style="margin:0;background:#0b0d14;display:grid;place-items:center;width:512px;height:512px;background:#12151f">${svg.replace('<svg', '<svg style="width:440px;height:440px"')}</body></html>`);
  await page.screenshot({ path: path.join(OUT, f.replace(/\.svg$/, '.png')), type: 'png' });
}
await browser.close();
console.log(`rendered ${files.length} PNGs → public/img/products/png/`);
