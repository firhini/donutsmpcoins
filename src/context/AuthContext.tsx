import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PublicUser } from '../shared/types';
import { apiGet, apiPost } from '../lib/api';

export type LoginProvider = 'discord' | 'google';

interface AuthApi {
  user: PublicUser | null;
  /** some player login (Discord and/or Google) is configured on the server */
  configured: boolean;
  providers: Record<LoginProvider, boolean>;
  guildRequired: boolean;
  loading: boolean;
  /** provider defaults to Discord when available */
  login: (next?: string, provider?: LoginProvider) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  saveMcUsername: (username: string) => Promise<PublicUser>;
  refreshGuild: () => Promise<boolean>;
}

const Ctx = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [configured, setConfigured] = useState(false);
  const [providers, setProviders] = useState<Record<LoginProvider, boolean>>({ discord: false, google: false });
  const [guildRequired, setGuildRequired] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await apiGet<{ user: PublicUser | null; configured: boolean; providers?: Record<LoginProvider, boolean>; guildRequired: boolean }>('/auth/me');
      setUser(r.user);
      setConfigured(r.configured);
      setProviders(r.providers ?? { discord: r.configured, google: false });
      setGuildRequired(!!r.guildRequired);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    (next?: string, provider?: LoginProvider) => {
      const target = next ?? `${window.location.pathname}${window.location.search}`;
      const p = provider ?? (providers.discord || !providers.google ? 'discord' : 'google');
      window.location.assign(`/api/auth/${p}/login?next=${encodeURIComponent(target)}`);
    },
    [providers],
  );

  const logout = useCallback(async () => {
    try {
      await apiPost('/auth/logout', {});
      setUser(null);
    } catch (err) {
      // the HttpOnly cookie is still valid – do not pretend to be logged out
      console.warn('[auth] logout failed', err);
      throw err;
    }
  }, []);

  const saveMcUsername = useCallback(async (username: string) => {
    const r = await apiPost<{ user: PublicUser }>('/auth/mc-username', { username });
    setUser(r.user);
    return r.user;
  }, []);

  const refreshGuild = useCallback(async () => {
    const r = await apiPost<{ user: PublicUser; inGuild: boolean }>('/auth/refresh-guild', {});
    setUser(r.user);
    return r.inGuild;
  }, []);

  const value = useMemo<AuthApi>(() => ({ user, configured, providers, guildRequired, loading, login, logout, refresh, saveMcUsername, refreshGuild }), [user, configured, providers, guildRequired, loading, login, logout, refresh, saveMcUsername, refreshGuild]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
