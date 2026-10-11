import { kvUpdate } from './store';
import { HttpError } from './http';

interface Bucket {
  hits: number[];
}

/**
 * Sliding-window rate limit backed by the kv store. The check and the
 * increment happen inside ONE atomic update, so parallel requests cannot all
 * slip through. key: e.g. `orders:${ipHash}`. Throws 429 when exceeded.
 */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<void> {
  const now = Date.now();
  const since = now - windowSeconds * 1000;
  await kvUpdate<Bucket>('ratelimit', `rl:${key}`, (cur) => {
    const hits = (cur?.hits ?? []).filter((t) => t > since);
    if (hits.length >= max) {
      const retryIn = Math.ceil((hits[0] + windowSeconds * 1000 - now) / 1000);
      throw new HttpError(429, `Too many requests – try again in ${Math.max(1, retryIn)}s.`, 'rate_limited');
    }
    hits.push(now);
    return { hits };
  });
}
