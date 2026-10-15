/**
 * Represents an application error with an HTTP status code.
 */
class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details: unknown;

  /**
   * Initializes the app error instance.
   * @param message - The message content.
   * @param statusCode - The status code value used by this operation.
   * @param isOperational - The is operational value used by this operation.
   * @param details - The details value used by this operation.
   */
  constructor(message: string, statusCode = 500, isOperational = true, details?: unknown) {
    super(message);

    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
