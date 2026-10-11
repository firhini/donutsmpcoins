import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { PublicOrder, Review, PublicReview, ReviewStats } from '../shared/types';
import { apiGet, apiPost, ApiClientError } from '../lib/api';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Seo } from '../components/ui/Seo';
import { Icon } from '../components/ui/Icons';
import { StarRating } from '../components/free/StarRating';
import { Confetti } from '../components/free/Confetti';
import { avatarUrl } from '../components/free/username';
import '../styles/free.css';

const PAGE = 8;
const FETCH = 50;
const MIN_LEN = 10;
const MAX_LEN = 500;

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diff = Math.max(0, Date.now() - t);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function Avatar({ name, size = 44, className = 'rev-avatar' }: { name: string; size?: number; className?: string }) {
  const [ok, setOk] = useState(true);
  if (!ok)
    return (
      <span className={`${className}-fallback`} aria-hidden="true">
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  return <img className={className} src={avatarUrl(name, 64)} alt="" width={size} height={size} loading="lazy" onError={() => setOk(false)} />;
}

function ReviewCard({ r }: { r: PublicReview }) {
  return (
    <article className="card rev-card">
      <div className="rev-head">
        <Avatar name={r.username} />
        <div className="rev-who">
          <span className="rev-name">{r.username}</span>
          <StarRating value={r.rating} size={14} />
        </div>
        <time className="rev-date" dateTime={r.createdAt}>
          {timeAgo(r.createdAt)}
        </time>
      </div>
      <p className="rev-text">{r.comment}</p>
      {r.productNames && r.productNames.length > 0 && (
        <div className="rev-chips">
          {r.productNames.slice(0, 4).map((n) => (
            <span key={n} className="badge">
              {n}
            </span>
          ))}
          {r.productNames.length > 4 && <span className="badge">+{r.productNames.length - 4}</span>}
        </div>
      )}
    </article>
  );
}

type OrderCheck = { state: 'idle' } | { state: 'loading' } | { state: 'ok'; order: PublicOrder } | { state: 'not_found' } | { state: 'not_delivered'; order: PublicOrder } | { state: 'reviewed'; order: PublicOrder } | { state: 'error'; message: string };

export default function Page() {
  const { config, stats: siteStats } = useStore();
  const { toast } = useToast();
  const [params] = useSearchParams();

  const [reviews, setReviews] = useState<PublicReview[] | null>(null);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [limit, setLimit] = useState(FETCH);
  const [shown, setShown] = useState(PAGE);
  const [exhausted, setExhausted] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [orderId, setOrderId] = useState(() => (params.get('order') || '').trim());
  const formFirst = !!params.get('order');
  const [check, setCheck] = useState<OrderCheck>({ state: 'idle' });
  const [rating, setRating] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const load = useCallback(async (lim: number) => {
    const r = await apiGet<{ reviews: PublicReview[]; stats: ReviewStats }>(`/reviews?limit=${lim}`);
    const list = Array.isArray(r.reviews) ? r.reviews : [];
    setReviews(list);
    setStats(r.stats ?? null);
    if (list.length < lim) setExhausted(true);
  }, []);

  useEffect(() => {
    load(FETCH).catch(() => {
      setReviews([]);
      setExhausted(true);
    });
  }, [load]);

  const showMore = async () => {
    const next = shown + PAGE;
    if (reviews && next >= reviews.length && !exhausted) {
      setLoadingMore(true);
      const lim = limit + FETCH;
      setLimit(lim);
      try {
        await load(lim);
      } catch {
        setExhausted(true);
      } finally {
        setLoadingMore(false);
      }
    }
    setShown(next);
  };

  const lookup = useCallback(async (id: string) => {
    const clean = id.trim();
    if (!clean) {
      setCheck({ state: 'idle' });
      return;
    }
    setCheck({ state: 'loading' });
    try {
      const r = await apiGet<{ order: PublicOrder }>(`/orders/${encodeURIComponent(clean)}`);
      const o = r.order;
      if (o.reviewed) setCheck({ state: 'reviewed', order: o });
      else if (o.status !== 'delivered') setCheck({ state: 'not_delivered', order: o });
      else setCheck({ state: 'ok', order: o });
    } catch (err) {
      const e = err as ApiClientError;
      if (e instanceof ApiClientError && e.status === 404) setCheck({ state: 'not_found' });
      else setCheck({ state: 'error', message: e instanceof ApiClientError ? e.message : 'Could not check this order right now.' });
    }
  }, []);

  // prefilled order id from ?order=
  useEffect(() => {
    if (orderId) void lookup(orderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (check.state !== 'ok') return;
    const text = comment.trim();
    if (!rating) {
      setSubmitErr('Pick a star rating first.');
      return;
    }
    if (text.length < MIN_LEN) {
      setSubmitErr(`Tell us a bit more – at least ${MIN_LEN} characters.`);
      return;
    }
    if (text.length > MAX_LEN) {
      setSubmitErr(`Please keep it under ${MAX_LEN} characters.`);
      return;
    }
    setSubmitErr(null);
    setSubmitting(true);
    try {
      await apiPost<{ review: PublicReview }>('/reviews', { orderId: check.order.id, rating, comment: text });
      setDone(true);
      setConfetti(true);
      window.setTimeout(() => setConfetti(false), 300);
      toast('Review submitted – thank you!', 'gold');
    } catch (err) {
      const ex = err as ApiClientError;
      if (ex instanceof ApiClientError && /already/i.test(ex.message)) setCheck({ state: 'reviewed', order: check.order });
      else setSubmitErr(ex instanceof ApiClientError ? ex.message : 'Could not submit your review – please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const distribution = useMemo(() => {
    const d = [0, 0, 0, 0, 0];
    for (const r of reviews ?? []) d[Math.min(5, Math.max(1, r.rating)) - 1]++;
    return d;
  }, [reviews]);

  const count = stats?.count ?? siteStats?.reviewCount ?? reviews?.length ?? 0;
  const avg = stats?.averageRating ?? siteStats?.averageRating ?? 0;
  const visible = (reviews ?? []).slice(0, shown);
  const hasMore = !!reviews && (shown < reviews.length || !exhausted);
  const chars = comment.trim().length;

  return (
    <div className="container page">
      <Seo title={`Customer reviews | ${config.storeName}`} description={`Real reviews from ${config.serverName} players who bought money, spawners and mystery boxes at ${config.storeName}. Leave yours and get ${config.reviewRewardPercent}% off.`} />
      <Confetti active={confetti} count={100} />

      <header className="page-head rev-head-row">
        <div>
          <span className="eyebrow">
            <Icon name="star" size={14} /> Reviews
          </span>
          <h1 style={{ margin: '8px 0 6px' }}>What players say</h1>
          <p className="lead">Every review comes from a delivered order – we verify the order ID before it is published.</p>
        </div>
        <a href="#write" className="btn btn-outline only-mobile">
          <Icon name="star" size={16} /> Write a review
        </a>
      </header>

      <div className={`rev-layout ${formFirst ? 'form-first' : ''}`}>
        <div className="stack" style={{ gap: 16 }}>
          {/* stats */}
          <div className="card rev-stats">
            <div className="rev-avg">
              <span className={`rev-avg-num ${count > 0 ? '' : 'is-empty'}`}>{count > 0 ? avg.toFixed(1) : '0.0'}</span>
              <StarRating value={count > 0 ? avg : 0} size={20} />
              <span className="rev-avg-count">{count > 0 ? `${count} verified review${count === 1 ? '' : 's'}` : 'No reviews yet'}</span>
            </div>
            <div className="rev-bars" aria-label="Rating distribution">
              {[5, 4, 3, 2, 1].map((n) => {
                const c = distribution[n - 1];
                const total = (reviews ?? []).length || 1;
                const pct = Math.round((c / total) * 100);
                return (
                  <div key={n} className="rev-bar">
                    <span>{n} ★</span>
                    <span className="rev-bar-track">
                      <span className="rev-bar-fill" style={{ width: `${pct}%` }} />
                    </span>
                    <span style={{ textAlign: 'right' }}>{c}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* list */}
          {reviews === null ? (
            <div className="rev-list" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="card rev-skel">
                  <div className="row">
                    <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
                    <div className="skeleton" style={{ width: 140, height: 16 }} />
                  </div>
                  <div className="skeleton" style={{ height: 54 }} />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="card ga-empty">
              <span className="ga-empty-icon">
                <Icon name="star" size={30} />
              </span>
              <h3>No reviews published yet</h3>
              <p className="text-2" style={{ maxWidth: 420 }}>
                Be the first! Order something, wait for delivery and come back – your review earns a {config.reviewRewardPercent}% code.
              </p>
              <Link to="/shop" className="btn btn-primary btn-sm">
                <Icon name="cart" size={14} /> Shop now
              </Link>
            </div>
          ) : (
            <>
              <div className="rev-list">
                {visible.map((r) => (
                  <ReviewCard key={r.id} r={r} />
                ))}
              </div>
              {hasMore && (
                <div className="rev-more">
                  <button type="button" className="btn btn-secondary" onClick={showMore} disabled={loadingMore}>
                    {loadingMore ? (
                      <>
                        <span className="spinner" /> Loading…
                      </>
                    ) : (
                      <>
                        Load more reviews <Icon name="chevron" size={16} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* write a review */}
        <aside className="rev-side">
          <div className="card pad rev-form" id="write">
            <div>
              <h3>Write a review</h3>
              <p className="small text-2" style={{ marginTop: 4 }}>
                Reviews are open for delivered orders. Find your order ID on the order page or in the confirmation.
              </p>
            </div>
            {config.reviewRewardPercent > 0 && (
              <div className="rev-reward">
                <Icon name="ticket" size={20} />
                <span>
                  Approved reviews earn a <strong>{config.reviewRewardPercent}% off</strong> code for your next order.
                </span>
              </div>
            )}

            {done && check.state === 'ok' ? (
              <div className="redeem-success" role="status">
                <span className="redeem-success-icon">
                  <Icon name="check" size={32} />
                </span>
                <h3>Thanks, {check.order.username}!</h3>
                <p className="text-2 small">
                  Your review is in and will show up once approved.{config.reviewRewardPercent > 0 ? ` You will then get a ${config.reviewRewardPercent}% code – check your order page.` : ''}
                </p>
                <Link to={`/order/${check.order.id}`} className="btn btn-secondary btn-sm">
                  <Icon name="external" size={14} /> Open order page
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="rev-form" style={{ gap: 14 }}>
                <div className="rev-order-row">
                  <div className="field">
                    <label className="label" htmlFor="rev-order">
                      Order ID
                    </label>
                    <input
                      id="rev-order"
                      className={`input mono ${check.state === 'not_found' ? 'error' : check.state === 'ok' ? 'success' : ''}`}
                      value={orderId}
                      onChange={(e) => {
                        setOrderId(e.target.value);
                        if (check.state !== 'idle') setCheck({ state: 'idle' });
                      }}
                      onBlur={() => orderId.trim() && check.state === 'idle' && lookup(orderId)}
                      placeholder="e.g. DC-7K3F9Q"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={() => lookup(orderId)} disabled={!orderId.trim() || check.state === 'loading'} style={{ height: 46 }}>
                    {check.state === 'loading' ? <span className="spinner" /> : 'Check'}
                  </button>
                </div>

                {check.state === 'not_found' && (
                  <div className="alert alert-danger" role="alert">
                    <Icon name="warning" size={18} />
                    <span>
                      We could not find an order with this ID. Look it up on the <Link to="/track" className="gold-text">track page</Link>.
                    </span>
                  </div>
                )}
                {check.state === 'error' && (
                  <div className="alert alert-danger" role="alert">
                    <Icon name="warning" size={18} />
                    <span>{check.message}</span>
                  </div>
                )}
                {check.state === 'not_delivered' && (
                  <div className="alert alert-info" role="status">
                    <Icon name="clock" size={18} />
                    <span>
                      Order {check.order.id} is <strong>{check.order.status.replace('_', ' ')}</strong>. You can review it once it has been delivered.
                    </span>
                  </div>
                )}
                {check.state === 'reviewed' && (
                  <div className="alert alert-success" role="status">
                    <Icon name="check" size={18} />
                    <span>This order already has a review – thank you! Each order can be reviewed once.</span>
                  </div>
                )}
                {check.state === 'ok' && (
                  <div className="rev-order-card fade-up">
                    <Avatar name={check.order.username} size={36} className="rev-avatar" />
                    <div style={{ minWidth: 0 }}>
                      <div>
                        <strong>{check.order.username}</strong> <span className="badge badge-green">Delivered</span>
                      </div>
                      <div className="rev-order-items">{check.order.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</div>
                    </div>
                  </div>
                )}

                <div className="field">
                  <span className="label">Your rating</span>
                  <StarRating value={rating} onChange={(v) => setRating(v)} size={30} disabled={check.state !== 'ok'} />
                </div>

                <div className="field">
                  <label className="label" htmlFor="rev-comment">
                    Your review
                  </label>
                  <textarea
                    id="rev-comment"
                    className="textarea"
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, MAX_LEN + 50))}
                    placeholder="How fast was delivery? Did you get what you expected? What did you buy?"
                    maxLength={MAX_LEN + 50}
                    disabled={check.state !== 'ok'}
                    aria-describedby="rev-counter"
                  />
                  <div className="rev-counter" id="rev-counter">
                    <span>{chars < MIN_LEN ? `At least ${MIN_LEN} characters` : 'Looks good'}</span>
                    <span className={chars > MAX_LEN ? 'over' : ''}>
                      {chars}/{MAX_LEN}
                    </span>
                  </div>
                </div>

                {submitErr && (
                  <div className="alert alert-danger" role="alert">
                    <Icon name="warning" size={18} />
                    <span>{submitErr}</span>
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg" disabled={check.state !== 'ok' || submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner" /> Sending…
                    </>
                  ) : (
                    <>
                      <Icon name="star" size={18} /> Submit review
                    </>
                  )}
                </button>
                <p className="xs muted">Reviews are checked before they go live. Rude or fake reviews are rejected – honest ones, good or bad, are welcome.</p>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
