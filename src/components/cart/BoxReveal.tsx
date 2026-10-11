import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { BoxContent, OrderItem, Product, RolledContent } from '../../shared/types';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../ui/Icons';
import { Thumb } from './Thumb';
import { fireConfetti } from './confetti';
import { findDropImage, markRevealed, prefersReducedMotion, RARITY_RANK, topRarity, type Rarity } from './cartUtils';

interface BoxInstance {
  key: string;
  item: OrderItem;
  product?: Product;
  drops: RolledContent[];
  index: number;
}

type Phase = 'idle' | 'strip' | 'flipping' | 'done';

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9ca3af',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  epic: '#c084fc',
  legendary: '#fbbf24',
};

/* deterministic rng so a reload replays the same strip */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Case-opening reveal for mystery boxes in an order. One horizontal strip
 * spins for the first box (landing on its rarest drop), then every box card
 * flips to show the server-rolled contents. Results persist per order id.
 */
export function BoxReveal({ orderId, items, initiallyRevealed }: { orderId: string; items: OrderItem[]; initiallyRevealed: boolean }) {
  const { products, productById } = useStore();
  const boxes = useMemo<BoxInstance[]>(
    () =>
      items.flatMap((item) =>
        (item.rolled ?? []).map((drops, index) => ({
          key: `${item.productId}-${index}`,
          item,
          product: productById(item.productId),
          drops,
          index,
        })),
      ),
    [items, productById],
  );
  const [phase, setPhase] = useState<Phase>(initiallyRevealed ? 'done' : 'idle');
  const [flipped, setFlipped] = useState(initiallyRevealed ? boxes.length : 0);
  const timers = useRef<number[]>([]);
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const bestRarity = useMemo(() => boxes.reduce<Rarity>((best, b) => (RARITY_RANK[topRarity(b.drops)] > RARITY_RANK[best] ? topRarity(b.drops) : best), 'common'), [boxes]);

  const finish = useCallback(
    (celebrate = true) => {
      clearTimers();
      setFlipped(boxes.length);
      setPhase('done');
      markRevealed(orderId);
      if (celebrate && RARITY_RANK[bestRarity] >= RARITY_RANK.epic) {
        fireConfetti({ colors: [RARITY_COLORS[bestRarity], '#fff', '#ffc233', '#ff5ea8'], count: bestRarity === 'legendary' ? 220 : 140 });
      }
    },
    [boxes.length, orderId, bestRarity],
  );

  const startFlips = useCallback(() => {
    setPhase('flipping');
    boxes.forEach((_, i) => timers.current.push(window.setTimeout(() => setFlipped(i + 1), 120 + i * 320)));
    timers.current.push(window.setTimeout(() => finish(true), 120 + boxes.length * 320 + 500));
  }, [boxes, finish]);

  const open = () => {
    if (prefersReducedMotion()) {
      finish(false);
      return;
    }
    const pool = boxes[0]?.product?.contents?.filter((c) => (c.weight ?? 1) > 0) ?? [];
    if (pool.length >= 3) setPhase('strip');
    else startFlips();
  };

  if (!boxes.length) return null;
  const first = boxes[0];
  const count = boxes.length;

  return (
    <section className={`rv card rv-${phase}`} aria-live="polite">
      <header className="rv-head">
        <div>
          <div className="eyebrow">Mystery boxes</div>
          <h2>{phase === 'done' ? 'Your drops' : `Open your ${count === 1 ? 'box' : `${count} boxes`}`}</h2>
        </div>
        {phase === 'done' && (
          <span className={`badge rv-best rv-badge-${bestRarity}`}>
            <Icon name="sparkles" size={12} /> best: {bestRarity}
          </span>
        )}
      </header>

      {phase === 'idle' && (
        <div className="rv-idle">
          <div className="rv-idle-art">
            <Thumb src={first.product?.image ?? first.item.image} size={120} />
            <span className="rv-idle-q pixel">?</span>
          </div>
          <p className="muted small">
            {count === 1 ? 'One box' : `${count} boxes`} rolled by the server when you ordered. Ready to see what&apos;s inside?
          </p>
          <div className="rv-idle-actions">
            <button type="button" className="btn btn-pink btn-lg" onClick={open}>
              <Icon name="box" size={18} /> Open {count === 1 ? 'box' : 'boxes'}
            </button>
            <button type="button" className="rv-skip" onClick={() => finish(false)}>
              Skip animation
            </button>
          </div>
        </div>
      )}

      {phase === 'strip' && first.product && (
        <CaseStrip pool={first.product.contents?.filter((c) => (c.weight ?? 1) > 0) ?? []} target={pickTarget(first.drops)} products={products} seed={orderId} onDone={startFlips} />
      )}

      {phase !== 'idle' && (
        <div className="rv-grid">
          {boxes.map((b, i) => (
            <RevealCard key={b.key} box={b} flipped={i < flipped} products={products} />
          ))}
        </div>
      )}

      {(phase === 'strip' || phase === 'flipping') && (
        <button type="button" className="rv-skip" onClick={() => finish(true)}>
          Skip animation
        </button>
      )}
      {phase === 'done' && <p className="rv-foot">Drops are rolled server-side when the order is placed and handed over together with your delivery.</p>}
    </section>
  );
}

function pickTarget(drops: RolledContent[]): RolledContent {
  return [...drops].sort((a, b) => RARITY_RANK[b.rarity ?? 'common'] - RARITY_RANK[a.rarity ?? 'common'])[0] ?? { name: '?', qty: 1 };
}

const TILE_W = 104;
const TILE_GAP = 8;
const TILE = TILE_W + TILE_GAP;
const COUNT = 46;
const TARGET = 38;

function CaseStrip({ pool, target, products, seed, onDone }: { pool: BoxContent[]; target: RolledContent; products: Product[]; seed: string; onDone: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [go, setGo] = useState(false);
  const doneRef = useRef(false);

  const tiles = useMemo(() => {
    const rng = mulberry32(hashStr(seed));
    const arr: { name: string; rarity?: Rarity; image?: string }[] = Array.from({ length: COUNT }, () => {
      const c = pool[Math.floor(rng() * pool.length)];
      return { name: c.name, rarity: c.rarity, image: findDropImage(c.name, products, c.image) };
    });
    arr[TARGET] = { name: target.name, rarity: target.rarity, image: findDropImage(target.name, products, target.image) };
    // avoid identical neighbours around the target for a clearer "landing"
    for (const i of [TARGET - 1, TARGET + 1]) {
      if (arr[i].name === target.name) {
        const alt = pool.find((c) => c.name !== target.name);
        if (alt) arr[i] = { name: alt.name, rarity: alt.rarity, image: findDropImage(alt.name, products, alt.image) };
      }
    }
    return arr;
  }, [pool, target, products, seed]);

  const jitter = useMemo(() => (mulberry32(hashStr(`${seed}:j`))() - 0.5) * (TILE_W * 0.6), [seed]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);

  useEffect(() => {
    if (!width) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setGo(true)));
    return () => cancelAnimationFrame(id);
  }, [width]);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (!go) return;
    const t = window.setTimeout(finish, 4900);
    return () => window.clearTimeout(t);
  }, [go, finish]);

  const offset = width ? -(TARGET * TILE + TILE_W / 2 - width / 2) + jitter : 0;

  return (
    <div className="strip" ref={containerRef} aria-hidden="true">
      <div className="strip-marker" />
      <div
        className="strip-track"
        style={{ transform: `translateX(${go ? offset : 0}px)`, transition: go ? 'transform 4.4s cubic-bezier(0.1, 0.85, 0.15, 1)' : 'none' }}
        onTransitionEnd={(e) => {
          if (e.propertyName === 'transform') finish();
        }}
      >
        {tiles.map((t, i) => (
          <div key={i} className={`strip-tile rv-tile-${t.rarity ?? 'common'} ${i === TARGET ? 'is-target' : ''}`} style={{ width: TILE_W, marginRight: TILE_GAP }}>
            <Thumb src={t.image} size={56} rarity={t.rarity} eager />
            <span>{t.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RevealCard({ box, flipped, products }: { box: BoxInstance; flipped: boolean; products: Product[] }) {
  const top = topRarity(box.drops);
  const label = `${box.item.name}${(box.item.rolled?.length ?? 0) > 1 ? ` #${box.index + 1}` : ''}`;
  return (
    <div className={`rv-card rv-card-${top} ${flipped ? 'is-flipped' : ''}`}>
      <div className="rv-inner">
        <div className="rv-face rv-front">
          <Thumb src={box.product?.image ?? box.item.image} size={72} />
          <span className="rv-front-q pixel">?</span>
          <span className="rv-name">{label}</span>
        </div>
        <div className="rv-face rv-back">
          <div className="rv-back-head">
            <span className="rv-name">{label}</span>
            <span className={`badge rv-badge-${top}`}>{top}</span>
          </div>
          <ul className="rv-drops">
            {box.drops.map((d, i) => (
              <li key={i} className={`rv-drop rarity-${d.rarity ?? 'common'}`} style={{ animationDelay: `${i * 90}ms` }}>
                <Thumb src={findDropImage(d.name, products, d.image)} size={34} rarity={d.rarity} />
                <span className="rv-drop-name">
                  <b>{d.qty}×</b> {d.name}
                </span>
                <span className="rv-drop-rarity">{d.rarity ?? 'common'}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
