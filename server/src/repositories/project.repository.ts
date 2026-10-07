import { ProjectModel, type Project } from '../models/index.js';
import type { HydratedDocument } from 'mongoose';

class ProjectRepository {
  public async create(data: Partial<Project>): Promise<HydratedDocument<Project>> {
    return ProjectModel.create(data);
  }

  public async findById(id: string): Promise<HydratedDocument<Project> | null> {
    return ProjectModel.findById(id).exec();
  }

  public async findByUserId(userId: string): Promise<HydratedDocument<Project>[]> {
    return ProjectModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  public async updateById(
    id: string,
    data: Partial<Project>,
  ): Promise<HydratedDocument<Project> | null> {
    return ProjectModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).exec();
  }

  public async deleteById(id: string): Promise<HydratedDocument<Project> | null> {
    return ProjectModel.findByIdAndDelete(id).exec();
  }
}

export default ProjectRepository;
