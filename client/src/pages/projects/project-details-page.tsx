import {
  ArrowLeft,
  ArrowRight,
  Bot,
  ExternalLink,
  FileCode2,
  GitBranch,
  GitCommitHorizontal,
  Network,
  Pencil,
  ScanLine,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ErrorState, LoadingState } from '../../components/common/async-states.js';
import { StatusBadge } from '../../components/analysis/status-badge.js';
import { PageHeader } from '../../components/ui/page-header.js';
import { StatCard } from '../../components/ui/stat-card.js';
import { errorMessage } from '../../services/api/api-client.js';
import { analysisService } from '../../services/analyses/analysis.service.js';
import { PROJECTS_CHANGED_EVENT, projectService } from '../../services/projects/project.service.js';
import type { Analysis, Project, ProjectStats } from '../../types/domain.js';
import { ScanDialog } from '../../components/layout/scan-dialog.js';
import { fileService } from '../../services/files/file.service.js';
import type { ProjectInput } from '../../services/projects/project.service.js';

/**
 * Renders the project details page interface.
 */
export function ProjectDetailsPage() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [lineCount, setLineCount] = useState<number | null>(null);
  const [routeFileCount, setRouteFileCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanOpen, setScanOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void Promise.all([projectService.get(projectId), projectService.analyses(projectId)])
      .then(async ([current, history]) => {
        const ordered = [...history].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const completed = ordered.find((analysis) => analysis.status === 'completed');
        const [summary, files] = completed
          ? await Promise.all([
              analysisService.stats(completed._id).catch(() => null),
              fileService.list(completed._id).catch(() => null),
            ])
          : [null, null];
        if (!active) return;
        setProject(current);
        setAnalyses(ordered);
        setStats(summary);
        setLineCount(files?.reduce((total, file) => total + file.lines, 0) ?? null);
        setRouteFileCount(
          files?.filter(
            (file) => file.path.split('/').includes('routes') || /\.routes?\./i.test(file.path),
          ).length ?? null,
        );
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
  }, [projectId]);

  if (loading) return <LoadingState label="Loading project details" />;
  if (error || !project)
    return (
      <ErrorState message={error || 'Project not found.'} retry={() => navigate('/projects')} />
    );
  const projectRecord = project;
  const latest = analyses[0];

  /**
   * Removes the requested this module data.
   */
  async function deleteProject() {
    if (
      !window.confirm(
        `Delete ${projectRecord.owner}/${projectRecord.repository} and its saved project record?`,
      )
    )
      return;
    setDeleting(true);
    setActionError('');
    try {
      await projectService.remove(projectRecord._id);
      window.dispatchEvent(new Event(PROJECTS_CHANGED_EVENT));
      navigate('/projects', { replace: true });
    } catch (caught) {
      setActionError(errorMessage(caught));
      setDeleting(false);
    }
  }

  return (
    <div className="page-stack">
      <Link className="back-link" to="/projects">
        <ArrowLeft size={16} /> All projects
      </Link>
      <PageHeader
        eyebrow={`${project.owner}/${project.repository}`}
        title={project.name}
        description={project.githubUrl}
        actions={
          <>
            <a
              className="button button-outline button-small"
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={15} /> GitHub
            </a>
            <button
              className="button button-outline button-small"
              onClick={() => setEditOpen(true)}
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              className="button button-outline button-small danger-button"
              onClick={() => void deleteProject()}
              disabled={deleting}
            >
              <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete'}
            </button>
            <button
              className="button button-primary button-small"
              onClick={() => setScanOpen(true)}
            >
              <ScanLine size={15} /> Analyze now
            </button>
          </>
        }
      />
      {actionError && (
        <div className="callout callout-error" role="alert">
          {actionError}
        </div>
      )}
      <div className="project-overview-card">
        <div className="project-overview-id">
          <span className="project-avatar project-avatar-large">
            <GitBranch size={22} />
          </span>
          <div>
            <strong>
              {project.owner}/{project.repository}
            </strong>
            <span>
              <GitBranch size={13} /> {project.defaultBranch}
            </span>
          </div>
        </div>
        <div className="project-overview-latest">
          <span>Latest analysis</span>
          {latest ? (
            <StatusBadge status={latest.status} />
          ) : (
            <span className="text-muted">Not analyzed yet</span>
          )}
        </div>
        <div className="project-overview-latest">
          <span>Last scanned</span>
          <strong>
            {latest
              ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
                  new Date(latest.createdAt),
                )
              : '—'}
          </strong>
        </div>
      </div>
      <div className="stat-grid stat-grid-four">
        <StatCard label="Files" value={stats?.fileCount ?? '—'} icon={<FileCode2 size={19} />} />
        <StatCard
          label="Lines of code"
          value={lineCount?.toLocaleString() ?? '—'}
          hint="Latest completed scan"
          icon={<FileCode2 size={19} />}
          tone="cyan"
        />
        <StatCard
          label="Dependencies"
          value={stats?.dependencyCount ?? '—'}
          icon={<GitBranch size={19} />}
          tone="purple"
        />
        <StatCard
          label="Entry points"
          value={stats?.roleDistribution.entry ?? '—'}
          icon={<Network size={19} />}
          tone="green"
        />
      </div>
      <div className="project-metadata-strip">
        <span>
          <strong>Route files</strong>
          {routeFileCount === null ? '—' : routeFileCount}
        </span>
        <span>
          <strong>Analyses</strong>
          {analyses.length}
        </span>
        <span>
          <strong>Last analyzed commit</strong>
          <code>{latest?.commitSha.slice(0, 12) ?? '—'}</code>
        </span>
      </div>
      <div className="dashboard-lower-grid project-detail-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">ARCHITECTURE</span>
              <h2>Latest completed scan</h2>
            </div>
            {latest?.status === 'completed' && (
              <Link className="text-link" to={`/analyses/${latest._id}/graph`}>
                Open graph <ArrowRight size={15} />
              </Link>
            )}
          </div>
          {stats ? (
            <div className="role-breakdown">
              {(
                [
                  'entry',
                  'controller',
                  'service',
                  'repository',
                  'model',
                  'utility',
                  'middleware',
                  'config',
                  'test',
                  'unknown',
                ] as const
              ).map((role) => (
                <div key={role}>
                  <span>{role}</span>
                  <strong>{stats.roleDistribution[role] ?? 0}</strong>
                  <i
                    style={{
                      width: `${stats.fileCount ? ((stats.roleDistribution[role] ?? 0) / stats.fileCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-note">Complete an analysis to see the architecture breakdown.</p>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">HISTORY</span>
              <h2>Recent analyses</h2>
            </div>
            <Link className="text-link" to="/analyses">
              All analyses <ArrowRight size={15} />
            </Link>
          </div>
          {analyses.length === 0 ? (
            <div className="compact-empty">
              <ScanLine size={18} />
              <span>No analysis has been run for this repository.</span>
            </div>
          ) : (
            <div className="analysis-activity-list">
              {analyses.slice(0, 5).map((analysis) => (
                <Link key={analysis._id} className="activity-row" to={`/analyses/${analysis._id}`}>
                  <span className="activity-icon">
                    <GitCommitHorizontal size={16} />
                  </span>
                  <span className="activity-copy">
                    <strong>
                      <code>{analysis.commitSha.slice(0, 10)}</code>
                    </strong>
                    <small>
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(analysis.createdAt))}
                    </small>
                  </span>
                  <StatusBadge status={analysis.status} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
      <section className="quick-actions">
        <Link to={latest?.status === 'completed' ? `/analyses/${latest._id}/graph` : '/analyses'}>
          <Network size={17} /> View graph <ArrowRight size={15} />
        </Link>
        <Link to={latest ? `/analyses/${latest._id}/chat` : '/analyses'}>
          <Bot size={17} /> Ask AI <ArrowRight size={15} />
        </Link>
      </section>
      {scanOpen && (
        <ScanDialog
          projects={[project]}
          initialProjectId={project._id}
          onClose={() => setScanOpen(false)}
        />
      )}
      {editOpen && (
        <EditProjectDialog
          project={project}
          onClose={() => setEditOpen(false)}
          onSave={async (input) => {
            try {
              const updated = await projectService.update(project._id, input);
              setProject(updated);
              window.dispatchEvent(new Event(PROJECTS_CHANGED_EVENT));
              setEditOpen(false);
            } catch (caught) {
              setActionError(errorMessage(caught));
              throw caught;
            }
          }}
        />
      )}
    </div>
  );
}

/**
 * Renders the edit project dialog interface.
 * @param props - The component properties.
 */
function EditProjectDialog({
  project,
  onClose,
  onSave,
}: {
  project: Project;
  onClose: () => void;
  onSave: (input: ProjectInput) => Promise<void>;
}) {
  const [name, setName] = useState(project.name);
  const [githubUrl, setGithubUrl] = useState(project.githubUrl);
  const [defaultBranch, setDefaultBranch] = useState(project.defaultBranch);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  /**
   * Validates and submits the current form values.
   * @param event - The event value used by this operation.
   */
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({ name, githubUrl, defaultBranch });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-project-title"
      >
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <span className="modal-icon">
          <Pencil size={19} />
        </span>
        <h2 id="edit-project-title">Edit project</h2>
        <p>Update the saved repository details.</p>
        <form className="form-stack" onSubmit={(event) => void submit(event)}>
          <label className="field-label">
            Project name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              required
            />
          </label>
          <label className="field-label">
            GitHub repository URL
            <input
              type="url"
              value={githubUrl}
              onChange={(event) => setGithubUrl(event.target.value)}
              required
            />
          </label>
          <label className="field-label">
            Default branch
            <input
              value={defaultBranch}
              onChange={(event) => setDefaultBranch(event.target.value)}
              maxLength={255}
              required
            />
          </label>
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          <button className="button button-primary full-width" disabled={busy}>
            {busy ? 'Saving…' : 'Save project'}
          </button>
        </form>
      </section>
    </div>
  );
}
