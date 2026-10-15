import { Redis } from 'ioredis';

import EnvConfig from './env.config.js';

/**
 * Loads and exposes redis configuration.
 */
class RedisConfig {
  private readonly connection: Redis;

  /**
   * Initializes the redis config instance.
   * @param env - The env value used by this operation.
   */
  constructor(env = new EnvConfig()) {
    this.connection = new Redis(env.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }

  /**
   * Returns the shared Redis client instance.
   */
  public getClient(): Redis {
    return this.connection;
  }

  /**
   * Releases redis resources and completes shutdown.
   */
  public async close(): Promise<void> {
    await this.connection.quit();
  }
}

export default RedisConfig;
