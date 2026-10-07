import { Router } from 'express';
import type { Redis } from 'ioredis';

import { AuthController } from '../controllers/index.js';
import { AuthMiddleware, ValidationMiddleware } from '../middleware/index.js';
import { loginSchema, registerSchema } from '../schemas/index.js';

class AuthRoutes {
  public readonly router = Router();

  constructor(redis: Redis) {
    const auth = new AuthMiddleware(redis).authenticate();
    const validation = new ValidationMiddleware();
    const controller = new AuthController(redis);

    this.router.post('/register', validation.validateBody(registerSchema), controller.register);
    this.router.post('/login', validation.validateBody(loginSchema), controller.login);
    this.router.post('/logout', auth, controller.logout);
    this.router.get('/me', auth, controller.me);
  }
}

export default AuthRoutes;
