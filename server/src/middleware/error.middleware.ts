import type { ErrorRequestHandler, RequestHandler } from 'express';

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
      const appError =
        error instanceof AppError ? error : new AppError('Internal server error', 500, false);

      if (!appError.isOperational) {
        this.logger.error('Unexpected application error', error);
      } else {
        this.logger.error(appError.message);
      }

      res.status(appError.statusCode).json({
        success: false,
        message: appError.message,
      });
    };
  }
}

export default ErrorMiddleware;
