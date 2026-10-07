import type { RequestHandler } from 'express';
import type { Redis } from 'ioredis';

import AuthService from '../services/auth.service.js';
import { loginSchema, registerSchema } from '../schemas/index.js';
import { AppError } from '../errors/index.js';

class AuthController {
  private readonly auth: AuthService;

  constructor(redis: Redis) {
    this.auth = new AuthService(redis);
  }

  public register: RequestHandler = async (req, res) => {
    const result = await this.auth.register(registerSchema.parse(req.body));
    res.status(201).json({ success: true, data: result });
  };

  public login: RequestHandler = async (req, res) => {
    const result = await this.auth.login(loginSchema.parse(req.body));
    res.status(200).json({ success: true, data: result });
  };

  public logout: RequestHandler = async (req, res) => {
    const authorization = req.header('authorization');
    if (!authorization?.startsWith('Bearer ')) throw new AppError('Authentication required', 401);
    await this.auth.logout(authorization.slice(7));
    res.status(200).json({ success: true, data: { message: 'Logged out' } });
  };

  public me: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    res.status(200).json({ success: true, data: await this.auth.getMe(userId) });
  };
}

export default AuthController;
