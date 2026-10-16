import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import type { RequestHandler } from 'express';
import type { Redis } from 'ioredis';

import { AppError } from '../errors/index.js';
import { EnvConfig } from '../config/index.js';
import type { AuthUser } from '../types/index.js';

/**
 * Provides middleware for auth request handling.
 */
class AuthMiddleware {
  private readonly env = new EnvConfig();

  /**
   * Initializes the auth middleware instance.
   * @param redis - The redis value used by this operation.
   */
  constructor(private readonly redis: Redis) {}

  /**
   * Authenticates the request and attaches the verified user identity.
   */
  public authenticate(): RequestHandler {
    return (req, _res, next) => {
      const authorization = req.header('authorization');
      if (!authorization?.startsWith('Bearer ')) {
        next(new AppError('Authentication required', 401));
        return;
      }
      void this.verify(authorization.slice(7))
        .then((user) => {
          req.user = user;
          next();
        })
        .catch((error: unknown) => {
          if (error instanceof AppError) next(error);
          else if (error instanceof JsonWebTokenError)
            next(new AppError('Invalid or expired token', 401));
          else next(new AppError('Authentication service unavailable', 503, false));
        });
    };
  }

  /**
   * Verifies the supplied auth data before it is used.
   * @param token - The authentication token.
   */
  private async verify(token: string): Promise<AuthUser> {
    const payload = jwt.verify(token, this.env.jwtSecret);
    if (
      typeof payload === 'string' ||
      typeof payload.userId !== 'string' ||
      typeof payload.jti !== 'string'
    ) {
      throw new AppError('Invalid or expired token', 401);
    }
    if (await this.redis.get(`cartograph:revoked-token:${payload.jti}`)) {
      throw new AppError('Invalid or expired token', 401);
    }
    return { userId: payload.userId } satisfies AuthUser;
  }
}

export default AuthMiddleware;
