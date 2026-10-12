/** Server entry for build-time pre-rendering (scripts/prerender.mjs). */
import { StrictMode } from 'react';
import { prerender } from 'react-dom/static.edge';
import { StaticRouter } from 'react-router';
import App from './App';
import { HeadProvider, headToHtml, type HeadCollector } from './seo/head';
import './styles/base.css';
import './styles/ui.css';

export { seoRoutes } from './seo/routes';

/**
 * Renders one route to a complete, static HTML string.
 *
 * Uses React's static `prerender` API with a huge `progressiveChunkSize`, so every
 * Suspense boundary (the lazy pages) resolves and is inlined where it belongs. The
 * default settings would emit the Suspense fallback in place plus the content in a
 * hidden <div> and a `$RC` swap script – that caused a visible spinner, a layout
 * shift on every page and hidden content for crawlers.
 */
export async function render(url: string): Promise<{ html: string; title: string; headTags: string; status: number }> {
  const collector: HeadCollector = { head: null, status: 200 };
  const { prelude } = await prerender(
    <StrictMode>
      <StaticRouter location={url}>
        <HeadProvider collector={collector}>
          <App />
        </HeadProvider>
      </StaticRouter>
    </StrictMode>,
    {
      // React only inlines a completed Suspense boundary when it is smaller than
      // `progressiveChunkSize` (default 12.8 kB); bigger ones are emitted as a hidden
      // segment + `$RC` swap script even in the static renderer. Our pages are 40–80 kB.
      progressiveChunkSize: 1 << 30,
      onError: (err) => console.error('[prerender] render error for', url, err),
    },
  );
  const html = await new Response(prelude).text();
  const head = collector.head;
  const serialized = head ? headToHtml(head) : { title: 'DonutCoins', tags: '' };
  return { html, title: serialized.title, headTags: serialized.tags, status: collector.status };
}
