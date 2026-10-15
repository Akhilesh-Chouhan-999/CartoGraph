import pino, { type Logger as PinoLogger } from 'pino';

/**
 * Provides the application logging interface.
 */
class Logger {
  private readonly logger: PinoLogger;

  /**
   * Initializes the logger instance.
   */
  constructor() {
    const options = {
      level: process.env.LOG_LEVEL || 'info',
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    };

    if (process.env.NODE_ENV === 'development') {
      this.logger = pino({
        ...options,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
          },
        },
      });

      return;
    }

    this.logger = pino(options);
  }

  /**
   * Writes an informational message to the application log.
   * @param message - The message content.
   */
  public info(message: string): void {
    this.logger.info(message);
  }

  /**
   * Writes a warning message to the application log.
   * @param message - The message content.
   */
  public warn(message: string): void {
    this.logger.warn(message);
  }

  /**
   * Writes an error message to the application log.
   * @param message - The message content.
   * @param error - The error to normalize or report.
   */
  public error(message: string, error?: unknown): void {
    if (error instanceof Error) {
      this.logger.error(
        {
          err: error,
        },
        message,
      );

      return;
    }

    this.logger.error({ error }, message);
  }

  /**
   * Writes a debug message to the application log.
   * @param message - The message content.
   */
  public debug(message: string): void {
    this.logger.debug(message);
  }

  /**
   * Returns the shared logger instance.
   */
  public getInstance(): PinoLogger {
    return this.logger;
  }
}

export default Logger;
