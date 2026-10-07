import { Types } from 'mongoose';

import { AppError } from '../errors/index.js';
import { AnalysisRepository } from '../repositories/index.js';
import ProjectService from './project.service.js';
import type AnalysisQueue from '../queues/analysis.queue.js';
import { Logger } from '../logger/index.js';

class AnalysisService {
  private readonly analyses = new AnalysisRepository();
  private readonly projects = new ProjectService();
  private readonly queue: AnalysisQueue;
  private readonly logger = new Logger();

  constructor(queue: AnalysisQueue) {
    this.queue = queue;
  }

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

  public async getAnalysis(userId: string, analysisId: string) {
    const analysis = await this.analyses.findById(analysisId);
    if (analysis === null) throw new AppError('Analysis not found', 404);
    await this.projects.getProject(userId, analysis.projectId.toString());
    return analysis;
  }

  public async getProjectAnalyses(userId: string, projectId: string) {
    await this.projects.getProject(userId, projectId);
    return this.analyses.findByProjectId(projectId);
  }

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

  public async updateStats(analysisId: string, fileCount: number, dependencyCount: number) {
    const updated = await this.analyses.updateById(analysisId, { fileCount, dependencyCount });
    if (updated === null) throw new AppError('Analysis not found', 404);
    return updated;
  }

  public static isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }
}

export default AnalysisService;
