import { Component, type ErrorInfo, type ReactNode } from 'react';

const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Loading (CSS )?chunk/i;
const RELOAD_KEY = 'dc_chunk_reload';

interface Props {
  children: ReactNode;
  /** reset the boundary when this changes (e.g. the pathname) */
  resetKey?: string;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Catches render errors so a broken page shows a friendly message instead of a
 * blank screen. A failed lazy-chunk import (stale tab after a new deploy) reloads
 * the page once – that fetches the fresh asset manifest and fixes it.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (CHUNK_ERROR.test(String(error?.message))) {
      try {
        const marker = `${RELOAD_KEY}:${window.location.pathname}`;
        if (!sessionStorage.getItem(marker)) {
          sessionStorage.setItem(marker, String(Date.now()));
          window.location.reload();
          return;
        }
      } catch {
        /* storage unavailable – fall through to the fallback UI */
      }
    }
    console.error('[ui] render error', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  retry = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.retry);
    const chunk = CHUNK_ERROR.test(String(error.message));
    return (
      <div className="container" style={{ padding: '64px 0', maxWidth: 560 }} role="alert">
        <h1 style={{ fontSize: '1.5rem', marginBottom: 12 }}>{chunk ? 'A new version of the store is live' : 'Something went wrong on this page'}</h1>
        <p className="muted" style={{ marginBottom: 20 }}>
          {chunk ? 'Reload the page to load the latest version.' : 'The rest of the store still works. Reload the page or go back to the start page – if it keeps happening, tell us on Discord.'}
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload page
          </button>
          <a href="/" className="btn btn-secondary">
            Back home
          </a>
        </div>
      </div>
    );
  }
}
