import { Worker, type Job } from 'bullmq';
import type { Redis } from 'ioredis';

import { RepositoryAnalyzer } from '../analysis/index.js';
import type { AnalysisJobData } from '../queues/index.js';
import { ANALYSIS_QUEUE_NAME } from '../queues/index.js';
import { Logger } from '../logger/index.js';
import {
  AnalysisRepository,
  DependencyRepository,
  FileRepository,
  ProjectRepository,
} from '../repositories/index.js';

class AnalysisWorker {
  private readonly worker: Worker<AnalysisJobData>;
  private readonly analyzer = new RepositoryAnalyzer();
  private readonly projects = new ProjectRepository();
  private readonly analyses = new AnalysisRepository();
  private readonly files = new FileRepository();
  private readonly dependencies = new DependencyRepository();
  private readonly logger = new Logger();

  constructor(connection: Redis) {
    this.worker = new Worker<AnalysisJobData>(ANALYSIS_QUEUE_NAME, (job) => this.process(job), {
      connection: connection.duplicate({ maxRetriesPerRequest: null }),
      concurrency: 2,
    });
    this.worker.on('completed', (job) =>
      this.logger.info(`Analysis ${job.data.analysisId} completed`),
    );
    this.worker.on('ready', () => this.logger.info('Analysis worker ready'));
    this.worker.on('error', (error) => this.logger.error('Analysis worker error', error));
    this.worker.on('failed', (job, error) =>
      this.logger.error(`Analysis ${job?.data.analysisId ?? 'unknown'} failed`, error),
    );
  }

  public async close(): Promise<void> {
    await this.worker.close();
  }

  private async process(job: Job<AnalysisJobData>): Promise<void> {
    const { analysisId, projectId, commitSha } = job.data;
    this.logger.info(`Analysis ${analysisId} started`);
    try {
      const analysis = await this.analyses.findById(analysisId);
      if (analysis === null || analysis.projectId.toString() !== projectId) {
        throw new Error('Analysis job is invalid');
      }
      const processing = await this.analyses.updateById(analysisId, {
        status: 'processing',
        startedAt: new Date(),
        errorMessage: null,
      });
      if (processing === null) throw new Error('Analysis no longer exists');
      const project = await this.projects.findById(projectId);
      if (project === null) throw new Error('Project no longer exists');
      const result = await this.analyzer.analyze({ githubUrl: project.githubUrl, commitSha });

      await this.dependencies.deleteByAnalysisId(analysisId);
      await this.files.deleteByAnalysisId(analysisId);
      const insertedFiles = await this.files.createMany(
        result.graph.files.map((file) => ({
          analysisId: analysis._id,
          path: file.path,
          language: file.language,
          role: file.role,
          lines: file.lines,
          fanIn: file.fanIn,
          fanOut: file.fanOut,
          hash: file.hash,
        })),
      );
      const fileIds = new Map(insertedFiles.map((file) => [file.path, file._id]));
      const dependencyRows = result.graph.edges.flatMap((edge) => {
        const sourceFileId = fileIds.get(edge.sourcePath);
        const targetFileId = fileIds.get(edge.targetPath);
        if (sourceFileId === undefined || targetFileId === undefined) return [];
        return [
          {
            analysisId: analysis._id,
            sourceFileId,
            targetFileId,
            type: edge.type,
            ...(edge.line > 0 ? { line: edge.line } : {}),
          },
        ];
      });
      if (dependencyRows.length > 0) await this.dependencies.createMany(dependencyRows);
      const completed = await this.analyses.updateById(analysisId, {
        status: 'completed',
        commitSha: result.commitSha,
        fileCount: insertedFiles.length,
        dependencyCount: dependencyRows.length,
        completedAt: new Date(),
      });
      if (completed === null) throw new Error('Analysis no longer exists');
    } catch (error) {
      const message =
        error instanceof Error && error.name === 'AppError'
          ? error.message.slice(0, 500)
          : 'Repository analysis failed';
      await this.analyses.updateById(analysisId, {
        status: 'failed',
        errorMessage: message,
        completedAt: new Date(),
      });
      throw error;
    }
  }
}

export default AnalysisWorker;
