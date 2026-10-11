import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Seo } from '../components/ui/Seo';
import { Icon } from '../components/ui/Icons';
import { Mascot } from '../components/shop/Mascot';
import '../styles/content.css';

export default function NotFound() {
  const { config } = useStore();
  const { pathname } = useLocation();
  return (
    <div className="container page">
      <Seo title={`Page not found · ${config.storeName}`} description="This page does not exist. Head back to the store." />
      <div className="nf">
        <Mascot size={180} />
        <div className="nf-code" aria-hidden="true">
          404
        </div>
        <h1>This chunk never loaded.</h1>
        <p className="lead" style={{ textAlign: 'center' }}>
          Either the page moved, the link was wrong, or someone griefed it. The store is still right here.
        </p>
        <div className="mc-chat nf-chat" aria-hidden="true">
          <div>
            <span className="c-gray">[Server]</span> Unknown command. Type <span className="c-gold">/help</span> for help.
          </div>
          <div>
            <span className="c-pink">[{config.storeName}]</span> <span className="c-gray">{pathname.length > 40 ? pathname.slice(0, 40) + '…' : pathname}</span> not found
          </div>
        </div>
        <div className="nf-links">
          <Link to="/" className="btn btn-primary">
            <Icon name="home" size={16} /> Back home
          </Link>
          <Link to="/shop" className="btn btn-secondary">
            <Icon name="cart" size={16} /> Open the shop
          </Link>
          <Link to="/spin" className="btn btn-pink">
            <Icon name="spin" size={16} /> Free spin
          </Link>
          <Link to="/track" className="btn btn-outline">
            <Icon name="truck" size={16} /> Track an order
          </Link>
        </div>
      </div>
    </div>
  );
}
