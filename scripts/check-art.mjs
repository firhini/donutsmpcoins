#!/usr/bin/env node
/**
 * Verifies that every image the storefront references exists under public/.
 *   node scripts/check-art.mjs
 * Sources: product/category image paths in src/data/catalog.ts, payment icon keys in
 * src/data/settings.ts (→ /img/payments/<key>.svg), brand assets and the product fallback.
 * Exits 1 and lists the missing files if anything is absent.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

const wanted = new Set();
// every "/img/...svg|png" literal in the catalog
for (const m of read('src/data/catalog.ts').matchAll(/['"`](\/img\/[A-Za-z0-9_\-./]+?\.(?:svg|png))['"`]/g)) wanted.add(m[1]);
// payment icon keys: icon: 'paypal' → /img/payments/paypal.svg
for (const m of read('src/data/settings.ts').matchAll(/icon:\s*['"]([a-z0-9-]+)['"]/g)) wanted.add(`/img/payments/${m[1]}.svg`);
// icon keys documented on PaymentMethodConfig.icon in the shared types
const typeDoc = read('src/shared/types.ts').match(/icon key for the UI:([^\n]*)/);
if (typeDoc) for (const m of typeDoc[1].matchAll(/'([a-z0-9-]+)'/g)) wanted.add(`/img/payments/${m[1]}.svg`);
// brand + fallback (referenced from index.html, Header/Footer and the storefront's ProductImage fallback)
for (const f of ['/img/brand/logo.svg', '/img/brand/favicon.svg', '/img/brand/mascot.svg', '/img/brand/og.png', '/img/products/_fallback.svg']) wanted.add(f);
for (const m of read('index.html').matchAll(/(?:href|content)=["'](\/img\/[^"']+)["']/g)) wanted.add(m[1]);

const missing = [...wanted].filter((p) => !existsSync(join(ROOT, 'public', p)));
console.log(`checked ${wanted.size} image paths`);
if (missing.length) {
  console.error(`✗ ${missing.length} missing:\n  ${missing.join('\n  ')}\n\nRun: node scripts/gen-art.mjs`);
  process.exit(1);
}
console.log('✓ all referenced images exist');
