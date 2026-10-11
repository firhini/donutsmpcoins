import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import '../../styles/home.css';

interface Line {
  text: string;
  cls?: string;
  prefix?: string;
}

/**
 * Minecraft-chat styled panel that "types" an example delivery, line by line,
 * then loops. Static (all lines visible) when the user prefers reduced motion.
 */
export function DeliveryLog() {
  const { config } = useStore();
  const staff = config.delivery.staffUsername || 'DonutCoins_Delivery';
  const lines = useMemo<Line[]>(
    () => [
      { prefix: `[${config.storeName}]`, text: 'Order DC-7F3K2A confirmed: 100M Money', cls: 'c-gold' },
      { text: `${staff} joined the game`, cls: 'c-gray' },
      { text: '+ $100,000,000 has been paid to your balance', cls: 'c-green' },
      { prefix: `[${config.storeName}]`, text: 'Delivered in 4 minutes ★', cls: 'c-aqua' },
      { prefix: `[${config.storeName}]`, text: 'Order DC-9Q1MZD confirmed: 32× Skeleton Spawner', cls: 'c-gold' },
      { text: `${staff} wants to teleport to you. /tpaccept`, cls: 'c-pink' },
      { text: 'You picked up 32× Skeleton Spawner', cls: 'c-green' },
      { prefix: `[${config.storeName}]`, text: 'Enjoy! Leave a review for 5% off next time ❤', cls: 'c-aqua' },
    ],
    [config.storeName, staff],
  );
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [shown, setShown] = useState(reduced ? lines.length : 0);

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    let t: number;
    const tick = (n: number) => {
      if (cancelled) return;
      if (n > lines.length) {
        t = window.setTimeout(() => {
          setShown(0);
          tick(1);
        }, 2600);
        return;
      }
      setShown(n);
      t = window.setTimeout(() => tick(n + 1), n === lines.length ? 2600 : 1150);
    };
    tick(1);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [lines, reduced]);

  return (
    <div className="mc-chat dlog" aria-label="Example in-game delivery" role="img">
      <div className="dlog-bar">
        <span className="dot pulse" aria-hidden="true" />
        <span className="dlog-title">{config.serverName} · in-game chat</span>
        <span className="dlog-tag">example</span>
      </div>
      <ol className="dlog-lines">
        {lines.slice(0, shown).map((l, i) => (
          <li key={i} className={`dlog-line fade-up ${l.cls ?? ''}`}>
            {l.prefix && <span className="c-pink">{l.prefix} </span>}
            {l.text}
          </li>
        ))}
        {shown < lines.length && (
          <li className="dlog-cursor" aria-hidden="true">
            _
          </li>
        )}
      </ol>
    </div>
  );
}
