import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/auth.service';
import { getAccessToken } from '../services/api';
import { AuthContext } from './auth-context-def';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          try {
            const me = await authService.getMe();
            if (isMounted && me) {
              setUser(me);
              setIsLoading(false);
              return;
            }
          } catch {
            // Access token might be expired, will attempt refresh below
          }
        }

        // Attempt silent session restoration using HttpOnly refresh-token cookie
        const refreshed = await authService.refreshSession();
        if (isMounted && refreshed?.user) {
          setUser(refreshed.user);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    if (res.data?.user) {
      setUser(res.data.user);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await authService.register({ name, email, password });
    if (res.data?.user) {
      setUser(res.data.user);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
