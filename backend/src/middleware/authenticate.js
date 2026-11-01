import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/token.js';
import { User } from '../models/User.js';

/**
 * Authentication middleware.
 * Verifies JWT access token and attaches authenticated user to req.user.
 */
export async function authenticate(req, res, next) {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication token missing'));
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Access token has expired'));
      }
      return next(ApiError.unauthorized('Invalid access token'));
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return next(ApiError.unauthorized('User account not found'));
    }

    if (!user.isActive) {
      return next(ApiError.unauthorized('Account is deactivated. Access denied.'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
