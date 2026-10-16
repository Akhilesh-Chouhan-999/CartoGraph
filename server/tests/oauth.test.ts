import type { Redis } from 'ioredis';
import { afterEach, describe, expect, it } from 'vitest';

import OAuthService from '../src/services/oauth.service.js';

const envKeys = [
  'MONGO_URI',
  'JWT_SECRET',
  'API_BASE_URL',
  'CLIENT_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_OAUTH_CLIENT_ID',
  'GITHUB_OAUTH_CLIENT_SECRET',
  'GITLAB_CLIENT_ID',
  'GITLAB_CLIENT_SECRET',
] as const;
const previousValues = new Map(envKeys.map((key) => [key, process.env[key]]));

class MemoryRedis {
  public readonly values = new Map<string, string>();

  public async set(key: string, value: string): Promise<'OK'> {
    this.values.set(key, value);
    return 'OK';
  }

  public async get(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  public async getdel(key: string): Promise<string | null> {
    const value = this.values.get(key) ?? null;
    this.values.delete(key);
    return value;
  }
}

afterEach(() => {
  for (const key of envKeys) {
    const previous = previousValues.get(key);
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  }
});

describe('OAuthService', () => {
  it('reports providers unavailable until both credentials are configured', () => {
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/cartograph-test';
    process.env.JWT_SECRET = 'cartograph-test-secret-at-least-32-characters';
    process.env.GOOGLE_CLIENT_ID = 'google-client';
    delete process.env.GOOGLE_CLIENT_SECRET;
    const oauth = new OAuthService(new MemoryRedis() as unknown as Redis);

    expect(oauth.getProviderStatus()).toEqual({ google: false, github: false, gitlab: false });
  });

  it('creates a PKCE authorization URL and stores expiring, browser-bound state', async () => {
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/cartograph-test';
    process.env.JWT_SECRET = 'cartograph-test-secret-at-least-32-characters';
    process.env.API_BASE_URL = 'http://localhost:5000';
    process.env.GOOGLE_CLIENT_ID = 'google-client';
    process.env.GOOGLE_CLIENT_SECRET = 'google-secret';
    const redis = new MemoryRedis();
    const oauth = new OAuthService(redis as unknown as Redis);

    const url = new URL(await oauth.start('google', 'browser-state-0123456789abcdef0123456789'));
    const storedState = [...redis.values.entries()].find(([key]) =>
      key.startsWith('cartograph:oauth:state:'),
    );

    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('client_id')).toBe('google-client');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:5000/api/auth/oauth/google/callback',
    );
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(storedState).toBeDefined();
    expect(JSON.parse(storedState![1])).toMatchObject({
      provider: 'google',
      intent: 'sign-in',
      clientState: 'browser-state-0123456789abcdef0123456789',
    });
  });

  it('rejects missing OAuth state and consumes one-time exchange codes', async () => {
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/cartograph-test';
    process.env.JWT_SECRET = 'cartograph-test-secret-at-least-32-characters';
    const redis = new MemoryRedis();
    const oauth = new OAuthService(redis as unknown as Redis);

    await expect(oauth.complete('google', 'provider-code', 'unknown-state')).rejects.toMatchObject({
      statusCode: 400,
    });

    const code = 'one-time-exchange-code-01234567890123456789';
    const clientState = 'browser-state-0123456789abcdef0123456789';
    redis.values.set(
      `cartograph:oauth:exchange:${code}`,
      JSON.stringify({
        clientState,
        authResult: {
          user: { id: 'user-id', name: 'Ada', email: 'ada@example.com' },
          token: 'cartograph-jwt',
        },
      }),
    );

    await expect(oauth.exchange(code, clientState)).resolves.toMatchObject({
      user: { email: 'ada@example.com' },
      token: 'cartograph-jwt',
    });
    await expect(oauth.exchange(code, clientState)).rejects.toMatchObject({ statusCode: 400 });
  });
});
