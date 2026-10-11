import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { useCart } from '../../context/CartContext';
import { Icon } from '../ui/Icons';

const NAV: { to: string; label: string; badge?: string }[] = [
  { to: '/shop', label: 'Shop' },
  { to: '/shop/mystery-boxes', label: 'Mystery Boxes' },
  { to: '/spin', label: 'Daily Spin', badge: 'FREE' },
  { to: '/giveaways', label: 'Giveaways' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/faq', label: 'FAQ' },
];

export function AnnouncementBar() {
  const { config } = useStore();
  const a = config.announcement;
  if (!a?.enabled || !a.text) return null;
  const inner = a.link ? (a.link.startsWith('http') ? <a href={a.link} target="_blank" rel="noreferrer">{a.text}</a> : <Link to={a.link}>{a.text}</Link>) : a.text;
  return <div className="announce">{inner}</div>;
}

export function Header() {
  const { config, currency, setCurrency } = useStore();
  const { count, toggle } = useCart();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);

  return (
    <>
      <AnnouncementBar />
      <header className="header">
        <div className="container header-inner">
          <button className="btn btn-ghost btn-icon only-mobile" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
          <Link to="/" className="brand" aria-label={config.storeName}>
            <img src="/img/brand/logo.svg" alt="" width={36} height={36} />
            <span>
              Donut<span className="brand-dot">Coins</span>
            </span>
          </Link>
          <nav className="nav" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/shop'} className={({ isActive }) => (isActive ? 'active' : '')}>
                {n.label}
                {n.badge && <span className="nav-badge">{n.badge}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <select className="select currency-select only-desktop" value={currency.code} onChange={(e) => setCurrency(e.target.value)} aria-label="Currency">
              {config.currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol.trim()} {c.code}
                </option>
              ))}
            </select>
            <Link to="/track" className="btn btn-ghost btn-sm only-desktop">
              <Icon name="truck" size={16} /> Track order
            </Link>
            <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord btn-sm only-desktop">
              <Icon name="discord" size={16} /> Discord
            </a>
            <button className="btn btn-primary btn-icon cart-btn" onClick={toggle} aria-label={`Cart, ${count} items`}>
              <Icon name="cart" size={20} />
              {count > 0 && <span className="cart-count">{count > 99 ? '99+' : count}</span>}
            </button>
          </div>
        </div>
        {open && (
          <div className="mobile-menu only-mobile">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                {n.label} {n.badge && <span className="badge badge-pink">{n.badge}</span>}
              </NavLink>
            ))}
            <NavLink to="/track">Track order</NavLink>
            <a href={config.discordInvite} target="_blank" rel="noreferrer">
              Discord
            </a>
            <div className="row" style={{ padding: '8px 10px' }}>
              <span className="small muted">Currency</span>
              <select className="select currency-select" value={currency.code} onChange={(e) => setCurrency(e.target.value)} aria-label="Currency">
                {config.currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol.trim()} {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
