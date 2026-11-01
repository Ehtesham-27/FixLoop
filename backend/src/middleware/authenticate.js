import { ApiError } from '../utils/ApiError.js';

/**
 * Authentication middleware scaffold.
 * Verifies JWT token and attaches authenticated user payload to req.user.
 * 
 * TODO: Complete JWT verification logic with access token extraction from Authorization header / cookie.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Authentication token missing or malformed'));
  }

  // TODO: Verify JWT token using jwt.verify and env.JWT_ACCESS_SECRET in Stage 2/3
  return next(ApiError.unauthorized('Authentication handler is in scaffold mode. Full authentication implementation pending in next phase.'));
}

