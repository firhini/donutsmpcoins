/**
 * Cookieless first-party statistics (admin → Analytics). Events are batched and sent with sendBeacon;
 * nothing is stored on the device. When the visitor accepted Google Analytics, shop events are
 * forwarded to GA4 as well (add_to_cart, begin_checkout, purchase).
 */
type EventName = 'pv' | 'click' | 'add_to_cart' | 'begin_checkout' | 'order_created' | 'product_view' | 'login_click';
interface Ev {
  e: EventName;
  v?: string;
  ref?: string;
  src?: string;
  qty?: number;
}

let queue: Ev[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

function flush() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (!queue.length) return;
  const body = JSON.stringify({ events: queue.splice(0, queue.length) });
  try {
    if (navigator.sendBeacon?.('/api/t', new Blob([body], { type: 'application/json' }))) return;
  } catch {
    /* fall through */
  }
  void fetch('/api/t', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => undefined);
}

function enabled(): boolean {
  return typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin') && !/^(localhost|127\.)/.test(window.location.hostname);
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
      src = new URLSearchParams(window.location.search).get('utm_source') ?? undefined;
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
