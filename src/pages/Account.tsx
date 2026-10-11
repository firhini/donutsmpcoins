import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { AccountSummary, OrderStatus } from '../shared/types';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { apiGet, ApiClientError } from '../lib/api';
import { Seo } from '../components/ui/Seo';
import { Icon } from '../components/ui/Icons';
import '../styles/account.css';

const STATUS_LABEL: Record<OrderStatus, { text: string; cls: string }> = {
  awaiting_payment: { text: 'Awaiting payment', cls: 'badge-gold' },
  paid: { text: 'Paid', cls: 'badge-green' },
  delivering: { text: 'Delivering', cls: 'badge-blue' },
  delivered: { text: 'Delivered', cls: 'badge-green' },
  cancelled: { text: 'Cancelled', cls: 'badge-red' },
  refunded: { text: 'Refunded', cls: 'badge-violet' },
};

const MC_RE = /^[A-Za-z0-9_]{3,16}$/;

export default function Account() {
  const auth = useAuth();
  const { config, fmt } = useStore();
  const { toast } = useToast();
  const [data, setData] = useState<AccountSummary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mc, setMc] = useState('');
  const [saving, setSaving] = useState(false);
  const [checkingGuild, setCheckingGuild] = useState(false);

  const load = async () => {
    try {
      const d = await apiGet<AccountSummary>('/account');
      setData(d);
      setMc(d.user.mcUsername ?? '');
      setErr(null);
    } catch (e) {
      const ae = e as ApiClientError;
      setErr(ae.status === 401 ? null : ae.message || 'Could not load your account.');
    }
  };

  useEffect(() => {
    if (auth.user) void load();
  }, [auth.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMc = async (e: FormEvent) => {
    e.preventDefault();
    const v = mc.trim();
    if (!MC_RE.test(v)) {
      toast('Minecraft usernames are 3–16 letters, numbers or underscores.', 'error');
      return;
    }
    setSaving(true);
    try {
      await auth.saveMcUsername(v);
      toast('Minecraft username saved', 'success');
      void load();
    } catch (e2) {
      toast((e2 as Error).message || 'Could not save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const recheckGuild = async () => {
    setCheckingGuild(true);
    try {
      const ok = await auth.refreshGuild();
      toast(ok ? 'Membership confirmed – thanks for joining!' : 'We still cannot see you in the server. Join via the invite and try again.', ok ? 'success' : 'info');
    } catch (e2) {
      const ae = e2 as ApiClientError;
      if (ae.code === 'relogin') auth.login('/account');
      else toast(ae.message || 'Could not check membership', 'error');
    } finally {
      setCheckingGuild(false);
    }
  };

  if (!auth.configured && !auth.loading) {
    return (
      <div className="container page">
        <Seo robots="noindex,nofollow" title={`Account · ${config.storeName}`} />
        <div className="empty">
          <div className="big">🔒</div>
          <h2>Accounts are not enabled yet</h2>
          <p className="muted">Discord login is not configured on this store. You can still track orders with your order ID.</p>
          <Link to="/track" className="btn btn-primary" style={{ marginTop: 16 }}>
            Track an order
          </Link>
        </div>
      </div>
    );
  }

  if (!auth.user) {
    return (
      <div className="container page">
        <Seo robots="noindex,nofollow" title={`Account · ${config.storeName}`} />
        <div className="acc-login card pad">
          <img src="/img/brand/mascot.svg" alt="" width={96} height={96} />
          <h1>Your DonutCoins account</h1>
          <p className="lead">Log in with Discord to spin the daily wheel, see your orders, store credit and the prizes you won – no password needed.</p>
          <button type="button" className="btn btn-discord btn-lg" onClick={() => auth.login('/account')} disabled={auth.loading}>
            <Icon name="discord" size={18} /> Login with Discord
          </button>
          <p className="xs muted">We only read your Discord username and avatar.</p>
        </div>
      </div>
    );
  }

  const u = auth.user;
  return (
    <div className="container page acc">
      <Seo robots="noindex,nofollow" title={`My account · ${config.storeName}`} />
      <header className="acc-head card pad">
        <img src={u.avatarUrl} alt="" className="acc-avatar" width={72} height={72} />
        <div className="acc-head-text">
          <span className="eyebrow">My account</span>
          <h1>{u.displayName}</h1>
          <p className="muted small">@{u.username} · Discord</p>
        </div>
        <div className="acc-head-actions">
          <Link to="/spin" className="btn btn-pink">
            <Icon name="spin" size={16} /> Daily spin
          </Link>
          <button type="button" className="btn btn-secondary" onClick={() => void auth.logout()}>
            <Icon name="logout" size={16} /> Log out
          </button>
        </div>
      </header>

      {err && <div className="alert alert-danger">{err}</div>}

      <div className="acc-grid">
        <section className="card pad acc-section">
          <h2 className="acc-title">
            <Icon name="user" size={18} /> Minecraft username
          </h2>
          <p className="muted small">Free prizes and orders are delivered to this account. Coupons you win are bound to it.</p>
          <form className="acc-mc" onSubmit={saveMc}>
            <div className="acc-mc-row">
              {MC_RE.test(mc.trim()) && <img src={`https://mc-heads.net/avatar/${encodeURIComponent(mc.trim())}/40`} alt="" width={40} height={40} className="acc-mc-head" onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = 'hidden')} />}
              <input className="input" value={mc} onChange={(e) => setMc(e.target.value)} placeholder="e.g. Notch" maxLength={16} aria-label="Minecraft username" />
              <button type="submit" className="btn btn-primary" disabled={saving || mc.trim() === (u.mcUsername ?? '')}>
                {saving ? <span className="spinner" /> : 'Save'}
              </button>
            </div>
          </form>
          {auth.guildRequired && (
            <div className={`alert ${u.inGuild ? 'alert-success' : 'alert-warn'}`} style={{ marginTop: 14 }}>
              <Icon name="discord" size={18} />
              <div className="stack" style={{ gap: 6 }}>
                <span>{u.inGuild ? 'You are a member of our Discord server – the wheel is unlocked.' : 'Join our Discord server to unlock the daily spin.'}</span>
                {!u.inGuild && (
                  <div className="row wrap">
                    <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord btn-sm">
                      Join the server
                    </a>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={recheckGuild} disabled={checkingGuild}>
                      {checkingGuild ? <span className="spinner" /> : 'I joined – check again'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="card pad acc-section">
          <h2 className="acc-title">
            <Icon name="coin" size={18} /> Store credit & referrals
          </h2>
          <div className="acc-stats">
            <div className="acc-stat">
              <span className="acc-stat-v">{data ? fmt(data.creditCents) : '–'}</span>
              <span className="acc-stat-l">Store credit</span>
            </div>
            <div className="acc-stat">
              <span className="acc-stat-v">{data ? data.referral.referrals : '–'}</span>
              <span className="acc-stat-l">Friends referred</span>
            </div>
            <div className="acc-stat">
              <span className="acc-stat-v">{data ? fmt(data.referral.earnedCents) : '–'}</span>
              <span className="acc-stat-l">Earned from referrals</span>
            </div>
          </div>
          <p className="muted small">Credit is applied automatically at checkout when you order as {u.mcUsername ? <strong>{u.mcUsername}</strong> : 'your Minecraft username'}.</p>
          <Link to="/referral" className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }}>
            <Icon name="share" size={14} /> Get your referral link
          </Link>
        </section>
      </div>

      <section className="card pad acc-section" id="orders">
        <h2 className="acc-title">
          <Icon name="package" size={18} /> My orders
        </h2>
        {!data ? (
          <div className="skeleton" style={{ height: 80 }} />
        ) : data.orders.length === 0 ? (
          <div className="empty" style={{ padding: '24px 0' }}>
            <p className="muted">No orders yet – orders you place while logged in show up here.</p>
            <Link to="/shop" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
              Browse the shop
            </Link>
          </div>
        ) : (
          <ul className="acc-orders">
            {data.orders.map((o) => (
              <li key={o.id}>
                <Link to={`/order/${o.id}`} className="acc-order">
                  <span className="mono acc-order-id">{o.id}</span>
                  <span className="acc-order-items">{o.itemsSummary}</span>
                  <span className={`badge ${STATUS_LABEL[o.status]?.cls ?? ''}`}>{STATUS_LABEL[o.status]?.text ?? o.status}</span>
                  <span className="acc-order-total">{fmt(o.totalCents)}</span>
                  <span className="xs muted">{new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="xs muted">Have an order from before you logged in? Track it with its ID on the <Link to="/track">tracking page</Link>.</p>
      </section>

      <section className="card pad acc-section">
        <h2 className="acc-title">
          <Icon name="gift" size={18} /> Prizes you won
        </h2>
        {!data ? (
          <div className="skeleton" style={{ height: 60 }} />
        ) : data.prizes.length === 0 ? (
          <p className="muted">Nothing yet – <Link to="/spin">spin the wheel</Link> once a day to win coupons, coins and items.</p>
        ) : (
          <ul className="acc-prizes">
            {data.prizes.map((p, i) => (
              <li key={`${p.at}-${i}`} className="acc-prize">
                <span className="acc-prize-label">{p.label}</span>
                {p.code && (
                  <button type="button" className="code-box acc-code" onClick={() => navigator.clipboard?.writeText(p.code!).then(() => toast('Code copied', 'success'))} title="Copy code">
                    {p.code} <Icon name="copy" size={14} />
                  </button>
                )}
                {p.orderId && (
                  <Link to={`/order/${p.orderId}`} className="btn btn-ghost btn-sm">
                    View order <Icon name="arrowRight" size={14} />
                  </Link>
                )}
                {typeof p.creditCents === 'number' && p.creditCents > 0 && <span className="badge badge-gold">+{fmt(p.creditCents)} credit</span>}
                <span className="xs muted">{new Date(p.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
