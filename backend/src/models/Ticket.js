import mongoose from 'mongoose';
import { PRIORITIES, PRIORITY_LIST } from '../constants/priorities.js';
import { TICKET_STATUS, TICKET_STATUS_LIST } from '../constants/ticket-status.js';

const imageSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true }
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
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
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
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    images: {
      type: [imageSchema],
      default: []
    },
    resolutionNote: {
      type: String,
      trim: true,
      maxlength: [2000, 'Resolution note cannot exceed 2000 characters'],
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Helpful indexes for queries
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ createdAt: -1 });

export const Ticket = mongoose.model('Ticket', ticketSchema);

