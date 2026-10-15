import { Router } from 'express';
import type { Redis } from 'ioredis';

import AnalysisRoutes from './analysis.routes.js';
import AuthRoutes from './auth.routes.js';
import ChatRoutes from './chat.routes.js';
import DependencyRoutes from './dependency.routes.js';
import FileRoutes from './file.routes.js';
import ProjectRoutes from './project.routes.js';
import type AnalysisQueue from '../queues/analysis.queue.js';

/**
 * Registers the api API routes.
 */
class ApiRoutes {
  public readonly router = Router();

  /**
   * Initializes the api routes instance.
   * @param queue - The queue value used by this operation.
   * @param redis - The redis value used by this operation.
   */
  constructor(queue: AnalysisQueue, redis: Redis) {
    this.router.use('/auth', new AuthRoutes(redis).router);
    this.router.use('/projects', new ProjectRoutes(queue, redis).router);
    this.router.use('/analyses', new AnalysisRoutes(queue, redis).router);
    this.router.use('/files', new FileRoutes(queue, redis).router);
    this.router.use('/dependencies', new DependencyRoutes(queue, redis).router);
    this.router.use('/chat', new ChatRoutes(queue, redis).router);
  }
}

export default ApiRoutes;
