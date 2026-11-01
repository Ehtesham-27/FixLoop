import { Router } from 'express';
import * as ticketController from '../controllers/ticket.controller.js';
import { validate } from '../middleware/validate.js';
import {
  createTicketSchema,
  assignTicketSchema,
  updateStatusSchema,
  updatePrioritySchema
} from '../validators/ticket.validators.js';

const router = Router();

router.post('/', validate(createTicketSchema), ticketController.createTicket);
router.get('/my', ticketController.getMyTickets);
router.get('/assigned', ticketController.getAssignedTickets);
router.get('/', ticketController.getAllTickets);
router.get('/:id', ticketController.getTicketById);
router.patch('/:id/assign', validate(assignTicketSchema), ticketController.assignTicket);
router.patch('/:id/status', validate(updateStatusSchema), ticketController.updateTicketStatus);
router.patch('/:id/priority', validate(updatePrioritySchema), ticketController.updateTicketPriority);
router.get('/:id/activity', ticketController.getTicketActivity);

export default router;

