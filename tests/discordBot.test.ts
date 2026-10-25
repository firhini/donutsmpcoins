import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
// api-helpers MUST be imported first – it relocates the file store before loading the API.
import { call, cleanupTestData, lib } from './api-helpers';
import { generateKeyPairSync, sign } from 'node:crypto';

afterAll(() => cleanupTestData());

const realFetch = globalThis.fetch;
const GUILD = '111111111111111111';
const APP = '222222222222222222';
const keys = generateKeyPairSync('ed25519');
const PUBLIC_HEX = (keys.publicKey.export({ format: 'der', type: 'spki' }) as Buffer).subarray(-32).toString('hex');

/** Minimal in-memory Discord guild behind the REST API. */
const guild = {
  roles: [{ id: GUILD, name: '@everyone' }] as { id: string; name: string }[],
  channels: [] as { id: string; name: string; type: number; parent_id?: string | null }[],
  messages: new Map<string, { channelId: string; body: Record<string, unknown> }>(),
  memberRoles: new Map<string, Set<string>>(),
  backgroundCalls: 0,
  backgroundUnavailable: false,
  edits: 0,
  nextId: 900000000000000000n,
};
const newId = () => String(guild.nextId++);

function mockDiscord() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      const ok = (data: unknown, status = 200) => new Response(data === undefined ? null : JSON.stringify(data), { status });
      if (url.includes('/.netlify/functions/discord-setup-background')) {
        guild.backgroundCalls++;
        return new Response(null, { status: guild.backgroundUnavailable ? 404 : 202 });
      }
      if (!url.startsWith('https://discord.com/api/v10')) return realFetch(input, init);
      const path = url.replace('https://discord.com/api/v10', '');
      let m: RegExpMatchArray | null;
      if (path === `/guilds/${GUILD}/roles` && method === 'GET') return ok(guild.roles);
      if (path === `/guilds/${GUILD}/roles` && method === 'POST') {
        const r = { id: newId(), name: body.name };
        guild.roles.push(r);
        return ok(r);
      }
      if (path === `/guilds/${GUILD}/channels` && method === 'GET') return ok(guild.channels);
      if (path === `/guilds/${GUILD}/channels` && method === 'POST') {
        const c = { id: newId(), name: body.name, type: body.type, parent_id: body.parent_id ?? null };
        guild.channels.push(c);
        return ok(c);
      }
      if (path === `/guilds/${GUILD}` && method === 'PATCH') return ok({ id: GUILD });
      if ((m = path.match(/^\/channels\/(\d+)$/))) {
        const c = guild.channels.find((x) => x.id === m![1]);
        if (!c) return ok({ message: 'Unknown Channel' }, 404);
        if (method === 'DELETE') {
          guild.channels = guild.channels.filter((x) => x.id !== c.id);
          return ok(c);
        }
        if (method === 'PATCH') Object.assign(c, { name: body.name ?? c.name });
        return ok(c);
      }
      if ((m = path.match(/^\/channels\/(\d+)\/messages$/)) && method === 'POST') {
        const id = newId();
        guild.messages.set(id, { channelId: m[1], body });
        return ok({ id });
      }
      if ((m = path.match(/^\/channels\/(\d+)\/messages\/(\d+)$/)) && method === 'PATCH') {
        if (!guild.messages.has(m[2])) return ok({ message: 'Unknown Message' }, 404);
        guild.edits++;
        return ok({ id: m[2] });
      }
      if ((m = path.match(/^\/guilds\/\d+\/members\/(\d+)\/roles\/(\d+)$/))) {
        const set = guild.memberRoles.get(m[1]) ?? new Set<string>();
        if (method === 'PUT') set.add(m[2]);
        else set.delete(m[2]);
        guild.memberRoles.set(m[1], set);
        return new Response(null, { status: 204 });
      }
      if (path === `/applications/${APP}/guilds/${GUILD}/commands` && method === 'PUT') return ok(body.map((c: { name: string }) => ({ name: c.name })));
      return ok({ message: `unmocked ${method} ${path}` }, 500);
    }),
  );
}

function signed(body: object, ts = String(Math.floor(Date.now() / 1000))) {
  const raw = JSON.stringify(body);
  const sig = sign(null, Buffer.from(ts + raw), keys.privateKey).toString('hex');
  return { raw, headers: { 'x-signature-ed25519': sig, 'x-signature-timestamp': ts } };
}

async function interact<T = any>(body: object) {
  const s = signed(body);
  return call<T>('POST', '/discord/interactions', undefined, { headers: { ...s.headers, 'content-type': 'application/json' }, rawBody: s.raw });
}

const member = (id: string, roles: string[] = [], permissions = '0') => ({ user: { id, username: `User${id.slice(-3)}` }, roles, permissions });

beforeAll(() => {
  process.env.DISCORD_BOT_TOKEN = 'bot-token';
  process.env.DISCORD_GUILD_ID = GUILD;
  process.env.DISCORD_CLIENT_ID = APP;
  process.env.DISCORD_PUBLIC_KEY = PUBLIC_HEX;
  mockDiscord();
});
afterAll(() => {
  vi.unstubAllGlobals();
  for (const k of ['DISCORD_BOT_TOKEN', 'DISCORD_GUILD_ID', 'DISCORD_CLIENT_ID', 'DISCORD_PUBLIC_KEY']) delete process.env[k];
});

describe('Discord bot', () => {
  it('rejects unsigned or stale interactions and answers the portal PING', async () => {
    const bad = await call('POST', '/discord/interactions', undefined, { headers: { 'x-signature-ed25519': 'a'.repeat(128), 'x-signature-timestamp': String(Math.floor(Date.now() / 1000)) }, rawBody: '{"type":1}' });
    expect(bad.status).toBe(401);
    const old = signed({ type: 1 }, String(Math.floor(Date.now() / 1000) - 3600));
    expect((await call('POST', '/discord/interactions', undefined, { headers: old.headers, rawBody: old.raw })).status).toBe(401);
    const ping = await interact({ type: 1 });
    expect(ping.status).toBe(200);
    expect(ping.data).toEqual({ type: 1 });
  });

  it('/setup: non-admins are refused, admins get a deferred reply and the background job starts', async () => {
    const base = { id: '1', type: 2, token: 'tok', application_id: APP, guild_id: GUILD, data: { name: 'setup' } };
    const denied = await interact({ ...base, member: member('300000000000000001') });
    expect(denied.data.type).toBe(4);
    expect(denied.data.data.content).toMatch(/admins/i);
    const before = guild.backgroundCalls;
    const ok = await interact({ ...base, member: member('300000000000000001', [], '8') });
    expect(ok.data).toEqual({ type: 5, data: { flags: 64 } });
    expect(guild.backgroundCalls).toBe(before + 1);
  });

  it('builds roles, categories, channels and panels – and a second run creates no duplicates', async () => {
    const { runSetup } = await import('../netlify/lib/discordBot');
    const state = await runSetup();
    const roleNames = guild.roles.map((r) => r.name);
    for (const n of ['Staff', 'Customer', 'Stock Pings', 'Giveaway Pings', 'Drop Pings']) expect(roleNames).toContain(n);
    expect(guild.channels.filter((c) => c.type === 4).map((c) => c.name)).toEqual(expect.arrayContaining(['🎁 FREE STUFF', '🎫 TICKETS', '🔒 STAFF']));
    expect(state.channels.orders).toBeTruthy();
    expect(state.messages.roles).toBeTruthy();
    const counts = { roles: guild.roles.length, channels: guild.channels.length, messages: guild.messages.size };

    await runSetup();
    expect(guild.roles.length).toBe(counts.roles);
    expect(guild.channels.length).toBe(counts.channels);
    expect(guild.messages.size).toBe(counts.messages); // panels were edited, not re-posted
    expect(guild.edits).toBeGreaterThan(10);
  });

  it('falls back to resumable inline slices when background functions are unavailable', async () => {
    const st = (await import('../netlify/lib/discordBot'));
    const before = guild.channels.length;
    guild.backgroundUnavailable = true;
    const base = { id: '7', type: 2, token: 'tok', application_id: APP, guild_id: GUILD, data: { name: 'setup' }, member: member('300000000000000001', [], '8') };
    const r = await interact(base);
    guild.backgroundUnavailable = false;
    expect(r.data.type).toBe(4);
    expect(r.data.data.content).toMatch(/Server is set up|Run \/setup again/);
    expect(guild.channels.length).toBe(before); // already set up → nothing duplicated
    expect((await st.getBotState())!.channels.orders).toBeTruthy();
  });

  it('toggles ping roles from buttons', async () => {
    const { getBotState } = await import('../netlify/lib/discordBot');
    const st = (await getBotState())!;
    const uid = '400000000000000001';
    const press = (roles: string[]) => interact({ id: '2', type: 3, token: 't', application_id: APP, guild_id: GUILD, channel_id: st.channels.roles, member: member(uid, roles), data: { custom_id: 'role:stock' } });
    const add = await press([]);
    expect(add.data.data.content).toMatch(/You now have \*\*Stock Pings\*\*/);
    expect(guild.memberRoles.get(uid)?.has(st.roles.stock!)).toBe(true);
    const remove = await press([st.roles.stock!]);
    expect(remove.data.data.content).toMatch(/Removed/);
    expect(guild.memberRoles.get(uid)?.has(st.roles.stock!)).toBe(false);
  });

  it('opens one private ticket per user and lets the owner close it', async () => {
    const uid = '500000000000000001';
    const open = () => interact({ id: '3', type: 3, token: 't', application_id: APP, guild_id: GUILD, member: member(uid), data: { custom_id: 'ticket:open' } });
    const first = await open();
    const chId = first.data.data.content.match(/<#(\d+)>/)?.[1];
    expect(chId).toBeTruthy();
    expect(guild.channels.find((c) => c.id === chId)?.name).toBe('ticket-user001');
    const second = await open();
    expect(second.data.data.content).toContain(`<#${chId}>`);
    expect(guild.channels.filter((c) => c.name.startsWith('ticket-')).length).toBe(1);

    const stranger = await interact({ id: '4', type: 3, token: 't', application_id: APP, guild_id: GUILD, channel_id: chId, member: member('500000000000000999'), data: { custom_id: 'ticket:close' } });
    expect(stranger.data.data.content).toMatch(/Only the ticket owner/);
    const close = await interact({ id: '5', type: 3, token: 't', application_id: APP, guild_id: GUILD, channel_id: chId, member: member(uid), data: { custom_id: 'ticket:close' } });
    expect(close.data).toEqual({ type: 6 });
    expect(guild.channels.some((c) => c.id === chId)).toBe(false);
  });

  it('shows the store credit of the linked Minecraft account', async () => {
    const uid = '600000000000000001';
    const check = () => interact({ id: '6', type: 3, token: 't', application_id: APP, guild_id: GUILD, member: member(uid), data: { custom_id: 'balance:check' } });
    expect((await check()).data.data.content).toMatch(/Log in with Discord/);
    const users = await import('../netlify/lib/users');
    await users.upsertUser({ id: uid, username: 'buyer' });
    await users.updateUser(uid, { mcUsername: 'BotBuyer' });
    await lib.credit.addCredit('BotBuyer', 250, 'test');
    expect((await check()).data.data.content).toMatch(/BotBuyer\*\* has \*\*\$2\.50\*\*/);
  });

  it('posts a restock ping with the Stock Pings role when limited stock goes up', async () => {
    const { getBotState, announceRestock } = await import('../netlify/lib/discordBot');
    const st = (await getBotState())!;
    const before = guild.messages.size;
    await announceRestock([{ product: { name: 'Elytra', slug: 'elytra' }, added: 3, stock: 5 }]);
    const posted = [...guild.messages.values()].at(-1)!;
    expect(guild.messages.size).toBe(before + 1);
    expect(posted.channelId).toBe(st.channels.stockpings);
    expect(posted.body.content).toBe(`<@&${st.roles.stock}>`);
  });

  it('registers the slash commands', async () => {
    const { registerCommands } = await import('../netlify/lib/discordBot');
    expect((await registerCommands()).registered).toEqual(['setup', 'shop']);
  });
});
