import { useContext } from 'react';
import { AuthContext } from './AuthContextDef';
import type { AuthContextType } from './AuthContextDef';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải dùng trong AuthProvider');
  }
  return context;
}