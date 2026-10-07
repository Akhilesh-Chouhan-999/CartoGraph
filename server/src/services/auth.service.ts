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

class AuthService {
  private readonly users = new UserRepository();
  private readonly env = new EnvConfig();

  constructor(private readonly redis: Redis) {}

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

  public async login(input: { email: string; password: string }): Promise<AuthResult> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    if (user === null || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError('Invalid email or password', 401);
    }
    return { user: this.safe(user._id, user.name, user.email), token: this.token(user._id) };
  }

  public async getMe(userId: string): Promise<SafeUser> {
    const user = await this.users.findById(userId);
    if (user === null) throw new AppError('User not found', 404);
    return this.safe(user._id, user.name, user.email);
  }

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

  private safe(id: Types.ObjectId, name: string, email: string): SafeUser {
    return { id: id.toString(), name, email };
  }

  private token(userId: Types.ObjectId): string {
    return jwt.sign({ userId: userId.toString() }, this.env.jwtSecret, {
      jwtid: randomUUID(),
      expiresIn: this.env.jwtExpiresIn as NonNullable<SignOptions['expiresIn']>,
    });
  }
}

export default AuthService;
