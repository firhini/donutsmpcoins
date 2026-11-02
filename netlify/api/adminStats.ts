/**
 * Admin statistics:
 *   GET /admin/analytics?days=14   visitors, pages, buttons, referrers, funnel, daily series
 *   GET /admin/users               every player who logged in (Discord / Google)
 *   GET /admin/sessions?days=7     visitor journeys (only visitors who accepted cookies)
 *   GET /admin/sessions/:id        one journey with its orders
 */
import type { OrderStatus, UserProfile } from '../../src/shared/types';
import type { Handler, Route } from '../lib/http';
import { json } from '../lib/http';
import { requireAdmin } from '../lib/auth';
import { getDays, getSession, recentSessions, sourceLabel, type Session } from '../lib/analytics';
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
    // attribution: which source (creator code, utm, referring site) brought paid orders – consented visitors only
    const sessions = await recentSessions(days, 1500);
    const byOrder = new Map(orders.map((o) => [o.id, o]));
    const srcMap = new Map<string, { visits: number; orders: number; revenueCents: number }>();
    for (const s of sessions) {
      const k = sourceLabel(s.source);
      const row = srcMap.get(k) ?? { visits: 0, orders: 0, revenueCents: 0 };
      row.visits += 1;
      for (const id of s.orderIds) {
        const o = byOrder.get(id);
        if (o && PAID.has(o.status)) {
          row.orders += 1;
          row.revenueCents += o.totalCents;
        }
      }
      srcMap.set(k, row);
    }
    const sources = [...srcMap.entries()].map(([source, r]) => ({ source, ...r })).sort((a, b) => b.revenueCents - a.revenueCents || b.visits - a.visits).slice(0, 20);
    const clicksAll = stats.map((s) => s.clicks);
    const consentYes = clicksAll.reduce((n, c) => n + (c['consent › accepted'] ?? 0), 0);
    const consentNo = clicksAll.reduce((n, c) => n + (c['consent › declined'] ?? 0), 0);
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
      sources,
      consent: { accepted: consentYes, declined: consentNo, trackedVisits: sessions.length },
      countries: merge(stats.map((s) => s.countries), 12),
    });
  }),

  admin('GET', '/admin/sessions', async ({ url }) => {
    const days = Math.max(1, Math.min(30, Number.parseInt(url.searchParams.get('days') ?? '7', 10) || 7));
    const [sessions, idx] = await Promise.all([recentSessions(days, 300), listOrderIndex()]);
    const byOrder = new Map(idx.map((o) => [o.id, o]));
    return json({
      sessions: sessions.map((s: Session) => {
        const paid = s.orderIds.map((id) => byOrder.get(id)).filter((o) => o && PAID.has(o.status));
        return {
          id: s.id,
          startedAt: s.startedAt,
          durationSec: Math.round((new Date(s.lastAt).getTime() - new Date(s.startedAt).getTime()) / 1000),
          source: sourceLabel(s.source),
          landing: s.source.landing,
          device: s.device,
          country: s.country,
          pages: s.events.filter((e) => e.e === 'pv').length,
          clicks: s.events.filter((e) => e.e === 'click' || e.e === 'login_click').length,
          cartAdds: s.events.filter((e) => e.e === 'add_to_cart').length,
          orders: s.orderIds.length,
          paidCents: paid.reduce((n, o) => n + (o?.totalCents ?? 0), 0),
          loggedIn: !!s.userId,
        };
      }),
    });
  }),

  admin('GET', '/admin/sessions/:id', async ({ params }) => {
    const s = await getSession(params.id);
    if (!s) return json({ error: 'Session not found', code: 'not_found' }, 404);
    const idx = await listOrderIndex();
    return json({ session: { ...s, sourceLabel: sourceLabel(s.source) }, orders: idx.filter((o) => s.orderIds.includes(o.id)) });
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
