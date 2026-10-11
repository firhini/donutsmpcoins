import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Icon } from '../ui/Icons';
import '../../styles/shop.css';

export interface AccordionItem {
  id: string;
  q: ReactNode;
  a: ReactNode;
}

/**
 * Keyboard-accessible accordion (button + region). Items get an id anchor; when
 * the URL hash matches an item it opens and scrolls into view.
 */
export function Accordion({ items, defaultOpen, single = false }: { items: AccordionItem[]; defaultOpen?: string; single?: boolean }) {
  const { hash } = useLocation();
  const [open, setOpen] = useState<Set<string>>(() => new Set(defaultOpen ? [defaultOpen] : []));

  useEffect(() => {
    const id = hash.replace(/^#/, '');
    if (!id || !items.some((i) => i.id === id)) return;
    setOpen((s) => (single ? new Set([id]) : new Set([...s, id])));
    const t = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60);
    return () => window.clearTimeout(t);
  }, [hash, items, single]);

  const toggle = (id: string) =>
    setOpen((s) => {
      const next = single ? new Set<string>() : new Set(s);
      if (s.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="acc">
      {items.map((it) => {
        const isOpen = open.has(it.id);
        return (
          <div key={it.id} id={it.id} className={`acc-item ${isOpen ? 'open' : ''}`}>
            <h3 className="acc-q">
              <button type="button" id={`${it.id}-btn`} className="acc-btn" aria-expanded={isOpen} aria-controls={`${it.id}-panel`} onClick={() => toggle(it.id)}>
                <span>{it.q}</span>
                <span className="acc-chev" aria-hidden="true">
                  <Icon name="chevron" size={18} />
                </span>
              </button>
            </h3>
            <div id={`${it.id}-panel`} role="region" aria-labelledby={`${it.id}-btn`} className="acc-panel" hidden={!isOpen}>
              <div className="acc-body">{it.a}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
