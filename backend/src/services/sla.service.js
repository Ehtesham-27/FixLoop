import { SLA_TARGETS, SLA_STATUS, SLA_AT_RISK_RATIO } from '../constants/sla.js';
import { PRIORITIES } from '../constants/priorities.js';
import { TICKET_STATUS } from '../constants/ticket-status.js';

export const slaService = {
  /**
   * Retrieves resolution target in hours for the given priority.
   * Defaults to MEDIUM (24h) if priority is omitted or unrecognized.
   */
  getSlaTargetHours(priority) {
    if (priority && SLA_TARGETS[priority] !== undefined) {
      return SLA_TARGETS[priority];
    }
    return SLA_TARGETS[PRIORITIES.MEDIUM];
  },

  /**
   * Calculates the resolution deadline from a given starting timestamp and priority.
   */
  calculateDueAt(startTime, priority) {
    const baseTime = startTime instanceof Date ? startTime.getTime() : new Date(startTime).getTime();
    const validBaseTime = isNaN(baseTime) ? Date.now() : baseTime;
    const targetHours = this.getSlaTargetHours(priority);
    return new Date(validBaseTime + targetHours * 60 * 60 * 1000);
  },

  /**
   * Resolves deadline for a ticket with fallback calculation for legacy tickets.
   */
  deriveDueAt(ticket) {
    if (ticket.dueAt) {
      const parsed = new Date(ticket.dueAt);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    // Fallback: derive from createdAt and priority
    const baseTime = ticket.createdAt ? new Date(ticket.createdAt).getTime() : Date.now();
    const priority = ticket.priority || PRIORITIES.MEDIUM;
    return this.calculateDueAt(baseTime, priority);
  },

  /**
   * Calculates real-time SLA metrics for a ticket.
   */
  getSlaDetails(ticket, currentTime = new Date()) {
    const now = currentTime instanceof Date ? currentTime.getTime() : new Date(currentTime).getTime();
    const priority = ticket.priority || PRIORITIES.MEDIUM;
    const slaTargetHours = ticket.slaTargetHours || this.getSlaTargetHours(priority);
    const dueAt = this.deriveDueAt(ticket);
    const dueTime = dueAt.getTime();

    const isResolved = ticket.status === TICKET_STATUS.RESOLVED;

    if (isResolved) {
      const resolvedTime = ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : now;
      const isResolvedOnTime = resolvedTime <= dueTime;

      return {
        slaTargetHours,
        dueAt,
        slaStatus: isResolvedOnTime ? SLA_STATUS.RESOLVED_ON_TIME : SLA_STATUS.RESOLVED_LATE,
        remainingMilliseconds: 0,
        isOverdue: false, // Resolved tickets are never classified as currently overdue
        slaBreachedAt: !isResolvedOnTime ? (ticket.slaBreachedAt || dueAt) : null
      };
    }

    // Unresolved tickets
    const remainingMilliseconds = dueTime - now;

    if (remainingMilliseconds < 0) {
      return {
        slaTargetHours,
        dueAt,
        slaStatus: SLA_STATUS.OVERDUE,
        remainingMilliseconds,
        isOverdue: true,
        slaBreachedAt: ticket.slaBreachedAt || dueAt
      };
    }

    const totalDurationMs = slaTargetHours * 60 * 60 * 1000;
    const atRiskThresholdMs = totalDurationMs * SLA_AT_RISK_RATIO;

    if (remainingMilliseconds <= atRiskThresholdMs) {
      return {
        slaTargetHours,
        dueAt,
        slaStatus: SLA_STATUS.AT_RISK,
        remainingMilliseconds,
        isOverdue: false,
        slaBreachedAt: null
      };
    }

    return {
      slaTargetHours,
      dueAt,
      slaStatus: SLA_STATUS.ON_TRACK,
      remainingMilliseconds,
      isOverdue: false,
      slaBreachedAt: null
    };
  },

  /**
   * Enriches a ticket object or Mongoose document with computed SLA fields.
   */
  enrichTicket(ticket, currentTime = new Date()) {
    if (!ticket) return null;
    const plain = ticket.toObject ? ticket.toObject() : { ...ticket };
    const sla = this.getSlaDetails(ticket, currentTime);

    return {
      ...plain,
      slaTargetHours: sla.slaTargetHours,
      dueAt: sla.dueAt,
      slaStatus: sla.slaStatus,
      remainingMilliseconds: sla.remainingMilliseconds,
      isOverdue: sla.isOverdue,
      slaBreachedAt: sla.slaBreachedAt
    };
  },

  /**
   * Enriches a list of tickets.
   */
  enrichTickets(tickets, currentTime = new Date()) {
    if (!Array.isArray(tickets)) return [];
    return tickets.map((t) => this.enrichTicket(t, currentTime));
  },

  /**
   * Constructs a MongoDB query filter for a specific SLA status.
   */
  buildSlaFilter(slaStatus, currentTime = new Date()) {
    const now = currentTime instanceof Date ? currentTime : new Date(currentTime);

    switch (slaStatus) {
      case SLA_STATUS.OVERDUE:
        return {
          status: { $ne: TICKET_STATUS.RESOLVED },
          dueAt: { $lt: now }
        };

      case SLA_STATUS.AT_RISK: {
        const atRiskOr = Object.entries(SLA_TARGETS).map(([p, hours]) => {
          const windowMs = hours * 3600000 * SLA_AT_RISK_RATIO;
          return {
            priority: p,
            dueAt: { $gte: now, $lte: new Date(now.getTime() + windowMs) }
          };
        });
        return {
          status: { $ne: TICKET_STATUS.RESOLVED },
          $or: atRiskOr
        };
      }

      case SLA_STATUS.ON_TRACK: {
        const onTrackOr = Object.entries(SLA_TARGETS).map(([p, hours]) => {
          const windowMs = hours * 3600000 * SLA_AT_RISK_RATIO;
          return {
            priority: p,
            dueAt: { $gt: new Date(now.getTime() + windowMs) }
          };
        });
        return {
          status: { $ne: TICKET_STATUS.RESOLVED },
          $or: onTrackOr
        };
      }

      case SLA_STATUS.RESOLVED_ON_TIME:
        return {
          status: TICKET_STATUS.RESOLVED,
          $expr: { $lte: ['$resolvedAt', '$dueAt'] }
        };

      case SLA_STATUS.RESOLVED_LATE:
        return {
          status: TICKET_STATUS.RESOLVED,
          $expr: { $gt: ['$resolvedAt', '$dueAt'] }
        };

      default:
        return {};
    }
  }
};
