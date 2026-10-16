import { AppError } from '../errors/index.js';
import type { OAuthProvider } from '../models/oauth-identity.model.js';
import EnvConfig from './env.config.js';

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}

/**
 * Reads OAuth provider credentials and constructs provider callback URLs.
 */
class OAuthConfig {
  private readonly env: EnvConfig;

  constructor(env = new EnvConfig()) {
    this.env = env;
  }

  public isConfigured(provider: OAuthProvider): boolean {
    const [clientId, clientSecret] = this.credentials(provider);
    return Boolean(clientId && clientSecret);
  }

  public getProvider(provider: OAuthProvider): OAuthProviderConfig {
    const [clientId, clientSecret] = this.credentials(provider);
    if (!clientId || !clientSecret)
      throw new AppError(`${provider} sign-in is not configured`, 503);

    if (provider === 'google') {
      return {
        clientId,
        clientSecret,
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
        scopes: ['openid', 'email', 'profile'],
      };
    }
    if (provider === 'github') {
      return {
        clientId,
        clientSecret,
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        scopes: ['read:user', 'user:email'],
      };
    }
    const baseUrl = this.env.gitlabBaseUrl.replace(/\/$/, '');
    return {
      clientId,
      clientSecret,
      authorizationUrl: `${baseUrl}/oauth/authorize`,
      tokenUrl: `${baseUrl}/oauth/token`,
      userInfoUrl: `${baseUrl}/oauth/userinfo`,
      scopes: ['openid', 'profile', 'email'],
    };
  }

  public callbackUrl(provider: OAuthProvider): string {
    return `${this.env.apiBaseUrl}/api/auth/oauth/${provider}/callback`;
  }

  public get clientUrl(): string {
    return this.env.clientUrl;
  }

  private credentials(provider: OAuthProvider): [string | undefined, string | undefined] {
    switch (provider) {
      case 'google':
        return [this.env.googleClientId, this.env.googleClientSecret];
      case 'github':
        return [this.env.githubOAuthClientId, this.env.githubOAuthClientSecret];
      case 'gitlab':
        return [this.env.gitlabClientId, this.env.gitlabClientSecret];
    }
  }
}

export default OAuthConfig;
