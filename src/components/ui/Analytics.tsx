import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { storageGet, storageSet } from '../../lib/device';

const KEY = 'dc_consent';
declare global {
  interface Window {
    __GA_ID__?: string;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function gaId(): string {
  const id = (typeof window !== 'undefined' && window.__GA_ID__) || (import.meta.env.VITE_GA_ID as string) || '';
  return /^G-[A-Z0-9]+$/i.test(id) ? id : '';
}

function loadGa(id: string) {
  if (document.getElementById('ga-script')) return;
  const s = document.createElement('script');
  s.id = 'ga-script';
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  // gtag.js only processes the real `arguments` object – pushing an array (e.g. from ...rest)
  // is silently ignored and no hit is ever sent. Keep this exactly like Google's snippet.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  } as (...args: unknown[]) => void;
  window.gtag('js', new Date());
  // page views are sent by the effect below (initial load + every client-side navigation)
  window.gtag('config', id, { anonymize_ip: true, send_page_view: false });
}

/**
 * Google Analytics 4 with a tiny consent bar (GDPR-friendly: nothing loads before "Accept").
 * Enabled only when GA_MEASUREMENT_ID is set at build time.
 */
export function Analytics() {
  const id = gaId();
  const [choice, setChoice] = useState<'accepted' | 'declined' | null>(null);
  const [ready, setReady] = useState(false);
  const { pathname, search } = useLocation();

  useEffect(() => {
    setChoice(storageGet<'accepted' | 'declined' | null>(KEY, null));
    setReady(true);
  }, []);

  useEffect(() => {
    if (id && choice === 'accepted') loadGa(id);
  }, [id, choice]);

  useEffect(() => {
    if (id && choice === 'accepted' && window.gtag) {
      window.gtag('event', 'page_view', { page_location: window.location.href, page_path: pathname + search, page_title: document.title });
    }
  }, [id, choice, pathname, search]);

  if (!id || !ready || choice) return null;
  const decide = (c: 'accepted' | 'declined') => {
    storageSet(KEY, c);
    setChoice(c);
  };
  return (
    <div className="consent" role="dialog" aria-label="Cookie consent">
      <span>We use Google Analytics to see which pages help players. No ads, no selling data.</span>
      <div className="row">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => decide('declined')}>
          No thanks
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => decide('accepted')}>
          Accept
        </button>
      </div>
    </div>
  );
}
