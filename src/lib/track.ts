/**
 * First-party statistics (admin → Analytics). Events are batched and sent with sendBeacon.
 * - Everyone: anonymous daily counters, nothing stored on the device.
 * - After "Accept" in the cookie banner: a session id and the first-touch source (referring site,
 *   utm, ?ref= creator code) are kept in localStorage so the admin sees each visitor's journey and
 *   which source led to a purchase; shop events are also forwarded to GA4.
 */
import { storageGet, storageSet } from './device';
type EventName = 'pv' | 'click' | 'add_to_cart' | 'begin_checkout' | 'order_created' | 'product_view' | 'login_click';
interface Ev {
  e: EventName;
  v?: string;
  ref?: string;
  src?: string;
  qty?: number;
}

const CONSENT_KEY = 'dc_consent';
const SESSION_KEY = 'dc_sess';
const SOURCE_KEY = 'dc_src';
const SESSION_IDLE_MS = 30 * 60 * 1000;
const SOURCE_TTL_MS = 30 * 24 * 3600 * 1000;

interface FirstTouch {
  ref?: string;
  src?: string;
  campaign?: string;
  creator?: string;
  landing?: string;
  at?: number;
}
/** where this visit came from – kept in memory only until the visitor consents */
let firstTouch: FirstTouch | null = null;

function consented(): boolean {
  return typeof window !== 'undefined' && storageGet<string | null>(CONSENT_KEY, null) === 'accepted';
}

function newId(): string {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 24);
}

/** Current journey session id (consent only) – a new one after 30 minutes without activity. */
export function journeySessionId(): string | undefined {
  if (!consented()) return undefined;
  const now = Date.now();
  const cur = storageGet<{ id: string; lastAt: number } | null>(SESSION_KEY, null);
  const id = cur && now - cur.lastAt < SESSION_IDLE_MS ? cur.id : newId();
  storageSet(SESSION_KEY, { id, lastAt: now });
  return id;
}

function journeySource(): FirstTouch | undefined {
  if (!consented()) return undefined;
  const stored = storageGet<FirstTouch | null>(SOURCE_KEY, null);
  if (stored && stored.at && Date.now() - stored.at < SOURCE_TTL_MS) return stored;
  if (firstTouch) {
    const fresh = { ...firstTouch, at: Date.now() };
    storageSet(SOURCE_KEY, fresh);
    return fresh;
  }
  return undefined;
}

/** Called when the visitor clicks "Accept": start the journey with the page they are on. */
export function startJourney(path: string) {
  journeySource();
  track('pv', path);
}

let queue: Ev[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

function flush() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (!queue.length) return;
  const sid = journeySessionId();
  const body = JSON.stringify({ events: queue.splice(0, queue.length), ...(sid ? { sid, src: journeySource() } : {}) });
  try {
    if (navigator.sendBeacon?.('/api/t', new Blob([body], { type: 'application/json' }))) return;
  } catch {
    /* fall through */
  }
  void fetch('/api/t', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => undefined);
}

const INTERNAL_KEY = 'dc_internal';

/** This browser belongs to the shop owner (set on admin login) – keep it out of all statistics. */
export function isInternal(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(INTERNAL_KEY) === '1';
  } catch {
    return false;
  }
}

export function markInternal() {
  try {
    window.localStorage.setItem(INTERNAL_KEY, '1');
  } catch {
    /* storage blocked – nothing to do */
  }
}

function enabled(): boolean {
  return typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin') && !/^(localhost|127\.)/.test(window.location.hostname) && !isInternal();
}

export function track(e: EventName, v?: string, extra?: Omit<Ev, 'e' | 'v'>) {
  if (!enabled()) return;
  if (!listening) {
    listening = true;
    document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
    window.addEventListener('pagehide', flush);
  }
  queue.push({ e, v, ...extra });
  if (queue.length >= 20) flush();
  else if (!timer) timer = setTimeout(flush, 4000);
}

/** GA4 ecommerce events – only fire when GA was loaded after consent. */
export function gaEvent(name: string, params: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') window.gtag('event', name, params);
}

/** First page view of a visit carries the external referrer host and utm_source. */
let firstView = true;
export function trackPageView(path: string) {
  let ref: string | undefined;
  let src: string | undefined;
  if (firstView) {
    firstView = false;
    try {
      const r = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : '';
      if (r && r !== window.location.hostname.replace(/^www\./, '')) ref = r;
      const q = new URLSearchParams(window.location.search);
      // Google Ads auto-tagging adds ?gclid=… – count those visits as "google-ads" even without utm tags
      const paid = q.has('gclid') || q.has('gbraid') || q.has('wbraid');
      src = q.get('utm_source') ?? (paid ? 'google-ads' : undefined);
      firstTouch = { ref, src, campaign: q.get('utm_campaign') ?? undefined, creator: q.get('ref') ?? undefined, landing: path };
    } catch {
      /* ignore */
    }
  }
  track('pv', path, { ref, src });
}

/** Label for a clicked button/link: data-track, aria-label or its visible text, prefixed with the page area. */
export function clickLabel(el: Element, pathname: string): string | null {
  const own = (el as HTMLElement).dataset?.track || el.getAttribute('aria-label') || (el.textContent ?? '');
  const text = own.replace(/\s+/g, ' ').trim().slice(0, 40);
  if (!text) return null;
  const area = pathname === '/' ? 'home' : pathname.split('/')[1] || 'home';
  return `${area} › ${text}`;
}
