import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';

export const ANALYSIS_QUEUE_NAME = 'repository-analysis';

export interface AnalysisJobData {
  analysisId: string;
  projectId: string;
  commitSha: string;
}

/**
 * Schedules and manages asynchronous repository analysis jobs.
 */
class AnalysisQueue {
  private readonly queue: Queue<AnalysisJobData>;

  /**
   * Initializes the analysis queue instance.
   * @param connection - The connection value used by this operation.
   */
  constructor(connection: Redis) {
    this.queue = new Queue<AnalysisJobData>(ANALYSIS_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2_000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
  }

  /**
   * Adds the supplied analysis queue job to the processing queue.
   * @param data - The data to persist or process.
   */
  public async enqueue(data: AnalysisJobData): Promise<void> {
    await this.queue.add('analyze-repository', data, { jobId: data.analysisId });
  }

  /**
   * Releases analysis queue resources and completes shutdown.
   */
  public async close(): Promise<void> {
    await this.queue.close();
  }
}

export default AnalysisQueue;
