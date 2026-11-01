import { ticketService } from '../services/ticket.service.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/async-handler.js';

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
