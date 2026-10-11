/** Server entry for build-time pre-rendering (scripts/prerender.mjs). */
import { StrictMode } from 'react';
import { renderToReadableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App';
import { HeadProvider, headToHtml, type HeadCollector } from './seo/head';
import './styles/base.css';
import './styles/ui.css';

export { seoRoutes } from './seo/routes';

export async function render(url: string): Promise<{ html: string; title: string; headTags: string; status: number }> {
  const collector: HeadCollector = { head: null, status: 200 };
  const stream = await renderToReadableStream(
    <StrictMode>
      <StaticRouter location={url}>
        <HeadProvider collector={collector}>
          <App />
        </HeadProvider>
      </StaticRouter>
    </StrictMode>,
    { onError: (err) => console.error('[prerender] render error for', url, err) },
  );
  await stream.allReady;
  const html = await new Response(stream).text();
  const head = collector.head;
  const serialized = head ? headToHtml(head) : { title: 'DonutCoins', tags: '' };
  return { html, title: serialized.title, headTags: serialized.tags, status: collector.status };
}
