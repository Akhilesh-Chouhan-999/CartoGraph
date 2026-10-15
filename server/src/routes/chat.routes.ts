import { Router } from 'express';
import type { Redis } from 'ioredis';

import { ChatController } from '../controllers/index.js';
import { AuthMiddleware } from '../middleware/index.js';
import type AnalysisQueue from '../queues/analysis.queue.js';

/**
 * Registers the chat API routes.
 */
class ChatRoutes {
  public readonly router = Router();

  /**
   * Initializes the chat routes instance.
   * @param queue - The queue value used by this operation.
   * @param redis - The redis value used by this operation.
   */
  constructor(queue: AnalysisQueue, redis: Redis) {
    this.router.use(new AuthMiddleware(redis).authenticate());
    const controller = new ChatController(queue);
    this.router.post('/sessions', controller.createSession);
    this.router.get('/sessions/:id', controller.getSession);
    this.router.get('/sessions/:id/messages', controller.messages);
    this.router.delete('/sessions/:id', controller.deleteSession);
  }
}

export default ChatRoutes;
