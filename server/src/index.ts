import 'dotenv/config';

import type { Server as HttpServer } from 'node:http';

import { App } from './app/index.js';
import { AppConfig, DatabaseConfig, EnvConfig, RedisConfig } from './config/index.js';
import { Logger } from './logger/index.js';
import AnalysisQueue from './queues/analysis.queue.js';
import { AnalysisWorker } from './workers/index.js';

/**
 * Starts the HTTP server and manages application resources.
 */
class Server {
  private readonly config: AppConfig;
  private readonly database: DatabaseConfig;
  private app: App | undefined;
  private readonly logger: Logger;
  private readonly env: EnvConfig;
  private server: HttpServer | undefined;
  private readonly redis: RedisConfig;
  private queue: AnalysisQueue | undefined;
  private worker: AnalysisWorker | undefined;

  /**
   * Initializes the server instance.
   */
  constructor() {
    this.env = new EnvConfig();
    this.config = new AppConfig();
    this.database = new DatabaseConfig(this.env);
    this.redis = new RedisConfig(this.env);
    this.logger = new Logger();
    this.registerShutdownHandlers();
    void this.start().catch((error: unknown) => {
      this.logger.error('CartoGraph startup failed', error);
      void this.closeResources().catch((closeError: unknown) => {
        this.logger.error('CartoGraph startup cleanup failed', closeError);
      });
      process.exitCode = 1;
    });
  }

  /**
   * Starts server processing and its required resources.
   */
  private async start(): Promise<void> {
    await this.database.connect();
    await this.redis.getClient().ping();
    this.logger.info('Redis connected successfully');
    this.queue = new AnalysisQueue(this.redis.getClient());
    this.worker = new AnalysisWorker(this.redis.getClient());
    this.app = new App(this.queue, this.redis.getClient(), this.env.clientUrl);
    this.server = this.app.getApp().listen(this.config.port, () => {
      this.logger.info(
        `CartoGraph API running on port ${this.config.port} in ${this.config.nodeEnv} mode`,
      );
    });
  }

  /**
   * Registers shutdown handlers with the application.
   */
  private registerShutdownHandlers(): void {
    process.on('SIGINT', () => {
      void this.shutdown('SIGINT');
    });

    process.on('SIGTERM', () => {
      void this.shutdown('SIGTERM');
    });
  }

  /**
   * Releases server resources and completes shutdown.
   * @param signal - The signal value used by this operation.
   */
  private async shutdown(signal: string): Promise<void> {
    this.logger.info(`Received ${signal}. Starting graceful shutdown...`);

    if (this.server === undefined) {
      await this.closeResources();
      process.exit(0);
    }
    this.server.close(async () => {
      try {
        await this.closeResources();

        this.logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        this.logger.error('Error during graceful shutdown', error);
        process.exit(1);
      }
    });
  }

  /**
   * Releases server resources and completes shutdown.
   */
  private async closeResources(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
    await this.redis.close();
    await this.database.disconnect();
  }
}

new Server();
