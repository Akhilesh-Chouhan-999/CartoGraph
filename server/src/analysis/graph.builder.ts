import type { ResolvedDependency, AnalyzedSourceFile } from './analysis.types.js';
import type { FileRole } from './analysis.types.js';

export interface BuiltGraphFile {
  path: string;
  language: string;
  role: FileRole;
  lines: number;
  hash: string;
  fanIn: number;
  fanOut: number;
}

export interface BuiltGraphEdge {
  sourcePath: string;
  targetPath: string;
  type: ResolvedDependency['type'];
  line: number;
}

class GraphBuilder {
  public build(
    files: AnalyzedSourceFile[],
    dependencies: ResolvedDependency[],
  ): { files: BuiltGraphFile[]; edges: BuiltGraphEdge[] } {
    const incoming = new Map<string, number>();
    const outgoing = new Map<string, number>();
    const edges = dependencies.map((dependency) => ({
      sourcePath: dependency.sourcePath,
      targetPath: dependency.targetPath,
      type: dependency.type,
      line: dependency.line,
    }));
    for (const edge of edges) {
      outgoing.set(edge.sourcePath, (outgoing.get(edge.sourcePath) ?? 0) + 1);
      incoming.set(edge.targetPath, (incoming.get(edge.targetPath) ?? 0) + 1);
    }
    const nodes = files
      .map((file) => ({
        path: file.metadata.path,
        language: file.metadata.language,
        role: file.role,
        lines: file.lines,
        hash: file.hash,
        fanIn: incoming.get(file.metadata.path) ?? 0,
        fanOut: outgoing.get(file.metadata.path) ?? 0,
      }))
      .sort((a, b) => a.path.localeCompare(b.path));
    return {
      files: nodes,
      edges: edges.sort(
        (a, b) =>
          a.sourcePath.localeCompare(b.sourcePath) ||
          a.targetPath.localeCompare(b.targetPath) ||
          a.line - b.line,
      ),
    };
  }
}

export default GraphBuilder;
