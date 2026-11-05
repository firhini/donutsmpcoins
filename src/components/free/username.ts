import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '../../lib/device';
import { MC_USERNAME_RE, isBedrockName, mcNameProblem } from '../../shared/mcName';

/** Java names (3–16 letters, digits, _) and Bedrock names (".Gamertag"). */
export { MC_USERNAME_RE };

export const USERNAME_KEY = 'dc_username';

/** Returns a human readable problem with the username, or null when it is valid. */
export function usernameProblem(name: string): string | null {
  return mcNameProblem(name);
}

export function isValidUsername(name: string): boolean {
  return MC_USERNAME_RE.test(name.trim());
}

/** Bedrock players have no Java skin to preview. */
export function hasJavaAvatar(name: string): boolean {
  return !isBedrockName(name);
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
  const [name, setNameState] = useState<string>('');
  // load after mount so pre-rendered HTML matches the first client render
  useEffect(() => {
    const saved = getRememberedUsername();
    if (saved) setNameState((cur) => cur || saved);
  }, []);
  const setName = useCallback((v: string) => {
    setNameState(v);
    if (isValidUsername(v)) storageSet(USERNAME_KEY, v.trim());
  }, []);
  return [name, setName];
}
