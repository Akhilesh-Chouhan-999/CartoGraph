import { AnalysisModel, type Analysis } from '../models/index.js';
import type { HydratedDocument } from 'mongoose';

/**
 * Provides database operations for analysis records.
 */
class AnalysisRepository {
  /**
   * Creates a analysis record from the validated input.
   * @param data - The data to persist or process.
   */
  public async create(data: Partial<Analysis>): Promise<HydratedDocument<Analysis>> {
    const analysis: HydratedDocument<Analysis> = await AnalysisModel.create(data);
    return analysis;
  }

  /**
   * Finds a analysis record by its identifier.
   * @param id - The record identifier.
   */
  public async findById(id: string): Promise<HydratedDocument<Analysis> | null> {
    return AnalysisModel.findById(id).exec();
  }

  /**
   * Finds analyses associated with the specified project.
   * @param projectId - The project identifier.
   */
  public async findByProjectId(projectId: string): Promise<HydratedDocument<Analysis>[]> {
    return AnalysisModel.find({ projectId }).sort({ createdAt: -1 }).exec();
  }

  /**
   * Updates a analysis record by its identifier.
   * @param id - The record identifier.
   * @param data - The data to persist or process.
   */
  public async updateById(
    id: string,
    data: Partial<Analysis>,
  ): Promise<HydratedDocument<Analysis> | null> {
    return AnalysisModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).exec();
  }

  /**
   * Deletes a analysis record by its identifier.
   * @param id - The record identifier.
   */
  public async deleteById(id: string): Promise<HydratedDocument<Analysis> | null> {
    return AnalysisModel.findByIdAndDelete(id).exec();
  }

  /**
   * Deletes all analyses belonging to the specified project.
   * @param projectId - The project identifier.
   */
  public async deleteByProjectId(projectId: string): Promise<void> {
    await AnalysisModel.deleteMany({ projectId }).exec();
  }
}

export default AnalysisRepository;
