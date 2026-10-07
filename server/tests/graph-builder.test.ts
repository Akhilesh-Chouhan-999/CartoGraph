import { describe, expect, it } from 'vitest';

import GraphBuilder from '../src/analysis/graph.builder.js';
import type { AnalyzedSourceFile, ResolvedDependency } from '../src/analysis/analysis.types.js';

describe('GraphBuilder', () => {
  it('builds stable nodes and computes fan-in/fan-out from resolved edges', () => {
    const files: AnalyzedSourceFile[] = ['a.ts', 'b.ts', 'c.ts'].map((path) => ({
      metadata: { path, extension: '.ts', language: 'typescript', size: 1, sha: path },
      content: '',
      lines: 1,
      hash: path,
      role: 'unknown',
    }));
    const edges: ResolvedDependency[] = [
      { sourcePath: 'a.ts', targetPath: 'b.ts', targetSpecifier: './b', type: 'import', line: 1 },
      { sourcePath: 'c.ts', targetPath: 'b.ts', targetSpecifier: './b', type: 'require', line: 4 },
    ];
    expect(new GraphBuilder().build(files, edges)).toEqual({
      files: [
        {
          path: 'a.ts',
          language: 'typescript',
          role: 'unknown',
          lines: 1,
          hash: 'a.ts',
          fanIn: 0,
          fanOut: 1,
        },
        {
          path: 'b.ts',
          language: 'typescript',
          role: 'unknown',
          lines: 1,
          hash: 'b.ts',
          fanIn: 2,
          fanOut: 0,
        },
        {
          path: 'c.ts',
          language: 'typescript',
          role: 'unknown',
          lines: 1,
          hash: 'c.ts',
          fanIn: 0,
          fanOut: 1,
        },
      ],
      edges: [
        { sourcePath: 'a.ts', targetPath: 'b.ts', type: 'import', line: 1 },
        { sourcePath: 'c.ts', targetPath: 'b.ts', type: 'require', line: 4 },
      ],
    });
  });
});
