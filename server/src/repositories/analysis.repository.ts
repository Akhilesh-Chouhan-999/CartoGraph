import { AnalysisModel, type Analysis } from '../models/index.js';
import type { HydratedDocument } from 'mongoose';

class AnalysisRepository {
  public async create(data: Partial<Analysis>): Promise<HydratedDocument<Analysis>> {
    return AnalysisModel.create(data);
  }

  public async findById(id: string): Promise<HydratedDocument<Analysis> | null> {
    return AnalysisModel.findById(id).exec();
  }

  public async findByProjectId(projectId: string): Promise<HydratedDocument<Analysis>[]> {
    return AnalysisModel.find({ projectId }).sort({ createdAt: -1 }).exec();
  }

  public async updateById(
    id: string,
    data: Partial<Analysis>,
  ): Promise<HydratedDocument<Analysis> | null> {
    return AnalysisModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).exec();
  }

  public async deleteById(id: string): Promise<HydratedDocument<Analysis> | null> {
    return AnalysisModel.findByIdAndDelete(id).exec();
  }

  public async deleteByProjectId(projectId: string): Promise<void> {
    await AnalysisModel.deleteMany({ projectId }).exec();
  }
}

export default AnalysisRepository;
