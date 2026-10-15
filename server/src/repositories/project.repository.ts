import { ProjectModel, type Project } from '../models/index.js';
import type { HydratedDocument } from 'mongoose';

/**
 * Provides database operations for project records.
 */
class ProjectRepository {
  /**
   * Creates a project record from the validated input.
   * @param data - The data to persist or process.
   */
  public async create(data: Partial<Project>): Promise<HydratedDocument<Project>> {
    return ProjectModel.create(data);
  }

  /**
   * Finds a project record by its identifier.
   * @param id - The record identifier.
   */
  public async findById(id: string): Promise<HydratedDocument<Project> | null> {
    return ProjectModel.findById(id).exec();
  }

  /**
   * Finds projects owned by the specified user.
   * @param userId - The user identifier.
   */
  public async findByUserId(userId: string): Promise<HydratedDocument<Project>[]> {
    return ProjectModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  /**
   * Updates a project record by its identifier.
   * @param id - The record identifier.
   * @param data - The data to persist or process.
   */
  public async updateById(
    id: string,
    data: Partial<Project>,
  ): Promise<HydratedDocument<Project> | null> {
    return ProjectModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).exec();
  }

  /**
   * Deletes a project record by its identifier.
   * @param id - The record identifier.
   */
  public async deleteById(id: string): Promise<HydratedDocument<Project> | null> {
    return ProjectModel.findByIdAndDelete(id).exec();
  }
}

export default ProjectRepository;
