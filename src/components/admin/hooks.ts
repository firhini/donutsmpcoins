import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../lib/adminApi';

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** re-run the fetcher; `silent` keeps the current data visible while loading */
  reload: (silent?: boolean) => Promise<void>;
  setData: (updater: T | null | ((prev: T | null) => T | null)) => void;
}

/**
 * Minimal data hook: runs `fetcher` on mount and whenever `deps` change.
 * Stale responses are ignored (version counter) so quick filter changes never flicker.
 */
export function useAdminQuery<T>(fetcher: () => Promise<T>, deps: DependencyList = []): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const version = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const reload = useCallback(
    async (silent = false) => {
      const v = ++version.current;
      if (!silent) setLoading(true);
      try {
        const result = await fetcherRef.current();
        if (v !== version.current) return;
        setData(result);
        setError(null);
      } catch (err) {
        if (v !== version.current) return;
        setError(errorMessage(err));
      } finally {
        if (v === version.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  useEffect(() => {
    void reload();
    return () => {
      version.current++;
    };
  }, [reload]);

  return { data, loading, error, reload, setData };
}

/**
 * Wrap a mutation: tracks a busy flag, toasts errors (and an optional success message).
 * Returns `undefined` when the action failed so callers can bail out.
 */
export function useAction() {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const run = useCallback(
    async <R,>(key: string, fn: () => Promise<R>, successMessage?: string): Promise<R | undefined> => {
      setBusy(key);
      try {
        const r = await fn();
        if (successMessage) toast(successMessage, 'success');
        return r;
      } catch (err) {
        toast(errorMessage(err), 'error');
        return undefined;
      } finally {
        setBusy((b) => (b === key ? null : b));
      }
    },
    [toast],
  );
  return { run, busy, isBusy: (key: string) => busy === key, anyBusy: busy !== null };
}

/** Debounced value (for search inputs). */
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

/**
 * Local editable copy of a server value. `reset()` re-syncs from the server value,
 * which also happens automatically whenever the server value changes.
 */
export function useDraft<T>(server: T): { draft: T; setDraft: (u: T | ((d: T) => T)) => void; dirty: boolean; reset: () => void } {
  const [draft, setDraftState] = useState<T>(server);
  const serverJson = JSON.stringify(server);
  const lastServer = useRef(serverJson);
  useEffect(() => {
    if (lastServer.current !== serverJson) {
      lastServer.current = serverJson;
      setDraftState(server);
    }
  }, [serverJson, server]);
  const setDraft = useCallback((u: T | ((d: T) => T)) => {
    setDraftState((d) => (typeof u === 'function' ? (u as (d: T) => T)(d) : u));
  }, []);
  const reset = useCallback(() => setDraftState(server), [server]);
  return { draft, setDraft, dirty: JSON.stringify(draft) !== serverJson, reset };
}

/** Match a CSS media query (used for the collapsible sidebar). */
export function useMediaQuery(query: string): boolean {
  const get = () => {
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  };
  const [m, setM] = useState(get);
  useEffect(() => {
    let mq: MediaQueryList;
    try {
      mq = window.matchMedia(query);
    } catch {
      return;
    }
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return m;
}
