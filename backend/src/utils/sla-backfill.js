import { Ticket } from '../models/Ticket.js';
import { SLA_TARGETS } from '../constants/sla.js';
import { PRIORITIES } from '../constants/priorities.js';

/**
 * Idempotently backfills missing dueAt and slaTargetHours on legacy tickets.
 * Only modifies documents where dueAt is null or undefined.
 * Preserves historical createdAt, updatedAt, and all existing ticket attributes.
 */
export async function backfillLegacySlaTickets() {
  const legacyTickets = await Ticket.find({ dueAt: null }).select('_id priority createdAt dueAt').lean();
  if (!legacyTickets || legacyTickets.length === 0) {
    return 0;
  }

  const bulkOps = legacyTickets.map((t) => {
    const priority = t.priority || PRIORITIES.MEDIUM;
    const hours = SLA_TARGETS[priority] || SLA_TARGETS[PRIORITIES.MEDIUM];
    const rawCreatedTime = t.createdAt ? new Date(t.createdAt).getTime() : NaN;
    const createdAt = Number.isFinite(rawCreatedTime) ? rawCreatedTime : Date.now();
    const dueAt = new Date(createdAt + hours * 60 * 60 * 1000);

    return {
      updateOne: {
        filter: { _id: t._id, dueAt: null },
        update: {
          $set: {
            slaTargetHours: hours,
            dueAt: dueAt
          }
        }
      }
    };
  });

  if (bulkOps.length > 0) {
    const result = await Ticket.bulkWrite(bulkOps);
    return result.modifiedCount || 0;
  }

  return 0;
}
