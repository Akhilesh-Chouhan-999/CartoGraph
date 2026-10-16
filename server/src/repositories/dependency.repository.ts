import { DependencyModel, type Dependency } from '../models/index.js';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

/**
 * Provides database operations for dependency records.
 */
class DependencyRepository {
  /**
   * Creates a dependency record from the validated input.
   * @param data - The data to persist or process.
   */
  public async create(data: Partial<Dependency>): Promise<HydratedDocument<Dependency>> {
    const dependency: HydratedDocument<Dependency> = await DependencyModel.create(data);
    return dependency;
  }
  /**
   * Persists a batch of dependency records.
   * @param data - The data to persist or process.
   */
  public async createMany(data: Dependency[]): Promise<HydratedDocument<Dependency>[]> {
    return DependencyModel.insertMany(data);
  }
  /**
   * Finds a dependency record by its identifier.
   * @param id - The record identifier.
   */
  public async findById(id: string): Promise<HydratedDocument<Dependency> | null> {
    return DependencyModel.findById(id).exec();
  }

  /**
   * Finds files or dependencies associated with the specified analysis.
   * @param analysisId - The analysis identifier.
   */
  public async findByAnalysisId(analysisId: string): Promise<HydratedDocument<Dependency>[]> {
    return DependencyModel.find({ analysisId: new Types.ObjectId(analysisId) }).exec();
  }

  /**
   * Finds dependencies that originate at the specified file.
   * @param sourceFileId - The source file identifier.
   */
  public async findBySourceFileId(sourceFileId: string): Promise<HydratedDocument<Dependency>[]> {
    return DependencyModel.find({ sourceFileId: new Types.ObjectId(sourceFileId) }).exec();
  }

  /**
   * Finds dependencies that point to the specified file.
   * @param targetFileId - The target file identifier.
   */
  public async findByTargetFileId(targetFileId: string): Promise<HydratedDocument<Dependency>[]> {
    return DependencyModel.find({ targetFileId: new Types.ObjectId(targetFileId) }).exec();
  }

  /**
   * Deletes all records belonging to the specified analysis.
   * @param analysisId - The analysis identifier.
   */
  public async deleteByAnalysisId(analysisId: string): Promise<void> {
    await DependencyModel.deleteMany({ analysisId: new Types.ObjectId(analysisId) }).exec();
  }
}

export default DependencyRepository;
