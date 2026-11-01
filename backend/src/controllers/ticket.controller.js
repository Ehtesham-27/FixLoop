import { ticketService } from '../services/ticket.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.createTicket(req.body, req.user);

  res.status(201).json({
    success: true,
    message: 'Ticket created successfully',
    data: {
      ticket
    }
  });
});

export const getMyTickets = asyncHandler(async (req, res) => {
  const { tickets, pagination } = await ticketService.getReporterTickets(req.user._id, req.query);

  res.status(200).json({
    success: true,
    data: {
      tickets,
      pagination
    }
  });
});

export const getAssignedTickets = asyncHandler(async (req, res) => {
  const { tickets, pagination } = await ticketService.getAssignedTickets(req.user._id, req.query);

  res.status(200).json({
    success: true,
    data: {
      tickets,
      pagination
    }
  });
});

export const getAllTickets = asyncHandler(async (req, res) => {
  const { tickets, pagination } = await ticketService.getAllTickets(req.query);

  res.status(200).json({
    success: true,
    data: {
      tickets,
      pagination
    }
  });
});

export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicketById(req.params.id, req.user);

  res.status(200).json({
    success: true,
    data: {
      ticket
    }
  });
});

export const assignTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.assignTechnician(req.params.id, req.body.technicianId, req.user);

  res.status(200).json({
    success: true,
    message: 'Technician assigned successfully',
    data: {
      ticket
    }
  });
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateTicketStatus(
    req.params.id,
    req.body.status,
    req.body.resolutionNote,
    req.user
  );

  res.status(200).json({
    success: true,
    message: 'Ticket status updated successfully',
    data: {
      ticket
    }
  });
});

export const updateTicketPriority = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateTicketPriority(req.params.id, req.body.priority, req.user);

  res.status(200).json({
    success: true,
    message: 'Ticket priority updated successfully',
    data: {
      ticket
    }
  });
});

export const getTicketActivity = asyncHandler(async (req, res) => {
  const activity = await ticketService.getTicketActivity(req.params.id, req.user);

  res.status(200).json({
    success: true,
    data: {
      activity
    }
  });
});
