import {
  Activity,
  ArrowRight,
  Boxes,
  GitBranch,
  Network,
  RefreshCw,
  ScanLine,
  Waypoints,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ErrorState, EmptyState, LoadingState } from '../../components/common/async-states.js';
import { StatusBadge } from '../../components/analysis/status-badge.js';
import { PageHeader } from '../../components/ui/page-header.js';
import { StatCard } from '../../components/ui/stat-card.js';
import { loadDashboard, type DashboardData } from '../../services/dashboard/dashboard.service.js';
import { errorMessage } from '../../services/api/api-client.js';
import { useAuth } from '../../context/use-auth.js';
import { roleStyles } from '../../utils/graph-layout.js';
import type { FileRole } from '../../types/domain.js';

/**
 * Formats a date value for display in the dashboard.
 * @param value - The value value used by this operation.
 */
function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

/**
 * Renders the dashboard page interface.
 */
export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void loadDashboard()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((caught: unknown) => {
        if (active) setError(errorMessage(caught));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  if (loading) return <LoadingState label="Loading your repositories and analyses" />;
  if (error)
    return (
      <ErrorState
        message={error}
        retry={() => {
          setError('');
          setRefreshKey((key) => key + 1);
        }}
      />
    );
  if (!data) return <ErrorState message="Dashboard data is unavailable." />;

  const completedCount = data.analyses.filter((analysis) => analysis.status === 'completed').length;
  const recentAnalyses = data.analyses.slice(0, 5);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="WORKSPACE OVERVIEW"
        title={`Welcome back${user?.name ? `, ${user.name}` : ''}`}
        description="A clear view of your repositories and their latest verified architecture."
        actions={
          <button
            className="button button-outline button-small"
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />
      <section className="stat-grid stat-grid-four">
        <StatCard
          label="Total projects"
          value={data.projects.length}
          hint="Connected repositories"
          icon={<Boxes size={19} />}
        />
        <StatCard
          label="Files analyzed"
          value={data.totals.files.toLocaleString()}
          hint="Latest completed scans"
          icon={<FilesIcon />}
          tone="cyan"
        />
        <StatCard
          label="Dependencies mapped"
          value={data.totals.dependencies.toLocaleString()}
          hint="Verified internal edges"
          icon={<GitBranch size={19} />}
          tone="purple"
        />
        <StatCard
          label="Entry points"
          value={data.totals.entryPoints.toLocaleString()}
          hint="Across latest completed scans"
          icon={<Waypoints size={19} />}
          tone="green"
        />
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">YOUR CODEBASES</span>
            <h2>Projects & repositories</h2>
          </div>
          <Link className="text-link" to="/projects">
            All projects <ArrowRight size={15} />
          </Link>
        </div>
        {data.projects.length === 0 ? (
          <EmptyState
            title="No repositories connected"
            description="Add a public GitHub repository to begin mapping its dependencies."
            action={{ label: 'Add a project', to: '/projects' }}
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Repository</th>
                  <th>Owner</th>
                  <th>Branch</th>
                  <th>Latest analysis</th>
                  <th>Last scanned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.projects.slice(0, 6).map((project) => (
                  <tr key={project._id}>
                    <td>
                      <Link className="repo-cell" to={`/projects/${project._id}`}>
                        <span className="repo-avatar">
                          <Boxes size={16} />
                        </span>
                        <strong>{project.repository}</strong>
                      </Link>
                    </td>
                    <td>{project.owner}</td>
                    <td>
                      <span className="branch-chip">
                        <GitBranch size={13} />
                        {project.defaultBranch}
                      </span>
                    </td>
                    <td>
                      {project.latestAnalysis ? (
                        <StatusBadge status={project.latestAnalysis.status} />
                      ) : (
                        <span className="text-muted">Not analyzed</span>
                      )}
                    </td>
                    <td>
                      {project.latestAnalysis ? formatDate(project.latestAnalysis.createdAt) : '—'}
                    </td>
                    <td>
                      <div className="dashboard-row-actions">
                        <Link
                          className="button button-outline button-small"
                          to={`/projects/${project._id}`}
                        >
                          Open project
                        </Link>
                        {project.latestAnalysis?.status === 'completed' && (
                          <>
                            <Link
                              className="button button-ghost button-small"
                              to={`/analyses/${project.latestAnalysis._id}/graph`}
                            >
                              Graph
                            </Link>
                            <Link
                              className="button button-ghost button-small"
                              to={`/analyses/${project.latestAnalysis._id}/chat`}
                            >
                              Ask AI
                            </Link>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className="dashboard-lower-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">ACTIVITY</span>
              <h2>Recent analyses</h2>
            </div>
            <Link className="text-link" to="/analyses">
              View history <ArrowRight size={15} />
            </Link>
          </div>
          {recentAnalyses.length === 0 ? (
            <div className="compact-empty">
              <Activity size={19} />
              <span>Analysis history will appear here after a repository is scanned.</span>
            </div>
          ) : (
            <div className="analysis-activity-list">
              {recentAnalyses.map((analysis) => {
                const project = data.projects.find((item) => item._id === analysis.projectId);
                return (
                  <Link
                    to={`/analyses/${analysis._id}`}
                    className="activity-row"
                    key={analysis._id}
                  >
                    <span className="activity-icon">
                      <ScanLine size={16} />
                    </span>
                    <span className="activity-copy">
                      <strong>{project?.repository ?? 'Repository analysis'}</strong>
                      <small>
                        <code>{analysis.commitSha.slice(0, 8)}</code> ·{' '}
                        {formatDate(analysis.createdAt)}
                      </small>
                    </span>
                    <StatusBadge status={analysis.status} />
                  </Link>
                );
              })}
            </div>
          )}
        </section>
        <section className="panel architecture-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">STATIC ANALYSIS</span>
              <h2>Analysis pipeline</h2>
            </div>
            <span className="text-muted">{completedCount} completed</span>
          </div>
          <div className="pipeline-compact">
            <div>
              <span className="pipeline-step">
                <ScanLine size={16} />
              </span>
              <span>
                <b>AST analysis</b>
                <small>Parse source files</small>
              </span>
            </div>
            <i />
            <div>
              <span className="pipeline-step">
                <GitBranch size={16} />
              </span>
              <span>
                <b>Dependency map</b>
                <small>Resolve module graph</small>
              </span>
            </div>
            <i />
            <div>
              <span className="pipeline-step">
                <Network size={16} />
              </span>
              <span>
                <b>Architecture</b>
                <small>Build verified graph</small>
              </span>
            </div>
          </div>
          <p className="muted-note">
            The API exposes each scan’s overall status, but does not provide live worker health or
            per-stage progress.
          </p>
          <div className="architecture-breakdown-compact">
            <div className="architecture-breakdown-heading">
              <strong>Directory &amp; architecture breakdown</strong>
              <Link className="text-link" to="/projects">
                Browse <ArrowRight size={13} />
              </Link>
            </div>
            <div className="architecture-role-list">
              {(['entry', 'controller', 'service', 'repository', 'model', 'unknown'] as FileRole[])
                .filter((role) => (data.roleDistribution[role] ?? 0) > 0)
                .map((role) => (
                  <span className="architecture-role" key={role}>
                    <i style={{ background: roleStyles[role].color }} />
                    {roleStyles[role].label}
                    <strong>{data.roleDistribution[role]}</strong>
                  </span>
                ))}
              {Object.values(data.roleDistribution).every((count) => !count) && (
                <span className="text-muted">Role counts appear after a completed analysis.</span>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Renders the files icon interface.
 */
function FilesIcon() {
  return <Boxes size={19} />;
}
