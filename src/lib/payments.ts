/**
 * Payment helpers for the order flow: PayPal JS SDK loader (Smart Buttons)
 * and thin wrappers around the /api/payments/* routes.
 */
import { apiGet, apiPost } from './api';

export interface PayPalButtonsOptions {
  style?: { layout?: 'vertical' | 'horizontal'; color?: 'gold' | 'blue' | 'silver' | 'white' | 'black'; shape?: 'rect' | 'pill'; label?: 'paypal' | 'checkout' | 'pay' | 'buynow'; height?: number; tagline?: boolean };
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }) => Promise<void>;
  onCancel?: () => void;
  onError?: (err: unknown) => void;
}

export interface PayPalButtonsInstance {
  render: (el: HTMLElement | string) => Promise<void>;
  close?: () => Promise<void>;
  isEligible?: () => boolean;
}

export interface PayPalNamespace {
  Buttons: (opts: PayPalButtonsOptions) => PayPalButtonsInstance;
}

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

const loaders = new Map<string, Promise<PayPalNamespace>>();

/** Load https://www.paypal.com/sdk/js once per client id + currency. */
export function loadPayPalSdk(clientId: string, currency = 'USD'): Promise<PayPalNamespace> {
  const key = `${clientId}|${currency}`;
  const existing = loaders.get(key);
  if (existing) return existing;

  const promise = new Promise<PayPalNamespace>((resolve, reject) => {
    const already = document.querySelector<HTMLScriptElement>(`script[data-pp-key="${CSS.escape(key)}"]`);
    if (already && window.paypal) {
      resolve(window.paypal);
      return;
    }
    const s = document.createElement('script');
    const params = new URLSearchParams({ 'client-id': clientId, currency, intent: 'capture', components: 'buttons' });
    s.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    s.async = true;
    s.dataset.ppKey = key;
    s.onload = () => {
      if (window.paypal) resolve(window.paypal);
      else reject(new Error('The PayPal SDK did not initialise.'));
    };
    s.onerror = () => {
      loaders.delete(key);
      s.remove();
      reject(new Error('Could not load PayPal. Check your connection or ad blocker and try again.'));
    };
    document.head.appendChild(s);
  });
  loaders.set(key, promise);
  return promise;
}

/* ───────── provider routes ───────── */

export const createStripeSession = (orderId: string) => apiPost<{ url: string }>('/payments/stripe/session', { orderId });

export const verifyStripeSession = (orderId: string) =>
  apiGet<{ paid?: boolean; status?: string }>(`/payments/stripe/verify?orderId=${encodeURIComponent(orderId)}`);

export const createPayPalOrder = (orderId: string) => apiPost<{ paypalOrderId: string }>('/payments/paypal/create', { orderId });

export const capturePayPalOrder = (orderId: string, paypalOrderId: string) =>
  apiPost<{ status?: string }>('/payments/paypal/capture', { orderId, paypalOrderId });

export const createNowPaymentsInvoice = (orderId: string) => apiPost<{ url: string }>('/payments/nowpayments/invoice', { orderId });

/** Full-page redirect to a hosted payment page. */
export function redirectToPayment(url: string): void {
  window.location.assign(url);
}
