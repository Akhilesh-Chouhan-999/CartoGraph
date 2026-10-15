import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

import { AppError } from '../errors/index.js';

/**
 * Provides middleware for validation request handling.
 */
class ValidationMiddleware {
  /**
   * Validates the request body against the supplied Zod schema.
   * @param schema - The schema value used by this operation.
   */
  public validateBody(schema: ZodType): RequestHandler {
    return (req, _res, next) => {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        next(new AppError('Invalid request body', 422, true, result.error.issues));
        return;
      }
      req.body = result.data;
      next();
    };
  }

  /**
   * Validates the route parameters against the supplied Zod schema.
   * @param schema - The schema value used by this operation.
   */
  public validateParams(schema: ZodType): RequestHandler {
    return (req, _res, next) => {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        next(new AppError('Invalid request parameters', 422, true, result.error.issues));
        return;
      }
      next();
    };
  }
}

export default ValidationMiddleware;
