import {
  ArrowRight,
  Bot,
  FileCode2,
  GitBranch,
  GitCommitHorizontal,
  Network,
  ScanLine,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ErrorState, LoadingState } from '../../components/common/async-states.js';
import { StatusBadge } from '../../components/analysis/status-badge.js';
import { PageHeader } from '../../components/ui/page-header.js';
import { StatCard } from '../../components/ui/stat-card.js';
import { errorMessage } from '../../services/api/api-client.js';
import { analysisService } from '../../services/analyses/analysis.service.js';
import { projectService } from '../../services/projects/project.service.js';
import type { Analysis, Project, ProjectStats } from '../../types/domain.js';

/**
 * Renders the analysis page interface.
 */
export function AnalysisPage() {
  const { analysisId = '' } = useParams();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void (async () => {
      const current = await analysisService.get(analysisId);
      const [owner, summary] = await Promise.all([
        projectService.get(current.projectId),
        current.status === 'completed' ? analysisService.stats(analysisId) : Promise.resolve(null),
      ]);
      if (active) {
        setAnalysis(current);
        setProject(owner);
        setStats(summary);
      }
    })()
      .catch((caught: unknown) => {
        if (active) setError(errorMessage(caught));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [analysisId]);
  if (loading) return <LoadingState label="Loading analysis overview" />;
  if (error || !analysis) return <ErrorState message={error || 'Analysis not found.'} />;
  const duration =
    analysis.startedAt && analysis.completedAt
      ? formatDuration(
          new Date(analysis.completedAt).getTime() - new Date(analysis.startedAt).getTime(),
        )
      : '—';
  return (
    <div className="page-stack">
      <Link className="back-link" to={project ? `/projects/${project._id}` : '/analyses'}>
        {project?.repository ?? 'Analysis history'} <ArrowRight size={14} /> Analysis
      </Link>
      <PageHeader
        eyebrow="ANALYSIS OVERVIEW"
        title={project?.repository ?? 'Repository analysis'}
        description={`Commit ${analysis.commitSha.slice(0, 12)} · ${analysis.commitSha}`}
        actions={<StatusBadge status={analysis.status} />}
      />
      {analysis.errorMessage && (
        <div className="callout callout-error">{analysis.errorMessage}</div>
      )}
      <div className="analysis-summary">
        <div className="analysis-summary-item">
          <span>Repository</span>
          <strong>{project ? `${project.owner}/${project.repository}` : '—'}</strong>
        </div>
        <div className="analysis-summary-item">
          <span>Branch</span>
          <strong>
            <GitBranch size={14} /> {project?.defaultBranch ?? '—'}
          </strong>
        </div>
        <div className="analysis-summary-item">
          <span>Commit</span>
          <strong>
            <GitCommitHorizontal size={14} /> <code>{analysis.commitSha.slice(0, 12)}</code>
          </strong>
        </div>
        <div className="analysis-summary-item">
          <span>Duration</span>
          <strong>{duration}</strong>
        </div>
      </div>
      <div className="stat-grid stat-grid-three">
        <StatCard
          label="Files parsed"
          value={analysis.fileCount.toLocaleString()}
          icon={<FileCode2 size={19} />}
        />
        <StatCard
          label="Dependencies mapped"
          value={analysis.dependencyCount.toLocaleString()}
          icon={<GitBranch size={19} />}
          tone="cyan"
        />
        <StatCard
          label="Architecture roles"
          value={stats ? Object.keys(stats.roleDistribution).length : '—'}
          hint="Reported by the completed graph"
          icon={<Network size={19} />}
          tone="purple"
        />
      </div>
      <div className="panel-heading standalone-heading">
        <div>
          <span className="eyebrow">EXPLORE THIS COMMIT</span>
          <h2>Analysis tools</h2>
        </div>
      </div>
      {analysis.status === 'completed' ? (
        <div className="quick-actions">
          <Link to={`/analyses/${analysisId}/graph`}>
            <Network size={17} /> Dependency graph <ArrowRight size={15} />
          </Link>
          <Link to={`/analyses/${analysisId}/files`}>
            <FileCode2 size={17} /> Browse files <ArrowRight size={15} />
          </Link>
          <Link to={`/analyses/${analysisId}/chat`}>
            <Bot size={17} /> Ask AI <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="panel processing-callout">
          <span className="activity-icon">
            <ScanLine size={17} />
          </span>
          <div>
            <strong>Analysis {analysis.status}</strong>
            <p>The worker has not completed this repository scan yet.</p>
          </div>
          <Link
            className="button button-primary button-small"
            to={`/analyses/${analysisId}/progress`}
          >
            View progress <ArrowRight size={14} />
          </Link>
        </div>
      )}
      {stats && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">ARCHITECTURE BREAKDOWN</span>
              <h2>Files by role</h2>
            </div>
          </div>
          <div className="role-breakdown">
            {Object.entries(stats.roleDistribution).map(([role, count]) => (
              <div key={role}>
                <span>{role}</span>
                <strong>{count ?? 0}</strong>
                <i
                  style={{
                    width: `${stats.fileCount ? ((count ?? 0) / stats.fileCount) * 100 : 0}%`,
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Formats an analysis duration for display.
 * @param milliseconds - The milliseconds value used by this operation.
 */
function formatDuration(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return '—';
  if (milliseconds < 1000) return `${milliseconds} ms`;
  const seconds = milliseconds / 1000;
  return seconds < 60
    ? `${seconds.toFixed(1)} sec`
    : `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} sec`;
}
