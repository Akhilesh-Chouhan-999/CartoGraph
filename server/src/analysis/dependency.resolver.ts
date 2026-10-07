import path from 'node:path';

import type { DependencyCandidate, ResolvedDependency } from './analysis.types.js';

const extensions = [
  '',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '/index.ts',
  '/index.tsx',
  '/index.js',
  '/index.jsx',
];

class DependencyResolver {
  public resolve(
    candidates: DependencyCandidate[],
    availablePaths: ReadonlySet<string>,
  ): ResolvedDependency[] {
    const resolved: ResolvedDependency[] = [];
    for (const candidate of candidates) {
      if (!candidate.targetSpecifier.startsWith('.')) continue;
      const base = path.posix.normalize(
        path.posix.join(path.posix.dirname(candidate.sourcePath), candidate.targetSpecifier),
      );
      const extension = path.posix.extname(base).toLowerCase();
      const sourceEquivalent = ['.js', '.jsx', '.mjs', '.cjs'].includes(extension)
        ? base.slice(0, -extension.length)
        : base;
      const candidates = [
        ...new Set([base, ...extensions.map((suffix) => `${sourceEquivalent}${suffix}`)]),
      ];
      const targetPath = candidates.find((value) => availablePaths.has(value));
      if (targetPath !== undefined) resolved.push({ ...candidate, targetPath });
    }
    const unique = new Map<string, ResolvedDependency>();
    for (const edge of resolved.sort(
      (a, b) =>
        a.sourcePath.localeCompare(b.sourcePath) ||
        a.targetPath.localeCompare(b.targetPath) ||
        a.line - b.line,
    )) {
      const key = `${edge.sourcePath}\0${edge.targetPath}`;
      if (!unique.has(key)) unique.set(key, edge);
    }
    return [...unique.values()];
  }
}

export default DependencyResolver;
