import type { RequestHandler } from 'express';

import { AppError } from '../errors/index.js';
import FileService from '../services/file.service.js';
import AnalysisService from '../services/analysis.service.js';
import AnalysisQueue from '../queues/analysis.queue.js';
import {
  analysisIdQuerySchema,
  fileIdParamsSchema,
  fileParamsSchema,
  idParamsSchema,
} from '../schemas/index.js';

class FileController {
  private readonly files: FileService;

  constructor(queue: AnalysisQueue) {
    this.files = new FileService(new AnalysisService(queue));
  }

  public list: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.files.getAnalysisFiles(userId, id) });
  };

  public get: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id, fileId } = fileParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.files.getFile(userId, id, fileId) });
  };

  public getById: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { fileId } = fileIdParamsSchema.parse(req.params);
    const { analysisId } = analysisIdQuerySchema.parse(req.query);
    res.json({ success: true, data: await this.files.getFile(userId, analysisId, fileId) });
  };
}

export default FileController;
