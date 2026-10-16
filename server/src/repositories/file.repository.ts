import { FileModel, type FileDocument } from '../models/index.js';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

/**
 * Provides database operations for file records.
 */
class FileRepository {
  /**
   * Creates a file record from the validated input.
   * @param data - The data to persist or process.
   */
  public async create(data: Partial<FileDocument>): Promise<HydratedDocument<FileDocument>> {
    const file: HydratedDocument<FileDocument> = await FileModel.create(data);
    return file;
  }
  /**
   * Persists a batch of file records.
   * @param data - The data to persist or process.
   */
  public async createMany(data: FileDocument[]): Promise<HydratedDocument<FileDocument>[]> {
    return FileModel.insertMany(data);
  }

  /**
   * Finds a file record by its identifier.
   * @param id - The record identifier.
   */
  public async findById(id: string): Promise<HydratedDocument<FileDocument> | null> {
    return FileModel.findById(id).exec();
  }

  /**
   * Finds files or dependencies associated with the specified analysis.
   * @param analysisId - The analysis identifier.
   */
  public async findByAnalysisId(analysisId: string): Promise<HydratedDocument<FileDocument>[]> {
    return FileModel.find({ analysisId: new Types.ObjectId(analysisId) })
      .sort({ path: 1 })
      .exec();
  }

  /**
   * Finds a file by its normalized path within an analysis.
   * @param analysisId - The analysis identifier.
   * @param path - The file or route path.
   */
  public async findByPath(
    analysisId: string,
    path: string,
  ): Promise<HydratedDocument<FileDocument> | null> {
    return FileModel.findOne({ analysisId: new Types.ObjectId(analysisId), path }).exec();
  }

  /**
   * Updates a file record by its identifier.
   * @param id - The record identifier.
   * @param data - The data to persist or process.
   */
  public async updateById(
    id: string,
    data: Partial<FileDocument>,
  ): Promise<HydratedDocument<FileDocument> | null> {
    return FileModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).exec();
  }

  /**
   * Deletes a file record by its identifier.
   * @param id - The record identifier.
   */
  public async deleteById(id: string): Promise<HydratedDocument<FileDocument> | null> {
    return FileModel.findByIdAndDelete(id).exec();
  }

  /**
   * Deletes all records belonging to the specified analysis.
   * @param analysisId - The analysis identifier.
   */
  public async deleteByAnalysisId(analysisId: string): Promise<void> {
    await FileModel.deleteMany({ analysisId: new Types.ObjectId(analysisId) }).exec();
  }
}

export default FileRepository;
