import { Types } from 'mongoose';

import { AppError } from '../errors/index.js';
import { AnalysisRepository } from '../repositories/index.js';
import ProjectService from './project.service.js';
import type AnalysisQueue from '../queues/analysis.queue.js';
import { Logger } from '../logger/index.js';

/**
 * Coordinates analysis application logic.
 */
class AnalysisService {
  private readonly analyses = new AnalysisRepository();
  private readonly projects = new ProjectService();
  private readonly queue: AnalysisQueue;
  private readonly logger = new Logger();

  /**
   * Initializes the analysis service instance.
   * @param queue - The queue value used by this operation.
   */
  constructor(queue: AnalysisQueue) {
    this.queue = queue;
  }

  /**
   * Creates analysis data from the supplied input.
   * @param userId - The user identifier.
   * @param input - The input value to process.
   */
  public async createAnalysis(userId: string, input: { projectId: string; commitSha: string }) {
    const project = await this.projects.getProject(userId, input.projectId);
    const analysis = await this.analyses.create({
      projectId: project._id,
      commitSha: input.commitSha.toLowerCase(),
      status: 'queued',
      fileCount: 0,
      dependencyCount: 0,
    });
    try {
      await this.queue.enqueue({
        analysisId: analysis._id.toString(),
        projectId: project._id.toString(),
        commitSha: analysis.commitSha,
      });
      this.logger.info(`Analysis ${analysis._id.toString()} queued`);
    } catch (error) {
      await this.analyses.updateById(analysis._id.toString(), {
        status: 'failed',
        errorMessage: 'Unable to enqueue analysis',
      });
      throw error;
    }
    return analysis;
  }

  /**
   * Retrieves analysis data for the supplied criteria.
   * @param userId - The user identifier.
   * @param analysisId - The analysis identifier.
   */
  public async getAnalysis(userId: string, analysisId: string) {
    const analysis = await this.analyses.findById(analysisId);
    if (analysis === null) throw new AppError('Analysis not found', 404);
    await this.projects.getProject(userId, analysis.projectId.toString());
    return analysis;
  }

  /**
   * Retrieves the analysis history for the specified project.
   * @param userId - The user identifier.
   * @param projectId - The project identifier.
   */
  public async getProjectAnalyses(userId: string, projectId: string) {
    await this.projects.getProject(userId, projectId);
    return this.analyses.findByProjectId(projectId);
  }

  /**
   * Updates analysis data with the supplied changes.
   * @param analysisId - The analysis identifier.
   * @param status - The status value used by this operation.
   * @param values - The values value used by this operation.
   */
  public async updateStatus(
    analysisId: string,
    status: 'processing' | 'completed' | 'failed',
    values: { startedAt?: Date; completedAt?: Date; errorMessage?: string } = {},
  ) {
    const analysis = await this.analyses.findById(analysisId);
    if (analysis === null) throw new AppError('Analysis not found', 404);
    const allowed: Record<string, readonly string[]> = {
      queued: ['processing', 'failed'],
      processing: ['processing', 'completed', 'failed'],
      completed: [],
      failed: ['processing', 'failed'],
    };
    if (!(allowed[analysis.status] ?? []).includes(status))
      throw new AppError('Invalid analysis status transition', 409);
    const updated = await this.analyses.updateById(analysisId, { status, ...values });
    if (updated === null) throw new AppError('Analysis not found', 404);
    return updated;
  }

  /**
   * Updates analysis data with the supplied changes.
   * @param analysisId - The analysis identifier.
   * @param fileCount - The file count value used by this operation.
   * @param dependencyCount - The dependency count value used by this operation.
   */
  public async updateStats(analysisId: string, fileCount: number, dependencyCount: number) {
    const updated = await this.analyses.updateById(analysisId, { fileCount, dependencyCount });
    if (updated === null) throw new AppError('Analysis not found', 404);
    return updated;
  }

  /**
   * Checks whether analysis meets the requested condition.
   * @param id - The record identifier.
   */
  public static isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }
}

export default AnalysisService;
