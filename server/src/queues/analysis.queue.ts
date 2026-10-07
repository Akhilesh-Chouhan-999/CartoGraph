import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';

export const ANALYSIS_QUEUE_NAME = 'repository-analysis';

export interface AnalysisJobData {
  analysisId: string;
  projectId: string;
  commitSha: string;
}

class AnalysisQueue {
  private readonly queue: Queue<AnalysisJobData>;

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

  public async enqueue(data: AnalysisJobData): Promise<void> {
    await this.queue.add('analyze-repository', data, { jobId: data.analysisId });
  }

  public async close(): Promise<void> {
    await this.queue.close();
  }
}

export default AnalysisQueue;
