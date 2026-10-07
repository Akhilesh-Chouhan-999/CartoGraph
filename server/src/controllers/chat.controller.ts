import type { RequestHandler } from 'express';

import AnalysisService from '../services/analysis.service.js';
import AnalysisQueue from '../queues/analysis.queue.js';
import ChatService from '../services/chat.service.js';
import { AppError } from '../errors/index.js';
import { chatMessageSchema, createChatSessionSchema } from '../schemas/index.js';
import { idParamsSchema } from '../schemas/index.js';

class ChatController {
  private readonly chat: ChatService;
  private readonly analyses: AnalysisService;

  constructor(queue: AnalysisQueue) {
    this.analyses = new AnalysisService(queue);
    this.chat = new ChatService(this.analyses);
  }

  public ask: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    const body = chatMessageSchema.parse(req.body);
    res.json({
      success: true,
      data: await this.chat.sendMessage(userId, id, {
        message: body.message,
        ...(body.sessionId === undefined ? {} : { sessionId: body.sessionId }),
      }),
    });
  };

  public createSession: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const body = createChatSessionSchema.parse(req.body);
    res.status(201).json({
      success: true,
      data: await this.chat.createSession(userId, {
        projectId: body.projectId,
        analysisId: body.analysisId,
        ...(body.title === undefined ? {} : { title: body.title }),
      }),
    });
  };

  public getSession: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.chat.getSession(userId, id) });
  };

  public messages: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.chat.getMessages(userId, id) });
  };

  public deleteSession: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    await this.chat.deleteSession(userId, id);
    res.status(204).end();
  };
}

export default ChatController;
