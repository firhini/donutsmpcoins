import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../shared/types';
import { useStore } from '../context/StoreContext';
import { Seo } from '../components/ui/Seo';
import { Icon } from '../components/ui/Icons';
import { CategoryHotbar, type HotbarValue } from '../components/shop/CategoryHotbar';
import { ProductGrid } from '../components/shop/ProductGrid';
import { MoneyCalculator } from '../components/shop/MoneyCalculator';
import { DeliveryLog } from '../components/shop/DeliveryLog';
import { Mascot } from '../components/shop/Mascot';
import { ReviewsCarousel } from '../components/shop/ReviewsCarousel';
import { Accordion } from '../components/shop/Accordion';
import { renderRich } from '../components/shop/richText';
import { matchesSearch, sortProducts } from '../components/shop/productUtils';
import { topFaq } from '../data/faq';
import '../styles/shop.css';
import '../styles/home.css';

const INITIAL_VISIBLE = 12;

export default function Home() {
  const { config, products, categories, stats, loading } = useStore();
  const [cat, setCat] = useState<HotbarValue>('all');
  const [q, setQ] = useState('');
  const [showAll, setShowAll] = useState(false);

  const counts = useMemo(() => {
    const c: Partial<Record<HotbarValue, number>> = { all: products.length };
    for (const p of products) c[p.categoryId] = (c[p.categoryId] ?? 0) + 1;
    return c;
  }, [products]);

  const filtered = useMemo(() => {
    const list = products.filter((p) => (cat === 'all' || p.categoryId === cat) && matchesSearch(p, q));
    return sortProducts(list, 'featured');
  }, [products, cat, q]);

  const searching = q.trim().length > 0;
  const featured = useMemo(() => {
    if (cat !== 'all' || searching) return [];
    const f = filtered.filter((p) => p.featured);
    return f.slice(0, f.length >= 8 ? 8 : 4); // keep the grid tidy (multiples of 4)
  }, [filtered, cat, searching]);
  const rest: Product[] = useMemo(() => (cat === 'all' && !searching ? filtered.filter((p) => !featured.includes(p)) : filtered), [filtered, featured, cat, searching]);
  const visibleRest = showAll || cat !== 'all' || searching ? rest : rest.slice(0, INITIAL_VISIBLE);
  const activeCategory = cat === 'all' ? null : categories.find((c) => c.id === cat) ?? null;

  const pills = buildPills(stats);
  const tiers = [...config.spendingTiers].sort((a, b) => a.minCents - b.minCents);
  const faqVars = {
    store: config.storeName,
    server: config.serverName,
    eta: config.delivery.etaText,
    referralFriend: config.referral.friendPercent,
    referralReferrer: config.referral.referrerPercent,
    reviewReward: config.reviewRewardPercent,
    welcomeCode: config.welcomeCoupon.code,
    welcomePercent: config.welcomeCoupon.percent,
    spinCooldown: 24,
  };

  return (
    <>
      <Seo title={`${config.storeName} — ${config.serverName} Money, Spawners & Mystery Boxes`} description={`Buy ${config.serverName} money, spawners, mystery boxes and items. Bulk discounts, daily free spins and fast in-game delivery by real staff.`} />

      {/* ───────── hero ───────── */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy fade-up">
            <span className="eyebrow">
              <Icon name="sparkles" size={14} /> {config.serverName} store
            </span>
            <h1>
              {config.serverName} money, spawners &amp; items – <span className="grad-text">delivered fast.</span>
            </h1>
            <p className="lead">
              Pick what you need, pay the way you like, and our staff hand it over in-game – money straight to your balance, items by teleport. Bulk prices, spending-tier discounts
              and a free spin every day.
            </p>
            <div className="hero-ctas">
              <a href="#store" className="btn btn-primary btn-lg">
                <Icon name="cart" size={18} /> Shop now
              </a>
              {config.spinEnabled && (
                <Link to="/spin" className="btn btn-pink btn-lg">
                  <Icon name="spin" size={18} /> Spin for free coins
                </Link>
              )}
            </div>
            <div className="hero-pills">
              {pills.map((p) => (
                <span key={p.label} className="pill">
                  <Icon name={p.icon} size={15} /> {p.label}
                </span>
              ))}
            </div>
          </div>
          <div className="hero-visual fade-up" style={{ animationDelay: '120ms' }}>
            <div className="hero-orb" aria-hidden="true" />
            <span className="hero-coin a" aria-hidden="true">
              +1M
            </span>
            <span className="hero-coin b" aria-hidden="true">
              -25%
            </span>
            <Mascot className="hero-mascot" size={220} />
            <DeliveryLog />
          </div>
        </div>
      </section>

      {/* ───────── free stuff strip ───────── */}
      <section className="free-strip">
        <div className="container">
          <div className="home-free-grid">
            <Link to="/spin" className="free-card card hover">
              <span className="free-icon">
                <Icon name="spin" size={22} />
              </span>
              <div>
                <strong>Daily free spin</strong>
                <span>Coupons, store credit or free coins – one spin every 24h.</span>
              </div>
              <Icon name="arrowRight" size={18} className="arrow" />
            </Link>
            <Link to="/referral" className="free-card card hover pink">
              <span className="free-icon">
                <Icon name="users" size={22} />
              </span>
              <div>
                <strong>Refer a friend</strong>
                <span>
                  They get {config.referral.friendPercent}% off, you earn {config.referral.referrerPercent}% credit.
                </span>
              </div>
              <Icon name="arrowRight" size={18} className="arrow" />
            </Link>
            <Link to="/giveaways" className="free-card card hover violet">
              <span className="free-icon">
                <Icon name="gift" size={22} />
              </span>
              <div>
                <strong>Giveaways</strong>
                <span>Enter with your username – winners are drawn at random.</span>
              </div>
              <Icon name="arrowRight" size={18} className="arrow" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── store ───────── */}
      <section className="section" id="store">
        <div className="container">
          <div className="store-head">
            <div className="section-head" style={{ marginBottom: 0 }}>
              <span className="eyebrow">
                <Icon name="box" size={14} /> The store
              </span>
              <h2>{activeCategory ? activeCategory.name : 'Everything for your base'}</h2>
              <p className="lead">{activeCategory ? activeCategory.tagline : 'Money, spawners, mystery boxes, god gear and bundles – all delivered by hand.'}</p>
            </div>
            <Link to="/shop" className="btn btn-outline">
              Open full shop <Icon name="arrowRight" size={16} />
            </Link>
          </div>

          {config.sale.enabled && config.sale.percent > 0 && (
            <div className="sale-banner">
              <Icon name="tag" size={16} />
              <span>
                <strong>{config.sale.label || 'Sale'}:</strong> {config.sale.percent}% off everything is applied automatically at checkout.
              </span>
            </div>
          )}

          <CategoryHotbar
            value={cat}
            onChange={(id) => {
              setCat(id);
              setShowAll(false);
            }}
            counts={counts}
          />

          <div className="store-tools">
            <div className="shop-search">
              <Icon name="search" size={18} />
              <input className="input" type="search" placeholder="Search spawners, elytra, netherite…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
              {q && (
                <button type="button" className="shop-clear" onClick={() => setQ('')} aria-label="Clear search">
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
            <span className="shop-count">
              {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
            </span>
          </div>

          {featured.length > 0 && (
            <>
              <div className="store-sub">
                <h3>
                  <Icon name="flame" size={18} /> Most popular
                </h3>
                <span className="line" />
              </div>
              <ProductGrid products={featured} loading={loading} eagerCount={4} />
              <div className="store-sub">
                <h3>All products</h3>
                <span className="line" />
                <span className="muted">{rest.length} more</span>
              </div>
            </>
          )}

          <ProductGrid
            products={visibleRest}
            loading={loading}
            empty={
              <>
                <h3>No matches for “{q}”</h3>
                <p className="muted">Try a shorter search, or browse a category above.</p>
              </>
            }
          />

          {!showAll && cat === 'all' && !searching && rest.length > INITIAL_VISIBLE && (
            <div className="store-more">
              <button type="button" className="btn btn-secondary btn-lg" onClick={() => setShowAll(true)}>
                Show all {rest.length} products <Icon name="chevron" size={16} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ───────── money calculator ───────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <MoneyCalculator />
        </div>
      </section>

      {/* ───────── how it works ───────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow">How it works</span>
            <h2>Three steps. No bots, no nonsense.</h2>
            <p className="lead">Every order is handled by a real person on our team – that is why it just works.</p>
          </div>
          <div className="hiw-steps">
            <div className="hiw-step card">
              <span className="hiw-num">STEP 01</span>
              <span className="hiw-icon">
                <Icon name="cart" size={22} />
              </span>
              <h3>Pick your items</h3>
              <p>Add money, spawners, boxes or bundles to the cart. Bulk prices and spending tiers are applied automatically – no code needed.</p>
            </div>
            <div className="hiw-step card">
              <span className="hiw-num">STEP 02</span>
              <span className="hiw-icon">
                <Icon name="card" size={22} />
              </span>
              <h3>Pay your way</h3>
              <p>Enter your Minecraft username, choose a payment method and send the total. Tell us the reference on your order page and we confirm.</p>
              <div className="hiw-pay">
                {(config.paymentMethods.length ? config.paymentMethods.map((m) => m.name) : ['PayPal', 'Crypto', 'Card']).slice(0, 5).map((n) => (
                  <span key={n} className="badge">
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <div className="hiw-step card">
              <span className="hiw-num">STEP 03</span>
              <span className="hiw-icon">
                <Icon name="truck" size={22} />
              </span>
              <h3>Delivered in-game by our staff</h3>
              <p>{config.delivery.moneyText}</p>
              <p style={{ marginTop: 8 }}>{config.delivery.itemText}</p>
              <div className="hiw-note">
                <Icon name="clock" size={14} /> {config.delivery.etaText}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── why us ───────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Why {config.storeName}</span>
            <h2>Built to be the store we wanted to buy from.</h2>
          </div>
          <div className="features">
            <div className="feature card hover">
              <span className="feature-icon">
                <Icon name="dollar" size={20} />
              </span>
              <h3>Low prices &amp; bulk discounts</h3>
              <p>Prices are tuned to the live market and drop further the more you buy – money packs, spawners and investments all have bulk tiers.</p>
            </div>
            <div className="feature card hover">
              <span className="feature-icon">
                <Icon name="trophy" size={20} />
              </span>
              <h3>Spending tier discounts</h3>
              <p>Bigger carts get an automatic extra discount at checkout:</p>
              {tiers.length > 0 && (
                <ul className="tiers">
                  {tiers.map((t) => (
                    <li key={t.minCents}>
                      <span>Spend {formatTier(t.minCents)}+</span>
                      <strong>{t.percent}% off</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="feature card hover">
              <span className="feature-icon">
                <Icon name="spin" size={20} />
              </span>
              <h3>Daily free spins &amp; coupons</h3>
              <p>
                Spin once a day for coupons, store credit or free coins. Reviews earn {config.reviewRewardPercent}% off, referrals earn credit – stack it all with bulk prices.
              </p>
            </div>
            <div className="feature card hover">
              <span className="feature-icon">
                <Icon name="discord" size={20} />
              </span>
              <h3>Real support on Discord</h3>
              <p>Questions before or after an order? Our staff answer in the Discord, and every order can be tracked with its ID – no account needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── reviews ───────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Reviews</span>
            <h2>What customers say</h2>
            <p className="lead">Only verified buyers can review – each review is tied to a delivered order.</p>
          </div>
          <ReviewsCarousel limit={12} />
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container home-faq">
          <div className="section-head center">
            <span className="eyebrow">FAQ</span>
            <h2>Good questions, honest answers</h2>
          </div>
          <Accordion items={topFaq.map((f) => ({ id: `home-${f.id}`, q: f.q, a: <p>{renderRich(f.a, faqVars)}</p> }))} defaultOpen={`home-${topFaq[0]?.id ?? ''}`} />
          <div className="store-more">
            <Link to="/faq" className="btn btn-outline">
              Read the full FAQ <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── discord CTA ───────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="discord-cta">
            <div className="discord-cta-copy">
              <span className="discord-cta-icon">
                <Icon name="discord" size={32} />
              </span>
              <div>
                <h2>Join the {config.storeName} Discord</h2>
                <p>Delivery status, giveaways, support tickets and the occasional surprise drop. That is where we live.</p>
              </div>
            </div>
            <div className="discord-cta-actions">
              <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord btn-lg">
                <Icon name="discord" size={18} /> Join Discord
              </a>
              <Link to="/track" className="btn btn-secondary btn-lg">
                <Icon name="truck" size={18} /> Track an order
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function formatTier(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}

function buildPills(stats: ReturnType<typeof useStore>['stats']): { icon: string; label: string }[] {
  const out: { icon: string; label: string }[] = [];
  if (stats && stats.ordersDelivered > 0) out.push({ icon: 'check', label: `${stats.ordersDelivered.toLocaleString('en-US')} ${stats.ordersDelivered === 1 ? 'order' : 'orders'} delivered` });
  if (stats && stats.reviewCount > 0) out.push({ icon: 'star', label: `${stats.averageRating.toFixed(1)} ★ from ${stats.reviewCount} review${stats.reviewCount === 1 ? '' : 's'}` });
  const neutral = [
    { icon: 'bolt', label: 'Fast in-game delivery' },
    { icon: 'shield', label: 'Secure checkout' },
    { icon: 'spin', label: 'Daily free spins' },
  ];
  for (const n of neutral) if (out.length < 3) out.push(n);
  return out;
}
