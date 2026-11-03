import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { storageGet, storageSet } from '../../lib/device';
import { clickLabel, isInternal, startJourney, track, trackPageView } from '../../lib/track';

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
    if (id && choice === 'accepted' && !isInternal()) loadGa(id);
  }, [id, choice]);

  // cookieless first-party statistics (no consent needed – nothing is stored on the device)
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('a,button,[data-track]');
      if (!el || el.closest('.consent')) return;
      const label = clickLabel(el, window.location.pathname);
      if (label) track(/login/i.test(label) ? 'login_click' : 'click', label);
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  useEffect(() => {
    if (id && choice === 'accepted' && window.gtag) {
      window.gtag('event', 'page_view', { page_location: window.location.href, page_path: pathname + search, page_title: document.title });
    }
  }, [id, choice, pathname, search]);

  if (!id || !ready || choice) return null;
  const decide = (c: 'accepted' | 'declined') => {
    track('click', `consent › ${c}`);
    storageSet(KEY, c);
    if (c === 'accepted') startJourney(window.location.pathname);
    setChoice(c);
  };
  return (
    <div className="consent-backdrop">
      <div className="consent consent-sheet" role="dialog" aria-labelledby="consent-title">
        <img src="/img/brand/mascot.svg" alt="" width={64} height={64} className="consent-mascot" />
        <div className="consent-text">
          <strong id="consent-title">🍪 Cookies okay?</strong>
          <span>
            With your OK we remember your visit (an ID on your device) and use Google Analytics to see which deals players like. No ads, never sold – saying no changes
            nothing. <Link to="/privacy">Privacy policy</Link>
          </span>
        </div>
        <div className="consent-actions">
          <button type="button" className="btn btn-secondary btn-lg" onClick={() => decide('declined')}>
            Only necessary
          </button>
          <button type="button" className="btn btn-primary btn-lg" onClick={() => decide('accepted')}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
