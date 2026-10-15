import type { RequestHandler } from 'express';

/**
 * Wraps an asynchronous Express handler and forwards rejected promises to error middleware.
 * @param handler - The handler value used by this operation.
 */
export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
