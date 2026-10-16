import { apiClient, responseData } from '../api/api-client.js';
import type { ApiEnvelope, AuthResult, SafeUser } from '../../types/domain.js';

export type OAuthProvider = 'google' | 'github' | 'gitlab';
export type OAuthProviderStatus = Record<OAuthProvider, boolean>;

export const OAUTH_REMEMBER_KEY = 'cartograph.oauth.remember';
export const OAUTH_RETURN_TO_KEY = 'cartograph.oauth.returnTo';
export const OAUTH_CLIENT_STATE_KEY = 'cartograph.oauth.clientState';

export function createOAuthClientState(): string {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

export const authService = {
  oauthStartUrl(provider: OAuthProvider, clientState: string): string {
    const url = new URL(`${apiClient.defaults.baseURL}/auth/oauth/${provider}/start`);
    url.searchParams.set('client_state', clientState);
    return url.toString();
  },
  oauthProviders(): Promise<OAuthProviderStatus> {
    return responseData<OAuthProviderStatus>(
      apiClient.get<ApiEnvelope<OAuthProviderStatus>>('/auth/oauth/providers'),
    );
  },
  exchangeOAuthCode(code: string, clientState: string): Promise<AuthResult> {
    return responseData<AuthResult>(
      apiClient.post<ApiEnvelope<AuthResult>>('/auth/oauth/exchange', { code, clientState }),
    );
  },
  async startAccountLink(provider: OAuthProvider, clientState: string): Promise<string> {
    const result = await responseData<{ authorizationUrl: string }>(
      apiClient.post<ApiEnvelope<{ authorizationUrl: string }>>(`/auth/oauth/${provider}/link`, {
        clientState,
      }),
    );
    return result.authorizationUrl;
  },
  linkedProviders(): Promise<OAuthProvider[]> {
    return responseData<OAuthProvider[]>(
      apiClient.get<ApiEnvelope<OAuthProvider[]>>('/auth/oauth/accounts'),
    );
  },
  /**
   * Authenticates the supplied email and password and returns the signed-in user.
   * @param email - The user email address.
   * @param password - The plaintext password to verify or hash.
   */
  login(email: string, password: string): Promise<AuthResult> {
    return responseData<AuthResult>(
      apiClient.post<ApiEnvelope<AuthResult>>('/auth/login', { email, password }),
    );
  },
  /**
   * Creates a user account after validating that the email is available.
   * @param name - The name value used by this operation.
   * @param email - The user email address.
   * @param password - The plaintext password to verify or hash.
   */
  register(name: string, email: string, password: string): Promise<AuthResult> {
    return responseData<AuthResult>(
      apiClient.post<ApiEnvelope<AuthResult>>('/auth/register', { name, email, password }),
    );
  },
  /**
   * Fetches the currently authenticated user profile.
   */
  me(): Promise<SafeUser> {
    return responseData<SafeUser>(apiClient.get<ApiEnvelope<SafeUser>>('/auth/me'));
  },
  /**
   * Ends the current user session and clears saved credentials.
   */
  logout(): Promise<{ message: string }> {
    return responseData<{ message: string }>(
      apiClient.post<ApiEnvelope<{ message: string }>>('/auth/logout'),
    );
  },
};
