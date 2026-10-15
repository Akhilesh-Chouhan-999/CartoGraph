import { Types } from 'mongoose';

import { AppError } from '../errors/index.js';
import { ChatMessageRepository, ChatSessionRepository } from '../repositories/index.js';
import CartoGraphAgent from '../langchain/agent.js';
import AnalysisService from './analysis.service.js';
import ProjectService from './project.service.js';

/**
 * Coordinates chat application logic.
 */
class ChatService {
  private readonly sessions = new ChatSessionRepository();
  private readonly messages = new ChatMessageRepository();
  private readonly analyses: AnalysisService;
  private readonly projects = new ProjectService();
  private readonly agent: CartoGraphAgent;

  /**
   * Initializes the chat service instance.
   * @param analyses - The analyses value used by this operation.
   */
  constructor(analyses: AnalysisService) {
    this.analyses = analyses;
    this.agent = new CartoGraphAgent(analyses);
  }

  /**
   * Creates a chat session for the selected project and analysis.
   * @param userId - The user identifier.
   * @param input - The input value to process.
   */
  public async createSession(
    userId: string,
    input: { projectId: string; analysisId: string; title?: string },
  ) {
    const analysis = await this.analyses.getAnalysis(userId, input.analysisId);
    if (analysis.projectId.toString() !== input.projectId)
      throw new AppError('Analysis does not belong to this project', 404);
    await this.projects.getProject(userId, input.projectId);
    return this.sessions.create({
      projectId: new Types.ObjectId(input.projectId),
      analysisId: new Types.ObjectId(input.analysisId),
      ...(input.title === undefined ? {} : { title: input.title }),
    });
  }

  /**
   * Retrieves a chat session after checking the requesting user owns its project.
   * @param userId - The user identifier.
   * @param sessionId - The chat session identifier.
   */
  public async getSession(userId: string, sessionId: string) {
    const session = await this.sessions.findById(sessionId);
    if (session === null) throw new AppError('Chat session not found', 404);
    await this.analyses.getAnalysis(userId, session.analysisId.toString());
    return session;
  }

  /**
   * Retrieves the messages saved in a chat session.
   * @param userId - The user identifier.
   * @param sessionId - The chat session identifier.
   */
  public async getMessages(userId: string, sessionId: string) {
    await this.getSession(userId, sessionId);
    return this.messages.findBySessionId(sessionId);
  }

  /**
   * Removes the requested chat data.
   * @param userId - The user identifier.
   * @param sessionId - The chat session identifier.
   */
  public async deleteSession(userId: string, sessionId: string): Promise<void> {
    await this.getSession(userId, sessionId);
    await this.messages.deleteBySessionId(sessionId);
    await this.sessions.deleteById(sessionId);
  }

  /**
   * Produces a response to the supplied chat request.
   * @param userId - The user identifier.
   * @param analysisId - The analysis identifier.
   * @param input - The input value to process.
   */
  public async sendMessage(
    userId: string,
    analysisId: string,
    input: { message: string; sessionId?: string },
  ) {
    const analysis = await this.analyses.getAnalysis(userId, analysisId);
    const session =
      input.sessionId === undefined
        ? await this.sessions.create({
            projectId: analysis.projectId,
            analysisId: analysis._id,
            title: input.message.slice(0, 80),
          })
        : await this.getSession(userId, input.sessionId);
    if (session.analysisId.toString() !== analysisId)
      throw new AppError('Chat session belongs to a different analysis', 404);
    const history = await this.messages.findBySessionId(session._id.toString());
    await this.messages.create({
      sessionId: session._id,
      role: 'user',
      content: input.message,
      citations: [],
    });
    const result = await this.agent.answer({
      analysisId,
      userId,
      question: input.message,
      history: history.map((message) => ({
        role: message.role,
        content: message.content.slice(0, 4000),
      })),
    });
    await this.messages.create({
      sessionId: session._id,
      role: 'assistant',
      content: result.answer,
      citations: result.citations.map((citation) => ({ path: citation.path })),
    });
    return {
      answer: result.answer,
      citations: result.citations,
      sessionId: session._id.toString(),
    };
  }
}

export default ChatService;
