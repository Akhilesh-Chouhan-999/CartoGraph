import mongoose from 'mongoose';

import Logger from '../logger/logger.js';

/**
 * Loads and exposes database configuration.
 */
class DatabaseConfig {
  private readonly logger: Logger;

  /**
   * Initializes the database config instance.
   */
  constructor() {
    this.logger = new Logger();
  }

  /**
   * Opens the MongoDB connection used by the application.
   */
  public async connect(): Promise<void> {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined');
    }

    try {
      await mongoose.connect(mongoUri);

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
