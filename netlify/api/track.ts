/**
 *   POST /t   { events: TrackEvent[], sid?, src? }  → 204
 *   Cookieless daily statistics for everyone; with cookie consent the browser also sends a session id
 *   and the first-touch source, which build a per-visitor journey (see lib/analytics.ts).
 */
import type { Route } from '../lib/http';
import { getIp, hashIp } from '../lib/http';
import { rateLimit } from '../lib/ratelimit';
import { SESSION_ID_RE, deviceOf, recordEvents, recordJourney, sanitizeEvents, sanitizeSource, visitorId } from '../lib/analytics';
import { readSession } from '../lib/session';

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
      // per-visitor journey – the browser only sends a session id after the visitor accepted cookies
      const sid = (body as { sid?: unknown }).sid;
      if (typeof sid === 'string' && SESSION_ID_RE.test(sid)) {
        const source = sanitizeSource((body as { src?: unknown }).src);
        await recordJourney(sid, events, { device: deviceOf(ua), country, source, userId: readSession(req)?.uid }).catch((err) => console.warn('[track] journey', (err as Error).message));
      }
      return ok;
    },
  },
];
