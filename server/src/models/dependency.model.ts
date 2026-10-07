import { Schema, Types, model } from 'mongoose';

export interface Dependency {
  analysisId: Types.ObjectId;
  sourceFileId: Types.ObjectId;
  targetFileId: Types.ObjectId;
  type: 'import' | 'export' | 'dynamic-import' | 'require';
  line?: number;
}

const dependencySchema = new Schema<Dependency>(
  {
    analysisId: {
      type: Schema.Types.ObjectId,
      ref: 'Analysis',
      required: true,
      index: true,
    },

    sourceFileId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      required: true,
      index: true,
    },

    targetFileId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ['import', 'export', 'dynamic-import', 'require'],
      required: true,
    },

    line: {
      type: Number,
      min: 1,
    },
  },
  {
    timestamps: true,
  },
);

dependencySchema.index(
  {
    analysisId: 1,
    sourceFileId: 1,
    targetFileId: 1,
  },
  {
    unique: true,
  },
);

const DependencyModel = model<Dependency>('Dependency', dependencySchema);

export default DependencyModel;
