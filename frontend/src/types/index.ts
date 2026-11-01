export type UserRole = 'STUDENT' | 'TECHNICIAN' | 'ADMIN';

export type TicketStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketImage {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface Ticket {
  _id: string;
  ticketCode?: string;
  title: string;
  description: string;
  category: string;
  building: string;
  room: string;
  priority: TicketPriority;
  status: TicketStatus;
  reportedBy: User | string;
  assignedTo?: User | string | null;
  images?: TicketImage[];
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface AuditLog {
  _id: string;
  ticketId: string;
  actorId: User | string;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

