import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../ui/Icons';

export function Footer() {
  const { config } = useStore();
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="stack">
            <Link to="/" className="brand">
              <img src="/img/brand/logo.svg" alt="" width={36} height={36} />
              <span>
                Donut<span className="brand-dot">Coins</span>
              </span>
            </Link>
            <p className="muted" style={{ maxWidth: 360 }}>
              {config.tagline}
            </p>
            <a href={config.discordInvite} target="_blank" rel="noreferrer" className="btn btn-discord btn-sm" style={{ alignSelf: 'flex-start' }}>
              <Icon name="discord" size={16} /> Join our Discord
            </a>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><Link to="/shop/money">DonutSMP Money</Link></li>
              <li><Link to="/shop/spawners">Spawners & Items</Link></li>
              <li><Link to="/shop/mystery-boxes">Mystery Boxes</Link></li>
              <li><Link to="/shop/bundles">Bundles</Link></li>
              <li><Link to="/shop/investments">Investments</Link></li>
              <li><Link to="/donutsmp-elytra">Elytra</Link></li>
              <li><Link to="/donutsmp-skeleton-spawner">Skeleton spawners</Link></li>
            </ul>
          </div>
          <div>
            <h4>Free stuff</h4>
            <ul>
              <li><Link to="/spin">Daily Spin</Link></li>
              <li><Link to="/free">Free Coins & Coupons</Link></li>
              <li><Link to="/giveaways">Giveaways</Link></li>
              <li><Link to="/referral">Refer a friend</Link></li>
              <li><Link to="/redeem">Redeem a code</Link></li>
            </ul>
          </div>
          <div>
            <h4>Help</h4>
            <ul>
              <li><Link to="/track">Track your order</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/guides">Guides</Link></li>
              <li><Link to="/donutsmp-money-prices">Money price guide</Link></li>
              <li><Link to="/reviews">Customer reviews</Link></li>
              <li><Link to="/donutsmp-irl-trade">DonutSMP IRL trading guide</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/refund-policy">Refund Policy</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {year} {config.storeName}. All rights reserved.</span>
          <span>Not affiliated with DonutSMP, Mojang or Microsoft.</span>
        </div>
      </div>
    </footer>
  );
}
