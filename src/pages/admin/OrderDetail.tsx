import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Order, OrderStatus, PaymentStatus, RolledContent } from '../../shared/types';
import { Seo } from '../../components/ui/Seo';
import { Icon } from '../../components/ui/Icons';
import { getOrder, patchOrder } from '../../lib/adminApi';
import { useAction, useAdminQuery } from '../../components/admin/hooks';
import { Avatar, CopyButton, ErrorBlock, Loading, Panel, ProductThumb } from '../../components/admin/Bits';
import { OrderActions } from '../../components/admin/OrderActions';
import { PaymentBadge, StatusBadge } from '../../components/admin/StatusBadge';
import { SelectInput, TextArea } from '../../components/admin/Field';
import { PAYMENT_LABEL, STATUS_LABEL, formatDate, formatMillionsLabel, itemTitle, millionsToPayAmount, moneyBreakdown, rarityClass, relativeTime, usd } from '../../components/admin/adminUtils';

const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'pending_review', 'paid', 'refunded', 'failed'];

function Drop({ d }: { d: RolledContent }) {
  return (
    <span className={`adm-drop ${rarityClass(d.rarity)}`} title={d.rarity ?? 'common'}>
      <span className="q">{d.qty}×</span> {d.name}
    </span>
  );
}

function timelineLabel(s: Order['timeline'][number]['status']): string {
  if (s === 'note') return 'Note';
  if (s === 'payment_reference') return 'Payment reported';
  if (s === 'payment_pending') return 'Payment pending';
  return STATUS_LABEL[s as OrderStatus] ?? s;
}

export default function OrderDetail() {
  const { id = '' } = useParams();
  const orderId = id.toUpperCase();
  const q = useAdminQuery(() => getOrder(orderId), [orderId]);
  const { run, isBusy, anyBusy } = useAction();
  const order = q.data;
  const [note, setNote] = useState('');
  useEffect(() => setNote(order?.adminNote ?? ''), [order?.id, order?.adminNote]);

  const money = useMemo(() => (order ? moneyBreakdown(order) : { total: 0, lines: [] }), [order]);
  const payCmd = order && money.total > 0 ? `/pay ${order.username} ${millionsToPayAmount(money.total)}` : '';

  const apply = async (body: Parameters<typeof patchOrder>[1], key: string, msg: string) => {
    const updated = await run(key, () => patchOrder(orderId, body), msg);
    if (updated) q.setData(updated);
  };

  if (q.loading && !order) {
    return (
      <div className="adm-page">
        <Seo title={`${orderId} · Admin · DonutCoins`} description="Order detail" />
        <Loading label={`Loading ${orderId}…`} />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="adm-page">
        <Seo title={`${orderId} · Admin · DonutCoins`} description="Order detail" />
        <Link to="/admin/orders" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
          <Icon name="arrowRight" size={14} style={{ transform: 'rotate(180deg)' }} /> Orders
        </Link>
        <ErrorBlock message={q.error ?? 'Order not found.'} onRetry={() => void q.reload()} />
      </div>
    );
  }

  const p = order.payment;
  const qt = order.quote;
  const fee = order.totalCents - qt.totalCents;

  return (
    <div className="adm-page">
      <Seo title={`${order.id} · Admin · DonutCoins`} description="Order detail" />
      <div className="stack" style={{ gap: 10 }}>
        <Link to="/admin/orders" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginLeft: -10 }}>
          <Icon name="arrowRight" size={14} style={{ transform: 'rotate(180deg)' }} /> All orders
        </Link>
        <div className="adm-order-head">
          <h2>{order.id}</h2>
          <CopyButton text={order.id} iconOnly label="Copy order ID" className="btn btn-ghost btn-icon" />
          <StatusBadge status={order.status} />
          <PaymentBadge status={p.status} />
          {order.source && order.source !== 'checkout' && <span className="badge badge-pink">{order.source}</span>}
          <span className="muted small">
            {formatDate(order.createdAt)} · {relativeTime(order.createdAt)}
          </span>
        </div>
        <OrderActions order={order} busy={isBusy('status')} onChange={(status) => apply({ status }, 'status', `Order ${STATUS_LABEL[status].toLowerCase()}`)} />
      </div>

      <div className="adm-cols adm-cols-main">
        <div className="adm-stack">
          {/* customer */}
          <Panel title="Customer" icon="user">
            <div className="stack" style={{ gap: 14 }}>
              <div className="adm-customer">
                <Avatar name={order.username} size={56} className="adm-avatar-lg" />
                <div>
                  <div className="name">
                    {order.username}
                    <CopyButton text={order.username} iconOnly label="Copy username" className="btn btn-ghost btn-icon" />
                  </div>
                  <div className="muted small meta">
                    {order.usernameUuid ? <span className="mono xs">{order.usernameUuid}</span> : <span>UUID not verified</span>}
                    {order.discordUserId && (
                      <span className="xs">
                        Discord: <strong>{order.discordUsername ?? '?'}</strong> <span className="mono muted">({order.discordUserId})</span>
                      </span>
                    )}
                    {order.email && <a href={`mailto:${order.email}`}>{order.email}</a>}
                  </div>
                </div>
              </div>

              {money.total > 0 && (
                <div className="adm-pay-cmd">
                  <div className="row between wrap">
                    <strong className="small">In-game money to send: {formatMillionsLabel(money.total)}</strong>
                    <CopyButton text={payCmd} className="btn btn-primary btn-sm" label="Copy /pay command" />
                  </div>
                  <div className="cmd">{payCmd}</div>
                  {money.lines.length > 1 && (
                    <ul>
                      {money.lines.map((l, i) => (
                        <li key={i}>
                          {l.label} → {formatMillionsLabel(l.millions)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {order.customerNote && (
                <div>
                  <div className="label">Customer note</div>
                  <div className="alert alert-info small" style={{ whiteSpace: 'pre-wrap' }}>
                    {order.customerNote}
                  </div>
                </div>
              )}
            </div>
          </Panel>

          {/* items */}
          <Panel title={`Items (${order.items.length})`} icon="package" sub="Boxes show exactly what was rolled – hand these out." tight>
            <div className="adm-items">
              {order.items.map((it, idx) => (
                <div className="adm-item" key={`${it.productId}-${idx}`}>
                  <ProductThumb src={it.image} alt="" />
                  <div className="adm-item-main">
                    <div className="adm-item-row">
                      <span className="name">{itemTitle(it)}</span>
                      <span className="badge">{it.kind}</span>
                      <span className="muted small">
                        {it.qty} × {usd(it.unitPriceCents)}
                      </span>
                      <span className="price">{usd(it.lineTotalCents)}</span>
                    </div>
                    {it.rolled && it.rolled.length > 0 && (
                      <div className="stack" style={{ gap: 6 }}>
                        {it.rolled.map((box, bi) => (
                          <div className="adm-drops" key={bi}>
                            <span className="box-label">
                              Box {bi + 1} of {it.rolled!.length}
                            </span>
                            <div className="adm-drop-list">
                              {box.map((d, di) => (
                                <Drop d={d} key={di} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {it.contents && it.contents.length > 0 && (
                      <div className="adm-drops">
                        <span className="box-label">Contents {it.qty > 1 ? `(×${it.qty})` : ''}</span>
                        <div className="adm-drop-list">
                          {it.contents.map((c, ci) => (
                            <Drop d={c} key={ci} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* timeline */}
          <Panel title="Timeline" icon="clock">
            <ul className="adm-timeline">
              {[...order.timeline].reverse().map((t, i) => (
                <li key={i}>
                  <span className={`dot-s ${t.status}`} />
                  <div>
                    <strong className="small">{timelineLabel(t.status)}</strong>
                    {t.note && <div className="text-2 small">{t.note}</div>}
                    <div className="when">{formatDate(t.at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="adm-stack">
          {/* payment */}
          <Panel title="Payment" icon="card">
            <dl className="adm-kv">
              <dt>Method</dt>
              <dd>
                {p.methodName} <span className="muted xs">({p.type})</span>
              </dd>
              <dt>Status</dt>
              <dd>
                <PaymentBadge status={p.status} />
              </dd>
              <dt>Total</dt>
              <dd>
                <strong>{usd(order.totalCents)}</strong>
                {order.displayCurrency && order.displayCurrency !== 'USD' && <span className="muted xs"> shown as {order.displayCurrency}</span>}
              </dd>
              {p.reference && (
                <>
                  <dt>Reference</dt>
                  <dd className="mono">
                    {p.reference} <CopyButton text={p.reference} iconOnly label="Copy reference" className="btn btn-ghost btn-sm" />
                  </dd>
                </>
              )}
              {p.referenceNote && (
                <>
                  <dt>Note</dt>
                  <dd className="text-2">{p.referenceNote}</dd>
                </>
              )}
              {p.providerId && (
                <>
                  <dt>Provider ID</dt>
                  <dd className="mono">
                    {p.providerUrl ? (
                      <a href={p.providerUrl} target="_blank" rel="noreferrer">
                        {p.providerId} <Icon name="external" size={12} />
                      </a>
                    ) : (
                      p.providerId
                    )}
                  </dd>
                </>
              )}
              {p.paidAt && (
                <>
                  <dt>Paid at</dt>
                  <dd>{formatDate(p.paidAt)}</dd>
                </>
              )}
              {p.payLink && (
                <>
                  <dt>Pay link</dt>
                  <dd>
                    <a href={p.payLink} target="_blank" rel="noreferrer" className="small">
                      {p.payLink}
                    </a>
                  </dd>
                </>
              )}
            </dl>
            {p.instructions && (
              <details style={{ marginTop: 12 }}>
                <summary className="small muted" style={{ cursor: 'pointer' }}>
                  Instructions shown to the customer
                </summary>
                <div className="adm-instructions" style={{ marginTop: 8 }}>
                  {p.instructions.replace(/\*\*/g, '')}
                </div>
              </details>
            )}
            <div className="row" style={{ marginTop: 14, gap: 8 }}>
              <SelectInput aria-label="Payment status" value={p.status} disabled={anyBusy} onChange={(e) => void apply({ paymentStatus: e.target.value as PaymentStatus }, 'pay', 'Payment status updated')} style={{ height: 36 }}>
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PAYMENT_LABEL[s]}
                  </option>
                ))}
              </SelectInput>
              {isBusy('pay') && <span className="spinner" />}
            </div>
            <p className="adm-help" style={{ marginTop: 6 }}>
              Changing the payment status only fixes bookkeeping – use the buttons at the top to move the order forward.
            </p>
          </Panel>

          {/* quote */}
          <Panel title="Totals" icon="dollar">
            <div className="adm-quote">
              <div>
                <span>Subtotal</span>
                <span>{usd(qt.subtotalCents)}</span>
              </div>
              {qt.saleDiscountCents > 0 && (
                <div className="disc">
                  <span>Sale −{qt.salePercent}%</span>
                  <span>−{usd(qt.saleDiscountCents)}</span>
                </div>
              )}
              {qt.tierDiscountCents > 0 && (
                <div className="disc">
                  <span>Spending tier −{qt.tierPercent}%</span>
                  <span>−{usd(qt.tierDiscountCents)}</span>
                </div>
              )}
              {qt.couponDiscountCents > 0 && (
                <div className="disc">
                  <span>Coupon {qt.couponCode}</span>
                  <span>−{usd(qt.couponDiscountCents)}</span>
                </div>
              )}
              {qt.referralDiscountCents > 0 && (
                <div className="disc">
                  <span>Referral {qt.referralCode}</span>
                  <span>−{usd(qt.referralDiscountCents)}</span>
                </div>
              )}
              {order.creditAppliedCents > 0 && (
                <div className="disc">
                  <span>Store credit</span>
                  <span>−{usd(order.creditAppliedCents)}</span>
                </div>
              )}
              {fee > 0 && (
                <div>
                  <span>Payment fee</span>
                  <span>+{usd(fee)}</span>
                </div>
              )}
              <div className="total">
                <span>Total</span>
                <span>{usd(order.totalCents)}</span>
              </div>
            </div>
            {(order.discountCode || order.referralCode) && (
              <dl className="adm-kv" style={{ marginTop: 14 }}>
                {order.discountCode && (
                  <>
                    <dt>Discount code</dt>
                    <dd className="mono">{order.discountCode}</dd>
                  </>
                )}
                {order.referralCode && (
                  <>
                    <dt>Referred by</dt>
                    <dd>
                      {order.referralCode} {order.referralRewarded && <span className="badge badge-green">rewarded</span>}
                    </dd>
                  </>
                )}
              </dl>
            )}
          </Panel>

          {/* admin note */}
          <Panel title="Admin note" icon="list" sub="Only you can see this.">
            <div className="stack" style={{ gap: 10 }}>
              <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Verified TX on explorer, delivered at spawn…" rows={4} />
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary btn-sm" disabled={isBusy('note') || note === (order.adminNote ?? '')} onClick={() => void apply({ adminNote: note }, 'note', 'Note saved')}>
                  {isBusy('note') ? <span className="spinner" /> : <Icon name="check" size={14} />} Save note
                </button>
              </div>
            </div>
          </Panel>

          <Panel title="Meta" icon="info">
            <dl className="adm-kv">
              <dt>Updated</dt>
              <dd>{formatDate(order.updatedAt)}</dd>
              <dt>Source</dt>
              <dd>{order.source ?? 'checkout'}</dd>
              {order.ipHash && (
                <>
                  <dt>IP hash</dt>
                  <dd className="mono">{order.ipHash.slice(0, 12)}…</dd>
                </>
              )}
              {order.deviceId && (
                <>
                  <dt>Device</dt>
                  <dd className="mono">{order.deviceId.slice(0, 12)}…</dd>
                </>
              )}
              <dt>Reviewed</dt>
              <dd>{order.reviewed ? 'yes' : 'not yet'}</dd>
              <dt>Public page</dt>
              <dd>
                <a href={`/order/${order.id}`} target="_blank" rel="noreferrer" className="small">
                  /order/{order.id} <Icon name="external" size={12} />
                </a>
              </dd>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
