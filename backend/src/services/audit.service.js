import { AuditLog } from '../models/AuditLog.js';

/**
 * Audit Service
 * Records system transitions and actions for an immutable audit trail.
 */
export const auditService = {
  /**
   * Appends an audit entry.
   */
  async logAction({ ticketId, actorId, action, oldValue = null, newValue = null, note = '' }) {
    return AuditLog.create({
      ticketId,
      actorId,
      action,
      oldValue,
      newValue,
      note
    });
  },

  /**
   * Retrieves chronological audit history for a given ticket.
   */
  async getTicketActivity(ticketId) {
    return AuditLog.find({ ticketId })
      .sort({ createdAt: -1 })
      .populate('actorId', 'name email role');
  }
};
