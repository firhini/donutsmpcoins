/**
 * SEO head management that works for BOTH server pre-rendering and the client.
 * - During pre-rendering (scripts/prerender.mjs) a HeadCollector is provided; <Seo> writes
 *   its data into it during render so the static HTML gets real <title>/<meta>/JSON-LD.
 * - In the browser <Seo> updates the document head in an effect (SPA navigation).
 */
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || '').replace(/\/$/, '');
export const DEFAULT_OG_IMAGE = '/img/brand/og.png';

export function absUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export interface HeadData {
  title: string;
  description?: string;
  /** absolute canonical URL */
  canonical: string;
  robots: string;
  image: string;
  type: string;
  jsonLd: object[];
  status: number;
  siteName: string;
  /** 'summary' for square images (product renders), 'summary_large_image' for 1200×630 art */
  twitterCard: 'summary' | 'summary_large_image';
}

export interface HeadCollector {
  head: HeadData | null;
  status: number;
}

const Ctx = createContext<HeadCollector | null>(null);

export function HeadProvider({ collector, children }: { collector: HeadCollector; children: ReactNode }) {
  return <Ctx.Provider value={collector}>{children}</Ctx.Provider>;
}

export interface SeoProps {
  title: string;
  description?: string;
  /** canonical path (defaults to the current pathname) or absolute URL */
  canonical?: string;
  /** 'index,follow' (default) or 'noindex,nofollow' for private pages */
  robots?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  jsonLd?: object | object[];
  /** HTTP status the pre-renderer should emit (404 for not-found pages) */
  status?: number;
  twitterCard?: 'summary' | 'summary_large_image';
}

export function Seo({ title, description, canonical, robots = 'index,follow', image, type = 'website', jsonLd, status = 200, twitterCard = 'summary_large_image' }: SeoProps) {
  const collector = useContext(Ctx);
  const { pathname } = useLocation();
  const { config } = useStore();
  const canonicalPath = (canonical ?? pathname).replace(/\/+$/, '') || '/';
  const data: HeadData = {
    title,
    description,
    canonical: absUrl(canonicalPath),
    robots,
    image: absUrl(image ?? DEFAULT_OG_IMAGE),
    type,
    jsonLd: jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [],
    status,
    siteName: config.storeName,
    twitterCard,
  };
  if (collector) {
    // server: collect during render (effects never run while pre-rendering)
    collector.head = data;
    collector.status = status;
  }
  const key = JSON.stringify(data);
  useEffect(() => {
    applyHead(JSON.parse(key) as HeadData);
  }, [key]);
  return null;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function applyHead(d: HeadData) {
  document.title = d.title;
  upsertMeta('name', 'description', d.description);
  upsertMeta('name', 'robots', d.robots);
  upsertMeta('property', 'og:title', d.title);
  upsertMeta('property', 'og:description', d.description);
  upsertMeta('property', 'og:url', d.canonical);
  upsertMeta('property', 'og:type', d.type);
  upsertMeta('property', 'og:image', d.image);
  upsertMeta('property', 'og:site_name', d.siteName);
  upsertMeta('name', 'twitter:card', d.twitterCard);
  upsertMeta('name', 'twitter:title', d.title);
  upsertMeta('name', 'twitter:description', d.description);
  upsertMeta('name', 'twitter:image', d.image);
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = d.canonical;
  let script = document.getElementById('seo-jsonld') as HTMLScriptElement | null;
  if (d.jsonLd.length) {
    if (!script) {
      script = document.createElement('script');
      script.id = 'seo-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(d.jsonLd.length === 1 ? d.jsonLd[0] : d.jsonLd);
  } else {
    script?.remove();
  }
}

/** Serialise collected head data to HTML tags for the pre-renderer. */
export function headToHtml(d: HeadData): { title: string; tags: string } {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tags: string[] = [];
  if (d.description) tags.push(`<meta name="description" content="${esc(d.description)}" />`);
  tags.push(`<meta name="robots" content="${esc(d.robots)}" />`);
  tags.push(`<link rel="canonical" href="${esc(d.canonical)}" />`);
  tags.push(`<meta property="og:type" content="${esc(d.type)}" />`);
  tags.push(`<meta property="og:url" content="${esc(d.canonical)}" />`);
  tags.push(`<meta property="og:title" content="${esc(d.title)}" />`);
  if (d.description) tags.push(`<meta property="og:description" content="${esc(d.description)}" />`);
  tags.push(`<meta property="og:image" content="${esc(d.image)}" />`);
  tags.push(`<meta property="og:site_name" content="${esc(d.siteName)}" />`);
  tags.push(`<meta property="og:locale" content="en_US" />`);
  tags.push(`<meta name="twitter:card" content="${d.twitterCard}" />`);
  tags.push(`<meta name="twitter:title" content="${esc(d.title)}" />`);
  if (d.description) tags.push(`<meta name="twitter:description" content="${esc(d.description)}" />`);
  tags.push(`<meta name="twitter:image" content="${esc(d.image)}" />`);
  if (d.jsonLd.length) {
    const json = JSON.stringify(d.jsonLd.length === 1 ? d.jsonLd[0] : d.jsonLd).replace(/</g, '\\u003c');
    tags.push(`<script id="seo-jsonld" type="application/ld+json">${json}</script>`);
  }
  return { title: esc(d.title), tags: tags.join('\n    ') };
}
