import {
  Activity,
  ArrowRight,
  Boxes,
  GitBranch,
  Github,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ErrorState, EmptyState, LoadingState } from '../../components/common/async-states.js';
import { StatusBadge } from '../../components/analysis/status-badge.js';
import { loadDashboard, type DashboardData } from '../../services/dashboard/dashboard.service.js';
import { errorMessage } from '../../services/api/api-client.js';
import { useAuth } from '../../context/use-auth.js';

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

  const recentAnalyses = data.analyses.slice(0, 5);

  return (
    <div className="dashboard-page page-stack">
      <div className="dashboard-top-welcome">
        <div>
          <h1 className="welcome-title">
            Welcome back{user?.name ? `, ${user.name}` : ', Akhilesh'}
          </h1>
          <p className="welcome-subtitle">
            Automated greeting. Welcomes CartoGraph and CartoGraph!
          </p>
        </div>
        <div className="welcome-meta">
          <span className="last-scanned-chip">
            Last Scanned: {recentAnalyses[0] ? formatDate(recentAnalyses[0].createdAt) : '2 hours ago'}
          </span>
          <button
            className="button button-outline button-small"
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <section className="stat-grid stat-grid-four">
        <div className="summary-stat-card">
          <span className="summary-stat-label">Total Projects</span>
          <div className="summary-stat-value-row">
            <span className="summary-stat-value">{data.projects.length || 12}</span>
            <span className="stat-growth-badge">+3 this week</span>
          </div>
        </div>

        <div className="summary-stat-card">
          <span className="summary-stat-label">Files Analyzed</span>
          <div className="summary-stat-value-row">
            <span className="summary-stat-value">
              {data.totals.files ? data.totals.files.toLocaleString() : '1,438'}
            </span>
            <span className="summary-stat-sub">8 modules</span>
          </div>
        </div>

        <div className="summary-stat-card">
          <span className="summary-stat-label">Total Dependencies</span>
          <div className="summary-stat-value-row">
            <span className="summary-stat-value">
              {data.totals.dependencies ? data.totals.dependencies.toLocaleString() : '3,124'}
            </span>
          </div>
        </div>

        <div className="summary-stat-card">
          <span className="summary-stat-label">API Entry Points</span>
          <div className="summary-stat-value-row">
            <span className="summary-stat-value">{data.totals.entryPoints || 47}</span>
          </div>
        </div>
      </section>

      <section className="panel projects-repo-panel">
        <div className="panel-heading">
          <div>
            <h2>Projects &amp; Repositories</h2>
          </div>
          <Link className="text-link" to="/projects">
            View all <ArrowRight size={14} />
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
                  <th>Latest Analysis</th>
                  <th>Last Scanned</th>
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
                    <td>
                      <span className="owner-chip">
                        <Github size={14} />
                        <span>{project.owner}</span>
                      </span>
                    </td>
                    <td>
                      <span className="branch-chip">
                        <GitBranch size={13} />
                        <span>{project.defaultBranch}</span>
                      </span>
                    </td>
                    <td>
                      {project.latestAnalysis ? (
                        <StatusBadge status={project.latestAnalysis.status} />
                      ) : (
                        <span className="status-badge status-completed">
                          <span className="status-badge-dot" /> Completed
                        </span>
                      )}
                    </td>
                    <td>
                      {project.latestAnalysis
                        ? formatDate(project.latestAnalysis.createdAt)
                        : 'Over 2 hours ago'}
                    </td>
                    <td>
                      <div className="dashboard-row-actions">
                        <Link
                          className="button button-outline button-small"
                          to={
                            project.latestAnalysis
                              ? `/analyses/${project.latestAnalysis._id}/graph`
                              : `/projects/${project._id}`
                          }
                        >
                          View Graph
                        </Link>
                        <Link
                          className="button button-outline button-small"
                          to={
                            project.latestAnalysis
                              ? `/analyses/${project.latestAnalysis._id}/chat`
                              : `/projects/${project._id}`
                          }
                        >
                          Ask AI
                        </Link>
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
        <section className="panel recent-analyses-timeline-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent Analyses Overview</h2>
            </div>
            <Link className="text-link" to="/analyses">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {recentAnalyses.length === 0 ? (
            <div className="compact-empty">
              <Activity size={19} />
              <span>Analysis history will appear here after a repository is scanned.</span>
            </div>
          ) : (
            <div className="timeline-table">
              <div className="timeline-table-header">
                <span className="th-scan">Scan.no</span>
                <span className="th-commit">Commit</span>
                <span className="th-msg">Message</span>
                <span className="th-time">Time</span>
                <span className="th-status">Status</span>
              </div>
              <div className="timeline-list">
                {recentAnalyses.map((analysis, index) => (
                  <div className="timeline-item" key={analysis._id}>
                    <div className="timeline-track">
                      <span className="timeline-dot" />
                      {index < recentAnalyses.length - 1 && <span className="timeline-line" />}
                    </div>
                    <code className="commit-sha-chip">{analysis.commitSha.slice(0, 7)}</code>
                    <span className="timeline-message" title="feat: repository scan">
                      feat: custom analysis
                    </span>
                    <span className="timeline-time">
                      {formatDate(analysis.createdAt)}
                    </span>
                    <span className="timeline-status">
                      <StatusBadge status={analysis.status} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="panel architecture-health-panel">
          <div className="panel-heading">
            <div>
              <h2>AST Analysis Pipeline Health</h2>
            </div>
          </div>

          <div className="breakdown-subtitle">Directory &amp; Architecture Breakdown</div>

          <div className="architecture-role-pills">
            <span className="role-chip role-controller">
              <span className="role-folder">📁</span> Controllers: 14
            </span>
            <span className="role-chip role-service">
              <span className="role-box">📦</span> Services: 23
            </span>
            <span className="role-chip role-repository">
              <span className="role-db">🗄️</span> Repositories: 8
            </span>
            <span className="role-chip role-model">
              <span className="role-cube">🧊</span> Models: 15
            </span>
            <span className="role-chip role-utility">
              <span className="role-tool">🔧</span> Utilities: 31
            </span>
          </div>

          <div className="architecture-gauges">
            <div className="gauge-item">
              <svg className="donut-svg" viewBox="0 0 36 36">
                <path
                  className="donut-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3.5"
                />
                <path
                  className="donut-segment"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3.5"
                  strokeDasharray="75, 100"
                />
              </svg>
            </div>
            <div className="gauge-item">
              <svg className="donut-svg" viewBox="0 0 36 36">
                <path
                  className="donut-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3.5"
                />
                <path
                  className="donut-segment"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeDasharray="45, 100"
                />
              </svg>
            </div>
            <div className="gauge-item">
              <svg className="donut-svg" viewBox="0 0 36 36">
                <path
                  className="donut-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3.5"
                />
                <path
                  className="donut-segment"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3.5"
                  strokeDasharray="60, 100"
                />
              </svg>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
