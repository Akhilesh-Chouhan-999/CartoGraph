import { AppError } from '../errors/index.js';

export interface GitHubRepositoryAddress {
  owner: string;
  repository: string;
}

/**
 * Provides reusable git hub url utilities.
 */
export class GitHubUrlUtil {
  /**
   * Parses source code and extracts dependency candidates with source locations.
   * @param input - The input value to process.
   */
  public parse(input: string): GitHubRepositoryAddress {
    let url: URL;
    try {
      url = new URL(input);
    } catch {
      throw new AppError('Invalid GitHub repository URL', 422);
    }
    const parts = url.pathname.split('/').filter(Boolean);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'github.com' ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      parts.length !== 2 ||
      !/^[A-Za-z0-9-]{1,39}$/.test(parts[0] ?? '') ||
      !/^[A-Za-z0-9_.-]{1,100}$/.test((parts[1] ?? '').replace(/\.git$/i, ''))
    ) {
      throw new AppError('Invalid GitHub repository URL', 422);
    }
    return { owner: parts[0] ?? '', repository: (parts[1] ?? '').replace(/\.git$/i, '') };
  }
}

export default GitHubUrlUtil;
