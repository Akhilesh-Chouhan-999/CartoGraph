import { Schema, model, type InferSchemaType } from 'mongoose';

const chatSessionSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },

    analysisId: {
      type: Schema.Types.ObjectId,
      ref: 'Analysis',
      required: true,
      index: true,
    },

    title: {
      type: String,
      trim: true,
      default: 'New conversation',
    },
  },
  {
    timestamps: true,
  },
);

export type ChatSession = InferSchemaType<typeof chatSessionSchema>;

const ChatSessionModel = model<ChatSession>('ChatSession', chatSessionSchema);

export default ChatSessionModel;
