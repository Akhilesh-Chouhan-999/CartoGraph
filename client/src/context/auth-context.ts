import { createContext } from 'react';

import type { SafeUser } from '../types/domain.js';

export interface AuthContextValue {
  user: SafeUser | null;
  ready: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  completeOAuth: (code: string, clientState: string, remember: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
