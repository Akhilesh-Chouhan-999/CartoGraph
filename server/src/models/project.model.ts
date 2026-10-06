import { Schema, model, type InferSchemaType } from 'mongoose';

const projectSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    githubUrl: {
      type: String,
      required: true,
      trim: true,
    },

    owner: {
      type: String,
      required: true,
      trim: true,
    },

    repository: {
      type: String,
      required: true,
      trim: true,
    },

    defaultBranch: {
      type: String,
      required: true,
      default: 'main',
    },
  },
  {
    timestamps: true,
  },
);

export type Project = InferSchemaType<typeof projectSchema>;

const ProjectModel = model<Project>('Project', projectSchema);

export default ProjectModel;
