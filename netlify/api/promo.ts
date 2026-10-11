/**
 * Promotions: coupon validation, the daily spin wheel, gift-code redemption,
 * store credit and referral stats.
 *
 *  POST /coupons/validate · GET /spin/status · POST /spin · POST /redeem
 *  GET  /credit?username= · GET /referral?username=
 */
import type { Coupon, SiteSettings, SpinPrize, SpinResult, SpinStatus } from '../../src/shared/types';
import type { Route } from '../lib/http';
import { HttpError, getIp, hashIp, json, nowIso, readJson, requireString, requireUsername } from '../lib/http';
import { rateLimit } from '../lib/ratelimit';
import { kvGet, kvSet, kvUpdate } from '../lib/store';
import { getSettings } from '../lib/settings';
import { createCoupon, getCoupon, normalizeCode, saveCoupon } from '../lib/coupons';
import { getCredit, addCredit } from '../lib/credit';
import { createFreeOrder } from '../lib/orderBuilder';
import { listOrderIndex, toPublicOrder } from '../lib/orders';
import { weightedIndex } from '../lib/ids';
import { COLORS, notifyDiscord, siteUrl } from '../lib/discord';
import { claimGift, finalizeClaim, getGift, giftProblem, normalizeGiftCode, rollbackClaim } from '../lib/gifts';

// ───────────── helpers ─────────────

const PAID_STATUSES = new Set(['paid', 'delivering', 'delivered']);
const FREE_ITEM_WINDOW_MS = 7 * 86400_000;
const DEVICE_RE = /^[A-Za-z0-9_\-:.]{4,80}$/;

interface SpinRecord {
  lastAt: string;
  count: number;
}

type PublicPrize = Omit<SpinPrize, 'weight'>;
/** SpinResult without the prize weight (odds stay server-side). */
type PublicSpinResult = Omit<SpinResult, 'prize'> & { prize: PublicPrize };

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function stripWeight(p: SpinPrize): PublicPrize {
  const { weight: _weight, ...rest } = p;
  return rest;
}

/** Browser id from the client (localStorage). 'nodevice' = storage blocked → ip only. */
function cleanDeviceId(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  if (!s || s === 'nodevice' || !DEVICE_RE.test(s)) return undefined;
  return s;
}

function optionalUsername(v: unknown): string | undefined {
  if (v === undefined || v === null || (typeof v === 'string' && !v.trim())) return undefined;
  return requireUsername(v);
}

const spinIpKey = (ipHash: string) => `ip:${ipHash}`;
const spinDeviceKey = (deviceId: string) => `dev:${deviceId}`;
const freeItemKey = (username: string) => `free:${username.trim().toLowerCase()}`;

async function cooldown(ipHash: string, deviceId: string | undefined, cooldownHours: number): Promise<{ canSpin: boolean; nextSpinAt?: string }> {
  const [byIp, byDevice] = await Promise.all([
    kvGet<SpinRecord>('spins', spinIpKey(ipHash)),
    deviceId ? kvGet<SpinRecord>('spins', spinDeviceKey(deviceId)) : Promise.resolve(null),
  ]);
  let latest = 0;
  for (const r of [byIp, byDevice]) {
    const t = r?.lastAt ? Date.parse(r.lastAt) : 0;
    if (Number.isFinite(t) && t > latest) latest = t;
  }
  const next = latest + Math.max(0, cooldownHours) * 3600_000;
  if (latest && next > Date.now()) return { canSpin: false, nextSpinAt: new Date(next).toISOString() };
  return { canSpin: true };
}

class CooldownActive extends Error {
  nextSpinAt: string;
  constructor(nextSpinAt: string) {
    super('cooldown');
    this.nextSpinAt = nextSpinAt;
  }
}

/**
 * Consume the spin atomically for the IP and (if given) the device: the
 * cooldown check and the write are one compare-and-swap per key, so parallel
 * requests cannot all pass. Returns null on success, else the time of the next spin.
 */
async function consumeSpin(ipHash: string, deviceId: string | undefined, cooldownHours: number, at: Date): Promise<string | null> {
  const windowMs = Math.max(0, cooldownHours) * 3600_000;
  const claim = (k: string) =>
    kvUpdate<SpinRecord>('spins', k, (cur) => {
      const last = cur?.lastAt ? Date.parse(cur.lastAt) : 0;
      if (last && last + windowMs > at.getTime()) throw new CooldownActive(new Date(last + windowMs).toISOString());
      return { lastAt: at.toISOString(), count: (cur?.count ?? 0) + 1 };
    });
  try {
    await claim(spinIpKey(ipHash));
  } catch (err) {
    if (err instanceof CooldownActive) return err.nextSpinAt;
    throw err;
  }
  if (deviceId) {
    try {
      await claim(spinDeviceKey(deviceId));
    } catch (err) {
      if (err instanceof CooldownActive) return err.nextSpinAt; // ip record stays consumed – the device already spun today anyway
      throw err;
    }
  }
  return null;
}

/** Atomically reserve the weekly free-item slot for a username. Returns days to wait when it is taken. */
async function claimFreeItemSlot(username: string): Promise<number | null> {
  try {
    await kvUpdate<SpinRecord>('spins', freeItemKey(username), (cur) => {
      const last = cur?.lastAt ? Date.parse(cur.lastAt) : 0;
      if (last && Date.now() - last < FREE_ITEM_WINDOW_MS) throw new CooldownActive(new Date(last + FREE_ITEM_WINDOW_MS).toISOString());
      return { lastAt: nowIso(), count: (cur?.count ?? 0) + 1 };
    });
    return null;
  } catch (err) {
    if (err instanceof CooldownActive) return Math.max(1, Math.ceil((Date.parse(err.nextSpinAt) - Date.now()) / 86400_000));
    throw err;
  }
}

async function releaseFreeItemSlot(username: string): Promise<void> {
  await kvUpdate<SpinRecord>('spins', freeItemKey(username), (cur) => ({ lastAt: '', count: Math.max(0, (cur?.count ?? 1) - 1) })).catch(() => undefined);
}

/**
 * The welcome coupon lives in settings (code + percent). Make sure a matching
 * coupon record exists so checkout / quote can find it.
 */
async function ensureWelcomeCoupon(settings: SiteSettings): Promise<Coupon | null> {
  const w = settings.welcomeCoupon;
  if (!w?.enabled || !w.code) return null;
  const code = normalizeCode(w.code);
  const existing = await getCoupon(code);
  if (existing) {
    if (existing.source === 'welcome' && (existing.value !== w.percent || !existing.active)) {
      // keep the record in sync with the settings
      existing.value = w.percent;
      existing.active = true;
      await saveCoupon(existing);
    }
    return existing;
  }
  return createCoupon({ code, type: 'percent', value: w.percent, source: 'welcome', note: 'Welcome discount for first orders (managed in Settings).' });
}

/** Has this player already paid for an order? (welcome code = first order only) */
async function hasPaidOrder(username: string): Promise<boolean> {
  const u = username.toLowerCase();
  const idx = await listOrderIndex();
  return idx.some((e) => e.username.toLowerCase() === u && PAID_STATUSES.has(e.status));
}

interface Granted {
  prize: PublicPrize;
  code?: string;
  orderId?: string;
  creditCents?: number;
  message: string;
}

async function spinCoupon(prize: SpinPrize, percent: number, username: string | undefined, label: string): Promise<{ code: string; validDays: number }> {
  const validDays = Math.max(1, Math.floor(prize.validDays ?? 7));
  const c = await createCoupon({
    type: 'percent',
    value: percent,
    source: 'spin',
    prefix: 'SPIN',
    validDays,
    minOrderCents: prize.minOrderCents,
    boundUsername: username,
    maxUses: 1,
    note: `Spin wheel · ${label}`,
  });
  return { code: c.code, validDays };
}

function couponMessage(label: string, code: string, validDays: number, prize: SpinPrize, username?: string): string {
  const min = prize.minOrderCents ? ` on orders over ${usd(prize.minOrderCents)}` : '';
  const bound = username ? ` It is bound to ${username}.` : '';
  return `You won ${label}! Use code ${code} at checkout${min} – valid for ${validDays} day${validDays === 1 ? '' : 's'}.${bound}`;
}

/** Side effects for the prize that was rolled. Never throws for configuration problems – downgrades to a coupon instead. */
async function grantPrize(prize: SpinPrize, username: string | undefined, settings: SiteSettings): Promise<Granted> {
  const downgrade = async (percent: number, why: string): Promise<Granted> => {
    const fallback: SpinPrize = { id: `${prize.id}-coupon`, label: `${percent}% OFF`, type: 'coupon', percent, weight: 0, color: prize.color, validDays: 7 };
    const { code, validDays } = await spinCoupon(fallback, percent, username, fallback.label);
    return { prize: stripWeight(fallback), code, message: `${why} Here is ${percent}% off instead: ${code} (valid ${validDays} days).` };
  };

  switch (prize.type) {
    case 'coupon': {
      const percent = Math.min(100, Math.max(1, Math.floor(prize.percent ?? 5)));
      const { code, validDays } = await spinCoupon(prize, percent, username, prize.label);
      return { prize: stripWeight(prize), code, message: couponMessage(prize.label, code, validDays, prize, username) };
    }
    case 'free_item': {
      if (!username) return downgrade(5, `You hit ${prize.label}, but free items need a Minecraft username.`);
      if (!prize.productId) return downgrade(10, `You hit ${prize.label}, but that prize is not set up right now.`);
      const wait = await claimFreeItemSlot(username);
      if (wait !== null) {
        return downgrade(5, `You hit ${prize.label}, but ${username} already won a free item this week (next one in ${wait} day${wait === 1 ? '' : 's'}).`);
      }
      try {
        const order = await createFreeOrder(username, [{ productId: prize.productId, qty: Math.max(1, Math.floor(prize.qty ?? 1)) }], 'spin', `🎡 Spin wheel prize: ${prize.label}`);
        return {
          prize: stripWeight(prize),
          orderId: order.id,
          message: `You won ${prize.label}! Free order ${order.id} is on its way – we deliver it to ${username} in-game as soon as we are online.`,
        };
      } catch (err) {
        await releaseFreeItemSlot(username);
        if (err instanceof HttpError && err.status < 500) {
          console.warn('[spin] free item unavailable, downgrading', err.message);
          return downgrade(10, `You hit ${prize.label}, but it is out of stock right now.`);
        }
        throw err;
      }
    }
    case 'credit': {
      const cents = Math.max(0, Math.floor(prize.creditCents ?? 0));
      if (!username) return downgrade(5, `You hit ${prize.label}, but store credit needs a Minecraft username.`);
      if (cents <= 0) return downgrade(5, `You hit ${prize.label}, but that prize is not set up right now.`);
      await addCredit(username, cents, `Spin wheel prize: ${prize.label}`);
      return { prize: stripWeight(prize), creditCents: cents, message: `You won ${usd(cents)} store credit! It is applied automatically when you check out as ${username}.` };
    }
    default: {
      const h = settings.spin.cooldownHours;
      return { prize: stripWeight(prize), message: `No luck this time – the wheel resets in ${h} hour${h === 1 ? '' : 's'}. Come back for another spin!` };
    }
  }
}

// ───────────── routes ─────────────

export const routes: Route[] = [
  {
    method: 'POST',
    path: '/coupons/validate',
    handler: async ({ req, context }) => {
      const body = await readJson<{ code?: unknown; username?: unknown; subtotalCents?: unknown }>(req);
      const code = normalizeCode(requireString(body.code, 'Discount code', { min: 2, max: 40 }));
      const username = optionalUsername(body.username);
      const subtotal = typeof body.subtotalCents === 'number' && Number.isFinite(body.subtotalCents) && body.subtotalCents >= 0 ? Math.round(body.subtotalCents) : undefined;
      await rateLimit(`coupon-validate:${hashIp(getIp(req, context))}`, 30, 60);

      const settings = await getSettings();
      let coupon = await getCoupon(code);
      if (!coupon && settings.welcomeCoupon.enabled && normalizeCode(settings.welcomeCoupon.code || '') === code) coupon = await ensureWelcomeCoupon(settings);
      if (!coupon) return json({ valid: false, message: 'Unknown discount code – check the spelling.' });

      const pub = { code: coupon.code, type: coupon.type, value: coupon.value, minOrderCents: coupon.minOrderCents, expiresAt: coupon.expiresAt };
      const invalid = (message: string) => json({ valid: false, coupon: pub, message });
      if (!coupon.active) return invalid('This code is no longer active.');
      if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) return invalid('This code has expired.');
      if (coupon.maxUses !== undefined && coupon.uses >= coupon.maxUses) return invalid('This code has already been used.');
      if (coupon.boundUsername && username && coupon.boundUsername !== username.toLowerCase()) return invalid('This code belongs to a different Minecraft account.');
      if (coupon.minOrderCents && subtotal !== undefined && subtotal < coupon.minOrderCents) return invalid(`This code needs a minimum order of ${usd(coupon.minOrderCents)}.`);
      if (coupon.source === 'welcome' && username && (await hasPaidOrder(username))) return invalid('The welcome code is for your first order only – but check /spin for a fresh coupon!');

      const off = coupon.type === 'percent' ? `${coupon.value}% off` : `${usd(coupon.value)} off`;
      const notes: string[] = [];
      if (coupon.minOrderCents) notes.push(`min. order ${usd(coupon.minOrderCents)}`);
      if (coupon.boundUsername && !username) notes.push(`bound to ${coupon.boundUsername}`);
      if (coupon.expiresAt) notes.push(`valid until ${coupon.expiresAt.slice(0, 10)}`);
      return json({ valid: true, coupon: pub, message: `${coupon.code}: ${off}${notes.length ? ` (${notes.join(' · ')})` : ''} – applied at checkout.` });
    },
  },

  {
    method: 'GET',
    path: '/spin/status',
    handler: async ({ req, context, url }) => {
      const settings = await getSettings();
      const deviceId = cleanDeviceId(url.searchParams.get('deviceId'));
      const ipHash = hashIp(getIp(req, context));
      const cd = settings.spin.enabled ? await cooldown(ipHash, deviceId, settings.spin.cooldownHours) : { canSpin: false };
      const status: SpinStatus = {
        enabled: settings.spin.enabled,
        canSpin: settings.spin.enabled && cd.canSpin,
        nextSpinAt: cd.nextSpinAt,
        prizes: settings.spin.prizes.map(stripWeight),
        cooldownHours: settings.spin.cooldownHours,
      };
      return json(status);
    },
  },

  {
    method: 'POST',
    path: '/spin',
    handler: async ({ req, context }) => {
      const body = await readJson<{ deviceId?: unknown; username?: unknown }>(req);
      const deviceId = cleanDeviceId(body.deviceId);
      if (typeof body.deviceId !== 'string' || !body.deviceId.trim()) throw new HttpError(400, 'deviceId is required', 'validation');
      const username = optionalUsername(body.username);
      const ipHash = hashIp(getIp(req, context));
      await rateLimit(`spin:${ipHash}`, 10, 60);

      const settings = await getSettings();
      if (!settings.spin.enabled) throw new HttpError(403, 'The spin wheel is taking a break – check back soon.', 'disabled');
      const prizes = settings.spin.prizes;
      if (!prizes.length) throw new HttpError(503, 'The wheel has no prizes configured yet.', 'not_configured');
      if (settings.spin.requireUsername && !username) throw new HttpError(400, 'Enter your Minecraft username to win free items', 'username_required');

      // the spin is consumed atomically before any prize side effect: parallel requests
      // cannot all pass the cooldown, and a failure can never grant a re-roll
      const spunAt = new Date();
      const blockedUntil = await consumeSpin(ipHash, deviceId, settings.spin.cooldownHours, spunAt);
      if (blockedUntil) {
        return json({ error: 'You already spun – come back when the timer hits zero.', code: 'cooldown', nextSpinAt: blockedUntil, details: { nextSpinAt: blockedUntil } }, 429);
      }
      const nextSpinAt = new Date(spunAt.getTime() + settings.spin.cooldownHours * 3600_000).toISOString();

      const index = weightedIndex(prizes.map((p) => Math.max(0, Number(p.weight) || 0)));
      const prize = prizes[index];
      const granted = await grantPrize(prize, username, settings);

      if (granted.prize.type !== 'nothing') {
        await notifyDiscord({
          title: `🎡 Spin win · ${granted.prize.label}`,
          color: COLORS.pink,
          url: granted.orderId ? `${siteUrl()}/admin/orders/${granted.orderId}` : undefined,
          fields: [
            { name: 'Player', value: username ? `\`${username}\`` : '_anonymous_', inline: true },
            { name: 'Prize', value: granted.prize.label, inline: true },
            ...(granted.code ? [{ name: 'Code', value: `\`${granted.code}\``, inline: true }] : []),
            ...(granted.orderId ? [{ name: 'Free order', value: granted.orderId, inline: true }] : []),
            ...(granted.creditCents ? [{ name: 'Credit', value: usd(granted.creditCents), inline: true }] : []),
          ],
        });
      }

      const result: PublicSpinResult = {
        prize: granted.prize,
        index,
        code: granted.code,
        message: granted.message,
        nextSpinAt,
        orderId: granted.orderId,
        creditCents: granted.creditCents,
      };
      return json(result);
    },
  },

  {
    method: 'POST',
    path: '/redeem',
    handler: async ({ req, context }) => {
      const body = await readJson<{ code?: unknown; username?: unknown }>(req);
      const code = normalizeGiftCode(requireString(body.code, 'Gift code', { min: 3, max: 40 }));
      const username = requireUsername(body.username);
      await rateLimit(`redeem:${hashIp(getIp(req, context))}`, 10, 600);

      const existing = await getGift(code);
      if (!existing) throw new HttpError(404, 'Unknown gift code – check for typos.', 'not_found');
      const problem = giftProblem(existing);
      if (problem) throw new HttpError(problem.status, problem.message, problem.code);

      // claim first (atomic: per-player marker + uses counter), then create the order
      const gift = await claimGift(code, username);
      let order;
      try {
        order = await createFreeOrder(username, [{ productId: gift.productId, qty: gift.qty }], 'redeem', `🎁 Gift code ${gift.code}`, { ipHash: hashIp(getIp(req, context)) });
      } catch (err) {
        await rollbackClaim(code, username);
        if (err instanceof HttpError && err.status === 400) throw new HttpError(409, 'The item behind this gift code is currently unavailable – contact us on Discord and we will sort it out.', 'unavailable');
        throw err;
      }
      await finalizeClaim(code, username, order.id);
      return json({ order: toPublicOrder(order) }, 201);
    },
  },

  {
    method: 'GET',
    path: '/credit',
    handler: async ({ req, context, url }) => {
      const username = requireUsername(url.searchParams.get('username'));
      await rateLimit(`credit:${hashIp(getIp(req, context))}`, 60, 60);
      const acc = await getCredit(username);
      return json({ balanceCents: acc.balanceCents });
    },
  },

  {
    method: 'GET',
    path: '/referral',
    handler: async ({ req, context, url }) => {
      const username = requireUsername(url.searchParams.get('username'));
      await rateLimit(`referral:${hashIp(getIp(req, context))}`, 60, 60);
      const [settings, idx, credit] = await Promise.all([getSettings(), listOrderIndex(), getCredit(username)]);
      const u = username.toLowerCase();
      // the order index does not carry the referral code today – count rewards as a fallback
      const fromIndex = idx.filter((e) => (e as { referralCode?: string }).referralCode?.toLowerCase() === u && PAID_STATUSES.has(e.status)).length;
      const rewards = credit.history.filter((h) => h.reason.startsWith('Referral reward') && h.deltaCents > 0);
      const earnedCents = rewards.reduce((s, h) => s + h.deltaCents, 0);
      return json({
        code: username,
        referrals: Math.max(fromIndex, rewards.length),
        earnedCents,
        enabled: settings.referral.enabled,
        friendPercent: settings.referral.friendPercent,
        referrerPercent: settings.referral.referrerPercent,
      });
    },
  },
];
