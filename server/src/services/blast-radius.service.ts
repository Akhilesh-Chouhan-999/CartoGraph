import { AppError } from '../errors/index.js';
import GraphAlgorithms from '../analysis/graph.algorithms.js';
import { DependencyRepository, FileRepository } from '../repositories/index.js';
import AnalysisService from './analysis.service.js';

class BlastRadiusService {
  private readonly files = new FileRepository();
  private readonly dependencies = new DependencyRepository();
  private readonly algorithms = new GraphAlgorithms();
  private readonly analyses: AnalysisService;

  constructor(analyses: AnalysisService) {
    this.analyses = analyses;
  }

  public async calculateBlastRadius(userId: string, analysisId: string, fileId: string) {
    await this.analyses.getAnalysis(userId, analysisId);
    const [files, dependencies] = await Promise.all([
      this.files.findByAnalysisId(analysisId),
      this.dependencies.findByAnalysisId(analysisId),
    ]);
    const fileById = new Map(files.map((file) => [file._id.toString(), file]));
    if (!fileById.has(fileId)) throw new AppError('File not found', 404);
    const result = this.algorithms.dependents(
      dependencies.map((edge) => ({
        source: edge.sourceFileId.toString(),
        target: edge.targetFileId.toString(),
      })),
      fileId,
    );
    const map = (ids: string[]) =>
      ids.flatMap((id) => {
        const file = fileById.get(id);
        return file === undefined ? [] : [{ fileId: id, path: file.path }];
      });
    return {
      directDependents: map(result.direct),
      transitiveDependents: map(result.transitive),
      affectedCount: result.direct.length + result.transitive.length,
    };
  }
}

export default BlastRadiusService;
