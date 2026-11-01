import api from './api';
import { ApiResponse, AuditLog, Pagination, Ticket } from '../types';

export interface TicketFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
}

export const ticketService = {
  async getMyTickets(filters: TicketFilters = {}) {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.priority && filters.priority !== 'ALL') params.append('priority', filters.priority);
    if (filters.category && filters.category !== 'ALL') params.append('category', filters.category);

    const res = await api.get<ApiResponse<{ tickets: Ticket[]; pagination: Pagination }>>(
      `/tickets/my?${params.toString()}`
    );
    return res.data.data || { tickets: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } };
  },

  async getAssignedTickets(filters: TicketFilters = {}) {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.priority && filters.priority !== 'ALL') params.append('priority', filters.priority);

    const res = await api.get<ApiResponse<{ tickets: Ticket[]; pagination: Pagination }>>(
      `/tickets/assigned?${params.toString()}`
    );
    return res.data.data || { tickets: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } };
  },

  async getAllTickets(filters: TicketFilters = {}) {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.priority && filters.priority !== 'ALL') params.append('priority', filters.priority);
    if (filters.category && filters.category !== 'ALL') params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);

    const res = await api.get<ApiResponse<{ tickets: Ticket[]; pagination: Pagination }>>(
      `/tickets?${params.toString()}`
    );
    return res.data.data || { tickets: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } };
  },

  async getTicketById(id: string) {
    const res = await api.get<ApiResponse<{ ticket: Ticket }>>(`/tickets/${id}`);
    return res.data.data?.ticket || null;
  },

  async createTicket(ticketData: {
    title: string;
    description: string;
    category: string;
    location?: string;
    building?: string;
    room?: string;
    priority?: string;
  }) {
    const res = await api.post<ApiResponse<{ ticket: Ticket }>>('/tickets', ticketData);
    return res.data.data?.ticket;
  },

  async updateStatus(id: string, status: string, resolutionNote?: string) {
    const res = await api.patch<ApiResponse<{ ticket: Ticket }>>(`/tickets/${id}/status`, {
      status,
      resolutionNote
    });
    return res.data.data?.ticket;
  },

  async updatePriority(id: string, priority: string) {
    const res = await api.patch<ApiResponse<{ ticket: Ticket }>>(`/tickets/${id}/priority`, {
      priority
    });
    return res.data.data?.ticket;
  },

  async assignTicket(id: string, technicianId: string) {
    const res = await api.patch<ApiResponse<{ ticket: Ticket }>>(`/tickets/${id}/assign`, {
      technicianId
    });
    return res.data.data?.ticket;
  },

  async getTicketActivity(id: string) {
    const res = await api.get<ApiResponse<{ activity: AuditLog[] }>>(`/tickets/${id}/activity`);
    return res.data.data?.activity || [];
  }
};
