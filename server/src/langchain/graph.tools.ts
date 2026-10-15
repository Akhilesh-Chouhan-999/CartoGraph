import { tool } from '@langchain/core/tools';
import { z } from 'zod';

import FileService from '../services/file.service.js';
import GraphService from '../services/graph.service.js';
import PathService from '../services/path.service.js';
import BlastRadiusService from '../services/blast-radius.service.js';
import DependencyService from '../services/dependency.service.js';

/**
 * Creates verified graph tools for the AI agent.
 */
export class GraphTools {
  private readonly files: FileService;
  private readonly dependencies: DependencyService;
  private readonly graph: GraphService;
  private readonly paths: PathService;
  private readonly blastRadius: BlastRadiusService;

  /**
   * Initializes the graph tools instance.
   * @param analysisService - The analysis service value used by this operation.
   */
  constructor(analysisService: import('../services/analysis.service.js').default) {
    this.files = new FileService(analysisService);
    this.dependencies = new DependencyService(analysisService);
    this.graph = new GraphService(analysisService);
    this.paths = new PathService(analysisService);
    this.blastRadius = new BlastRadiusService(analysisService);
  }

  /**
   * Creates a graph record from the validated input.
   * @param analysisId - The analysis identifier.
   * @param userId - The user identifier.
   * @param cite - The cite value used by this operation.
   */
  public create(analysisId: string, userId: string, cite: (path: string) => void) {
    return [
      tool(
        async ({ fileId }) => {
          const result = await this.files.getFileContext(userId, analysisId, fileId);
          cite(result.file.path);
          return JSON.stringify({ ...result.file.toObject(), content: result.content });
        },
        {
          name: 'get_file',
          description: 'Get verified metadata and source for a file in this analysis.',
          schema: z.object({ fileId: z.string().regex(/^[a-f\d]{24}$/i) }),
        },
      ),
      tool(
        async ({ fileId }) => {
          const [edges, files] = await Promise.all([
            this.dependencies.getDependencies(userId, analysisId, fileId),
            this.files.getAnalysisFiles(userId, analysisId),
          ]);
          const byId = new Map(files.map((file) => [file._id.toString(), file.path]));
          const result = edges.map((edge) => ({
            source: byId.get(edge.sourceFileId.toString()),
            target: byId.get(edge.targetFileId.toString()),
            type: edge.type,
            line: edge.line,
          }));
          for (const edge of result) {
            if (edge.source) cite(edge.source);
            if (edge.target) cite(edge.target);
          }
          return JSON.stringify(result);
        },
        {
          name: 'get_dependencies',
          description: 'Get verified outgoing dependency edges for a file.',
          schema: z.object({ fileId: z.string().regex(/^[a-f\d]{24}$/i) }),
        },
      ),
      tool(
        async ({ fileId }) => {
          const [edges, files] = await Promise.all([
            this.dependencies.getDependents(userId, analysisId, fileId),
            this.files.getAnalysisFiles(userId, analysisId),
          ]);
          const byId = new Map(files.map((file) => [file._id.toString(), file.path]));
          const result = edges.map((edge) => ({
            source: byId.get(edge.sourceFileId.toString()),
            target: byId.get(edge.targetFileId.toString()),
            type: edge.type,
            line: edge.line,
          }));
          for (const edge of result) {
            if (edge.source) cite(edge.source);
            if (edge.target) cite(edge.target);
          }
          return JSON.stringify(result);
        },
        {
          name: 'get_dependents',
          description: 'Get verified incoming dependency edges for a file.',
          schema: z.object({ fileId: z.string().regex(/^[a-f\d]{24}$/i) }),
        },
      ),
      tool(
        async ({ sourceFileId, targetFileId }) => {
          const result = await this.paths.findDependencyPath(
            userId,
            analysisId,
            sourceFileId,
            targetFileId,
          );
          for (const file of result.path) cite(file.path);
          return JSON.stringify(result);
        },
        {
          name: 'find_dependency_path',
          description: 'Find the shortest verified dependency path between files.',
          schema: z.object({
            sourceFileId: z.string().regex(/^[a-f\d]{24}$/i),
            targetFileId: z.string().regex(/^[a-f\d]{24}$/i),
          }),
        },
      ),
      tool(
        async ({ fileId }) => {
          const result = await this.blastRadius.calculateBlastRadius(userId, analysisId, fileId);
          for (const file of [...result.directDependents, ...result.transitiveDependents])
            cite(file.path);
          return JSON.stringify(result);
        },
        {
          name: 'calculate_blast_radius',
          description:
            'Calculate verified direct and transitive dependents affected by changing a file.',
          schema: z.object({ fileId: z.string().regex(/^[a-f\d]{24}$/i) }),
        },
      ),
      tool(
        async ({ query }) => {
          const { nodes } = await this.graph.getGraph(userId, analysisId);
          const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
          const result = nodes
            .filter((node) =>
              terms.some((term) =>
                `${node.path} ${node.language} ${node.role}`.toLowerCase().includes(term),
              ),
            )
            .slice(0, 30);
          for (const file of result) cite(file.path);
          return JSON.stringify(result);
        },
        {
          name: 'search_files',
          description: 'Search verified file paths, languages, and roles.',
          schema: z.object({ query: z.string().min(1).max(200) }),
        },
      ),
      tool(async () => JSON.stringify(await this.graph.getProjectStats(userId, analysisId)), {
        name: 'get_project_stats',
        description: 'Return verified graph counts and file metric distributions.',
        schema: z.object({}),
      }),
    ];
  }
}
