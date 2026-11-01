import { SlaStatus, TicketPriority, TicketStatus, UserRole } from '../types';

export const USER_ROLES: Record<UserRole, UserRole> = {
  STUDENT: 'STUDENT',
  TECHNICIAN: 'TECHNICIAN',
  ADMIN: 'ADMIN'
};

export const TICKET_STATUSES: Record<TicketStatus, TicketStatus> = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED'
};

export const TICKET_PRIORITIES: Record<TicketPriority, TicketPriority> = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: 'bg-amber-100 text-amber-800 border-amber-200',
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
  RESOLVED: 'bg-emerald-100 text-emerald-800 border-emerald-200'
};

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  LOW: 'bg-slate-100 text-slate-700 border-slate-200',
  MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  CRITICAL: 'bg-rose-100 text-rose-800 border-rose-200'
};

export const SLA_TARGET_HOURS: Record<TicketPriority, number> = {
  CRITICAL: 2,
  HIGH: 8,
  MEDIUM: 24,
  LOW: 72
};

export const SLA_STATUS_COLORS: Record<SlaStatus, string> = {
  ON_TRACK: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  AT_RISK: 'bg-amber-50 text-amber-700 border-amber-200',
  OVERDUE: 'bg-rose-50 text-rose-700 border-rose-200',
  RESOLVED_ON_TIME: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RESOLVED_LATE: 'bg-rose-50 text-rose-700 border-rose-200'
};

