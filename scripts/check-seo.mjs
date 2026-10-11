/** Validates the pre-rendered HTML in dist/: one title, description, canonical, robots, JSON-LD parses, no placeholders left. */
import { promises as fs } from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');
async function* walk(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'assets' || e.name === 'img') continue;
      yield* walk(p);
    } else if (e.name.endsWith('.html')) yield p;
  }
}
let files = 0;
let problems = 0;
const count = (html, re) => (html.match(re) || []).length;
for await (const f of walk(DIST)) {
  files++;
  const html = await fs.readFile(f, 'utf8');
  const rel = path.relative(DIST, f);
  const issues = [];
  if (count(html, /<title>/g) !== 1) issues.push('title count ' + count(html, /<title>/g));
  if (count(html, /<meta name="description"/g) !== 1) issues.push('description count ' + count(html, /<meta name="description"/g));
  if (count(html, /<link rel="canonical"/g) !== 1) issues.push('canonical count ' + count(html, /<link rel="canonical"/g));
  if (count(html, /<meta name="robots"/g) !== 1) issues.push('robots count ' + count(html, /<meta name="robots"/g));
  if (/%[A-Z_]+%/.test(html)) issues.push('placeholder left: ' + html.match(/%[A-Z_]+%/)[0]);
  const ld = html.match(/<script id="seo-jsonld" type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!ld && !rel.startsWith('404')) issues.push('no JSON-LD');
  if (ld) {
    try {
      JSON.parse(ld[1]);
    } catch (e) {
      issues.push('JSON-LD invalid: ' + e.message);
    }
  }
  const body = html.match(/<div id="root">([\s\S]*)<\/div>\s*<script/);
  if (!body || body[1].length < 1500) issues.push('thin body (' + (body ? body[1].length : 0) + ' chars)');
  if (!/<h1[\s>]/.test(html)) issues.push('no h1');
  const h1s = count(html, /<h1[\s>]/g);
  if (h1s > 1) issues.push('multiple h1 (' + h1s + ')');
  if (issues.length) {
    problems++;
    console.log('✗', rel, '→', issues.join('; '));
  }
}
console.log(`${files} pages checked, ${problems} with problems`);
process.exit(problems ? 1 : 0);
