/** Discord-authenticated player profiles (store 'users', key = discord user id). */
import type { PublicUser, UserProfile, WonPrize } from '../../src/shared/types';
import { kvGet, kvUpdate } from './store';
import { nowIso } from './http';

const MAX_PRIZES = 50;
const MAX_ORDERS = 200;

export interface DiscordIdentity {
  id: string;
  username: string;
  globalName?: string | null;
  /** Discord avatar hash, or a full https image URL for Google accounts */
  avatar?: string | null;
  provider?: 'discord' | 'google';
}

const GOOGLE_ID = /^g_[A-Za-z0-9_-]{5,128}$/;
export const googleUserId = (sub: string): string => `g_${sub}`;
export const isGoogleId = (id: string): boolean => GOOGLE_ID.test(id);

export function avatarUrl(id: string, avatar?: string | null): string {
  if (isGoogleId(id)) return avatar && /^https:\/\/[a-z0-9.-]+\.googleusercontent\.com\//.test(avatar) ? avatar : '/img/brand/mascot.svg';
  if (avatar) return `https://cdn.discordapp.com/avatars/${id}/${avatar}.${avatar.startsWith('a_') ? 'gif' : 'png'}?size=64`;
  let idx = 0;
  try {
    idx = Number((BigInt(id) >> 22n) % 6n);
  } catch {
    idx = 0;
  }
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

export async function getUser(id: string): Promise<UserProfile | null> {
  if (!/^\d{5,25}$/.test(id) && !isGoogleId(id)) return null;
  return kvGet<UserProfile>('users', id);
}

/** Create or refresh a profile after a Discord or Google login. */
export async function upsertUser(identity: DiscordIdentity, inGuild?: boolean): Promise<UserProfile> {
  const now = nowIso();
  return kvUpdate<UserProfile>('users', identity.id, (cur) => {
    const base: UserProfile = cur ?? { id: identity.id, username: identity.username, createdAt: now, lastLoginAt: now, logins: 0, prizes: [], orderIds: [] };
    return {
      ...base,
      provider: identity.provider ?? (isGoogleId(identity.id) ? 'google' : 'discord'),
      username: identity.username,
      globalName: identity.globalName ?? undefined,
      avatar: identity.avatar ?? undefined,
      inGuild: inGuild === undefined ? base.inGuild : inGuild,
      guildCheckedAt: inGuild === undefined ? base.guildCheckedAt : now,
      lastLoginAt: now,
      logins: (base.logins ?? 0) + 1,
    };
  });
}

export async function updateUser(id: string, patch: Partial<UserProfile>): Promise<UserProfile | null> {
  const existing = await getUser(id);
  if (!existing) return null;
  return kvUpdate<UserProfile>('users', id, (cur) => ({ ...(cur ?? existing), ...patch }));
}

export async function addPrize(id: string, prize: WonPrize): Promise<void> {
  if (!(await getUser(id))) return;
  await kvUpdate<UserProfile>('users', id, (cur) => {
    if (!cur) throw new Error('user vanished');
    return { ...cur, prizes: [prize, ...(cur.prizes ?? [])].slice(0, MAX_PRIZES) };
  });
}

export async function linkOrder(id: string, orderId: string): Promise<void> {
  if (!(await getUser(id))) return;
  await kvUpdate<UserProfile>('users', id, (cur) => {
    if (!cur) throw new Error('user vanished');
    const ids = [orderId, ...(cur.orderIds ?? []).filter((x) => x !== orderId)].slice(0, MAX_ORDERS);
    return { ...cur, orderIds: ids };
  });
}

export function toPublicUser(u: UserProfile): PublicUser {
  return {
    id: u.id,
    username: u.username,
    provider: isGoogleId(u.id) ? 'google' : 'discord',
    displayName: u.globalName || u.username,
    avatarUrl: avatarUrl(u.id, u.avatar),
    mcUsername: u.mcUsername,
    inGuild: u.inGuild,
  };
}
