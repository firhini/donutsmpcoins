import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
// api-helpers MUST be imported first – it relocates the file store before loading the API.
import { call, cleanupTestData, get, lib, orderBody, post } from './api-helpers';
import type { AccountSummary, PublicOrder, PublicUser, SiteSettings, SpinStatus } from '../src/shared/types';

afterAll(() => cleanupTestData());

const realFetch = globalThis.fetch;
const DISCORD_USER = { id: '123456789012345678', username: 'farhan', global_name: 'Farhan', avatar: 'abc123' };
const GOOGLE_USER = { sub: '109876543210987654321', name: 'Gina G', picture: 'https://lh3.googleusercontent.com/a/abc=s96-c' };
let inGuild = true;
let joinFails = false;
const joinCalls: { auth: string; body: string }[] = [];

function mockDiscord() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === 'https://oauth2.googleapis.com/token') {
        const body = String(init?.body);
        if (!body.includes('code=good') || !body.includes('redirect_uri=') || !body.includes('%2Fapi%2Fauth%2Fgoogle%2Fcallback')) return new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 });
        return new Response(JSON.stringify({ access_token: 'gtok', expires_in: 3599, id_token: 'x' }), { status: 200 });
      }
      if (url === 'https://openidconnect.googleapis.com/v1/userinfo') {
        if ((init?.headers as Record<string, string>)?.authorization !== 'Bearer gtok') return new Response('{}', { status: 401 });
        return new Response(JSON.stringify(GOOGLE_USER), { status: 200 });
      }
      if (url.endsWith('/oauth2/token')) {
        const body = String(init?.body);
        if (!body.includes('code=good')) return new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 });
        return new Response(JSON.stringify({ access_token: 'tok', expires_in: 604800, scope: process.env.DISCORD_BOT_TOKEN ? 'identify guilds guilds.join' : 'identify guilds' }), { status: 200 });
      }
      if (url.endsWith('/users/@me')) return new Response(JSON.stringify(DISCORD_USER), { status: 200 });
      if (url.endsWith('/users/@me/guilds')) return new Response(JSON.stringify(inGuild ? [{ id: 'guild-1' }] : []), { status: 200 });
      if (url.includes('/guilds/guild-1/members/') && init?.method === 'PUT') {
        joinCalls.push({ auth: String((init.headers as Record<string, string>).authorization), body: String(init.body) });
        if (joinFails) return new Response('{"message":"Missing Permissions"}', { status: 403 });
        inGuild = true;
        return new Response(null, { status: 204 });
      }
      return realFetch(input, init);
    }),
  );
}

function cookiesFrom(res: { headers: Headers }): string {
  const raw = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [res.headers.get('set-cookie') ?? ''];
  return raw
    .map((c) => c.split(';')[0])
    .filter((c) => c && !c.endsWith('='))
    .join('; ');
}

async function loginAs(next = '/spin'): Promise<string> {
  const start = await get(`/auth/discord/login?next=${encodeURIComponent(next)}`);
  expect(start.status).toBe(302);
  const loc = start.headers.get('location')!;
  expect(loc).toContain('https://discord.com/oauth2/authorize');
  const state = new URL(loc).searchParams.get('state')!;
  const stateCookie = cookiesFrom(start);
  const cb = await get(`/auth/discord/callback?code=good&state=${state}`, { headers: { cookie: stateCookie } });
  expect(cb.status).toBe(302);
  expect(cb.headers.get('location')).toBe(`${next}?login=1`);
  const session = cookiesFrom(cb);
  expect(session).toContain('dc_session=');
  return session.split('; ').find((c) => c.startsWith('dc_session='))!;
}

beforeAll(() => {
  process.env.DISCORD_CLIENT_ID = 'cid';
  process.env.DISCORD_CLIENT_SECRET = 'csecret';
  process.env.DISCORD_GUILD_ID = 'guild-1';
  mockDiscord();
});
afterEach(() => {
  inGuild = true;
});
afterAll(() => {
  vi.unstubAllGlobals();
  delete process.env.DISCORD_CLIENT_ID;
  delete process.env.DISCORD_CLIENT_SECRET;
  delete process.env.DISCORD_GUILD_ID;
});

describe('Discord login', () => {
  it('reports configuration and anonymous state', async () => {
    const me = await get<{ user: PublicUser | null; configured: boolean }>('/auth/me');
    expect(me.status).toBe(200);
    expect(me.data).toMatchObject({ user: null, configured: true });
  });

  it('rejects a callback without a matching state', async () => {
    const cb = await get('/auth/discord/callback?code=good&state=forged');
    expect(cb.status).toBe(302);
    expect(cb.headers.get('location')).toContain('login=error');
    expect(cookiesFrom(cb)).not.toContain('dc_session=');
  });

  it('logs in through the OAuth callback and exposes the profile', async () => {
    const cookie = await loginAs('/account');
    const me = await get<{ user: PublicUser }>('/auth/me', { headers: { cookie } });
    expect(me.data.user).toMatchObject({ id: DISCORD_USER.id, username: 'farhan', displayName: 'Farhan', inGuild: true });
    expect(me.data.user.avatarUrl).toContain(DISCORD_USER.id);
    // tampered cookie is ignored
    const bad = await get<{ user: PublicUser | null }>('/auth/me', { headers: { cookie: cookie.slice(0, -3) + 'xyz' } });
    expect(bad.data.user).toBeNull();
    // logout clears the cookie
    const out = await post('/auth/logout', {}, { headers: { cookie } });
    expect(out.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('only allows site-relative next targets', async () => {
    const start = await get('/auth/discord/login?next=https://evil.example/phish');
    const state = new URL(start.headers.get('location')!).searchParams.get('state')!;
    const cb = await get(`/auth/discord/callback?code=good&state=${state}`, { headers: { cookie: cookiesFrom(start) } });
    expect(cb.headers.get('location')).toBe('/?login=1');
  });

  it('saves the Minecraft username and lists account data', async () => {
    const cookie = await loginAs();
    expect((await post('/auth/mc-username', { username: 'Not Valid!' }, { headers: { cookie } })).status).toBe(400);
    const saved = await post<{ user: PublicUser }>('/auth/mc-username', { username: 'FarhanMC' }, { headers: { cookie } });
    expect(saved.data.user.mcUsername).toBe('FarhanMC');
    // an order placed while logged in is linked to the account
    const order = await post<{ order: PublicOrder }>('/orders', orderBody({ username: 'FarhanMC' }), { headers: { cookie } });
    expect(order.status).toBe(201);
    const acc = await get<AccountSummary>('/account', { headers: { cookie } });
    expect(acc.status).toBe(200);
    expect(acc.data.orders.map((o) => o.id)).toContain(order.data.order.id);
    expect(acc.data.user.mcUsername).toBe('FarhanMC');
    expect((await get('/account')).status).toBe(401);
    const full = await lib.orders.getOrder(order.data.order.id);
    expect(full?.discordUserId).toBe(DISCORD_USER.id);
    // …but the public order page (anyone with the id) does not reveal the buyer's Discord identity
    const pub = await get<{ order: Record<string, unknown> }>(`/orders/${order.data.order.id}`);
    expect(pub.data.order).not.toHaveProperty('discordUserId');
    expect(pub.data.order).not.toHaveProperty('discordUsername');

    // store credit balance: only visible to the player who proved the name
    await lib.credit.addCredit('FarhanMC', 300, 'test');
    expect((await get<{ balanceCents: number }>('/credit?username=FarhanMC', { headers: { cookie } })).data.balanceCents).toBe(300);
    expect((await get<{ balanceCents: number; locked?: boolean }>('/credit?username=FarhanMC')).data).toEqual({ balanceCents: 0, locked: true });
  });
});

describe('Google login', () => {
  async function googleLogin(next = '/account'): Promise<string> {
    const start = await get(`/auth/google/login?next=${encodeURIComponent(next)}`);
    expect(start.status).toBe(302);
    const loc = new URL(start.headers.get('location')!);
    expect(loc.origin + loc.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(loc.searchParams.get('scope')).toBe('openid profile');
    expect(loc.searchParams.get('redirect_uri')).toMatch(/\/api\/auth\/google\/callback$/);
    const cb = await get(`/auth/google/callback?code=good&state=${loc.searchParams.get('state')}`, { headers: { cookie: cookiesFrom(start) } });
    expect(cb.headers.get('location')).toBe(`${next}?login=1`);
    return cookiesFrom(cb).split('; ').find((c) => c.startsWith('dc_session='))!;
  }

  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = 'gid';
    process.env.GOOGLE_CLIENT_SECRET = 'gsecret';
  });
  afterAll(() => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });

  it('is reported as a provider and rejects forged state', async () => {
    const me = await get<{ providers: Record<string, boolean> }>('/auth/me');
    expect(me.data.providers).toEqual({ discord: true, google: true });
    const cb = await get('/auth/google/callback?code=good&state=forged');
    expect(cb.headers.get('location')).toContain('login=error');
    expect(cookiesFrom(cb)).not.toContain('dc_session=');
  });

  it('logs in, orders and uses credit like a Discord account – without a Discord identity on the order', async () => {
    const cookie = await googleLogin();
    const me = await get<{ user: PublicUser }>('/auth/me', { headers: { cookie } });
    expect(me.data.user).toMatchObject({ id: `g_${GOOGLE_USER.sub}`, provider: 'google', displayName: 'Gina G', avatarUrl: GOOGLE_USER.picture });
    await post('/auth/mc-username', { username: 'GinaMC' }, { headers: { cookie } });
    const order = await post<{ order: PublicOrder }>('/orders', orderBody({ username: 'GinaMC' }), { headers: { cookie } });
    expect(order.status).toBe(201);
    const full = await lib.orders.getOrder(order.data.order.id);
    expect(full?.discordUserId).toBeUndefined();
    const acc = await get<AccountSummary>('/account', { headers: { cookie } });
    expect(acc.data.orders.map((o) => o.id)).toContain(order.data.order.id);
    await lib.credit.addCredit('GinaMC', 150, 'test');
    expect((await get<{ balanceCents: number }>('/credit?username=GinaMC', { headers: { cookie } })).data.balanceCents).toBe(150);
    // membership can only be checked for Discord accounts
    const re = await post('/auth/refresh-guild', {}, { headers: { cookie } });
    expect(re.status).toBe(400);
    expect(re.data.code).toBe('discord_required');
  });

  it('keeps login-required spins working when only Google is configured', async () => {
    const saved = { id: process.env.DISCORD_CLIENT_ID, secret: process.env.DISCORD_CLIENT_SECRET };
    delete process.env.DISCORD_CLIENT_ID;
    delete process.env.DISCORD_CLIENT_SECRET;
    try {
      await lib.settings.saveSettings({ spin: { enabled: true, cooldownHours: 24, requireUsername: false, requireLogin: true, requireGuild: true, prizes: [{ id: 'c', label: 'credit', type: 'credit', creditCents: 100, weight: 1 }] } } as Partial<SiteSettings>);
      expect((await post('/spin', { deviceId: 'g-anon' }, { ip: '10.30.0.1' })).data.code).toBe('login_required');
      const me = await get<{ providers: Record<string, boolean>; guildRequired: boolean }>('/auth/me');
      expect(me.data).toMatchObject({ providers: { discord: false, google: true }, guildRequired: false });
      const cookie = await googleLogin('/spin');
      const r = await post('/spin', { deviceId: 'g-dev' }, { ip: '10.30.0.2', headers: { cookie } });
      expect(r.status, JSON.stringify(r.data)).toBe(200);
    } finally {
      process.env.DISCORD_CLIENT_ID = saved.id;
      process.env.DISCORD_CLIENT_SECRET = saved.secret;
      await lib.settings.saveSettings({ spin: { requireLogin: false, requireGuild: false } } as Partial<SiteSettings>);
    }
  });
});

describe('login-gated spin wheel', () => {
  it('requires login when the setting is on, then limits one spin per account', async () => {
    await lib.settings.saveSettings({ spin: { enabled: true, cooldownHours: 24, requireUsername: false, requireLogin: true, requireGuild: false, prizes: [{ id: 'c', label: 'credit', type: 'credit', creditCents: 100, weight: 1 }] } } as Partial<SiteSettings>);
    const anon = await post('/spin', { deviceId: 'anon-dev' }, { ip: '10.20.0.1' });
    expect(anon.status).toBe(401);
    expect(anon.data.code).toBe('login_required');
    const st = await get<SpinStatus>('/spin/status?deviceId=anon-dev', { ip: '10.20.0.1' });
    expect(st.data.loginRequired).toBe(true);
    expect(st.data.canSpin).toBe(false);

    const cookie = await loginAs();
    await post('/auth/mc-username', { username: 'SpinAcct' }, { headers: { cookie } });
    const first = await post<{ prize: { label: string }; creditCents: number }>('/spin', { deviceId: 'dev-a' }, { ip: '10.20.0.2', headers: { cookie } });
    expect(first.status, JSON.stringify(first.data)).toBe(200);
    expect(first.data.creditCents).toBe(100);
    // same account, different device AND ip → still blocked
    const second = await post('/spin', { deviceId: 'dev-b' }, { ip: '10.20.0.3', headers: { cookie } });
    expect(second.status).toBe(429);
    const acc = await get<AccountSummary>('/account', { headers: { cookie } });
    expect(acc.data.prizes[0]).toMatchObject({ label: 'credit', creditCents: 100 });
    expect(acc.data.creditCents).toBe(100);
  });

  it('requires server membership when enabled and re-checks it on demand', async () => {
    await lib.settings.saveSettings({ spin: { requireLogin: true, requireGuild: true } } as Partial<SiteSettings>);
    await lib.store.kvDelete('spins', `user:${DISCORD_USER.id}`); // the mock always logs in the same account – reset its daily spin
    inGuild = false;
    const cookie = await loginAs();
    const blocked = await post('/spin', { deviceId: 'dev-g' }, { ip: '10.20.0.9', headers: { cookie } });
    expect(blocked.status).toBe(403);
    expect(blocked.data.code).toBe('join_discord');
    inGuild = true;
    const re = await post<{ inGuild: boolean }>('/auth/refresh-guild', {}, { headers: { cookie } });
    expect(re.data.inGuild).toBe(true);
    const ok = await post('/spin', { deviceId: 'dev-g2' }, { ip: '10.20.0.10', headers: { cookie } });
    expect(ok.status).toBe(200);
  });

  it('auto-joins the Discord server on login when a bot token is configured', async () => {
    process.env.DISCORD_BOT_TOKEN = 'bot-secret';
    try {
      inGuild = false;
      joinCalls.length = 0;
      const start = await get('/auth/discord/login?next=/spin');
      expect(new URL(start.headers.get('location')!).searchParams.get('scope')).toBe('identify guilds guilds.join');
      const cookie = await loginAs();
      expect(joinCalls).toHaveLength(1);
      expect(joinCalls[0].auth).toBe('Bot bot-secret');
      expect(JSON.parse(joinCalls[0].body)).toEqual({ access_token: 'tok' });
      const me = await get<{ user: PublicUser }>('/auth/me', { headers: { cookie } });
      expect(me.data.user.inGuild).toBe(true);

      // join refused (bot lacks permission) → falls back to the membership check, login still works
      inGuild = false;
      joinFails = true;
      const cookie2 = await loginAs();
      const me2 = await get<{ user: PublicUser }>('/auth/me', { headers: { cookie: cookie2 } });
      expect(me2.data.user.inGuild).toBe(false);
    } finally {
      delete process.env.DISCORD_BOT_TOKEN;
      joinFails = false;
    }
  });

  it('spins anonymously again when login is not required', async () => {
    await lib.settings.saveSettings({ spin: { requireLogin: false, requireGuild: false } } as Partial<SiteSettings>);
    const r = await post('/spin', { deviceId: 'dev-anon-2', username: 'AnonSpinner' }, { ip: '10.20.0.20' });
    expect(r.status).toBe(200);
  });
});
