/**
 * Build-time pre-rendering: turns every public route into static HTML with real
 * <title>, meta tags and JSON-LD so Google (and every other crawler) gets the
 * content without executing JavaScript. Also writes sitemap.xml and robots.txt.
 *
 * Runs after `vite build` (client → dist/) and `vite build --ssr` (→ dist-ssr/).
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const DIST = path.join(root, 'dist');
const SSR = path.join(root, 'dist-ssr');
const SITE_URL = (process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || '').replace(/\/$/, '');

const entryPath = path.join(SSR, 'entry-server.js');
const { render, seoRoutes } = await import(pathToFileURL(entryPath).href);
const template = await fs.readFile(path.join(DIST, 'index.html'), 'utf8');
let manifest = {};
try {
  manifest = JSON.parse(await fs.readFile(path.join(DIST, '.vite', 'manifest.json'), 'utf8'));
} catch {
  console.warn('[prerender] no manifest – page CSS will load with the JS chunk');
}

/** CSS + JS chunks a lazy page needs (its own + static imports), from the Vite manifest. */
function assetsFor(pageSource) {
  const css = new Set();
  const js = new Set();
  const seen = new Set();
  const walk = (key) => {
    if (!key || seen.has(key)) return;
    seen.add(key);
    const m = manifest[key];
    if (!m) return;
    (m.css || []).forEach((c) => css.add(c));
    if (m.file && !m.isEntry) js.add(m.file);
    (m.imports || []).forEach(walk);
  };
  walk(pageSource);
  // CSS already linked by the entry must not be duplicated
  const entryCss = new Set(Object.values(manifest).filter((m) => m.isEntry).flatMap((m) => m.css || []));
  return { css: [...css].filter((c) => !entryCss.has(c)), js: [...js] };
}

function buildPage(appHtml, title, headTags, assets) {
  let out = template;
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  out = out.replace(/\s*<meta name="description"[^>]*>/g, '');
  out = out.replace(/\s*<meta name="robots"[^>]*>/g, '');
  out = out.replace(/\s*<link rel="canonical"[^>]*>/g, '');
  out = out.replace(/\s*<meta property="og:[^"]*"[^>]*>/g, '');
  out = out.replace(/\s*<meta name="twitter:[^"]*"[^>]*>/g, '');
  const assetTags = [...assets.css.map((c) => `<link rel="stylesheet" crossorigin href="/${c}">`), ...assets.js.map((j) => `<link rel="modulepreload" crossorigin href="/${j}">`)];
  out = out.replace('</head>', `    ${[headTags, ...assetTags].filter(Boolean).join('\n    ')}\n  </head>`);
  out = out.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
  return out;
}

const routes = seoRoutes();
let ok = 0;
const sitemap = [];
for (const r of routes) {
  try {
    const { html, title, headTags, status } = await render(r.path);
    const assets = assetsFor(r.page);
    const page = buildPage(html, title, headTags, assets);
    const file = r.path === '/' ? path.join(DIST, 'index.html') : r.path === '/404' ? path.join(DIST, '404.html') : path.join(DIST, r.path.slice(1), 'index.html');
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, page, 'utf8');
    ok++;
    if (r.sitemap !== false && status === 200) sitemap.push(r);
    if (html.length < 500) console.warn(`[prerender] ${r.path}: suspiciously small output (${html.length} chars)`);
  } catch (err) {
    console.error(`[prerender] FAILED ${r.path}:`, err);
    process.exitCode = 1;
  }
}

// sitemap.xml + robots.txt
const today = new Date().toISOString().slice(0, 10);
const urlset = sitemap
  .map((r) => `  <url>\n    <loc>${SITE_URL}${r.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority.toFixed(1)}</priority>\n  </url>`)
  .join('\n');
await fs.writeFile(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>\n`, 'utf8');
await fs.writeFile(
  path.join(DIST, 'robots.txt'),
  [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /admin',
    'Disallow: /account',
    'Disallow: /cart',
    'Disallow: /checkout',
    'Disallow: /order/',
    'Disallow: /*?*q=',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n'),
  'utf8',
);
console.log(`[prerender] ${ok}/${routes.length} routes → static HTML, ${sitemap.length} sitemap entries${SITE_URL ? ` (${SITE_URL})` : ' (SITE_URL not set – absolute URLs will be relative!)'}`);
