import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateAccessToken(user) {
  const payload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL
  });
}

export function generateRefreshToken(user) {
  const tokenId = crypto.randomBytes(16).toString('hex');
  const payload = {
    sub: user._id.toString(),
    jti: tokenId
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

export function getRefreshTokenCookieOptions() {
  // In production, the frontend (Vercel) and backend (Render) are on different origins.
  // SameSite=None is required for the browser to send the HttpOnly refresh-token cookie
  // on cross-origin requests from Vercel to Render.
  // Security note: SameSite=None removes same-site CSRF protection. Mitigated by:
  //   - The Secure flag (HTTPS-only) — mandatory with SameSite=None.
  //   - Stateless JWT bearer tokens for all state-changing operations.
  //   - /api/auth/refresh only issues a new token pair; it does not mutate application state.
  //   - CORS credentials: true + explicit CLIENT_ORIGIN whitelist blocks unauthorized origins.
  // In development (same localhost origin), SameSite=Lax is sufficient and more restrictive.
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  };
}

export function getClearRefreshTokenCookieOptions() {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth'
  };
}

