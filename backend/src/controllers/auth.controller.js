import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { getClearRefreshTokenCookieOptions, getRefreshTokenCookieOptions } from '../utils/token.js';

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(req.body);

  // Set secure HttpOnly cookie for refresh token
  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token: accessToken,
      accessToken
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body);

  // Set secure HttpOnly cookie for refresh token
  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token: accessToken,
      accessToken
    }
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const currentRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  const { user, accessToken, refreshToken: newRefreshToken } = await authService.refreshTokens(
    currentRefreshToken
  );

  // Rotate HttpOnly cookie
  res.cookie('refreshToken', newRefreshToken, getRefreshTokenCookieOptions());

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      user,
      token: accessToken,
      accessToken
    }
  });
});

export const logout = asyncHandler(async (req, res) => {
  const tokenToRevoke = req.cookies?.refreshToken || req.body?.refreshToken;

  if (tokenToRevoke) {
    await authService.logoutUser(tokenToRevoke);
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken', getClearRefreshTokenCookieOptions());

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});
