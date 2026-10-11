import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../ui/Icons';
import { safeHref, isExternal } from '../../lib/url';
import '../../styles/shop.css';

const NAV: { to: string; label: string; badge?: string }[] = [
  { to: '/shop', label: 'Shop' },
  { to: '/shop/mystery-boxes', label: 'Mystery Boxes' },
  { to: '/spin', label: 'Daily Spin', badge: 'FREE' },
  { to: '/guides', label: 'Guides' },
  { to: '/giveaways', label: 'Giveaways' },
  { to: '/reviews', label: 'Reviews' },
];

export function AnnouncementBar() {
  const { config } = useStore();
  const a = config.announcement;
  if (!a?.enabled || !a.text) return null;
  const href = safeHref(a.link);
  const inner = href ? (isExternal(href) ? <a href={href} target="_blank" rel="noreferrer">{a.text}</a> : <Link to={href}>{a.text}</Link>) : a.text;
  return <div className="announce">{inner}</div>;
}

export function Header() {
  const { config, currency, setCurrency } = useStore();
  const { lines, toggle } = useCart();
  const auth = useAuth();
  const [menu, setMenu] = useState(false);
  // distinct lines, not summed quantity (a 250M money line would otherwise read "99+")
  const count = lines.length;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [loc.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <AnnouncementBar />
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
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
            {auth.configured ? (
              auth.user ? (
                <div className="user-menu only-desktop">
                  <button type="button" className="user-btn" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu}>
                    <img src={auth.user.avatarUrl} alt="" width={28} height={28} className="user-avatar" />
                    <span className="user-name">{auth.user.displayName}</span>
                    <Icon name="chevron" size={14} />
                  </button>
                  {menu && (
                    <div className="user-dropdown" role="menu">
                      <Link to="/account" role="menuitem">
                        <Icon name="user" size={16} /> My account
                      </Link>
                      <Link to="/account#orders" role="menuitem">
                        <Icon name="package" size={16} /> My orders
                      </Link>
                      <Link to="/spin" role="menuitem">
                        <Icon name="spin" size={16} /> Daily spin
                      </Link>
                      <button type="button" role="menuitem" onClick={() => void auth.logout()}>
                        <Icon name="logout" size={16} /> Log out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button type="button" className="btn btn-discord btn-sm only-desktop" onClick={() => auth.login()}>
                  <Icon name="discord" size={16} /> Login<span className="only-wide"> with Discord</span>
                </button>
              )
            ) : (
              <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord btn-sm only-desktop">
                <Icon name="discord" size={16} /> Discord
              </a>
            )}
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
            {auth.configured && auth.user && <NavLink to="/account">My account ({auth.user.displayName})</NavLink>}
            {auth.configured && !auth.user && (
              <button type="button" className="btn btn-discord btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => auth.login()}>
                <Icon name="discord" size={16} /> Login with Discord
              </button>
            )}
            {auth.configured && auth.user && (
              <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => void auth.logout()}>
                <Icon name="logout" size={16} /> Log out
              </button>
            )}
            <a href={config.discordInvite} target="_blank" rel="noreferrer">
              Discord server
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
