import { ChatSessionModel, type ChatSession } from '../models/index.js';
import type { HydratedDocument } from 'mongoose';

class ChatSessionRepository {
  public async create(data: Partial<ChatSession>): Promise<HydratedDocument<ChatSession>> {
    return ChatSessionModel.create(data);
  }

  public async findById(id: string): Promise<HydratedDocument<ChatSession> | null> {
    return ChatSessionModel.findById(id).exec();
  }

  public async findByProjectId(projectId: string): Promise<HydratedDocument<ChatSession>[]> {
    return ChatSessionModel.find({ projectId }).sort({ updatedAt: -1 }).exec();
  }

  public async updateById(
    id: string,
    data: Partial<ChatSession>,
  ): Promise<HydratedDocument<ChatSession> | null> {
    return ChatSessionModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).exec();
  }

  public async deleteById(id: string): Promise<HydratedDocument<ChatSession> | null> {
    return ChatSessionModel.findByIdAndDelete(id).exec();
  }
}

export default ChatSessionRepository;
