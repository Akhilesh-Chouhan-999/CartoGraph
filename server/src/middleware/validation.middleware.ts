import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

import { AppError } from '../errors/index.js';

class ValidationMiddleware {
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
