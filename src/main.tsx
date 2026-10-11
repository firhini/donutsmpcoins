import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/base.css';
import './styles/ui.css';
import App from './App';

const container = document.getElementById('root')!;
const app = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Pre-rendered pages (see scripts/prerender.mjs) are hydrated; everything else is client-rendered.
if (container.hasChildNodes()) hydrateRoot(container, app);
else createRoot(container).render(app);
