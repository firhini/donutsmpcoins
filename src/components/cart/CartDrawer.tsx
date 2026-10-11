import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Icon } from '../ui/Icons';

/** PLACEHOLDER – replaced by the cart/checkout builder (see docs/ARCHITECTURE.md). */
export function CartDrawer() {
  const { isOpen, close, lines, count } = useCart();
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="modal modal-sm">
        <div className="modal-head">
          <div className="modal-title">Cart ({count})</div>
          <button className="btn btn-ghost btn-icon" onClick={close} aria-label="Close"><Icon name="close" /></button>
        </div>
        <div className="modal-body stack">
          {lines.map((l) => (
            <div key={l.productId} className="row between small">
              <span>{l.qty}× {l.product.name}</span>
            </div>
          ))}
          <Link to="/checkout" className="btn btn-primary btn-block" onClick={close}>Checkout</Link>
        </div>
      </div>
    </div>
  );
}
