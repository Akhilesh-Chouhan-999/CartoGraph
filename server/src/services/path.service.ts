import { FileRepository, DependencyRepository } from '../repositories/index.js';
import GraphAlgorithms from '../analysis/graph.algorithms.js';
import AnalysisService from './analysis.service.js';
import { AppError } from '../errors/index.js';

class PathService {
  private readonly files = new FileRepository();
  private readonly dependencies = new DependencyRepository();
  private readonly algorithms = new GraphAlgorithms();
  private readonly analyses: AnalysisService;

  constructor(analyses: AnalysisService) {
    this.analyses = analyses;
  }

  public async findDependencyPath(
    userId: string,
    analysisId: string,
    sourceFileId: string,
    targetFileId: string,
  ) {
    await this.analyses.getAnalysis(userId, analysisId);
    const [files, dependencies] = await Promise.all([
      this.files.findByAnalysisId(analysisId),
      this.dependencies.findByAnalysisId(analysisId),
    ]);
    const fileById = new Map(files.map((file) => [file._id.toString(), file]));
    if (!fileById.has(sourceFileId) || !fileById.has(targetFileId))
      throw new AppError('Path endpoint file not found', 404);
    const path = this.algorithms.shortestPath(
      dependencies.map((edge) => ({
        source: edge.sourceFileId.toString(),
        target: edge.targetFileId.toString(),
      })),
      sourceFileId,
      targetFileId,
    );
    return {
      found: path !== null,
      path: (path ?? []).flatMap((id) => {
        const file = fileById.get(id);
        return file === undefined ? [] : [{ fileId: id, path: file.path }];
      }),
    };
  }
}

export default PathService;
