import { Router } from 'express';
import type { Redis } from 'ioredis';

import { AnalysisController, ProjectController } from '../controllers/index.js';
import { AuthMiddleware, ValidationMiddleware } from '../middleware/index.js';
import { createProjectSchema, updateProjectSchema } from '../schemas/index.js';
import type AnalysisQueue from '../queues/analysis.queue.js';

class ProjectRoutes {
  public readonly router = Router();

  constructor(queue: AnalysisQueue, redis: Redis) {
    const auth = new AuthMiddleware(redis).authenticate();
    const validation = new ValidationMiddleware();
    const projects = new ProjectController();
    const analyses = new AnalysisController(queue);

    this.router.use(auth);
    this.router.post('/', validation.validateBody(createProjectSchema), projects.create);
    this.router.get('/', projects.list);
    this.router.get('/:id/analyses', analyses.listForProject);
    this.router.get('/:id', projects.get);
    this.router.patch('/:id', validation.validateBody(updateProjectSchema), projects.update);
    this.router.delete('/:id', projects.remove);
  }
}

export default ProjectRoutes;
