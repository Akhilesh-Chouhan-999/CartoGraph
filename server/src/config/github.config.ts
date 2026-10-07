import EnvConfig from './env.config.js';

class GitHubConfig {
  public readonly apiBaseUrl = 'https://api.github.com';
  public readonly token: string | undefined;
  public readonly maxFiles = 5000;
  public readonly maxFileBytes = 1_000_000;
  public readonly maxTotalBytes = 25_000_000;

  constructor(env = new EnvConfig()) {
    this.token = env.githubToken;
  }
}

export default GitHubConfig;
