import type { RequestHandler } from 'express';

import AnalysisService from '../services/analysis.service.js';
import AnalysisQueue from '../queues/analysis.queue.js';
import ChatService from '../services/chat.service.js';
import { AppError } from '../errors/index.js';
import { chatMessageSchema, createChatSessionSchema } from '../schemas/index.js';
import { idParamsSchema } from '../schemas/index.js';

/**
 * Handles HTTP requests for chat operations.
 */
class ChatController {
  private readonly chat: ChatService;
  private readonly analyses: AnalysisService;

  /**
   * Initializes the chat controller instance.
   * @param queue - The queue value used by this operation.
   */
  constructor(queue: AnalysisQueue) {
    this.analyses = new AnalysisService(queue);
    this.chat = new ChatService(this.analyses);
  }

  /**
   * Sends a repository question to the grounded AI agent and returns its answer.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
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

  /**
   * Creates a chat session for the selected project and analysis.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
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

  /**
   * Retrieves a chat session after checking the requesting user owns its project.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public getSession: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.chat.getSession(userId, id) });
  };

  /**
   * Retrieves the messages saved in the selected chat session.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public messages: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.chat.getMessages(userId, id) });
  };

  /**
   * Removes the requested chat data.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public deleteSession: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    await this.chat.deleteSession(userId, id);
    res.status(204).end();
  };
}

export default ChatController;
