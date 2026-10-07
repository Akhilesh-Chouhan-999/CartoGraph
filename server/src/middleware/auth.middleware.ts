import jwt from 'jsonwebtoken';
import type { RequestHandler } from 'express';
import type { Redis } from 'ioredis';

import { AppError } from '../errors/index.js';
import { EnvConfig } from '../config/index.js';
import type { AuthUser } from '../types/index.js';

class AuthMiddleware {
  private readonly env = new EnvConfig();

  constructor(private readonly redis: Redis) {}

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
          else if (error instanceof jwt.JsonWebTokenError)
            next(new AppError('Invalid or expired token', 401));
          else next(new AppError('Authentication service unavailable', 503, false));
        });
    };
  }

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
