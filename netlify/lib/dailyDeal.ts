/**
 * Per-player limit for the daily deal: units bought today are counted per Minecraft name AND per
 * hashed IP, so a second username from the same connection does not reset the limit.
 */
import { HttpError } from './http';
import { kvUpdate } from './store';

const key = (date: string, productId: string, who: string) => `deal:${date}:${productId}:${who}`;

async function bump(k: string, delta: number, max?: number): Promise<number> {
  return kvUpdate<number>('misc', k, (cur) => {
    const next = Math.max(0, (cur ?? 0) + delta);
    if (max !== undefined && next > max) {
      const left = Math.max(0, max - (cur ?? 0));
      throw new HttpError(409, left > 0 ? `Today's deal is limited to ${max} per player – you can still get ${left}.` : `You already got today's deal (max ${max} per player). A new deal starts tomorrow!`, 'daily_deal_limit');
    }
    return next;
  });
}

export async function reserveDeal(date: string, productId: string, username: string, ipHash: string | undefined, qty: number, max: number): Promise<void> {
  const userKey = key(date, productId, `u:${username.toLowerCase()}`);
  await bump(userKey, qty, max);
  if (!ipHash) return;
  try {
    await bump(key(date, productId, `ip:${ipHash}`), qty, max);
  } catch (err) {
    await bump(userKey, -qty).catch(() => undefined);
    throw err;
  }
}

export async function releaseDeal(date: string, productId: string, username: string, ipHash: string | undefined, qty: number): Promise<void> {
  await bump(key(date, productId, `u:${username.toLowerCase()}`), -qty);
  if (ipHash) await bump(key(date, productId, `ip:${ipHash}`), -qty);
}
