import { AppError } from '../errors/index.js';
import { Types } from 'mongoose';
import { FileRepository } from '../repositories/index.js';
import AnalysisService from './analysis.service.js';
import GitHubService from '../github/github.service.js';
import ProjectService from './project.service.js';

/**
 * Coordinates file application logic.
 */
class FileService {
  private readonly files = new FileRepository();
  private readonly analyses: AnalysisService;
  private readonly projects = new ProjectService();
  private readonly github = new GitHubService();

  /**
   * Initializes the file service instance.
   * @param analyses - The analyses value used by this operation.
   */
  constructor(analyses: AnalysisService) {
    this.analyses = analyses;
  }

  /**
   * Creates file data from the supplied input.
   * @param userId - The user identifier.
   * @param analysisId - The analysis identifier.
   * @param data - The data to persist or process.
   */
  public async createFile(
    userId: string,
    analysisId: string,
    data: Omit<import('../models/file.model.js').FileDocument, 'analysisId'>,
  ) {
    await this.analyses.getAnalysis(userId, analysisId);
    return this.files.create({ ...data, analysisId: new Types.ObjectId(analysisId) });
  }

  /**
   * Creates file data from the supplied input.
   * @param userId - The user identifier.
   * @param analysisId - The analysis identifier.
   * @param data - The data to persist or process.
   */
  public async createFiles(
    userId: string,
    analysisId: string,
    data: Omit<import('../models/file.model.js').FileDocument, 'analysisId'>[],
  ) {
    await this.analyses.getAnalysis(userId, analysisId);
    return this.files.createMany(
      data.map((file) => ({ ...file, analysisId: new Types.ObjectId(analysisId) })),
    );
  }

  /**
   * Retrieves file data for the supplied criteria.
   * @param userId - The user identifier.
   * @param analysisId - The analysis identifier.
   */
  public async getAnalysisFiles(userId: string, analysisId: string) {
    await this.analyses.getAnalysis(userId, analysisId);
    return this.files.findByAnalysisId(analysisId);
  }

  /**
   * Retrieves a file by its identifier within the selected analysis.
   * @param userId - The user identifier.
   * @param analysisId - The analysis identifier.
   * @param fileId - The file identifier.
   */
  public async getFile(userId: string, analysisId: string, fileId: string) {
    await this.analyses.getAnalysis(userId, analysisId);
    const file = await this.files.findById(fileId);
    if (file === null || file.analysisId.toString() !== analysisId)
      throw new AppError('File not found', 404);
    return file;
  }

  /**
   * Retrieves file data for the supplied criteria.
   * @param userId - The user identifier.
   * @param analysisId - The analysis identifier.
   * @param path - The file or route path.
   */
  public async getFileByPath(userId: string, analysisId: string, path: string) {
    await this.analyses.getAnalysis(userId, analysisId);
    const file = await this.files.findByPath(analysisId, path);
    if (file === null) throw new AppError('File not found', 404);
    return file;
  }

  /**
   * Retrieves verified file metadata and dependency context for explanations.
   * @param userId - The user identifier.
   * @param analysisId - The analysis identifier.
   * @param fileId - The file identifier.
   */
  public async getFileContext(
    userId: string,
    analysisId: string,
    fileId: string,
  ): Promise<{ file: Awaited<ReturnType<FileService['getFile']>>; content: string }> {
    const [analysis, file] = await Promise.all([
      this.analyses.getAnalysis(userId, analysisId),
      this.getFile(userId, analysisId, fileId),
    ]);
    const project = await this.projects.getProject(userId, analysis.projectId.toString());
    const commit = await this.github.getCommit(
      project.owner,
      project.repository,
      analysis.commitSha,
    );
    const tree = await this.github.getTree(project.owner, project.repository, commit.treeSha);
    const entry = tree.find((item) => item.path === file.path && item.type === 'blob');
    if (entry === undefined)
      throw new AppError('File content is unavailable at the analyzed commit', 404);
    const content = await this.github.getBlob(project.owner, project.repository, entry.sha);
    return { file, content: content.slice(0, 20_000) };
  }
}

export default FileService;
