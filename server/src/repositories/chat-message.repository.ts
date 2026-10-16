import { ChatMessageModel, type ChatMessage } from '../models/index.js';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

/**
 * Provides database operations for chat message records.
 */
class ChatMessageRepository {
  /**
   * Creates a chat message record from the validated input.
   * @param data - The data to persist or process.
   */
  public async create(data: Partial<ChatMessage>): Promise<HydratedDocument<ChatMessage>> {
    const message: HydratedDocument<ChatMessage> = await ChatMessageModel.create(data);
    return message;
  }
  /**
   * Persists a batch of chat message records.
   * @param data - The data to persist or process.
   */
  public async createMany(data: ChatMessage[]): Promise<HydratedDocument<ChatMessage>[]> {
    return ChatMessageModel.insertMany(data);
  }

  /**
   * Finds a chat message record by its identifier.
   * @param id - The record identifier.
   */
  public async findById(id: string): Promise<HydratedDocument<ChatMessage> | null> {
    return ChatMessageModel.findById(id).exec();
  }

  /**
   * Finds chat message records by the session id.
   * @param sessionId - The chat session identifier.
   */
  public async findBySessionId(sessionId: string): Promise<HydratedDocument<ChatMessage>[]> {
    return ChatMessageModel.find({ sessionId: new Types.ObjectId(sessionId) })
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * Deletes all messages belonging to the specified chat session.
   * @param sessionId - The chat session identifier.
   */
  public async deleteBySessionId(sessionId: string): Promise<void> {
    await ChatMessageModel.deleteMany({ sessionId: new Types.ObjectId(sessionId) }).exec();
  }
}

export default ChatMessageRepository;
