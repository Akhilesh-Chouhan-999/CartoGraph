import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';
import type { Redis } from 'ioredis';
import { afterEach, describe, expect, it } from 'vitest';

import AuthMiddleware from '../src/middleware/auth.middleware.js';

const jwtSecret = 'cartograph-test-secret-at-least-32-characters';
const previousMongoUri = process.env.MONGO_URI;
const previousJwtSecret = process.env.JWT_SECRET;

afterEach(() => {
  if (previousMongoUri === undefined) delete process.env.MONGO_URI;
  else process.env.MONGO_URI = previousMongoUri;
  if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousJwtSecret;
});

describe('AuthMiddleware', () => {
  it('accepts a valid token with an active token ID', async () => {
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/cartograph-test';
    process.env.JWT_SECRET = jwtSecret;
    const token = jwt.sign({ userId: 'user-1' }, jwtSecret, {
      jwtid: 'active-token',
      expiresIn: '1h',
    });
    const middleware = new AuthMiddleware({ get: async () => null } as unknown as Redis);
    const request = {
      header: () => `Bearer ${token}`,
      user: undefined,
    } as unknown as Request;
    const handler = middleware.authenticate();

    const error = await new Promise<unknown>((resolve) => {
      handler(request, {} as Response, (nextError?: unknown) => resolve(nextError));
    });

    expect(error).toBeUndefined();
    expect(request.user).toEqual({ userId: 'user-1' });
  });

  it('rejects a revoked token', async () => {
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/cartograph-test';
    process.env.JWT_SECRET = jwtSecret;
    const token = jwt.sign({ userId: 'user-1' }, jwtSecret, {
      jwtid: 'revoked-token',
      expiresIn: '1h',
    });
    const middleware = new AuthMiddleware({
      get: async () => '1',
    } as unknown as Redis);
    const request = { header: () => `Bearer ${token}` } as unknown as Request;
    const handler = middleware.authenticate();

    const error = await new Promise<unknown>((resolve) => {
      handler(request, {} as Response, (nextError?: unknown) => resolve(nextError));
    });

    expect(error).toMatchObject({ statusCode: 401, message: 'Invalid or expired token' });
  });
});
