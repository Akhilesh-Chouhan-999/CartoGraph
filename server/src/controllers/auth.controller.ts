import type { RequestHandler } from 'express';
import type { Redis } from 'ioredis';

import AuthService from '../services/auth.service.js';
import { loginSchema, registerSchema } from '../schemas/index.js';
import { AppError } from '../errors/index.js';

/**
 * Handles HTTP requests for auth operations.
 */
class AuthController {
  private readonly auth: AuthService;

  /**
   * Initializes the auth controller instance.
   * @param redis - The redis value used by this operation.
   */
  constructor(redis: Redis) {
    this.auth = new AuthService(redis);
  }

  /**
   * Creates a user account after validating that the email is available.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public register: RequestHandler = async (req, res) => {
    const result = await this.auth.register(registerSchema.parse(req.body));
    res.status(201).json({ success: true, data: result });
  };

  /**
   * Authenticates the supplied email and password and returns the signed-in user.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public login: RequestHandler = async (req, res) => {
    const result = await this.auth.login(loginSchema.parse(req.body));
    res.status(200).json({ success: true, data: result });
  };

  /**
   * Ends the current user session and clears saved credentials.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public logout: RequestHandler = async (req, res) => {
    const authorization = req.header('authorization');
    if (!authorization?.startsWith('Bearer ')) throw new AppError('Authentication required', 401);
    await this.auth.logout(authorization.slice(7));
    res.status(200).json({ success: true, data: { message: 'Logged out' } });
  };

  /**
   * Fetches the currently authenticated user profile.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public me: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    res.status(200).json({ success: true, data: await this.auth.getMe(userId) });
  };
}

export default AuthController;
