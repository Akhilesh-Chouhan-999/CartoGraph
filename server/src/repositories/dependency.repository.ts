import { DependencyModel, type Dependency } from '../models/index.js';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

class DependencyRepository {
  public async create(data: Partial<Dependency>): Promise<HydratedDocument<Dependency>> {
    return DependencyModel.create(data);
  }
  public async createMany(data: Dependency[]): Promise<HydratedDocument<Dependency>[]> {
    return DependencyModel.insertMany(data);
  }
  public async findById(id: string): Promise<HydratedDocument<Dependency> | null> {
    return DependencyModel.findById(id).exec();
  }

  public async findByAnalysisId(analysisId: string): Promise<HydratedDocument<Dependency>[]> {
    return DependencyModel.find({ analysisId: new Types.ObjectId(analysisId) }).exec();
  }

  public async findBySourceFileId(sourceFileId: string): Promise<HydratedDocument<Dependency>[]> {
    return DependencyModel.find({ sourceFileId: new Types.ObjectId(sourceFileId) }).exec();
  }

  public async findByTargetFileId(targetFileId: string): Promise<HydratedDocument<Dependency>[]> {
    return DependencyModel.find({ targetFileId: new Types.ObjectId(targetFileId) }).exec();
  }

  public async deleteByAnalysisId(analysisId: string): Promise<void> {
    await DependencyModel.deleteMany({ analysisId: new Types.ObjectId(analysisId) }).exec();
  }
}

export default DependencyRepository;
