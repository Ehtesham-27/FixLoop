import api from './api';
import { ApiResponse, User } from '../types';

export const authService = {
  async register(data: { name: string; email: string; password: string }) {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data);
    return res.data;
  },

  async login(credentials: { email: string; password: string }) {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', credentials);
    return res.data;
  },

  async logout() {
    const res = await api.post<ApiResponse>('/auth/logout');
    return res.data;
  },

  async getMe() {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data;
  }
};

