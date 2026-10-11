#!/usr/bin/env node
/**
 * DonutCoins – art generator (zero dependencies, deterministic).
 *
 *   node scripts/gen-art.mjs           regenerate every SVG under public/img/** (+ brand/og.html, brand/og.png)
 *   node scripts/gen-art.mjs --no-og   skip the OG image render (Playwright)
 *
 * Everything is drawn from data in this file: pixel maps (string arrays, one char per pixel),
 * procedural textures and parametric vector shapes. All artwork is original.
 *
 * Building blocks
 *   sprite()      pixel map → crisp rects (run-length merged), optional 1px outline
 *   isoCube()     projects an n×n texture on the top/left/right faces of an isometric cube (lighting 100/80/60 %)
 *   blockWorld()  several cubes on a grid with face culling (bases)
 *   coinFace() / coinLying() / coinStack() / goldBar() / moneyBag()   money
 *   giftBox() / crate() / vault() / treasureChest()                   boxes
 *   glow() / shadow() / sparkle()                                      atmosphere
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'img');
const SIZE = 256;
const ISO_X = Math.sqrt(3) / 2;
const r2 = (n) => Math.round(n * 100) / 100;

// ───────────────────────── colour helpers ─────────────────────────
function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const c255 = (v) => Math.max(0, Math.min(255, Math.round(v)));
const rgbToHex = ([r, g, b]) => '#' + [r, g, b].map((v) => c255(v).toString(16).padStart(2, '0')).join('');
const shadeCache = new Map();
/** f<1 darkens, f>1 lightens towards white */
function shade(hex, f) {
  if (f === 1) return hex;
  const k = hex + '|' + f;
  const hit = shadeCache.get(k);
  if (hit) return hit;
  const [r, g, b] = hexToRgb(hex);
  const v = f >= 1 ? rgbToHex([r + (255 - r) * (f - 1), g + (255 - g) * (f - 1), b + (255 - b) * (f - 1)]) : rgbToHex([r * f, g * f, b * f]);
  shadeCache.set(k, v);
  return v;
}
function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}
function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}
/** tiny seeded PRNG (mulberry32) – keeps specks/sparkles deterministic */
function rng(seed) {
  let s = 1779033703;
  for (const ch of String(seed)) s = Math.imul(s ^ ch.charCodeAt(0), 3432918353);
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ───────────────────────── scene ─────────────────────────
class Scene {
  constructor(id, { w = SIZE, h = SIZE, width = w, height = h } = {}) {
    this.id = id.replace(/[^a-z0-9-]/gi, '');
    this.w = w; this.h = h; this.width = width; this.height = height;
    this.defs = []; this.body = []; this.n = 0; this.cache = {};
  }
  uid(p) { return `${this.id}-${p}${this.n++}`; }
  def(s) { this.defs.push(s); return this; }
  add(...s) { this.body.push(...s); return this; }
  toString() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.width}" height="${this.height}">` +
      (this.defs.length ? `<defs>${this.defs.join('')}</defs>` : '') + this.body.join('') + '</svg>';
  }
}
function linear(S, stops, { x1 = 0, y1 = 0, x2 = 0, y2 = 1 } = {}) {
  const id = S.uid('lg');
  S.def(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`);
  return id;
}
function radial(S, stops, { cx = '50%', cy = '50%', r = '50%', fx, fy } = {}) {
  const id = S.uid('rg');
  S.def(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx ? ` fx="${fx}"` : ''}${fy ? ` fy="${fy}"` : ''}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`);
  return id;
}
/** soft coloured aura behind an item */
function glow(S, { cx = 128, cy = 128, rx = 100, ry = 100, color = '#ffc233', opacity = 0.5, inner = 0.45 } = {}) {
  const id = radial(S, [[0, color, opacity], [inner, color, opacity * 0.42], [1, color, 0]]);
  return `<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}" fill="url(#${id})"/>`;
}
/** soft elliptical drop shadow */
function shadow(S, { cx = 128, cy = 216, rx = 72, ry = 13, opacity = 0.55 } = {}) {
  const id = radial(S, [[0, '#000', opacity], [0.6, '#000', opacity * 0.5], [1, '#000', 0]]);
  return `<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}" fill="url(#${id})"/>`;
}
function sparkle(cx, cy, s, color = '#fff', opacity = 1) {
  const q = s * 0.16;
  return `<path d="M${r2(cx)},${r2(cy - s)}Q${r2(cx + q)},${r2(cy - q)} ${r2(cx + s)},${r2(cy)}Q${r2(cx + q)},${r2(cy + q)} ${r2(cx)},${r2(cy + s)}Q${r2(cx - q)},${r2(cy + q)} ${r2(cx - s)},${r2(cy)}Q${r2(cx - q)},${r2(cy - q)} ${r2(cx)},${r2(cy - s)}Z" fill="${color}" opacity="${opacity}"/>`;
}
function dot(cx, cy, r, color, opacity = 1) {
  return `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${color}" opacity="${opacity}"/>`;
}

// ───────────────────────── pixel maps ─────────────────────────
/** run-length encode a row of colours (null = empty) */
function rle(cells, emit) {
  let run = null;
  for (let i = 0; i <= cells.length; i++) {
    const c = i < cells.length ? cells[i] : null;
    if (c && run && run.col === c) { run.len++; continue; }
    if (run) emit(run);
    run = c ? { i, len: 1, col: c } : null;
  }
}
function mapSize(map) { return { w: Math.max(...map.map((r) => r.length)), h: map.length }; }
/** overlay glyph '#' pixels onto a map as char `ch` */
function stamp(map, glyph, x, y, ch) {
  const rows = map.map((r) => r.split(''));
  glyph.forEach((gr, j) => [...gr].forEach((c, i) => { if (c === '#' && rows[y + j] && rows[y + j][x + i] !== undefined) rows[y + j][x + i] = ch; }));
  return rows.map((r) => r.join(''));
}
function mirror(half) { return half.map((r) => r + [...r].reverse().join('')); }
/** procedural map: fn(i,j) → char */
function shapeMap(w, h, fn) { const rows = []; for (let j = 0; j < h; j++) { let s = ''; for (let i = 0; i < w; i++) s += fn(i, j) || '.'; rows.push(s); } return rows; }

/**
 * Flat pixel sprite. palette: char → colour | fn(i,j). '.'/' ' = transparent.
 * x,y = top-left of pixel (0,0); scale = px per pixel.
 */
function sprite(S, { map, palette, x = 0, y = 0, scale = 10, outline = true, outlineColor = '#120f18', opacity, extra = '' }) {
  const { w, h } = mapSize(map);
  const at = (i, j) => (j < 0 || j >= h || i < 0 || i >= w ? '.' : (map[j][i] ?? '.'));
  const solid = (i, j) => { const c = at(i, j); return c !== '.' && c !== ' ' && palette[c] !== undefined; };
  const col = (i, j) => { const v = palette[at(i, j)]; return typeof v === 'function' ? v(i, j) : v; };
  // one <path> per colour: "M x y h len v1 h-len z" per run – compact and crisp
  const byColor = new Map();
  const push = (c, i, j, len) => byColor.set(c, (byColor.get(c) ?? '') + `M${i} ${j}h${len}v1h-${len}z`);
  if (outline) {
    for (let j = -1; j <= h; j++) {
      const cells = [];
      for (let i = -1; i <= w; i++) cells.push(!solid(i, j) && (solid(i - 1, j) || solid(i + 1, j) || solid(i, j - 1) || solid(i, j + 1)) ? outlineColor : null);
      rle(cells, (r) => push(r.col, r.i - 1, j, r.len));
    }
  }
  for (let j = 0; j < h; j++) {
    const cells = [];
    for (let i = 0; i < w; i++) cells.push(solid(i, j) ? col(i, j) : null);
    rle(cells, (r) => push(r.col, r.i, j, r.len));
  }
  const out = [...byColor].map(([c, d]) => `<path fill="${c}" d="${d}"/>`);
  return `<g transform="translate(${r2(x)} ${r2(y)}) scale(${r2(scale)})" shape-rendering="crispEdges"${opacity != null ? ` opacity="${opacity}"` : ''}>${out.join('')}${extra}</g>`;
}
function spriteC(S, o) { const { w, h } = mapSize(o.map); return sprite(S, { ...o, x: o.cx - (w * o.scale) / 2, y: o.cy - (h * o.scale) / 2 }); }

// ───────────────────────── 5×7 pixel font ─────────────────────────
const FONT = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  $: ['..#..', '.####', '#.#..', '.###.', '..#.#', '####.', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '×': ['.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '.....'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.....', '..#..'],
  ' ': ['...', '...', '...', '...', '...', '...', '...'],
  '₿': ['.#.#.', '####.', '#...#', '####.', '#...#', '####.', '.#.#.'],
  Ł: ['.#...', '.#...', '.#.#.', '.##..', '##...', '.#...', '.####'],
  '₮': ['#####', '..#..', '.####', '..#..', '.####', '..#..', '..#..'],
};
function textMap(str, spacing = 1) {
  const glyphs = [...str].map((ch) => FONT[ch] ?? FONT[ch.toUpperCase()] ?? FONT['?']);
  const rows = [];
  for (let j = 0; j < 7; j++) rows.push(glyphs.map((g) => g[j]).join('.'.repeat(spacing)));
  return rows;
}
function text(S, str, { x, y, cx, cy, scale = 3, color = '#fff', outline = true, outlineColor = '#120f18', spacing = 1 }) {
  const map = textMap(str, spacing);
  if (cx != null) return spriteC(S, { map, palette: { '#': color }, cx, cy, scale, outline, outlineColor });
  return sprite(S, { map, palette: { '#': color }, x, y, scale, outline, outlineColor });
}

// ───────────────────────── isometric cube ─────────────────────────
function texGetter(tex, face) {
  let t = tex;
  if (t && typeof t === 'object' && !Array.isArray(t) && !t.map && (t.top || t.left || t.right)) t = t[face] ?? t.top ?? t.left ?? t.right;
  if (typeof t === 'function') return (i, j) => t(i, j, face);
  if (typeof t === 'string') return () => t;
  if (t && t.map) return (i, j) => { const c = t.map[j]?.[i]; if (c === undefined || c === '.' || c === ' ') return null; const v = t.palette[c]; return typeof v === 'function' ? v(i, j, face) : (v ?? null); };
  return () => null;
}
/** screen point of face coordinate (u,v) ∈ [0,1]²; cy = screen y of the top face's front vertex */
function isoPoint(face, u, v, cx, cy, L, H = 1) {
  if (face === 'top') return [cx + (u - v) * ISO_X * L, cy - L + (u + v) * 0.5 * L];
  if (face === 'left') return [cx - ISO_X * L + u * ISO_X * L, cy - 0.5 * L + u * 0.5 * L + v * H * L];
  return [cx + u * ISO_X * L, cy - u * 0.5 * L + v * H * L];
}
function hexPoints(cx, cy, L, H = 1) {
  return [isoPoint('top', 0, 0, cx, cy, L, H), isoPoint('top', 1, 0, cx, cy, L, H), isoPoint('right', 1, 1, cx, cy, L, H), isoPoint('left', 1, 1, cx, cy, L, H), isoPoint('left', 0, 1, cx, cy, L, H), isoPoint('top', 0, 1, cx, cy, L, H)];
}
const pts = (arr) => arr.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' ');
/**
 * Isometric cube. tex: colour string | fn(i,j,face) | {map,palette} | {top,left,right}.
 * Lighting: top 100 %, left 80 %, right 60 %. Each texel becomes a parallelogram (runs merged).
 */
function isoCube(S, o) {
  const { cx, cy, L, H = 1, n = 16, tex, light = { top: 1, left: 0.8, right: 0.6 }, outline = true, outlineColor = '#0c0a11', outlineWidth = 2, edges = true, faces = ['top', 'left', 'right'] } = o;
  const P = (f, u, v) => isoPoint(f, u, v, cx, cy, L, H);
  // one <path> per colour per face (parallelogram subpaths) – compact output
  const out = [];
  for (const face of faces) {
    const get = texGetter(tex, face);
    const lf = light[face];
    const nn = typeof n === 'object' ? n[face] : n;
    const byColor = new Map();
    for (let j = 0; j < nn; j++) {
      const cells = [];
      for (let i = 0; i < nn; i++) { const c = get(i, j); cells.push(c ? shade(c, lf) : null); }
      rle(cells, (r) => {
        const u0 = r.i / nn, u1 = (r.i + r.len) / nn, v0 = j / nn, v1 = (j + 1) / nn;
        const q = [P(face, u0, v0), P(face, u1, v0), P(face, u1, v1), P(face, u0, v1)].map(([x, y]) => `${r2(x)} ${r2(y)}`);
        byColor.set(r.col, (byColor.get(r.col) ?? '') + `M${q[0]}L${q[1]}L${q[2]}L${q[3]}Z`);
      });
    }
    for (const [c, d] of byColor) out.push(`<path fill="${c}" stroke="${c}" d="${d}"/>`);
  }
  let s = `<g stroke-width="0.6" stroke-linejoin="round">${out.join('')}</g>`;
  if (edges) {
    const a = P('top', 0, 1), b = P('top', 1, 1), c = P('top', 1, 0), d = P('left', 1, 1);
    s += `<path d="M${r2(a[0])},${r2(a[1])}L${r2(b[0])},${r2(b[1])}L${r2(c[0])},${r2(c[1])}M${r2(b[0])},${r2(b[1])}L${r2(d[0])},${r2(d[1])}" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1"/>`;
    // rim light on the top-left edges
    const t = P('top', 0, 0), l = P('top', 0, 1);
    s += `<path d="M${r2(c[0])},${r2(c[1])}L${r2(t[0])},${r2(t[1])}L${r2(l[0])},${r2(l[1])}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1"/>`;
  }
  if (outline) s += `<polygon points="${pts(hexPoints(cx, cy, L, H))}" fill="none" stroke="${outlineColor}" stroke-width="${outlineWidth}" stroke-opacity=".85" stroke-linejoin="round"/>`;
  return s;
}
/** dark fill of the cube silhouette (interior for cages) */
function hexFill(cx, cy, L, H, color) { return `<polygon points="${pts(hexPoints(cx, cy, L, H))}" fill="${color}"/>`; }

/** several cubes on an iso grid with face culling. blocks: {x,y,z,tex,H?} */
function blockWorld(S, { ox, oy, L, blocks, n = 8, outline = false }) {
  const key = (x, y, z) => `${x},${y},${z}`;
  const full = new Set(blocks.filter((b) => (b.H ?? 1) >= 1).map((b) => key(b.x, b.y, b.z)));
  const sorted = [...blocks].sort((a, b) => (a.x + a.y + a.z) - (b.x + b.y + b.z) || a.z - b.z);
  let s = '';
  for (const b of sorted) {
    const H = b.H ?? 1;
    const faces = [];
    if (!(H >= 1 && full.has(key(b.x, b.y, b.z + 1)))) faces.push('top');
    if (!(H >= 1 && full.has(key(b.x, b.y + 1, b.z)))) faces.push('left');
    if (!(H >= 1 && full.has(key(b.x + 1, b.y, b.z)))) faces.push('right');
    if (!faces.length) continue;
    const cx = ox + (b.x - b.y) * ISO_X * L;
    const cy = oy + (b.x + b.y) * 0.5 * L - b.z * L - H * L;
    s += isoCube(S, { cx, cy, L, H, n: b.n ?? n, tex: b.tex, faces, outline: outline && faces.length === 3, edges: false, outlineWidth: 1.2 });
  }
  return s;
}

// ───────────────────────── palette ─────────────────────────
const GOLD = { l: '#ffe99a', m: '#ffc233', d: '#d98f00', dd: '#8a5200' };
const NETHERITE = { B: '#55495a', L: '#8a7a92', D: '#332b36' };
const DIAMOND = { B: '#4fd1e8', L: '#bdf4ff', D: '#1e8ea5' };

// ───────────────────────── sprite maps ─────────────────────────
const ELYTRA = mirror([
  '......aa', '.....add', '....adcb', '...adcbb', '...adcba', '..adcbba', '..adcba.', '..acbba.', '.adcbba.', '.acbba..', '.acbba..', 'adbba...', 'abba....', 'aa......',
]);
const ELYTRA_PAL = { a: '#3b2f52', b: '#5d4d80', c: '#9b8ac4', d: '#c8bce6' };

const TOTEM = [
  '.....GGGGGG.....', '....GGggggGG....', '....GgEggEgG....', '....GggggggG....', '....GGggggGG....', '.....GGhGGG.....',
  'GGG..gggggg..GGG', 'GGGGGggggggGGGGG', '.GGGGggggggGGGG.', '.....gggggg.....', '.....gggggg.....', '.....gGggGg.....',
  '.....gggggg.....', '.....GGGGGG.....', '.....GG..GG.....', '.....GG..GG.....',
];
const TOTEM_PAL = { G: '#f2c14e', h: '#ffe08a', g: '#3fb950', E: '#1b2a1e' };

const APPLE = [
  '.......ss.......', '.......s..ll....', '.........lll....', '....GGG..GGG....', '...GGGGGGGGGG...', '..GGhGGpGGGGGd..',
  '..GhhGGGGGGGGd..', '..GhGGGGGGpGGd..', '..GGGGGGGGGGGd..', '..GGpGGGGGGGGd..', '..GGGGGGGGGGdd..', '...GGGGGGpGGdd..',
  '...GGGGGGGGGd...', '....GGGGGGGG....', '.....GGG.GGG....',
];
const APPLE_PAL = { G: '#ffc233', h: '#fff0a0', d: '#d98f00', s: '#6b3e1e', l: '#4ade80', p: '#c084fc' };

const STAR = [
  '.......ww.......', '.......ww.......', '.......ww.......', '......wwww......', '......wwww......', '.....wwhhww.....',
  '...wwwhhhhwww...', 'wwwwwhhhhhhwwwww', 'wwwwwhhhhhhwwwww', '...wwwhhhhwww...', '.....wwhhww.....', '......wwww......',
  '......wwww......', '.......ww.......', '.......ww.......', '.......ww.......',
];
const STAR_PAL = { w: '#cfe3ff', h: '#ffffff' };

const INGOT = [
  '....gggggggg....', '...gLLLLLLLLg...', '..gLLLLLLLLLLg..', '.NNNNNNNNNNNNNN.', '.NNgNNNNNNNNNgN.', '.NNNNNNNgNNNNNN.',
  '.NNNNNNNNNNNNNN.', '.NddddddddddddN.', '.dddddddddddddd.',
];
const INGOT_PAL = { g: '#ffc233', L: '#6f6270', N: '#4a4048', d: '#342c33' };

const DRAGON = [
  '.hh..........hh.', '.hhh........hhh.', '..hhKKKKKKKKhh..', '..KKlKKKKKKKKK..', '.KKKKKKKKKKlKKK.', '.KKPPKKKKKKPPKK.',
  '.KKPpKKKKKKpPKK.', '.KKKKKKKKKKKKKK.', '.KlKKKKKKKKKKKK.', '..KKnKKKKKKnKK..', '..KKKKKKKKKKKK..', '..KtKtKKKKtKtK..',
  '..KKKKKKKKKKKK..', '...KKKKKKKKKK...',
];
const DRAGON_PAL = { h: '#8c8c99', K: '#2b2a36', l: '#3a3948', P: '#a855f7', p: '#e9d5ff', n: '#15141c', t: '#e5e7eb' };

const CHESTPLATE = [
  '.BBBBB....BBBBB.', '.BBBBBB..BBBBBB.', '.BLBBBBBBBBBBDB.', '.BLBBBBBBBBBBDB.', '.BB.BBBBBBBB.DB.', '.BB.BBBBBBBB.DB.',
  '....BLBBBBBBD...', '....BLBBBBBBD...', '....BBBBBBBBD...', '....BBBBBBBBD...', '....BBBBBBBBD...', '....BBBBBBBBD...',
  '....BBBBBBBBD...', '....BBBBBBBBD...', '....DDDDDDDDD...',
];
const HELMET = [
  '.....BBBBBB.....', '....BLBBBBBB....', '...BLBBBBBBBD...', '...BBBBBBBBBD...', '...BBBBBBBBBD...', '...BBBBBBBBBD...',
  '...BBB....BBD...', '...BBB....BBD...', '...BBB....BBD...', '...DDD....DDD...',
];
const LEGGINGS = [
  '...BBBBBBBBBB...', '...BLBBBBBBBD...', '...BLBB..BBBD...', '...BBBB..BBBD...', '...BBB....BBD...', '...BBB....BBD...',
  '...BLB....BDD...', '...BBB....BBD...', '...BBB....BBD...', '...BBB....BBD...', '...BBB....BBD...', '...DDD....DDD...',
];
const BOOTS = [
  '....BBB..BBB....', '....BLB..BLB....', '....BBB..BBB....', '....BBB..BBB....', '..BBBBB..BBBBB..', '..BBBBB..BBBBB..', '..DDDDD..DDDDD..',
];

const SWORD = [
  '..............ee', '.............ebd', '............ebd.', '...........ebd..', '..........ebd...', '.........ebd....',
  '..gg....ebd.....', '...gg..ebd......', '....ggebd.......', '.....ggg........', '....hhgg........', '...hh..gg.......',
  '..hh............', '.hh.............', 'pp..............',
];
const SWORD_PAL = { e: '#8a7f8a', b: '#4a4048', d: '#2d272d', g: '#c9a227', h: '#5b3a1e', p: '#c9a227' };

const PICKAXE = [
  '.........HHHHH..', '.......HHhhhHHH.', '.....HHHhhhhHHH.', '....HHhhhss.dHHH', '...HHh..ss....dH', '..HH...ss......d',
  '..H...ss........', '.....ss.........', '....ss..........', '...ss...........', '..ss............', '.ss.............', 'ss..............',
];
const PICK_NETHERITE = { H: '#4a4048', h: '#6f6270', d: '#2d272d', s: '#8b5a2b' };
const PICK_AMETHYST = { H: '#9d5cf0', h: '#d9b8ff', d: '#6b2fc4', s: '#8b5a2b' };
const PICK_STEEL = { H: '#c9d3e0', h: '#f1f5f9', d: '#8a97a8', s: '#8b5a2b' };

const BOW = [
  '.....ff.........', '....s.ww........', '....s..ww.......', '....s...ww......', '....s....ww.....', '....s....ww.....',
  '....s....gg.....', '....s....gg.....', '....s....gg.....', '....s....ww.....', '....s....ww.....', '....s...ww......',
  '....s..ww.......', '....s.ww........', '.....ff.........',
];
const BOW_PAL = { w: '#8b5a2b', s: '#e5e7eb', g: '#5b3a1e', f: '#ff9d2e' };

const MACE = [
  '........MMMMMMM.', '.......MMmmmMMMM', '.......MmmmmMMMM', '.......MMmmmMMdd', '.......MMMMMMdd.', '........MMMddd..',
  '.......hh.......', '......hh........', '.....hh.........', '....hh..........', '...hh...........', '..hh............', '.hh.............', 'bb..............',
];
const MACE_PAL = { M: '#7b7f8c', m: '#c3c7d1', d: '#4b4f5a', h: '#9fd3e8', b: '#6aa5bd' };

const TRIDENT = [
  '....p...p...p...', '....t...t...t...', '....t...t...t...', '....t...t...t...', '....tt..t..tt...', '.....ttttttt....',
  '........t.......', '........s.......', '........s.......', '........s.......', '........s.......', '........s.......',
  '........s.......', '........s.......', '........s.......', '........s.......',
];
const TRIDENT_PAL = { p: '#b8fff5', t: '#35c4b5', s: '#1f7f76' };

const MONEY_BAG = stamp([
  '......BBBB......', '.....BLLLLB.....', '.....BBBBBB.....', '....RRRRRRRR....', '....BBBBBBBB....', '...BBBBBBBBBB...',
  '..BBBhBBBBBBBB..', '.BBBhBBBBBBBBBB.', '.BBhBBBBBBBBBBd.', '.BBBBBBBBBBBBBd.', '.BBBBBBBBBBBBBd.', '.BBBBBBBBBBBBdd.',
  '.BBBBBBBBBBBBdd.', '..BBBBBBBBBBBd..', '...BBBBBBBBBB...', '....BBBBBBBB....',
], FONT.$, 6, 7, 'S');
const MONEY_BAG_PAL = { B: '#b8743a', h: '#d9955a', d: '#8a5226', L: '#d9955a', R: '#e0b24a', S: '#ffd45c' };

const BOW_RIBBON = ['.RRR...RRR.', 'RrrrR.RrrrR', 'RrrrRRRrrrR', '.RRRRrRRRR.', '...RRRRR...', '..RR...RR..', '.RR.....RR.'];
const PADLOCK = ['..ggg..', '.g...g.', '.g...g.', 'GGGGGGG', 'GGGGGGG', 'GGGkGGG', 'GGGkGGG', 'GGGGGGG', '.GGGGG.'];
const PADLOCK_PAL = { g: '#e8c44a', G: '#ffc233', k: '#5a3a00' };

const HEADS = {
  skeleton: { map: ['SSSSSSSS', 'SSSSSSSS', 'SKKSSKKS', 'SKKSSKKS', 'SSSSSSSS', 'SSSKKSSS', 'SSSSSSSS', 'SkSkSkSk'], pal: { S: '#e6e8ee', K: '#2a2d36', k: '#b9bcc6' }, glow: '#d8dce6', tint: '#9aa0ad' },
  'iron-golem': { map: ['IIIIIIII', 'IIIIIIII', 'IKRIIRKI', 'IIIIIIII', 'IIIiiIII', 'IIIiiIII', 'IIIiiIII', 'IIIIIIII'], pal: { I: '#c9ccd3', i: '#8e939d', K: '#2b2e36', R: '#ef4444' }, glow: '#c8cdd8', tint: '#aab0bd' },
  zombie: { map: ['ZZZZZZZZ', 'ZZZZZZZZ', 'ZKKZZKKZ', 'ZZZZZZZZ', 'ZZZzzZZZ', 'ZZZZZZZZ', 'ZZzZZzZZ', 'ZZZZZZZZ'], pal: { Z: '#3fa34d', z: '#2f7f3b', K: '#101a12' }, glow: '#4ade80', tint: '#4ade80' },
  creeper: { map: ['CCCCCCCC', 'CCCCCCCC', 'CKKCCKKC', 'CKKCCKKC', 'CCCKKCCC', 'CCKKKKCC', 'CCKKKKCC', 'CCKCCKCC'], pal: { C: '#5cc96a', c: '#3f9b4c', K: '#0f1a10' }, glow: '#5df07a', tint: '#5df07a' },
  blaze: { map: ['BBYYYYBB', 'BYYYYYYB', 'YYKYYKYY', 'YYYYYYYY', 'YYYYYYYY', 'BYYYYYYB', 'BBYYYYBB', '..BBBB..'], pal: { B: '#f59e0b', Y: '#fde047', K: '#3a2200' }, glow: '#ff9d2e', tint: '#ff9d2e' },
};

// ───────────────────────── textures ─────────────────────────
const edge = (i, j, n = 16) => i === 0 || j === 0 || i === n - 1 || j === n - 1;
/** 15×15 lattice: bars at 0/7/14 → four big openings per face */
const cageTex = (tint) => (i, j) => {
  const isBar = (v) => v === 0 || v === 7 || v === 14;
  if (!isBar(i) && !isBar(j)) return null;
  if (isBar(i) && isBar(j)) return '#2f3542';
  return (i === 0 || j === 0) ? mix('#58607a', tint, 0.2) : '#444b5c';
};
const shulkerTex = (body, lid, seam) => (i, j, face) => {
  if (face === 'top') return edge(i, j) ? seam : (i > 4 && i < 11 && j > 4 && j < 11) ? shade(lid, 0.93) : lid;
  if (j === 5) return seam;
  if (j < 5) return (i === 0 || i === 15) ? seam : lid;
  return (i === 0 || i === 15 || j === 15) ? seam : body;
};
const noiseTex = (seed, base, variants, density = 0.12) => {
  const rnd = rng(seed); const grid = [];
  for (let f = 0; f < 3; f++) { grid.push([]); for (let j = 0; j < 16; j++) { grid[f].push([]); for (let i = 0; i < 16; i++) grid[f][j].push(rnd() < density ? variants[Math.floor(rnd() * variants.length)] : base); } }
  const fi = { top: 0, left: 1, right: 2 };
  return (i, j, face) => grid[fi[face]][j][i];
};
/** blob-based ore texture */
const oreTex = (seed, base, stripe, crystal, crystalL, blobs = 3) => {
  const rnd = rng(seed); const faces = {};
  for (const f of ['top', 'left', 'right']) {
    const g = []; for (let j = 0; j < 16; j++) { g.push([]); for (let i = 0; i < 16; i++) g[j].push(j % 4 === 3 && rnd() < 0.6 ? stripe : (rnd() < 0.08 ? shade(base, 1.1) : base)); }
    for (let b = 0; b < blobs; b++) { const ci = 2 + Math.floor(rnd() * 11), cj = 2 + Math.floor(rnd() * 11); const cells = [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0], [0, -1]].filter((_, k) => k < 4 || rnd() < 0.5); for (const [di, dj] of cells) if (g[cj + dj]?.[ci + di]) g[cj + dj][ci + di] = (di === 0 && dj === 0) ? crystalL : crystal; }
    faces[f] = g;
  }
  return (i, j, face) => faces[face][j][i];
};
const plankTex = (plank, seam, dark) => (i, j) => (j % 4 === 3 ? seam : (i === ((Math.floor(j / 4) % 2) ? 3 : 10) ? seam : (j % 4 === 0 ? shade(plank, 1.07) : plank)));
const crateTex = (plank, seam, brace) => (i, j, face) => {
  if (edge(i, j)) return seam;
  if (i === 1 || i === 14 || j === 1 || j === 14) return brace;
  if (face !== 'top' && (i === j || i === 15 - j)) return brace;
  return j % 4 === 2 ? seam : (j % 4 === 3 ? shade(plank, 1.06) : plank);
};
const metalCrateTex = (panel, bar, rivet) => (i, j) => {
  const b = i % 5 === 0 || j % 5 === 0;
  if (i % 5 === 0 && j % 5 === 0) return rivet;
  if (b) return bar;
  return ((i % 5 === 1 || j % 5 === 1) ? shade(panel, 1.08) : panel);
};
const giftTex = ({ body, ribbon, ribbonL, trim, glyph, glyphColor = '#fff', glyphOutline = '#1a0b14', iridescent = false }) => (i, j, face) => {
  if (glyph && face === 'left') {
    const gx = i - 1, gy = j - 6; // left of the ribbon (cols 1-5, rows 6-12)
    const at = (x, y) => glyph[y]?.[x] === '#';
    if (at(gx, gy)) return glyphColor;
    if (at(gx - 1, gy) || at(gx + 1, gy) || at(gx, gy - 1) || at(gx, gy + 1)) return glyphOutline;
  }
  if (face === 'top') { if (i === 7 || j === 7) return ribbonL; if (i === 8 || j === 8) return ribbon; }
  else { if (i === 7) return ribbonL; if (i === 8) return ribbon; }
  if (trim && edge(i, j)) return trim;
  if (face !== 'top' && j === 4) return shade(iridescent ? '#ffffff' : body, 0.72);
  if (face !== 'top' && j < 4) return iridescent ? hsl(200 + (i + j) * 9 + (face === 'left' ? 30 : 70), 80, 72) : shade(body, 1.12);
  if (iridescent) return hsl(190 + (i + j) * 8 + (face === 'top' ? 0 : face === 'left' ? 40 : 80), 82, 64);
  return body;
};
const vaultTex = (metal, metalL, metalD, dial = true) => (i, j, face) => {
  if (edge(i, j)) return metalD;
  if ((i === 1 || i === 14) && (j === 1 || j === 14)) return metalD;
  if (face === 'left' && dial) {
    const d = Math.hypot(i - 7.5, j - 8.5);
    if (d < 1.5) return metalD;
    if (d >= 3.4 && d < 4.6) return metalD;
    if (d < 3.4) return (i - 7.5) * (j - 8.5) < 0 && d > 2.2 ? metalD : metalL;
  }
  if (face === 'right' && ((j === 7 || j === 8) && i >= 4 && i <= 11)) return j === 7 ? metalL : metalD;
  if (face === 'right' && (i === 4 || i === 11) && j >= 6 && j <= 9) return metalD;
  if (i >= 2 && i <= 13 && j >= 2 && j <= 13) return (i === 2 || j === 2) ? metalL : metal;
  return shade(metal, 0.9);
};
const heavyCoreTex = (i, j, face) => {
  const inner = i >= 3 && i <= 12 && j >= 3 && j <= 12;
  const ring = inner && (i === 3 || i === 12 || j === 3 || j === 12);
  if (ring) return '#bfe8ff';
  if (edge(i, j)) return '#4b505c';
  if (inner && (i === 7 || i === 8) && (j === 7 || j === 8)) return '#e8f7ff';
  if (face !== 'top' && (i === 7 || i === 8) && j > 12) return '#9fd3ff';
  return (j % 4 === 1 && i % 4 === 1) ? '#5e636f' : '#6b7080';
};
const netheriteBlockTex = (i, j) => {
  if (j % 4 === 3 || i % 4 === 3) return '#2e282c';
  if ((i % 4 === 0 && j % 4 === 0)) return '#5a4f5b';
  return '#443b43';
};
const chestTex = (plank = '#a0672a', seam = '#5a3813', latch = '#c9ced6') => (i, j, face) => {
  if (face === 'top') return edge(i, j) ? seam : '#1d1308';
  if (edge(i, j)) return seam;
  if (j === 5) return shade(seam, 0.8);
  if (face === 'left' && i >= 7 && i <= 8 && j >= 4 && j <= 7) return latch;
  return j % 4 === 3 ? shade(plank, 0.82) : plank;
};
const chestLidTex = (plank = '#a0672a', seam = '#5a3813') => (i, j) => (edge(i, j) ? seam : (j % 4 === 3 || i % 8 === 7) ? shade(plank, 0.82) : plank);

// ───────────────────────── money renderers ─────────────────────────
function coinDefs(S) {
  if (S.cache.coin) return S.cache.coin;
  return (S.cache.coin = {
    top: linear(S, [[0, '#fff3b8'], [0.45, '#ffd45c'], [1, '#f0a000']], { x1: 0, y1: 0, x2: 1, y2: 1 }),
    side: linear(S, [[0, '#e8a200'], [1, '#9c5c00']]),
    face: radial(S, [[0, '#fff6c8'], [0.5, '#ffd45c'], [1, '#e89c00']], { cx: '38%', cy: '35%', r: '70%' }),
  });
}
function coinLying(S, { cx, cy, r, h = 9, ry }) {
  const d = coinDefs(S); ry = ry ?? r * 0.4;
  return `<path d="M${r2(cx - r)},${r2(cy)}v${h}a${r},${r2(ry)} 0 0 0 ${2 * r},0v-${h}z" fill="url(#${d.side})" stroke="#6e4200" stroke-width="1" stroke-opacity=".5"/>` +
    `<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${r}" ry="${r2(ry)}" fill="url(#${d.top})" stroke="#a86800" stroke-width="1" stroke-opacity=".6"/>` +
    `<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(r * 0.7)}" ry="${r2(ry * 0.7)}" fill="none" stroke="#d98f00" stroke-width="1.2" stroke-opacity=".75"/>`;
}
function coinStack(S, { cx, baseY, count, r = 34, h = 9, seed = 'stack', jitter = 3 }) {
  const rnd = rng(seed); let s = '';
  for (let k = 0; k < count; k++) s += coinLying(S, { cx: cx + (rnd() - 0.5) * jitter, cy: baseY - k * h, r, h });
  return s;
}
function coinFace(S, { cx, cy, r, glyph = true }) {
  const d = coinDefs(S);
  let s = `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="url(#${d.face})" stroke="#7a4a00" stroke-width="${r2(Math.max(1.2, r * 0.045))}"/>`;
  s += `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r * 0.8)}" fill="none" stroke="#c77d05" stroke-width="${r2(Math.max(1, r * 0.04))}" stroke-opacity=".85"/>`;
  s += `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r * 0.8)}" fill="none" stroke="#fff" stroke-width="${r2(Math.max(0.8, r * 0.025))}" stroke-opacity=".35" stroke-dasharray="${r2(r * 1.2)} ${r2(r * 6)}" transform="rotate(-150 ${r2(cx)} ${r2(cy)})"/>`;
  if (glyph) {
    const sc = (r * 0.95) / 7, gw = 5 * sc, gh = 7 * sc, x = cx - gw / 2, y = cy - gh / 2;
    s += sprite(S, { map: FONT.$, palette: { '#': '#fff3c4' }, x: x - sc * 0.18, y: y - sc * 0.18, scale: sc, outline: false });
    s += sprite(S, { map: FONT.$, palette: { '#': '#b86f00' }, x, y, scale: sc, outline: false });
  }
  return s;
}
function goldBar(S, { cx, cy, w = 72, h = 18, dx = 16, dy = 10 }) {
  const t = 7;
  const front = [[cx - w / 2, cy + h], [cx + w / 2, cy + h], [cx + w / 2 - t, cy], [cx - w / 2 + t, cy]];
  const top = [[cx - w / 2 + t, cy], [cx + w / 2 - t, cy], [cx + w / 2 - t + dx, cy - dy], [cx - w / 2 + t + dx, cy - dy]];
  const side = [[cx + w / 2 - t, cy], [cx + w / 2, cy + h], [cx + w / 2 + dx, cy + h - dy], [cx + w / 2 - t + dx, cy - dy]];
  const o = 'stroke="#6e4200" stroke-width="1.2" stroke-linejoin="round"';
  return `<polygon points="${pts(side)}" fill="#c77d05" ${o}/><polygon points="${pts(front)}" fill="#f2a900" ${o}/><polygon points="${pts(top)}" fill="#ffd45c" ${o}/>` +
    `<polygon points="${pts([[cx - w / 2 + t + 4, cy - 2], [cx - w / 2 + t + dx - 2, cy - dy + 2], [cx + w / 2 - t + dx - 10, cy - dy + 2]])}" fill="#fff6c8" opacity=".55"/>`;
}
function moneyBag(S, { cx, cy, scale = 6 }) { return spriteC(S, { map: MONEY_BAG, palette: MONEY_BAG_PAL, cx, cy, scale }); }

// ───────────────────────── box renderers ─────────────────────────
function giftBox(S, { cx = 128, cy = 128, L = 84, body, ribbon, ribbonL, trim, glyph = FONT['?'], glyphColor, bow = true, iridescent = false }) {
  let s = isoCube(S, { cx, cy, L, tex: giftTex({ body, ribbon, ribbonL, trim, glyph, glyphColor, iridescent }) });
  if (bow) s += spriteC(S, { map: BOW_RIBBON, palette: { R: ribbon, r: ribbonL }, cx, cy: cy - L * 0.5 - 2, scale: L / 21 });
  return s;
}
function crate(S, { cx, cy, L, plank = '#c9933a', seam = '#7a4f17', brace = '#e0ad4c' }) {
  return isoCube(S, { cx, cy, L, tex: crateTex(plank, seam, brace) });
}
function vault(S, { cx = 128, cy = 128, L = 82, metal, metalL, metalD }) {
  return isoCube(S, { cx, cy, L, tex: vaultTex(metal, metalL, metalD) });
}
function treasureChest(S, { cx = 128, cy = 150, L = 74, coins = true, seed = 'chest' }) {
  const rnd = rng(seed);
  let s = '';
  // open lid (behind, raised)
  s += isoCube(S, { cx, cy: cy - L * 0.95, L, H: 0.22, tex: { top: chestLidTex(), left: chestTex(), right: chestTex() }, outlineWidth: 1.5 });
  // interior dark + coins inside
  if (coins) {
    const inner = [];
    const yTop = cy - L * 0.5; // top face centre
    for (let k = 0; k < 7; k++) { const t = rnd(); inner.push(coinLying(S, { cx: cx - 34 + k * 11 + (rnd() - 0.5) * 6, cy: yTop - 6 + t * 10, r: 13, h: 4 })); }
    s += `<g>${inner.join('')}</g>`;
  }
  s += isoCube(S, { cx, cy, L, H: 0.68, tex: chestTex(), outlineWidth: 2 });
  if (coins) {
    const yTop = cy - L * 0.5;
    s += coinStack(S, { cx: cx - 22, baseY: yTop + 2, count: 4, r: 15, h: 5, seed: seed + 'a' });
    s += coinStack(S, { cx: cx + 10, baseY: yTop + 8, count: 6, r: 15, h: 5, seed: seed + 'b' });
    s += coinStack(S, { cx: cx + 36, baseY: yTop + 4, count: 3, r: 15, h: 5, seed: seed + 'c' });
    s += coinLying(S, { cx: cx - 42, cy: yTop + 14, r: 14, h: 5 });
    s += coinFace(S, { cx: cx - 4, cy: yTop - 16, r: 16 });
    // spilling over the front edge
    s += coinLying(S, { cx: cx - 60, cy: cy + L * 0.62, r: 14, h: 5 });
    s += coinLying(S, { cx: cx + 56, cy: cy + L * 0.58, r: 14, h: 5 });
    s += coinLying(S, { cx: cx + 72, cy: cy + L * 0.7, r: 13, h: 5 });
  }
  return s;
}

// ───────────────────────── composition helpers ─────────────────────────
function frame(S, { glowColor, glowOpacity = 0.5, glowCx = 128, glowCy = 128, glowRx = 104, glowRy = 100, shadowCy = 214, shadowRx = 74, shadowRy = 13, shadowOpacity = 0.55 }) {
  S.add(glow(S, { cx: glowCx, cy: glowCy, rx: glowRx, ry: glowRy, color: glowColor, opacity: glowOpacity }));
  S.add(shadow(S, { cy: shadowCy, rx: shadowRx, ry: shadowRy, opacity: shadowOpacity }));
}
function sparkles(seed, n, { cx = 128, cy = 128, spread = 100, colors = ['#fff', '#ffe28a'], min = 5, max = 12 } = {}) {
  const rnd = rng(seed); let s = '';
  for (let k = 0; k < n; k++) { const a = rnd() * Math.PI * 2, d = spread * (0.6 + rnd() * 0.45); s += sparkle(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.9, min + rnd() * (max - min), colors[k % colors.length], 0.75 + rnd() * 0.25); }
  return s;
}
function embers(seed, n, { cx = 128, cy = 140, spread = 90, colors = ['#ff9d2e', '#ffd166', '#ff5a2e'] } = {}) {
  const rnd = rng(seed); let s = '';
  for (let k = 0; k < n; k++) { const a = rnd() * Math.PI * 2, d = spread * (0.5 + rnd() * 0.6); s += dot(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.9 - rnd() * 30, 1.5 + rnd() * 2.5, colors[k % colors.length], 0.6 + rnd() * 0.4); }
  return s;
}
function spawnerCube(S, mob, { cx = 128, cy = 128, L = 86, headScale } = {}) {
  const m = HEADS[mob];
  let s = hexFill(cx, cy, L, 1, mix('#0b0d14', m.tint, 0.18));
  s += glow(S, { cx, cy: cy + 4, rx: L * 0.6, ry: L * 0.6, color: m.glow, opacity: 1, inner: 0.35 });
  s += spriteC(S, { map: m.map, palette: m.pal, scale: headScale ?? L / 11.5, cx, cy: cy + L * 0.1 });
  s += isoCube(S, { cx, cy, L, n: 15, tex: cageTex(m.tint) });
  return s;
}
function shulker(S, { cx = 128, cy = 128, L = 80, body = '#9b59d6', lid = '#b07ae6', seam = '#5f2f8f' }) {
  return isoCube(S, { cx, cy, L, tex: shulkerTex(body, lid, seam) });
}
function pill(S, { cx, cy, label, color = '#ffc233', bg = '#14121c', scale = 2.6 }) {
  const map = textMap(label); const { w, h } = mapSize(map); const pw = w * scale + 16, ph = h * scale + 10;
  return `<rect x="${r2(cx - pw / 2)}" y="${r2(cy - ph / 2)}" width="${r2(pw)}" height="${r2(ph)}" rx="${r2(ph / 2)}" fill="${bg}" stroke="${color}" stroke-opacity=".6" stroke-width="1.5"/>` + text(S, label, { cx, cy, scale, color, outline: false });
}

// ───────────────────────── products ─────────────────────────
const money = {
  'money-1m': (S) => {
    frame(S, { glowColor: GOLD.m, glowOpacity: 0.6, shadowCy: 222, shadowRx: 70 });
    S.add(coinFace(S, { cx: 128, cy: 126, r: 82 }));
    S.add(sparkle(52, 58, 12, '#fff'), sparkle(206, 74, 9, '#ffe28a'), sparkle(196, 190, 7, '#fff'));
  },
  'money-10m': (S) => {
    frame(S, { glowColor: GOLD.m, shadowCy: 206, shadowRx: 78 });
    S.add(coinStack(S, { cx: 100, baseY: 176, count: 5, r: 40, h: 11, seed: '10m' }));
    S.add(coinFace(S, { cx: 176, cy: 150, r: 46 }));
    S.add(sparkle(60, 70, 9, '#fff'), sparkle(214, 92, 8, '#ffe28a'));
  },
  'money-25m': (S) => {
    frame(S, { glowColor: GOLD.m, shadowCy: 208, shadowRx: 84 });
    S.add(coinStack(S, { cx: 82, baseY: 178, count: 4, r: 36, h: 10, seed: '25a' }));
    S.add(coinStack(S, { cx: 142, baseY: 184, count: 7, r: 36, h: 10, seed: '25b' }));
    S.add(coinFace(S, { cx: 196, cy: 158, r: 40 }));
    S.add(sparkle(54, 64, 10, '#fff'), sparkle(210, 80, 8, '#ffe28a'), sparkle(40, 150, 6, '#fff'));
  },
  'money-50m': (S) => {
    frame(S, { glowColor: GOLD.m, shadowCy: 210, shadowRx: 90 });
    S.add(coinStack(S, { cx: 70, baseY: 176, count: 5, r: 32, h: 9, seed: '50a' }));
    S.add(coinStack(S, { cx: 186, baseY: 176, count: 6, r: 32, h: 9, seed: '50c' }));
    S.add(coinStack(S, { cx: 128, baseY: 188, count: 9, r: 34, h: 9, seed: '50b' }));
    S.add(coinLying(S, { cx: 44, cy: 196, r: 24, h: 7 }));
    S.add(coinFace(S, { cx: 208, cy: 186, r: 26 }));
    S.add(sparkle(60, 60, 11, '#fff'), sparkle(206, 70, 9, '#ffe28a'), sparkle(128, 44, 7, '#fff'));
  },
  'money-100m': (S) => {
    frame(S, { glowColor: GOLD.m, glowOpacity: 0.6, shadowCy: 212, shadowRx: 96 });
    S.add(coinStack(S, { cx: 62, baseY: 170, count: 6, r: 28, h: 8, seed: 'a' }));
    S.add(coinStack(S, { cx: 194, baseY: 172, count: 7, r: 28, h: 8, seed: 'b' }));
    S.add(coinStack(S, { cx: 100, baseY: 184, count: 10, r: 30, h: 8, seed: 'c' }));
    S.add(coinStack(S, { cx: 156, baseY: 186, count: 12, r: 30, h: 8, seed: 'd' }));
    S.add(coinLying(S, { cx: 40, cy: 196, r: 22, h: 6 }), coinLying(S, { cx: 70, cy: 204, r: 22, h: 6 }), coinLying(S, { cx: 216, cy: 200, r: 22, h: 6 }));
    S.add(coinFace(S, { cx: 128, cy: 196, r: 26 }));
    S.add(sparkle(44, 62, 12, '#fff'), sparkle(212, 56, 10, '#ffe28a'), sparkle(128, 40, 8, '#fff'), sparkle(228, 128, 6, '#fff'));
  },
  'money-250m': (S) => {
    frame(S, { glowColor: GOLD.m, glowOpacity: 0.6, shadowCy: 214, shadowRx: 98 });
    S.add(coinStack(S, { cx: 52, baseY: 172, count: 5, r: 26, h: 8, seed: 'a' }));
    S.add(coinStack(S, { cx: 96, baseY: 186, count: 9, r: 28, h: 8, seed: 'b' }));
    S.add(coinLying(S, { cx: 36, cy: 198, r: 20, h: 6 }), coinLying(S, { cx: 70, cy: 206, r: 20, h: 6 }));
    S.add(moneyBag(S, { cx: 164, cy: 140, scale: 8.2 }));
    S.add(coinLying(S, { cx: 220, cy: 198, r: 20, h: 6 }), coinFace(S, { cx: 124, cy: 198, r: 22 }));
    S.add(sparkle(40, 60, 12, '#fff'), sparkle(218, 66, 10, '#ffe28a'), sparkle(112, 36, 7, '#fff'));
  },
  'money-500m': (S) => {
    frame(S, { glowColor: GOLD.m, glowOpacity: 0.62, shadowCy: 216, shadowRx: 100 });
    S.add(moneyBag(S, { cx: 78, cy: 126, scale: 7.4 }));
    S.add(moneyBag(S, { cx: 172, cy: 116, scale: 6.6 }));
    S.add(goldBar(S, { cx: 150, cy: 174, w: 76 }), goldBar(S, { cx: 72, cy: 182, w: 76 }), goldBar(S, { cx: 112, cy: 150, w: 76 }));
    S.add(coinLying(S, { cx: 226, cy: 194, r: 18, h: 6 }), coinLying(S, { cx: 208, cy: 204, r: 18, h: 6 }), coinFace(S, { cx: 36, cy: 200, r: 18 }));
    S.add(sparkle(36, 58, 12, '#fff'), sparkle(224, 60, 10, '#ffe28a'), sparkle(128, 34, 8, '#fff'));
  },
  'money-1b': (S) => {
    frame(S, { glowColor: GOLD.m, glowOpacity: 0.7, glowRx: 112, shadowCy: 218, shadowRx: 96 });
    S.add(treasureChest(S, { cx: 128, cy: 150, L: 74 }));
    S.add(sparkle(40, 56, 13, '#fff'), sparkle(220, 50, 11, '#ffe28a'), sparkle(128, 30, 9, '#fff'), sparkle(232, 140, 7, '#fff'), sparkle(24, 150, 7, '#ffe28a'));
  },
};

const spawners = {
  'skeleton-spawner': (S) => { frame(S, { glowColor: '#d8dce6', glowOpacity: 0.42 }); S.add(spawnerCube(S, 'skeleton')); },
  'iron-golem-spawner': (S) => { frame(S, { glowColor: '#c8cdd8', glowOpacity: 0.42 }); S.add(spawnerCube(S, 'iron-golem')); },
  'zombie-spawner': (S) => { frame(S, { glowColor: '#4ade80', glowOpacity: 0.45 }); S.add(spawnerCube(S, 'zombie')); },
  'creeper-spawner': (S) => { frame(S, { glowColor: '#5df07a', glowOpacity: 0.5 }); S.add(spawnerCube(S, 'creeper')); },
  'blaze-spawner': (S) => { frame(S, { glowColor: '#ff9d2e', glowOpacity: 0.55 }); S.add(spawnerCube(S, 'blaze')); S.add(embers('blaze', 14, { cy: 130, spread: 100 })); },
  elytra: (S) => {
    frame(S, { glowColor: '#d946ef', glowOpacity: 0.5, shadowCy: 214, shadowRx: 80 });
    S.add(spriteC(S, { map: ELYTRA, palette: ELYTRA_PAL, cx: 128, cy: 122, scale: 11.5 }));
    S.add(sparkle(44, 70, 9, '#f5d0fe'), sparkle(214, 64, 8, '#fff'), sparkle(200, 190, 6, '#f5d0fe'));
  },
  'shulker-box': (S) => { frame(S, { glowColor: '#a855f7', glowOpacity: 0.5 }); S.add(shulker(S, { L: 84 })); },
  totem: (S) => {
    frame(S, { glowColor: '#4ade80', glowOpacity: 0.5, shadowRx: 60 });
    S.add(spriteC(S, { map: TOTEM, palette: TOTEM_PAL, cx: 128, cy: 126, scale: 11 }));
    S.add(sparkle(52, 62, 10, '#ffe28a'), sparkle(206, 80, 8, '#fff'), sparkle(196, 184, 6, '#ffe28a'));
  },
};

const boxes = {
  'coin-crate': (S) => {
    frame(S, { glowColor: GOLD.m, glowOpacity: 0.55 });
    S.add(crate(S, { cx: 128, cy: 130, L: 80 }));
    S.add(coinFace(S, { cx: 100, cy: 160, r: 30 }));
    S.add(coinLying(S, { cx: 168, cy: 76, r: 20, h: 6 }));
    S.add(sparkle(46, 66, 10, '#fff'), sparkle(214, 72, 8, '#ffe28a'));
  },
  'spawner-crate': (S) => {
    frame(S, { glowColor: '#2dd4bf', glowOpacity: 0.5 });
    S.add(isoCube(S, { cx: 128, cy: 130, L: 80, tex: metalCrateTex('#1f6a66', '#2f8f8a', '#9ff2e9') }));
    S.add(spriteC(S, { map: HEADS.skeleton.map, palette: HEADS.skeleton.pal, cx: 100, cy: 160, scale: 4.5 }));
    S.add(sparkle(46, 66, 9, '#99f6e4'), sparkle(214, 72, 8, '#fff'));
  },
  'mystery-box': (S) => {
    frame(S, { glowColor: '#ff5ea8', glowOpacity: 0.58 });
    S.add(giftBox(S, { body: '#ff4f9e', ribbon: '#ffe08a', ribbonL: '#fff6cc', glyphColor: '#fff', cy: 134 }));
    S.add(sparkle(44, 60, 11, '#fff'), sparkle(216, 70, 9, '#ffd1e8'), sparkle(206, 196, 7, '#fff'));
  },
  'elite-mystery-box': (S) => {
    frame(S, { glowColor: '#8b5cf6', glowOpacity: 0.6 });
    S.add(giftBox(S, { body: '#6d3ae0', ribbon: '#f5b400', ribbonL: '#ffe28a', trim: '#ffc233', glyphColor: '#ffe9a8', cy: 134 }));
    S.add(sparkle(44, 60, 11, '#fff'), sparkle(216, 70, 9, '#ffe28a'), sparkle(206, 196, 7, '#fff'), sparkle(30, 160, 6, '#ffe28a'));
  },
  'god-mystery-box': (S) => {
    frame(S, { glowColor: '#ff3b2e', glowOpacity: 0.62 });
    const cracks = { top: new Set(), left: new Set(), right: new Set() };
    const rnd = rng('god');
    for (const f of Object.keys(cracks)) for (let c = 0; c < 2; c++) {
      let i = 2 + Math.floor(rnd() * 12), j = c ? 15 : 0; const dj = c ? -1 : 1;
      for (let k = 0; k < 10; k++) { cracks[f].add(i + ',' + j); const r = rnd(); if (r < 0.3) i++; else if (r < 0.6) i--; else j += dj; i = Math.max(0, Math.min(15, i)); j = Math.max(0, Math.min(15, j)); }
    }
    const base = giftTex({ body: '#1b1a22', ribbon: '#e5243f', ribbonL: '#ff5c6e', trim: '#3a2730', glyph: FONT['?'], glyphColor: '#ffb547', glyphOutline: '#3a1600' });
    S.add(isoCube(S, { cx: 128, cy: 134, L: 84, tex: (i, j, f) => (cracks[f].has(i + ',' + j) ? ((i + j) % 3 === 0 ? '#fff3b0' : '#ffb547') : base(i, j, f)) }));
    S.add(spriteC(S, { map: BOW_RIBBON, palette: { R: '#e5243f', r: '#ff5c6e' }, cx: 128, cy: 90, scale: 4 }));
    S.add(embers('godbox', 16, { cy: 140, spread: 104 }));
  },
  'legendary-crate': (S) => {
    frame(S, { glowColor: '#f0abfc', glowOpacity: 0.6, glowRx: 110 });
    S.add(giftBox(S, { body: '#9d7cff', ribbon: '#f5b400', ribbonL: '#ffe28a', trim: '#ffc233', glyph: null, bow: false, iridescent: true, cy: 134 }));
    S.add(spriteC(S, { map: PADLOCK, palette: PADLOCK_PAL, cx: 92, cy: 158, scale: 4.2 }));
    S.add(sparkles('legend', 9, { cy: 128, spread: 108, colors: ['#fff', '#ffe28a', '#f0abfc'], min: 5, max: 13 }));
  },
};

const investments = {
  'enchanted-golden-apple': (S) => {
    frame(S, { glowColor: '#c084fc', glowOpacity: 0.55, shadowRx: 64 });
    S.add(spriteC(S, { map: APPLE, palette: APPLE_PAL, cx: 128, cy: 128, scale: 11 }));
    S.add(sparkle(52, 64, 10, '#e9d5ff'), sparkle(206, 78, 8, '#fff'), sparkle(198, 186, 6, '#e9d5ff'));
  },
  'gilded-blackstone': (S) => {
    frame(S, { glowColor: GOLD.m, glowOpacity: 0.45 });
    S.add(isoCube(S, { cx: 128, cy: 130, L: 82, tex: noiseTex('gilded', '#2a262c', ['#ffc233', '#d98f00', '#1e1b21', '#3a353c'], 0.2) }));
    S.add(sparkle(50, 62, 9, '#ffe28a'), sparkle(212, 72, 7, '#fff'));
  },
  'nether-star': (S) => {
    frame(S, { glowColor: '#bfe8ff', glowOpacity: 0.7, shadowRx: 56 });
    S.add(glow(S, { cx: 128, cy: 126, rx: 70, ry: 70, color: '#fff', opacity: 0.5, inner: 0.3 }));
    S.add(spriteC(S, { map: STAR, palette: STAR_PAL, cx: 128, cy: 126, scale: 11 }));
    S.add(sparkle(52, 60, 10, '#fff'), sparkle(206, 70, 8, '#bfe8ff'), sparkle(204, 190, 7, '#fff'), sparkle(48, 190, 6, '#bfe8ff'));
  },
  'deepslate-emerald-ore': (S) => {
    frame(S, { glowColor: '#34d399', glowOpacity: 0.5 });
    S.add(isoCube(S, { cx: 128, cy: 130, L: 82, tex: oreTex('emerald', '#3b3f45', '#2f3338', '#1fa85f', '#8df5b8', 3) }));
    S.add(sparkle(50, 62, 9, '#a7f3d0'), sparkle(212, 72, 7, '#fff'));
  },
  'ancient-debris': (S) => {
    frame(S, { glowColor: '#a855f7', glowOpacity: 0.4 });
    S.add(isoCube(S, { cx: 128, cy: 130, L: 82, tex: noiseTex('debris', '#5a3f36', ['#6b4a6b', '#3f2b26', '#7a5a4e', '#4a3029'], 0.3) }));
  },
  'heavy-core': (S) => {
    frame(S, { glowColor: '#7dd3fc', glowOpacity: 0.5 });
    S.add(isoCube(S, { cx: 128, cy: 130, L: 82, tex: heavyCoreTex }));
    S.add(sparkle(50, 62, 9, '#e0f2fe'), sparkle(212, 72, 7, '#fff'));
  },
  'netherite-ingot': (S) => {
    frame(S, { glowColor: '#a78bfa', glowOpacity: 0.42, shadowRx: 80 });
    S.add(spriteC(S, { map: INGOT, palette: INGOT_PAL, cx: 128, cy: 132, scale: 11 }));
    S.add(sparkle(52, 66, 9, '#ffe28a'), sparkle(206, 82, 7, '#fff'));
  },
  'netherite-block': (S) => {
    frame(S, { glowColor: '#a78bfa', glowOpacity: 0.42 });
    S.add(isoCube(S, { cx: 128, cy: 130, L: 82, tex: netheriteBlockTex }));
    S.add(sparkle(50, 62, 8, '#ddd6fe'));
  },
  'dragon-head': (S) => {
    frame(S, { glowColor: '#a855f7', glowOpacity: 0.6, shadowRx: 70 });
    S.add(spriteC(S, { map: DRAGON, palette: DRAGON_PAL, cx: 128, cy: 128, scale: 11 }));
    S.add(sparkle(48, 60, 9, '#e9d5ff'), sparkle(210, 74, 7, '#fff'));
  },
  'starter-investment-box': (S) => { frame(S, { glowColor: '#d97706', glowOpacity: 0.45 }); S.add(vault(S, { cy: 130, metal: '#b87333', metalL: '#dba06a', metalD: '#6b3f16' })); },
  'value-investment-box': (S) => { frame(S, { glowColor: '#cbd5e1', glowOpacity: 0.45 }); S.add(vault(S, { cy: 130, metal: '#a9aebb', metalL: '#dde2ea', metalD: '#5e6572' })); S.add(sparkle(50, 62, 8, '#fff')); },
  'elite-investment-box': (S) => { frame(S, { glowColor: GOLD.m, glowOpacity: 0.55 }); S.add(vault(S, { cy: 130, metal: '#e8b43a', metalL: '#ffe08a', metalD: '#8a5200' })); S.add(sparkle(50, 62, 10, '#fff'), sparkle(212, 72, 8, '#ffe28a')); },
};

const armorShulker = (S, piece, pal, { body, lid, seam, glowColor }) => {
  frame(S, { glowColor, glowOpacity: 0.5 });
  S.add(shulker(S, { cx: 128, cy: 136, L: 76, body, lid, seam }));
  S.add(spriteC(S, { map: piece, palette: pal, cx: 128, cy: 132, scale: 6.4 }));
};
const DIA_SHULKER = { body: '#2bb3cc', lid: '#5fd6ea', seam: '#146e80', glowColor: '#4fd1e8' };
const NETH_SHULKER = { body: '#3b3340', lid: '#5a4f60', seam: '#1f1a22', glowColor: '#a78bfa' };
const armor = {
  'diamond-armor-shulker': (S) => armorShulker(S, CHESTPLATE, DIAMOND, DIA_SHULKER),
  'diamond-helmet-shulker': (S) => armorShulker(S, HELMET, DIAMOND, DIA_SHULKER),
  'diamond-chestplate-shulker': (S) => armorShulker(S, CHESTPLATE, DIAMOND, DIA_SHULKER),
  'diamond-leggings-shulker': (S) => armorShulker(S, LEGGINGS, DIAMOND, DIA_SHULKER),
  'diamond-boots-shulker': (S) => armorShulker(S, BOOTS, DIAMOND, DIA_SHULKER),
  'netherite-armor-set': (S) => {
    frame(S, { glowColor: '#a78bfa', glowOpacity: 0.5, shadowRx: 70 });
    S.add(spriteC(S, { map: HELMET, palette: NETHERITE, cx: 58, cy: 62, scale: 4.4 }));
    S.add(spriteC(S, { map: LEGGINGS, palette: NETHERITE, cx: 200, cy: 72, scale: 4.2 }));
    S.add(spriteC(S, { map: BOOTS, palette: NETHERITE, cx: 204, cy: 200, scale: 4.4 }));
    S.add(spriteC(S, { map: CHESTPLATE, palette: NETHERITE, cx: 128, cy: 136, scale: 8.8 }));
    S.add(sparkle(200, 60, 9, '#ddd6fe'), sparkle(44, 180, 7, '#fff'));
  },
  'pvp-kit': (S) => {
    frame(S, { glowColor: '#f43f5e', glowOpacity: 0.5, shadowRx: 84 });
    S.add(spriteC(S, { map: CHESTPLATE, palette: NETHERITE, cx: 104, cy: 134, scale: 9 }));
    S.add(spriteC(S, { map: SWORD, palette: SWORD_PAL, cx: 168, cy: 118, scale: 8.6 }));
    S.add(spriteC(S, { map: TOTEM, palette: TOTEM_PAL, cx: 54, cy: 186, scale: 3.6 }));
    S.add(sparkle(210, 70, 9, '#fff'), sparkle(40, 80, 7, '#fecdd3'));
  },
  'netherite-armor-shulker': (S) => armorShulker(S, CHESTPLATE, NETHERITE, NETH_SHULKER),
};

const toolShulker = (S, map, pal, label, glowColor) => {
  frame(S, { glowColor, glowOpacity: 0.5 });
  S.add(shulker(S, { cx: 128, cy: 136, L: 76, body: '#3b3340', lid: '#5a4f60', seam: '#1f1a22' }));
  S.add(spriteC(S, { map, palette: pal, cx: 124, cy: 128, scale: 7 }));
  S.add(pill(S, { cx: 196, cy: 206, label }));
};
const tools = {
  'netherite-sword': (S) => { frame(S, { glowColor: '#a78bfa', glowOpacity: 0.5, shadowRx: 70 }); S.add(spriteC(S, { map: SWORD, palette: SWORD_PAL, cx: 128, cy: 126, scale: 11 })); S.add(sparkle(200, 54, 10, '#fff'), sparkle(60, 190, 7, '#ddd6fe')); },
  'netherite-pickaxe': (S) => { frame(S, { glowColor: '#a78bfa', glowOpacity: 0.5, shadowRx: 70 }); S.add(spriteC(S, { map: PICKAXE, palette: PICK_NETHERITE, cx: 128, cy: 128, scale: 11 })); S.add(sparkle(48, 62, 9, '#ddd6fe'), sparkle(214, 180, 7, '#fff')); },
  'god-bow': (S) => { frame(S, { glowColor: '#fb923c', glowOpacity: 0.5, shadowRx: 58 }); S.add(spriteC(S, { map: BOW, palette: BOW_PAL, cx: 128, cy: 126, scale: 11 })); S.add(embers('bow', 8, { cy: 126, spread: 70 }), sparkle(190, 60, 9, '#fff'), sparkle(64, 190, 7, '#fed7aa')); },
  mace: (S) => { frame(S, { glowColor: '#7dd3fc', glowOpacity: 0.5, shadowRx: 70 }); S.add(spriteC(S, { map: MACE, palette: MACE_PAL, cx: 128, cy: 128, scale: 11 })); S.add(sparkle(44, 70, 9, '#e0f2fe'), sparkle(206, 190, 7, '#fff')); },
  trident: (S) => { frame(S, { glowColor: '#2dd4bf', glowOpacity: 0.5, shadowRx: 50 }); S.add(spriteC(S, { map: TRIDENT, palette: TRIDENT_PAL, cx: 128, cy: 128, scale: 11 })); S.add(sparkle(72, 54, 9, '#ccfbf1'), sparkle(190, 74, 7, '#fff'), sparkle(180, 190, 6, '#99f6e4')); },
  'amethyst-pickaxe': (S) => { frame(S, { glowColor: '#c084fc', glowOpacity: 0.6, shadowRx: 70 }); S.add(spriteC(S, { map: PICKAXE, palette: PICK_AMETHYST, cx: 128, cy: 128, scale: 11 })); S.add(sparkle(48, 62, 10, '#f3e8ff'), sparkle(214, 180, 8, '#fff'), sparkle(206, 54, 7, '#e9d5ff')); },
  'netherite-pickaxes-27': (S) => toolShulker(S, PICKAXE, PICK_NETHERITE, '×27', '#a78bfa'),
  'netherite-swords-27': (S) => toolShulker(S, SWORD, SWORD_PAL, '×27', '#f43f5e'),
};

function bundleBase(S, { ribbon, ribbonL, body, glowColor }) {
  frame(S, { glowColor, glowOpacity: 0.55, shadowCy: 222, shadowRx: 80 });
  S.add(isoCube(S, { cx: 128, cy: 166, L: 58, tex: giftTex({ body, ribbon, ribbonL, glyph: null }) }));
}
function miniCage(S, mob, cx, cy, L = 24) { return spawnerCube(S, mob, { cx, cy, L, headScale: L / 12 }); }
const bundles = {
  'starter-bundle': (S) => {
    bundleBase(S, { body: '#2563eb', ribbon: '#ffc233', ribbonL: '#ffe28a', glowColor: '#60a5fa' });
    S.add(coinStack(S, { cx: 70, baseY: 136, count: 4, r: 22, h: 7, seed: 'sb' }));
    S.add(miniCage(S, 'skeleton', 128, 96, 30));
    S.add(spriteC(S, { map: CHESTPLATE, palette: DIAMOND, cx: 188, cy: 112, scale: 4.4 }));
    S.add(sparkle(48, 60, 9, '#fff'), sparkle(214, 62, 8, '#ffe28a'));
  },
  'spawner-farm-bundle': (S) => {
    bundleBase(S, { body: '#0f766e', ribbon: '#d8dce6', ribbonL: '#ffffff', glowColor: '#2dd4bf' });
    S.add(miniCage(S, 'skeleton', 92, 104, 30), miniCage(S, 'skeleton', 164, 104, 30), miniCage(S, 'skeleton', 128, 70, 30));
    S.add(coinFace(S, { cx: 196, cy: 150, r: 20 }));
    S.add(sparkle(44, 70, 9, '#99f6e4'), sparkle(214, 50, 8, '#fff'));
  },
  'pro-bundle': (S) => {
    bundleBase(S, { body: '#7c3aed', ribbon: '#ff5ea8', ribbonL: '#ffb3d6', glowColor: '#a78bfa' });
    S.add(coinStack(S, { cx: 66, baseY: 140, count: 6, r: 22, h: 7, seed: 'pb' }));
    S.add(miniCage(S, 'skeleton', 190, 116, 28));
    S.add(spriteC(S, { map: ELYTRA, palette: ELYTRA_PAL, cx: 128, cy: 88, scale: 5.6 }));
    S.add(sparkle(44, 60, 9, '#fff'), sparkle(214, 52, 8, '#ffb3d6'));
  },
  'basehunter-bundle': (S) => {
    bundleBase(S, { body: '#1f2937', ribbon: '#c084fc', ribbonL: '#e9d5ff', glowColor: '#c084fc' });
    S.add(spriteC(S, { map: ELYTRA, palette: ELYTRA_PAL, cx: 128, cy: 84, scale: 5.6 }));
    S.add(spriteC(S, { map: PICKAXE, palette: PICK_AMETHYST, cx: 72, cy: 124, scale: 5 }));
    S.add(spriteC(S, { map: TOTEM, palette: TOTEM_PAL, cx: 186, cy: 122, scale: 4.2 }));
    S.add(sparkle(44, 60, 9, '#e9d5ff'), sparkle(214, 52, 8, '#fff'));
  },
  'rich-bundle': (S) => {
    bundleBase(S, { body: '#b91c1c', ribbon: '#ffc233', ribbonL: '#ffe28a', glowColor: '#ffc233' });
    S.add(coinStack(S, { cx: 60, baseY: 144, count: 7, r: 22, h: 7, seed: 'rb' }));
    S.add(isoCube(S, { cx: 196, cy: 122, L: 30, tex: giftTex({ body: '#1b1a22', ribbon: '#e5243f', ribbonL: '#ff5c6e', glyph: null }) }));
    S.add(spriteC(S, { map: ELYTRA, palette: ELYTRA_PAL, cx: 128, cy: 82, scale: 5.6 }));
    S.add(spriteC(S, { map: CHESTPLATE, palette: NETHERITE, cx: 132, cy: 130, scale: 4 }));
    S.add(sparkle(40, 56, 11, '#fff'), sparkle(220, 50, 9, '#ffe28a'), sparkle(228, 180, 6, '#fff'));
  },
};

// block textures (8×8) for bases
const T8 = {
  cobble: noiseTex8('cobble', '#6f727b', ['#878a93', '#5d606a', '#7d8089']),
  bricks: (i, j) => (j % 4 === 3 || i === ((Math.floor(j / 4) % 2) ? 3 : 7) ? '#4f535c' : (j % 4 === 0 ? '#848892' : '#7b7f88')),
  planks: (i, j) => (j % 4 === 3 ? '#6b4219' : (i === ((Math.floor(j / 4) % 2) ? 2 : 6) ? '#6b4219' : (j % 4 === 0 ? '#ad7232' : '#a0672a'))),
  roof: (i, j) => (j % 4 === 3 ? '#3f2a10' : (i === ((Math.floor(j / 4) % 2) ? 2 : 6) ? '#3f2a10' : '#6f4a22')),
  door: (i, j) => ((i === 0 || i === 7 || j === 0) ? '#3b2510' : (j === 3 && i === 5) ? '#c9ced6' : (i % 3 === 1) ? '#5a3615' : '#7a4a1d'),
  glass: (i, j) => ((i === 0 || i === 7 || j === 0 || j === 7) ? '#cfe6f2' : (i === 7 - j || i === 6 - j) ? '#e9f6fc' : '#9fd3e8'),
  grass: { top: noiseTex8('grass', '#4caf50', ['#3f9a44', '#5bc25f', '#46a84b']), left: (i, j) => (j < 1 ? '#4caf50' : (j === 1 ? '#3f9a44' : '#7a5230')), right: (i, j) => (j < 1 ? '#4caf50' : (j === 1 ? '#3f9a44' : '#7a5230')) },
  chest: { top: (i, j) => ((i === 0 || i === 7 || j === 0 || j === 7) ? '#5a3813' : '#a0672a'), left: (i, j) => ((i === 0 || i === 7 || j === 0 || j === 7) ? '#5a3813' : j === 2 ? '#4a2e10' : (i === 3 || i === 4) && (j >= 1 && j <= 3) ? '#c9ced6' : '#a0672a'), right: (i, j) => ((i === 0 || i === 7 || j === 0 || j === 7) ? '#5a3813' : j === 2 ? '#4a2e10' : '#a0672a') },
  cage: (i, j) => ((i === 0 || i === 7 || j === 0 || j === 7 || i === 3 || i === 4 || j === 3 || j === 4) ? '#363c4a' : '#141824'),
  stone: noiseTex8('stone', '#7d8089', ['#8f929b', '#6a6d76']),
  mossy: noiseTex8('mossy', '#6f727b', ['#5f8a5c', '#5d606a', '#7d8089'], 0.35),
};
function noiseTex8(seed, base, variants, density = 0.3) {
  const rnd = rng(seed); const faces = {};
  for (const f of ['top', 'left', 'right']) { const g = []; for (let j = 0; j < 8; j++) { g.push([]); for (let i = 0; i < 8; i++) g[j].push(rnd() < density ? variants[Math.floor(rnd() * variants.length)] : base); } faces[f] = g; }
  return (i, j, face) => faces[face][j][i];
}
/** one flat grass slab of `cells` blocks per side (one cube instead of cells² blocks) */
function groundSlab(S, { ox, oy, L, cells, seed = 'ground' }) {
  const rnd = rng(seed); const n = cells * 4; const top = [];
  for (let j = 0; j < n; j++) { top.push([]); for (let i = 0; i < n; i++) top[j].push(rnd() < 0.18 ? (rnd() < 0.5 ? '#3f9a44' : '#5bc25f') : '#4caf50'); }
  const side = (i, j) => (j === 0 ? '#3f9a44' : '#7a5230');
  const big = L * cells, H = 0.28 / cells;
  return isoCube(S, { cx: ox, cy: oy - L * H * cells, L: big, H, n: { top: n, left: 4, right: 4 }, tex: { top: (i, j) => top[j][i], left: side, right: side }, outline: true, outlineWidth: 1.5, edges: false });
}
const bases = {
  'starter-base': (S) => {
    frame(S, { glowColor: '#34d399', glowOpacity: 0.45, shadowCy: 226, shadowRx: 100, shadowRy: 12 });
    const L = 30, ox = 128, oy = 150;
    S.add(groundSlab(S, { ox, oy, L, cells: 4 }));
    const blocks = [];
    // hut 3×2 footprint (x 0..2, y 1..2), walls 2 high, sitting on the slab (z 0..1 → raise by slab)
    for (let x = 0; x < 3; x++) for (let y = 1; y < 3; y++) for (let z = 0; z <= 1; z++) {
      let tex = T8.cobble;
      if ((x === 0 || x === 2) && (y === 1 || y === 2)) tex = T8.planks;
      if (x === 1 && y === 2 && z === 0) tex = T8.door;
      if (x === 2 && y === 1 && z === 1) tex = T8.glass;
      if (x === 1 && y === 2 && z === 1) tex = T8.glass;
      blocks.push({ x, y, z, tex });
    }
    for (let x = 0; x < 3; x++) for (let y = 1; y < 3; y++) blocks.push({ x, y, z: 2, tex: T8.roof, H: 0.5 });
    blocks.push({ x: 3, y: 1, z: 0, tex: T8.chest }, { x: 0, y: 3, z: 0, tex: T8.cage });
    // the slab's top sits at oy - 0.28*L; blocks start at z=0 → shift origin up by slab height + L (block height above its cell floor)
    S.add(blockWorld(S, { ox, oy: oy - L * 0.28 - L * 2, L, blocks }));
    S.add(sparkle(40, 60, 9, '#fff'), sparkle(216, 64, 8, '#a7f3d0'));
  },
  'loaded-base': (S) => {
    frame(S, { glowColor: GOLD.m, glowOpacity: 0.5, shadowCy: 228, shadowRx: 104, shadowRy: 12 });
    const L = 27, ox = 128, oy = 156;
    S.add(groundSlab(S, { ox, oy, L, cells: 4, seed: 'loaded' }));
    const blocks = [];
    // L-shaped back wall (y=0 row, x=0 column), 2 high, with glass
    for (let x = 0; x < 4; x++) for (let z = 0; z <= 1; z++) blocks.push({ x, y: 0, z, tex: z === 1 && (x === 1 || x === 2) ? T8.glass : T8.bricks });
    for (let y = 1; y < 4; y++) for (let z = 0; z <= 1; z++) blocks.push({ x: 0, y, z, tex: z === 1 && y === 2 ? T8.glass : T8.bricks });
    // storage row + spawners + a stash chest up front
    blocks.push({ x: 1, y: 1, z: 0, tex: T8.chest }, { x: 2, y: 1, z: 0, tex: T8.chest }, { x: 3, y: 1, z: 0, tex: T8.chest });
    blocks.push({ x: 1, y: 2, z: 0, tex: T8.cage }, { x: 2, y: 2, z: 0, tex: T8.cage });
    blocks.push({ x: 3, y: 3, z: 0, tex: T8.chest }, { x: 1, y: 3, z: 0, tex: T8.planks, H: 0.5 });
    S.add(blockWorld(S, { ox, oy: oy - L * 0.28 - L * 2, L, blocks }));
    S.add(coinFace(S, { cx: 224, cy: 172, r: 16 }), coinLying(S, { cx: 36, cy: 196, r: 14, h: 5 }));
    S.add(sparkle(40, 56, 10, '#fff'), sparkle(218, 60, 8, '#ffe28a'), sparkle(230, 120, 6, '#fff'));
  },
};

const PRODUCTS = { ...money, ...spawners, ...boxes, ...investments, ...armor, ...tools, ...bundles, ...bases };

function fallbackProduct(S) {
  frame(S, { glowColor: '#94a3b8', glowOpacity: 0.35 });
  S.add(isoCube(S, { cx: 128, cy: 142, L: 76, H: 0.72, tex: chestTex('#6b7280', '#374151', '#9ca3af') }));
  S.add(isoCube(S, { cx: 128, cy: 142 - 76 * 0.72, L: 76, H: 0.26, tex: { top: chestLidTex('#6b7280', '#374151'), left: chestTex('#6b7280', '#374151', '#9ca3af'), right: chestTex('#6b7280', '#374151', '#9ca3af') } }));
  S.add(text(S, '?', { cx: 128, cy: 100, scale: 7, color: '#e5e7eb' }));
}

// ───────────────────────── category icons (64×64) ─────────────────────────
const circleMap = shapeMap(16, 16, (i, j) => { const d = Math.hypot(i - 7.5, j - 7.5); if (d > 7.6) return '.'; if (d > 6.2) return (i + j) < 15 ? 'G' : 'D'; return 'g'; });
const COIN_ICON = stamp(circleMap, FONT.$, 5, 4, 'S');
const CAGE_ICON = shapeMap(16, 16, (i, j) => { const bar = i === 0 || i === 15 || j === 0 || j === 15 || i === 5 || i === 10 || j === 5 || j === 10; if (bar) return (i === 0 || j === 0) ? 'L' : 'B'; if (i >= 6 && i <= 9 && j >= 6 && j <= 9) return (i === 7 || i === 8) && (j === 7 || j === 8) ? 'F' : 'f'; return 'h'; });
const MYSTERY_ICON = stamp(shapeMap(16, 16, (i, j) => (j < 2 ? '.' : (j === 2 || j === 15 || i === 0 || i === 15) ? 'D' : j < 5 ? 'L' : j === 5 ? 'D' : 'P')), FONT['?'], 5, 7, 'W');
const GEM_ICON = shapeMap(16, 16, (i, j) => { const top = 2, mid = 6, bot = 14; if (j < top || j > bot) return '.'; if (j <= mid) { const half = 3 + (j - top) * 1.2; if (Math.abs(i - 7.5) > half) return '.'; return (i < 7.5 - half + 2) ? 'L' : (i > 7.5 + half - 2 ? 'D' : 'E'); } const half = 7.5 * (1 - (j - mid) / (bot - mid + 1)); if (Math.abs(i - 7.5) > half) return '.'; return i < 6 ? 'E' : i > 9 ? 'D' : 'L'; });
const GIFT_ICON = shapeMap(16, 16, (i, j) => { if (j === 0 && (i === 5 || i === 6 || i === 9 || i === 10)) return 'R'; if (j === 1 && i >= 4 && i <= 11 && i !== 7 && i !== 8) return 'R'; if (j === 2 && i >= 6 && i <= 9) return 'R'; if (j < 3) return '.'; if (i === 7 || i === 8) return 'R'; if (j === 3 || j === 6 || j === 15 || i === 0 || i === 15) return 'D'; return j < 6 ? 'L' : 'B'; });
const HOUSE_ICON = [
  '.......RR.......', '......RRRR......', '.....RRRRRR.....', '....RRRRRRRR....', '...RRRRRRRRRR...', '..RRRRRRRRRRRR..', '.RRRRRRRRRRRRRR.',
  '..WWWWWWWWWWWW..', '..WWwwWWWWwwWW..', '..WWwwWWWWwwWW..', '..WWWWWddWWWWW..', '..WWWWWddWWWWW..', '..WWWWWdkWWWWW..', '..WWWWWddWWWWW..', '..WWWWWddWWWWW..',
];
const CATEGORY_ICONS = {
  money: { map: COIN_ICON, pal: { g: '#ffc233', G: '#ffe99a', D: '#d98f00', S: '#8a5200' } },
  spawners: { map: CAGE_ICON, pal: { B: '#3a4150', L: '#5b6478', h: '#141824', f: '#9bffb3', F: '#f0fff4' } },
  mystery: { map: MYSTERY_ICON, pal: { P: '#ff4f9e', L: '#ff8fc2', D: '#b8186a', W: '#fff' } },
  investments: { map: GEM_ICON, pal: { E: '#22c55e', L: '#86efac', D: '#15803d' } },
  armor: { map: CHESTPLATE, pal: DIAMOND },
  tools: { map: PICKAXE, pal: PICK_STEEL },
  bundles: { map: GIFT_ICON, pal: { R: '#ffc233', D: '#1d4ed8', L: '#60a5fa', B: '#3b82f6' } },
  bases: { map: HOUSE_ICON, pal: { R: '#ef4444', W: '#d6a35c', w: '#9fd3e8', d: '#5a3615', k: '#ffe08a' } },
};
function categoryIcon(id) {
  const S = new Scene('cat-' + id, { w: 64, h: 64 });
  const { map, pal } = CATEGORY_ICONS[id];
  const { w, h } = mapSize(map); const scale = 56 / Math.max(w, h);
  S.add(sprite(S, { map, palette: pal, x: 32 - (w * scale) / 2, y: 32 - (h * scale) / 2, scale, outlineColor: '#0b0d14' }));
  return S.toString();
}

// ───────────────────────── payment badges (48×32, drawn at 96×64) ─────────────────────────
function badge(id, bg, inner, { border = 'rgba(255,255,255,.14)' } = {}) {
  const S = new Scene('pay-' + id, { w: 96, h: 64, width: 48, height: 32 });
  S.add(`<rect x="1" y="1" width="94" height="62" rx="12" fill="${bg}" stroke="${border}" stroke-width="2"/>`);
  S.add(typeof inner === 'function' ? inner(S) : inner);
  return S.toString();
}
const P_LETTER = (x, y, color, s = 1) => `<path d="M${x},${y + 30 * s}V${y}h${13 * s}a${9 * s},${9 * s} 0 0 1 0,${18 * s}h-${13 * s}" fill="none" stroke="${color}" stroke-width="${7 * s}" stroke-linejoin="round" stroke-linecap="round"/>`;
const PAYMENTS = {
  paypal: () => badge('paypal', '#0b2d7a', P_LETTER(34, 16, '#74b6ff') + P_LETTER(44, 22, '#ffffff', 0.9)),
  card: () => badge('card', '#1f2937', `<rect x="18" y="14" width="60" height="38" rx="6" fill="#e5e7eb"/><rect x="18" y="22" width="60" height="8" fill="#111827"/><rect x="24" y="36" width="14" height="10" rx="2" fill="#ffc233"/><rect x="44" y="40" width="26" height="4" rx="2" fill="#9ca3af"/>`),
  visa: () => badge('visa', '#1434cb', (S) => text(S, 'VISA', { cx: 48, cy: 32, scale: 3, color: '#fff', outline: false }) + `<rect x="18" y="50" width="60" height="4" rx="2" fill="#f7b600"/>`),
  mastercard: () => badge('mastercard', '#17171a', (S) => { const c = S.uid('clip'); S.def(`<clipPath id="${c}"><circle cx="38" cy="32" r="18"/></clipPath>`); return `<circle cx="38" cy="32" r="18" fill="#eb001b"/><circle cx="58" cy="32" r="18" fill="#f79e1b"/><circle cx="58" cy="32" r="18" fill="#ff5f00" clip-path="url(#${c})"/>`; }),
  amex: () => badge('amex', '#016fd0', (S) => text(S, 'AMEX', { cx: 48, cy: 32, scale: 3, color: '#fff', outline: false }) + `<rect x="18" y="10" width="60" height="3" rx="1.5" fill="#fff" opacity=".6"/><rect x="18" y="51" width="60" height="3" rx="1.5" fill="#fff" opacity=".6"/>`),
  applepay: () => badge('applepay', '#000', (S) => `<path d="M30,20c-5,0-9,4-9,11s4,15,8,15c2,0,3-1,5-1s3,1,5,1c4,0,8-8,8-8s-5-2-5-8c0-5,4-7,4-7s-3-4-7-4c-3,0-4,1-5,1s-2-1-4-1Z" fill="#fff"/><path d="M35,19c2-1,4-3,4-7-3,0-6,3-6,7Z" fill="#fff"/>` + text(S, 'PAY', { x: 50, y: 22, scale: 2.8, color: '#fff', outline: false })),
  googlepay: () => badge('googlepay', '#ffffff', (S) => `<path d="M30,18a14,14 0 1 1 -10,4" fill="none" stroke="#4285f4" stroke-width="6"/><path d="M20,22a14,14 0 0 1 10,-4" fill="none" stroke="#ea4335" stroke-width="6"/><path d="M16,32a14,14 0 0 1 4,-10" fill="none" stroke="#fbbc05" stroke-width="6"/><path d="M20,42a14,14 0 0 1 -4,-10" fill="none" stroke="#34a853" stroke-width="6"/><rect x="30" y="30" width="14" height="6" fill="#4285f4"/>` + text(S, 'PAY', { x: 50, y: 22, scale: 2.8, color: '#3c4043', outline: false }), { border: '#d1d5db' }),
  bitcoin: () => badge('bitcoin', '#1b1b1b', (S) => `<circle cx="48" cy="32" r="23" fill="#f7931a"/>` + text(S, '₿', { cx: 48, cy: 32, scale: 3.2, color: '#fff', outline: false })),
  ethereum: () => badge('ethereum', '#1c1c2e', `<polygon points="48,8 66,34 48,46 30,34" fill="#8c8cff"/><polygon points="48,8 48,46 30,34" fill="#b5b5ff"/><polygon points="48,34 66,34 48,46" fill="#6f6fe0" opacity=".9"/><polygon points="48,50 66,38 48,58 30,38" fill="#8c8cff"/><polygon points="48,50 48,58 30,38" fill="#b5b5ff"/>`),
  litecoin: () => badge('litecoin', '#345d9d', (S) => `<circle cx="48" cy="32" r="23" fill="#dfe3ea"/>` + text(S, 'Ł', { cx: 48, cy: 32, scale: 3.2, color: '#345d9d', outline: false })),
  tether: () => badge('tether', '#0f3d31', (S) => `<circle cx="48" cy="32" r="23" fill="#26a17b"/>` + text(S, '₮', { cx: 48, cy: 32, scale: 3.2, color: '#fff', outline: false })),
  bank: () => badge('bank', '#263044', `<polygon points="48,10 78,24 18,24" fill="#c9d3e0"/><rect x="22" y="26" width="52" height="4" fill="#c9d3e0"/><rect x="26" y="32" width="6" height="16" fill="#c9d3e0"/><rect x="38" y="32" width="6" height="16" fill="#c9d3e0"/><rect x="52" y="32" width="6" height="16" fill="#c9d3e0"/><rect x="64" y="32" width="6" height="16" fill="#c9d3e0"/><rect x="20" y="50" width="56" height="5" fill="#c9d3e0"/>`),
  revolut: () => badge('revolut', '#191c1f', (S) => text(S, 'R', { cx: 48, cy: 32, scale: 5, color: '#fff', outline: false })),
  giftcard: () => badge('giftcard', '#3b1d5a', (S) => `<rect x="18" y="16" width="60" height="36" rx="6" fill="#ff5ea8"/><rect x="44" y="16" width="8" height="36" fill="#ffc233"/><rect x="18" y="30" width="60" height="8" fill="#ffc233"/>` + spriteC(S, { map: BOW_RIBBON, palette: { R: '#ffc233', r: '#ffe28a' }, cx: 48, cy: 15, scale: 1.6, outline: false })),
  generic: () => badge('generic', '#1f2937', `<rect x="18" y="16" width="56" height="36" rx="7" fill="#9ca3af"/><rect x="18" y="22" width="56" height="26" rx="4" fill="#6b7280"/><rect x="52" y="28" width="26" height="14" rx="4" fill="#e5e7eb"/><circle cx="64" cy="35" r="4" fill="#ffc233"/>`),
};

// ───────────────────────── brand ─────────────────────────
function donut(S, { cx, cy, R, hole, face = false, sprinkles = 8, seed = 'donut', gloss = true, frostingDepth = 0.6, wave = 0.07, outline = true }) {
  const ring = (ro, ri) => `M${r2(cx - ro)},${r2(cy)}a${r2(ro)},${r2(ro)} 0 1 0 ${r2(2 * ro)},0a${r2(ro)},${r2(ro)} 0 1 0 ${r2(-2 * ro)},0zM${r2(cx - ri)},${r2(cy)}a${r2(ri)},${r2(ri)} 0 1 1 ${r2(2 * ri)},0a${r2(ri)},${r2(ri)} 0 1 1 ${r2(-2 * ri)},0z`;
  const doughG = radial(S, [[0, '#f6cd88'], [0.7, '#e5a95a'], [1, '#b97a35']], { cx: '42%', cy: '38%', r: '62%' });
  let s = `<path d="${ring(R, hole)}" fill="url(#${doughG})" fill-rule="evenodd"/>`;
  // frosting = ring clipped to the region above a wavy (drippy) line
  const yLine = cy - R + 2 * R * frostingDepth;
  const rnd = rng(seed);
  let d = `M${r2(cx - R - 8)},${r2(cy - R - 8)}H${r2(cx + R + 8)}V${r2(yLine)}`;
  let x = cx + R + 8; const left = cx - R - 8;
  while (x > left + 0.5) { const w = Math.min(R * (0.26 + rnd() * 0.18), x - left); const depth = R * wave * (0.7 + rnd() * 1.2); d += `q${r2(-w / 2)},${r2(depth * 2)} ${r2(-w)},0`; x -= w; }
  d += 'Z';
  const clip = S.uid('clip');
  S.def(`<clipPath id="${clip}"><path d="${d}"/></clipPath>`);
  const frostG = linear(S, [[0, '#ff9ccd'], [0.55, '#ff5ea8'], [1, '#e2307c']], { x1: 0, y1: 0, x2: 0.35, y2: 1 });
  s += `<g clip-path="url(#${clip})"><path d="${ring(R * 0.955, hole * 1.12)}" fill="url(#${frostG})" fill-rule="evenodd"/></g>`;
  // hole inner shadow
  const holeG = radial(S, [[0, '#000', 0], [0.62, '#000', 0.32], [1, '#000', 0]]);
  s += `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(hole * 1.6)}" fill="url(#${holeG})"/>`;
  s += `<path d="${ring(hole * 1.001, hole * 0.999)}" fill="none"/>`;
  // sprinkles
  const cols = ['#ffffff', '#ffd56a', '#4ade80', '#60a5fa', '#a78bfa', '#ffb3d6'];
  let k = 0, tries = 0;
  while (k < sprinkles && tries < 200) {
    tries++;
    const a = -Math.PI * 1.05 + rnd() * Math.PI * 1.1;
    const rr = hole * 1.45 + rnd() * (R * 0.9 - hole * 1.45);
    const sx = cx + Math.cos(a) * rr, sy = cy + Math.sin(a) * rr;
    if (sy > yLine - R * 0.1) continue;
    const rot = Math.floor(rnd() * 180);
    s += `<rect x="${r2(sx - R * 0.11)}" y="${r2(sy - R * 0.04)}" width="${r2(R * 0.22)}" height="${r2(R * 0.08)}" rx="${r2(R * 0.04)}" fill="${cols[k % cols.length]}" transform="rotate(${rot} ${r2(sx)} ${r2(sy)})"/>`;
    k++;
  }
  if (gloss) s += `<ellipse cx="${r2(cx - R * 0.38)}" cy="${r2(cy - R * 0.52)}" rx="${r2(R * 0.26)}" ry="${r2(R * 0.1)}" fill="#fff" opacity=".38" transform="rotate(-28 ${r2(cx - R * 0.38)} ${r2(cy - R * 0.52)})"/>`;
  if (face) {
    const ex = R * 0.32, ey = cy - R * 0.52, er = R * 0.13;
    for (const sgn of [-1, 1]) {
      const exx = cx + sgn * ex;
      s += `<ellipse cx="${r2(exx)}" cy="${r2(ey)}" rx="${r2(er)}" ry="${r2(er * 1.2)}" fill="#fff"/>`;
      s += `<circle cx="${r2(exx + er * 0.2)}" cy="${r2(ey + er * 0.15)}" r="${r2(er * 0.55)}" fill="#1a1020"/>`;
      s += `<circle cx="${r2(exx + er * 0.38)}" cy="${r2(ey - er * 0.22)}" r="${r2(er * 0.2)}" fill="#fff"/>`;
      s += `<ellipse cx="${r2(cx + sgn * R * 0.58)}" cy="${r2(cy - R * 0.22)}" rx="${r2(R * 0.11)}" ry="${r2(R * 0.07)}" fill="#ff8fc2" opacity=".7"/>`;
    }
    s += `<path d="M${r2(cx - R * 0.14)},${r2(cy - R * 0.33)}q${r2(R * 0.14)},${r2(R * 0.11)} ${r2(R * 0.28)},0" fill="none" stroke="#1a1020" stroke-width="${r2(R * 0.035)}" stroke-linecap="round"/>`;
  }
  if (outline) s += `<path d="${ring(R, hole)}" fill="none" stroke="#2a1b10" stroke-opacity=".45" stroke-width="${r2(Math.max(1, R * 0.03))}" fill-rule="evenodd"/>`;
  return s;
}
function logoSvg() {
  const S = new Scene('logo', { w: 64, h: 64 });
  S.add(donut(S, { cx: 27, cy: 30, R: 25, hole: 8.5, sprinkles: 7, seed: 'logo' }));
  S.add(coinFace(S, { cx: 47, cy: 47, r: 15 }));
  return S.toString();
}
function faviconSvg() {
  const S = new Scene('favicon', { w: 64, h: 64 });
  S.add(donut(S, { cx: 29, cy: 30, R: 27, hole: 9, sprinkles: 5, seed: 'fav', gloss: false, wave: 0.09 }));
  S.add(coinFace(S, { cx: 48, cy: 48, r: 15 }));
  return S.toString();
}
function mascotSvg() {
  const S = new Scene('mascot');
  S.add(glow(S, { cx: 128, cy: 136, rx: 122, ry: 118, color: '#ff5ea8', opacity: 0.45 }));
  S.add(glow(S, { cx: 150, cy: 150, rx: 90, ry: 90, color: '#ffc233', opacity: 0.35 }));
  S.add(shadow(S, { cx: 128, cy: 232, rx: 92, ry: 12, opacity: 0.5 }));
  // crown of coins (behind the donut)
  S.add(`<path d="M70,74 L78,40 L98,62 L118,28 L138,62 L158,40 L166,74 Z" fill="#f2a900" stroke="#8a5200" stroke-width="2.5" stroke-linejoin="round"/>`);
  S.add(`<rect x="68" y="66" width="100" height="16" rx="5" fill="#ffc233" stroke="#8a5200" stroke-width="2.5"/>`);
  S.add(coinFace(S, { cx: 78, cy: 42, r: 10, glyph: false }), coinFace(S, { cx: 118, cy: 30, r: 12, glyph: false }), coinFace(S, { cx: 158, cy: 42, r: 10, glyph: false }));
  S.add(`<circle cx="92" cy="74" r="4" fill="#ff5ea8"/><circle cx="118" cy="74" r="4" fill="#60a5fa"/><circle cx="144" cy="74" r="4" fill="#4ade80"/>`);
  S.add(donut(S, { cx: 118, cy: 142, R: 84, hole: 22, sprinkles: 12, seed: 'mascot', face: true, wave: 0.075 }));
  S.add(coinFace(S, { cx: 206, cy: 194, r: 40 }));
  S.add(sparkle(34, 60, 13, '#fff'), sparkle(226, 86, 11, '#ffe28a'), sparkle(50, 214, 9, '#fff'), sparkle(236, 150, 8, '#fff'), sparkle(200, 18, 7, '#ffe28a'), sparkle(16, 130, 7, '#ffb3d6'));
  return S.toString();
}
function wordmarkSvg() {
  const S = new Scene('wordmark', { w: 260, h: 40 });
  const scale = 4;
  S.add(text(S, 'DONUT', { x: 6, y: 6, scale, color: '#f4f5f9', outlineColor: '#0b0d14' }));
  S.add(text(S, 'COINS', { x: 6 + (5 * 6) * scale + 2, y: 6, scale, color: '#ff5ea8', outlineColor: '#0b0d14' }));
  return S.toString();
}
function ogHtml(mascot, logo) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>DonutCoins OG image</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden}
  body{background:#0b0d14;color:#f4f5f9;font-family:'Plus Jakarta Sans','Inter','Segoe UI',system-ui,-apple-system,sans-serif;position:relative}
  .g1{position:absolute;left:-220px;top:-280px;width:900px;height:820px;background:radial-gradient(closest-side,rgba(255,194,51,.30),transparent)}
  .g2{position:absolute;right:-160px;top:-120px;width:820px;height:820px;background:radial-gradient(closest-side,rgba(255,94,168,.34),transparent)}
  .g3{position:absolute;left:300px;bottom:-420px;width:900px;height:700px;background:radial-gradient(closest-side,rgba(139,92,246,.22),transparent)}
  .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:48px 48px;-webkit-mask-image:radial-gradient(circle at 55% 50%,#000 25%,transparent 72%)}
  .wrap{position:absolute;inset:0;display:flex;align-items:center;padding:0 76px;gap:30px}
  .txt{flex:1;min-width:0}
  .brand{display:flex;align-items:center;gap:14px;font-weight:800;font-size:30px;margin-bottom:26px;letter-spacing:-.01em}
  .brand img{width:48px;height:48px}
  .brand b{color:#ff5ea8}
  h1{margin:0 0 14px;font-size:100px;line-height:.98;letter-spacing:-.045em;font-weight:800;background:linear-gradient(120deg,#ffc233 0%,#ff5ea8 100%);-webkit-background-clip:text;background-clip:text;color:transparent;white-space:nowrap}
  .sub{font-size:29px;font-weight:700;color:#b4b9c8;margin-bottom:28px;letter-spacing:-.01em;white-space:nowrap}
  .pills{display:flex;gap:10px;flex-wrap:nowrap}
  .pill{padding:10px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);font-size:19px;font-weight:700;color:#f4f5f9;white-space:nowrap}
  .pill.gold{border-color:rgba(255,194,51,.5);color:#ffd56a}
  .mascot{width:400px;height:400px;flex:none;filter:drop-shadow(0 30px 60px rgba(0,0,0,.5))}
  .url{position:absolute;right:76px;bottom:34px;font-size:22px;font-weight:700;color:#7d8496;letter-spacing:.02em}
</style></head>
<body>
  <div class="g1"></div><div class="g2"></div><div class="g3"></div><div class="grid"></div>
  <div class="wrap">
    <div class="txt">
      <div class="brand"><img src="data:image/svg+xml;utf8,${encodeURIComponent(logo)}" alt=""><span>Donut<b>Coins</b></span></div>
      <h1>DonutCoins</h1>
      <div class="sub">DonutSMP Money · Spawners · Mystery Boxes</div>
      <div class="pills"><span class="pill gold">Daily free spin</span><span class="pill">Fast in-game delivery</span><span class="pill">PayPal &amp; crypto</span></div>
    </div>
    <div class="mascot">${mascot}</div>
  </div>
</body></html>`;
}
async function renderOg(html, outPng) {
  const candidates = [process.env.PLAYWRIGHT_MODULE, '/opt/node-tools/node_modules/playwright/index.mjs', 'playwright'].filter(Boolean);
  let pw = null;
  for (const c of candidates) { try { pw = await import(c); break; } catch { /* next */ } }
  if (!pw) { console.log('  ! Playwright not found – skipped og.png (set PLAYWRIGHT_MODULE or install playwright)'); return false; }
  const browser = await pw.chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: outPng, type: 'png' });
  } finally { await browser.close(); }
  return true;
}

// ───────────────────────── main ─────────────────────────
function write(rel, content) { const p = join(OUT, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, content); return p; }

async function main() {
  const noOg = process.argv.includes('--no-og');
  let count = 0, bytes = 0;
  const put = (rel, svg) => { write(rel, svg); count++; bytes += svg.length; };

  for (const [slug, build] of Object.entries(PRODUCTS)) { const S = new Scene('p-' + slug); build(S); put(`products/${slug}.svg`, S.toString()); }
  { const S = new Scene('p-fallback'); fallbackProduct(S); put('products/_fallback.svg', S.toString()); }
  for (const id of Object.keys(CATEGORY_ICONS)) put(`categories/${id}.svg`, categoryIcon(id));
  for (const [id, fn] of Object.entries(PAYMENTS)) put(`payments/${id}.svg`, fn());
  const logo = logoSvg(), mascot = mascotSvg();
  put('brand/logo.svg', logo);
  put('brand/favicon.svg', faviconSvg());
  put('brand/mascot.svg', mascot);
  put('brand/wordmark.svg', wordmarkSvg());
  const html = ogHtml(mascot, logo);
  write('brand/og.html', html); count++;
  console.log(`✓ wrote ${count} files (${(bytes / 1024).toFixed(0)} KB of SVG) to ${OUT}`);
  if (!noOg) {
    const ok = await renderOg(html, join(OUT, 'brand', 'og.png'));
    if (ok) console.log('✓ rendered brand/og.png (1200×630)');
  }
}
main().catch((e) => { console.error(e); process.exit(1); });

export { PRODUCTS, CATEGORY_ICONS, PAYMENTS };
