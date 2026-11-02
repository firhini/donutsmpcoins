import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icons';
import { getSessionDetail } from '../../lib/adminApi';
import { useAdminQuery } from './hooks';
import { usd } from './adminUtils';
import { useStore } from '../../context/StoreContext';

const fmtT = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const LABEL: Record<string, { icon: string; text: (v: string, name: (id: string) => string) => string }> = {
  pv: { icon: 'eye', text: (v) => `Viewed ${v}` },
  click: { icon: 'bolt', text: (v) => `Clicked ${v}` },
  login_click: { icon: 'user', text: (v) => `Clicked ${v}` },
  product_view: { icon: 'box', text: (v, n) => `Opened product ${n(v)}` },
  add_to_cart: { icon: 'cart', text: (v, n) => `Added ${n(v)} to cart` },
  begin_checkout: { icon: 'card', text: () => 'Started checkout' },
  order_created: { icon: 'check', text: (v) => `Placed order ${v}` },
};

/** One visitor's path through the store (only recorded for visitors who accepted cookies). */
export function Journey({ sessionId }: { sessionId: string }) {
  const q = useAdminQuery(() => getSessionDetail(sessionId), [sessionId]);
  const { products } = useStore();
  const name = (id: string) => products.find((p) => p.id === id)?.name ?? id;
  if (q.loading && !q.data) return <p className="muted small">Loading journey…</p>;
  if (!q.data) return <p className="muted small">{q.error ?? 'Journey not found.'}</p>;
  const { session: s, orders } = q.data;
  return (
    <div className="journey">
      <div className="journey-meta">
        <span className="badge">{s.sourceLabel}</span>
        {s.source.landing && <span className="muted small">landed on {s.source.landing}</span>}
        <span className="muted small">
          {s.device}
          {s.country ? ` · ${s.country}` : ''}
          {s.userId ? ' · logged in' : ''}
        </span>
      </div>
      <ol className="journey-list">
        {s.events.map((e, i) => {
          const l = LABEL[e.e] ?? { icon: 'info', text: (v: string) => `${e.e} ${v}` };
          return (
            <li key={i}>
              <span className="journey-t mono">{fmtT(e.t)}</span>
              <Icon name={l.icon} size={13} />
              <span>
                {e.e === 'order_created' && e.v ? (
                  <>
                    Placed order <Link to={`/admin/orders/${e.v}`}>{e.v}</Link>
                  </>
                ) : (
                  l.text(e.v ?? '', name)
                )}
              </span>
            </li>
          );
        })}
      </ol>
      {orders.length > 0 && (
        <p className="small">
          Orders from this visit:{' '}
          {orders.map((o) => (
            <Link key={o.id} to={`/admin/orders/${o.id}`} style={{ marginRight: 8 }}>
              {o.id} ({usd(o.totalCents)}, {o.status})
            </Link>
          ))}
        </p>
      )}
    </div>
  );
}
