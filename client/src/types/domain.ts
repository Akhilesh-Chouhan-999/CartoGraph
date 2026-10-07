export interface SafeUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResult {
  user: SafeUser;
  token: string;
}

export type AnalysisStatus = 'queued' | 'processing' | 'completed' | 'failed';
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
export type DependencyType = 'import' | 'export' | 'dynamic-import' | 'require';

export interface Project {
  _id: string;
  userId: string;
  name: string;
  githubUrl: string;
  owner: string;
  repository: string;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
}

export interface Analysis {
  _id: string;
  projectId: string;
  commitSha: string;
  status: AnalysisStatus;
  fileCount: number;
  dependencyCount: number;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisStatusInfo {
  status: AnalysisStatus;
  fileCount: number;
  dependencyCount: number;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface FileRecord {
  _id: string;
  analysisId: string;
  path: string;
  language: string;
  role: FileRole;
  lines: number;
  fanIn: number;
  fanOut: number;
  hash: string;
  createdAt: string;
  updatedAt: string;
}

export interface DependencyRecord {
  _id: string;
  analysisId: string;
  sourceFileId: string;
  targetFileId: string;
  type: DependencyType;
  line?: number;
}

export interface GraphNode {
  id: string;
  path: string;
  language: string;
  role: FileRole;
  lines: number;
  fanIn: number;
  fanOut: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: DependencyType;
  line?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ProjectStats {
  fileCount: number;
  dependencyCount: number;
  languageDistribution: Record<string, number>;
  roleDistribution: Partial<Record<FileRole, number>>;
  averageFanIn: number;
  averageFanOut: number;
  highestFanIn: GraphNode[];
  highestFanOut: GraphNode[];
}

export interface DependencyPath {
  found: boolean;
  path: { fileId: string; path: string }[];
}

export interface BlastRadius {
  directDependents: { fileId: string; path: string }[];
  transitiveDependents: { fileId: string; path: string }[];
  affectedCount: number;
}

export interface ChatCitation {
  path: string;
  line?: number;
}

export interface ChatAnswer {
  answer: string;
  citations: ChatCitation[];
  sessionId: string;
}

export interface ChatSession {
  _id: string;
  projectId: string;
  analysisId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  citations: ChatCitation[];
  createdAt: string;
}

export interface ApiEnvelope<T> {
  success: true;
  data: T;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
}
