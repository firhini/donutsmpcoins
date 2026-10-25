import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Review, PublicReview, ReviewStats } from '../../shared/types';
import { apiGet } from '../../lib/api';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../ui/Icons';
import '../../styles/home.css';

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={size} className={n <= rating ? 'star on' : 'star'} fill={n <= rating ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

function Avatar({ username }: { username: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return (
      <span className="review-avatar review-avatar-fallback" aria-hidden="true">
        {username.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return <img className="review-avatar" src={`https://mc-heads.net/avatar/${encodeURIComponent(username)}/48`} alt="" width={48} height={48} loading="lazy" onError={() => setOk(false)} />;
}

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  if (!Number.isFinite(d)) return '';
  const diff = Math.max(0, Date.now() - d);
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** Horizontal, snap-scrolling carousel of approved reviews from /api/reviews. */
export function ReviewsCarousel({ limit = 12 }: { limit?: number }) {
  const { config, stats: siteStats } = useStore();
  const [reviews, setReviews] = useState<PublicReview[] | null>(null);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    apiGet<{ reviews: PublicReview[]; stats: ReviewStats }>(`/reviews?limit=${limit}`)
      .then((r) => {
        if (!alive) return;
        setReviews(Array.isArray(r?.reviews) ? r.reviews : []);
        setStats(r?.stats ?? null);
      })
      .catch(() => alive && setReviews([]));
    return () => {
      alive = false;
    };
  }, [limit]);

  const scrollBy = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(260, el.clientWidth * 0.8), behavior: 'smooth' });
  };

  if (reviews === null) {
    return (
      <div className="reviews-track" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="review-card card">
            <div className="skeleton" style={{ height: 48, width: 48, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 14, width: '50%' }} />
            <div className="skeleton" style={{ height: 60, width: '100%' }} />
          </div>
        ))}
      </div>
    );
  }

  const total = siteStats?.totalReviewCount ?? 0;
  if (reviews.length === 0 && total > 0) {
    return (
      <div className="review-empty card">
        <div className="review-empty-icon">
          <Icon name="star" size={26} />
        </div>
        <h3>
          {(siteStats?.totalAverageRating ?? 0).toFixed(1)} ★ from {total} reviews
        </h3>
        <Stars rating={Math.round(siteStats?.totalAverageRating ?? 0)} size={20} />
        <p className="muted">
          Bought from us? Leave a review after delivery and get <strong className="gold-text">{config.reviewRewardPercent}% off</strong> your next order.
        </p>
        <Link to="/reviews" className="btn btn-outline btn-sm">
          See reviews
        </Link>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="review-empty card">
        <div className="review-empty-icon">
          <Icon name="star" size={26} />
        </div>
        <h3>Be the first to review</h3>
        <p className="muted">
          After your order is delivered you can leave a review – and get <strong className="gold-text">{config.reviewRewardPercent}% off</strong> your next order once it is approved.
        </p>
        <Link to="/reviews" className="btn btn-outline btn-sm">
          How reviews work
        </Link>
      </div>
    );
  }

  return (
    <div className="reviews">
      <div className="reviews-bar">
        {stats && stats.count > 0 && (
          <div className="row" style={{ gap: 8 }}>
            <Stars rating={Math.round(stats.averageRating)} size={16} />
            <strong>{stats.averageRating.toFixed(1)}</strong>
            <span className="muted small">
              · {stats.count} review{stats.count === 1 ? '' : 's'}
            </span>
          </div>
        )}
        <div className="reviews-nav">
          <button type="button" className="btn btn-secondary btn-icon" onClick={() => scrollBy(-1)} aria-label="Previous reviews">
            <Icon name="chevronRight" size={18} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button type="button" className="btn btn-secondary btn-icon" onClick={() => scrollBy(1)} aria-label="Next reviews">
            <Icon name="chevronRight" size={18} />
          </button>
        </div>
      </div>
      <div className="reviews-track" ref={track}>
        {reviews.map((r) => (
          <article key={r.id} className="review-card card">
            <header className="review-head">
              <Avatar username={r.username} />
              <div>
                <div className="review-name">{r.username}</div>
                <Stars rating={r.rating} />
              </div>
              <span className="review-date muted xs">{timeAgo(r.createdAt)}</span>
            </header>
            <p className="review-text">{r.comment}</p>
            {r.productNames && r.productNames.length > 0 && <div className="review-items xs muted">Bought: {r.productNames.slice(0, 3).join(', ')}</div>}
          </article>
        ))}
      </div>
    </div>
  );
}
