import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Seo } from '../components/ui/Seo';
import { breadcrumbSchema, webPageSchema } from '../seo/schema';
import { Icon } from '../components/ui/Icons';
import { CopyButton } from '../components/free/CopyButton';
import '../styles/free.css';

export default function Page() {
  const { config, fmt } = useStore();
  const { setDiscountCode } = useCart();
  const { toast } = useToast();
  const tiers = [...config.spendingTiers].sort((a, b) => a.minCents - b.minCents);
  const welcome = config.welcomeCoupon;
  const ref = config.referral;

  return (
    <div className="container page">
      <Seo title={`Free coins, coupons & discounts | ${config.storeName}`} description={`Every way to get free ${config.serverName} coins and discounts at ${config.storeName}: daily spin, welcome coupon, spending tiers, referrals, reviews, giveaways and gift codes.`} canonical="/free" jsonLd={[breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Free coins & coupons', path: '/free' }]), webPageSchema('Free coins & coupons', '/free')]} />

      <header className="free-hero">
        <span className="eyebrow">
          <Icon name="gift" size={14} /> Free stuff hub
        </span>
        <h1>
          Pay less. <span className="grad-text">Get more.</span>
        </h1>
        <p className="lead">
          Seven ways to score free {config.serverName} coins, items and discounts – no purchase needed for most of them. Stack them with bulk prices for the best deal on the server.
        </p>
        <div className="free-hero-actions">
          {config.spinEnabled && (
            <Link to="/spin" className="btn btn-pink btn-lg">
              <Icon name="spin" size={18} /> Spin for free loot
            </Link>
          )}
          <Link to="/shop" className="btn btn-secondary btn-lg">
            <Icon name="cart" size={18} /> Browse the shop
          </Link>
        </div>
      </header>

      <div className="free-grid">
        {/* Daily spin */}
        <article className="card hover glow-pink fcard">
          <span className="fcard-ribbon">Free</span>
          <div className="fcard-top">
            <span className="fcard-icon pink">
              <Icon name="spin" size={22} />
            </span>
            <h3>Daily Spin</h3>
          </div>
          <p>One free spin every 24 hours. Win discount coupons, store credit or free coins and spawners delivered straight to your account.</p>
          <div className="fcard-chips">
            <span className="badge badge-blue">Coupons up to 25%</span>
            <span className="badge badge-gold">Free coins</span>
            <span className="badge badge-green">Free spawners</span>
            <span className="badge badge-violet">Store credit</span>
          </div>
          <div className="fcard-actions">
            <Link to="/spin" className="btn btn-primary btn-sm">
              <Icon name="spin" size={14} /> Spin now
            </Link>
          </div>
        </article>

        {/* Welcome coupon */}
        {welcome?.enabled && welcome.code && (
          <article className="card hover glow-gold fcard">
            <div className="fcard-top">
              <span className="fcard-icon">
                <Icon name="ticket" size={22} />
              </span>
              <h3>Welcome coupon</h3>
            </div>
            <p>
              New here? Take <strong className="gold-text">{welcome.percent}% off</strong> your first order. Enter the code at checkout.
            </p>
            <div className="code-row">
              <span className="code-box gold">{welcome.code}</span>
              <CopyButton text={welcome.code} onCopied={() => toast('Code copied – paste it at checkout.', 'success')} />
            </div>
            <div className="fcard-actions">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setDiscountCode(welcome.code);
                  toast(`${welcome.code} will be applied at checkout.`, 'gold');
                }}
              >
                <Icon name="check" size={14} /> Apply at checkout
              </button>
            </div>
          </article>
        )}

        {/* Spending tiers */}
        {tiers.length > 0 && (
          <article className="card hover fcard">
            <div className="fcard-top">
              <span className="fcard-icon green">
                <Icon name="percent" size={22} />
              </span>
              <h3>Spending tiers</h3>
            </div>
            <p>Bigger carts get automatic discounts – on top of bulk prices. No code needed, it just happens at checkout.</p>
            <table className="tier-table">
              <thead>
                <tr>
                  <th>Cart subtotal</th>
                  <th>Discount</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((t) => (
                  <tr key={t.minCents}>
                    <td>{fmt(t.minCents)}+</td>
                    <td>
                      <span className="tier-pct">-{t.percent}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        )}

        {/* Referral */}
        {ref?.enabled && (
          <article className="card hover fcard">
            <div className="fcard-top">
              <span className="fcard-icon blue">
                <Icon name="users" size={22} />
              </span>
              <h3>Refer a friend</h3>
            </div>
            <p>
              Your friend gets <strong className="gold-text">{ref.friendPercent}% off</strong> their order, you get <strong className="success-text">{ref.referrerPercent}%</strong> of it as store credit. Unlimited friends, unlimited credit.
            </p>
            <div className="fcard-actions">
              <Link to="/referral" className="btn btn-secondary btn-sm">
                Get your link <Icon name="arrowRight" size={14} />
              </Link>
            </div>
          </article>
        )}

        {/* Review reward */}
        {config.reviewRewardPercent > 0 && (
          <article className="card hover fcard">
            <div className="fcard-top">
              <span className="fcard-icon">
                <Icon name="star" size={22} />
              </span>
              <h3>Review reward</h3>
            </div>
            <p>
              Rate a delivered order and get a <strong className="gold-text">{config.reviewRewardPercent}% off</strong> code for your next purchase once your review is approved.
            </p>
            <div className="fcard-actions">
              <Link to="/reviews" className="btn btn-secondary btn-sm">
                Write a review <Icon name="arrowRight" size={14} />
              </Link>
            </div>
          </article>
        )}

        {/* Giveaways */}
        <article className="card hover fcard">
          <div className="fcard-top">
            <span className="fcard-icon violet">
              <Icon name="trophy" size={22} />
            </span>
            <h3>Giveaways</h3>
          </div>
          <p>We regularly give away money packs, mystery boxes and spawners. Enter with your username – winners are drawn randomly and announced in Discord.</p>
          <div className="fcard-actions">
            <Link to="/giveaways" className="btn btn-secondary btn-sm">
              See giveaways <Icon name="arrowRight" size={14} />
            </Link>
            <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord btn-sm">
              <Icon name="discord" size={14} /> Discord
            </a>
          </div>
        </article>

        {/* Redeem */}
        <article className="card hover fcard">
          <div className="fcard-top">
            <span className="fcard-icon green">
              <Icon name="gift" size={22} />
            </span>
            <h3>Redeem a code</h3>
          </div>
          <p>Got a gift code from a Discord event, a giveaway or our support team? Redeem it here and we deliver the item in-game.</p>
          <div className="fcard-actions">
            <Link to="/redeem" className="btn btn-secondary btn-sm">
              Redeem now <Icon name="arrowRight" size={14} />
            </Link>
          </div>
        </article>

        {/* Bulk */}
        <article className="card hover fcard">
          <div className="fcard-top">
            <span className="fcard-icon blue">
              <Icon name="coin" size={22} />
            </span>
            <h3>Bulk prices</h3>
          </div>
          <p>Money and spawners get cheaper per unit the more you order – the price drops automatically as you raise the quantity.</p>
          <div className="fcard-actions">
            <Link to="/shop/money" className="btn btn-secondary btn-sm">
              See money prices <Icon name="arrowRight" size={14} />
            </Link>
          </div>
        </article>
      </div>

      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="card pad">
          <h3 style={{ marginBottom: 12 }}>Can I stack everything?</h3>
          <p className="text-2 small">
            Bulk prices, the site-wide sale and spending tiers always apply automatically. On top of that you can use <strong>one</strong> code per order – a coupon <em>or</em> a referral discount – and pay the rest with store credit. Total discounts are capped at 60%.
          </p>
        </div>
      </section>
    </div>
  );
}
