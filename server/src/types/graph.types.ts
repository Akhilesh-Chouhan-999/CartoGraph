export interface GraphNode {
  fileId: string;
  path: string;
  language: string;
  role: string;
  lines: number;
  fanIn: number;
  fanOut: number;
}

export interface GraphEdge {
  sourceFileId: string;
  targetFileId: string;
  type: 'import' | 'export' | 'dynamic-import' | 'require';
  line?: number;
}
