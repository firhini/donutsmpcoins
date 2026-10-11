import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CreateOrderRequest, PublicOrder, QuoteRequest } from '../shared/types';
import { apiGet, apiPost, ApiClientError } from '../lib/api';
import { getDeviceId, storageGet, storageSet } from '../lib/device';
import { avatarUrl } from '../lib/mc';
import { createNowPaymentsInvoice, createStripeSession, redirectToPayment } from '../lib/payments';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Seo } from '../components/ui/Seo';
import { Icon } from '../components/ui/Icons';
import { OrderSummary } from '../components/cart/OrderSummary';
import { PromoCodes } from '../components/cart/PromoCodes';
import { PaymentMethodPicker } from '../components/cart/PaymentMethodPicker';
import { useServerQuote } from '../components/cart/useServerQuote';
import { useUsernameCheck } from '../components/cart/useUsernameCheck';
import { EMAIL_KEY, feeFor, PAY_METHOD_KEY, rememberOrder, USERNAME_KEY } from '../components/cart/cartUtils';
import '../styles/cart.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Page() {
  const { lines, quote: localQuote, discountCode, referralCode, clear, setDiscountCode } = useCart();
  const { config, currency, fmt, loading: storeLoading } = useStore();
  const { toast } = useToast();
  const nav = useNavigate();

  const [username, setUsername] = useState(() => storageGet<string>(USERNAME_KEY, ''));
  const uname = useUsernameCheck(username);
  const [email, setEmail] = useState(() => storageGet<string>(EMAIL_KEY, ''));
  const [credit, setCredit] = useState<number | null>(null);
  const [applyCredit, setApplyCredit] = useState(false);
  const [methodId, setMethodId] = useState(() => storageGet<string>(PAY_METHOD_KEY, ''));
  const [note, setNote] = useState('');
  const [tos, setTos] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placedId, setPlacedId] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => storageSet(USERNAME_KEY, username), [username]);
  useEffect(() => storageSet(EMAIL_KEY, email), [email]);
  useEffect(() => {
    if (methodId) storageSet(PAY_METHOD_KEY, methodId);
  }, [methodId]);

  const methods = useMemo(() => [...config.paymentMethods].sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99)), [config.paymentMethods]);
  useEffect(() => {
    if (!methods.length) return;
    if (!methods.some((m) => m.id === methodId)) setMethodId(methods[0].id);
  }, [methods, methodId]);
  const method = methods.find((m) => m.id === methodId);

  // the name we send to the server once syntax is fine (canonical when verified)
  const usernameOk = uname.status === 'valid' || uname.status === 'unverified';
  const checkedName = uname.status === 'valid' || uname.status === 'unverified' || uname.status === 'notfound' ? uname.name ?? username.trim() : '';

  // store credit for this player
  useEffect(() => {
    if (!usernameOk || !checkedName) {
      setCredit(null);
      setApplyCredit(false);
      return;
    }
    let cancelled = false;
    apiGet<{ balanceCents: number }>(`/credit?username=${encodeURIComponent(checkedName)}`)
      .then((r) => {
        if (!cancelled) setCredit(Math.max(0, r.balanceCents || 0));
      })
      .catch(() => {
        if (!cancelled) setCredit(0);
      });
    return () => {
      cancelled = true;
    };
  }, [usernameOk, checkedName]);

  const items = useMemo(() => lines.map((l) => ({ productId: l.productId, qty: l.qty })), [lines]);
  const useCredit = applyCredit && (credit ?? 0) > 0;
  const req = useMemo<QuoteRequest | null>(
    () =>
      items.length
        ? {
            items,
            discountCode: discountCode || undefined,
            referralCode: referralCode || undefined,
            username: checkedName || undefined,
            applyCredit: useCredit || undefined,
          }
        : null,
    [items, discountCode, referralCode, checkedName, useCredit],
  );
  const sq = useServerQuote(req, localQuote);
  const quote = sq.quote;
  const isFree = quote.lines.length > 0 && quote.totalCents === 0;
  const fee = isFree ? 0 : feeFor(quote.totalCents, method?.feePercent);
  const total = quote.totalCents + fee;

  const emailOk = !email.trim() || EMAIL_RE.test(email.trim());
  const methodTooSmall = !!method?.minCents && quote.totalCents < method.minCents;
  const methodOk = isFree || (!!method && !methodTooSmall);
  const maintenance = !!config.maintenance?.enabled;

  const blocker = !lines.length
    ? 'Your cart is empty.'
    : maintenance
      ? 'The store is in maintenance mode – please try again shortly.'
      : uname.status === 'idle' || uname.status === 'invalid'
        ? 'Enter your Minecraft username.'
        : uname.status === 'checking'
          ? 'Checking your username…'
          : uname.status === 'notfound'
            ? 'That Minecraft account was not found – check the spelling.'
            : !emailOk
              ? 'Enter a valid e-mail or leave it empty.'
              : !methodOk
                ? methodTooSmall
                  ? `${method?.name} needs a minimum of ${fmt(method?.minCents ?? 0)} – pick another method or add items.`
                  : 'Choose a payment method.'
                : !tos
                  ? 'Accept the terms to continue.'
                  : null;
  const canPlace = !blocker && !placing;

  const place = async (e?: FormEvent) => {
    e?.preventDefault();
    setTouched(true);
    if (!canPlace) {
      setFormErr(blocker);
      return;
    }
    setPlacing(true);
    setFormErr(null);
    try {
      const body: CreateOrderRequest = {
        username: checkedName,
        email: email.trim() || undefined,
        items,
        discountCode: discountCode || undefined,
        referralCode: referralCode || undefined,
        applyCredit: useCredit,
        paymentMethodId: method?.id ?? 'free',
        displayCurrency: currency.code,
        tosAccepted: true,
        customerNote: note.trim().slice(0, 200) || undefined,
        deviceId: getDeviceId(),
      };
      const { order } = await apiPost<{ order: PublicOrder }>('/orders', body);
      rememberOrder({ id: order.id, createdAt: order.createdAt, totalCents: order.totalCents, username: order.username });
      setPlacedId(order.id);
      clear();
      setDiscountCode('');
      toast(`Order ${order.id} placed`, 'success');

      if (order.status === 'awaiting_payment' && order.payment.type === 'stripe') {
        try {
          const { url } = await createStripeSession(order.id);
          redirectToPayment(url);
          return;
        } catch (err) {
          toast(`Could not start the card checkout (${(err as Error).message}). You can retry from your order page.`, 'error');
        }
      } else if (order.status === 'awaiting_payment' && order.payment.type === 'nowpayments') {
        try {
          const { url } = await createNowPaymentsInvoice(order.id);
          redirectToPayment(url);
          return;
        } catch (err) {
          toast(`Could not create the crypto invoice (${(err as Error).message}). You can retry from your order page.`, 'error');
        }
      }
      nav(`/order/${order.id}`, { replace: true, state: { placed: true } });
    } catch (err) {
      const ae = err as ApiClientError;
      let msg = ae.message || 'Something went wrong – please try again.';
      if (ae.status === 404) msg = 'Ordering is temporarily unavailable. Please try again in a minute or ping us on Discord.';
      if (ae.status === 429) msg = 'Too many orders from your connection – please wait a few minutes and try again.';
      if (ae.status === 503) msg = ae.message || 'The store is in maintenance – back in a moment.';
      if (ae.status === 409) {
        // credit / coupon / stock changed since the quote was made – reload live prices
        sq.refresh();
        msg = `${ae.message} Your totals were refreshed – please check and try again.`;
      }
      setFormErr(msg);
      toast(msg, 'error');
      setPlacing(false);
    }
  };

  const title = `Checkout · ${config.storeName}`;

  if (placedId) {
    return (
      <div className="container page co-page">
        <Seo title={title} />
        <div className="co-redirect card pad">
          <span className="spinner" style={{ width: 28, height: 28 }} />
          <h2>Order {placedId} placed</h2>
          <p className="muted">Taking you to your order…</p>
          <Link to={`/order/${placedId}`} className="btn btn-secondary btn-sm">
            Open order page
          </Link>
        </div>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="container page co-page">
        <Seo title={title} description="Secure checkout for DonutSMP money, spawners and mystery boxes." />
        <div className="cart-empty card">
          <div className="cart-empty-icon">
            <Icon name="cart" size={30} />
          </div>
          <h1>Nothing to check out yet</h1>
          <p className="muted">Add something to your cart first – it only takes a second.</p>
          <Link to="/shop" className="btn btn-primary btn-lg">
            Browse the store <Icon name="arrowRight" size={18} />
          </Link>
        </div>
      </div>
    );
  }

  const avatarName = uname.status === 'valid' ? uname.name ?? '' : '';
  const userState = uname.status;

  return (
    <div className="container page co-page">
      <Seo title={title} description="Secure checkout – enter your Minecraft username, pick a payment method and get your items delivered in-game." />
      <div className="page-head co-head">
        <div>
          <div className="eyebrow">Step 2 of 2</div>
          <h1>Checkout</h1>
        </div>
        <ol className="co-crumbs" aria-label="Progress">
          <li className="done">
            <Link to="/cart">Cart</Link>
          </li>
          <li className="current">Checkout</li>
          <li>Payment</li>
          <li>Delivery</li>
        </ol>
      </div>

      {maintenance && (
        <div className="alert alert-warn" role="status" style={{ marginBottom: 20 }}>
          <Icon name="warning" size={18} /> {config.maintenance.message}
        </div>
      )}

      <form className="co-layout" onSubmit={(e) => void place(e)} noValidate>
        <div className="co-form">
          <button type="button" className={`co-sum-toggle ${summaryOpen ? 'is-open' : ''}`} onClick={() => setSummaryOpen((o) => !o)} aria-expanded={summaryOpen}>
            <span className="row" style={{ gap: 8 }}>
              <Icon name="cart" size={16} /> {lines.length} {lines.length === 1 ? 'item' : 'items'}
            </span>
            <strong>{fmt(total)}</strong>
            <Icon name="chevron" size={16} className="co-sum-chev" />
          </button>
          {summaryOpen && (
            <div className="co-sum-mobile">
              <OrderSummary quote={quote} live={sq.live} loading={sq.loading} feePercent={isFree ? undefined : method?.feePercent} feeName={method?.name} showEta={false} warnings={sq.live ? quote.warnings : undefined} />
            </div>
          )}

          {/* 1 – player */}
          <section className="card co-step">
            <header className="co-step-head">
              <span className="co-step-num">1</span>
              <div>
                <h2>Who receives the items?</h2>
                <p>Delivered in-game on {config.serverName} – no account, no password, just your username.</p>
              </div>
            </header>
            <div className="co-step-body">
              <div className="field">
                <label className="label" htmlFor="co-user">
                  Minecraft username <span className="req">*</span>
                </label>
                <div className={`co-user is-${userState}`}>
                  <span className="co-user-avatar" aria-hidden="true">
                    {avatarName ? <img src={avatarUrl(avatarName, 64)} alt="" width={36} height={36} /> : <Icon name="user" size={18} />}
                  </span>
                  <input
                    id="co-user"
                    className="input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').slice(0, 16))}
                    placeholder="Your in-game name"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={16}
                    aria-invalid={userState === 'invalid' || userState === 'notfound'}
                    aria-describedby="co-user-msg"
                  />
                  <span className="co-user-state" aria-hidden="true">
                    {userState === 'checking' && <span className="spinner" />}
                    {userState === 'valid' && <Icon name="check" size={18} strokeWidth={3} />}
                    {userState === 'notfound' && <Icon name="close" size={18} strokeWidth={3} />}
                    {userState === 'unverified' && <Icon name="info" size={18} />}
                  </span>
                </div>
                <p id="co-user-msg" className={`co-user-msg is-${userState}`} aria-live="polite">
                  {userState === 'idle' && 'Java Edition name, 3–16 characters. Double-check it – deliveries go to exactly this account.'}
                  {userState === 'valid' && (
                    <>
                      <strong>{uname.name}</strong> found – looking good.
                    </>
                  )}
                  {userState !== 'idle' && userState !== 'valid' && uname.message}
                </p>
              </div>
              <div className="field">
                <label className="label" htmlFor="co-email">
                  E-mail <span className="muted">(optional – for order updates)</span>
                </label>
                <input id="co-email" type="email" className={`input ${!emailOk ? 'error' : ''}`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" inputMode="email" />
                {!emailOk && <span className="err">Please enter a valid e-mail or leave it empty.</span>}
              </div>
            </div>
          </section>

          {/* 2 – discounts */}
          <section className="card co-step">
            <header className="co-step-head">
              <span className="co-step-num">2</span>
              <div>
                <h2>Discounts &amp; store credit</h2>
                <p>Spin wins, review rewards, referral codes – everything stacks with bulk pricing.</p>
              </div>
            </header>
            <div className="co-step-body">
              <PromoCodes subtotalCents={quote.subtotalCents} username={checkedName || undefined} quote={quote} live={sq.live} onApplied={sq.refresh} />
              {credit !== null && credit > 0 && (
                <label className={`co-credit ${applyCredit ? 'is-on' : ''}`}>
                  <input type="checkbox" checked={applyCredit} onChange={(e) => setApplyCredit(e.target.checked)} />
                  <span className="co-credit-body">
                    <strong>
                      <Icon name="coin" size={15} /> Apply {fmt(credit)} store credit
                    </strong>
                    <small>
                      Earned from referrals, spins and reviews.
                      {applyCredit && sq.live && quote.creditAppliedCents > 0 ? ` ${fmt(quote.creditAppliedCents)} applied to this order.` : ''}
                    </small>
                  </span>
                  <span className="co-switch" aria-hidden="true" />
                </label>
              )}
              {sq.unavailable && (discountCode || referralCode || applyCredit) && (
                <p className="co-hint">
                  <Icon name="info" size={14} /> Live verification is unavailable right now – codes and credit are checked when you place the order.
                </p>
              )}
            </div>
          </section>

          {/* 3 – payment */}
          <section className="card co-step">
            <header className="co-step-head">
              <span className="co-step-num">3</span>
              <div>
                <h2>Payment method</h2>
                <p>Prices are in USD. {currency.code !== 'USD' ? `Shown in ${currency.code} for reference.` : ''}</p>
              </div>
            </header>
            <div className="co-step-body">
              {isFree ? (
                <div className="alert alert-success">
                  <Icon name="check" size={18} />
                  <div>
                    <strong>Nothing to pay.</strong> Your discounts and store credit cover the whole order – it goes straight to delivery.
                  </div>
                </div>
              ) : storeLoading && !methods.length ? (
                <div className="pm-grid" aria-busy="true">
                  <div className="skeleton" style={{ height: 84 }} />
                  <div className="skeleton" style={{ height: 84 }} />
                </div>
              ) : (
                <PaymentMethodPicker methods={methods} value={methodId} onChange={setMethodId} totalCents={quote.totalCents} />
              )}
              {!isFree && method?.type === 'manual' && (
                <p className="co-hint">
                  <Icon name="info" size={14} /> You get the payment details right after placing the order. Paste your transaction ID and we confirm manually – usually within minutes.
                </p>
              )}
              {!isFree && method && method.type !== 'manual' && (
                <p className="co-hint">
                  <Icon name="bolt" size={14} /> {method.name} confirms automatically – delivery starts as soon as the payment lands.
                </p>
              )}
            </div>
          </section>

          {/* 4 – finish */}
          <section className="card co-step">
            <header className="co-step-head">
              <span className="co-step-num">4</span>
              <div>
                <h2>Finish</h2>
                <p>One more look and you are done.</p>
              </div>
            </header>
            <div className="co-step-body">
              <div className="field">
                <label className="label" htmlFor="co-note">
                  Order note <span className="muted">(optional)</span>
                </label>
                <textarea id="co-note" className="textarea" rows={3} maxLength={200} value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} placeholder="Anything we should know? e.g. “I'm online after 6pm CET”" />
                <span className="hint co-counter">{note.length}/200</span>
              </div>
              <label className={`checkbox co-tos ${touched && !tos ? 'is-missing' : ''}`}>
                <input type="checkbox" checked={tos} onChange={(e) => setTos(e.target.checked)} />
                <span>
                  I accept the <Link to="/terms">Terms of Service</Link> and the <Link to="/refund-policy">Refund Policy</Link>. I understand these are virtual goods delivered in-game on {config.serverName}.
                </span>
              </label>
              {formErr && (
                <div className="alert alert-danger" role="alert">
                  <Icon name="warning" size={18} /> {formErr}
                </div>
              )}
              <button type="submit" className="btn btn-primary btn-lg btn-block co-place" disabled={!canPlace}>
                {placing ? (
                  <>
                    <span className="spinner" /> Placing order…
                  </>
                ) : (
                  <>
                    <Icon name="lock" size={16} /> {isFree ? 'Place free order' : `Place order · ${fmt(total)}`}
                  </>
                )}
              </button>
              {blocker && !placing && <p className="co-missing">{blocker}</p>}
              <p className="co-secure">
                <Icon name="shield" size={13} /> No account needed · your details are only used to deliver this order.
              </p>
            </div>
          </section>
        </div>

        <div className="co-side">
          <OrderSummary quote={quote} live={sq.live} loading={sq.loading} feePercent={isFree ? undefined : method?.feePercent} feeName={method?.name} sticky warnings={sq.live ? quote.warnings : undefined} />
        </div>
      </form>

      <div className="co-bar">
        <div className="co-bar-total">
          <span>Total</span>
          <strong>{fmt(total)}</strong>
        </div>
        <button type="button" className="btn btn-primary btn-lg" disabled={!canPlace} onClick={() => void place()}>
          {placing ? <span className="spinner" /> : 'Place order'}
        </button>
      </div>
    </div>
  );
}
