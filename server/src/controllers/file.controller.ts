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

/**
 * Handles HTTP requests for file operations.
 */
class FileController {
  private readonly files: FileService;

  /**
   * Initializes the file controller instance.
   * @param queue - The queue value used by this operation.
   */
  constructor(queue: AnalysisQueue) {
    this.files = new FileService(new AnalysisService(queue));
  }

  /**
   * Lists file records available to the current user.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public list: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.files.getAnalysisFiles(userId, id) });
  };

  /**
   * Retrieves the selected file record.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public get: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id, fileId } = fileParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.files.getFile(userId, id, fileId) });
  };

  /**
   * Retrieves file data for the supplied criteria.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public getById: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { fileId } = fileIdParamsSchema.parse(req.params);
    const { analysisId } = analysisIdQuerySchema.parse(req.query);
    res.json({ success: true, data: await this.files.getFile(userId, analysisId, fileId) });
  };
}

export default FileController;
