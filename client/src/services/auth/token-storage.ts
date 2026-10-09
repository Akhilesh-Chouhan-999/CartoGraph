const TOKEN_KEY = 'cartograph.auth.token';

/**
 * Reads the saved authentication token from browser storage.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Saves the authentication token in browser storage.
 * @param token - The authentication token.
 * @param persistent - The persistent value used by this operation.
 */
export function storeToken(token: string, persistent: boolean): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  (persistent ? window.localStorage : window.sessionStorage).setItem(TOKEN_KEY, token);
}

/**
 * Removes the saved authentication token from browser storage.
 */
export function clearToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
}
