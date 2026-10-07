import { AppError } from '../errors/index.js';
import { Types } from 'mongoose';
import { FileRepository } from '../repositories/index.js';
import AnalysisService from './analysis.service.js';
import GitHubService from '../github/github.service.js';
import ProjectService from './project.service.js';

class FileService {
  private readonly files = new FileRepository();
  private readonly analyses: AnalysisService;
  private readonly projects = new ProjectService();
  private readonly github = new GitHubService();

  constructor(analyses: AnalysisService) {
    this.analyses = analyses;
  }

  public async createFile(
    userId: string,
    analysisId: string,
    data: Omit<import('../models/file.model.js').FileDocument, 'analysisId'>,
  ) {
    await this.analyses.getAnalysis(userId, analysisId);
    return this.files.create({ ...data, analysisId: new Types.ObjectId(analysisId) });
  }

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

  public async getAnalysisFiles(userId: string, analysisId: string) {
    await this.analyses.getAnalysis(userId, analysisId);
    return this.files.findByAnalysisId(analysisId);
  }

  public async getFile(userId: string, analysisId: string, fileId: string) {
    await this.analyses.getAnalysis(userId, analysisId);
    const file = await this.files.findById(fileId);
    if (file === null || file.analysisId.toString() !== analysisId)
      throw new AppError('File not found', 404);
    return file;
  }

  public async getFileByPath(userId: string, analysisId: string, path: string) {
    await this.analyses.getAnalysis(userId, analysisId);
    const file = await this.files.findByPath(analysisId, path);
    if (file === null) throw new AppError('File not found', 404);
    return file;
  }

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
