import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/base.css';
import './styles/ui.css';
import App, { preloadRoute } from './App';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

const container = document.getElementById('root')!;

// A stale tab after a deploy fails to preload the CSS/JS of a lazy page – reload once (Vite's documented pattern).
window.addEventListener('vite:preloadError', (event) => {
  const marker = `dc_chunk_reload:${window.location.pathname}`;
  try {
    if (sessionStorage.getItem(marker)) return;
    sessionStorage.setItem(marker, String(Date.now()));
  } catch {
    return;
  }
  event.preventDefault();
  window.location.reload();
});
const app = (
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// Pre-rendered pages (see scripts/prerender.mjs) are hydrated; everything else is client-rendered.
// The current page's module is loaded first (it is <link rel="modulepreload">ed in the HTML),
// so hydration never suspends and the server HTML is reused without a fallback flash.
// Only hydrate when the server HTML really is this page: the SPA fallback (app.html) is empty,
// but a static host without that rule could hand us the pre-rendered home page for /checkout.
const prerenderedPath = document.querySelector<HTMLMetaElement>('meta[name="x-prerender-path"]')?.content;
const sameRoute = !!prerenderedPath && prerenderedPath.replace(/\/+$/, '') === window.location.pathname.replace(/\/+$/, '');
if (container.hasChildNodes() && sameRoute) {
  const hydrate = () => hydrateRoot(container, app);
  preloadRoute(window.location.pathname).then(hydrate, hydrate);
} else {
  container.replaceChildren();
  createRoot(container).render(app);
}
