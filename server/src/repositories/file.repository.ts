import { FileModel, type FileDocument } from '../models/index.js';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

class FileRepository {
  public async create(data: Partial<FileDocument>): Promise<HydratedDocument<FileDocument>> {
    return FileModel.create(data);
  }
  public async createMany(data: FileDocument[]): Promise<HydratedDocument<FileDocument>[]> {
    return FileModel.insertMany(data);
  }

  public async findById(id: string): Promise<HydratedDocument<FileDocument> | null> {
    return FileModel.findById(id).exec();
  }

  public async findByAnalysisId(analysisId: string): Promise<HydratedDocument<FileDocument>[]> {
    return FileModel.find({ analysisId: new Types.ObjectId(analysisId) })
      .sort({ path: 1 })
      .exec();
  }

  public async findByPath(
    analysisId: string,
    path: string,
  ): Promise<HydratedDocument<FileDocument> | null> {
    return FileModel.findOne({ analysisId: new Types.ObjectId(analysisId), path }).exec();
  }

  public async updateById(
    id: string,
    data: Partial<FileDocument>,
  ): Promise<HydratedDocument<FileDocument> | null> {
    return FileModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).exec();
  }

  public async deleteById(id: string): Promise<HydratedDocument<FileDocument> | null> {
    return FileModel.findByIdAndDelete(id).exec();
  }

  public async deleteByAnalysisId(analysisId: string): Promise<void> {
    await FileModel.deleteMany({ analysisId: new Types.ObjectId(analysisId) }).exec();
  }
}

export default FileRepository;
