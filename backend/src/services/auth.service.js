import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { ROLES } from '../constants/roles.js';
import { ApiError } from '../utils/ApiError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken
} from '../utils/token.js';

export const authService = {
  /**
   * Registers a new student account.
   * Public registration is restricted strictly to the STUDENT role.
   */
  async registerUser({ name, email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    if (password.length < 8) {
      throw ApiError.badRequest('Password must be at least 8 characters long');
    }

    // Work factor 12 for password security
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user strictly with STUDENT role
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: ROLES.STUDENT,
      isActive: true
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.refreshTokens = [
      {
        tokenHash: hashToken(refreshToken),
        expiresAt
      }
    ];

    await user.save();

    return {
      user: user.toSafeObject(),
      accessToken,
      refreshToken
    };
  },

  /**
   * Authenticates any active user (STUDENT, TECHNICIAN, or ADMIN).
   */
  async loginUser({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash +refreshTokens');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Account is deactivated. Please contact an administrator.');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Filter out expired refresh tokens and maintain at most 5 sessions
    const now = new Date();
    const activeTokens = (user.refreshTokens || []).filter((t) => t.expiresAt > now);

    activeTokens.push({
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Keep the latest 5 sessions
    user.refreshTokens = activeTokens.slice(-5);
    await user.save();

    return {
      user: user.toSafeObject(),
      accessToken,
      refreshToken
    };
  },

  /**
   * Refreshes access token with refresh token rotation and revocation.
   */
  async refreshTokens(currentRefreshToken) {
    if (!currentRefreshToken) {
      throw ApiError.unauthorized('Refresh token is required');
    }

    let payload;
    try {
      payload = verifyRefreshToken(currentRefreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await User.findById(payload.sub).select('+refreshTokens');
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Account is deactivated. Please contact an administrator.');
    }

    const currentHash = hashToken(currentRefreshToken);
    const now = new Date();
    const tokenIndex = (user.refreshTokens || []).findIndex(
      (t) => t.tokenHash === currentHash && t.expiresAt > now
    );

    // If token not found in user's active tokens list, token reuse/theft detected
    if (tokenIndex === -1) {
      // Invalidate all tokens for this user for security
      user.refreshTokens = [];
      await user.save();
      throw ApiError.unauthorized('Refresh token was revoked or reused. Please log in again.');
    }

    // Rotate token: Remove used token
    user.refreshTokens.splice(tokenIndex, 1);

    // Generate new token pair
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshTokens.push({
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    await user.save();

    return {
      user: user.toSafeObject(),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  },

  /**
   * Logs out user and revokes the provided refresh token.
   */
  async logoutUser(refreshToken) {
    if (refreshToken) {
      const currentHash = hashToken(refreshToken);
      await User.updateOne(
        { 'refreshTokens.tokenHash': currentHash },
        { $pull: { refreshTokens: { tokenHash: currentHash } } }
      );
    }
    return { success: true };
  },

  /**
   * Retrieves profile of current authenticated user.
   */
  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    if (!user.isActive) {
      throw ApiError.unauthorized('Account is deactivated');
    }
    return user.toSafeObject();
  }
};
