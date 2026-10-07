import { ChatMessageModel, type ChatMessage } from '../models/index.js';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

class ChatMessageRepository {
  public async create(data: Partial<ChatMessage>): Promise<HydratedDocument<ChatMessage>> {
    return ChatMessageModel.create(data);
  }
  public async createMany(data: ChatMessage[]): Promise<HydratedDocument<ChatMessage>[]> {
    return ChatMessageModel.insertMany(data);
  }

  public async findById(id: string): Promise<HydratedDocument<ChatMessage> | null> {
    return ChatMessageModel.findById(id).exec();
  }

  public async findBySessionId(sessionId: string): Promise<HydratedDocument<ChatMessage>[]> {
    return ChatMessageModel.find({ sessionId: new Types.ObjectId(sessionId) })
      .sort({ createdAt: 1 })
      .exec();
  }

  public async deleteBySessionId(sessionId: string): Promise<void> {
    await ChatMessageModel.deleteMany({ sessionId: new Types.ObjectId(sessionId) }).exec();
  }
}

export default ChatMessageRepository;
