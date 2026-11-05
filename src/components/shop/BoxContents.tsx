import { Link } from 'react-router-dom';
import type { BoxContent, Product } from '../../shared/types';
import { formatMillions } from '../../shared/pricing';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../ui/Icons';
import { dropImage, shortDropName, sortedDrops } from './dropArt';


function rangeLabel(min: number, max: number): string {
  return min === max ? `${min}×` : `${min}–${max}×`;
}

function percentLabel(pct: number): string {
  if (pct >= 10) return `${Math.round(pct)}%`;
  if (pct >= 1) return `${pct.toFixed(1)}%`;
  if (pct >= 0.1) return `${pct.toFixed(1)}%`;
  if (pct > 0) return '<0.1%';
  return '0%';
}

/**
 * What's inside a product:
 *  - box    → every possible drop with rarity, quantity range and drop chance (per drop)
 *  - kit    → fixed list
 *  - bundle → bundleItems resolved to catalog products (money lines as "50M Money")
 */
export function BoxContents({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { productById, fmt, products } = useStore();

  if (product.kind === 'box') {
    const pool = product.contents ?? [];
    const guaranteed = pool.filter((c) => c.weight === 0);
    const random = pool.filter((c) => (c.weight ?? 1) > 0);
    const total = random.reduce((s, c) => s + (c.weight ?? 1), 0) || 1;
    const rolls = Math.max(1, product.boxRolls ?? 3);
    const pctOf = (c: BoxContent) => ((c.weight ?? 1) / total) * 100;
    // best drops first – every tile keeps its real per-drop chance
    const sorted = sortedDrops(product);
    const top = sorted.filter((c) => c.rarity === 'legendary' || c.rarity === 'epic').slice(0, 3);
    const rest = sorted.filter((c) => !top.includes(c));

    const tile = (c: BoxContent, key: string, big = false) => (
      <li key={key} className={`drop-tile rarity-tile-${c.rarity ?? 'common'} ${big ? 'drop-tile-big' : ''}`}>
        {big && <span className="drop-tier">{c.rarity === 'legendary' ? 'Jackpot' : 'Epic'}</span>}
        <img src={dropImage(c, products)} alt="" loading="lazy" decoding="async" draggable={false} />
        <span className="drop-name">
          {c.min > 1 || c.max > 1 ? <b>{rangeLabel(c.min, c.max)} </b> : null}
          {shortDropName(c.name)}
        </span>
        <span className="drop-pct">{percentLabel(pctOf(c))}</span>
      </li>
    );

    return (
      <div className={`boxc ${compact ? 'boxc-compact' : ''}`}>
        <div className="boxc-head">
          <span className="badge badge-violet">
            <Icon name="box" size={12} /> {rolls} {rolls === 1 ? 'drop' : 'drops'} per box
          </span>
          {guaranteed.length > 0 && (
            <span className="badge badge-gold">
              <Icon name="check" size={12} /> {guaranteed.length} guaranteed
            </span>
          )}
        </div>
        {guaranteed.length > 0 && <ul className="drop-grid drop-grid-top">{guaranteed.map((c, i) => tile(c, `g-${i}`, false))}</ul>}
        {top.length > 0 && <ul className="drop-grid drop-grid-top">{top.map((c, i) => tile(c, `t-${i}`, true))}</ul>}
        <ul className="drop-grid">{rest.map((c, i) => tile(c, `r-${i}`))}</ul>
        {!compact && (
          <p className="boxc-foot">
            Chance per drop, every line listed. Rolled the moment you order, shown on your order page, handed over in-game by our staff. No repeats inside one box.
          </p>
        )}
      </div>
    );
  }

  if (product.kind === 'bundle') {
    const items = product.bundleItems ?? [];
    let worth = 0;
    const rows = items.map((it) => {
      const p = productById(it.productId);
      if (!p)
        return {
          key: it.productId,
          label: `${it.quantity}× ${it.productId}`,
          slug: undefined,
          note: undefined,
        };
      worth += p.priceCents * it.quantity;
      if (p.kind === 'money') {
        const millions = (p.moneyMillions ?? 1) * it.quantity;
        return {
          key: it.productId,
          label: `${formatMillions(millions)} Money`,
          slug: p.slug,
          note: 'paid with /pay',
        };
      }
      return {
        key: it.productId,
        label: `${it.quantity}× ${p.name}`,
        slug: p.slug,
        note: p.shortDesc,
      };
    });
    const save = worth > product.priceCents ? Math.round((1 - product.priceCents / worth) * 100) : 0;
    return (
      <div className={`boxc ${compact ? 'boxc-compact' : ''}`}>
        <div className="boxc-head">
          <span className="badge badge-gold">
            <Icon name="package" size={12} /> Fixed bundle · no randomness
          </span>
          {save > 0 && (
            <span className="boxc-note">
              Worth {fmt(worth)} bought separately – you save {save}%
            </span>
          )}
        </div>
        <ul className="boxc-list">
          {rows.map((r) => (
            <li key={r.key} className="boxc-row">
              <span className="boxc-dot rarity-bg-uncommon" aria-hidden="true" />
              <span className="boxc-name">{r.slug ? <Link to={`/product/${r.slug}`}>{r.label}</Link> : r.label}</span>
              {!compact && r.note && <span className="boxc-qty boxc-wide">{r.note}</span>}
              <span className="boxc-chance boxc-chance-g">Included</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // kit (fixed contents)
  const list = product.contents ?? [];
  return (
    <div className={`boxc ${compact ? 'boxc-compact' : ''}`}>
      <div className="boxc-head">
        <span className="badge badge-green">
          <Icon name="check" size={12} /> Fixed contents
        </span>
        <span className="boxc-note">Handed over in one shulker / drop</span>
      </div>
      <ul className="boxc-list">
        {list.map((c, i) => (
          <li key={i} className="boxc-row">
            <span className={`boxc-dot rarity-bg-${c.rarity ?? 'uncommon'}`} aria-hidden="true" />
            <span className={`boxc-name ${c.rarity ? `rarity-${c.rarity}` : ''}`}>{c.name}</span>
            <span className="boxc-qty">{rangeLabel(c.min, c.max)}</span>
            <span className="boxc-chance boxc-chance-g">Included</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
