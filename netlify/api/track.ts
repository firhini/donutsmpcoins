/**
 *   POST /t   { events: TrackEvent[] }  → 204   (cookieless first-party statistics, see lib/analytics.ts)
 */
import type { Route } from '../lib/http';
import { getIp, hashIp } from '../lib/http';
import { rateLimit } from '../lib/ratelimit';
import { deviceOf, recordEvents, sanitizeEvents, visitorId } from '../lib/analytics';

export const routes: Route[] = [
  {
    method: 'POST',
    path: '/t',
    handler: async ({ req, context }) => {
      const ok = new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
      let body: unknown;
      try {
        body = JSON.parse((await req.text()).slice(0, 20000));
      } catch {
        return ok;
      }
      const events = sanitizeEvents(body);
      if (!events.length) return ok;
      const ipHash = hashIp(getIp(req, context));
      try {
        await rateLimit(`track:${ipHash}`, 120, 60);
      } catch {
        return ok; // over the limit – silently drop
      }
      const ua = req.headers.get('user-agent') || '';
      const country = (context as unknown as { geo?: { country?: { code?: string } } })?.geo?.country?.code;
      await recordEvents(events, { visitor: visitorId(ipHash, ua), device: deviceOf(ua), country }).catch((err) => console.warn('[track]', (err as Error).message));
      return ok;
    },
  },
];
