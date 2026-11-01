import { ApiError } from '../utils/ApiError.js';

/**
 * Role-based authorization middleware.
 * Checks whether the authenticated user's role is permitted for the route.
 * 
 * @param  {...string} allowedRoles
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }

    next();
  };
}

