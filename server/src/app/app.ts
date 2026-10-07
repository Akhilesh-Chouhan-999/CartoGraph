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

class App {
  private readonly app: Express;
  private readonly errorMiddleware: ErrorMiddleware;
  private readonly logger: Logger;

  constructor(queue: AnalysisQueue, redis: Redis, clientUrl: string) {
    this.app = express();
    this.errorMiddleware = new ErrorMiddleware();
    this.logger = new Logger();

    this.initializeMiddleware(clientUrl);
    this.initializeRoutes(queue, redis);
  }

  private initializeMiddleware(clientUrl: string): void {
    this.app.use(helmet());

    this.app.use(
      cors({
        origin: clientUrl,
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

  public getApp(): Express {
    return this.app;
  }
}

export default App;
