import { Link, useNavigate } from 'react-router-dom';
import type { OrderIndexEntry } from '../../shared/types';
import { Seo } from '../../components/ui/Seo';
import { Icon } from '../../components/ui/Icons';
import { getDashboard, listOrders } from '../../lib/adminApi';
import { useAdminQuery } from '../../components/admin/hooks';
import { Avatar, ErrorBlock, PageHead, Panel } from '../../components/admin/Bits';
import { DataTable, type Column } from '../../components/admin/DataTable';
import { PaymentBadge, StatusBadge } from '../../components/admin/StatusBadge';
import { INTEGRATION_ENV, prettyMethod, relativeTime, usd } from '../../components/admin/adminUtils';

function Tile({ label, value, sub, tone, to, icon, urgent }: { label: string; value: string; sub?: string; tone: string; to?: string; icon: string; urgent?: boolean }) {
  const inner = (
    <>
      <div className="adm-tile-label">
        <Icon name={icon} size={13} /> {label}
      </div>
      <div className="adm-tile-value">{value}</div>
      {sub && <div className="adm-tile-sub">{sub}</div>}
    </>
  );
  const cls = `adm-tile adm-tile-${tone} ${urgent ? 'urgent' : ''}`;
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const dash = useAdminQuery(getDashboard, []);
  const needs = useAdminQuery(async () => {
    const [awaiting, paid] = await Promise.all([listOrders({ status: 'awaiting_payment' }), listOrders({ status: 'paid' })]);
    const reported = awaiting.orders.filter((o) => o.paymentStatus === 'pending_review');
    return [...reported, ...paid.orders].slice(0, 8);
  }, []);

  const d = dash.data;
  const loading = dash.loading && !d;
  /** tile text: "…" while loading, "—" when the API failed, otherwise the number */
  const num = (v: number | undefined) => (loading ? '…' : !d ? '—' : String(v ?? 0));
  const money = (v: number | undefined) => (loading ? '…' : !d ? '—' : usd(v ?? 0));

  const recentCols: Column<OrderIndexEntry>[] = [
    { key: 'id', header: 'Order', render: (o) => <span className="adm-id">{o.id}</span> },
    { key: 'when', header: 'When', render: (o) => <span className="muted">{relativeTime(o.createdAt)}</span> },
    {
      key: 'user',
      header: 'Player',
      render: (o) => (
        <span className="adm-user">
          <Avatar name={o.username} /> {o.username}
        </span>
      ),
    },
    { key: 'items', header: 'Items', className: 'ellipsis', render: (o) => <span className="text-2">{o.itemsSummary || '—'}</span> },
    { key: 'total', header: 'Total', className: 'num', render: (o) => <strong>{usd(o.totalCents)}</strong> },
    { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
  ];

  return (
    <div className="adm-page">
      <Seo robots="noindex,nofollow" title="Dashboard · Admin · DonutCoins" description="DonutCoins back office" />
      <PageHead title="Dashboard" sub="What needs your attention right now.">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => void Promise.all([dash.reload(true), needs.reload(true)])}>
          <Icon name="refresh" size={14} /> Refresh
        </button>
      </PageHead>

      <div className="adm-tiles" aria-busy={loading}>
        <Tile label="Awaiting payment" icon="clock" tone="gold" value={num(d?.counts.awaiting)} to="/admin/orders?status=awaiting_payment" sub="not paid yet" />
        <Tile label="Paid – deliver" icon="bolt" tone="green" value={num(d?.counts.paid)} to="/admin/orders?status=paid" sub="go in-game" urgent={(d?.counts.paid ?? 0) > 0} />
        <Tile label="Delivering" icon="truck" tone="blue" value={num(d?.counts.delivering)} to="/admin/orders?status=delivering" sub="in progress" />
        <Tile label="Delivered" icon="check" tone="violet" value={num(d?.counts.delivered)} to="/admin/orders?status=delivered" sub="all time" />
        <Tile label="Revenue" icon="dollar" tone="gold" value={money(d?.revenueCents)} sub="paid + delivered" />
        <Tile label="Today" icon="sparkles" tone="pink" value={money(d?.today.revenueCents)} sub={d ? `${d.today.orders} order${d.today.orders === 1 ? '' : 's'}` : ''} />
      </div>

      <div className="adm-cols adm-cols-main">
        <div className="adm-stack">
          <Panel
            title="Needs action"
            icon="bolt"
            sub="Reported payments to verify first, then paid orders to deliver."
            tight
            actions={
              <Link to="/admin/orders?status=paid" className="btn btn-ghost btn-sm">
                All orders <Icon name="arrowRight" size={14} />
              </Link>
            }
          >
            {needs.error && !needs.data ? (
              <div style={{ padding: 16 }}>
                <ErrorBlock message={needs.error} onRetry={() => void needs.reload()} />
              </div>
            ) : needs.loading && !needs.data ? (
              <div className="adm-skel-rows">
                <div className="skeleton" style={{ width: '80%' }} />
                <div className="skeleton" style={{ width: '65%' }} />
              </div>
            ) : needs.data && needs.data.length > 0 ? (
              <div className="adm-action-list">
                {needs.data.map((o) => (
                  <Link key={o.id} to={`/admin/orders/${o.id}`} className="adm-action-item">
                    <Avatar name={o.username} size={32} />
                    <div className="t">
                      <strong>
                        <span className="adm-id">{o.id}</span> · {o.username}
                      </strong>
                      <span>{o.itemsSummary || '—'}</span>
                    </div>
                    {o.paymentStatus === 'pending_review' ? <PaymentBadge status="pending_review" /> : <StatusBadge status={o.status} />}
                    <span className="amt">{usd(o.totalCents)}</span>
                    <Icon name="chevronRight" size={16} className="muted" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="adm-table-empty">
                <div className="big" aria-hidden="true">
                  🎉
                </div>
                Inbox zero – nothing to deliver or verify.
              </div>
            )}
          </Panel>

          <Panel title="Recent orders" icon="package" tight>
            <DataTable columns={recentCols} rows={d?.recent ?? []} rowKey={(o) => o.id} onRowClick={(o) => navigate(`/admin/orders/${o.id}`)} loading={loading} error={dash.error} onRetry={() => void dash.reload()} empty="No orders yet. Share your store link!" emptyIcon="🛒" />
          </Panel>
        </div>

        <div className="adm-stack">
          <div className="adm-tiles" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <Tile label="Pending reviews" icon="star" tone="gold" value={num(d?.pendingReviews)} to="/admin/reviews" sub="to approve" />
            <Tile label="Active giveaways" icon="trophy" tone="pink" value={num(d?.activeGiveaways)} to="/admin/giveaways" sub="running" />
          </div>

          <Panel title="Integrations" icon="server" sub="Configured through Netlify environment variables.">
            <div className="adm-integrations">
              {(Object.keys(INTEGRATION_ENV) as (keyof typeof INTEGRATION_ENV)[]).map((k) => {
                const on = !!d?.integrations[k];
                return (
                  <div key={k} className="adm-integration">
                    <span className={`dot ${on ? '' : 'off'}`} />
                    <div className="t">
                      <strong>{INTEGRATION_ENV[k].label}</strong>
                      <span>{on ? 'Configured' : `Not set – add ${INTEGRATION_ENV[k].vars.join(', ')}`}</span>
                    </div>
                    <span className={`badge ${on ? 'badge-green' : ''}`}>{on ? 'on' : 'off'}</span>
                  </div>
                );
              })}
            </div>
            <p className="adm-help" style={{ marginTop: 10 }}>
              Manual methods (PayPal.me, crypto addresses, Revolut…) work without any of these. See README → Netlify setup.
            </p>
          </Panel>

          <Panel title="Quick links" icon="sparkles">
            <div className="adm-quicklinks">
              <Link to="/admin/products">
                <Icon name="plus" size={15} /> Add product
              </Link>
              <Link to="/admin/coupons">
                <Icon name="ticket" size={15} /> New coupon
              </Link>
              <Link to="/admin/giveaways">
                <Icon name="trophy" size={15} /> New giveaway
              </Link>
              <Link to="/admin/settings#payments">
                <Icon name="card" size={15} /> Payment methods
              </Link>
              <Link to="/admin/settings#spin">
                <Icon name="spin" size={15} /> Spin prizes
              </Link>
              <Link to="/" target="_blank">
                <Icon name="external" size={15} /> View store
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
