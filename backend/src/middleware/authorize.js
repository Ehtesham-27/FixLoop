import { ApiError } from '../utils/ApiError.js';

/**
 * Role-based authorization middleware.
 * Checks whether the authenticated user's role is in the permitted roles.
 *
 * @param {...string} allowedRoles
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(`Access forbidden: Role '${req.user.role}' is not authorized to access this resource`)
      );
    }

    next();
  };
}
