import bcrypt from 'bcryptjs';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import type { Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import type { Redis } from 'ioredis';

import { EnvConfig } from '../config/index.js';
import { AppError } from '../errors/index.js';
import { UserRepository } from '../repositories/index.js';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResult {
  user: SafeUser;
  token: string;
}

/**
 * Coordinates auth application logic.
 */
class AuthService {
  private readonly users = new UserRepository();
  private readonly env = new EnvConfig();

  /**
   * Initializes the auth service instance.
   * @param redis - The redis value used by this operation.
   */
  constructor(private readonly redis: Redis) {}

  /**
   * Creates a user account after validating that the email is available.
   * @param input - The input value to process.
   */
  public async register(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    if (await this.users.existsByEmail(email))
      throw new AppError('Email is already registered', 409);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.users.create({ name: input.name.trim(), email, passwordHash });
    return { user: this.safe(user._id, user.name, user.email), token: this.token(user._id) };
  }

  /**
   * Authenticates the supplied email and password and returns the signed-in user.
   * @param input - The input value to process.
   */
  public async login(input: { email: string; password: string }): Promise<AuthResult> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    if (user === null || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError('Invalid email or password', 401);
    }
    return { user: this.safe(user._id, user.name, user.email), token: this.token(user._id) };
  }

  /**
   * Retrieves auth data for the supplied criteria.
   * @param userId - The user identifier.
   */
  public async getMe(userId: string): Promise<SafeUser> {
    const user = await this.users.findById(userId);
    if (user === null) throw new AppError('User not found', 404);
    return this.safe(user._id, user.name, user.email);
  }

  /**
   * Ends the current user session and clears saved credentials.
   * @param token - The authentication token.
   */
  public async logout(token: string): Promise<void> {
    let payload: string | JwtPayload;
    try {
      payload = jwt.verify(token, this.env.jwtSecret);
    } catch {
      throw new AppError('Invalid or expired token', 401);
    }
    if (
      typeof payload === 'string' ||
      typeof payload.jti !== 'string' ||
      payload.exp === undefined
    ) {
      throw new AppError('Invalid or expired token', 401);
    }
    const ttl = Math.ceil(payload.exp - Date.now() / 1000);
    if (ttl > 0) await this.redis.set(`cartograph:revoked-token:${payload.jti}`, '1', 'EX', ttl);
  }

  /**
   * Returns the user fields that are safe to expose to clients.
   * @param id - The record identifier.
   * @param name - The name value used by this operation.
   * @param email - The user email address.
   */
  private safe(id: Types.ObjectId, name: string, email: string): SafeUser {
    return { id: id.toString(), name, email };
  }

  /**
   * Creates a signed authentication token for the user.
   * @param userId - The user identifier.
   */
  private token(userId: Types.ObjectId): string {
    return jwt.sign({ userId: userId.toString() }, this.env.jwtSecret, {
      jwtid: randomUUID(),
      expiresIn: this.env.jwtExpiresIn as NonNullable<SignOptions['expiresIn']>,
    });
  }
}

export default AuthService;
