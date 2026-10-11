import { useEffect, useState } from 'react';
import { usernameSyntaxError, validateUsername, type UsernameStatus } from '../../lib/mc';

export interface UsernameState {
  status: 'idle' | 'checking' | UsernameStatus;
  /** canonical name once verified */
  name?: string;
  uuid?: string;
  message: string;
}

/** Live, debounced Minecraft username validation (syntax → API → Mojang). */
export function useUsernameCheck(username: string, debounceMs = 500): UsernameState {
  const [state, setState] = useState<UsernameState>({ status: 'idle', message: '' });

  useEffect(() => {
    const n = username.trim();
    if (!n) {
      setState({ status: 'idle', message: '' });
      return;
    }
    const syntax = usernameSyntaxError(n);
    if (syntax) {
      setState({ status: 'invalid', message: syntax });
      return;
    }
    const ctrl = new AbortController();
    setState({ status: 'checking', name: n, message: 'Checking Mojang…' });
    const t = window.setTimeout(() => {
      validateUsername(n, ctrl.signal)
        .then((r) => setState(r))
        .catch(() => {
          /* aborted */
        });
    }, debounceMs);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [username, debounceMs]);

  return state;
}
