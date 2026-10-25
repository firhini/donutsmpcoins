/**
 * Discord OAuth2 login + player account endpoints.
 *
 *   GET  /auth/discord/login?next=/spin   → redirect to Discord (adds guilds.join when DISCORD_BOT_TOKEN is set → auto-join)
 *   GET  /auth/discord/callback           → exchange code, set session cookie, redirect to `next`
 *   GET  /auth/me                         → { user: PublicUser | null, configured: boolean }
 *   POST /auth/logout
 *   POST /auth/mc-username { username }   → save the Minecraft name on the profile
 *   POST /auth/refresh-guild              → re-check Discord server membership
 *   GET  /account                         → AccountSummary (orders, credit, prizes, referral)
 */
import type { Route } from '../lib/http';
import { HttpError, getIp, hashIp, json, readJson, requireUsername, nowIso } from '../lib/http';
import { rateLimit } from '../lib/ratelimit';
import { kvGet, kvSet } from '../lib/store';
import { SESSION_COOKIE, STATE_COOKIE, SESSION_TTL_S, STATE_TTL_S, cookieHeader, clearCookieHeader, newOAuthState, readOAuthState, readSession, sessionCookieValue } from '../lib/session';
import { getUser, toPublicUser, updateUser, upsertUser, type DiscordIdentity } from '../lib/users';
import { listOrderIndex } from '../lib/orders';
import { getCredit } from '../lib/credit';
import { siteUrl } from '../lib/discord';
import type { AccountSummary, PublicUser, UserProfile } from '../../src/shared/types';

const DISCORD_API = 'https://discord.com/api/v10';

function oauthConfig(): { clientId: string; clientSecret: string; guildId?: string } | null {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, guildId: process.env.DISCORD_GUILD_ID || undefined };
}

function requestOrigin(req: Request): string {
  try {
    const u = new URL(req.url);
    // Netlify presents the public URL; locally it is http://localhost:5173
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || /\.netlify\.app$/.test(u.hostname) || u.protocol === 'https:') return u.origin;
  } catch {
    /* ignore */
  }
  return siteUrl();
}

function redirectUri(req: Request): string {
  return `${requestOrigin(req)}/api/auth/discord/callback`;
}

/** Only site-relative paths are allowed as post-login destinations. */
function safeNext(v: string | null | undefined): string {
  if (!v) return '/';
  const s = v.trim();
  return /^\/(?!\/)[A-Za-z0-9\-._~!$&'()*+,;=:@/?%#]*$/.test(s) && !s.startsWith('/api') ? s : '/';
}

function redirect(location: string, cookies: string[] = []): Response {
  const headers = new Headers({ location, 'cache-control': 'no-store' });
  for (const c of cookies) headers.append('set-cookie', c);
  return new Response(null, { status: 302, headers });
}

async function discordFetch<T>(path: string, token: string): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${DISCORD_API}${path}`, { headers: { authorization: `Bearer ${token}` }, signal: ctrl.signal });
    if (!res.ok) throw new HttpError(502, `Discord answered ${res.status} for ${path}`, 'discord_error');
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

async function exchangeCode(req: Request, code: string): Promise<{ access_token: string; expires_in: number; scope: string }> {
  const cfg = oauthConfig();
  if (!cfg) throw new HttpError(503, 'Discord login is not configured.', 'auth_unconfigured');
  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(req),
  });
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${DISCORD_API}/oauth2/token`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body, signal: ctrl.signal });
    const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; scope?: string; error?: string; error_description?: string };
    if (!res.ok || !data.access_token) throw new HttpError(400, `Discord login failed (${data.error_description || data.error || res.status}). Please try again.`, 'oauth_failed');
    return { access_token: data.access_token, expires_in: data.expires_in ?? 0, scope: data.scope ?? '' };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Auto-join: add the player to the store's Discord server with their own OAuth token
 * (scope `guilds.join`). Needs DISCORD_BOT_TOKEN of a bot that is a member of that server
 * with the "Create Invite" permission. 201 = added, 204 = was already a member.
 */
export function autoJoinConfigured(): boolean {
  return !!(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID);
}
async function joinGuild(userToken: string, uid: string, guildId: string): Promise<boolean> {
  const bot = process.env.DISCORD_BOT_TOKEN;
  if (!bot) return false;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${DISCORD_API}/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(uid)}`, {
      method: 'PUT',
      headers: { authorization: `Bot ${bot}`, 'content-type': 'application/json' },
      body: JSON.stringify({ access_token: userToken }),
      signal: ctrl.signal,
    });
    if (res.status === 201 || res.status === 204) return true;
    console.warn('[auth] auto-join failed', res.status, (await res.text().catch(() => '')).slice(0, 200));
    return false;
  } catch (err) {
    console.warn('[auth] auto-join failed', (err as Error).message);
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function checkGuild(token: string, guildId: string): Promise<boolean> {
  try {
    const guilds = await discordFetch<{ id: string }[]>('/users/@me/guilds', token);
    return guilds.some((g) => g.id === guildId);
  } catch (err) {
    console.warn('[auth] guild check failed', (err as Error).message);
    return false;
  }
}

/** Server-side only: remember the access token so membership can be re-checked later. */
async function storeToken(uid: string, token: string, expiresIn: number): Promise<void> {
  await kvSet('users', `token:${uid}`, { token, expiresAt: Date.now() + Math.max(60, expiresIn) * 1000 });
}
async function loadToken(uid: string): Promise<string | null> {
  const t = await kvGet<{ token: string; expiresAt: number }>('users', `token:${uid}`);
  return t && t.expiresAt > Date.now() ? t.token : null;
}

/** Resolve the logged-in profile for a request (null when not logged in). */
export async function currentUser(req: Request): Promise<UserProfile | null> {
  const s = readSession(req);
  if (!s) return null;
  return getUser(s.uid);
}

export function requireUser(user: UserProfile | null): UserProfile {
  if (!user) throw new HttpError(401, 'Please log in with Discord first.', 'login_required');
  return user;
}

export const routes: Route[] = [
  {
    method: 'GET',
    path: '/auth/discord/login',
    handler: async ({ req, url }) => {
      const cfg = oauthConfig();
      if (!cfg) throw new HttpError(503, 'Discord login is not configured on this store yet.', 'auth_unconfigured');
      const next = safeNext(url.searchParams.get('next'));
      const { nonce, cookie } = newOAuthState(next);
      const scope = cfg.guildId ? (autoJoinConfigured() ? 'identify guilds guilds.join' : 'identify guilds') : 'identify';
      const params = new URLSearchParams({ client_id: cfg.clientId, response_type: 'code', redirect_uri: redirectUri(req), scope, state: nonce, prompt: 'none' });
      return redirect(`https://discord.com/oauth2/authorize?${params.toString()}`, [cookieHeader(req, STATE_COOKIE, cookie, STATE_TTL_S)]);
    },
  },
  {
    method: 'GET',
    path: '/auth/discord/callback',
    handler: async ({ req, context, url }) => {
      await rateLimit(`oauth:${hashIp(getIp(req, context))}`, 20, 600);
      const cfg = oauthConfig();
      if (!cfg) throw new HttpError(503, 'Discord login is not configured on this store yet.', 'auth_unconfigured');
      const state = readOAuthState(req);
      const code = url.searchParams.get('code');
      const err = url.searchParams.get('error');
      const next = safeNext(state?.next);
      if (err === 'access_denied' || !code) return redirect(`${next}${next.includes('?') ? '&' : '?'}login=cancelled`, [clearCookieHeader(req, STATE_COOKIE)]);
      if (!state || url.searchParams.get('state') !== state.nonce) {
        return redirect(`${next}${next.includes('?') ? '&' : '?'}login=error`, [clearCookieHeader(req, STATE_COOKIE)]);
      }
      let tokenData;
      try {
        tokenData = await exchangeCode(req, code);
      } catch (e) {
        console.warn('[auth] token exchange failed', (e as Error).message);
        return redirect(`${next}${next.includes('?') ? '&' : '?'}login=error`, [clearCookieHeader(req, STATE_COOKIE)]);
      }
      const me = await discordFetch<{ id: string; username: string; global_name?: string | null; avatar?: string | null }>('/users/@me', tokenData.access_token);
      const identity: DiscordIdentity = { id: me.id, username: me.username, globalName: me.global_name, avatar: me.avatar };
      let inGuild: boolean | undefined;
      if (cfg.guildId && /guilds\.join/.test(tokenData.scope)) inGuild = await joinGuild(tokenData.access_token, me.id, cfg.guildId);
      if (cfg.guildId && !inGuild && /\bguilds\b/.test(tokenData.scope)) inGuild = await checkGuild(tokenData.access_token, cfg.guildId);
      await upsertUser(identity, inGuild);
      await storeToken(me.id, tokenData.access_token, tokenData.expires_in);
      return redirect(`${next}${next.includes('?') ? '&' : '?'}login=1`, [cookieHeader(req, SESSION_COOKIE, sessionCookieValue(me.id), SESSION_TTL_S), clearCookieHeader(req, STATE_COOKIE)]);
    },
  },
  {
    method: 'GET',
    path: '/auth/me',
    handler: async ({ req }) => {
      const configured = !!oauthConfig();
      const user = configured ? await currentUser(req) : null;
      return json({ user: user ? toPublicUser(user) : null, configured, guildRequired: !!process.env.DISCORD_GUILD_ID });
    },
  },
  {
    method: 'POST',
    path: '/auth/logout',
    handler: async ({ req }) => json({ ok: true }, 200, { 'set-cookie': clearCookieHeader(req, SESSION_COOKIE) }),
  },
  {
    method: 'POST',
    path: '/auth/mc-username',
    handler: async ({ req }) => {
      const user = requireUser(await currentUser(req));
      const body = await readJson<{ username?: unknown }>(req);
      const mc = requireUsername(body.username);
      const updated = await updateUser(user.id, { mcUsername: mc });
      return json({ user: toPublicUser(updated ?? user) });
    },
  },
  {
    method: 'POST',
    path: '/auth/refresh-guild',
    handler: async ({ req, context }) => {
      const user = requireUser(await currentUser(req));
      await rateLimit(`guild:${hashIp(getIp(req, context))}`, 10, 60);
      const guildId = process.env.DISCORD_GUILD_ID;
      if (!guildId) return json({ user: toPublicUser(user), inGuild: true });
      const token = await loadToken(user.id);
      if (!token) throw new HttpError(401, 'Please log in again so we can check your Discord membership.', 'relogin');
      const inGuild = (autoJoinConfigured() && (await joinGuild(token, user.id, guildId))) || (await checkGuild(token, guildId));
      const updated = await updateUser(user.id, { inGuild, guildCheckedAt: nowIso() });
      return json({ user: toPublicUser(updated ?? user), inGuild });
    },
  },
  {
    method: 'GET',
    path: '/account',
    handler: async ({ req }) => {
      const user = requireUser(await currentUser(req));
      const idx = await listOrderIndex();
      const mine = idx.filter((e) => e.discordUserId === user.id || user.orderIds?.includes(e.id)).slice(0, 100);
      const credit = user.mcUsername ? (await getCredit(user.mcUsername)).balanceCents : 0;
      let referrals = 0;
      let earnedCents = 0;
      if (user.mcUsername) {
        const mc = user.mcUsername.toLowerCase();
        referrals = idx.filter((e) => e.referralCode?.toLowerCase() === mc && (e.status === 'paid' || e.status === 'delivering' || e.status === 'delivered')).length;
        earnedCents = (await getCredit(user.mcUsername)).history.filter((h) => h.deltaCents > 0 && /^Referral reward/.test(h.reason)).reduce((s, h) => s + h.deltaCents, 0);
      }
      const summary: AccountSummary = {
        user: toPublicUser(user) as PublicUser,
        creditCents: credit,
        orders: mine,
        prizes: user.prizes ?? [],
        referral: { code: user.mcUsername, referrals, earnedCents },
      };
      return json(summary);
    },
  },
];
