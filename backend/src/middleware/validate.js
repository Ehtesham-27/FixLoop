import { ApiError } from '../utils/ApiError.js';

/**
 * Validates request data against a Zod schema.
 * @param {import('zod').ZodSchema} schema - Schema expecting { body, query, params }
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
  } catch (err) {
    if (err.errors) {
      const formattedErrors = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message
      }));
      next(ApiError.badRequest('Validation failed', formattedErrors));
    } else {
      next(err);
    }
  }
};

