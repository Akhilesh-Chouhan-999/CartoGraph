import { AppError } from '../errors/index.js';
import { GitHubConfig } from '../config/index.js';

/**
 * Provides an authenticated HTTP client for the external API.
 */
class GitHubClient {
  private readonly config: GitHubConfig;

  /**
   * Initializes the git hub client instance.
   * @param config - The config value used by this operation.
   */
  constructor(config = new GitHubConfig()) {
    this.config = config;
  }

  /**
   * Sends an authenticated request to the GitHub REST API.
   * @param pathname - The pathname value used by this operation.
   */
  public async request(pathname: string): Promise<unknown> {
    const response = await fetch(`${this.config.apiBaseUrl}${pathname}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(this.config.token ? { Authorization: `Bearer ${this.config.token}` } : {}),
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      if (response.status === 404) throw new AppError('GitHub repository or ref not found', 404);
      if (response.status === 403 || response.status === 429) {
        throw new AppError('GitHub API rate limit exceeded', 429);
      }
      throw new AppError(`GitHub API request failed (${response.status})`, 502, false);
    }
    return response.json();
  }
}

export default GitHubClient;
