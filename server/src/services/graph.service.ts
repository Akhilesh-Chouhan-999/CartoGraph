import { AppError } from '../errors/index.js';
import { DependencyRepository, FileRepository } from '../repositories/index.js';
import AnalysisService from './analysis.service.js';

/**
 * Coordinates graph application logic.
 */
class GraphService {
  private readonly files = new FileRepository();
  private readonly dependencies = new DependencyRepository();
  private readonly analyses: AnalysisService;

  /**
   * Initializes the graph service instance.
   * @param analyses - The analyses value used by this operation.
   */
  constructor(analyses: AnalysisService) {
    this.analyses = analyses;
  }

  /**
   * Counts the incoming dependency edges for each file.
   * @param userId - The user identifier.
   * @param analysisId - The analysis identifier.
   * @param fileId - The file identifier.
   */
  public async calculateFanIn(userId: string, analysisId: string, fileId: string): Promise<number> {
    const { nodes, edges } = await this.getGraph(userId, analysisId);
    if (!nodes.some((file) => file.id === fileId)) {
      throw new AppError('File not found', 404);
    }
    return edges.filter((edge) => edge.target === fileId).length;
  }

  /**
   * Counts the outgoing dependency edges for each file.
   * @param userId - The user identifier.
   * @param analysisId - The analysis identifier.
   * @param fileId - The file identifier.
   */
  public async calculateFanOut(
    userId: string,
    analysisId: string,
    fileId: string,
  ): Promise<number> {
    const { nodes, edges } = await this.getGraph(userId, analysisId);
    if (!nodes.some((file) => file.id === fileId)) {
      throw new AppError('File not found', 404);
    }
    return edges.filter((edge) => edge.source === fileId).length;
  }

  /**
   * Retrieves graph nodes and dependency edges for the analysis.
   * @param userId - The user identifier.
   * @param analysisId - The analysis identifier.
   */
  public async getGraph(userId: string, analysisId: string) {
    await this.analyses.getAnalysis(userId, analysisId);
    const [files, dependencies] = await Promise.all([
      this.files.findByAnalysisId(analysisId),
      this.dependencies.findByAnalysisId(analysisId),
    ]);
    return {
      nodes: files.map((file) => ({
        id: file._id.toString(),
        path: file.path,
        language: file.language,
        role: file.role,
        lines: file.lines,
        fanIn: file.fanIn,
        fanOut: file.fanOut,
      })),
      edges: dependencies.map((dependency) => ({
        id: dependency._id.toString(),
        source: dependency.sourceFileId.toString(),
        target: dependency.targetFileId.toString(),
        type: dependency.type,
        ...(dependency.line === undefined ? {} : { line: dependency.line }),
      })),
    };
  }

  /**
   * Calculates file, dependency, language, role, and graph metric summaries.
   * @param userId - The user identifier.
   * @param analysisId - The analysis identifier.
   */
  public async getProjectStats(userId: string, analysisId: string) {
    const { nodes, edges } = await this.getGraph(userId, analysisId);
    const languages = new Map<string, number>();
    const roles = new Map<string, number>();
    for (const node of nodes) {
      languages.set(node.language, (languages.get(node.language) ?? 0) + 1);
      roles.set(node.role, (roles.get(node.role) ?? 0) + 1);
    }
    const byFanIn = [...nodes].sort((a, b) => b.fanIn - a.fanIn || a.path.localeCompare(b.path));
    const byFanOut = [...nodes].sort((a, b) => b.fanOut - a.fanOut || a.path.localeCompare(b.path));
    return {
      fileCount: nodes.length,
      dependencyCount: edges.length,
      languageDistribution: Object.fromEntries(languages),
      roleDistribution: Object.fromEntries(roles),
      averageFanIn:
        nodes.length === 0 ? 0 : nodes.reduce((sum, node) => sum + node.fanIn, 0) / nodes.length,
      averageFanOut:
        nodes.length === 0 ? 0 : nodes.reduce((sum, node) => sum + node.fanOut, 0) / nodes.length,
      highestFanIn: byFanIn.slice(0, 10),
      highestFanOut: byFanOut.slice(0, 10),
    };
  }
}

export default GraphService;
