import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/base.css';
import './styles/ui.css';
import App, { preloadRoute } from './App';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

const container = document.getElementById('root')!;
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
if (container.hasChildNodes()) {
  const hydrate = () => hydrateRoot(container, app);
  preloadRoute(window.location.pathname).then(hydrate, hydrate);
} else {
  createRoot(container).render(app);
}
