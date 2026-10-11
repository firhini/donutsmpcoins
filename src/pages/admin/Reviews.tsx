import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Review } from '../../shared/types';
import { Seo } from '../../components/ui/Seo';
import { Icon } from '../../components/ui/Icons';
import { listReviews, setReviewStatus } from '../../lib/adminApi';
import { useAction, useAdminQuery } from '../../components/admin/hooks';
import { Avatar, CopyButton, ErrorBlock, PageHead, Stars } from '../../components/admin/Bits';
import { ReviewBadge } from '../../components/admin/StatusBadge';
import { formatDate, relativeTime } from '../../components/admin/adminUtils';

type Tab = Review['status'];
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'pending', label: 'Pending', icon: 'clock' },
  { id: 'approved', label: 'Approved', icon: 'check' },
  { id: 'rejected', label: 'Rejected', icon: 'close' },
];

export default function Reviews() {
  const [tab, setTab] = useState<Tab>('pending');
  const list = useAdminQuery(() => listReviews(tab), [tab]);
  const { run, isBusy } = useAction();

  const setStatus = async (r: Review, status: Review['status']) => {
    const updated = await run(`${r.id}:${status}`, () => setReviewStatus(r.id, status), status === 'approved' ? `Review approved${status === 'approved' ? ' – reward coupon created' : ''}` : 'Review rejected');
    if (updated === undefined) return;
    list.setData((d) => (d ? d.filter((x) => x.id !== r.id) : d));
    void list.reload(true);
  };

  const reviews = list.data ?? [];

  return (
    <div className="adm-page">
      <Seo robots="noindex,nofollow" title="Reviews · Admin · DonutCoins" description="DonutCoins back office" />
      <PageHead title="Reviews" sub="Approving a review publishes it and sends the customer a thank-you coupon.">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => void list.reload(true)}>
          <Icon name="refresh" size={14} /> Refresh
        </button>
      </PageHead>

      <div className="adm-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`adm-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <Icon name={t.icon} size={15} /> {t.label}
          </button>
        ))}
      </div>

      <div className="adm-panel">
        {list.error && !list.data ? (
          <div style={{ padding: 16 }}>
            <ErrorBlock message={list.error} onRetry={() => void list.reload()} />
          </div>
        ) : list.loading && !list.data ? (
          <div className="adm-skel-rows">
            <div className="skeleton" style={{ width: '60%' }} />
            <div className="skeleton" style={{ width: '90%' }} />
            <div className="skeleton" style={{ width: '75%' }} />
          </div>
        ) : reviews.length === 0 ? (
          <div className="adm-table-empty">
            <div className="big" aria-hidden="true">
              {tab === 'pending' ? '✨' : '⭐'}
            </div>
            {tab === 'pending' ? 'No reviews waiting for approval.' : `No ${tab} reviews.`}
          </div>
        ) : (
          reviews.map((r) => (
            <article className="adm-review" key={r.id}>
              <div className="adm-review-head">
                <Avatar name={r.username} size={32} />
                <strong>{r.username}</strong>
                <Stars rating={r.rating} />
                <ReviewBadge status={r.status} />
                <span className="muted xs" title={formatDate(r.createdAt)}>
                  {relativeTime(r.createdAt)}
                </span>
                <Link to={`/admin/orders/${r.orderId}`} className="adm-id small adm-review-order">
                  {r.orderId} <Icon name="chevronRight" size={12} />
                </Link>
              </div>
              {r.productNames && r.productNames.length > 0 && (
                <div className="row wrap" style={{ gap: 4 }}>
                  {r.productNames.map((n) => (
                    <span className="badge" key={n}>
                      {n}
                    </span>
                  ))}
                </div>
              )}
              <p className="comment">{r.comment || <span className="muted">(no comment)</span>}</p>
              <div className="row wrap" style={{ gap: 8 }}>
                {r.status !== 'approved' && (
                  <button type="button" className="btn btn-success btn-sm" disabled={isBusy(`${r.id}:approved`)} onClick={() => void setStatus(r, 'approved')}>
                    {isBusy(`${r.id}:approved`) ? <span className="spinner" /> : <Icon name="check" size={14} />} Approve
                  </button>
                )}
                {r.status !== 'rejected' && (
                  <button type="button" className="btn btn-danger btn-sm" disabled={isBusy(`${r.id}:rejected`)} onClick={() => void setStatus(r, 'rejected')}>
                    {isBusy(`${r.id}:rejected`) ? <span className="spinner" /> : <Icon name="close" size={14} />} Reject
                  </button>
                )}
                {r.rewardCode && (
                  <span className="row" style={{ gap: 6, marginLeft: 'auto' }}>
                    <span className="muted xs">Reward</span>
                    <span className="code-box" style={{ fontSize: 12, padding: '4px 10px' }}>
                      {r.rewardCode}
                    </span>
                    <CopyButton text={r.rewardCode} iconOnly label="Copy reward code" />
                  </span>
                )}
                {r.approvedAt && <span className="muted xs">approved {relativeTime(r.approvedAt)}</span>}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
