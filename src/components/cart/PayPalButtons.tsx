import { useEffect, useRef, useState } from 'react';
import type { PublicOrder } from '../../shared/types';
import { capturePayPalOrder, createPayPalOrder, loadPayPalSdk, type PayPalButtonsInstance } from '../../lib/payments';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { Icon } from '../ui/Icons';

/** PayPal Smart Buttons for an order (type 'paypal'). */
export function PayPalButtons({ order, onPaid }: { order: PublicOrder; onPaid: () => Promise<void> | void }) {
  const { config } = useStore();
  const { toast } = useToast();
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'capturing' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const clientId = config.paypalClientId;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    let buttons: PayPalButtonsInstance | null = null;
    setState('loading');
    loadPayPalSdk(clientId, 'USD')
      .then((pp) => {
        if (cancelled || !host.current) return;
        host.current.innerHTML = '';
        buttons = pp.Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay', height: 48 },
          createOrder: async () => {
            const r = await createPayPalOrder(order.id);
            return r.paypalOrderId;
          },
          onApprove: async (data) => {
            setState('capturing');
            try {
              await capturePayPalOrder(order.id, data.orderID);
              toast('Payment received – thank you!', 'success');
              await onPaid();
            } catch (err) {
              setError((err as Error).message || 'Capture failed. If you were charged, contact us on Discord with your order ID.');
              setState('error');
            }
          },
          onCancel: () => toast('PayPal checkout cancelled – your order is still waiting.', 'info'),
          onError: (err) => {
            setError((err as Error)?.message || 'PayPal reported an error. Please try again.');
            setState('error');
          },
        });
        return buttons.render(host.current).then(() => {
          if (!cancelled) setState('ready');
        });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setState('error');
      });
    return () => {
      cancelled = true;
      void buttons?.close?.();
    };
  }, [clientId, order.id, onPaid, toast]);

  if (!clientId) {
    return (
      <div className="alert alert-warn">
        <Icon name="warning" size={18} />
        <div>
          PayPal checkout is not configured on this store yet. Contact us on{' '}
          <a href={config.discordInvite} target="_blank" rel="noreferrer" className="link">
            Discord
          </a>{' '}
          with your order ID.
        </div>
      </div>
    );
  }
  return (
    <div className="ppb">
      {state === 'loading' && (
        <div className="pp-loading">
          <span className="spinner" /> Loading PayPal…
        </div>
      )}
      {state === 'capturing' && (
        <div className="pp-loading">
          <span className="spinner" /> Confirming your payment…
        </div>
      )}
      {state === 'error' && error && (
        <div className="alert alert-danger" role="alert">
          <Icon name="warning" size={18} /> {error}
        </div>
      )}
      <div ref={host} className="pp-host" style={{ display: state === 'capturing' ? 'none' : undefined }} />
    </div>
  );
}
