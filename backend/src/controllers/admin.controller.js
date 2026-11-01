import bcrypt from 'bcryptjs';
import { ticketService } from '../services/ticket.service.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';
import { auditService } from '../services/audit.service.js';
import { AUDIT_ACTIONS } from '../models/AuditLog.js';

export const getAdminUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.role) {
    filter.role = req.query.role;
  }
  if (req.query.search) {
    const sanitized = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: sanitized, $options: 'i' } },
      { email: { $regex: sanitized, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-refreshTokens'),
    User.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

export const getAdminOverview = asyncHandler(async (req, res) => {
  const overview = await ticketService.getAdminOverview();

  res.status(200).json({
    success: true,
    data: overview
  });
});

export const getAdminSlaOverview = asyncHandler(async (req, res) => {
  const slaOverview = await ticketService.getAdminSlaOverview();

  res.status(200).json({
    success: true,
    data: slaOverview
  });
});

/**
 * Create a new technician account.
 * Accessible strictly to authenticated ADMIN accounts.
 * Assigns the TECHNICIAN role exclusively on the backend.
 */
export const createTechnician = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  // Prevent duplicate account registrations
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists');
  }

  // Work factor 12 for password security
  const passwordHash = await bcrypt.hash(password, 12);

  // Exclusively assign TECHNICIAN role
  const technician = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: ROLES.TECHNICIAN,
    isActive: true
  });

  // Record audit log entry
  await auditService.logAction({
    ticketId: null,
    actorId: req.user._id,
    action: AUDIT_ACTIONS.TECHNICIAN_CREATED,
    oldValue: null,
    newValue: {
      userId: technician._id,
      name: technician.name,
      email: technician.email,
      role: technician.role
    },
    note: `Technician account created by administrator ${req.user.email}`
  });

  res.status(201).json({
    success: true,
    message: 'Technician account created successfully',
    data: {
      user: technician.toSafeObject()
    }
  });
});

