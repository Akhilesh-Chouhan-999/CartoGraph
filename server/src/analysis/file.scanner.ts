import path from 'node:path';

import type { GitHubTreeEntry } from '../github/index.js';
import type { SourceFileMetadata } from './analysis.types.js';
import { AppError } from '../errors/index.js';

const extensions: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
};
const ignored = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.cache',
  'vendor',
]);

class FileScanner {
  public scan(
    entries: GitHubTreeEntry[],
    maxFiles: number,
    maxFileBytes: number,
  ): SourceFileMetadata[] {
    const files = entries
      .filter((entry) => entry.type === 'blob')
      .map((entry) => ({ entry, extension: path.posix.extname(entry.path).toLowerCase() }))
      .filter(
        ({ entry, extension }) =>
          extensions[extension] !== undefined &&
          !entry.path.split('/').some((part) => ignored.has(part)) &&
          (entry.size ?? 0) <= maxFileBytes,
      )
      .sort((a, b) => a.entry.path.localeCompare(b.entry.path));
    if (files.length > maxFiles)
      throw new AppError(`Repository exceeds the ${maxFiles} source file limit`, 413);
    return files.map(({ entry, extension }) => ({
      path: entry.path,
      extension,
      language: extensions[extension] ?? 'unknown',
      size: entry.size ?? 0,
      sha: entry.sha,
    }));
  }
}

export default FileScanner;
