import { createHmac, timingSafeEqual } from 'node:crypto';
import { HttpError } from './http';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  const s = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) throw new HttpError(503, 'Admin is not configured (set ADMIN_PASSWORD).', 'admin_unconfigured');
  return `donutcoins-admin:${s}`;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new HttpError(503, 'Admin is not configured (set ADMIN_PASSWORD).', 'admin_unconfigured');
  return safeEqual(password, expected);
}

export function issueToken(): { token: string; expiresAt: string } {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `admin.${exp}`;
  return { token: `${payload}.${sign(payload)}`, expiresAt: new Date(exp).toISOString() };
}

export function verifyToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [scope, exp, sig] = parts;
  if (scope !== 'admin') return false;
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  try {
    return safeEqual(sig, sign(`${scope}.${exp}`));
  } catch {
    return false;
  }
}

/** Throws 401 unless the request carries a valid admin bearer token. */
export function requireAdmin(req: Request): void {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!verifyToken(token)) throw new HttpError(401, 'Admin login required', 'unauthorized');
}
