import mongoose from 'mongoose';

import EnvConfig from './env.config.js';
import Logger from '../logger/logger.js';

/**
 * Loads and exposes database configuration.
 */
class DatabaseConfig {
  private readonly logger: Logger;
  private readonly env: EnvConfig;

  /**
   * Initializes the database config instance.
   */
  constructor(env = new EnvConfig()) {
    this.env = env;
    this.logger = new Logger();
  }

  /**
   * Opens the MongoDB connection used by the application.
   */
  public async connect(): Promise<void> {
    try {
      await mongoose.connect(this.env.mongoUri, { family: 4 });

      this.logger.info('MongoDB connected successfully');
    } catch (error) {
      this.logger.error('MongoDB connection failed', error);
      throw error;
    }
  }

  /**
   * Releases database resources and completes shutdown.
   */
  public async disconnect(): Promise<void> {
    await mongoose.disconnect();

    this.logger.info('MongoDB disconnected');
  }
}

export default DatabaseConfig;
