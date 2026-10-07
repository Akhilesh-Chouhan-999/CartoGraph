export interface GitHubRepository {
  owner: string;
  name: string;
  defaultBranch: string;
}

export interface GitHubTreeEntry {
  path: string;
  mode: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
  size?: number;
}

export interface GitHubCommit {
  sha: string;
  treeSha: string;
}
