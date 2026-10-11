/** Dependency-free canvas confetti burst (used for box reveals and delivered orders). */
import { prefersReducedMotion } from './cartUtils';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  color: string;
  shape: 0 | 1;
  life: number;
}

const DEFAULT_COLORS = ['#ffc233', '#ff5ea8', '#a78bfa', '#4ade80', '#60a5fa', '#fff'];

export function fireConfetti(opts: { count?: number; colors?: string[]; origin?: { x: number; y: number }; spread?: number; duration?: number } = {}): void {
  if (typeof document === 'undefined' || prefersReducedMotion()) return;
  const count = opts.count ?? 140;
  const colors = opts.colors ?? DEFAULT_COLORS;
  const duration = opts.duration ?? 2400;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1100;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const ox = (opts.origin?.x ?? 0.5) * W;
  const oy = (opts.origin?.y ?? 0.35) * H;
  const spread = opts.spread ?? Math.PI;
  const parts: Particle[] = Array.from({ length: count }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
    const speed = 7 + Math.random() * 9;
    return {
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.7 ? 1 : 0,
      life: 1,
    };
  });

  const start = performance.now();
  let raf = 0;
  const frame = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, W, H);
    const fade = Math.max(0, 1 - Math.max(0, t - duration * 0.6) / (duration * 0.4));
    for (const p of parts) {
      p.vy += 0.28;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 1) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    if (t < duration) raf = requestAnimationFrame(frame);
    else canvas.remove();
  };
  raf = requestAnimationFrame(frame);
  window.setTimeout(() => {
    cancelAnimationFrame(raf);
    canvas.remove();
  }, duration + 100);
}
