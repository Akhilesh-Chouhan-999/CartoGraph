import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

import AppError from '../errors/app.error.js';
import Logger from '../logger/logger.js';

class ErrorMiddleware {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  public notFound(): RequestHandler {
    return (req, _res, next) => {
      next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
    };
  }

  public handler(): ErrorRequestHandler {
    return (error, _req, res, _next) => {
      const appError = this.toAppError(error);

      if (!appError.isOperational) {
        this.logger.error('Unexpected application error', error);
      } else {
        this.logger.error(appError.message);
      }

      res.status(appError.statusCode).json({
        success: false,
        message: appError.message,
        ...(process.env.NODE_ENV === 'development' && appError.details !== undefined
          ? { details: appError.details }
          : {}),
      });
    };
  }

  private toAppError(error: unknown): AppError {
    if (error instanceof AppError) return error;
    if (error instanceof ZodError)
      return new AppError('Invalid request input', 422, true, error.issues);
    if (error instanceof mongoose.Error.ValidationError) {
      return new AppError('Database validation failed', 422, true);
    }
    if (error instanceof mongoose.Error.CastError)
      return new AppError('Invalid resource identifier', 400);
    if (typeof error === 'object' && error !== null) {
      const record = error as Record<string, unknown>;
      if (record.code === 11000)
        return new AppError('A resource with these values already exists', 409);
      if (record.status === 400 && error instanceof SyntaxError) {
        return new AppError('Malformed JSON request body', 400);
      }
    }
    return new AppError('Internal server error', 500, false);
  }
}

export default ErrorMiddleware;
