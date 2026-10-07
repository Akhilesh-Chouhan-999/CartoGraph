import type { RequestHandler } from 'express';

import AnalysisService from '../services/analysis.service.js';
import AnalysisQueue from '../queues/analysis.queue.js';
import { AppError } from '../errors/index.js';
import { createAnalysisSchema, idParamsSchema } from '../schemas/index.js';
import GraphService from '../services/graph.service.js';

class AnalysisController {
  private readonly analyses: AnalysisService;
  private readonly graph: GraphService;

  constructor(queue: AnalysisQueue) {
    this.analyses = new AnalysisService(queue);
    this.graph = new GraphService(this.analyses);
  }

  public create: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const analysis = await this.analyses.createAnalysis(
      userId,
      createAnalysisSchema.parse(req.body),
    );
    res.status(202).json({ success: true, data: { analysisId: analysis._id.toString() } });
  };

  public listForProject: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.analyses.getProjectAnalyses(userId, id) });
  };

  public get: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.analyses.getAnalysis(userId, id) });
  };

  public status: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    const analysis = await this.analyses.getAnalysis(userId, id);
    res.json({
      success: true,
      data: {
        status: analysis.status,
        fileCount: analysis.fileCount,
        dependencyCount: analysis.dependencyCount,
        ...(analysis.startedAt === undefined ? {} : { startedAt: analysis.startedAt }),
        ...(analysis.completedAt === undefined ? {} : { completedAt: analysis.completedAt }),
        ...(analysis.errorMessage ? { errorMessage: analysis.errorMessage } : {}),
      },
    });
  };

  public stats: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.graph.getProjectStats(userId, id) });
  };

  public graphData: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.graph.getGraph(userId, id) });
  };
}

export default AnalysisController;
