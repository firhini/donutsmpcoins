import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { PublicOrder } from '../shared/types';
import { apiGet } from '../lib/api';
import { useStore } from '../context/StoreContext';
import { Seo } from '../components/ui/Seo';
import { Icon } from '../components/ui/Icons';
import { forgetOrder, formatDate, getRecentOrders, itemTitle, normalizeOrderId, ORDER_ID_RE, relativeTime, STATUS_BADGE, STATUS_LABEL, type RecentOrder } from '../components/cart/cartUtils';
import '../styles/cart.css';

type Lookup = { state: 'loading' } | { state: 'ok'; order: PublicOrder } | { state: 'missing' } | { state: 'error' };

export default function Page() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { config, fmt } = useStore();
  const [value, setValue] = useState(() => (params.get('id') ?? '').replace(/^dc-?/i, ''));
  const [err, setErr] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentOrder[]>(() => getRecentOrders());
  const [lookups, setLookups] = useState<Record<string, Lookup>>({});

  useEffect(() => {
    const ids = recent.slice(0, 8).map((r) => r.id);
    if (!ids.length) return;
    let cancelled = false;
    setLookups((cur) => Object.fromEntries(ids.map((id) => [id, cur[id] ?? { state: 'loading' }])));
    void Promise.allSettled(ids.map((id) => apiGet<{ order: PublicOrder }>(`/orders/${encodeURIComponent(id)}`))).then((results) => {
      if (cancelled) return;
      const next: Record<string, Lookup> = {};
      results.forEach((r, i) => {
        const id = ids[i];
        if (r.status === 'fulfilled') next[id] = { state: 'ok', order: r.value.order };
        else {
          const status = (r.reason as { status?: number })?.status;
          next[id] = status === 404 ? { state: 'missing' } : { state: 'error' };
        }
      });
      setLookups(next);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recent.map((r) => r.id).join(',')]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const id = normalizeOrderId(value);
    if (!ORDER_ID_RE.test(id)) {
      setErr('Order IDs look like DC-ABC123 – you will find yours on the confirmation page or in our Discord DM.');
      return;
    }
    setErr(null);
    nav(`/order/${id}`);
  };

  const remove = (id: string) => {
    forgetOrder(id);
    setRecent(getRecentOrders());
  };

  return (
    <div className="container page tr-page">
      <Seo title={`Track your order · ${config.storeName}`} description="Check the payment and delivery status of your DonutCoins order and see what your mystery boxes rolled." />
      <div className="tr-hero">
        <div className="eyebrow">Order tracking</div>
        <h1>Track your order</h1>
        <p className="lead">Enter your order ID to see the payment status, delivery progress and what your mystery boxes rolled.</p>
        <form className="tr-form card" onSubmit={submit} noValidate>
          <label className="label" htmlFor="tr-id">
            Order ID
          </label>
          <div className="tr-row">
            <div className={`tr-input ${err ? 'has-error' : ''}`}>
              <span className="tr-prefix mono" aria-hidden="true">
                DC-
              </span>
              <input
                id="tr-id"
                className="input mono"
                placeholder="ABC123"
                value={value}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-invalid={!!err}
                aria-describedby="tr-hint"
                onChange={(e) => {
                  setValue(e.target.value.toUpperCase().replace(/^DC-?/, '').replace(/[^A-Z0-9]/g, ''));
                  if (err) setErr(null);
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={!value.trim()}>
              Track <Icon name="arrowRight" size={18} />
            </button>
          </div>
          {err ? (
            <p className="err" role="alert">
              {err}
            </p>
          ) : (
            <p id="tr-hint" className="hint">
              With or without the <span className="mono">DC-</span> prefix – both work. Also sent to you on Discord when you report a payment.
            </p>
          )}
        </form>
      </div>

      <div className="tr-grid">
        <section className="tr-recent">
          <div className="section-head" style={{ marginBottom: 16 }}>
            <h2>Recent orders on this device</h2>
            <p className="muted small">Stored only in your browser – nothing is shared.</p>
          </div>
          {recent.length === 0 ? (
            <div className="card pad tr-empty">
              <Icon name="package" size={26} />
              <p className="muted">No orders on this device yet. Once you place an order it shows up here automatically.</p>
              <Link to="/shop" className="btn btn-secondary btn-sm">
                Browse the store
              </Link>
            </div>
          ) : (
            <ul className="tr-list">
              {recent.slice(0, 8).map((r) => {
                const lk = lookups[r.id];
                const order = lk?.state === 'ok' ? lk.order : null;
                const status = order?.status;
                return (
                  <li key={r.id} className="card tr-item">
                    <Link to={`/order/${r.id}`} className="tr-item-main">
                      <span className="tr-item-id mono">{r.id}</span>
                      <span className="tr-item-meta">
                        {order ? (
                          <>
                            {order.items
                              .slice(0, 2)
                              .map((i) => itemTitle(i))
                              .join(', ')}
                            {order.items.length > 2 ? ` +${order.items.length - 2} more` : ''}
                          </>
                        ) : r.username ? (
                          <>for {r.username}</>
                        ) : (
                          <>Order</>
                        )}
                      </span>
                      <span className="tr-item-time muted xs">{r.createdAt ? relativeTime(r.createdAt) : order ? formatDate(order.createdAt) : ''}</span>
                    </Link>
                    <div className="tr-item-side">
                      {status ? (
                        <span className={`badge ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
                      ) : lk?.state === 'loading' ? (
                        <span className="skeleton" style={{ width: 86, height: 22, borderRadius: 999 }} />
                      ) : lk?.state === 'missing' ? (
                        <span className="badge badge-red">Not found</span>
                      ) : (
                        <span className="badge">—</span>
                      )}
                      <strong className="tr-item-total">{typeof (order?.totalCents ?? r.totalCents) === 'number' ? fmt((order?.totalCents ?? r.totalCents) as number) : ''}</strong>
                      <button type="button" className="btn btn-ghost btn-icon tr-item-x" onClick={() => remove(r.id)} aria-label={`Forget order ${r.id}`} title="Remove from this list">
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="tr-help card pad">
          <div className="tr-help-icon">
            <Icon name="discord" size={20} />
          </div>
          <h3>Lost your order ID?</h3>
          <p className="muted small">Open a ticket in our Discord with your Minecraft username and the time you ordered – we will find it for you.</p>
          <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord btn-block">
            <Icon name="discord" size={16} /> Join Discord
          </a>
          <Link to="/faq" className="btn btn-ghost btn-block">
            Delivery FAQ
          </Link>
        </aside>
      </div>
    </div>
  );
}
