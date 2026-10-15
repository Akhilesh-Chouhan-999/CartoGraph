import { Router } from 'express';
import type { Redis } from 'ioredis';

import { DependencyController } from '../controllers/index.js';
import { AuthMiddleware } from '../middleware/index.js';
import type AnalysisQueue from '../queues/analysis.queue.js';

/**
 * Registers the dependency API routes.
 */
class DependencyRoutes {
  public readonly router = Router();

  /**
   * Initializes the dependency routes instance.
   * @param queue - The queue value used by this operation.
   * @param redis - The redis value used by this operation.
   */
  constructor(queue: AnalysisQueue, redis: Redis) {
    this.router.use(new AuthMiddleware(redis).authenticate());
    const controller = new DependencyController(queue);
    this.router.get('/:fileId', controller.outgoingByFile);
    this.router.get('/:fileId/dependents', controller.incomingByFile);
  }
}

export default DependencyRoutes;
