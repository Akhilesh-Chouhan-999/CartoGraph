import { createHash, randomBytes } from 'node:crypto';
import type { Redis } from 'ioredis';

import { OAuthConfig } from '../config/index.js';
import { AppError } from '../errors/index.js';
import type { OAuthProvider } from '../models/index.js';
import type { AuthResult } from './auth.service.js';
import AuthService from './auth.service.js';
import OAuthAccountService, { type OAuthProfile } from './oauth-account.service.js';

interface OAuthState {
  provider: OAuthProvider;
  codeVerifier: string;
  clientState: string;
  intent: 'sign-in' | 'link';
  userId?: string;
}

interface ProviderTokens {
  access_token: string;
}

/**
 * Coordinates provider authorization, identity validation, and CartoGraph sessions.
 */
class OAuthService {
  private readonly config = new OAuthConfig();
  private readonly accounts = new OAuthAccountService();
  private readonly auth: AuthService;

  constructor(private readonly redis: Redis) {
    this.auth = new AuthService(redis);
  }

  public getProviderStatus(): Record<OAuthProvider, boolean> {
    return {
      google: this.config.isConfigured('google'),
      github: this.config.isConfigured('github'),
      gitlab: this.config.isConfigured('gitlab'),
    };
  }

  public async start(
    provider: OAuthProvider,
    clientState: string,
    userId?: string,
  ): Promise<string> {
    const config = this.config.getProvider(provider);
    const state = randomBytes(32).toString('base64url');
    const codeVerifier = randomBytes(48).toString('base64url');
    const challenge = createHash('sha256').update(codeVerifier).digest('base64url');
    const intent = userId === undefined ? 'sign-in' : 'link';
    const payload: OAuthState = {
      provider,
      codeVerifier,
      clientState,
      intent,
      ...(userId === undefined ? {} : { userId }),
    };
    const saved = await this.redis.set(
      `cartograph:oauth:state:${state}`,
      JSON.stringify(payload),
      'EX',
      600,
      'NX',
    );
    if (saved !== 'OK') throw new AppError('Unable to start provider sign-in', 503);

    const url = new URL(config.authorizationUrl);
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', this.config.callbackUrl(provider));
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', config.scopes.join(' '));
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    if (provider === 'google') url.searchParams.set('access_type', 'online');
    return url.toString();
  }

  public async getStateDetails(
    state: string,
  ): Promise<{ intent: OAuthState['intent']; clientState: string } | undefined> {
    const rawState = await this.redis.get(`cartograph:oauth:state:${state}`);
    if (rawState === null) return undefined;
    try {
      const parsed = this.parseState(rawState);
      return { intent: parsed.intent, clientState: parsed.clientState };
    } catch {
      return undefined;
    }
  }

  public async complete(
    provider: OAuthProvider,
    code: string,
    state: string,
  ): Promise<
    | { intent: 'sign-in'; code: string; clientState: string }
    | { intent: 'link'; clientState: string }
  > {
    const rawState = await this.redis.getdel(`cartograph:oauth:state:${state}`);
    if (rawState === null) throw new AppError('OAuth state is invalid or expired', 400);
    const oauthState = this.parseState(rawState);
    if (oauthState.provider !== provider) throw new AppError('OAuth provider mismatch', 400);

    const profile = await this.fetchProfile(provider, code, oauthState.codeVerifier);
    if (oauthState.intent === 'link') {
      if (!oauthState.userId) throw new AppError('OAuth link state is invalid', 400);
      await this.accounts.link(oauthState.userId, provider, profile);
      return { intent: 'link', clientState: oauthState.clientState };
    }

    const userId = await this.accounts.signIn(provider, profile);
    const result = await this.auth.createOAuthResult(userId);
    return {
      intent: 'sign-in',
      code: await this.storeExchange(result, oauthState.clientState),
      clientState: oauthState.clientState,
    };
  }

  public async exchange(code: string, clientState: string): Promise<AuthResult> {
    const rawResult = await this.redis.getdel(`cartograph:oauth:exchange:${code}`);
    if (rawResult === null) throw new AppError('OAuth exchange code is invalid or expired', 400);
    try {
      const result: unknown = JSON.parse(rawResult);
      if (
        typeof result === 'object' &&
        result !== null &&
        'clientState' in result &&
        result.clientState === clientState &&
        'authResult' in result
      ) {
        return result.authResult as AuthResult;
      }
      throw new AppError('OAuth exchange code is invalid or expired', 400);
    } catch {
      throw new AppError('OAuth exchange code is invalid or expired', 400);
    }
  }

  public getLinkedProviders(userId: string): Promise<OAuthProvider[]> {
    return this.accounts.getLinkedProviders(userId);
  }

  private async storeExchange(result: AuthResult, clientState: string): Promise<string> {
    const code = randomBytes(32).toString('base64url');
    await this.redis.set(
      `cartograph:oauth:exchange:${code}`,
      JSON.stringify({ authResult: result, clientState }),
      'EX',
      60,
      'NX',
    );
    return code;
  }

  private parseState(value: string): OAuthState {
    try {
      const state: unknown = JSON.parse(value);
      if (
        typeof state === 'object' &&
        state !== null &&
        'provider' in state &&
        'codeVerifier' in state &&
        'clientState' in state &&
        'intent' in state &&
        (state.provider === 'google' ||
          state.provider === 'github' ||
          state.provider === 'gitlab') &&
        typeof state.codeVerifier === 'string' &&
        typeof state.clientState === 'string' &&
        (state.intent === 'sign-in' || state.intent === 'link') &&
        (!('userId' in state) || typeof state.userId === 'string')
      ) {
        return state as OAuthState;
      }
    } catch {
      // The stored state may be invalidated or corrupted; reject it below.
    }
    throw new AppError('OAuth state is invalid or expired', 400);
  }

  private async fetchProfile(
    provider: OAuthProvider,
    code: string,
    codeVerifier: string,
  ): Promise<OAuthProfile> {
    const providerConfig = this.config.getProvider(provider);
    const tokenResponse = await fetch(providerConfig.tokenUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: providerConfig.clientId,
        client_secret: providerConfig.clientSecret,
        code,
        redirect_uri: this.config.callbackUrl(provider),
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!tokenResponse.ok) throw new AppError('Provider token exchange failed', 401);
    const tokens = (await tokenResponse.json()) as Partial<ProviderTokens>;
    if (typeof tokens.access_token !== 'string') {
      throw new AppError('Provider did not return an access token', 401);
    }

    if (provider === 'github') return this.fetchGitHubProfile(tokens.access_token);
    const profileResponse = await fetch(providerConfig.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!profileResponse.ok) throw new AppError('Unable to read provider profile', 401);
    const profile = (await profileResponse.json()) as Record<string, unknown>;
    return {
      providerUserId: typeof profile.sub === 'string' ? profile.sub : '',
      email: typeof profile.email === 'string' ? profile.email : '',
      emailVerified: profile.email_verified === true,
      name: typeof profile.name === 'string' ? profile.name : '',
    };
  }

  private async fetchGitHubProfile(accessToken: string): Promise<OAuthProfile> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    const [profileResponse, emailResponse] = await Promise.all([
      fetch('https://api.github.com/user', { headers, signal: AbortSignal.timeout(15_000) }),
      fetch('https://api.github.com/user/emails', { headers, signal: AbortSignal.timeout(15_000) }),
    ]);
    if (!profileResponse.ok || !emailResponse.ok) {
      throw new AppError('Unable to read verified GitHub account details', 401);
    }
    const profile = (await profileResponse.json()) as Record<string, unknown>;
    const emails = (await emailResponse.json()) as Array<Record<string, unknown>>;
    const email = emails.find((item) => item.primary === true && item.verified === true);
    return {
      providerUserId: typeof profile.id === 'number' ? String(profile.id) : '',
      email: typeof email?.email === 'string' ? email.email : '',
      emailVerified: email?.verified === true,
      name:
        (typeof profile.name === 'string' && profile.name) ||
        (typeof profile.login === 'string' && profile.login) ||
        '',
    };
  }
}

export default OAuthService;
