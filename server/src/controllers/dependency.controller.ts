import type { RequestHandler } from 'express';

import { AppError } from '../errors/index.js';
import DependencyService from '../services/dependency.service.js';
import PathService from '../services/path.service.js';
import BlastRadiusService from '../services/blast-radius.service.js';
import AnalysisService from '../services/analysis.service.js';
import AnalysisQueue from '../queues/analysis.queue.js';
import {
  analysisIdQuerySchema,
  dependencyPathSchema,
  fileIdParamsSchema,
  fileParamsSchema,
  idParamsSchema,
} from '../schemas/index.js';

/**
 * Handles HTTP requests for dependency operations.
 */
class DependencyController {
  private readonly dependencies: DependencyService;
  private readonly paths: PathService;
  private readonly blastRadius: BlastRadiusService;

  /**
   * Initializes the dependency controller instance.
   * @param queue - The queue value used by this operation.
   */
  constructor(queue: AnalysisQueue) {
    const analyses = new AnalysisService(queue);
    this.dependencies = new DependencyService(analyses);
    this.paths = new PathService(analyses);
    this.blastRadius = new BlastRadiusService(analyses);
  }

  /**
   * Retrieves outgoing dependency edges for the selected analysis.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public outgoing: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id, fileId } = fileParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.dependencies.getDependencies(userId, id, fileId) });
  };

  /**
   * Retrieves dependencies originating from the specified file.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public outgoingByFile: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { fileId } = fileIdParamsSchema.parse(req.params);
    const { analysisId } = analysisIdQuerySchema.parse(req.query);
    res.json({
      success: true,
      data: await this.dependencies.getDependencies(userId, analysisId, fileId),
    });
  };

  /**
   * Retrieves dependencies that target the specified file.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public incomingByFile: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { fileId } = fileIdParamsSchema.parse(req.params);
    const { analysisId } = analysisIdQuerySchema.parse(req.query);
    res.json({
      success: true,
      data: await this.dependencies.getDependents(userId, analysisId, fileId),
    });
  };

  /**
   * Retrieves incoming dependency edges for the selected analysis.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public incoming: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id, fileId } = fileParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.dependencies.getDependents(userId, id, fileId) });
  };

  /**
   * Finds the shortest verified dependency path between two files.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public path: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    const body = dependencyPathSchema.parse(req.body);
    res.json({
      success: true,
      data: await this.paths.findDependencyPath(userId, id, body.sourceFileId, body.targetFileId),
    });
  };

  /**
   * Retrieves the files affected by changing the selected file.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public blastRadiusData: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id, fileId } = fileParamsSchema.parse(req.params);
    res.json({
      success: true,
      data: await this.blastRadius.calculateBlastRadius(userId, id, fileId),
    });
  };
}

export default DependencyController;
