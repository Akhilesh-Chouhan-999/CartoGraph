import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import pinoHttpModule from 'pino-http';

import { ErrorMiddleware } from '../middleware/index.js';
import Logger from '../logger/logger.js';
import ApiRoutes from '../routes/index.js';
import type AnalysisQueue from '../queues/analysis.queue.js';
import { RateLimitMiddleware } from '../middleware/index.js';
import type { Redis } from 'ioredis';

const pinoHttp = pinoHttpModule.default;

/**
 * Configures and exposes the Express application.
 */
class App {
  private readonly app: Express;
  private readonly errorMiddleware: ErrorMiddleware;
  private readonly logger: Logger;

  /**
   * Initializes the app instance.
   * @param queue - The queue value used by this operation.
   * @param redis - The redis value used by this operation.
   * @param clientUrl - The client url value used by this operation.
   */
  constructor(queue: AnalysisQueue, redis: Redis, clientUrl: string) {
    this.app = express();
    this.errorMiddleware = new ErrorMiddleware();
    this.logger = new Logger();

    this.initializeMiddleware(clientUrl);
    this.initializeRoutes(queue, redis);
  }

  /**
   * Initializes middleware for the application.
   * @param clientUrl - The client url value used by this operation.
   */
  private initializeMiddleware(clientUrl: string): void {
    this.app.use(helmet());

    const normalizedClientUrl = clientUrl.replace(/\/$/, '');
    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || origin === normalizedClientUrl || origin === `${normalizedClientUrl}/`) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        },
        credentials: true,
      }),
    );

    this.app.use(
      express.json({
        limit: '1mb',
      }),
    );

    this.app.use(
      express.urlencoded({
        extended: true,
        limit: '1mb',
      }),
    );

    this.app.use(
      pinoHttp({
        logger: this.logger.getInstance(),
      }),
    );
  }

  /**
   * Initializes routes for the application.
   * @param queue - The queue value used by this operation.
   * @param redis - The redis value used by this operation.
   */
  private initializeRoutes(queue: AnalysisQueue, redis: Redis): void {
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        success: true,
        message: 'CartoGraph API is running',
      });
    });

    this.app.use('/api', new RateLimitMiddleware().general, new ApiRoutes(queue, redis).router);

    this.app.use(this.errorMiddleware.notFound());
    this.app.use(this.errorMiddleware.handler());
  }

  /**
   * Returns the configured Express application instance.
   */
  public getApp(): Express {
    return this.app;
  }
}

export default App;
