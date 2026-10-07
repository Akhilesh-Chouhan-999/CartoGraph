import type { Request } from 'express-serve-static-core';

export interface AuthUser {
  userId: string;
}

export type AuthenticatedRequest = Request & { user: AuthUser };

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
