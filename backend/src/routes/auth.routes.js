import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { loginSchema, registerSchema } from '../validators/auth.validators.js';
import { env } from '../config/env.js';

const router = Router();

// Dedicated rate limiting for authentication endpoints to prevent brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
// Origin check middleware: only allow refresh requests from the configured frontend origin.
// This is a CSRF defence for the cookie-authenticated refresh endpoint.
// With SameSite=None the cookie is sent cross-origin, so a forged page on another origin
// could trigger a silent token refresh. Validating the Origin header closes that window.
const validateRefreshOrigin = (req, res, next) => {
  const origin = req.headers.origin;
  // Allow requests with no Origin header (e.g. same-origin, curl, Postman, mobile apps)
  if (!origin) return next();
  // In production, reject requests whose Origin does not match CLIENT_ORIGIN
  if (env.NODE_ENV === 'production' && origin !== env.CLIENT_ORIGIN) {
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: 'Cross-origin refresh token request rejected'
    });
  }
  next();
};

router.post('/refresh', validateRefreshOrigin, authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);

export default router;
