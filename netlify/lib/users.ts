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
  avatar?: string | null;
}

export function avatarUrl(id: string, avatar?: string | null): string {
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
  if (!/^\d{5,25}$/.test(id)) return null;
  return kvGet<UserProfile>('users', id);
}

/** Create or refresh a profile after a Discord login. */
export async function upsertUser(identity: DiscordIdentity, inGuild?: boolean): Promise<UserProfile> {
  const now = nowIso();
  return kvUpdate<UserProfile>('users', identity.id, (cur) => {
    const base: UserProfile = cur ?? { id: identity.id, username: identity.username, createdAt: now, lastLoginAt: now, logins: 0, prizes: [], orderIds: [] };
    return {
      ...base,
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
    displayName: u.globalName || u.username,
    avatarUrl: avatarUrl(u.id, u.avatar),
    mcUsername: u.mcUsername,
    inGuild: u.inGuild,
  };
}
