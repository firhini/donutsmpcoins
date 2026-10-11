/**
 * Giveaways. Stored in the `giveaways` store (gw:<id> + _index) with entries in
 * `giveaway-entries`:
 *   <gwId>:<usernameLower>   → GiveawayEntry   (one entry per player)
 *   <gwId>:dev:<deviceId>    → { username }    (one entry per browser)
 */
import { randomInt } from 'node:crypto';
import type { Giveaway, GiveawayEntry } from '../../src/shared/types';
import { kvDelete, kvGet, kvList, kvSet, kvUpdate } from './store';
import { uuid } from './ids';
import { HttpError, nowIso } from './http';

const INDEX_KEY = '_index';
const MAX_INDEX = 500;
const ID_RE = /^[a-f0-9]{32}$/;

export interface CreateGiveawayInput {
  title: string;
  description?: string;
  prize: string;
  endsAt: string;
  maxWinners?: number;
  image?: string;
}

const key = (id: string) => `gw:${id}`;
const entryKey = (gwId: string, username: string) => `${gwId}:${username.trim().toLowerCase()}`;
const deviceKey = (gwId: string, deviceId: string) => `${gwId}:dev:${deviceId}`;

export function isLive(g: Giveaway, now = Date.now()): boolean {
  return g.status === 'active' && new Date(g.endsAt).getTime() > now;
}

export async function getGiveaway(id: string): Promise<Giveaway | null> {
  const clean = id.trim().toLowerCase();
  if (!ID_RE.test(clean)) return null;
  return kvGet<Giveaway>('giveaways', key(clean));
}

export async function saveGiveaway(g: Giveaway): Promise<void> {
  await kvSet('giveaways', key(g.id), g);
  await kvUpdate<string[]>('giveaways', INDEX_KEY, (cur) => {
    const list = (cur ?? []).filter((x) => x !== g.id);
    list.unshift(g.id);
    return list.slice(0, MAX_INDEX);
  });
}

/** All giveaways, newest first. Active ones whose end has passed are marked 'ended' (persisted). */
export async function listGiveaways(): Promise<Giveaway[]> {
  let ids = (await kvGet<string[]>('giveaways', INDEX_KEY)) ?? [];
  if (!ids.length) {
    const keys = await kvList('giveaways', 'gw:');
    ids = keys.map((k) => k.slice(3));
  }
  const out: Giveaway[] = [];
  for (let i = 0; i < ids.length; i += 25) {
    const chunk = await Promise.all(ids.slice(i, i + 25).map((id) => kvGet<Giveaway>('giveaways', key(id))));
    for (const g of chunk) if (g && typeof g.id === 'string') out.push(await refreshGiveawayStatus(g));
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Mark an active giveaway as 'ended' once its end time passed. */
export async function refreshGiveawayStatus(g: Giveaway, now = Date.now()): Promise<Giveaway> {
  if (g.status === 'active' && new Date(g.endsAt).getTime() <= now) {
    g.status = 'ended';
    await kvSet('giveaways', key(g.id), g);
  }
  return g;
}

export async function createGiveaway(input: CreateGiveawayInput): Promise<Giveaway> {
  const now = nowIso();
  const g: Giveaway = {
    id: uuid(),
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    prize: input.prize.trim(),
    image: input.image?.trim() || undefined,
    startsAt: now,
    endsAt: new Date(input.endsAt).toISOString(),
    status: 'active',
    entriesCount: 0,
    maxWinners: Math.max(1, Math.floor(input.maxWinners ?? 1)),
    createdAt: now,
  };
  await saveGiveaway(g);
  return g;
}

export async function getEntry(gwId: string, username: string): Promise<GiveawayEntry | null> {
  return kvGet<GiveawayEntry>('giveaway-entries', entryKey(gwId, username));
}

export async function deviceEntry(gwId: string, deviceId: string): Promise<{ username: string } | null> {
  return kvGet<{ username: string }>('giveaway-entries', deviceKey(gwId, deviceId));
}

export interface AddEntryInput {
  username: string;
  deviceId?: string;
  ipHash?: string;
}

const MAX_ENTRIES_PER_IP = 3;
const ipKey = (gwId: string, ipHash: string) => `${gwId}:ip:${ipHash}`;

/**
 * Enter a giveaway. One entry per username and per device, at most a few per
 * IP. Every marker is written with an atomic compare-and-swap, so parallel
 * requests cannot create duplicate entries or inflate the counter.
 */
export async function addEntry(g: Giveaway, input: AddEntryInput): Promise<{ entry: GiveawayEntry; giveaway: Giveaway }> {
  if (!isLive(g)) throw new HttpError(409, 'This giveaway has ended – entries are closed.', 'ended');
  const entry: GiveawayEntry = {
    giveawayId: g.id,
    username: input.username.trim(),
    createdAt: nowIso(),
    ipHash: input.ipHash,
    deviceId: input.deviceId,
  };
  // 1) username marker
  await kvUpdate<GiveawayEntry>('giveaway-entries', entryKey(g.id, entry.username), (cur) => {
    if (cur) throw new HttpError(409, 'You already entered this giveaway – good luck!', 'already_entered');
    return entry;
  });
  const rollback = async () => kvDelete('giveaway-entries', entryKey(g.id, entry.username));
  // 2) device marker
  if (input.deviceId) {
    try {
      await kvUpdate<{ username: string }>('giveaway-entries', deviceKey(g.id, input.deviceId), (cur) => {
        if (cur) throw new HttpError(409, 'This device already entered the giveaway with another username.', 'device_entered');
        return { username: entry.username };
      });
    } catch (err) {
      await rollback();
      throw err;
    }
  }
  // 3) per-IP cap
  if (input.ipHash) {
    try {
      await kvUpdate<{ count: number }>('giveaway-entries', ipKey(g.id, input.ipHash), (cur) => {
        if ((cur?.count ?? 0) >= MAX_ENTRIES_PER_IP) throw new HttpError(409, `Too many entries from your connection (max ${MAX_ENTRIES_PER_IP} per giveaway).`, 'ip_limit');
        return { count: (cur?.count ?? 0) + 1 };
      });
    } catch (err) {
      await rollback();
      if (input.deviceId) await kvDelete('giveaway-entries', deviceKey(g.id, input.deviceId));
      throw err;
    }
  }
  const giveaway = await kvUpdate<Giveaway>('giveaways', key(g.id), (cur) => {
    const base = cur ?? g;
    return { ...base, entriesCount: (base.entriesCount ?? 0) + 1 };
  });
  return { entry, giveaway };
}

/** Every entry of a giveaway, oldest first. */
export async function listEntries(gwId: string): Promise<GiveawayEntry[]> {
  const keys = (await kvList('giveaway-entries', `${gwId}:`)).filter((k) => !k.includes(':dev:') && !k.includes(':ip:'));
  const out: GiveawayEntry[] = [];
  for (let i = 0; i < keys.length; i += 25) {
    const chunk = await Promise.all(keys.slice(i, i + 25).map((k) => kvGet<GiveawayEntry>('giveaway-entries', k)));
    for (const e of chunk) if (e && typeof e.username === 'string') out.push(e);
  }
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Pick `count` distinct winners with crypto-secure randomness (partial Fisher–Yates). */
export function pickWinners(usernames: string[], count: number): string[] {
  const pool = Array.from(new Map(usernames.map((u) => [u.toLowerCase(), u])).values());
  const n = Math.min(Math.max(0, Math.floor(count)), pool.length);
  for (let i = 0; i < n; i++) {
    const j = i + randomInt(0, pool.length - i);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/** Draw the winners, close the giveaway and persist it. */
export async function drawGiveaway(g: Giveaway): Promise<{ giveaway: Giveaway; winners: string[] }> {
  const entries = await listEntries(g.id);
  const winners = pickWinners(entries.map((e) => e.username), g.maxWinners);
  g.status = 'drawn';
  g.winners = winners;
  g.entriesCount = entries.length;
  await saveGiveaway(g);
  return { giveaway: g, winners };
}
