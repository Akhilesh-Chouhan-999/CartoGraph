import { Router } from 'express';
import type { Redis } from 'ioredis';

import { FileController } from '../controllers/index.js';
import { AuthMiddleware } from '../middleware/index.js';
import type AnalysisQueue from '../queues/analysis.queue.js';

/**
 * Registers the file API routes.
 */
class FileRoutes {
  public readonly router = Router();

  /**
   * Initializes the file routes instance.
   * @param queue - The queue value used by this operation.
   * @param redis - The redis value used by this operation.
   */
  constructor(queue: AnalysisQueue, redis: Redis) {
    this.router.use(new AuthMiddleware(redis).authenticate());
    this.router.get('/:fileId', new FileController(queue).getById);
  }
}

export default FileRoutes;
