import { analysisService } from '../analyses/analysis.service.js';
import { projectService } from '../projects/project.service.js';
import type { Analysis, FileRole, Project, ProjectStats } from '../../types/domain.js';

export interface DashboardProject extends Project {
  latestAnalysis: Analysis | null;
  stats: ProjectStats | null;
}

export interface DashboardData {
  projects: DashboardProject[];
  analyses: Analysis[];
  totals: { files: number; dependencies: number; entryPoints: number };
  roleDistribution: Partial<Record<FileRole, number>>;
}

export async function loadDashboard(): Promise<DashboardData> {
  const projects = await projectService.list();
  const entries = await Promise.all(
    projects.map(async (project) => {
      const analyses = await projectService.analyses(project._id);
      const ordered = [...analyses].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const latestAnalysis = ordered[0] ?? null;
      const completeAnalysis = ordered.find((analysis) => analysis.status === 'completed');
      const stats = completeAnalysis
        ? await analysisService.stats(completeAnalysis._id).catch(() => null)
        : null;
      return { project, analyses: ordered, latestAnalysis, stats };
    }),
  );
  const allAnalyses = entries
    .flatMap((entry) => entry.analyses)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const roleDistribution: Partial<Record<FileRole, number>> = {};
  for (const { stats } of entries) {
    if (!stats) continue;
    for (const [role, count] of Object.entries(stats.roleDistribution)) {
      const fileRole = role as FileRole;
      roleDistribution[fileRole] = (roleDistribution[fileRole] ?? 0) + count;
    }
  }
  return {
    projects: entries.map(({ project, latestAnalysis, stats }) => ({
      ...project,
      latestAnalysis,
      stats,
    })),
    analyses: allAnalyses,
    totals: {
      files: entries.reduce((sum, entry) => sum + (entry.stats?.fileCount ?? 0), 0),
      dependencies: entries.reduce((sum, entry) => sum + (entry.stats?.dependencyCount ?? 0), 0),
      entryPoints: entries.reduce(
        (sum, entry) => sum + (entry.stats?.roleDistribution.entry ?? 0),
        0,
      ),
    },
    roleDistribution,
  };
}
