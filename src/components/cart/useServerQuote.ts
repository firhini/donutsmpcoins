import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Quote, QuoteRequest } from '../../shared/types';
import { api, ApiClientError } from '../../lib/api';

export interface ServerQuoteState {
  /** authoritative server quote when available and matching the current items, else the local preview */
  quote: Quote;
  /** true when `quote` came from the server */
  live: boolean;
  loading: boolean;
  /** last error message (null when fine) */
  error: string | null;
  /** the /quote route is not deployed (404) – codes can't be verified right now */
  unavailable: boolean;
  refresh: () => void;
}

function sameItems(a: Quote, b: Quote): boolean {
  if (a.lines.length !== b.lines.length) return false;
  const key = (q: Quote) =>
    q.lines
      .map((l) => `${l.productId}:${l.qty}`)
      .sort()
      .join('|');
  return key(a) === key(b);
}

/**
 * Debounced POST /api/quote. Falls back to the local preview quote while
 * loading, on error, or when the server result is for a different item set.
 */
export function useServerQuote(req: QuoteRequest | null, fallback: Quote, debounceMs = 350): ServerQuoteState {
  const [state, setState] = useState<{ quote: Quote | null; loading: boolean; error: string | null; status: number | null; forKey: string }>({
    quote: null,
    loading: false,
    error: null,
    status: null,
    forKey: '',
  });
  const [tick, setTick] = useState(0);
  const key = req && req.items.length ? JSON.stringify(req) : '';

  useEffect(() => {
    if (!key) {
      setState({ quote: null, loading: false, error: null, status: null, forKey: '' });
      return;
    }
    const body = JSON.parse(key) as QuoteRequest;
    const ctrl = new AbortController();
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    const t = window.setTimeout(async () => {
      try {
        const q = await api<Quote>('/quote', { body, signal: ctrl.signal });
        if (!cancelled) setState({ quote: q, loading: false, error: null, status: 200, forKey: key });
      } catch (err) {
        if (cancelled || (err as Error).name === 'AbortError') return;
        const status = err instanceof ApiClientError ? err.status : 0;
        setState({ quote: null, loading: false, error: (err as Error).message || 'Could not load live prices.', status, forKey: key });
      }
    }, debounceMs);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [key, tick, debounceMs]);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  return useMemo(() => {
    // a quote is only 'live' when it answers the CURRENT request (codes/username/credit) – not a stale one
    const usable = state.quote && state.forKey === key && sameItems(state.quote, fallback) ? state.quote : null;
    return {
      quote: usable ?? fallback,
      live: !!usable,
      loading: state.loading,
      error: state.error,
      unavailable: state.status === 404 || state.status === 0,
      refresh,
    };
  }, [state, fallback, refresh, key]);
}
