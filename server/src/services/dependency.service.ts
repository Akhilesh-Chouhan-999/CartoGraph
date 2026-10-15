import { DependencyRepository, FileRepository } from '../repositories/index.js';
import { AppError } from '../errors/index.js';
import { Types } from 'mongoose';
import type { Dependency } from '../models/index.js';
import AnalysisService from './analysis.service.js';

/**
 * Coordinates dependency application logic.
 */
class DependencyService {
  private readonly dependencies = new DependencyRepository();
  private readonly files = new FileRepository();
  private readonly analyses: AnalysisService;

  /**
   * Initializes the dependency service instance.
   * @param analyses - The analyses value used by this operation.
   */
  constructor(analyses: AnalysisService) {
    this.analyses = analyses;
  }

  /**
   * Creates dependency data from the supplied input.
   * @param userId - The user identifier.
   * @param analysisId - The analysis identifier.
   * @param data - The data to persist or process.
   */
  public async createDependency(
    userId: string,
    analysisId: string,
    data: Omit<Dependency, 'analysisId'>,
  ) {
    await this.analyses.getAnalysis(userId, analysisId);
    await this.assertFile(analysisId, data.sourceFileId.toString());
    await this.assertFile(analysisId, data.targetFileId.toString());
    return this.dependencies.create({ ...data, analysisId: new Types.ObjectId(analysisId) });
  }

  /**
   * Creates dependency data from the supplied input.
   * @param userId - The user identifier.
   * @param analysisId - The analysis identifier.
   * @param data - The data to persist or process.
   */
  public async createDependencies(
    userId: string,
    analysisId: string,
    data: Omit<Dependency, 'analysisId'>[],
  ) {
    await this.analyses.getAnalysis(userId, analysisId);
    const files = await this.files.findByAnalysisId(analysisId);
    const fileIds = new Set(files.map((file) => file._id.toString()));
    for (const dependency of data) {
      if (
        !fileIds.has(dependency.sourceFileId.toString()) ||
        !fileIds.has(dependency.targetFileId.toString())
      ) {
        throw new AppError('Dependency references a file outside the analysis', 422);
      }
    }
    return this.dependencies.createMany(
      data.map((dependency) => ({
        ...dependency,
        analysisId: new Types.ObjectId(analysisId),
      })),
    );
  }

  /**
   * Retrieves dependencies originating from the specified file.
   * @param userId - The user identifier.
   * @param analysisId - The analysis identifier.
   * @param sourceFileId - The source file identifier.
   */
  public async getDependencies(userId: string, analysisId: string, sourceFileId: string) {
    await this.analyses.getAnalysis(userId, analysisId);
    await this.assertFile(analysisId, sourceFileId);
    return this.dependencies.findBySourceFileId(sourceFileId);
  }

  /**
   * Retrieves files that depend on the specified file.
   * @param userId - The user identifier.
   * @param analysisId - The analysis identifier.
   * @param targetFileId - The target file identifier.
   */
  public async getDependents(userId: string, analysisId: string, targetFileId: string) {
    await this.analyses.getAnalysis(userId, analysisId);
    await this.assertFile(analysisId, targetFileId);
    return this.dependencies.findByTargetFileId(targetFileId);
  }

  /**
   * Verifies that the file exists in the specified analysis.
   * @param analysisId - The analysis identifier.
   * @param fileId - The file identifier.
   */
  private async assertFile(analysisId: string, fileId: string): Promise<void> {
    const file = await this.files.findById(fileId);
    if (file === null || file.analysisId.toString() !== analysisId)
      throw new AppError('File not found', 404);
  }
}

export default DependencyService;
