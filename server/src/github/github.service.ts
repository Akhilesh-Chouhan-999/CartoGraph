import { AppError } from '../errors/index.js';
import GitHubUrlUtil from '../utils/github-url.util.js';
import GitHubClient from './github.client.js';
import type { GitHubCommit, GitHubRepository, GitHubTreeEntry } from './github.types.js';
import { z } from 'zod';

const repositoryResponseSchema = z.object({
  name: z.string(),
  default_branch: z.string(),
  owner: z.object({ login: z.string() }),
});
const commitResponseSchema = z.object({
  sha: z.string(),
  commit: z.object({ tree: z.object({ sha: z.string() }) }),
});
const treeEntrySchema = z.object({
  path: z.string(),
  mode: z.string(),
  type: z.enum(['blob', 'tree', 'commit']),
  sha: z.string(),
  size: z.number().int().nonnegative().optional(),
});
const treeResponseSchema = z.object({ truncated: z.boolean(), tree: z.array(treeEntrySchema) });
const blobResponseSchema = z.object({
  encoding: z.string(),
  content: z.string(),
  size: z.number().int().nonnegative(),
});

/**
 * Coordinates git hub application logic.
 */
class GitHubService {
  private readonly client: GitHubClient;
  private readonly urls: GitHubUrlUtil;

  /**
   * Initializes the git hub service instance.
   * @param client - The client value used by this operation.
   * @param urls - The urls value used by this operation.
   */
  constructor(client = new GitHubClient(), urls = new GitHubUrlUtil()) {
    this.client = client;
    this.urls = urls;
  }

  /**
   * Retrieves metadata for the requested GitHub repository.
   * @param githubUrl - The github url value used by this operation.
   */
  public async getRepository(githubUrl: string): Promise<GitHubRepository> {
    const address = this.urls.parse(githubUrl);
    const result = repositoryResponseSchema.parse(
      await this.client.request(
        `/repos/${encodeURIComponent(address.owner)}/${encodeURIComponent(address.repository)}`,
      ),
    );
    return { owner: result.owner.login, name: result.name, defaultBranch: result.default_branch };
  }

  /**
   * Retrieves metadata for the exact GitHub commit.
   * @param owner - The GitHub repository owner.
   * @param repository - The GitHub repository name.
   * @param ref - The ref value used by this operation.
   */
  public async getCommit(owner: string, repository: string, ref: string): Promise<GitHubCommit> {
    const result = commitResponseSchema.parse(
      await this.client.request(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits/${encodeURIComponent(ref)}`,
      ),
    );
    return { sha: result.sha, treeSha: result.commit.tree.sha };
  }

  /**
   * Retrieves the repository tree for the selected commit.
   * @param owner - The GitHub repository owner.
   * @param repository - The GitHub repository name.
   * @param treeSha - The tree sha value used by this operation.
   */
  public async getTree(
    owner: string,
    repository: string,
    treeSha: string,
  ): Promise<GitHubTreeEntry[]> {
    const result = treeResponseSchema.parse(
      await this.client.request(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/git/trees/${encodeURIComponent(treeSha)}?recursive=1`,
      ),
    );
    if (result.truncated) throw new AppError('Repository tree exceeds the supported size', 413);
    return result.tree.map((entry) => ({
      path: entry.path,
      mode: entry.mode,
      type: entry.type,
      sha: entry.sha,
      ...(entry.size === undefined ? {} : { size: entry.size }),
    }));
  }

  /**
   * Retrieves the contents of a GitHub blob.
   * @param owner - The GitHub repository owner.
   * @param repository - The GitHub repository name.
   * @param sha - The sha value used by this operation.
   */
  public async getBlob(owner: string, repository: string, sha: string): Promise<string> {
    const result = blobResponseSchema.parse(
      await this.client.request(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/git/blobs/${encodeURIComponent(sha)}`,
      ),
    );
    if (result.encoding !== 'base64') throw new AppError('Unsupported GitHub blob encoding', 502);
    return Buffer.from(result.content.replaceAll('\n', ''), 'base64').toString('utf8');
  }
}

export default GitHubService;
