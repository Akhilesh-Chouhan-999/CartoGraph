import type { RequestHandler } from 'express';

import AnalysisService from '../services/analysis.service.js';
import AnalysisQueue from '../queues/analysis.queue.js';
import { AppError } from '../errors/index.js';
import { createAnalysisSchema, idParamsSchema } from '../schemas/index.js';
import GraphService from '../services/graph.service.js';

/**
 * Handles HTTP requests for analysis operations.
 */
class AnalysisController {
  private readonly analyses: AnalysisService;
  private readonly graph: GraphService;

  /**
   * Initializes the analysis controller instance.
   * @param queue - The queue value used by this operation.
   */
  constructor(queue: AnalysisQueue) {
    this.analyses = new AnalysisService(queue);
    this.graph = new GraphService(this.analyses);
  }

  /**
   * Creates a analysis record from the validated input.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public create: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const analysis = await this.analyses.createAnalysis(
      userId,
      createAnalysisSchema.parse(req.body),
    );
    res.status(202).json({ success: true, data: { analysisId: analysis._id.toString() } });
  };

  /**
   * Lists analyses belonging to the specified project.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public listForProject: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.analyses.getProjectAnalyses(userId, id) });
  };

  /**
   * Retrieves the selected analysis record.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public get: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.analyses.getAnalysis(userId, id) });
  };

  /**
   * Retrieves the current status of the analysis.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
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

  /**
   * Retrieves file and dependency counts for the analysis.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public stats: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.graph.getProjectStats(userId, id) });
  };

  /**
   * Retrieves the verified nodes and dependency edges for an analysis.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public graphData: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.graph.getGraph(userId, id) });
  };
}

export default AnalysisController;
