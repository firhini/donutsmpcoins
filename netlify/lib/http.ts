import type { Context } from '@netlify/functions';
import { createHash } from 'node:crypto';

export class HttpError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function error(status: number, message: string, code?: string, details?: unknown): Response {
  return json({ error: message, code, details }, status);
}

export async function readJson<T = unknown>(req: Request): Promise<T> {
  const text = await req.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, 'Invalid JSON body', 'bad_json');
  }
}

export function getIp(req: Request, context?: Context): string {
  const ctxIp = (context as unknown as { ip?: string } | undefined)?.ip;
  return (
    ctxIp ||
    req.headers.get('x-nf-client-connection-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    '0.0.0.0'
  );
}

export function hashIp(ip: string): string {
  const salt = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'donutcoins';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 24);
}

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

// ───────────── tiny router ─────────────

export type Handler = (ctx: RouteContext) => Promise<Response> | Response;
export interface RouteContext {
  req: Request;
  context: Context;
  params: Record<string, string>;
  url: URL;
}
export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
  /** path pattern relative to /api, e.g. '/orders/:id' or '/admin/*' */
  path: string;
  handler: Handler;
}

function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const pp = pattern.split('/').filter(Boolean);
  const sp = pathname.split('/').filter(Boolean);
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    const seg = pp[i];
    if (seg === '*') {
      params['*'] = sp.slice(i).join('/');
      return params;
    }
    if (sp[i] === undefined) return null;
    if (seg.startsWith(':')) params[seg.slice(1)] = decodeURIComponent(sp[i]);
    else if (seg !== sp[i]) return null;
  }
  return pp.length === sp.length ? params : null;
}

export function stripApiPrefix(pathname: string): string {
  // /api/orders/123 → /orders/123 ; /.netlify/functions/api/orders → /orders
  let p = pathname.replace(/^\/\.netlify\/functions\/api/, '').replace(/^\/api/, '');
  if (!p.startsWith('/')) p = `/${p}`;
  return p.replace(/\/+$/, '') || '/';
}

export async function dispatch(routes: Route[], req: Request, context: Context): Promise<Response> {
  const url = new URL(req.url);
  const pathname = stripApiPrefix(url.pathname);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  let methodMismatch = false;
  for (const r of routes) {
    const params = matchPath(r.path, pathname);
    if (!params) continue;
    if (r.method !== req.method) {
      methodMismatch = true;
      continue;
    }
    try {
      return await r.handler({ req, context, params, url });
    } catch (err) {
      if (err instanceof HttpError) return error(err.status, err.message, err.code, err.details);
      console.error(`[api] ${req.method} ${pathname} failed:`, err);
      return error(500, 'Internal server error', 'internal');
    }
  }
  if (methodMismatch) return error(405, 'Method not allowed', 'method_not_allowed');
  return error(404, `No route for ${req.method} ${pathname}`, 'not_found');
}

/** Minimal validation helpers (keeps zod optional in hot paths). */
export function requireString(v: unknown, name: string, { min = 1, max = 200 } = {}): string {
  if (typeof v !== 'string') throw new HttpError(400, `${name} is required`, 'validation');
  const s = v.trim();
  if (s.length < min) throw new HttpError(400, `${name} is required`, 'validation');
  if (s.length > max) throw new HttpError(400, `${name} is too long`, 'validation');
  return s;
}

export function optionalString(v: unknown, name: string, max = 500): string | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  return requireString(v, name, { min: 0, max });
}

export const MC_USERNAME_RE = /^[A-Za-z0-9_]{3,16}$/;

export function requireUsername(v: unknown): string {
  const s = requireString(v, 'Minecraft username', { min: 3, max: 16 });
  if (!MC_USERNAME_RE.test(s)) throw new HttpError(400, 'Minecraft usernames are 3–16 letters, numbers or underscores.', 'validation');
  return s;
}

export function nowIso(): string {
  return new Date().toISOString();
}
