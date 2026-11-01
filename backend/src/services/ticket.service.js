import mongoose from 'mongoose';
import { Ticket } from '../models/Ticket.js';
import { Category } from '../models/Category.js';
import { User } from '../models/User.js';
import { AUDIT_ACTIONS } from '../models/AuditLog.js';
import { ROLES } from '../constants/roles.js';
import { TICKET_STATUS, ALLOWED_STATUS_TRANSITIONS } from '../constants/ticket-status.js';
import { PRIORITIES, PRIORITY_LIST } from '../constants/priorities.js';
import { ApiError } from '../utils/ApiError.js';
import { auditService } from './audit.service.js';

export const ticketService = {
  /**
   * Resolves a category by ObjectId, slug, or name, ensuring it is active.
   */
  async resolveActiveCategory(categoryInput) {
    if (!categoryInput) {
      throw ApiError.badRequest('Category is required');
    }

    let category = null;

    if (mongoose.Types.ObjectId.isValid(categoryInput)) {
      category = await Category.findOne({ _id: categoryInput, isActive: true });
    }

    if (!category) {
      category = await Category.findOne({
        $or: [{ slug: categoryInput.toLowerCase() }, { name: categoryInput }],
        isActive: true
      });
    }

    if (!category) {
      throw ApiError.badRequest('Selected category does not exist or is inactive');
    }

    return category;
  },

  /**
   * Student creates a new maintenance ticket.
   * New tickets always start with OPEN status.
   */
  async createTicket(ticketData, reporterUser) {
    const category = await this.resolveActiveCategory(ticketData.category);

    const location = ticketData.location || `${ticketData.building || ''} - ${ticketData.room || ''}`.trim();
    if (!location || location === '-') {
      throw ApiError.badRequest('Campus location is required');
    }

    // Default to MEDIUM priority if not specified or invalid
    let priority = PRIORITIES.MEDIUM;
    if (ticketData.priority && PRIORITY_LIST.includes(ticketData.priority)) {
      priority = ticketData.priority;
    }

    const ticket = new Ticket({
      title: ticketData.title.trim(),
      description: ticketData.description.trim(),
      category: category._id,
      building: ticketData.building?.trim() || '',
      room: ticketData.room?.trim() || '',
      location: location.trim(),
      priority,
      status: TICKET_STATUS.OPEN,
      reportedBy: reporterUser._id,
      assignedTo: null
    });

    await ticket.save();

    // Record creation in audit log
    await auditService.logAction({
      ticketId: ticket._id,
      actorId: reporterUser._id,
      action: AUDIT_ACTIONS.TICKET_CREATED,
      oldValue: null,
      newValue: {
        status: ticket.status,
        priority: ticket.priority,
        category: category.name
      },
      note: 'Ticket created by student reporter'
    });

    return ticket.populate([
      { path: 'category', select: 'name slug description' },
      { path: 'reportedBy', select: 'name email role' },
      { path: 'assignedTo', select: 'name email role' }
    ]);
  },

  /**
   * Student retrieves their own reported tickets with pagination and filtering.
   */
  async getReporterTickets(reporterId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { reportedBy: reporterId };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.priority) {
      filter.priority = query.priority;
    }
    if (query.category) {
      if (mongoose.Types.ObjectId.isValid(query.category)) {
        filter.category = query.category;
      } else {
        const cat = await Category.findOne({ slug: query.category.toLowerCase() });
        if (cat) filter.category = cat._id;
      }
    }

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug')
        .populate('assignedTo', 'name email role'),
      Ticket.countDocuments(filter)
    ]);

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Technician retrieves tickets assigned specifically to them.
   */
  async getAssignedTickets(technicianId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { assignedTo: technicianId };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.priority) {
      filter.priority = query.priority;
    }

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug')
        .populate('reportedBy', 'name email role'),
      Ticket.countDocuments(filter)
    ]);

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Admin retrieves all tickets with multi-criteria filtering and pagination.
   */
  async getAllTickets(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }
    if (query.priority) {
      filter.priority = query.priority;
    }
    if (query.category) {
      if (mongoose.Types.ObjectId.isValid(query.category)) {
        filter.category = query.category;
      } else {
        const cat = await Category.findOne({ slug: query.category.toLowerCase() });
        if (cat) filter.category = cat._id;
      }
    }
    if (query.search) {
      const sanitized = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { location: { $regex: sanitized, $options: 'i' } },
        { ticketCode: { $regex: sanitized, $options: 'i' } }
      ];
    }

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug')
        .populate('reportedBy', 'name email role')
        .populate('assignedTo', 'name email role'),
      Ticket.countDocuments(filter)
    ]);

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Retrieves single ticket details with resource ownership verification.
   */
  async getTicketById(ticketId, requestingUser) {
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      throw ApiError.badRequest('Invalid ticket ID format');
    }

    const ticket = await Ticket.findById(ticketId)
      .populate('category', 'name slug description')
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role');

    if (!ticket) {
      throw ApiError.notFound('Ticket not found');
    }

    // Role-based resource ownership check
    if (requestingUser.role === ROLES.STUDENT) {
      const reporterId = ticket.reportedBy._id ? ticket.reportedBy._id.toString() : ticket.reportedBy.toString();
      if (reporterId !== requestingUser._id.toString()) {
        throw ApiError.notFound('Ticket not found');
      }
    } else if (requestingUser.role === ROLES.TECHNICIAN) {
      const assigneeId = ticket.assignedTo?._id ? ticket.assignedTo._id.toString() : ticket.assignedTo?.toString();
      if (assigneeId !== requestingUser._id.toString()) {
        throw ApiError.notFound('Ticket not found');
      }
    }

    return ticket;
  },

  /**
   * Admin assigns or reassigns an active technician to a ticket.
   * Changes status to ASSIGNED.
   */
  async assignTechnician(ticketId, technicianId, adminUser) {
    if (adminUser.role !== ROLES.ADMIN) {
      throw ApiError.forbidden('Only administrators can assign technicians');
    }

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      throw ApiError.badRequest('Invalid ticket ID');
    }

    if (!mongoose.Types.ObjectId.isValid(technicianId)) {
      throw ApiError.badRequest('Invalid technician ID');
    }

    // Verify technician account exists, is active, and possesses the TECHNICIAN role
    const technician = await User.findById(technicianId);
    if (!technician || !technician.isActive || technician.role !== ROLES.TECHNICIAN) {
      throw ApiError.badRequest('Assigned user must be an active technician account');
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw ApiError.notFound('Ticket not found');
    }

    const oldAssignedTo = ticket.assignedTo ? ticket.assignedTo.toString() : null;
    const oldStatus = ticket.status;

    // Update assignment and status
    ticket.assignedTo = technician._id;
    if (ticket.status === TICKET_STATUS.OPEN) {
      ticket.status = TICKET_STATUS.ASSIGNED;
    }

    await ticket.save();

    // Log assignment in audit history
    await auditService.logAction({
      ticketId: ticket._id,
      actorId: adminUser._id,
      action: AUDIT_ACTIONS.TECHNICIAN_ASSIGNED,
      oldValue: oldAssignedTo,
      newValue: technician._id.toString(),
      note: `Assigned to technician ${technician.name} (${technician.email})`
    });

    if (oldStatus !== ticket.status) {
      await auditService.logAction({
        ticketId: ticket._id,
        actorId: adminUser._id,
        action: AUDIT_ACTIONS.STATUS_CHANGED,
        oldValue: oldStatus,
        newValue: ticket.status,
        note: 'Ticket status transitioned to ASSIGNED upon technician assignment'
      });
    }

    return ticket.populate([
      { path: 'category', select: 'name slug' },
      { path: 'reportedBy', select: 'name email role' },
      { path: 'assignedTo', select: 'name email role' }
    ]);
  },

  /**
   * Updates ticket status according to the state machine lifecycle.
   * OPEN → ASSIGNED → IN_PROGRESS → RESOLVED.
   */
  async updateTicketStatus(ticketId, newStatus, resolutionNote, user) {
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      throw ApiError.badRequest('Invalid ticket ID');
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw ApiError.notFound('Ticket not found');
    }

    // Authorization: Students can never update status
    if (user.role === ROLES.STUDENT) {
      throw ApiError.forbidden('Students cannot modify ticket status');
    }

    // Technician authorization: Must be assigned to this ticket
    if (user.role === ROLES.TECHNICIAN) {
      if (!ticket.assignedTo || ticket.assignedTo.toString() !== user._id.toString()) {
        throw ApiError.forbidden('You can only update status for tickets assigned to you');
      }
    }

    const currentStatus = ticket.status;

    // Validate state machine transition
    const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
    const isStandardTransition = allowedNextStatuses.includes(newStatus);
    const isAdminCorrection = user.role === ROLES.ADMIN && currentStatus !== newStatus;

    if (!isStandardTransition && !isAdminCorrection) {
      throw ApiError.badRequest(
        `Invalid status transition from ${currentStatus} to ${newStatus}. Allowed transitions: [${allowedNextStatuses.join(', ')}]`
      );
    }

    // If resolving, resolutionNote is mandatory
    if (newStatus === TICKET_STATUS.RESOLVED) {
      if (!resolutionNote || resolutionNote.trim().length < 5) {
        throw ApiError.badRequest('Resolution note is required when resolving a ticket (min 5 characters)');
      }
      ticket.resolutionNote = resolutionNote.trim();
      ticket.resolvedAt = new Date();
    } else if (resolutionNote) {
      ticket.resolutionNote = resolutionNote.trim();
    }

    ticket.status = newStatus;
    await ticket.save();

    // Record audit entries
    await auditService.logAction({
      ticketId: ticket._id,
      actorId: user._id,
      action: AUDIT_ACTIONS.STATUS_CHANGED,
      oldValue: currentStatus,
      newValue: newStatus,
      note: resolutionNote || `Status updated from ${currentStatus} to ${newStatus}`
    });

    if (newStatus === TICKET_STATUS.RESOLVED) {
      await auditService.logAction({
        ticketId: ticket._id,
        actorId: user._id,
        action: AUDIT_ACTIONS.RESOLUTION_ADDED,
        oldValue: null,
        newValue: ticket.resolutionNote,
        note: 'Issue resolution details recorded'
      });
    }

    return ticket.populate([
      { path: 'category', select: 'name slug' },
      { path: 'reportedBy', select: 'name email role' },
      { path: 'assignedTo', select: 'name email role' }
    ]);
  },

  /**
   * Admin changes ticket priority with audit logging.
   */
  async updateTicketPriority(ticketId, newPriority, adminUser) {
    if (adminUser.role !== ROLES.ADMIN) {
      throw ApiError.forbidden('Only administrators can change ticket priority');
    }

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      throw ApiError.badRequest('Invalid ticket ID');
    }

    if (!PRIORITY_LIST.includes(newPriority)) {
      throw ApiError.badRequest(`Invalid priority value: ${newPriority}`);
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw ApiError.notFound('Ticket not found');
    }

    const oldPriority = ticket.priority;
    if (oldPriority === newPriority) {
      return ticket;
    }

    ticket.priority = newPriority;
    await ticket.save();

    // Audit logging
    await auditService.logAction({
      ticketId: ticket._id,
      actorId: adminUser._id,
      action: AUDIT_ACTIONS.PRIORITY_CHANGED,
      oldValue: oldPriority,
      newValue: newPriority,
      note: `Priority changed from ${oldPriority} to ${newPriority}`
    });

    return ticket.populate([
      { path: 'category', select: 'name slug' },
      { path: 'reportedBy', select: 'name email role' },
      { path: 'assignedTo', select: 'name email role' }
    ]);
  },

  /**
   * Retrieves ticket activity timeline if user is authorized.
   */
  async getTicketActivity(ticketId, user) {
    // getTicketById enforces role and ownership checks
    await this.getTicketById(ticketId, user);
    return auditService.getTicketActivity(ticketId);
  },

  /**
   * Admin overview metrics.
   */
  async getAdminOverview() {
    const [
      totalTickets,
      openTickets,
      assignedTickets,
      inProgressTickets,
      resolvedTickets,
      criticalTickets,
      totalTechnicians,
      totalStudents
    ] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: TICKET_STATUS.OPEN }),
      Ticket.countDocuments({ status: TICKET_STATUS.ASSIGNED }),
      Ticket.countDocuments({ status: TICKET_STATUS.IN_PROGRESS }),
      Ticket.countDocuments({ status: TICKET_STATUS.RESOLVED }),
      Ticket.countDocuments({ priority: PRIORITIES.CRITICAL }),
      User.countDocuments({ role: ROLES.TECHNICIAN, isActive: true }),
      User.countDocuments({ role: ROLES.STUDENT, isActive: true })
    ]);

    return {
      tickets: {
        total: totalTickets,
        open: openTickets,
        assigned: assignedTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        critical: criticalTickets
      },
      users: {
        activeTechnicians: totalTechnicians,
        activeStudents: totalStudents
      }
    };
  }
};
