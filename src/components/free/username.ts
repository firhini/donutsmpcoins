import { useCallback, useState } from 'react';
import { storageGet, storageSet } from '../../lib/device';

/** Minecraft Java usernames: 3–16 chars, letters, digits, underscore. */
export const MC_USERNAME_RE = /^[A-Za-z0-9_]{3,16}$/;

export const USERNAME_KEY = 'dc_username';

/** Returns a human readable problem with the username, or null when it is valid. */
export function usernameProblem(name: string): string | null {
  const n = name.trim();
  if (!n) return 'Enter your Minecraft username.';
  if (n.length < 3) return 'Usernames have at least 3 characters.';
  if (n.length > 16) return 'Usernames have at most 16 characters.';
  if (!MC_USERNAME_RE.test(n)) return 'Only letters, numbers and underscores are allowed.';
  return null;
}

export function isValidUsername(name: string): boolean {
  return MC_USERNAME_RE.test(name.trim());
}

export function avatarUrl(name: string, size = 48): string {
  return `https://mc-heads.net/avatar/${encodeURIComponent(name.trim())}/${size}`;
}

export function getRememberedUsername(): string {
  const v = storageGet<string>(USERNAME_KEY, '');
  return typeof v === 'string' ? v : '';
}

export function rememberUsername(name: string): void {
  const n = name.trim();
  if (isValidUsername(n)) storageSet(USERNAME_KEY, n);
}

/** Username state that is remembered across pages (localStorage). */
export function useRememberedUsername(): [string, (v: string) => void] {
  const [name, setNameState] = useState<string>(() => getRememberedUsername());
  const setName = useCallback((v: string) => {
    setNameState(v);
    if (isValidUsername(v)) storageSet(USERNAME_KEY, v.trim());
  }, []);
  return [name, setName];
}
