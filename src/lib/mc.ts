/**
 * Minecraft username helpers: syntax validation, server-side lookup
 * (POST /api/mc/validate → Mojang) and avatar URLs.
 */
import { api, ApiClientError } from './api';
import { MC_USERNAME_RE, isBedrockName, mcNameProblem } from '../shared/mcName';

export { MC_USERNAME_RE };

export type UsernameStatus = 'invalid' | 'valid' | 'notfound' | 'unverified';

export interface UsernameCheck {
  status: UsernameStatus;
  /** canonical (correctly cased) name when the account was found, otherwise what was typed */
  name?: string;
  uuid?: string;
  message: string;
  /** Bedrock player (".Gamertag") – no Mojang account to check */
  bedrock?: boolean;
}

interface McValidateResponse {
  valid: boolean;
  name?: string;
  uuid?: string;
  reason?: string;
  unverified?: boolean;
}

const UNVERIFIED_MSG = 'Could not verify this name right now – double-check the spelling.';

export function isValidUsernameSyntax(name: string): boolean {
  return MC_USERNAME_RE.test(name.trim());
}

/** Human readable syntax problem, or null when the name looks fine. */
export function usernameSyntaxError(name: string): string | null {
  return mcNameProblem(name);
}

const cache = new Map<string, UsernameCheck>();

/**
 * Validate a username: syntax first, then the API (which asks Mojang).
 * Network/API problems degrade to `unverified` so checkout is never blocked
 * by a hiccup. Throws only when aborted via the signal.
 */
export async function validateUsername(name: string, signal?: AbortSignal): Promise<UsernameCheck> {
  const n = name.trim();
  const syntax = usernameSyntaxError(n);
  if (syntax) return { status: 'invalid', message: syntax };
  // Bedrock names cannot be checked against Mojang – the syntax is all we can verify
  if (isBedrockName(n)) return { status: 'valid', name: n, bedrock: true, message: `Bedrock player – we deliver to ${n}` };
  const key = n.toLowerCase();
  const hit = cache.get(key);
  if (hit) return hit;

  let result: UsernameCheck;
  try {
    const r = await api<McValidateResponse>('/mc/validate', { body: { username: n }, signal });
    if (r.valid && r.unverified) result = { status: 'unverified', name: n, message: UNVERIFIED_MSG };
    else if (r.valid) result = { status: 'valid', name: r.name || n, uuid: r.uuid, message: `${r.name || n} found` };
    else result = { status: 'notfound', name: n, message: r.reason || 'No Minecraft account with this name was found.' };
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    if (err instanceof ApiClientError && err.status === 400) return { status: 'invalid', message: err.message };
    result = { status: 'unverified', name: n, message: UNVERIFIED_MSG };
  }
  if (result.status !== 'unverified') cache.set(key, result);
  return result;
}

/** Head render of a player (public mc-heads.net service). */
export function avatarUrl(name: string, size = 64): string {
  return `https://mc-heads.net/avatar/${encodeURIComponent(name.trim())}/${size}`;
}
