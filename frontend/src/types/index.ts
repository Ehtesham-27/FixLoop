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

export interface TicketAttachment {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
}

export interface Ticket {
  _id: string;
  ticketCode?: string;
  title: string;
  description: string;
  category: Category | string;
  building?: string;
  room?: string;
  location: string;
  priority: TicketPriority;
  status: TicketStatus;
  reportedBy: User | string;
  assignedTo?: User | string | null;
  images?: TicketAttachment[];
  resolutionNote?: string;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  _id: string;
  ticketId: string;
  actorId: User;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  note?: string;
  createdAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdminOverview {
  tickets: {
    total: number;
    open: number;
    assigned: number;
    inProgress: number;
    resolved: number;
    critical: number;
  };
  users: {
    activeTechnicians: number;
    activeStudents: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}
