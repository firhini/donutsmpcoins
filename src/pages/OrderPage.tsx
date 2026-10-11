import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import type { OrderItem, OrderPayment, PublicOrder } from '../shared/types';
import { formatUsd } from '../shared/pricing';
import { apiGet, apiPost, ApiClientError } from '../lib/api';
import { createNowPaymentsInvoice, createStripeSession, redirectToPayment, verifyStripeSession } from '../lib/payments';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Seo } from '../components/ui/Seo';
import { Icon } from '../components/ui/Icons';
import { Modal } from '../components/ui/Modal';
import { CopyButton } from '../components/cart/CopyButton';
import { StatusTimeline } from '../components/cart/StatusTimeline';
import { InstructionText } from '../components/cart/InstructionText';
import { BoxReveal } from '../components/cart/BoxReveal';
import { PayPalButtons } from '../components/cart/PayPalButtons';
import { PaymentIcon } from '../components/cart/PaymentMethodPicker';
import { Thumb } from '../components/cart/Thumb';
import { fireConfetti } from '../components/cart/confetti';
import { formatDate, isRevealed, itemQtyLabel, itemTitle, normalizeOrderId, ORDER_ID_RE, rememberOrder, STATUS_BADGE, STATUS_LABEL } from '../components/cart/cartUtils';
import '../styles/cart.css';

const POLL_MS = 12000;
const POLLING = new Set(['awaiting_payment', 'paid', 'delivering']);
const PAID_OR_LATER = new Set(['paid', 'delivering', 'delivered']);

export default function Page() {
  const { id: rawId = '' } = useParams();
  const id = normalizeOrderId(rawId);
  const [params, setParams] = useSearchParams();
  const loc = useLocation();
  const justPlaced = !!(loc.state as { placed?: boolean } | null)?.placed;
  const { config, fmt } = useStore();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [err, setErr] = useState<{ status: number; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const orderRef = useRef<PublicOrder | null>(null);
  orderRef.current = order;

  const load = useCallback(
    async (silent = false) => {
      if (!ORDER_ID_RE.test(id)) {
        setErr({ status: 404, message: 'That does not look like a valid order ID.' });
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const r = await apiGet<{ order: PublicOrder }>(`/orders/${encodeURIComponent(id)}`);
        setOrder(r.order);
        setErr(null);
      } catch (e) {
        const ae = e as ApiClientError;
        if (!silent || !orderRef.current) setErr({ status: ae.status ?? 0, message: ae.message || 'Could not load this order.' });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // poll while something can still change; pause in background tabs
  const status = order?.status;
  useEffect(() => {
    if (!status || !POLLING.has(status)) return;
    const tick = () => {
      if (document.visibilityState === 'visible') void load(true);
    };
    const t = window.setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [status, load]);

  // back from Stripe Checkout (?paid=1) → verify once as a webhook fallback
  const verified = useRef(false);
  useEffect(() => {
    if (params.get('paid') !== '1' || verified.current) return;
    verified.current = true;
    verifyStripeSession(id)
      .catch(() => undefined)
      .finally(() => {
        void load(true);
        const next = new URLSearchParams(params);
        next.delete('paid');
        setParams(next, { replace: true });
      });
  }, [id, params, setParams, load]);

  // remember on this device + celebrate delivery once
  useEffect(() => {
    if (!order) return;
    rememberOrder({ id: order.id, createdAt: order.createdAt, totalCents: order.totalCents, username: order.username });
  }, [order]);
  useEffect(() => {
    if (order?.status !== 'delivered') return;
    const key = `dc_celebrated_${order.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* ignore */
    }
    fireConfetti({ count: 160 });
  }, [order?.status, order?.id]);

  const boxItems = useMemo(() => (order?.items ?? []).filter((i) => i.kind === 'box' && i.rolled && i.rolled.length > 0), [order]);
  const title = `Order ${id} · ${config.storeName}`;

  if (loading && !order) {
    return (
      <div className="container page od-page" aria-busy="true">
        <Seo title={title} />
        <div className="od-skel">
          <div className="skeleton" style={{ height: 120 }} />
          <div className="skeleton" style={{ height: 96 }} />
          <div className="od-layout">
            <div className="stack">
              <div className="skeleton" style={{ height: 320 }} />
              <div className="skeleton" style={{ height: 200 }} />
            </div>
            <div className="stack">
              <div className="skeleton" style={{ height: 220 }} />
              <div className="skeleton" style={{ height: 160 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (err && !order) {
    const notFound = err.status === 404;
    return (
      <div className="container page od-page">
        <Seo title={title} />
        <div className="cart-empty card od-notfound">
          <div className="cart-empty-icon">
            <Icon name={notFound ? 'search' : 'warning'} size={30} />
          </div>
          <h1>{notFound ? 'Order not found' : 'Could not load this order'}</h1>
          <p className="muted">
            {notFound ? (
              <>
                We have no order with the ID <span className="mono">{id}</span>. Check the spelling – IDs look like <span className="mono">DC-ABC123</span>.
              </>
            ) : (
              err.message
            )}
          </p>
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            {!notFound && (
              <button type="button" className="btn btn-primary" onClick={() => void load()}>
                <Icon name="refresh" size={16} /> Try again
              </button>
            )}
            <Link to="/track" className="btn btn-secondary">
              <Icon name="truck" size={16} /> Track another order
            </Link>
            <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord">
              <Icon name="discord" size={16} /> Ask on Discord
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const shareUrl = `${window.location.origin}/order/${order.id}`;
  const fee = Math.max(0, order.totalCents - order.quote.totalCents);
  const awaiting = order.status === 'awaiting_payment';

  return (
    <div className="container page od-page">
      <Seo title={title} description={`Status and delivery details for order ${order.id}.`} />

      {justPlaced && awaiting && (
        <div className="alert alert-success od-placed" role="status">
          <Icon name="check" size={18} />
          <div>
            <strong>Order placed!</strong> Complete the payment below – delivery starts as soon as it is confirmed. Bookmark this page or save your order ID.
          </div>
        </div>
      )}

      <header className="od-head card">
        <div className="od-head-main">
          <div className="eyebrow">Order</div>
          <div className="od-id">
            <span className="mono">{order.id}</span>
            <CopyButton text={order.id} iconOnly label="Copy order ID" toastMessage="Order ID copied" className="btn btn-ghost btn-icon" iconSize={18} />
          </div>
          <div className="od-meta">
            <span className={`badge ${STATUS_BADGE[order.status]}`}>{STATUS_LABEL[order.status]}</span>
            {order.payment.status === 'pending_review' && awaiting && <span className="badge badge-violet">Payment reported</span>}
            <span>Placed {formatDate(order.createdAt)}</span>
            <span>
              for <b>{order.username}</b>
            </span>
          </div>
        </div>
        <div className="od-head-actions">
          <CopyButton text={shareUrl} className="btn btn-secondary btn-sm" label="Share link" toastMessage="Link copied">
            <Icon name="share" size={15} /> Share link
          </CopyButton>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void load(true)} disabled={refreshing} aria-label="Refresh order">
            <Icon name="refresh" size={15} className={refreshing ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      <StatusTimeline status={order.status} paymentStatus={order.payment.status} timeline={order.timeline} />

      <div className="od-layout">
        <div className="od-main">
          {awaiting && <PaymentPanel order={order} onChange={() => load(true)} />}
          {(order.status === 'paid' || order.status === 'delivering') && <DeliveryPanel order={order} />}
          {order.status === 'delivered' && <DeliveredPanel order={order} />}
          {order.status === 'cancelled' && (
            <section className="card pad od-terminal">
              <h2>This order was cancelled</h2>
              <p className="muted">
                Nothing was charged. {order.creditAppliedCents > 0 ? 'Your store credit has been restored. ' : ''}Changed your mind? You can place a new order any time.
              </p>
              <Link to="/shop" className="btn btn-primary">
                Back to the store
              </Link>
            </section>
          )}
          {order.status === 'refunded' && (
            <section className="card pad od-terminal">
              <h2>This order was refunded</h2>
              <p className="muted">The payment was sent back to you. If you have questions, open a ticket on Discord with your order ID.</p>
              <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord">
                <Icon name="discord" size={16} /> Discord
              </a>
            </section>
          )}

          {boxItems.length > 0 && PAID_OR_LATER.has(order.status) && <BoxReveal orderId={order.id} items={boxItems} initiallyRevealed={isRevealed(order.id)} />}
          {boxItems.length > 0 && awaiting && (
            <div className="card pad od-locked">
              <span className="od-locked-icon">
                <Icon name="lock" size={18} />
              </span>
              <div>
                <strong>
                  {boxItems.reduce((s, i) => s + i.qty, 0)} mystery {boxItems.reduce((s, i) => s + i.qty, 0) === 1 ? 'box unlocks' : 'boxes unlock'} once your payment is confirmed.
                </strong>
                <p className="muted small">The drops were already rolled when you ordered – you will open them right here.</p>
              </div>
            </div>
          )}

          <ItemsCard order={order} />
        </div>

        <aside className="od-side">
          <section className="card pad od-summary">
            <h3>Summary</h3>
            <div className="summary-rows">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{fmt(order.quote.subtotalCents)}</span>
              </div>
              {order.quote.saleDiscountCents > 0 && (
                <div className="summary-row summary-row-good">
                  <span>Sale −{order.quote.salePercent}%</span>
                  <span>−{fmt(order.quote.saleDiscountCents)}</span>
                </div>
              )}
              {order.quote.tierDiscountCents > 0 && (
                <div className="summary-row summary-row-good">
                  <span>Bulk tier −{order.quote.tierPercent}%</span>
                  <span>−{fmt(order.quote.tierDiscountCents)}</span>
                </div>
              )}
              {order.quote.couponDiscountCents > 0 && (
                <div className="summary-row summary-row-good">
                  <span>Code {order.discountCode ?? order.quote.couponCode}</span>
                  <span>−{fmt(order.quote.couponDiscountCents)}</span>
                </div>
              )}
              {order.quote.referralDiscountCents > 0 && (
                <div className="summary-row summary-row-good">
                  <span>Referral {order.referralCode}</span>
                  <span>−{fmt(order.quote.referralDiscountCents)}</span>
                </div>
              )}
              {order.creditAppliedCents > 0 && (
                <div className="summary-row summary-row-good">
                  <span>Store credit</span>
                  <span>−{fmt(order.creditAppliedCents)}</span>
                </div>
              )}
              {fee > 0 && (
                <div className="summary-row summary-row-warn">
                  <span>{order.payment.methodName} fee</span>
                  <span>+{fmt(fee)}</span>
                </div>
              )}
            </div>
            <div className="summary-total">
              <span>Total</span>
              <div className="summary-total-amount">
                <strong>{order.payment.type === 'free' ? 'Free' : fmt(order.totalCents)}</strong>
                {order.payment.type !== 'free' && <small>{formatUsd(order.totalCents)} USD</small>}
              </div>
            </div>
            <dl className="od-facts">
              <div>
                <dt>Payment</dt>
                <dd>{order.payment.methodName}</dd>
              </div>
              <div>
                <dt>Player</dt>
                <dd className="mono">{order.username}</dd>
              </div>
              {order.emailMasked && (
                <div>
                  <dt>E-mail</dt>
                  <dd>{order.emailMasked}</dd>
                </div>
              )}
              {order.customerNote && (
                <div>
                  <dt>Your note</dt>
                  <dd>{order.customerNote}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="card pad od-help">
            <div className="od-help-icon">
              <Icon name="discord" size={20} />
            </div>
            <h3>Need help?</h3>
            <p className="muted small">
              Problem with your order? Open a ticket in our Discord and include your order ID <span className="mono">{order.id}</span>.
            </p>
            <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord btn-block">
              <Icon name="discord" size={16} /> Open Discord
            </a>
            <Link to="/faq" className="btn btn-ghost btn-block">
              Read the FAQ
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

/* ───────────────────────── payment ───────────────────────── */

function iconForType(type: OrderPayment['type']): string {
  if (type === 'stripe') return 'card';
  if (type === 'paypal') return 'paypal';
  if (type === 'nowpayments') return 'bitcoin';
  return 'generic';
}

function PaymentPanel({ order, onChange }: { order: PublicOrder; onChange: () => Promise<void> }) {
  const { config, fmt, currency } = useStore();
  const { toast } = useToast();
  const p = order.payment;
  const pm = config.paymentMethods.find((m) => m.id === p.methodId);
  const pending = p.status === 'pending_review';
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [refErr, setRefErr] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [busy, setBusy] = useState<'stripe' | 'crypto' | null>(null);
  const refLabel = pm?.referenceLabel || 'Transaction ID';
  const handle = (p as OrderPayment & { handle?: string }).handle;

  const submitRef = async (e: FormEvent) => {
    e.preventDefault();
    const ref = reference.trim();
    if (ref.length < 3) {
      setRefErr(`Please enter your ${refLabel.toLowerCase()}.`);
      return;
    }
    setRefErr(null);
    setSending(true);
    try {
      await apiPost(`/orders/${encodeURIComponent(order.id)}/reference`, { reference: ref.slice(0, 200), note: note.trim().slice(0, 300) || undefined });
      toast("Payment reported – we'll confirm shortly", 'success');
      setEditing(false);
      setReference('');
      setNote('');
      await onChange();
    } catch (err) {
      const ae = err as ApiClientError;
      const msg = ae.status === 404 ? 'Reporting is temporarily unavailable – please send your reference on Discord.' : ae.message;
      setRefErr(msg);
      toast(msg, 'error');
    } finally {
      setSending(false);
    }
  };

  const cancel = async () => {
    setCancelling(true);
    try {
      await apiPost(`/orders/${encodeURIComponent(order.id)}/cancel`, {});
      toast('Order cancelled', 'info');
      setCancelOpen(false);
      await onChange();
    } catch (err) {
      toast((err as Error).message || 'Could not cancel this order.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const startStripe = async () => {
    setBusy('stripe');
    try {
      const { url } = await createStripeSession(order.id);
      redirectToPayment(url);
    } catch (err) {
      toast((err as Error).message || 'Could not start the card checkout.', 'error');
      setBusy(null);
    }
  };
  const startCrypto = async () => {
    setBusy('crypto');
    try {
      const { url } = await createNowPaymentsInvoice(order.id);
      redirectToPayment(url);
    } catch (err) {
      toast((err as Error).message || 'Could not create the crypto invoice.', 'error');
      setBusy(null);
    }
  };

  return (
    <section className="card od-pay">
      <header className="od-pay-head">
        <PaymentIcon icon={pm?.icon ?? iconForType(p.type)} size={56} />
        <div className="od-pay-title">
          <div className="eyebrow">{pending ? 'Payment reported' : 'Payment'}</div>
          <h2>{p.methodName}</h2>
        </div>
        <div className="od-pay-total">
          <span>Amount due</span>
          <strong>{fmt(order.totalCents)}</strong>
          {currency.code !== 'USD' && <small>{formatUsd(order.totalCents)} USD</small>}
        </div>
      </header>

      {pending && (
        <div className="alert alert-success od-pending" role="status">
          <Icon name="clock" size={18} />
          <div>
            <strong>Payment reported – we are checking it now.</strong> Confirmation usually takes a few minutes while we are online; this page updates automatically.
            {p.reference && (
              <>
                {' '}
                Reference: <code className="kbd">{p.reference}</code>
              </>
            )}
            {!editing && (
              <>
                {' '}
                <button type="button" className="link-btn" onClick={() => setEditing(true)}>
                  Sent a different reference?
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {p.type === 'manual' && (
        <>
          <div className="od-kvs">
            <div className="od-kv">
              <span>Order ID – put it in the payment note</span>
              <div className="code-box">
                {order.id}
                <CopyButton text={order.id} iconOnly label="Copy order ID" toastMessage="Order ID copied" className="code-copy" />
              </div>
            </div>
            <div className="od-kv">
              <span>Amount (USD)</span>
              <div className="code-box">
                {formatUsd(order.totalCents)}
                <CopyButton text={(order.totalCents / 100).toFixed(2)} iconOnly label="Copy amount" toastMessage="Amount copied" className="code-copy" />
              </div>
            </div>
            {handle && (
              <div className="od-kv">
                <span>Pay to</span>
                <div className="code-box">
                  {handle}
                  <CopyButton text={handle} iconOnly label="Copy" className="code-copy" />
                </div>
              </div>
            )}
          </div>
          {p.instructions && (
            <div className="od-instr">
              <InstructionText text={p.instructions} />
            </div>
          )}
          {p.payLink && (
            <a href={p.payLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-lg od-paylink">
              Open {p.methodName} <Icon name="external" size={16} />
            </a>
          )}
          {(!pending || editing) && (
            <form className="od-ref" onSubmit={(e) => void submitRef(e)} noValidate>
              <h3>
                <Icon name="check" size={18} /> I have paid
              </h3>
              <p className="muted small">Paste the reference below so we can match your payment quickly.</p>
              <div className="od-ref-grid">
                <div className="field">
                  <label className="label" htmlFor="od-ref">
                    {refLabel} <span className="req">*</span>
                  </label>
                  <input id="od-ref" className={`input ${refErr ? 'error' : ''}`} value={reference} onChange={(e) => setReference(e.target.value)} placeholder={refLabel} autoComplete="off" />
                  {refErr && <span className="err">{refErr}</span>}
                </div>
                <div className="field">
                  <label className="label" htmlFor="od-ref-note">
                    Note <span className="muted">(optional)</span>
                  </label>
                  <input id="od-ref-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. paid from a different name" />
                </div>
              </div>
              <div className="row wrap">
                <button type="submit" className="btn btn-pink btn-lg" disabled={sending}>
                  {sending ? (
                    <>
                      <span className="spinner" /> Sending…
                    </>
                  ) : (
                    <>
                      Report payment <Icon name="arrowRight" size={16} />
                    </>
                  )}
                </button>
                {editing && (
                  <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </>
      )}

      {p.type === 'paypal' && (
        <div className="od-provider">
          <p className="muted small">Pay with your PayPal balance or card – your order is confirmed automatically.</p>
          <PayPalButtons order={order} onPaid={onChange} />
        </div>
      )}
      {p.type === 'stripe' && (
        <div className="od-provider">
          <p className="muted small">Secure card / Apple Pay / Google Pay checkout by Stripe. Your order is confirmed automatically.</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={() => void startStripe()} disabled={busy === 'stripe'}>
            {busy === 'stripe' ? <span className="spinner" /> : <Icon name="card" size={18} />} Pay now
          </button>
        </div>
      )}
      {p.type === 'nowpayments' && (
        <div className="od-provider">
          <p className="muted small">BTC, ETH, LTC, USDT and 100+ coins. Confirmed automatically after the network confirms.</p>
          <div className="row wrap">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => void startCrypto()} disabled={busy === 'crypto'}>
              {busy === 'crypto' ? <span className="spinner" /> : <Icon name="coin" size={18} />} Pay with crypto
            </button>
            {p.providerUrl && (
              <a href={p.providerUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-lg">
                Open invoice <Icon name="external" size={16} />
              </a>
            )}
          </div>
        </div>
      )}

      <footer className="od-pay-foot">
        <span className="muted xs">
          {p.type === 'manual' ? 'Confirmed manually by our team – usually within minutes while we are online.' : 'Confirmed automatically by the payment provider.'}
        </span>
        <button type="button" className="btn btn-ghost btn-sm od-cancel" onClick={() => setCancelOpen(true)}>
          Cancel order
        </button>
      </footer>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel this order?" size="sm">
        <p className="text-2" style={{ marginBottom: 16 }}>
          Only cancel if you have <strong>not</strong> paid yet. {order.creditAppliedCents > 0 ? 'Applied store credit is returned to your balance. ' : ''}You can always place a new order later.
        </p>
        <div className="row wrap">
          <button type="button" className="btn btn-danger" onClick={() => void cancel()} disabled={cancelling}>
            {cancelling ? <span className="spinner" /> : <Icon name="trash" size={15} />} Yes, cancel order
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setCancelOpen(false)}>
            Keep it
          </button>
        </div>
      </Modal>
    </section>
  );
}

/* ───────────────────────── delivery ───────────────────────── */

function DeliveryPanel({ order }: { order: PublicOrder }) {
  const { config, productById } = useStore();
  const d = config.delivery;
  const hasMoney = order.items.some((i) => i.kind === 'money');
  const hasItems = order.items.some((i) => i.kind !== 'money');
  const notes = Array.from(new Set(order.items.map((i) => productById(i.productId)?.deliveryNote).filter((n): n is string => !!n)));
  const delivering = order.status === 'delivering';
  const staff = d.staffUsername?.trim();
  return (
    <section className="card od-deliver">
      <header className="od-deliver-head">
        <span className="od-deliver-icon">
          <Icon name={delivering ? 'truck' : 'check'} size={22} />
        </span>
        <div>
          <div className="eyebrow">{delivering ? 'Delivery in progress' : 'Payment confirmed'}</div>
          <h2>{delivering ? 'We are delivering right now' : 'Get online – delivery is next'}</h2>
        </div>
      </header>
      <div className="mc-chat od-chat" aria-hidden="true">
        <div>
          <span className="c-gray">[Server]</span> Join <span className="c-aqua">{config.serverIp}</span> as <span className="c-gold">{order.username}</span>
        </div>
        {staff && (
          <div>
            <span className="c-gray">[Server]</span> <span className="c-green">{staff}</span> wants to teleport to you · <span className="c-pink">/tpaccept</span>
          </div>
        )}
        {hasMoney && (
          <div>
            <span className="c-green">{staff || config.storeName}</span> <span className="c-gray">→</span> /pay <span className="c-gold">{order.username}</span> …
          </div>
        )}
      </div>
      <ol className="od-dsteps">
        <li>
          <span className="od-dstep-icon">
            <Icon name="server" size={16} />
          </span>
          <div>
            <strong>
              Stay online on {config.serverName} as <b>{order.username}</b>
            </strong>
            <span className="row wrap" style={{ gap: 8 }}>
              <span className="mono">{config.serverIp}</span>
              <CopyButton text={config.serverIp} className="btn btn-ghost btn-sm" label="Copy IP" toastMessage="Server IP copied" />
            </span>
          </div>
        </li>
        {hasMoney && (
          <li>
            <span className="od-dstep-icon">
              <Icon name="coin" size={16} />
            </span>
            <div>
              <strong>Money</strong>
              <span>{d.moneyText}</span>
            </div>
          </li>
        )}
        {hasItems && (
          <li>
            <span className="od-dstep-icon">
              <Icon name="package" size={16} />
            </span>
            <div>
              <strong>Items</strong>
              <span>{d.itemText}</span>
              {staff && (
                <span>
                  Delivery account: <b className="mono">{staff}</b>
                </span>
              )}
            </div>
          </li>
        )}
        {notes.map((n) => (
          <li key={n}>
            <span className="od-dstep-icon">
              <Icon name="info" size={16} />
            </span>
            <div>
              <strong>Note</strong>
              <span>{n}</span>
            </div>
          </li>
        ))}
        <li>
          <span className="od-dstep-icon">
            <Icon name="clock" size={16} />
          </span>
          <div>
            <strong>ETA</strong>
            <span>{d.etaText}</span>
          </div>
        </li>
      </ol>
      <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord">
        <Icon name="discord" size={16} /> Ping us on Discord when you are online
      </a>
    </section>
  );
}

function DeliveredPanel({ order }: { order: PublicOrder }) {
  const { config } = useStore();
  const deliveredAt = [...order.timeline].reverse().find((t) => t.status === 'delivered')?.at ?? order.updatedAt;
  return (
    <section className="card od-done">
      <div className="od-done-glow" aria-hidden="true" />
      <span className="od-done-icon">
        <Icon name="sparkles" size={26} />
      </span>
      <h2>Delivered – enjoy!</h2>
      <p className="text-2">
        Everything was handed over to <b>{order.username}</b> on {formatDate(deliveredAt)}. Thanks for shopping with {config.storeName}.
      </p>
      <div className="od-done-actions">
        {order.reviewed ? (
          <span className="badge badge-green">
            <Icon name="star" size={12} /> Thanks for your review
          </span>
        ) : (
          <Link to={`/reviews?order=${encodeURIComponent(order.id)}`} className="btn btn-pink btn-lg">
            <Icon name="star" size={18} /> Leave a review{config.reviewRewardPercent > 0 ? ` & get ${config.reviewRewardPercent}% off` : ''}
          </Link>
        )}
        <Link to="/shop" className="btn btn-secondary btn-lg">
          Shop again
        </Link>
      </div>
    </section>
  );
}

/* ───────────────────────── items ───────────────────────── */

function ItemsCard({ order }: { order: PublicOrder }) {
  const { fmt } = useStore();
  return (
    <section className="card od-items">
      <header className="od-items-head">
        <h3>Items</h3>
        <span className="muted small">
          {order.items.length} {order.items.length === 1 ? 'line' : 'lines'}
        </span>
      </header>
      <ul>
        {order.items.map((it, i) => (
          <ItemRow key={`${it.productId}-${i}`} item={it} fmt={fmt} status={order.status} />
        ))}
      </ul>
    </section>
  );
}

function ItemRow({ item, fmt, status }: { item: OrderItem; fmt: (c: number) => string; status: PublicOrder['status'] }) {
  const money = item.kind === 'money' && item.moneyMillions === 1 && item.qty > 1;
  const contents = item.contents ?? [];
  const boxes = item.kind === 'box' ? item.rolled?.length ?? item.qty : 0;
  return (
    <li className="od-item">
      <Thumb src={item.image} size={52} />
      <div className="od-item-info">
        <span className="od-item-name">{itemTitle(item)}</span>
        <span className="od-item-meta">
          {money ? `${fmt(item.unitPriceCents)} per 1M · paid with /pay` : `${itemQtyLabel(item)} ${fmt(item.unitPriceCents)}`}
          {item.kind === 'box' && boxes > 0 && (
            <>
              {' '}
              · {boxes} {boxes === 1 ? 'box' : 'boxes'} {PAID_OR_LATER.has(status) ? '– drops above' : '– unlocks after payment'}
            </>
          )}
        </span>
        {contents.length > 0 && (
          <details className="od-contents">
            <summary>
              <Icon name="list" size={13} /> What&apos;s included ({contents.length})
            </summary>
            <ul>
              {contents.map((c, i) => (
                <li key={i} className={c.rarity ? `rarity-${c.rarity}` : ''}>
                  <b>{c.qty}×</b> {c.name}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
      <span className="od-item-total">{fmt(item.lineTotalCents)}</span>
    </li>
  );
}
