import mongoose from 'mongoose';

export const AUDIT_ACTIONS = Object.freeze({
  TICKET_CREATED: 'TICKET_CREATED',
  TECHNICIAN_ASSIGNED: 'TECHNICIAN_ASSIGNED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  PRIORITY_CHANGED: 'PRIORITY_CHANGED',
  RESOLUTION_ADDED: 'RESOLUTION_ADDED',
  ATTACHMENT_ADDED: 'ATTACHMENT_ADDED'
});

export const AUDIT_ACTION_LIST = Object.values(AUDIT_ACTIONS);

const auditLogSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: [true, 'Ticket reference is required'],
      alias: 'ticket'
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor reference is required'],
      alias: 'actor'
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      enum: {
        values: AUDIT_ACTION_LIST,
        message: '{VALUE} is not an authorized audit action'
      },
      trim: true
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      alias: 'previousValue'
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
      default: ''
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Indexes
auditLogSchema.index({ ticketId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
