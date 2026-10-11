/**
 * In-process test harness for the Netlify API function.
 *
 * The kv store (netlify/lib/store.ts) falls back to JSON files under
 * `process.cwd()/.data` when Netlify Blobs is unavailable, and it resolves that
 * directory when the module is first evaluated. So this helper:
 *   1. moves the process into a fresh temp directory,
 *   2. clears every integration env var (no Discord / Stripe / PayPal calls),
 *   3. THEN dynamically imports the function handler and the libs.
 *
 * Import this file FIRST in a test and only use the libs it re-exports –
 * never statically import netlify/lib/* from a test, or the store may be
 * evaluated before the chdir.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Context } from '@netlify/functions';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'donutcoins-test-'));
try {
  process.chdir(tmpRoot);
} catch (err) {
  // vitest `threads` pool cannot chdir – tests then write to the repo's .data (still works)
  console.warn('[tests] process.chdir unavailable, using', process.cwd(), (err as Error).message);
}

process.env.ADMIN_PASSWORD ||= 'test-admin-password';
process.env.SITE_URL ||= 'http://localhost:8888';
for (const key of ['DISCORD_WEBHOOK_URL', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_ENV', 'NOWPAYMENTS_API_KEY', 'NOWPAYMENTS_IPN_SECRET', 'NETLIFY', 'NETLIFY_BLOBS_CONTEXT']) {
  delete process.env[key];
}

// Loaded AFTER the chdir so the file store lands in the temp dir.
const fn = await import('../netlify/functions/api');
export const handler = fn.default;

export const lib = {
  store: await import('../netlify/lib/store'),
  orders: await import('../netlify/lib/orders'),
  credit: await import('../netlify/lib/credit'),
  coupons: await import('../netlify/lib/coupons'),
  catalog: await import('../netlify/lib/catalog'),
  settings: await import('../netlify/lib/settings'),
  stripe: await import('../netlify/lib/payments/stripe'),
  nowpayments: await import('../netlify/lib/payments/nowpayments'),
};

/** Where this test run keeps its data (deleted by cleanupTestData). */
export const dataDir = path.join(process.cwd(), '.data');

export function cleanupTestData(): void {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

let ipCounter = 0;
/** A never-before-used client IP – keeps rate limits out of unrelated tests. */
export function freshIp(): string {
  ipCounter += 1;
  return `10.${(ipCounter >> 16) & 255}.${(ipCounter >> 8) & 255}.${ipCounter & 255}`;
}

export interface CallOptions {
  /** client IP (default: a fresh one per call) */
  ip?: string;
  headers?: Record<string, string>;
  /** send the body verbatim (string) instead of JSON-encoding it */
  rawBody?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResult<T = any> {
  status: number;
  data: T;
  headers: Headers;
}

/** Call the API function in-process, e.g. call('POST', '/orders', { ... }). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function call<T = any>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', apiPath: string, body?: unknown, opts: CallOptions = {}): Promise<ApiResult<T>> {
  const headers = new Headers(opts.headers ?? {});
  let payload: string | undefined;
  if (opts.rawBody !== undefined) {
    payload = opts.rawBody;
  } else if (body !== undefined) {
    payload = JSON.stringify(body);
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  }
  const req = new Request(`http://localhost/api${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`, { method, headers, body: payload });
  const context = { ip: opts.ip ?? freshIp() } as unknown as Context;
  const res = await handler(req, context);
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data: data as T, headers: res.headers };
}

export const get = <T = any>(apiPath: string, opts?: CallOptions) => call<T>('GET', apiPath, undefined, opts); // eslint-disable-line @typescript-eslint/no-explicit-any
export const post = <T = any>(apiPath: string, body?: unknown, opts?: CallOptions) => call<T>('POST', apiPath, body ?? {}, opts); // eslint-disable-line @typescript-eslint/no-explicit-any

/** Minimal valid checkout body – override what a test cares about. */
export function orderBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    username: 'TestPlayer',
    items: [{ productId: 'money-1m', qty: 50 }],
    paymentMethodId: 'paypal',
    tosAccepted: true,
    ...overrides,
  };
}
