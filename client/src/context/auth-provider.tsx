import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { authService } from '../services/auth/auth.service.js';
import { clearToken, getToken, storeToken } from '../services/auth/token-storage.js';
import type { SafeUser } from '../types/domain.js';
import { AuthContext } from './auth-context.js';

/**
 * Renders the auth provider interface.
 * @param props - The component properties.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    /**
     * Restores the saved authentication state when the provider mounts.
     */
    const restore = async () => {
      if (!getToken()) {
        if (active) setReady(true);
        return;
      }
      try {
        const current = await authService.me();
        if (active) setUser(current);
      } catch {
        clearToken();
        if (active) setUser(null);
      } finally {
        if (active) setReady(true);
      }
    };
    void restore();
    /**
     * Clears invalid authentication state after an unauthorized API response.
     */
    const onUnauthorized = () => {
      clearToken();
      setUser(null);
      setReady(true);
    };
    window.addEventListener('cartograph:unauthorized', onUnauthorized);
    return () => {
      active = false;
      window.removeEventListener('cartograph:unauthorized', onUnauthorized);
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string, remember: boolean) => {
    const result = await authService.login(email, password);
    storeToken(result.token, remember);
    setUser(result.user);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const result = await authService.register(name, email, password);
    storeToken(result.token, false);
    setUser(result.user);
  }, []);

  const completeOAuth = useCallback(
    async (code: string, clientState: string, remember: boolean) => {
      const result = await authService.exchangeOAuthCode(code, clientState);
      storeToken(result.token, remember);
      setUser(result.user);
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      if (getToken()) await authService.logout();
    } finally {
      clearToken();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, ready, signIn, signUp, completeOAuth, signOut }),
    [user, ready, signIn, signUp, completeOAuth, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
