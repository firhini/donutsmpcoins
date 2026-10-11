import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const COLORS = ['#ffc233', '#ff5ea8', '#4ade80', '#60a5fa', '#a78bfa', '#fbbf24', '#ffffff', '#f97316'];

interface Particle {
  id: number;
  x: number; // vw %
  delay: number;
  dur: number;
  color: string;
  size: number;
  rot: number;
  drift: number;
  shape: 'rect' | 'circle' | 'strip';
}

function makeParticles(count: number, seed: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const r = (n: number) => {
      // small deterministic pseudo random so re-renders do not reshuffle
      const x = Math.sin(seed * 9301 + i * 49297 + n * 233) * 10000;
      return x - Math.floor(x);
    };
    out.push({
      id: i,
      x: r(1) * 100,
      delay: r(2) * 0.9,
      dur: 2.4 + r(3) * 1.8,
      color: COLORS[Math.floor(r(4) * COLORS.length)],
      size: 6 + r(5) * 8,
      rot: r(6) * 360,
      drift: (r(7) - 0.5) * 160,
      shape: r(8) < 0.3 ? 'circle' : r(8) < 0.6 ? 'strip' : 'rect',
    });
  }
  return out;
}

/**
 * Lightweight CSS confetti burst (no canvas, no deps). Mount with `active`
 * true – it renders a full-screen, pointer-less layer and removes itself
 * after the animation finishes.
 */
export function Confetti({ active, count = 140, duration = 4200 }: { active: boolean; count?: number; duration?: number }) {
  const [run, setRun] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  // `active` is usually pulsed true→false by the caller; the hide timer must
  // survive that flip, so it lives in a ref and is only cleared on unmount.
  useEffect(() => {
    if (!active) return;
    setRun((r) => r + 1);
    setVisible(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setVisible(false), duration);
  }, [active, duration]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const particles = useMemo(() => makeParticles(count, run), [count, run]);
  if (!visible || typeof document === 'undefined') return null;

  return createPortal(
    <div className="confetti" aria-hidden="true">
      {particles.map((p) => (
        <i
          key={`${run}-${p.id}`}
          className={`confetti-p confetti-${p.shape}`}
          style={
            {
              left: `${p.x}vw`,
              '--c': p.color,
              '--d': `${p.delay}s`,
              '--t': `${p.dur}s`,
              '--s': `${p.size}px`,
              '--r': `${p.rot}deg`,
              '--x': `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>,
    document.body,
  );
}
