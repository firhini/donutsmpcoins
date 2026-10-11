import type { Coupon, CouponSource } from '../../src/shared/types';
import { kvGet, kvSet, kvList, kvDelete, kvUpdate } from './store';
import { couponCode } from './ids';
import { HttpError, nowIso } from './http';

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export async function getCoupon(code: string): Promise<Coupon | null> {
  const c = normalizeCode(code);
  if (!c) return null;
  return kvGet<Coupon>('coupons', c);
}

export async function saveCoupon(c: Coupon): Promise<void> {
  await kvSet('coupons', normalizeCode(c.code), { ...c, code: normalizeCode(c.code) });
}

export async function deleteCoupon(code: string): Promise<void> {
  await kvDelete('coupons', normalizeCode(code));
}

export async function listCoupons(): Promise<Coupon[]> {
  const keys = await kvList('coupons');
  const out: Coupon[] = [];
  for (const k of keys) {
    const c = await kvGet<Coupon>('coupons', k);
    if (c) out.push(c);
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface CreateCouponInput {
  type: 'percent' | 'fixed';
  value: number;
  source: CouponSource;
  prefix?: string;
  code?: string;
  minOrderCents?: number;
  maxUses?: number;
  validDays?: number;
  boundUsername?: string;
  note?: string;
}

/** Create (and persist) a coupon. Generates a unique code unless one is given. */
export async function createCoupon(input: CreateCouponInput): Promise<Coupon> {
  let code = input.code ? normalizeCode(input.code) : '';
  if (!code) {
    for (let i = 0; i < 5; i++) {
      const candidate = couponCode(input.prefix ?? 'DC');
      if (!(await kvGet('coupons', candidate))) {
        code = candidate;
        break;
      }
    }
    if (!code) code = couponCode(input.prefix ?? 'DC');
  }
  const c: Coupon = {
    code,
    type: input.type,
    value: input.value,
    minOrderCents: input.minOrderCents,
    maxUses: input.maxUses,
    uses: 0,
    expiresAt: input.validDays ? new Date(Date.now() + input.validDays * 86400_000).toISOString() : undefined,
    boundUsername: input.boundUsername?.toLowerCase(),
    source: input.source,
    active: true,
    createdAt: nowIso(),
    note: input.note,
  };
  await saveCoupon(c);
  return c;
}

/**
 * Consume one use of a coupon atomically. Throws 409 when the coupon is no
 * longer usable at write time (so N concurrent orders cannot all use a
 * single-use code). Returns the updated coupon, or null for unknown codes.
 */
export async function consumeCoupon(code: string, username?: string): Promise<Coupon | null> {
  const key = normalizeCode(code);
  if (!key || !(await kvGet<Coupon>('coupons', key))) return null;
  return kvUpdate<Coupon>('coupons', key, (cur) => {
    if (!cur) throw new HttpError(409, 'This code is no longer available.', 'coupon_gone');
    if (!cur.active) throw new HttpError(409, 'This code is no longer active.', 'coupon_inactive');
    if (cur.expiresAt && new Date(cur.expiresAt).getTime() < Date.now()) throw new HttpError(409, 'This code has expired.', 'coupon_expired');
    if (cur.maxUses !== undefined && cur.uses >= cur.maxUses) throw new HttpError(409, 'This code has already been used.', 'coupon_used');
    if (cur.boundUsername && username && cur.boundUsername !== username.toLowerCase()) throw new HttpError(409, 'This code belongs to a different Minecraft account.', 'coupon_bound');
    return { ...cur, uses: cur.uses + 1 };
  });
}

/** Give a use back (order creation failed after the coupon was consumed). */
export async function unconsumeCoupon(code: string): Promise<void> {
  const key = normalizeCode(code);
  if (!key || !(await kvGet<Coupon>('coupons', key))) return;
  await kvUpdate<Coupon>('coupons', key, (cur) => (cur ? { ...cur, uses: Math.max(0, cur.uses - 1) } : (cur as unknown as Coupon)));
}
