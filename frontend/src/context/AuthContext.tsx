import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/auth.service';
import { AuthContext } from './auth-context-def';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if token exists and fetch current user profile
    const token = localStorage.getItem('fixloop_token');
    if (token) {
      authService
        .getMe()
        .then((response) => {
          if (response.data) {
            setUser(response.data);
          }
        })
        .catch(() => {
          localStorage.removeItem('fixloop_token');
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    if (res.data?.token) {
      localStorage.setItem('fixloop_token', res.data.token);
      setUser(res.data.user);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await authService.register({ name, email, password });
    if (res.data?.token) {
      localStorage.setItem('fixloop_token', res.data.token);
      setUser(res.data.user);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('fixloop_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
