import api from './api';
import { ApiResponse, Ticket } from '../types';

export const ticketService = {
  async getMyTickets() {
    const res = await api.get<ApiResponse<Ticket[]>>('/tickets/my');
    return res.data;
  },

  async getAssignedTickets() {
    const res = await api.get<ApiResponse<Ticket[]>>('/tickets/assigned');
    return res.data;
  },

  async getAllTickets() {
    const res = await api.get<ApiResponse<Ticket[]>>('/tickets');
    return res.data;
  },

  async getTicketById(id: string) {
    const res = await api.get<ApiResponse<Ticket>>(`/tickets/${id}`);
    return res.data;
  },

  async createTicket(ticketData: FormData | Partial<Ticket>) {
    const headers = ticketData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    const res = await api.post<ApiResponse<Ticket>>('/tickets', ticketData, { headers });
    return res.data;
  },

  async updateStatus(id: string, status: string, resolutionNote?: string) {
    const res = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/status`, { status, resolutionNote });
    return res.data;
  },

  async updatePriority(id: string, priority: string) {
    const res = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/priority`, { priority });
    return res.data;
  },

  async assignTicket(id: string, technicianId: string) {
    const res = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/assign`, { technicianId });
    return res.data;
  }
};

