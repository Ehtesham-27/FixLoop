import api, { setAccessToken } from './api';
import { ApiResponse, User } from '../types';

export const authService = {
  async register(data: { name: string; email: string; password: string }) {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data);
    if (res.data.data?.token) {
      setAccessToken(res.data.data.token);
    }
    return res.data;
  },

  async login(credentials: { email: string; password: string }) {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', credentials);
    if (res.data.data?.token) {
      setAccessToken(res.data.data.token);
    }
    return res.data;
  },

  async logout() {
    try {
      await api.post<ApiResponse>('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  async getMe() {
    const res = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return res.data.data?.user || null;
  },

  async refreshSession() {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/refresh');
    if (res.data.data?.token) {
      setAccessToken(res.data.data.token);
    }
    return res.data.data;
  }
};
