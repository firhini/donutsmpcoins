import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Category, CategoryId } from '../../shared/types';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../ui/Icons';
import '../../styles/shop.css';

export type HotbarValue = CategoryId | 'all';

const FALLBACK_ICON: Record<CategoryId, string> = {
  money: 'coin',
  spawners: 'flame',
  mystery: 'box',
  investments: 'sparkles',
  armor: 'shield',
  tools: 'pickaxe',
  bundles: 'package',
  bases: 'home',
};

/**
 * Minecraft-inspired inventory hotbar: 9 bevelled slots (All + 8 categories).
 * mode="filter" → onChange(id); mode="link" → navigates to /shop/<slug>.
 */
export function CategoryHotbar({
  value,
  onChange,
  mode = 'filter',
  counts,
}: {
  value: HotbarValue;
  onChange?: (id: HotbarValue) => void;
  mode?: 'filter' | 'link';
  /** optional product counts per category id */
  counts?: Partial<Record<HotbarValue, number>>;
}) {
  const { categories } = useStore();
  const scroller = useRef<HTMLDivElement>(null);

  // keep the selected slot visible on narrow screens (horizontal only – no page jump)
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) return;
    const left = active.offsetLeft - el.clientWidth / 2 + active.clientWidth / 2;
    el.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [value]);

  const slots: { id: HotbarValue; label: string; icon?: string; cat?: Category }[] = [
    { id: 'all', label: 'All' },
    ...categories.map((c) => ({ id: c.id, label: shortName(c), icon: c.icon, cat: c })),
  ];

  return (
    <div className="hotbar-wrap">
      <div className="hotbar" ref={scroller} role={mode === 'filter' ? 'tablist' : 'navigation'} aria-label="Categories">
        {slots.map((s, i) => (
          <HotbarSlot key={s.id} slot={s} index={i} active={value === s.id} mode={mode} onSelect={() => onChange?.(s.id)} count={counts?.[s.id]} />
        ))}
      </div>
    </div>
  );
}

function shortName(c: Category): string {
  if (c.id === 'spawners') return 'Spawners';
  if (c.id === 'mystery') return 'Mystery';
  if (c.id === 'tools') return 'Tools';
  return c.name;
}

function HotbarSlot({
  slot,
  index,
  active,
  mode,
  onSelect,
  count,
}: {
  slot: { id: HotbarValue; label: string; icon?: string; cat?: Category };
  index: number;
  active: boolean;
  mode: 'filter' | 'link';
  onSelect: () => void;
  count?: number;
}) {
  const [imgOk, setImgOk] = useState(true);
  const inner = (
    <>
      <span className="hotbar-num pixel" aria-hidden="true">
        {index + 1}
      </span>
      <span className="hotbar-icon">
        {slot.id === 'all' ? (
          <AllIcon />
        ) : slot.icon && imgOk ? (
          <img src={slot.icon} alt="" width={36} height={36} draggable={false} onError={() => setImgOk(false)} />
        ) : (
          <Icon name={FALLBACK_ICON[slot.id as CategoryId] ?? 'box'} size={26} strokeWidth={1.8} />
        )}
      </span>
      {typeof count === 'number' && count > 0 && (
        <span className="hotbar-count pixel" aria-hidden="true">
          {count}
        </span>
      )}
      <span className="hotbar-label pixel">{slot.label}</span>
    </>
  );
  const cls = `hotbar-slot ${active ? 'active' : ''}`;
  const title = slot.cat?.tagline ?? 'Everything in the store';
  if (mode === 'link') {
    return (
      <Link to={slot.id === 'all' ? '/shop' : `/shop/${slot.cat?.slug ?? slot.id}`} className={cls} data-active={active} aria-current={active ? 'page' : undefined} title={title}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} data-active={active} role="tab" aria-selected={active} onClick={onSelect} title={title}>
      {inner}
    </button>
  );
}

function AllIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#ffc233" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#ff5ea8" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#60a5fa" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#4ade80" />
    </svg>
  );
}
