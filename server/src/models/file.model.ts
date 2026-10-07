import { Schema, Types, model } from 'mongoose';

export interface FileDocument {
  analysisId: Types.ObjectId;
  path: string;
  language: string;
  role:
    | 'entry'
    | 'controller'
    | 'service'
    | 'repository'
    | 'model'
    | 'utility'
    | 'middleware'
    | 'config'
    | 'test'
    | 'unknown';
  lines: number;
  fanIn: number;
  fanOut: number;
  hash: string;
}

const fileSchema = new Schema<FileDocument>(
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

const FileModel = model<FileDocument>('File', fileSchema);

export default FileModel;
