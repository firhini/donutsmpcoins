import type { Coupon, CouponSource } from '../../src/shared/types';
import { kvGet, kvSet, kvList, kvDelete } from './store';
import { couponCode } from './ids';
import { nowIso } from './http';

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

/** Increment usage after a successful order creation. */
export async function consumeCoupon(code: string): Promise<void> {
  const c = await getCoupon(code);
  if (!c) return;
  c.uses += 1;
  await saveCoupon(c);
}
