import EnvConfig from './env.config.js';

/**
 * Loads and exposes github configuration.
 */
class GitHubConfig {
  public readonly apiBaseUrl = 'https://api.github.com';
  public readonly token: string | undefined;
  public readonly maxFiles = 5000;
  public readonly maxFileBytes = 1_000_000;
  public readonly maxTotalBytes = 25_000_000;

  /**
   * Initializes the github config instance.
   * @param env - The env value used by this operation.
   */
  constructor(env = new EnvConfig()) {
    this.token = env.githubToken;
  }
}

export default GitHubConfig;
