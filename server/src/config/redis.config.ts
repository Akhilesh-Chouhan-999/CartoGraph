import { Redis } from 'ioredis';

import EnvConfig from './env.config.js';

class RedisConfig {
  private readonly connection: Redis;

  constructor(env = new EnvConfig()) {
    this.connection = new Redis(env.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }

  public getClient(): Redis {
    return this.connection;
  }

  public async close(): Promise<void> {
    await this.connection.quit();
  }
}

export default RedisConfig;
