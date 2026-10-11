/**
 * Every public, indexable route – used by the pre-renderer and the sitemap.
 * `page` is the source module of the lazy page (to inline its CSS in the static HTML).
 */
import { products, categories } from '../data/catalog';
import { guides } from '../data/guides';
import { landingCopy } from '../data/landingCopy';

export interface SeoRoute {
  path: string;
  page: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
  /** pre-render but keep out of the sitemap */
  sitemap?: boolean;
}

export function seoRoutes(): SeoRoute[] {
  const r: SeoRoute[] = [
    { path: '/', page: 'src/pages/Home.tsx', changefreq: 'daily', priority: 1 },
    { path: '/shop', page: 'src/pages/Shop.tsx', changefreq: 'daily', priority: 0.9 },
    ...categories.map((c) => ({ path: `/shop/${c.slug}`, page: 'src/pages/Shop.tsx', changefreq: 'daily' as const, priority: 0.8 })),
    ...products.filter((p) => !p.hidden).map((p) => ({ path: `/product/${p.slug}`, page: 'src/pages/ProductPage.tsx', changefreq: 'weekly' as const, priority: 0.7 })),
    { path: '/donutsmp-money', page: 'src/pages/landing/MoneyLanding.tsx', changefreq: 'weekly', priority: 0.9 },
    { path: '/donutsmp-spawners', page: 'src/pages/landing/SpawnersLanding.tsx', changefreq: 'weekly', priority: 0.9 },
    { path: '/donutsmp-irl-trade', page: 'src/pages/landing/IrlTradeLanding.tsx', changefreq: 'monthly', priority: 0.8 },
    ...landingCopy.map((l) => ({ path: `/${l.slug}`, page: 'src/pages/LandingPage.tsx', changefreq: 'monthly' as const, priority: 0.8 })),
    { path: '/guides', page: 'src/pages/Guides.tsx', changefreq: 'weekly', priority: 0.8 },
    ...guides.map((g) => ({ path: `/guides/${g.slug}`, page: 'src/pages/GuidePage.tsx', changefreq: 'monthly' as const, priority: 0.8 })),
    { path: '/spin', page: 'src/pages/Spin.tsx', changefreq: 'weekly', priority: 0.7 },
    { path: '/free', page: 'src/pages/Free.tsx', changefreq: 'weekly', priority: 0.7 },
    { path: '/giveaways', page: 'src/pages/Giveaways.tsx', changefreq: 'daily', priority: 0.6 },
    { path: '/reviews', page: 'src/pages/Reviews.tsx', changefreq: 'daily', priority: 0.6 },
    { path: '/referral', page: 'src/pages/Referral.tsx', changefreq: 'monthly', priority: 0.5 },
    { path: '/redeem', page: 'src/pages/Redeem.tsx', changefreq: 'monthly', priority: 0.4 },
    { path: '/faq', page: 'src/pages/Faq.tsx', changefreq: 'monthly', priority: 0.7 },
    { path: '/track', page: 'src/pages/Track.tsx', changefreq: 'yearly', priority: 0.3 },
    { path: '/terms', page: 'src/pages/legal/Terms.tsx', changefreq: 'yearly', priority: 0.2 },
    { path: '/refund-policy', page: 'src/pages/legal/RefundPolicy.tsx', changefreq: 'yearly', priority: 0.2 },
    { path: '/privacy', page: 'src/pages/legal/Privacy.tsx', changefreq: 'yearly', priority: 0.2 },
    { path: '/404', page: 'src/pages/NotFound.tsx', changefreq: 'yearly', priority: 0, sitemap: false },
  ];
  return r;
}
