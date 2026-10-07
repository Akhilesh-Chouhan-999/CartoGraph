import { useContext } from 'react';

import { AuthContext } from './auth-context.js';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
