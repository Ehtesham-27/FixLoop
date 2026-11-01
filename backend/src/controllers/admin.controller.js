import { asyncHandler } from '../utils/async-handler.js';

/**
 * Admin Controller Scaffold
 * 
 * TODO [Phase 5]: Complete admin metrics and user administration.
 */
export const getAdminUsers = asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Admin users endpoint is scaffolded. Implementation scheduled for Phase 5.'
  });
});

export const getAdminOverview = asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Admin overview endpoint is scaffolded. Implementation scheduled for Phase 5.'
  });
});

