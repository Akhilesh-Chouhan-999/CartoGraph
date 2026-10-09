import { ArrowRight, Bot, FileCode2, GitCommitHorizontal, Search, Waypoints } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState, ErrorState, LoadingState } from '../../components/common/async-states.js';
import { StatusBadge } from '../../components/analysis/status-badge.js';
import { PageHeader } from '../../components/ui/page-header.js';
import { errorMessage } from '../../services/api/api-client.js';
import { loadDashboard, type DashboardData } from '../../services/dashboard/dashboard.service.js';
import type { Analysis } from '../../types/domain.js';

/**
 * Renders the analyses page interface.
 */
export function AnalysesPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let active = true;
    void loadDashboard()
      .then((value) => {
        if (active) setData(value);
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
  }, []);

  const analyses =
    data?.analyses.filter((analysis) => {
      const project = data.projects.find((item) => item._id === analysis.projectId);
      return `${analysis.commitSha} ${project?.repository ?? ''} ${analysis.status}`
        .toLowerCase()
        .includes(filter.toLowerCase());
    }) ?? [];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="REPOSITORY HISTORY"
        title="Analyses"
        description="Every scan is tied to an exact commit and a deterministic dependency graph."
      />
      <div className="filter-bar">
        <label className="search-field">
          <Search size={17} />
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter by repository, commit, or status"
          />
        </label>
        <span className="filter-count">{data?.analyses.length ?? 0} analyses</span>
      </div>
      {loading ? (
        <LoadingState label="Loading analysis history" />
      ) : error ? (
        <ErrorState message={error} />
      ) : analyses.length === 0 ? (
        <EmptyState
          title={data?.analyses.length ? 'No analyses match' : 'No analyses yet'}
          description={
            data?.analyses.length
              ? 'Try a different search.'
              : 'Start an analysis from a project using a full commit SHA.'
          }
          {...(data?.projects.length
            ? { action: { label: 'Browse projects', to: '/projects' } }
            : {})}
        />
      ) : (
        <section className="panel">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Repository</th>
                  <th>Commit</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Files</th>
                  <th>Dependencies</th>
                  <th>Explore</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {analyses.map((analysis) => {
                  const project = data?.projects.find((item) => item._id === analysis.projectId);
                  const ready = analysis.status === 'completed';
                  return (
                    <tr key={analysis._id}>
                      <td>
                        <span className="repo-cell">
                          <span className="repo-avatar">
                            <GitCommitHorizontal size={15} />
                          </span>
                          <strong>{project?.repository ?? 'Unknown repository'}</strong>
                        </span>
                      </td>
                      <td>
                        <code className="sha-code">{analysis.commitSha.slice(0, 12)}</code>
                      </td>
                      <td>
                        <StatusBadge status={analysis.status} />
                      </td>
                      <td>
                        {new Intl.DateTimeFormat(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(analysis.createdAt))}
                      </td>
                      <td>{analysis.fileCount.toLocaleString()}</td>
                      <td>{analysis.dependencyCount.toLocaleString()}</td>
                      <td>
                        <div className="explore-actions">
                          <ExploreAction
                            analysis={analysis}
                            ready={ready}
                            path="graph"
                            label="Open dependency graph"
                            icon={<Waypoints size={15} />}
                          />
                          <ExploreAction
                            analysis={analysis}
                            ready={ready}
                            path="files"
                            label="Browse analyzed files"
                            icon={<FileCode2 size={15} />}
                          />
                          <ExploreAction
                            analysis={analysis}
                            ready={ready}
                            path="chat"
                            label="Ask about this repository"
                            icon={<Bot size={15} />}
                          />
                        </div>
                      </td>
                      <td>
                        <Link
                          className="button button-ghost button-small"
                          to={
                            analysis.status === 'queued' || analysis.status === 'processing'
                              ? `/analyses/${analysis._id}/progress`
                              : `/analyses/${analysis._id}`
                          }
                        >
                          Open <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Renders the explore action interface.
 * @param props - The component properties.
 */
function ExploreAction({
  analysis,
  ready,
  path,
  label,
  icon,
}: {
  analysis: Analysis;
  ready: boolean;
  path: 'graph' | 'files' | 'chat';
  label: string;
  icon: ReactNode;
}) {
  const className = `explore-action${ready ? '' : ' is-disabled'}`;
  return ready ? (
    <Link
      className={className}
      aria-label={label}
      title={label}
      to={`/analyses/${analysis._id}/${path}`}
    >
      {icon}
    </Link>
  ) : (
    <span
      className={className}
      aria-label={`${label} unavailable until analysis completes`}
      title="Available when this analysis is complete"
      aria-disabled="true"
    >
      {icon}
    </span>
  );
}
