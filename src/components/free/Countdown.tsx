import { useEffect, useRef, useState } from 'react';

/** Re-renders every `intervalMs` – returns Date.now(). */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function msUntil(iso: string | undefined, now = Date.now()): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, t - now);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "hh:mm:ss" (hours may exceed 24) */
export function formatClock(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/** "2d 04h", "4h 12m", "12m 05s", "45s" */
export function formatCompact(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${pad(h)}h`;
  if (h > 0) return `${h}h ${pad(m)}m`;
  if (m > 0) return `${m}m ${pad(sec)}s`;
  return `${sec}s`;
}

interface Props {
  to: string | undefined;
  format?: 'clock' | 'compact';
  onDone?: () => void;
  /** text shown when the time has passed */
  doneText?: string;
  className?: string;
}

/** Live countdown to an ISO timestamp. Calls onDone once when it reaches zero. */
export function Countdown({ to, format = 'clock', onDone, doneText = '00:00:00', className }: Props) {
  const now = useNow(1000);
  const ms = msUntil(to, now);
  const firedRef = useRef(false);
  useEffect(() => {
    firedRef.current = false;
  }, [to]);
  useEffect(() => {
    if (ms === 0 && to && !firedRef.current) {
      firedRef.current = true;
      onDone?.();
    }
  }, [ms, to, onDone]);
  const text = ms === 0 ? doneText : format === 'clock' ? formatClock(ms) : formatCompact(ms);
  return (
    <time className={`countdown ${className ?? ''}`} dateTime={to} aria-live="off">
      {text}
    </time>
  );
}
