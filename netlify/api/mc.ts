/**
 * Minecraft username validation against the Mojang profile API, with a
 * per-name cache so the checkout can re-check names for free.
 */
import type { Route } from '../lib/http';
import { getIp, hashIp, json, readJson, requireUsername } from '../lib/http';
import { rateLimit } from '../lib/ratelimit';
import { kvGet, kvSet } from '../lib/store';

interface McValidateResponse {
  valid: boolean;
  name?: string;
  uuid?: string;
  reason?: string;
  /** true when Mojang could not be reached – the name LOOKS fine but is unconfirmed */
  unverified?: boolean;
}

interface CacheEntry {
  valid: boolean;
  name?: string;
  uuid?: string;
  at: number;
}

const MOJANG = 'https://api.mojang.com/users/profiles/minecraft/';
const FOUND_TTL_MS = 24 * 60 * 60 * 1000; // a found account stays found
const NOT_FOUND_TTL_MS = 60 * 60 * 1000; // typos / brand-new accounts: re-check after an hour
const NOT_FOUND_REASON = 'No Minecraft (Java Edition) account with this name was found – check the spelling.';

/** 8-4-4-4-12 formatting for the undashed uuid Mojang returns. */
function dashUuid(raw: string): string {
  const s = raw.replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(s)) return raw;
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

function fromCache(entry: CacheEntry): McValidateResponse {
  return entry.valid ? { valid: true, name: entry.name, uuid: entry.uuid } : { valid: false, reason: NOT_FOUND_REASON };
}

/** Ask Mojang. Returns null when the answer is unknown (network / 429 / 5xx). */
async function lookupMojang(username: string): Promise<CacheEntry | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(`${MOJANG}${encodeURIComponent(username)}`, {
      headers: { accept: 'application/json', 'user-agent': 'DonutCoins-store/1.0 (+username check)' },
      signal: ctrl.signal,
    });
    if (res.status === 200) {
      const data = (await res.json().catch(() => null)) as { id?: string; name?: string } | null;
      if (data?.name && data.id) return { valid: true, name: data.name, uuid: dashUuid(data.id), at: Date.now() };
      return null;
    }
    if (res.status === 204 || res.status === 404 || res.status === 400) return { valid: false, at: Date.now() };
    return null; // 429, 5xx, anything odd
  } catch (err) {
    console.warn('[mc] Mojang lookup failed', (err as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const routes: Route[] = [
  {
    method: 'POST',
    path: '/mc/validate',
    handler: async ({ req, context }) => {
      const body = await readJson<{ username?: unknown }>(req);
      const username = requireUsername(body.username);
      const cacheKey = `mc:${username.toLowerCase()}`;

      const cached = await kvGet<CacheEntry>('misc', cacheKey);
      if (cached && Date.now() - cached.at < (cached.valid ? FOUND_TTL_MS : NOT_FOUND_TTL_MS)) {
        return json(fromCache(cached));
      }

      await rateLimit(`mc:${hashIp(getIp(req, context))}`, 30, 60);

      const result = await lookupMojang(username);
      if (!result) {
        const reply: McValidateResponse = { valid: true, name: username, unverified: true };
        return json(reply);
      }
      await kvSet('misc', cacheKey, result);
      return json(fromCache(result));
    },
  },
];
