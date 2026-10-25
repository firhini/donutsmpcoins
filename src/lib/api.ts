/** Fetch wrapper for /api/* (Netlify function). */

export class ApiClientError extends Error {
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

const ADMIN_TOKEN_KEY = 'dc_admin_token';

export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setAdminToken(token: string | null, remember = false): void {
  try {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    if (token) (remember ? localStorage : sessionStorage).setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  admin?: boolean;
  signal?: AbortSignal;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  if (opts.admin) {
    const t = getAdminToken();
    if (t) headers.authorization = `Bearer ${t}`;
  }
  const res = await fetch(`/api${path.startsWith('/') ? path : `/${path}`}`, {
    method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Not JSON: the request never reached the API function (Netlify served an HTML page). Never
    // show a page's source as an error message – say what is actually wrong.
    const html = /^\s*<!doctype html|^\s*<html/i.test(text);
    data = {
      error:
        res.status === 404 && html
          ? 'The API is not reachable (HTTP 404): the Netlify function "api" is not deployed on this site. Check the deploy log for "Functions bundling" errors and the Functions tab in Netlify.'
          : `The server answered with HTTP ${res.status} instead of JSON${html ? ' (an HTML page)' : ''}. Please try again in a moment.`,
      code: 'not_json',
    };
  }
  if (!res.ok) {
    const e = (data ?? {}) as { error?: string; code?: string; details?: unknown };
    throw new ApiClientError(res.status, e.error || `Request failed (${res.status})`, e.code, e.details);
  }
  return data as T;
}

export const apiGet = <T,>(path: string, admin = false) => api<T>(path, { admin });
export const apiPost = <T,>(path: string, body: unknown, admin = false) => api<T>(path, { method: 'POST', body, admin });
export const apiPatch = <T,>(path: string, body: unknown, admin = false) => api<T>(path, { method: 'PATCH', body, admin });
export const apiPut = <T,>(path: string, body: unknown, admin = false) => api<T>(path, { method: 'PUT', body, admin });
export const apiDelete = <T,>(path: string, admin = false) => api<T>(path, { method: 'DELETE', admin });
