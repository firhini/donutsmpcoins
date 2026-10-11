import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../ui/Icons';
import { getDashboard } from '../../lib/adminApi';
import { normalizeOrderId } from './adminUtils';

const NAV: { to: string; label: string; icon: string; end?: boolean; countKey?: 'orders' }[] = [
  { to: '/admin', label: 'Dashboard', icon: 'home', end: true },
  { to: '/admin/orders', label: 'Orders', icon: 'package', countKey: 'orders' },
  { to: '/admin/products', label: 'Products', icon: 'box' },
  { to: '/admin/coupons', label: 'Coupons & gifts', icon: 'ticket' },
  { to: '/admin/reviews', label: 'Reviews', icon: 'star' },
  { to: '/admin/giveaways', label: 'Giveaways', icon: 'trophy' },
  { to: '/admin/credit', label: 'Store credit', icon: 'coin' },
  { to: '/admin/settings', label: 'Settings', icon: 'settings' },
];

function titleFor(pathname: string): string {
  const p = pathname.replace(/\/+$/, '');
  if (p === '/admin' || p === '') return 'Dashboard';
  if (/^\/admin\/orders\/[^/]+$/.test(p)) return 'Order';
  const hit = NAV.find((n) => n.to !== '/admin' && p.startsWith(n.to));
  return hit?.label ?? 'Admin';
}

export function Shell({ onLogout, apiProblem }: { onLogout: () => void; apiProblem: string | null }) {
  const { config } = useStore();
  const loc = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [actionCount, setActionCount] = useState<number | null>(null);

  useEffect(() => setOpen(false), [loc.pathname]);

  // light-weight "needs action" counter for the sidebar (best effort, refreshed every minute)
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const d = await getDashboard();
        if (alive) setActionCount(d.counts.paid + d.counts.delivering);
      } catch {
        if (alive) setActionCount(null);
      }
    };
    void tick();
    const t = window.setInterval(() => void tick(), 60_000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [loc.pathname]);

  const title = useMemo(() => titleFor(loc.pathname), [loc.pathname]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const id = normalizeOrderId(q);
    if (id) navigate(`/admin/orders/${id}`);
    else if (q.trim()) navigate(`/admin/orders?q=${encodeURIComponent(q.trim())}`);
    setQ('');
  };

  return (
    <div className="adm-root">
      <aside className={`adm-sidebar ${open ? 'open' : ''}`} aria-label="Admin navigation">
        <div className="adm-brand">
          <img src="/img/brand/logo.svg" alt="" width={34} height={34} />
          <div>
            <div className="adm-brand-name">
              Donut<span className="brand-dot">Coins</span>
            </div>
            <div className="adm-brand-sub">Back office</div>
          </div>
          <button type="button" className="btn btn-ghost btn-icon adm-brand-close only-mobile" aria-label="Close menu" onClick={() => setOpen(false)}>
            <Icon name="close" size={20} />
          </button>
        </div>
        <nav className="adm-nav">
          <div className="adm-nav-label">Manage</div>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon name={n.icon} size={17} />
              {n.label}
              {n.countKey === 'orders' && actionCount ? <span className="adm-nav-count" title="Paid orders waiting for delivery">{actionCount}</span> : null}
            </NavLink>
          ))}
        </nav>
        <div className="adm-sidebar-foot">
          <div className="adm-sidebar-status">
            <span className={`dot ${apiProblem ? 'off' : 'pulse'}`} style={apiProblem ? { background: 'var(--amber-400)', boxShadow: 'none' } : undefined} />
            {apiProblem ? 'API not reachable' : 'Connected'}
          </div>
          <Link to="/" className="btn btn-ghost btn-sm">
            <Icon name="external" size={15} /> View store
          </Link>
          <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
            <Icon name="discord" size={15} /> Discord
          </a>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onLogout}>
            <Icon name="logout" size={15} /> Log out
          </button>
        </div>
      </aside>
      {open && <div className="adm-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div className="adm-main">
        <header className="adm-topbar">
          <button type="button" className="btn btn-ghost btn-icon only-mobile" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Icon name="menu" size={22} />
          </button>
          <h1 className="adm-topbar-title">{title}</h1>
          <form className="adm-topbar-search" onSubmit={onSearch} role="search">
            <Icon name="search" size={16} />
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order ID or username…" aria-label="Find order" />
          </form>
          <div className="adm-topbar-actions only-desktop">
            <Link to="/" className="btn btn-secondary btn-sm" target="_blank">
              <Icon name="external" size={14} /> Store
            </Link>
          </div>
        </header>
        <main className="adm-content">
          {apiProblem && (
            <div className="alert alert-warn" style={{ marginBottom: 20 }}>
              <Icon name="warning" size={16} />
              <span>
                <strong>The admin API is not responding</strong> ({apiProblem}). Data below may be empty until the backend is deployed (set <code className="adm-code">ADMIN_PASSWORD</code> in Netlify).
              </span>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
