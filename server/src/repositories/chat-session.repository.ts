import { ChatSessionModel, type ChatSession } from '../models/index.js';
import type { HydratedDocument } from 'mongoose';

/**
 * Provides database operations for chat session records.
 */
class ChatSessionRepository {
  /**
   * Creates a chat session record from the validated input.
   * @param data - The data to persist or process.
   */
  public async create(data: Partial<ChatSession>): Promise<HydratedDocument<ChatSession>> {
    const session: HydratedDocument<ChatSession> = await ChatSessionModel.create(data);
    return session;
  }

  /**
   * Finds a chat session record by its identifier.
   * @param id - The record identifier.
   */
  public async findById(id: string): Promise<HydratedDocument<ChatSession> | null> {
    return ChatSessionModel.findById(id).exec();
  }

  /**
   * Finds analyses associated with the specified project.
   * @param projectId - The project identifier.
   */
  public async findByProjectId(projectId: string): Promise<HydratedDocument<ChatSession>[]> {
    return ChatSessionModel.find({ projectId }).sort({ updatedAt: -1 }).exec();
  }

  /**
   * Updates a chat session record by its identifier.
   * @param id - The record identifier.
   * @param data - The data to persist or process.
   */
  public async updateById(
    id: string,
    data: Partial<ChatSession>,
  ): Promise<HydratedDocument<ChatSession> | null> {
    return ChatSessionModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).exec();
  }

  /**
   * Deletes a chat session record by its identifier.
   * @param id - The record identifier.
   */
  public async deleteById(id: string): Promise<HydratedDocument<ChatSession> | null> {
    return ChatSessionModel.findByIdAndDelete(id).exec();
  }
}

export default ChatSessionRepository;
