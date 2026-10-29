import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from './authContext';
import { authService } from '../services/authService';
import { setUnauthorizedHandler } from '../services/api';

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(() => authService.getCurrentUser());

  const logout = useCallback(() => {
    authService.logout();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    login: async (credentials) => {
      const data = await authService.login(credentials);
      setUser(data.user);
      return data;
    },
    register: async (details) => {
      const data = await authService.register(details);
      setUser(data.user);
      return data;
    },
    logout,
  }), [user, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
