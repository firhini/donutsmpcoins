/**
 * Signed, HttpOnly login cookie for Discord-authenticated players.
 * Payload is a compact JSON object signed with HMAC-SHA256 (no server state needed).
 */
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { HttpError } from './http';

export const SESSION_COOKIE = 'dc_session';
export const STATE_COOKIE = 'dc_oauth_state';
const SESSION_TTL_S = 60 * 60 * 24 * 30; // 30 days
const STATE_TTL_S = 60 * 10;

export interface SessionPayload {
  /** discord user id */
  uid: string;
  iat: number;
  exp: number;
}

function secret(): string {
  const s = process.env.SESSION_SECRET || process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) throw new HttpError(503, 'Login is not configured (set SESSION_SECRET or ADMIN_PASSWORD).', 'auth_unconfigured');
  return `donutcoins-session:${s}`;
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function sign(data: string): string {
  return createHmac('sha256', secret()).update(data).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function encodeToken(payload: object): string {
  const data = b64url(JSON.stringify(payload));
  return `${data}.${sign(data)}`;
}

export function decodeToken<T extends { exp?: number }>(token: string | null | undefined): T | null {
  if (!token) return null;
  const i = token.lastIndexOf('.');
  if (i <= 0) return null;
  const data = token.slice(0, i);
  const sig = token.slice(i + 1);
  try {
    if (!safeEqual(sig, sign(data))) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as T;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function parseCookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = req.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function isSecure(req: Request): boolean {
  try {
    return new URL(req.url).protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
  } catch {
    return false;
  }
}

export function cookieHeader(req: Request, name: string, value: string, maxAgeSeconds: number): string {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAgeSeconds}`];
  if (isSecure(req)) parts.push('Secure');
  return parts.join('; ');
}

export function clearCookieHeader(req: Request, name: string): string {
  return cookieHeader(req, name, '', 0);
}

/** Create the login cookie value for a Discord user id. */
export function sessionCookieValue(uid: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { uid, iat: now, exp: now + SESSION_TTL_S };
  return encodeToken(payload);
}

/** Read the login session from the request (null when absent/invalid/expired). */
export function readSession(req: Request): SessionPayload | null {
  try {
    const cookies = parseCookies(req);
    return decodeToken<SessionPayload>(cookies[SESSION_COOKIE]);
  } catch {
    return null;
  }
}

/** OAuth state: random nonce + where to go afterwards, kept in a short-lived signed cookie. */
export interface OAuthState {
  nonce: string;
  next: string;
  exp: number;
}

export function newOAuthState(next: string): { nonce: string; cookie: string } {
  const nonce = randomBytes(16).toString('base64url');
  const payload: OAuthState = { nonce, next, exp: Math.floor(Date.now() / 1000) + STATE_TTL_S };
  return { nonce, cookie: encodeToken(payload) };
}

export function readOAuthState(req: Request): OAuthState | null {
  try {
    return decodeToken<OAuthState>(parseCookies(req)[STATE_COOKIE]);
  } catch {
    return null;
  }
}

export { SESSION_TTL_S, STATE_TTL_S };
