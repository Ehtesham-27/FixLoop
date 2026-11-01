import mongoose from 'mongoose';
import { PRIORITIES, PRIORITY_LIST } from '../constants/priorities.js';
import { TICKET_STATUS, TICKET_STATUS_LIST } from '../constants/ticket-status.js';
import { SLA_TARGETS } from '../constants/sla.js';

const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters long'],
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required']
    },
    building: {
      type: String,
      trim: true,
      maxlength: [100, 'Building name cannot exceed 100 characters'],
      default: ''
    },
    room: {
      type: String,
      trim: true,
      maxlength: [100, 'Room location cannot exceed 100 characters'],
      default: ''
    },
    location: {
      type: String,
      trim: true,
      maxlength: [150, 'Location cannot exceed 150 characters'],
      default: function () {
        return this.building && this.room ? `${this.building} - ${this.room}` : '';
      }
    },
    priority: {
      type: String,
      enum: {
        values: PRIORITY_LIST,
        message: '{VALUE} is not a valid priority level'
      },
      default: PRIORITIES.MEDIUM
    },
    status: {
      type: String,
      enum: {
        values: TICKET_STATUS_LIST,
        message: '{VALUE} is not a valid ticket status'
      },
      default: TICKET_STATUS.OPEN
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter reference is required'],
      alias: 'reporter'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    images: {
      type: [attachmentSchema],
      default: [],
      alias: 'attachments'
    },
    resolutionNote: {
      type: String,
      trim: true,
      maxlength: [2000, 'Resolution note cannot exceed 2000 characters'],
      default: '',
      alias: 'resolutionNotes'
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    slaTargetHours: {
      type: Number,
      default: null
    },
    dueAt: {
      type: Date,
      default: null
    },
    slaBreachedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Automatic building, room, and location synchronization before validation
ticketSchema.pre('validate', function (next) {
  if (!this.location && this.building && this.room) {
    this.location = `${this.building} - ${this.room}`;
  } else if (this.location && (!this.building || !this.room)) {
    if (this.location.includes('-')) {
      const parts = this.location.split('-');
      if (!this.building) this.building = parts[0].trim();
      if (!this.room) this.room = parts.slice(1).join('-').trim();
    } else {
      if (!this.building) this.building = this.location;
      if (!this.room) this.room = 'General';
    }
  }

  // Generate human-friendly ticketCode if absent
  if (!this.ticketCode) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    this.ticketCode = `FL-${randomSuffix}`;
  }

  // Calculate default SLA fields if not explicitly assigned
  if (!this.slaTargetHours) {
    this.slaTargetHours = SLA_TARGETS[this.priority] || SLA_TARGETS[PRIORITIES.MEDIUM];
  }
  if (!this.dueAt) {
    const baseTime = this.createdAt ? new Date(this.createdAt).getTime() : Date.now();
    this.dueAt = new Date(baseTime + this.slaTargetHours * 60 * 60 * 1000);
  }

  next();
});

// Compound indexes
ticketSchema.index({ reportedBy: 1, createdAt: -1 });
ticketSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });
ticketSchema.index({ category: 1, createdAt: -1 });
ticketSchema.index({ dueAt: 1, status: 1 });

export const Ticket = mongoose.model('Ticket', ticketSchema);
