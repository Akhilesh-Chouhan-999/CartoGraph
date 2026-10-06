import 'dotenv/config';

import { App } from './app/index.js';
import { AppConfig, DatabaseConfig } from './config/index.js';
import { Logger } from './logger/index.js';

class Server {
  private readonly config: AppConfig;
  private readonly database: DatabaseConfig;
  private readonly app: App;
  private readonly logger: Logger;

  constructor() {
    this.config = new AppConfig();
    this.database = new DatabaseConfig();
    this.app = new App();
    this.logger = new Logger();
  }

  public async start(): Promise<void> {
    await this.database.connect();

    this.app.getApp().listen(this.config.port, () => {
      this.logger.info(
        `CartoGraph API running on port ${this.config.port} in ${this.config.nodeEnv} mode`,
      );
    });
  }
}

const server = new Server();

server.start().catch((error: unknown) => {
  const logger = new Logger();

  logger.error('Failed to start CartoGraph', error);

  process.exit(1);
});
