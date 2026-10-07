import pino, { type Logger as PinoLogger } from 'pino';

class Logger {
  private readonly logger: PinoLogger;

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

  public info(message: string): void {
    this.logger.info(message);
  }

  public warn(message: string): void {
    this.logger.warn(message);
  }

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

  public debug(message: string): void {
    this.logger.debug(message);
  }

  public getInstance(): PinoLogger {
    return this.logger;
  }
}

export default Logger;
