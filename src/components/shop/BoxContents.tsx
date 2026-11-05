import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import type { BoxContent, Product } from '../../shared/types';
import { formatMillions } from '../../shared/pricing';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../ui/Icons';

const RARITY_ORDER: Record<NonNullable<BoxContent['rarity']>, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  uncommon: 3,
  common: 4,
};

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
  const { productById, fmt } = useStore();

  if (product.kind === 'box') {
    const pool = product.contents ?? [];
    const guaranteed = pool.filter((c) => c.weight === 0);
    const random = pool.filter((c) => (c.weight ?? 1) > 0);
    const total = random.reduce((s, c) => s + (c.weight ?? 1), 0) || 1;
    const rolls = Math.max(1, product.boxRolls ?? 3);
    const pctOf = (c: BoxContent) => ((c.weight ?? 1) / total) * 100;
    // best drops first (rarest tier, then rarest line) – every line keeps its real chance
    const sorted = [...random].sort((a, b) => RARITY_ORDER[a.rarity ?? 'common'] - RARITY_ORDER[b.rarity ?? 'common'] || (a.weight ?? 1) - (b.weight ?? 1));
    const top = sorted.filter((c) => c.rarity === 'legendary' || c.rarity === 'epic').slice(0, 3);
    // honest headline odds: chance that a box contains at least one rare-or-better drop
    const rarePlus = random.filter((c) => RARITY_ORDER[c.rarity ?? 'common'] <= RARITY_ORDER.rare).reduce((s, c) => s + (c.weight ?? 1), 0) / total;
    const hitRare = 1 - Math.pow(1 - rarePlus, rolls);
    const oneIn = hitRare > 0 ? Math.max(1, Math.round(1 / hitRare)) : 0;

    return (
      <div className={`boxc ${compact ? 'boxc-compact' : ''}`}>
        <div className="boxc-head">
          <span className="badge badge-violet">
            <Icon name="box" size={12} /> Opens {rolls} random {rolls === 1 ? 'drop' : 'drops'}
          </span>
          {guaranteed.length > 0 && (
            <span className="badge badge-gold">
              <Icon name="check" size={12} /> {guaranteed.length} guaranteed
            </span>
          )}
          {oneIn > 0 && <span className="boxc-note">About 1 in {oneIn} boxes contains a Rare or better drop</span>}
        </div>
        {top.length > 0 && (
          <div className="boxc-top" aria-label="Top drops">
            {top.map((c, i) => (
              <div key={`t-${i}`} className={`boxc-top-item rarity-glow-${c.rarity}`}>
                <span className="boxc-top-tier">{c.rarity === 'legendary' ? 'Jackpot' : 'Epic'}</span>
                <strong className={`rarity-${c.rarity}`}>
                  {c.min > 1 || c.max > 1 ? `${rangeLabel(c.min, c.max)} ` : ''}
                  {c.name}
                </strong>
                <span className="boxc-top-pct">{percentLabel(pctOf(c))} per drop</span>
              </div>
            ))}
          </div>
        )}
        <ul className="boxc-list">
          {guaranteed.map((c, i) => (
            <li key={`g-${i}`} className="boxc-row boxc-guaranteed">
              <span className={`boxc-dot rarity-bg-${c.rarity ?? 'common'}`} aria-hidden="true" />
              <span className={`boxc-name rarity-${c.rarity ?? 'common'}`}>{c.name}</span>
              <span className="boxc-qty">{rangeLabel(c.min, c.max)}</span>
              <span className="boxc-chance boxc-chance-g">Guaranteed</span>
            </li>
          ))}
          {sorted.map((c, i) => {
            const pct = pctOf(c);
            const tier = c.rarity ?? 'common';
            const prev = i > 0 ? (sorted[i - 1].rarity ?? 'common') : null;
            return (
              <Fragment key={`r-${i}`}>
                {prev !== tier && !compact && (
                  <li className="boxc-tier-label" aria-hidden="true">
                    {tier}
                  </li>
                )}
                <li className="boxc-row">
                  <span className={`boxc-dot rarity-bg-${tier}`} aria-hidden="true" />
                  <span className={`boxc-name rarity-${tier}`}>{c.name}</span>
                  <span className="boxc-qty">{rangeLabel(c.min, c.max)}</span>
                  <span className="boxc-chance">
                    <span className="boxc-bar" aria-hidden="true">
                      <i style={{ width: `${Math.max(3, Math.min(100, pct))}%` }} />
                    </span>
                    {percentLabel(pct)}
                  </span>
                </li>
              </Fragment>
            );
          })}
        </ul>
        {!compact && (
          <p className="boxc-foot">
            Every possible drop and its exact chance is listed – no hidden pool. Your box is rolled on our server the moment you order, the result shows on your order page and our
            staff hand it over in-game. Chances apply per drop; a box with several drops never repeats a line.
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
