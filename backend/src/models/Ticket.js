import mongoose from 'mongoose';
import { PRIORITIES, PRIORITY_LIST } from '../constants/priorities.js';
import { TICKET_STATUS, TICKET_STATUS_LIST } from '../constants/ticket-status.js';

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
      required: [true, 'Building name is required'],
      trim: true,
      maxlength: [100, 'Building name cannot exceed 100 characters']
    },
    room: {
      type: String,
      required: [true, 'Room or specific location is required'],
      trim: true,
      maxlength: [100, 'Room location cannot exceed 100 characters']
    },
    location: {
      type: String,
      trim: true,
      maxlength: [150, 'Location cannot exceed 150 characters']
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
    }
  },
  {
    timestamps: true
  }
);

// Automatic location sync before save if building & room are provided
ticketSchema.pre('save', function (next) {
  if (!this.location && this.building && this.room) {
    this.location = `${this.building} - ${this.room}`;
  }
  next();
});

// Compound indexes specified in Section 6 of FixLoop_DATABASE.md
ticketSchema.index({ reportedBy: 1, createdAt: -1 });
ticketSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });
ticketSchema.index({ category: 1, createdAt: -1 });

export const Ticket = mongoose.model('Ticket', ticketSchema);
