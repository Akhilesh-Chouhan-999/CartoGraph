import { Router } from 'express';
import type { Redis } from 'ioredis';

import { FileController } from '../controllers/index.js';
import { AuthMiddleware } from '../middleware/index.js';
import type AnalysisQueue from '../queues/analysis.queue.js';

class FileRoutes {
  public readonly router = Router();

  constructor(queue: AnalysisQueue, redis: Redis) {
    this.router.use(new AuthMiddleware(redis).authenticate());
    this.router.get('/:fileId', new FileController(queue).getById);
  }
}

export default FileRoutes;
