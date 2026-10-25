/**
 * Serverless Discord bot (no gateway / no always-on process).
 *
 *  - Slash commands and button clicks arrive as HTTP "interactions" at
 *    POST /api/discord/interactions (set as "Interactions Endpoint URL" in the Developer Portal).
 *  - /setup creates roles, categories, channels and the panel messages through the REST API.
 *    It runs in a Netlify background function (up to 15 min) and is safe to run again:
 *    existing roles/channels are reused (stored ids or same name) and panel messages are edited.
 *  - Buttons: self-roles, tickets (private channel per user), store-credit balance.
 *  - Hooks used by the shop: restock pings and the Customer role on delivery.
 *
 * Env: DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_CLIENT_ID (application id), DISCORD_PUBLIC_KEY.
 */
import { createPublicKey, verify as cryptoVerify } from 'node:crypto';
import type { Product } from '../../src/shared/types';
import { allFaq } from '../../src/data/faq';
import { kvDelete, kvGet, kvSet } from './store';
import { siteUrl } from './discord';
import { getSettings } from './settings';
import { getUser } from './users';
import { getCredit } from './credit';
import { countDelivered } from './orders';

const API = 'https://discord.com/api/v10';

// ───────────────────────── config ─────────────────────────

export function botConfig() {
  return {
    token: process.env.DISCORD_BOT_TOKEN || '',
    guildId: process.env.DISCORD_GUILD_ID || '',
    appId: process.env.DISCORD_CLIENT_ID || '',
    publicKey: process.env.DISCORD_PUBLIC_KEY || '',
  };
}
export function botConfigured(): boolean {
  const c = botConfig();
  return !!(c.token && c.guildId && c.appId && c.publicKey);
}

// ───────────────────────── signature ─────────────────────────

const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

/** Verify Discord's Ed25519 request signature (and reject stale timestamps). */
export function verifyDiscordSignature(rawBody: string, signature: string | null, timestamp: string | null, publicKeyHex = botConfig().publicKey, now = Date.now()): boolean {
  if (!signature || !timestamp || !publicKeyHex) return false;
  if (!/^[0-9a-f]{128}$/i.test(signature) || !/^[0-9a-f]{64}$/i.test(publicKeyHex) || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(now / 1000 - Number(timestamp)) > 300) return false;
  try {
    const key = createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(publicKeyHex, 'hex')]), format: 'der', type: 'spki' });
    return cryptoVerify(null, Buffer.from(timestamp + rawBody), key, Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

// ───────────────────────── REST ─────────────────────────

export class DiscordApiError extends Error {
  constructor(
    public status: number,
    public body: string,
    path: string,
  ) {
    super(`Discord ${status} on ${path}: ${body.slice(0, 200)}`);
  }
}

/** Bot-authenticated REST call with automatic 429 back-off. */
export async function discordApi<T = unknown>(method: string, path: string, body?: unknown, attempt = 0): Promise<T> {
  const { token } = botConfig();
  if (!token) throw new Error('DISCORD_BOT_TOKEN is not set');
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bot ${token}`, ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 429 && attempt < 6) {
    const data = (await res.json().catch(() => ({}))) as { retry_after?: number };
    await new Promise((r) => setTimeout(r, Math.ceil((Number(data.retry_after) || 1) * 1000) + 100));
    return discordApi<T>(method, path, body, attempt + 1);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!res.ok) throw new DiscordApiError(res.status, text, path);
  return (text ? JSON.parse(text) : undefined) as T;
}

// ───────────────────────── permissions & styling ─────────────────────────

const P = {
  CREATE_INVITE: 1n,
  KICK: 2n,
  BAN: 4n,
  ADMIN: 8n,
  MANAGE_CHANNELS: 16n,
  ADD_REACTIONS: 64n,
  VIEW: 1024n,
  SEND: 2048n,
  MANAGE_MESSAGES: 8192n,
  EMBED_LINKS: 16384n,
  ATTACH_FILES: 32768n,
  HISTORY: 65536n,
  MENTION_EVERYONE: 131072n,
  CONNECT: 1048576n,
  SPEAK: 2097152n,
  MANAGE_NICKNAMES: 134217728n,
  MANAGE_ROLES: 268435456n,
  CREATE_PUBLIC_THREADS: 34359738368n,
  SEND_IN_THREADS: 274877906944n,
  MODERATE_MEMBERS: 1099511627776n,
};
const bits = (...p: bigint[]) => p.reduce((a, b) => a | b, 0n).toString();

const COLOR = { gold: 0xf5b43a, pink: 0xff5ea8, green: 0x22c55e, blurple: 0x5865f2, purple: 0xa855f7, red: 0xef4444, cyan: 0x06b6d4 };
const TEXT = 0;
const VOICE = 2;
const CATEGORY = 4;

type Access = 'public' | 'readonly' | 'private' | 'locked';

interface ChannelDef {
  key: string;
  name: string;
  type?: typeof TEXT | typeof VOICE;
  access: Access;
  topic?: string;
}
interface CategoryDef {
  key: string;
  name: string | null;
  access?: Access;
  channels: ChannelDef[];
}

export const ROLE_DEFS = [
  { key: 'staff', name: 'Staff', color: COLOR.gold, hoist: true, permissions: bits(P.KICK, P.BAN, P.MANAGE_MESSAGES, P.MANAGE_NICKNAMES, P.MODERATE_MEMBERS, P.MANAGE_CHANNELS, P.MENTION_EVERYONE) },
  { key: 'customer', name: 'Customer', color: COLOR.pink, hoist: true, permissions: '0' },
  { key: 'stock', name: 'Stock Pings', color: COLOR.green, hoist: false, permissions: '0' },
  { key: 'giveaway', name: 'Giveaway Pings', color: COLOR.purple, hoist: false, permissions: '0' },
  { key: 'drops', name: 'Drop Pings', color: COLOR.cyan, hoist: false, permissions: '0' },
] as const;
export type RoleKey = (typeof ROLE_DEFS)[number]['key'];
const PING_ROLES: RoleKey[] = ['stock', 'giveaway', 'drops'];

function host(): string {
  return siteUrl().replace(/^https?:\/\//, '');
}

export function layout(statsName: string): CategoryDef[] {
  return [
    {
      key: 'top',
      name: null,
      channels: [
        { key: 'rules', name: '📜・rules', access: 'readonly' },
        { key: 'joins', name: '👋・joins', access: 'readonly' },
        { key: 'sell', name: '💎・sell-to-us', access: 'readonly' },
        { key: 'site', name: `💻 | ${host()}`, type: VOICE, access: 'locked' },
        { key: 'stats', name: statsName, type: VOICE, access: 'locked' },
      ],
    },
    {
      key: 'free',
      name: '🎁 FREE STUFF',
      channels: [
        { key: 'spin', name: '🎰・daily-spin', access: 'readonly', topic: 'Spin the wheel every day – every spin wins.' },
        { key: 'referral', name: '🤝・refer-a-friend', access: 'readonly' },
        { key: 'giveaway', name: '🎉・giveaways', access: 'readonly' },
        { key: 'drops', name: '🎊・drops', access: 'readonly' },
      ],
    },
    {
      key: 'store',
      name: '🍩 DONUTCOINS',
      channels: [
        { key: 'announcements', name: '📢・announcements', access: 'readonly' },
        { key: 'purchase', name: '🛒・purchase', access: 'readonly' },
        { key: 'vouches', name: '😊・vouches', access: 'public', topic: 'Bought from us? Leave a vouch here.' },
        { key: 'legit', name: '✅・legit', access: 'readonly' },
        { key: 'roles', name: '🔴・roles', access: 'readonly' },
        { key: 'links', name: '🔗・our-links', access: 'readonly' },
      ],
    },
    {
      key: 'info',
      name: 'ℹ️ INFO',
      channels: [
        { key: 'faq', name: '❓・faq', access: 'readonly' },
        { key: 'scammers', name: '🚨・scammers', access: 'readonly' },
      ],
    },
    { key: 'tickets', name: '🎫 TICKETS', channels: [{ key: 'ticket', name: '🎫・ticket', access: 'readonly' }] },
    {
      key: 'chat',
      name: '💬 CHAT',
      channels: [
        { key: 'chat', name: '💬・chat', access: 'public' },
        { key: 'marketplace', name: '🏪・marketplace', access: 'public' },
        { key: 'vc', name: 'Main VC', type: VOICE, access: 'public' },
      ],
    },
    {
      key: 'updates',
      name: '📈 UPDATES',
      channels: [
        { key: 'stockpings', name: '📦・stock-pings', access: 'readonly' },
        { key: 'baseupdates', name: '🏠・base-updates', access: 'readonly' },
      ],
    },
    {
      key: 'staff',
      name: '🔒 STAFF',
      access: 'private',
      channels: [
        { key: 'orders', name: '🧾・orders', access: 'private' },
        { key: 'staffchat', name: '💼・staff-chat', access: 'private' },
        { key: 'botlogs', name: '🤖・bot-logs', access: 'private' },
      ],
    },
  ];
}

function overwrites(access: Access, guildId: string, roles: Partial<Record<RoleKey, string>>) {
  const everyone = guildId; // @everyone role id == guild id
  const staff = roles.staff;
  const ow: { id: string; type: 0 | 1; allow: string; deny: string }[] = [];
  if (access === 'readonly') ow.push({ id: everyone, type: 0, allow: bits(P.VIEW, P.HISTORY), deny: bits(P.SEND, P.ADD_REACTIONS, P.CREATE_PUBLIC_THREADS, P.SEND_IN_THREADS) });
  if (access === 'locked') ow.push({ id: everyone, type: 0, allow: bits(P.VIEW), deny: bits(P.CONNECT, P.SEND) });
  if (access === 'private') ow.push({ id: everyone, type: 0, allow: '0', deny: bits(P.VIEW) });
  if (staff && access !== 'public' && access !== 'locked') ow.push({ id: staff, type: 0, allow: bits(P.VIEW, P.SEND, P.HISTORY, P.EMBED_LINKS, P.ATTACH_FILES), deny: '0' });
  return ow;
}

// ───────────────────────── state ─────────────────────────

export interface BotState {
  guildId: string;
  roles: Partial<Record<RoleKey, string>>;
  categories: Record<string, string>;
  channels: Record<string, string>;
  messages: Record<string, { channelId: string; messageId: string }>;
  updatedAt?: string;
}
const STATE_KEY = 'discord-bot';

export async function getBotState(): Promise<BotState | null> {
  return kvGet<BotState>('settings', STATE_KEY);
}

// ───────────────────────── panels ─────────────────────────

type Button = { type: 2; style: 1 | 2 | 3 | 4 | 5; label: string; custom_id?: string; url?: string; emoji?: { name: string } };
const link = (label: string, path: string, emoji?: string): Button => ({ type: 2, style: 5, label, url: path.startsWith('http') ? path : `${siteUrl()}${path}`, ...(emoji ? { emoji: { name: emoji } } : {}) });
const btn = (label: string, id: string, style: 1 | 2 | 3 | 4 = 2, emoji?: string): Button => ({ type: 2, style, label, custom_id: id, ...(emoji ? { emoji: { name: emoji } } : {}) });
const row = (...components: Button[]) => ({ type: 1, components });

interface Panel {
  key: string;
  channel: string;
  embeds: object[];
  components?: object[];
}

function richToDiscord(text: string, vars: Record<string, string | number>): string {
  return text
    .replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k] ?? ''))
    .replace(/\[([^\]]+)\]\((\/[^)]*)\)/g, (_, l: string, p: string) => `[${l}](${siteUrl()}${p})`)
    .replace(/`([^`]+)`/g, '`$1`');
}

export async function buildPanels(): Promise<Panel[]> {
  const s = await getSettings();
  const store = s.storeName;
  const server = s.serverName;
  const footer = { text: `${store} · ${host()}` };
  const prizes = s.spin.prizes.filter((p) => (Number(p.weight) || 0) > 0).map((p) => `• **${p.label}**`);
  const vars = { store, server, eta: s.delivery.etaText, referralFriend: s.referral.friendPercent, referralReferrer: s.referral.referrerPercent, reviewReward: s.reviewRewardPercent, welcomeCode: s.welcomeCoupon.code, welcomePercent: s.welcomeCoupon.percent, spinCooldown: s.spin.cooldownHours };
  const faq = allFaq.filter((f) => f.top).concat(allFaq.filter((f) => !f.top)).slice(0, 8);
  const methods = s.paymentMethods.filter((m) => m.enabled).map((m) => m.name);

  return [
    {
      key: 'rules',
      channel: 'rules',
      embeds: [
        {
          title: `📜 ${store} – Rules`,
          color: COLOR.gold,
          description: [
            '**1.** Be respectful – no harassment, hate or threats.',
            '**2.** No spam, no begging for free stuff, no self-promotion.',
            '**3.** No scamming or impersonating staff. Staff never DM you first.',
            '**4.** Orders and support only through the website or a ticket.',
            '**5.** No alts to abuse giveaways, spins or referrals.',
            `**6.** Follow Discord's Terms of Service.`,
            '',
            `Breaking the rules = timeout or ban. ${store} is not affiliated with ${server}, Mojang or Microsoft.`,
          ].join('\n'),
          footer,
        },
      ],
      components: [row(link('Shop', '/shop', '🛒'), link('Terms', '/terms'), link('FAQ', '/faq'))],
    },
    {
      key: 'sell',
      channel: 'sell',
      embeds: [
        {
          title: '💎 Sell to us',
          color: COLOR.cyan,
          description: `Got ${server} money, spawners, elytras or rare items you want to turn into cash?\n\nOpen a ticket, tell us **what** and **how much** – we answer with an offer, usually within minutes while staff are online.`,
          footer,
        },
      ],
      components: [row(btn('Open a ticket', 'ticket:open', 1, '🎫'))],
    },
    {
      key: 'spin',
      channel: 'spin',
      embeds: [
        {
          title: '🎰 Daily Free Spin – every spin wins',
          color: COLOR.pink,
          description: `Spin the wheel once every **${s.spin.cooldownHours}h** on our website and win:\n\n${prizes.join('\n')}\n\nItems are delivered in-game to your Minecraft username. Log in with Discord on the site to spin.`,
          footer,
        },
      ],
      components: [row(link('Spin now', '/spin', '🎰'), btn('Check Balance', 'balance:check', 2, '💰'))],
    },
    {
      key: 'referral',
      channel: 'referral',
      embeds: [
        {
          title: '🤝 Refer a friend',
          color: COLOR.green,
          description: `Share your referral link: your friend gets **${s.referral.friendPercent}% off**, you get **${s.referral.referrerPercent}%** of their order as store credit – every time.\n\nStore credit is applied at checkout automatically.`,
          footer,
        },
      ],
      components: [row(link('Get my link', '/referral', '🔗'), btn('Check Balance', 'balance:check', 2, '💰'))],
    },
    {
      key: 'giveaway',
      channel: 'giveaway',
      embeds: [{ title: '🎉 Giveaways', color: COLOR.purple, description: 'Free giveaways run on our website – enter with your Minecraft username. Turn on pings so you never miss one.', footer }],
      components: [row(link('Enter giveaways', '/giveaways', '🎉'), btn('Giveaway Pings', 'role:giveaway', 2, '🔔'))],
    },
    {
      key: 'drops',
      channel: 'drops',
      embeds: [{ title: '🎊 Drops', color: COLOR.cyan, description: 'Surprise drops – free codes and coins, first come first served. Redeem codes on the website.', footer }],
      components: [row(link('Redeem a code', '/redeem', '🎁'), btn('Drop Pings', 'role:drops', 2, '🔔'))],
    },
    {
      key: 'announcements',
      channel: 'announcements',
      embeds: [
        {
          title: `🍩 Welcome to ${store}!`,
          color: COLOR.gold,
          description: `${server} money, spawners, mystery boxes and items – delivered in-game by real staff.\n\n• **Every daily spin wins**\n• **Mystery Box sale** – up to 33% off\n• Pay with ${methods.length ? methods.join(', ') : 'card or crypto'}`,
          url: siteUrl(),
          footer,
        },
      ],
      components: [row(link('Shop now', '/shop', '🛒'), link('Mystery Boxes', '/shop/mystery-boxes', '🎁'))],
    },
    {
      key: 'purchase',
      channel: 'purchase',
      embeds: [
        {
          title: '🛒 How to buy',
          color: COLOR.gold,
          description: [
            `**1.** Open **${host()}** and add items to your cart.`,
            '**2.** Enter your exact Minecraft username at checkout.',
            `**3.** Pay with ${methods.length ? methods.join(', ') : 'card or crypto'}.`,
            `**4.** Stay online on ${server} – staff deliver in-game. ${s.delivery.etaText}`,
            '',
            'Track every order on the website with its order ID.',
          ].join('\n'),
          footer,
        },
      ],
      components: [row(link('Shop now', '/shop', '🛒'), link('Track order', '/track', '📦'), btn('Need help?', 'ticket:open', 2, '🎫'))],
    },
    {
      key: 'vouches',
      channel: 'vouches',
      embeds: [{ title: '😊 Vouches', color: COLOR.pink, description: `Bought from us? Drop a vouch here – and leave a review on the website for **${s.reviewRewardPercent}% off** your next order.`, footer }],
      components: [row(link('Write a review', '/reviews', '⭐'))],
    },
    {
      key: 'legit',
      channel: 'legit',
      embeds: [
        {
          title: '✅ Why we are legit',
          color: COLOR.green,
          description: '• Every order has an ID and a public tracking page\n• Real staff deliver in-game – no bots, no account access\n• Secure payments (Stripe & crypto checkout)\n• Reviews come from delivered orders only',
          footer,
        },
      ],
      components: [row(link('Reviews', '/reviews', '⭐'), link('Track an order', '/track', '📦'))],
    },
    {
      key: 'roles',
      channel: 'roles',
      embeds: [{ title: '🔔 Pick your pings', color: COLOR.blurple, description: 'Click a button to get or remove a role:\n\n📦 **Stock Pings** – restocks & sales\n🎉 **Giveaway Pings** – new giveaways\n🎊 **Drop Pings** – free drops', footer }],
      components: [row(btn('Stock Pings', 'role:stock', 3, '📦'), btn('Giveaway Pings', 'role:giveaway', 1, '🎉'), btn('Drop Pings', 'role:drops', 2, '🎊'))],
    },
    {
      key: 'links',
      channel: 'links',
      embeds: [{ title: '🔗 Our links', color: COLOR.blurple, description: `🌐 **Website:** ${siteUrl()}\n🛒 **Shop:** ${siteUrl()}/shop\n🎰 **Daily spin:** ${siteUrl()}/spin\n⭐ **Reviews:** ${siteUrl()}/reviews\n📦 **Track order:** ${siteUrl()}/track`, footer }],
      components: [row(link('Website', '/', '🌐'), link('Shop', '/shop', '🛒'), link('Spin', '/spin', '🎰'))],
    },
    {
      key: 'faq',
      channel: 'faq',
      embeds: [
        {
          title: '❓ FAQ',
          color: COLOR.gold,
          fields: faq.map((f) => ({ name: f.q.slice(0, 250), value: richToDiscord(f.a, vars).slice(0, 1000) })),
          footer,
        },
      ],
      components: [row(link('Full FAQ', '/faq', '❓'), btn('Open a ticket', 'ticket:open', 2, '🎫'))],
    },
    {
      key: 'scammers',
      channel: 'scammers',
      embeds: [
        {
          title: '🚨 Stay safe',
          color: COLOR.red,
          description: `• Staff **never DM you first** and never ask for your password.\n• We only sell on **${host()}** – no other sites, no "middlemen".\n• Payment details only appear on your order page on our website.\n• Someone pretends to be us? Open a ticket and report them.`,
          footer,
        },
      ],
      components: [row(btn('Report a scammer', 'ticket:open', 4, '🚨'))],
    },
    {
      key: 'ticket',
      channel: 'ticket',
      embeds: [{ title: '🎫 Support', color: COLOR.blurple, description: 'Questions, problems with an order, selling to us or a custom quote – open a private ticket and staff will help you.\n\nPlease have your **order ID** ready (DC-XXXXXX).', footer }],
      components: [row(btn('Open a ticket', 'ticket:open', 1, '🎫'))],
    },
    {
      key: 'stockpings',
      channel: 'stockpings',
      embeds: [{ title: '📦 Restock alerts', color: COLOR.green, description: 'Restocks and sales are posted here automatically. Turn on **Stock Pings** to get notified.', footer }],
      components: [row(link('Shop now', '/shop', '🛒'), btn('Get Notified', 'role:stock', 3, '🔔'))],
    },
  ];
}

// ───────────────────────── setup ─────────────────────────

interface GuildChannel {
  id: string;
  name: string;
  type: number;
  parent_id?: string | null;
}
interface GuildRole {
  id: string;
  name: string;
}

async function statsChannelName(): Promise<string> {
  const s = await getSettings();
  const delivered = (await countDelivered().catch(() => 0)) + (Number(s.stats?.ordersOffset) || 0);
  if (delivered >= 10) return `📊 | ${delivered}+ Successful Orders`;
  const p = s.stats?.pastReviews;
  const total = (p?.count5 ?? 0) + (p?.count4 ?? 0) + (p?.count3 ?? 0);
  if (total > 0) {
    const avg = ((p!.count5 * 5 + p!.count4 * 4 + p!.count3 * 3) / total).toFixed(1);
    return `⭐ | ${avg} from ${total} reviews`;
  }
  return '📊 | Trusted DonutSMP store';
}

/**
 * Create / update everything. Idempotent: ids from the stored state or same-named
 * channels/roles are reused, panel messages are edited instead of re-posted.
 */
export class SetupIncomplete extends Error {
  constructor(public state: BotState) {
    super('setup paused (time budget) – run it again to continue');
  }
}

export async function runSetup(log: (line: string) => void = () => undefined, opts: { budgetMs?: number } = {}): Promise<BotState> {
  const { guildId, appId } = botConfig();
  if (!guildId) throw new Error('DISCORD_GUILD_ID is not set');
  const prev = await getBotState();
  const state: BotState = prev && prev.guildId === guildId ? prev : { guildId, roles: {}, categories: {}, channels: {}, messages: {} };
  // progress is saved after every created item, so a timed-out run resumes where it stopped
  const deadline = opts.budgetMs ? Date.now() + opts.budgetMs : Infinity;
  const save = () => kvSet('settings', STATE_KEY, state);
  const checkpoint = async () => {
    await save();
    if (Date.now() > deadline) throw new SetupIncomplete(state);
  };

  // roles
  const roles = await discordApi<GuildRole[]>('GET', `/guilds/${guildId}/roles`);
  for (const def of ROLE_DEFS) {
    const existing = roles.find((r) => r.id === state.roles[def.key]) ?? roles.find((r) => r.name === def.name);
    if (existing) {
      state.roles[def.key] = existing.id;
    } else {
      const created = await discordApi<GuildRole>('POST', `/guilds/${guildId}/roles`, { name: def.name, color: def.color, hoist: def.hoist, permissions: def.permissions, mentionable: false });
      state.roles[def.key] = created.id;
      log(`role ${def.name}`);
      await checkpoint();
    }
  }

  // categories + channels
  const channels = await discordApi<GuildChannel[]>('GET', `/guilds/${guildId}/channels`);
  const find = (id: string | undefined, name: string, type: number) => channels.find((c) => c.id === id) ?? channels.find((c) => c.name === name && c.type === type);
  const defs = layout(await statsChannelName());
  let catPos = 0;
  for (const cat of defs) {
    let parentId: string | undefined;
    if (cat.name) {
      const existing = find(state.categories[cat.key], cat.name, CATEGORY);
      const body = { name: cat.name, type: CATEGORY, position: catPos++, permission_overwrites: overwrites(cat.access ?? 'public', guildId, state.roles) };
      if (existing) {
        await discordApi('PATCH', `/channels/${existing.id}`, { name: cat.name, permission_overwrites: body.permission_overwrites });
        parentId = existing.id;
      } else {
        parentId = (await discordApi<GuildChannel>('POST', `/guilds/${guildId}/channels`, body)).id;
        log(`category ${cat.name}`);
      }
      state.categories[cat.key] = parentId;
      await checkpoint();
    }
    let pos = 0;
    for (const ch of cat.channels) {
      const type = ch.type ?? TEXT;
      const existing = find(state.channels[ch.key], ch.name, type) ?? (ch.key === 'stats' || ch.key === 'site' ? channels.find((c) => c.id === state.channels[ch.key]) : undefined);
      const body: Record<string, unknown> = { name: ch.name, type, parent_id: parentId ?? null, position: pos++, permission_overwrites: overwrites(ch.access, guildId, state.roles) };
      if (ch.topic && type === TEXT) body.topic = ch.topic;
      if (existing) {
        const { type: _t, ...patch } = body;
        await discordApi('PATCH', `/channels/${existing.id}`, patch);
        state.channels[ch.key] = existing.id;
      } else {
        state.channels[ch.key] = (await discordApi<GuildChannel>('POST', `/guilds/${guildId}/channels`, body)).id;
        log(`channel ${ch.name}`);
      }
      await checkpoint();
    }
  }

  // Discord's own join messages go to #joins
  await discordApi('PATCH', `/guilds/${guildId}`, { system_channel_id: state.channels.joins }).catch((e) => log(`joins channel not set: ${(e as Error).message}`));

  // panels: edit if the message still exists, otherwise post
  for (const panel of await buildPanels()) {
    const channelId = state.channels[panel.channel];
    if (!channelId) continue;
    const payload = { embeds: panel.embeds, components: panel.components ?? [], allowed_mentions: { parse: [] } };
    const stored = state.messages[panel.key];
    let done = false;
    if (stored && stored.channelId === channelId) {
      try {
        await discordApi('PATCH', `/channels/${channelId}/messages/${stored.messageId}`, payload);
        done = true;
      } catch (e) {
        if (!(e instanceof DiscordApiError) || e.status !== 404) throw e;
      }
    }
    if (!done) {
      const msg = await discordApi<{ id: string }>('POST', `/channels/${channelId}/messages`, payload);
      state.messages[panel.key] = { channelId, messageId: msg.id };
      log(`panel ${panel.key}`);
    }
    await checkpoint();
  }

  state.updatedAt = new Date().toISOString();
  await kvSet('settings', STATE_KEY, state);
  if (appId) log('done');
  return state;
}

// ───────────────────────── commands ─────────────────────────

export const COMMANDS = [
  { name: 'setup', description: 'Create or refresh all channels, roles and panels for the store', default_member_permissions: P.ADMIN.toString(), dm_permission: false },
  { name: 'shop', description: 'Get the link to the shop', dm_permission: false },
];

export async function registerCommands(): Promise<{ registered: string[] }> {
  const { appId, guildId } = botConfig();
  if (!appId || !guildId) throw new Error('DISCORD_CLIENT_ID and DISCORD_GUILD_ID must be set');
  const res = await discordApi<{ name: string }[]>('PUT', `/applications/${appId}/guilds/${guildId}/commands`, COMMANDS);
  return { registered: res.map((c) => c.name) };
}

export function botInviteUrl(): string {
  const { appId, guildId } = botConfig();
  return `https://discord.com/oauth2/authorize?client_id=${appId}&scope=bot%20applications.commands&permissions=${P.ADMIN}${guildId ? `&guild_id=${guildId}&disable_guild_select=true` : ''}`;
}

// ───────────────────────── interactions ─────────────────────────

export interface Interaction {
  id: string;
  type: number;
  token: string;
  application_id: string;
  guild_id?: string;
  channel_id?: string;
  data?: { name?: string; custom_id?: string };
  member?: { user: { id: string; username: string; global_name?: string | null }; roles: string[]; permissions?: string };
  user?: { id: string; username: string };
}

const EPHEMERAL = 64;
const reply = (content: string, extra: Record<string, unknown> = {}) => ({ type: 4, data: { content, flags: EPHEMERAL, allowed_mentions: { parse: [] }, ...extra } });

function isAdmin(i: Interaction): boolean {
  try {
    return (BigInt(i.member?.permissions ?? '0') & P.ADMIN) === P.ADMIN;
  } catch {
    return false;
  }
}

/** Everything except /setup (which runs in the background function). Returns the interaction response. */
export async function handleInteraction(i: Interaction): Promise<object> {
  const state = await getBotState();
  const uid = i.member?.user.id ?? i.user?.id ?? '';

  if (i.type === 2 && i.data?.name === 'shop') {
    return { type: 4, data: { content: `🛒 **${siteUrl()}/shop**`, components: [row(link('Shop now', '/shop', '🛒'), link('Daily spin', '/spin', '🎰'))], allowed_mentions: { parse: [] } } };
  }
  if (i.type !== 3) return reply('Unknown command.');
  const id = i.data?.custom_id ?? '';

  // self-roles
  if (id.startsWith('role:')) {
    const key = id.slice(5) as RoleKey;
    const roleId = state?.roles[key];
    if (!PING_ROLES.includes(key) || !roleId || !i.guild_id) return reply('This role is not set up yet – an admin needs to run /setup.');
    const has = i.member?.roles.includes(roleId);
    await discordApi(has ? 'DELETE' : 'PUT', `/guilds/${i.guild_id}/members/${uid}/roles/${roleId}`);
    const name = ROLE_DEFS.find((r) => r.key === key)!.name;
    return reply(has ? `🔕 Removed **${name}**.` : `🔔 You now have **${name}**.`);
  }

  // balance
  if (id === 'balance:check') {
    const user = uid ? await getUser(uid) : null;
    if (!user?.mcUsername) {
      return reply(`Log in with Discord on **${host()}** and set your Minecraft username under *Account* – then your store credit shows up here.`, { components: [row(link('Log in', '/account', '🔑'))] });
    }
    const credit = await getCredit(user.mcUsername);
    return reply(`💰 **${user.mcUsername}** has **$${(credit.balanceCents / 100).toFixed(2)}** store credit. It is applied at checkout automatically.`, { components: [row(link('Shop now', '/shop', '🛒'))] });
  }

  // tickets
  if (id === 'ticket:open') {
    if (!state?.categories.tickets || !i.guild_id) return reply('Tickets are not set up yet – an admin needs to run /setup.');
    const key = `ticket:${uid}`;
    const open = await kvGet<{ channelId: string }>('misc', key);
    if (open) {
      const still = await discordApi('GET', `/channels/${open.channelId}`).then(() => true, () => false);
      if (still) return reply(`You already have an open ticket: <#${open.channelId}>`);
    }
    const username = (i.member?.user.username ?? 'user').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20) || 'user';
    const staff = state.roles.staff;
    const ch = await discordApi<GuildChannel>('POST', `/guilds/${i.guild_id}/channels`, {
      name: `ticket-${username}`,
      type: TEXT,
      parent_id: state.categories.tickets,
      permission_overwrites: [
        { id: i.guild_id, type: 0, allow: '0', deny: bits(P.VIEW) },
        { id: uid, type: 1, allow: bits(P.VIEW, P.SEND, P.HISTORY, P.ATTACH_FILES, P.EMBED_LINKS), deny: '0' },
        ...(staff ? [{ id: staff, type: 0, allow: bits(P.VIEW, P.SEND, P.HISTORY, P.ATTACH_FILES, P.EMBED_LINKS, P.MANAGE_MESSAGES), deny: '0' }] : []),
      ],
    });
    await kvSet('misc', key, { channelId: ch.id });
    await discordApi('POST', `/channels/${ch.id}/messages`, {
      content: `<@${uid}>${staff ? ` <@&${staff}>` : ''}`,
      embeds: [{ title: '🎫 Ticket opened', color: COLOR.blurple, description: 'Tell us what you need. If it is about an order, post your **order ID** (DC-XXXXXX). Staff will answer here.' }],
      components: [row(btn('Close ticket', 'ticket:close', 4, '🔒'))],
      allowed_mentions: { users: [uid], roles: staff ? [staff] : [] },
    });
    return reply(`✅ Your ticket: <#${ch.id}>`);
  }
  if (id === 'ticket:close') {
    const staff = state?.roles.staff;
    const owner = await kvGet<{ channelId: string }>('misc', `ticket:${uid}`);
    const isOwner = owner?.channelId === i.channel_id;
    if (!isOwner && !(staff && i.member?.roles.includes(staff)) && !isAdmin(i)) return reply('Only the ticket owner or staff can close this ticket.');
    if (i.channel_id) {
      await discordApi('DELETE', `/channels/${i.channel_id}`);
      if (isOwner) await kvDelete('misc', `ticket:${uid}`);
    }
    return { type: 6 };
  }
  return reply('This button is no longer active.');
}

/** Follow-up for a deferred interaction (used by the background setup). */
export async function editOriginal(appId: string, token: string, content: string): Promise<void> {
  await fetch(`${API}/webhooks/${appId}/${token}/messages/@original`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: content.slice(0, 1900) }) }).catch(() => undefined);
}

export { isAdmin as interactionIsAdmin };

// ───────────────────────── shop hooks ─────────────────────────

/** Post a restock alert with a Stock Pings mention. Never throws. */
export async function announceRestock(items: { product: Pick<Product, 'name' | 'slug'>; added: number; stock: number | null }[]): Promise<void> {
  try {
    if (!items.length || !botConfig().token) return;
    const state = await getBotState();
    const channelId = state?.channels.stockpings;
    if (!channelId) return;
    const role = state.roles.stock;
    await discordApi('POST', `/channels/${channelId}/messages`, {
      content: role ? `<@&${role}>` : undefined,
      embeds: [
        {
          title: `🔔 ${items.length === 1 ? 'Product restocked' : `${items.length} products restocked`}`,
          color: COLOR.green,
          description: items.map((i) => `**[${i.product.name}](${siteUrl()}/product/${i.product.slug})** · ${i.stock === null ? 'unlimited' : `${i.stock} in stock`} · +${i.added} added`).join('\n'),
          footer: { text: 'Get yours before they run out' },
          timestamp: new Date().toISOString(),
        },
      ],
      components: [row(link('Shop now', '/shop', '🛒'), btn('Get Notified', 'role:stock', 2, '🔔'))],
      allowed_mentions: { roles: role ? [role] : [] },
    });
  } catch (err) {
    console.warn('[bot] restock announcement failed', (err as Error).message);
  }
}

/** Give a buyer the Customer role once their order is delivered. Never throws. */
export async function grantCustomerRole(discordUserId: string | undefined): Promise<void> {
  try {
    if (!discordUserId || !botConfig().token) return;
    const state = await getBotState();
    const role = state?.roles.customer;
    if (!role) return;
    await discordApi('PUT', `/guilds/${state.guildId}/members/${discordUserId}/roles/${role}`);
  } catch (err) {
    console.warn('[bot] customer role failed', (err as Error).message);
  }
}
