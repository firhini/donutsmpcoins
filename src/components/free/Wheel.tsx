import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import type { SpinPrize } from '../../shared/types';

export type WheelPrize = Omit<SpinPrize, 'weight'>;

/** Easing + duration used for the spin (keep in sync with free.css). */
export const SPIN_DURATION_MS = 5500;
export const SPIN_EASING = 'cubic-bezier(0.12, 0.8, 0.1, 1)';

const FALLBACK_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#f97316', '#ef4444', '#eab308', '#475569'];

export type PrizeGlyph = 'coupon' | 'coins' | 'item' | 'credit' | 'nothing';

/** Which small glyph a prize gets on the wheel and in prize lists. */
export function prizeGlyph(p: Pick<WheelPrize, 'type' | 'productId' | 'label'>): PrizeGlyph {
  if (p.type === 'coupon') return 'coupon';
  if (p.type === 'credit') return 'credit';
  if (p.type === 'nothing') return 'nothing';
  if (p.productId?.startsWith('money') || /coin|money|\dm\b/i.test(p.label)) return 'coins';
  return 'item';
}

export function prizeColor(p: WheelPrize, index: number): string {
  return p.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

/**
 * Compute the next cumulative rotation (deg, clockwise) so that the pointer at
 * the top lands inside segment `index`. Adds 5–7 full turns and a small random
 * offset inside the segment so every spin looks different.
 */
export function targetRotation(current: number, index: number, count: number, rng: () => number = Math.random): number {
  const seg = 360 / Math.max(1, count);
  const offset = (rng() - 0.5) * seg * 0.7; // stay away from the segment edges
  const target = (360 - ((index + 0.5) * seg + offset)) % 360; // wheel angle that puts the segment centre under the pointer
  const cur = ((current % 360) + 360) % 360;
  const delta = (target - cur + 360) % 360;
  const turns = 5 + Math.floor(rng() * 3); // 5, 6 or 7
  return current + turns * 360 + delta;
}

/** Segment index currently under the pointer for a given rotation. */
export function indexAtRotation(rotation: number, count: number): number {
  const seg = 360 / Math.max(1, count);
  const local = (((-rotation) % 360) + 360) % 360;
  return Math.min(count - 1, Math.floor(local / seg));
}

/** Reads the live rotation angle (deg) from an element's computed transform. */
function readAngle(el: HTMLElement): number | null {
  const t = getComputedStyle(el).transform;
  if (!t || t === 'none') return 0;
  const m = t.match(/matrix\(([^)]+)\)/);
  if (!m) return null;
  const [a, b] = m[1].split(',').map((v) => parseFloat(v));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return (Math.atan2(b, a) * 180) / Math.PI;
}

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

function segmentPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${cx},${cy} L${p0.x.toFixed(3)},${p0.y.toFixed(3)} A${r},${r} 0 ${large} 1 ${p1.x.toFixed(3)},${p1.y.toFixed(3)} Z`;
}

/** Glyph drawn in wheel units (centered at 0,0; ~5 units wide). */
function Glyph({ kind }: { kind: PrizeGlyph }) {
  const s = 0.3; // 24px icon grid → ~7 wheel units
  const common = { fill: 'none', stroke: '#fff', strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <g transform={`scale(${s}) translate(-12 -12)`}>
      {kind === 'coupon' && (
        <>
          <path d="M19 5 5 19" {...common} />
          <circle cx="7.5" cy="7.5" r="2.4" {...common} />
          <circle cx="16.5" cy="16.5" r="2.4" {...common} />
        </>
      )}
      {kind === 'coins' && (
        <>
          <circle cx="12" cy="12" r="8.5" {...common} />
          <path d="M12 7.5v9M9.5 9.5h3.8a1.6 1.6 0 0 1 0 3.2H9.5h4.2a1.6 1.6 0 0 1 0 3.2H9.5" {...common} />
        </>
      )}
      {kind === 'item' && (
        <>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" {...common} />
          <path d="m4 7.5 8 4.5 8-4.5M12 12v9" {...common} />
        </>
      )}
      {kind === 'credit' && (
        <>
          <rect x="3" y="6" width="18" height="12" rx="2.5" {...common} />
          <path d="M3 10h18M7 14.5h4" {...common} />
        </>
      )}
      {kind === 'nothing' && <path d="M7 7l10 10M17 7 7 17" {...common} />}
    </g>
  );
}

interface WheelProps {
  prizes: WheelPrize[];
  /** cumulative rotation in degrees (clockwise) */
  rotation: number;
  /** true while the long spin transition runs */
  spinning: boolean;
  /** short wind-up / reset movement (uses a quick transition) */
  windup?: boolean;
  disabled?: boolean;
  onSpin?: () => void;
  onSpinEnd?: () => void;
  /** called whenever the pointer crosses a segment edge while spinning */
  onTick?: () => void;
  /** max size in px (defaults to 460; scales down with the viewport) */
  maxSize?: number;
  hubLabel?: string;
}

const CX = 50;
const CY = 50;
const R_DISC = 46; // disc radius (inside the rim)
const R_RIM = 48.5; // rim centre line
const BULBS = 24;

/**
 * Prize wheel: an SVG disc (one segment per prize) that rotates via CSS
 * transform, a static gold rim with blinking bulbs, a pointer that wiggles
 * when passing segment edges and a logo hub that doubles as the spin button.
 */
export function Wheel({ prizes, rotation, spinning, windup, disabled, onSpin, onSpinEnd, onTick, maxSize = 460, hubLabel = 'SPIN' }: WheelProps) {
  const discRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<SVGGElement>(null);
  const count = Math.max(1, prizes.length);
  const seg = 360 / count;

  // ── pointer tick detection while spinning (reads the live CSS transform) ──
  useEffect(() => {
    if (!spinning) return;
    let raf = 0;
    let last = -1;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      const el = discRef.current;
      if (el) {
        const ang = readAngle(el);
        if (ang !== null) {
          const idx = indexAtRotation(ang, count);
          if (last !== -1 && idx !== last) {
            const p = pointerRef.current;
            if (p) {
              p.classList.remove('tick');
              // force reflow so the animation restarts
              void p.getBoundingClientRect();
              p.classList.add('tick');
            }
            onTick?.();
          }
          last = idx;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [spinning, count, onTick]);

  // ── spin end: transitionend + safety timer ──
  useEffect(() => {
    if (!spinning) return;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onSpinEnd?.();
    };
    const el = discRef.current;
    const onEnd = (e: TransitionEvent) => {
      if (e.target === el && e.propertyName === 'transform') finish();
    };
    el?.addEventListener('transitionend', onEnd);
    const t = window.setTimeout(finish, SPIN_DURATION_MS + 250);
    return () => {
      el?.removeEventListener('transitionend', onEnd);
      window.clearTimeout(t);
    };
  }, [spinning, onSpinEnd]);

  const segments = useMemo(() => {
    // one font size for all labels, derived from the longest label so the wheel looks uniform
    const maxLen = prizes.reduce((m, p) => Math.max(m, p.label.length), 1);
    const fontSize = Math.max(2.8, Math.min(4.8, 23 / (0.62 * maxLen)));
    return prizes.map((p, i) => {
      const a0 = i * seg;
      const a1 = (i + 1) * seg;
      const mid = a0 + seg / 2;
      return { p, i, a0, a1, mid, color: prizeColor(p, i), glyph: prizeGlyph(p), fontSize };
    });
  }, [prizes, seg]);

  const bulbs = useMemo(() => Array.from({ length: BULBS }, (_, i) => polar(CX, CY, R_RIM, (i * 360) / BULBS)), []);

  const discStyle: CSSProperties = {
    transform: `rotate(${rotation}deg)`,
    transition: spinning ? `transform ${SPIN_DURATION_MS}ms ${SPIN_EASING}` : windup ? 'transform 480ms cubic-bezier(0.3, 0, 0.2, 1)' : 'none',
  };

  return (
    <div className={`wheel ${spinning ? 'is-spinning' : ''} ${disabled ? 'is-disabled' : ''}`} style={{ '--wheel-max': `${maxSize}px` } as CSSProperties}>
      <div className="wheel-glow" aria-hidden="true" />

      {/* rotating disc */}
      <div className="wheel-disc" ref={discRef} style={discStyle}>
        <svg viewBox="0 0 100 100" className="wheel-svg" aria-hidden="true">
          <defs>
            <radialGradient id="wheel-gloss" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
              <stop offset="55%" stopColor="#fff" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.38" />
            </radialGradient>
            <linearGradient id="wheel-sheen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.28" />
              <stop offset="45%" stopColor="#fff" stopOpacity="0" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
            </linearGradient>
            <filter id="wheel-text-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0.5" stdDeviation="0.6" floodColor="#000" floodOpacity="0.6" />
            </filter>
          </defs>
          <circle cx={CX} cy={CY} r={R_DISC + 0.6} fill="#0b0d14" />
          {segments.map((s) => (
            <path key={`seg-${s.p.id}-${s.i}`} d={segmentPath(CX, CY, R_DISC, s.a0, s.a1)} fill={s.color} stroke="rgba(255,255,255,0.18)" strokeWidth="0.35" strokeLinejoin="round" />
          ))}
          <circle cx={CX} cy={CY} r={R_DISC} fill="url(#wheel-gloss)" pointerEvents="none" />
          <circle cx={CX} cy={CY} r={R_DISC} fill="url(#wheel-sheen)" pointerEvents="none" />
          {segments.map((s) => (
            <g key={`lbl-${s.p.id}-${s.i}`} transform={`rotate(${s.mid} ${CX} ${CY})`}>
              <g transform={`translate(${CX} ${CY - 18.2})`} opacity="0.95">
                <Glyph kind={s.glyph} />
              </g>
              <text
                x={CX}
                y={CY - 43.5}
                textAnchor="end"
                dominantBaseline="middle"
                transform={`rotate(-90 ${CX} ${CY - 43.5})`}
                fontSize={s.fontSize}
                fontWeight={800}
                fill="#fff"
                filter="url(#wheel-text-shadow)"
                style={{ fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em' }}
              >
                {s.p.label}
              </text>
            </g>
          ))}
          {/* separators */}
          {segments.map((s) => {
            const p = polar(CX, CY, R_DISC, s.a0);
            return <line key={`sep-${s.i}`} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.35)" strokeWidth="0.3" />;
          })}
          <circle cx={CX} cy={CY} r={R_DISC} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="1.2" />
        </svg>
      </div>

      {/* static rim, bulbs and pointer */}
      <svg viewBox="0 0 100 100" className="wheel-overlay" aria-hidden="true">
        <defs>
          <linearGradient id="wheel-rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff0b8" />
            <stop offset="25%" stopColor="#ffd45c" />
            <stop offset="55%" stopColor="#d98f00" />
            <stop offset="80%" stopColor="#ffc233" />
            <stop offset="100%" stopColor="#8a5a00" />
          </linearGradient>
          <linearGradient id="wheel-pointer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff3b8" />
            <stop offset="50%" stopColor="#ffc233" />
            <stop offset="100%" stopColor="#e08a00" />
          </linearGradient>
          <filter id="wheel-bulb-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="0.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="wheel-pointer-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000" floodOpacity="0.55" />
          </filter>
        </defs>
        <circle cx={CX} cy={CY} r={R_RIM} fill="none" stroke="url(#wheel-rim)" strokeWidth="4.2" />
        <circle cx={CX} cy={CY} r={R_RIM + 2.1} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="0.5" />
        <circle cx={CX} cy={CY} r={R_RIM - 2.1} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="0.6" />
        {bulbs.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r="1.05" className={`wheel-bulb ${i % 2 ? 'odd' : 'even'}`} style={{ animationDelay: `${(i % 6) * 0.08}s` }} filter="url(#wheel-bulb-glow)" />
        ))}
        <g ref={pointerRef} className="wheel-pointer" filter="url(#wheel-pointer-shadow)">
          <path d="M44.5 -1.5 H55.5 L50 11.5 Z" fill="url(#wheel-pointer)" stroke="#5a3a00" strokeWidth="0.7" strokeLinejoin="round" />
          <circle cx="50" cy="0.5" r="3.4" fill="url(#wheel-pointer)" stroke="#5a3a00" strokeWidth="0.7" />
          <circle cx="50" cy="0.5" r="1.3" fill="#fff6c8" />
        </g>
      </svg>

      {/* hub / spin button */}
      <button type="button" className="wheel-hub" onClick={onSpin} disabled={disabled || spinning} aria-label={spinning ? 'Spinning' : 'Spin the wheel'}>
        <span className="wheel-hub-ring" aria-hidden="true" />
        <img src="/img/brand/logo.svg" alt="" width={64} height={64} draggable={false} />
        <span className="wheel-hub-label pixel">{spinning ? '…' : hubLabel}</span>
      </button>
    </div>
  );
}
