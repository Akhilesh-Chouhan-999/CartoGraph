export type DependencyKind = 'import' | 'export' | 'dynamic-import' | 'require';

export interface SourceFileMetadata {
  path: string;
  extension: string;
  language: string;
  size: number;
  sha: string;
}

export interface DependencyCandidate {
  sourcePath: string;
  targetSpecifier: string;
  type: DependencyKind;
  line: number;
}

export interface ResolvedDependency extends DependencyCandidate {
  targetPath: string;
}

export interface AnalyzedSourceFile {
  metadata: SourceFileMetadata;
  content: string;
  lines: number;
  hash: string;
  role: FileRole;
}

export type FileRole =
  | 'entry'
  | 'controller'
  | 'service'
  | 'repository'
  | 'model'
  | 'utility'
  | 'middleware'
  | 'config'
  | 'test'
  | 'unknown';
