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

class DependencyController {
  private readonly dependencies: DependencyService;
  private readonly paths: PathService;
  private readonly blastRadius: BlastRadiusService;

  constructor(queue: AnalysisQueue) {
    const analyses = new AnalysisService(queue);
    this.dependencies = new DependencyService(analyses);
    this.paths = new PathService(analyses);
    this.blastRadius = new BlastRadiusService(analyses);
  }

  public outgoing: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id, fileId } = fileParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.dependencies.getDependencies(userId, id, fileId) });
  };

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

  public incoming: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id, fileId } = fileParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.dependencies.getDependents(userId, id, fileId) });
  };

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
