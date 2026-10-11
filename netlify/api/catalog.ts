/**
 * Public catalog routes: catalog, config, live stats and mystery-box odds.
 */
import type { Review, ReviewStats, SiteStats } from '../../src/shared/types';
import type { Route } from '../lib/http';
import { HttpError, json } from '../lib/http';
import { getCatalog } from '../lib/catalog';
import { getSettings, toPublicConfig } from '../lib/settings';
import { countDelivered } from '../lib/orders';
import { boxOdds } from '../lib/boxes';
import { kvGet, kvList } from '../lib/store';

/**
 * Review statistics. The social module maintains `_stats` in the `reviews`
 * store; until that exists (or if it is malformed) we compute it from the
 * approved reviews – capped so a cold start never gets expensive.
 */
async function reviewStats(): Promise<ReviewStats> {
  try {
    const cached = await kvGet<Partial<ReviewStats>>('reviews', '_stats');
    if (cached && typeof cached.count === 'number' && Number.isFinite(cached.count)) {
      const avg = Number(cached.averageRating);
      return { count: Math.max(0, cached.count), averageRating: Number.isFinite(avg) ? Math.round(avg * 10) / 10 : 0 };
    }
    const keys = (await kvList('reviews', 'rev:')).slice(0, 300);
    let count = 0;
    let sum = 0;
    for (const key of keys) {
      const r = await kvGet<Review>('reviews', key);
      if (r?.status === 'approved' && r.rating >= 1 && r.rating <= 5) {
        count += 1;
        sum += r.rating;
      }
    }
    return { count, averageRating: count ? Math.round((sum / count) * 10) / 10 : 0 };
  } catch (err) {
    console.warn('[catalog] review stats unavailable', err);
    return { count: 0, averageRating: 0 };
  }
}

export const routes: Route[] = [
  {
    method: 'GET',
    path: '/catalog',
    handler: async () => json(await getCatalog(), 200, { 'cache-control': 'public, max-age=30' }),
  },
  {
    method: 'GET',
    path: '/config',
    handler: async () => json(toPublicConfig(await getSettings())),
  },
  {
    method: 'GET',
    path: '/stats',
    handler: async () => {
      const [settings, delivered, reviews] = await Promise.all([
        getSettings(),
        countDelivered().catch((err) => {
          console.warn('[catalog] countDelivered failed', err);
          return 0;
        }),
        reviewStats(),
      ]);
      const offset = Number(settings.stats?.ordersOffset ?? 0);
      const stats: SiteStats = {
        ordersDelivered: Math.max(0, delivered + (Number.isFinite(offset) ? Math.round(offset) : 0)),
        reviewCount: reviews.count,
        averageRating: reviews.averageRating,
      };
      return json(stats, 200, { 'cache-control': 'public, max-age=60' });
    },
  },
  {
    method: 'GET',
    path: '/products/:id/odds',
    handler: async ({ params }) => {
      const id = params.id.trim().toLowerCase();
      const catalog = await getCatalog();
      const product = catalog.products.find((p) => p.id.toLowerCase() === id) ?? catalog.products.find((p) => p.slug.toLowerCase() === id);
      if (!product) throw new HttpError(404, 'Product not found.', 'not_found');
      if (product.kind === 'box') {
        return json({ odds: boxOdds(product), rolls: Math.max(1, product.boxRolls ?? 3), kind: product.kind }, 200, { 'cache-control': 'public, max-age=60' });
      }
      // kits / bundles have fixed contents – every line is guaranteed
      const odds = (product.contents ?? []).map((c) => ({ name: c.name, percent: 100 }));
      return json({ odds, rolls: odds.length, kind: product.kind }, 200, { 'cache-control': 'public, max-age=60' });
    },
  },
];
