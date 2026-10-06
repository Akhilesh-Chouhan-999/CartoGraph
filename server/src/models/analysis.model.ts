import { Schema, model, type InferSchemaType } from 'mongoose';

const analysisSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },

    commitSha: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
      required: true,
    },

    fileCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    dependencyCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    startedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },

    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export type Analysis = InferSchemaType<typeof analysisSchema>;

const AnalysisModel = model<Analysis>('Analysis', analysisSchema);

export default AnalysisModel;
