/**
 * Admin statistics:
 *   GET /admin/analytics?days=14   visitors, pages, buttons, referrers, funnel, daily series
 *   GET /admin/users               every player who logged in (Discord / Google)
 */
import type { OrderStatus, UserProfile } from '../../src/shared/types';
import type { Handler, Route } from '../lib/http';
import { json } from '../lib/http';
import { requireAdmin } from '../lib/auth';
import { getDays } from '../lib/analytics';
import { listOrderIndex } from '../lib/orders';
import { kvGet, kvList } from '../lib/store';
import { getCredit } from '../lib/credit';
import { avatarUrl, isGoogleId } from '../lib/users';

const PAID = new Set<OrderStatus>(['paid', 'delivering', 'delivered']);

function admin(method: Route['method'], path: string, handler: Handler): Route {
  return { method, path, handler: (ctx) => (requireAdmin(ctx.req), handler(ctx)) };
}

function merge(maps: Record<string, number>[], top = 15): { key: string; count: number }[] {
  const total: Record<string, number> = {};
  for (const m of maps) for (const [k, v] of Object.entries(m ?? {})) total[k] = (total[k] ?? 0) + v;
  return Object.entries(total)
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([key, count]) => ({ key, count }));
}

async function loadUsers(): Promise<UserProfile[]> {
  const keys = (await kvList('users')).filter((k) => !k.startsWith('token'));
  const users = await Promise.all(keys.slice(0, 2000).map((k) => kvGet<UserProfile>('users', k)));
  return users.filter((u): u is UserProfile => !!u && typeof u.id === 'string');
}

export const routes: Route[] = [
  admin('GET', '/admin/analytics', async ({ url }) => {
    const days = Math.max(1, Math.min(90, Number.parseInt(url.searchParams.get('days') ?? '14', 10) || 14));
    const [stats, idx, users] = await Promise.all([getDays(days), listOrderIndex(), loadUsers()]);
    const from = stats[0].date;
    const orders = idx.filter((o) => o.createdAt.slice(0, 10) >= from && o.totalCents > 0);
    const signups = users.filter((u) => (u.createdAt ?? '').slice(0, 10) >= from);

    const series = stats.map((s) => {
      const dayOrders = orders.filter((o) => o.createdAt.slice(0, 10) === s.date);
      const paid = dayOrders.filter((o) => PAID.has(o.status));
      return {
        date: s.date,
        visitors: s.visitors.length,
        pageViews: s.pv,
        addToCart: s.events.add_to_cart ?? 0,
        checkouts: s.events.begin_checkout ?? 0,
        orders: dayOrders.length,
        paidOrders: paid.length,
        revenueCents: paid.reduce((n, o) => n + o.totalCents, 0),
        signups: signups.filter((u) => u.createdAt.slice(0, 10) === s.date).length,
      };
    });
    const sum = (k: keyof (typeof series)[number]) => series.reduce((n, d) => n + (d[k] as number), 0);
    return json({
      days,
      series,
      totals: {
        visitors: sum('visitors'),
        pageViews: sum('pageViews'),
        productViews: stats.reduce((n, s) => n + (s.events.product_view ?? 0), 0),
        addToCart: sum('addToCart'),
        checkouts: sum('checkouts'),
        orders: sum('orders'),
        paidOrders: sum('paidOrders'),
        revenueCents: sum('revenueCents'),
        signups: signups.length,
        users: users.length,
      },
      pages: merge(stats.map((s) => s.pages)),
      clicks: merge(stats.map((s) => s.clicks), 25),
      referrers: merge(stats.map((s) => s.refs)),
      productViews: merge(stats.map((s) => s.productViews)),
      cartAdds: merge(stats.map((s) => s.cartAdds)),
      devices: merge(stats.map((s) => s.devices), 5),
      countries: merge(stats.map((s) => s.countries), 12),
    });
  }),

  admin('GET', '/admin/users', async () => {
    const users = (await loadUsers()).sort((a, b) => (b.lastLoginAt ?? '').localeCompare(a.lastLoginAt ?? ''));
    const credits = new Map<string, number>();
    await Promise.all(
      [...new Set(users.map((u) => u.mcUsername?.toLowerCase()).filter((n): n is string => !!n))].slice(0, 300).map(async (n) => credits.set(n, (await getCredit(n)).balanceCents)),
    );
    return json({
      total: users.length,
      users: users.map((u) => ({
        id: u.id,
        provider: isGoogleId(u.id) ? 'google' : 'discord',
        username: u.username,
        displayName: u.globalName || u.username,
        avatarUrl: avatarUrl(u.id, u.avatar),
        mcUsername: u.mcUsername,
        inGuild: u.inGuild,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        logins: u.logins ?? 0,
        orders: u.orderIds?.length ?? 0,
        prizes: u.prizes?.length ?? 0,
        creditCents: u.mcUsername ? (credits.get(u.mcUsername.toLowerCase()) ?? 0) : 0,
      })),
    });
  }),
];
