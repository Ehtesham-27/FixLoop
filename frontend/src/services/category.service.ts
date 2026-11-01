import api from './api';
import { ApiResponse, Category } from '../types';

export const categoryService = {
  async getCategories() {
    const res = await api.get<ApiResponse<{ categories: Category[] }>>('/categories');
    return res.data.data?.categories || [];
  }
};

