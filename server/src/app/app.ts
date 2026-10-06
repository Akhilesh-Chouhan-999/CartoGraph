import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { ErrorMiddleware } from '../middleware/index.js';
import Logger from '../logger/logger.js';

class App {
  private readonly app: Express;
  private readonly errorMiddleware: ErrorMiddleware;
  private readonly logger: Logger;

  constructor() {
    this.app = express();
    this.errorMiddleware = new ErrorMiddleware();
    this.logger = new Logger();

    this.initializeMiddleware();
    this.initializeRoutes();
  }

  private initializeMiddleware(): void {
    this.app.use(helmet());

    this.app.use(
      cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
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

  private initializeRoutes(): void {
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        success: true,
        message: 'CartoGraph API is running',
      });
    });

    this.app.use(this.errorMiddleware.notFound());
    this.app.use(this.errorMiddleware.handler());
  }

  public getApp(): Express {
    return this.app;
  }
}

export default App;
