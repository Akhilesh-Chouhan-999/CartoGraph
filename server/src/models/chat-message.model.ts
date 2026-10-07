import { Schema, Types, model } from 'mongoose';

export interface ChatCitation {
  fileId?: Types.ObjectId;
  path?: string;
  line?: number;
}

export interface ChatMessage {
  sessionId: Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  citations: ChatCitation[];
}

const chatMessageSchema = new Schema<ChatMessage>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatSession',
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    citations: {
      type: [
        {
          fileId: { type: Schema.Types.ObjectId, ref: 'File' },
          path: { type: String },
          line: { type: Number },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'chatMessages',
  },
);

const ChatMessageModel = model<ChatMessage>('ChatMessage', chatMessageSchema);

export default ChatMessageModel;
