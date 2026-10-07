import { Router } from 'express';
import type { Redis } from 'ioredis';

import {
  AnalysisController,
  ChatController,
  DependencyController,
  FileController,
} from '../controllers/index.js';
import { AuthMiddleware, RateLimitMiddleware, ValidationMiddleware } from '../middleware/index.js';
import { chatMessageSchema, createAnalysisSchema } from '../schemas/index.js';
import type AnalysisQueue from '../queues/analysis.queue.js';

class AnalysisRoutes {
  public readonly router = Router();

  constructor(queue: AnalysisQueue, redis: Redis) {
    const auth = new AuthMiddleware(redis).authenticate();
    const validation = new ValidationMiddleware();
    const limits = new RateLimitMiddleware();
    const analyses = new AnalysisController(queue);
    const files = new FileController(queue);
    const dependencies = new DependencyController(queue);
    const chat = new ChatController(queue);

    this.router.use(auth);
    this.router.post(
      '/',
      limits.analysis,
      validation.validateBody(createAnalysisSchema),
      analyses.create,
    );
    this.router.get('/:id', analyses.get);
    this.router.get('/:id/status', analyses.status);
    this.router.get('/:id/stats', analyses.stats);
    this.router.get('/:id/graph', analyses.graphData);
    this.router.get('/:id/files', files.list);
    this.router.get('/:id/files/:fileId', files.get);
    this.router.get('/:id/files/:fileId/dependencies', dependencies.outgoing);
    this.router.get('/:id/files/:fileId/dependents', dependencies.incoming);
    this.router.get('/:id/files/:fileId/blast-radius', dependencies.blastRadiusData);
    this.router.post('/:id/path', dependencies.path);
    this.router.post('/:id/chat', limits.ai, validation.validateBody(chatMessageSchema), chat.ask);
  }
}

export default AnalysisRoutes;
