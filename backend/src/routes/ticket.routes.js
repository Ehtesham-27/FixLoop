import { Router } from 'express';
import * as ticketController from '../controllers/ticket.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import {
  createTicketSchema,
  assignTicketSchema,
  updateStatusSchema,
  updatePrioritySchema,
  ticketQuerySchema,
  idParamSchema
} from '../validators/ticket.validators.js';

const router = Router();

// All ticket endpoints require authentication
router.use(authenticate);

// Student / Admin ticket reporting
router.post(
  '/',
  authorize(ROLES.STUDENT, ROLES.ADMIN),
  validate(createTicketSchema),
  ticketController.createTicket
);

// Student own tickets
router.get(
  '/my',
  authorize(ROLES.STUDENT, ROLES.ADMIN),
  validate(ticketQuerySchema),
  ticketController.getMyTickets
);

// Technician assigned work
router.get(
  '/assigned',
  authorize(ROLES.TECHNICIAN, ROLES.ADMIN),
  validate(ticketQuerySchema),
  ticketController.getAssignedTickets
);

// Admin view all tickets
router.get(
  '/',
  authorize(ROLES.ADMIN),
  validate(ticketQuerySchema),
  ticketController.getAllTickets
);

// Single ticket details
router.get(
  '/:id',
  validate(idParamSchema),
  ticketController.getTicketById
);

// Admin assignment
router.patch(
  '/:id/assign',
  authorize(ROLES.ADMIN),
  validate(assignTicketSchema),
  ticketController.assignTicket
);

// Technician / Admin status updates
router.patch(
  '/:id/status',
  authorize(ROLES.TECHNICIAN, ROLES.ADMIN),
  validate(updateStatusSchema),
  ticketController.updateTicketStatus
);

// Admin priority changes
router.patch(
  '/:id/priority',
  authorize(ROLES.ADMIN),
  validate(updatePrioritySchema),
  ticketController.updateTicketPriority
);

// Ticket audit activity timeline
router.get(
  '/:id/activity',
  validate(idParamSchema),
  ticketController.getTicketActivity
);

export default router;
