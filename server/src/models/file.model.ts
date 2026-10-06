import { Schema, model, type InferSchemaType } from 'mongoose';

const fileSchema = new Schema(
  {
    analysisId: {
      type: Schema.Types.ObjectId,
      ref: 'Analysis',
      required: true,
      index: true,
    },

    path: {
      type: String,
      required: true,
      trim: true,
    },

    language: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: [
        'entry',
        'controller',
        'service',
        'repository',
        'model',
        'utility',
        'middleware',
        'config',
        'test',
        'unknown',
      ],
      default: 'unknown',
    },

    lines: {
      type: Number,
      default: 0,
      min: 0,
    },

    fanIn: {
      type: Number,
      default: 0,
      min: 0,
    },

    fanOut: {
      type: Number,
      default: 0,
      min: 0,
    },

    hash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

fileSchema.index({ analysisId: 1, path: 1 }, { unique: true });

export type FileDocument = InferSchemaType<typeof fileSchema>;

const FileModel = model<FileDocument>('File', fileSchema);

export default FileModel;
