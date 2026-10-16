import { Router } from 'express';
import type { Redis } from 'ioredis';

import { AuthController, OAuthController } from '../controllers/index.js';
import { AuthMiddleware, ValidationMiddleware } from '../middleware/index.js';
import { loginSchema, registerSchema } from '../schemas/index.js';

/**
 * Registers the auth API routes.
 */
class AuthRoutes {
  public readonly router = Router();

  /**
   * Initializes the auth routes instance.
   * @param redis - The redis value used by this operation.
   */
  constructor(redis: Redis) {
    const auth = new AuthMiddleware(redis).authenticate();
    const validation = new ValidationMiddleware();
    const controller = new AuthController(redis);
    const oauth = new OAuthController(redis);

    this.router.post('/register', validation.validateBody(registerSchema), controller.register);
    this.router.post('/login', validation.validateBody(loginSchema), controller.login);
    this.router.post('/logout', auth, controller.logout);
    this.router.get('/me', auth, controller.me);
    this.router.get('/oauth/providers', oauth.providers);
    this.router.get('/oauth/accounts', auth, oauth.linkedAccounts);
    this.router.post('/oauth/exchange', oauth.exchange);
    this.router.get('/oauth/:provider/start', oauth.start);
    this.router.post('/oauth/:provider/link', auth, oauth.startLink);
    this.router.get('/oauth/:provider/callback', oauth.callback);
  }
}

export default AuthRoutes;
