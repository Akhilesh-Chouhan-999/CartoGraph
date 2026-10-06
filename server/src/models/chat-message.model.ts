import { Schema, model, type InferSchemaType } from 'mongoose';

const chatMessageSchema = new Schema(
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

    citations: [
      {
        fileId: {
          type: Schema.Types.ObjectId,
          ref: 'File',
        },

        path: {
          type: String,
        },

        line: {
          type: Number,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

export type ChatMessage = InferSchemaType<typeof chatMessageSchema>;

const ChatMessageModel = model<ChatMessage>('ChatMessage', chatMessageSchema);

export default ChatMessageModel;
