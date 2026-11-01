import { asyncHandler } from '../utils/async-handler.js';

/**
 * Auth Controller Scaffold
 * 
 * TODO [Phase 2]: Wire controllers to authService.
 */
export const register = asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Register endpoint is scaffolded. Implementation scheduled for Phase 2.'
  });
});

export const login = asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Login endpoint is scaffolded. Implementation scheduled for Phase 2.'
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Refresh token endpoint is scaffolded. Implementation scheduled for Phase 2.'
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Logout endpoint is scaffolded. Implementation scheduled for Phase 2.'
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'GetMe endpoint is scaffolded. Implementation scheduled for Phase 2.'
  });
});

