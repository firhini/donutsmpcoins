import { useState } from 'react';
import { Seo } from '../../components/ui/Seo';
import { Icon } from '../../components/ui/Icons';
import { getAnalytics, getSessions, type AnalyticsDay, type CountRow } from '../../lib/adminApi';
import { Journey } from '../../components/admin/Journey';
import { useAdminQuery } from '../../components/admin/hooks';
import { ErrorBlock, PageHead, Panel } from '../../components/admin/Bits';
import { usd } from '../../components/admin/adminUtils';
import { useStore } from '../../context/StoreContext';

const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : '—');

function Bars({ series, metric, label, money }: { series: AnalyticsDay[]; metric: keyof AnalyticsDay; label: string; money?: boolean }) {
  const values = series.map((d) => Number(d[metric]) || 0);
  const max = Math.max(1, ...values);
  return (
    <div className="an-chart" role="img" aria-label={label}>
      {series.map((d, i) => (
        <div key={d.date} className="an-bar-col" title={`${d.date}: ${money ? usd(values[i]) : values[i]}`}>
          <span className="an-bar-val">{values[i] ? (money ? usd(values[i]).replace('.00', '') : values[i]) : ''}</span>
          <div className="an-bar" style={{ height: `${(values[i] / max) * 100}%` }} />
          <span className="an-bar-day">{d.date.slice(8)}</span>
        </div>
      ))}
    </div>
  );
}

function Top({ rows, nameOf, empty = 'No data yet.' }: { rows: CountRow[]; nameOf?: (k: string) => string; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (!rows.length) return <p className="muted small">{empty}</p>;
  return (
    <ol className="an-top">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="an-top-fill" style={{ width: `${(r.count / max) * 100}%` }} />
          <span className="an-top-name">{nameOf ? nameOf(r.key) : r.key}</span>
          <strong>{r.count}</strong>
        </li>
      ))}
    </ol>
  );
}

export default function Analytics() {
  const [days, setDays] = useState(14);
  const q = useAdminQuery(() => getAnalytics(days), [days]);
  const sessions = useAdminQuery(() => getSessions(Math.min(days, 30)), [days]);
  const [open, setOpen] = useState<string | null>(null);
  const { products } = useStore();
  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? id;
  const d = q.data;
  const t = d?.totals;

  return (
    <div className="adm-page">
      <Seo robots="noindex,nofollow" title="Analytics · Admin · DonutCoins" />
      <PageHead title="Analytics" sub="Cookieless visitor statistics – counted for every visitor, no consent needed.">
        <div className="row" style={{ gap: 6 }}>
          {[1, 7, 14, 30].map((n) => (
            <button key={n} type="button" className={`btn btn-sm ${days === n ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setDays(n)}>
              {n === 1 ? 'Today' : `${n} days`}
            </button>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void q.reload(true)} aria-label="Refresh">
            <Icon name="refresh" size={14} />
          </button>
        </div>
      </PageHead>

      {q.error && !d && <ErrorBlock message={q.error} onRetry={() => void q.reload()} />}

      <div className="adm-tiles" aria-busy={q.loading}>
        {[
          ['Visitors', t?.visitors, 'users', 'blue', 'unique per day'],
          ['Page views', t?.pageViews, 'eye', 'violet', t ? `${(t.pageViews / Math.max(1, t.visitors)).toFixed(1)} per visitor` : ''],
          ['Added to cart', t?.addToCart, 'cart', 'gold', t ? `${pct(t.addToCart, t.visitors)} of visitors` : ''],
          ['Checkouts started', t?.checkouts, 'card', 'pink', ''],
          ['Paid orders', t?.paidOrders, 'check', 'green', t ? `${pct(t.paidOrders, t.visitors)} conversion` : ''],
          ['Revenue', t ? usd(t.revenueCents) : undefined, 'dollar', 'gold', `last ${days === 1 ? 'day' : `${days} days`}`],
          ['New accounts', t?.signups, 'user', 'blue', t ? `${t.users} accounts in total` : ''],
          ['Cookie consent', d?.consent ? pct(d.consent.accepted, d.consent.accepted + d.consent.declined) : undefined, 'shield', 'violet', d?.consent ? `${d.consent.accepted} accepted · ${d.consent.declined} declined` : ''],
        ].map(([label, value, icon, tone, sub]) => (
          <div key={label as string} className={`adm-tile adm-tile-${tone}`}>
            <div className="adm-tile-label">
              <Icon name={icon as string} size={13} /> {label}
            </div>
            <div className="adm-tile-value">{value ?? (q.loading ? '…' : '—')}</div>
            {sub ? <div className="adm-tile-sub">{sub}</div> : null}
          </div>
        ))}
      </div>

      {d && (
        <>
          <Panel title="Funnel" icon="filter" sub="Where visitors drop off on the way to a paid order.">
            <div className="an-funnel">
              {[
                ['Visitors', t!.visitors],
                ['Viewed a product', t!.productViews],
                ['Added to cart', t!.addToCart],
                ['Started checkout', t!.checkouts],
                ['Placed an order', t!.orders],
                ['Paid', t!.paidOrders],
              ].map(([label, n], i, arr) => (
                <div key={label as string} className="an-funnel-step">
                  <div className="an-funnel-bar" style={{ width: `${Math.max(2, ((n as number) / Math.max(1, arr[0][1] as number)) * 100)}%` }} />
                  <span>{label}</span>
                  <strong>{n}</strong>
                  {i > 0 && <em>{pct(n as number, arr[i - 1][1] as number)}</em>}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Sales by source" icon="dollar" sub="Which site, creator code (?ref=) or utm link brought buyers – visitors who accepted cookies only.">
            {d.sources && d.sources.length > 0 ? (
              <table className="an-sources">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th className="num">Visits</th>
                    <th className="num">Paid orders</th>
                    <th className="num">Revenue</th>
                    <th className="num">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {d.sources.map((r) => (
                    <tr key={r.source}>
                      <td>{r.source}</td>
                      <td className="num">{r.visits}</td>
                      <td className="num">{r.orders}</td>
                      <td className="num">{usd(r.revenueCents)}</td>
                      <td className="num">{pct(r.orders, r.visits)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted small">No tracked visits yet – they appear once visitors accept cookies.</p>
            )}
          </Panel>

          <Panel title="Visitor journeys" icon="users" sub="Every click of visitors who accepted cookies – newest first. Click one to see the full path.">
            {sessions.data && sessions.data.length > 0 ? (
              <div className="an-sessions">
                {sessions.data.slice(0, 60).map((s) => (
                  <div key={s.id} className="an-session">
                    <button type="button" onClick={() => setOpen(open === s.id ? null : s.id)} aria-expanded={open === s.id}>
                      <span>
                        <strong>{s.source}</strong> · {s.pages} pages · {s.clicks} clicks{s.cartAdds ? ` · ${s.cartAdds}× cart` : ''}
                        <div className="sub">
                          {new Date(s.startedAt).toLocaleString()} · {Math.round(s.durationSec / 60)} min · {s.device}
                          {s.country ? ` · ${s.country}` : ''}
                          {s.loggedIn ? ' · logged in' : ''}
                        </div>
                      </span>
                      <span>{s.paidCents > 0 ? <span className="badge badge-green">bought {usd(s.paidCents)}</span> : s.orders > 0 ? <span className="badge badge-gold">ordered</span> : null}</span>
                    </button>
                    {open === s.id && <Journey sessionId={s.id} />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted small">{sessions.loading ? 'Loading…' : 'No tracked visits yet.'}</p>
            )}
          </Panel>

          <div className="adm-cols">
            <Panel title="Visitors per day" icon="users">
              <Bars series={d.series} metric="visitors" label="Visitors per day" />
            </Panel>
            <Panel title="Revenue per day" icon="dollar">
              <Bars series={d.series} metric="revenueCents" label="Revenue per day" money />
            </Panel>
          </div>

          <div className="adm-cols">
            <Panel title="Most clicked buttons & links" icon="bolt" sub="Area › label">
              <Top rows={d.clicks} />
            </Panel>
            <Panel title="Top pages" icon="file">
              <Top rows={d.pages} />
            </Panel>
          </div>

          <div className="adm-cols">
            <Panel title="Most viewed products" icon="eye">
              <Top rows={d.productViews} nameOf={productName} />
            </Panel>
            <Panel title="Most added to cart" icon="cart">
              <Top rows={d.cartAdds} nameOf={productName} />
            </Panel>
          </div>

          <div className="adm-cols">
            <Panel title="Where visitors come from" icon="external" sub="Referring sites and utm_source (first page of a visit).">
              <Top rows={d.referrers} empty="Mostly direct visits so far." />
            </Panel>
            <Panel title="Countries & devices" icon="globe">
              <Top rows={d.countries} />
              <div style={{ height: 12 }} />
              <Top rows={d.devices} />
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
