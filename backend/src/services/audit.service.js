import { AuditLog } from '../models/AuditLog.js';

/**
 * Audit Service Scaffold
 * 
 * Records system transitions and ownership changes for audit trail.
 */
export const auditService = {
  async logAction({ ticketId, actorId, action, oldValue = null, newValue = null }) {
    // Scaffold implementation for recording audit entries
    return AuditLog.create({
      ticketId,
      actorId,
      action,
      oldValue,
      newValue
    });
  },

  async getTicketActivity(ticketId) {
    // TODO [Phase 6]: Fetch and format chronological audit log for a ticket
    return AuditLog.find({ ticketId }).sort({ createdAt: -1 }).populate('actorId', 'name role');
  }
};

