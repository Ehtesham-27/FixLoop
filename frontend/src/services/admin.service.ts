import api from './api';
import { AdminOverview, ApiResponse, Pagination, User } from '../types';

export const adminService = {
  async getOverview() {
    const res = await api.get<ApiResponse<AdminOverview>>('/admin/overview');
    return res.data.data;
  },

  async getUsers(params: { page?: number; limit?: number; role?: string; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.role && params.role !== 'ALL') query.append('role', params.role);
    if (params.search) query.append('search', params.search);

    const res = await api.get<ApiResponse<{ users: User[]; pagination: Pagination }>>(
      `/admin/users?${query.toString()}`
    );
    return res.data.data || { users: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } };
  },

  async getActiveTechnicians() {
    const data = await this.getUsers({ role: 'TECHNICIAN', limit: 100 });
    return data.users.filter((u) => u.isActive);
  },

  async createTechnician(payload: { name: string; email: string; password: string }) {
    const res = await api.post<ApiResponse<{ user: User }>>('/admin/technicians', payload);
    return res.data;
  }
};

