import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { OrderIndexEntry, OrderStatus } from '../../shared/types';
import { Seo } from '../../components/ui/Seo';
import { Icon } from '../../components/ui/Icons';
import { downloadOrdersCsv, listOrders } from '../../lib/adminApi';
import { useAction, useAdminQuery, useDebounced } from '../../components/admin/hooks';
import { Avatar, PageHead } from '../../components/admin/Bits';
import { DataTable, type Column } from '../../components/admin/DataTable';
import { PaymentBadge, StatusBadge } from '../../components/admin/StatusBadge';
import { ALL_STATUSES, STATUS_LABEL, formatDate, prettyMethod, relativeTime, usd } from '../../components/admin/adminUtils';

export default function Orders() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') ?? '') as OrderStatus | '';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);
  const [q, setQ] = useState(params.get('q') ?? '');
  const dq = useDebounced(q.trim(), 350);
  const { run, isBusy } = useAction();

  // keep ?q= in the URL (debounced) so the list is shareable / refresh-safe
  useEffect(() => {
    const cur = params.get('q') ?? '';
    if (cur === dq) return;
    const next = new URLSearchParams(params);
    if (dq) next.set('q', dq);
    else next.delete('q');
    next.delete('page');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq]);

  // external navigation (top-bar search) updates the box
  useEffect(() => {
    const cur = params.get('q') ?? '';
    if (cur !== q.trim()) setQ(cur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get('q')]);

  const list = useAdminQuery(() => listOrders({ status, q: dq, page }), [status, dq, page]);

  const setStatus = (s: OrderStatus | '') => {
    const next = new URLSearchParams(params);
    if (s) next.set('status', s);
    else next.delete('status');
    next.delete('page');
    setParams(next);
  };
  const setPage = (p: number) => {
    const next = new URLSearchParams(params);
    if (p > 1) next.set('page', String(p));
    else next.delete('page');
    setParams(next);
  };

  const data = list.data;
  const pageSize = data?.pageSize ?? 50;
  const total = data?.total ?? 0;
  const hasMore = !!data && data.orders.length >= pageSize && page * pageSize < total;

  const cols: Column<OrderIndexEntry>[] = [
    { key: 'id', header: 'Order', render: (o) => <span className="adm-id">{o.id}</span> },
    {
      key: 'date',
      header: 'Date',
      render: (o) => (
        <span className="stacked" title={formatDate(o.createdAt)}>
          <span>{formatDate(o.createdAt, false)}</span>
          <span className="xs">{relativeTime(o.createdAt)}</span>
        </span>
      ),
    },
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
    {
      key: 'pay',
      header: 'Payment',
      render: (o) => (
        <span className="stacked">
          <span className="small">{prettyMethod(o.methodId)}</span>
          <PaymentBadge status={o.paymentStatus} />
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
  ];

  return (
    <div className="adm-page">
      <Seo robots="noindex,nofollow" title="Orders · Admin · DonutCoins" description="DonutCoins back office" />
      <PageHead title="Orders" sub={data ? `${total} order${total === 1 ? '' : 's'}${status ? ` · ${STATUS_LABEL[status]}` : ''}` : 'All orders, newest first.'}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => void list.reload(true)}>
          <Icon name="refresh" size={14} /> Refresh
        </button>
        <button type="button" className="btn btn-outline btn-sm" disabled={isBusy('csv')} onClick={() => void run('csv', downloadOrdersCsv, 'CSV downloaded')}>
          {isBusy('csv') ? <span className="spinner" /> : <Icon name="download" size={14} />} Export CSV
        </button>
      </PageHead>

      <div className="adm-toolbar">
        <div className="adm-chips" role="tablist" aria-label="Filter by status">
          <button type="button" className={`adm-chip ${status === '' ? 'active' : ''}`} onClick={() => setStatus('')}>
            All
          </button>
          {ALL_STATUSES.map((s) => (
            <button key={s} type="button" className={`adm-chip ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="adm-search">
          <Icon name="search" size={16} />
          <input className="input adm-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order ID or username" aria-label="Search orders" />
        </div>
      </div>

      <div className="adm-panel">
        <DataTable
          columns={cols}
          rows={data?.orders}
          rowKey={(o) => o.id}
          onRowClick={(o) => navigate(`/admin/orders/${o.id}`)}
          rowClassName={(o) => (o.status === 'cancelled' || o.status === 'refunded' ? 'muted-row' : '')}
          loading={list.loading}
          error={list.error}
          onRetry={() => void list.reload()}
          empty={dq || status ? 'No orders match this filter.' : 'No orders yet.'}
          emptyIcon="🛒"
          minWidth={820}
        />
        {data && (page > 1 || hasMore) && (
          <div className="adm-pager">
            <span>
              Page {page}
              {total ? ` · ${total} total` : ''}
            </span>
            <span className="row" style={{ gap: 6 }}>
              <button type="button" className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                ← Prev
              </button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={!hasMore} onClick={() => setPage(page + 1)}>
                Next →
              </button>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
