import FileScanner from './file.scanner.js';
import AstParser from './ast.parser.js';
import DependencyResolver from './dependency.resolver.js';
import RoleClassifier from './role.classifier.js';
import GraphBuilder from './graph.builder.js';
import { GitHubService } from '../github/index.js';
import { GitHubConfig } from '../config/index.js';
import HashUtil from '../utils/hash.util.js';
import { AppError } from '../errors/index.js';
import type { AnalyzedSourceFile, DependencyCandidate } from './analysis.types.js';

class RepositoryAnalyzer {
  private readonly github = new GitHubService();
  private readonly scanner = new FileScanner();
  private readonly parser = new AstParser();
  private readonly resolver = new DependencyResolver();
  private readonly classifier = new RoleClassifier();
  private readonly graphBuilder = new GraphBuilder();
  private readonly hashes = new HashUtil();

  public async analyze(input: { githubUrl: string; commitSha: string }): Promise<{
    commitSha: string;
    files: AnalyzedSourceFile[];
    graph: ReturnType<GraphBuilder['build']>;
  }> {
    const repository = await this.github.getRepository(input.githubUrl);
    const commit = await this.github.getCommit(repository.owner, repository.name, input.commitSha);
    if (commit.sha.toLowerCase() !== input.commitSha.toLowerCase())
      throw new Error('GitHub returned a different commit than requested');
    const entries = await this.github.getTree(repository.owner, repository.name, commit.treeSha);
    const config = new GitHubConfig();
    const metadata = this.scanner.scan(entries, config.maxFiles, config.maxFileBytes);
    const entryByPath = new Map(entries.map((entry) => [entry.path, entry]));
    const totalBytes = metadata.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > config.maxTotalBytes) {
      throw new AppError('Repository exceeds the supported source size', 413);
    }
    const files: AnalyzedSourceFile[] = [];
    const candidates: DependencyCandidate[] = [];
    let actualTotalBytes = 0;
    for (let offset = 0; offset < metadata.length; offset += 6) {
      const batch = metadata.slice(offset, offset + 6);
      const results = await Promise.all(
        batch.map(async (file) => {
          const treeEntry = entryByPath.get(file.path);
          if (treeEntry === undefined) return undefined;
          const content = await this.github.getBlob(
            repository.owner,
            repository.name,
            treeEntry.sha,
          );
          const actualSize = Buffer.byteLength(content, 'utf8');
          if (actualSize > config.maxFileBytes || this.isBinary(content)) return undefined;
          return {
            file: {
              metadata: { ...file, size: actualSize },
              content,
              lines: content.length === 0 ? 0 : content.split(/\r?\n/).length,
              hash: this.hashes.sha256(content),
              role: this.classifier.classify(file.path),
            } satisfies AnalyzedSourceFile,
            candidates: this.parser.parse(file.path, content),
          };
        }),
      );
      for (const result of results) {
        if (result === undefined) continue;
        actualTotalBytes += result.file.metadata.size;
        if (actualTotalBytes > config.maxTotalBytes) {
          throw new AppError('Repository exceeds the supported source size', 413);
        }
        files.push(result.file);
        candidates.push(...result.candidates);
      }
    }
    const paths = new Set(files.map((file) => file.metadata.path));
    const resolved = this.resolver.resolve(candidates, paths);
    return { commitSha: commit.sha, files, graph: this.graphBuilder.build(files, resolved) };
  }

  private isBinary(content: string): boolean {
    for (let index = 0; index < content.length; index += 1) {
      const code = content.charCodeAt(index);
      if (code === 0xfffd || (code < 32 && code !== 9 && code !== 10 && code !== 13)) {
        return true;
      }
    }
    return false;
  }
}

export default RepositoryAnalyzer;
