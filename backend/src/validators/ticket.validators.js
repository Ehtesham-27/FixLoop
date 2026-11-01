import { z } from 'zod';
import { PRIORITY_LIST } from '../constants/priorities.js';
import { TICKET_STATUS_LIST } from '../constants/ticket-status.js';

export const createTicketSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(5, 'Title must be at least 5 characters').max(150),
      description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000),
      category: z.string().trim().min(2, 'Category is required'),
      building: z.string().trim().max(100).optional(),
      room: z.string().trim().max(100).optional(),
      location: z.string().trim().max(150).optional(),
      priority: z.enum(PRIORITY_LIST).optional()
    })
    .refine((data) => data.location || (data.building && data.room), {
      message: 'Please provide either campus location or building and room',
      path: ['location']
    })
});

export const assignTicketSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ticket ID format')
  }),
  body: z.object({
    technicianId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid technician ID format')
  })
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ticket ID format')
  }),
  body: z.object({
    status: z.enum(TICKET_STATUS_LIST),
    resolutionNote: z.string().trim().max(2000).optional()
  })
});

export const updatePrioritySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ticket ID format')
  }),
  body: z.object({
    priority: z.enum(PRIORITY_LIST)
  })
});

export const ticketQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    status: z.enum(TICKET_STATUS_LIST).optional(),
    priority: z.enum(PRIORITY_LIST).optional(),
    category: z.string().optional(),
    search: z.string().optional()
  }).optional()
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format')
  })
});
