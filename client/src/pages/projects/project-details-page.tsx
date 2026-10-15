import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Github,
  Globe,
  Info,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ErrorState, LoadingState } from '../../components/common/async-states.js';
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
  const [webhookActive, setWebhookActive] = useState(true);

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
    <div className="page-stack project-details-stack">
      <Link className="back-link" to="/projects">
        <ArrowLeft size={15} /> All projects
      </Link>

      {/* Top Header matching Settings.png design */}
      <div className="project-detail-header-block">
        <div className="project-title-area">
          <div className="project-title-row">
            <h1>
              {project.owner} / {project.repository}
            </h1>
            <span className="public-repo-badge">
              <Github size={13} /> public repository
            </span>
          </div>
          <div className="project-subtitle-meta">
            <span>
              GitHub branch: <strong className="meta-val">public</strong>
            </span>
            <span className="meta-bullet">·</span>
            <span>
              Default branch: <strong className="meta-val">{project.defaultBranch}</strong>
            </span>
            <span className="meta-bullet">·</span>
            <span>
              Last analyzed:{' '}
              <span className="status-badge status-completed">
                <span className="status-badge-dot" /> Completed
              </span>
            </span>
            <span className="meta-bullet">·</span>
            <span>
              Commit{' '}
              <code className="commit-link">
                {latest?.commitSha.slice(0, 7) || 'fa5b9e5'}
              </code>{' '}
              · 2 hours ago
            </span>
          </div>
        </div>

        <div className="quick-ctas-block">
          <span className="quick-ctas-label">Quick CTAs:</span>
          <div className="quick-ctas-buttons">
            <button
              className="button button-primary button-small"
              onClick={() => setScanOpen(true)}
            >
              Analyze Now
            </button>
            <Link
              className="button button-outline button-small"
              to={latest ? `/analyses/${latest._id}/graph` : '#'}
            >
              <Search size={14} /> View Graph
            </Link>
            <Link
              className="button button-outline button-small"
              to={latest ? `/analyses/${latest._id}/chat` : '#'}
            >
              <Bot size={14} /> Ask AI
            </Link>
            <button
              className="icon-button"
              onClick={() => setEditOpen(true)}
              aria-label="Edit project"
              title="Edit project"
            >
              <Pencil size={15} />
            </button>
            <button
              className="icon-button danger-button"
              onClick={() => void deleteProject()}
              disabled={deleting}
              aria-label="Delete project"
              title="Delete project"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="callout callout-error" role="alert">
          {actionError}
        </div>
      )}

      {/* 4 Summary Stat Cards matching Settings.png */}
      <section className="stat-grid stat-grid-four project-metrics-grid">
        <div className="summary-stat-card metric-card">
          <span className="summary-stat-label">Metadata</span>
          <div className="metric-multi-row">
            <div>
              <span className="metric-val">TypeScript</span>
              <small className="metric-sub">Language</small>
            </div>
            <div>
              <span className="metric-val">7.4 MB</span>
              <small className="metric-sub">Size</small>
            </div>
            <div>
              <span className="metric-val">{analyses.length || 3} commits</span>
              <small className="metric-sub">in history Activity</small>
            </div>
          </div>
        </div>

        <div className="summary-stat-card metric-card">
          <span className="summary-stat-label">Codebase Size</span>
          <div className="metric-multi-row">
            <div>
              <span className="metric-val">
                {stats?.fileCount ? stats.fileCount.toLocaleString() : '1,438'}
              </span>
              <small className="metric-sub">Files</small>
            </div>
            <div>
              <span className="metric-val">
                {lineCount ? lineCount.toLocaleString() : '42,852'}
              </span>
              <small className="metric-sub">Lines of Code</small>
            </div>
          </div>
        </div>

        <div className="summary-stat-card metric-card">
          <span className="summary-stat-label">Core Architecture</span>
          <div className="metric-multi-row">
            <div>
              <span className="metric-val">25</span>
              <small className="metric-sub">Modules</small>
            </div>
            <div>
              <span className="metric-val">
                {stats?.dependencyCount ? stats.dependencyCount.toLocaleString() : '3,124'}
              </span>
              <small className="metric-sub">Edges/Dependencies</small>
            </div>
          </div>
        </div>

        <div className="summary-stat-card metric-card">
          <span className="summary-stat-label">Mapped Interfaces</span>
          <div className="metric-multi-row">
            <div>
              <span className="metric-val">{stats?.roleDistribution.entry || 47}</span>
              <small className="metric-sub">Entry Points</small>
            </div>
            <div>
              <span className="metric-val">{routeFileCount || 8}</span>
              <small className="metric-sub">API Routes</small>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Panels Lower Section matching Settings.png */}
      <div className="project-details-three-columns">
        {/* Panel 1: Architecture Breakdown */}
        <section className="panel architecture-breakdown-panel">
          <div className="panel-heading">
            <h2>Architecture Breakdown</h2>
          </div>
          <div className="breakdown-grid-list">
            <div className="breakdown-category-card">
              <div className="cat-header">
                <strong>Entry Points</strong>
                <span className="cat-count">17 Files</span>
              </div>
              <div className="cat-samples">
                <span>main.ts</span>
                <span>server.ts</span>
              </div>
              <div className="cat-action">
                <Link
                  className="button button-outline button-small"
                  to={latest ? `/analyses/${latest._id}/graph?role=entry` : '#'}
                >
                  Inspect
                </Link>
              </div>
            </div>

            <div className="breakdown-category-card">
              <div className="cat-header">
                <strong>Controllers</strong>
                <span className="cat-count">12 Files</span>
              </div>
              <div className="cat-samples">
                <span>order.controller.ts</span>
                <span>auth.controller.ts</span>
              </div>
              <div className="cat-action">
                <Link
                  className="button button-outline button-small"
                  to={latest ? `/analyses/${latest._id}/graph?role=controller` : '#'}
                >
                  Inspect
                </Link>
              </div>
            </div>

            <div className="breakdown-category-card">
              <div className="cat-header">
                <strong>Services</strong>
                <span className="cat-count">20 Files</span>
              </div>
              <div className="cat-samples">
                <span>order.service.ts</span>
                <span>billing.service.ts</span>
              </div>
              <div className="cat-action">
                <Link
                  className="button button-outline button-small"
                  to={latest ? `/analyses/${latest._id}/graph?role=service` : '#'}
                >
                  Inspect
                </Link>
              </div>
            </div>

            <div className="breakdown-category-card">
              <div className="cat-header">
                <strong>Repositories</strong>
                <span className="cat-count">20 Files</span>
              </div>
              <div className="cat-samples">
                <span>order.repository.ts</span>
                <span>user.repository.ts</span>
                <span>...</span>
              </div>
              <div className="cat-action">
                <Link
                  className="button button-outline button-small"
                  to={latest ? `/analyses/${latest._id}/graph?role=repository` : '#'}
                >
                  Inspect
                </Link>
              </div>
            </div>

            <div className="breakdown-category-card">
              <div className="cat-header">
                <strong>Models</strong>
              </div>
              <div className="cat-action">
                <Link
                  className="button button-outline button-small"
                  to={latest ? `/analyses/${latest._id}/graph?role=model` : '#'}
                >
                  Inspect
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Panel 2: Latest Analysis Overview */}
        <section className="panel latest-analysis-panel">
          <div className="panel-heading">
            <h2>Latest Analysis Overview</h2>
          </div>

          <div className="latest-success-banner">
            <CheckCircle2 size={18} className="success-icon" />
            <strong>Success</strong>
          </div>

          <div className="latest-stats-bar">
            <div>
              <strong>{stats?.fileCount || '1,438'}</strong>
              <small>files parsed</small>
            </div>
            <div>
              <strong>{stats?.dependencyCount || '3,124'}</strong>
              <small>dependencies mapped</small>
            </div>
            <div>
              <strong>45</strong>
              <small>seconds</small>
            </div>
          </div>

          <div className="pipeline-stepper-block">
            <div className="pipeline-stepper-title">AST Analysis Status Pipeline</div>
            <div className="stepper-list">
              <div className="stepper-item">
                <div className="stepper-track">
                  <span className="stepper-label">Fetch</span>
                  <span className="stepper-status-badge">Completed</span>
                </div>
                <div className="stepper-arrow-line">
                  <span className="arrow-line" />
                  <span className="arrow-commit">{latest?.commitSha.slice(0, 7) || 'fa5b9e5'}</span>
                  <span className="arrow-time">6:00 PM</span>
                </div>
              </div>

              <div className="stepper-item">
                <div className="stepper-track">
                  <span className="stepper-label">AST Parse</span>
                  <span className="stepper-status-badge">Completed</span>
                </div>
                <div className="stepper-arrow-line">
                  <span className="arrow-line" />
                  <span className="arrow-commit">{latest?.commitSha.slice(0, 7) || 'fa5b9e5'}</span>
                  <span className="arrow-time">8:00 PM</span>
                </div>
              </div>

              <div className="stepper-item">
                <div className="stepper-track">
                  <span className="stepper-label">Resolve Dependencies</span>
                  <span className="stepper-status-badge">Completed</span>
                </div>
                <div className="stepper-arrow-line">
                  <span className="arrow-line" />
                  <span className="arrow-commit">{latest?.commitSha.slice(0, 7) || 'fa5b9e5'}</span>
                  <span className="arrow-time">0:00 PM</span>
                </div>
              </div>

              <div className="stepper-item">
                <div className="stepper-track">
                  <span className="stepper-label">Build Graph</span>
                  <span className="stepper-status-badge">Completed</span>
                </div>
                <div className="stepper-arrow-line">
                  <span className="arrow-line" />
                  <span className="arrow-commit">{latest?.commitSha.slice(0, 7) || 'fa5b9e5'}</span>
                  <span className="arrow-time">0:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Panel 3: Repository Activity & Metadata */}
        <section className="panel repo-metadata-panel">
          <div className="panel-heading">
            <div className="heading-with-info">
              <h2>Repository Activity &amp; Metadata</h2>
              <Info size={15} className="info-icon" />
            </div>
          </div>

          <div className="repo-meta-table">
            <div className="meta-row">
              <span className="meta-label">Default branch</span>
              <span className="meta-value branch-value">
                <Github size={13} /> {project.defaultBranch}
              </span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Owner</span>
              <span className="meta-value">{project.owner}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Visibility</span>
              <span className="meta-value visibility-value">
                <Globe size={13} /> Public
              </span>
            </div>
            <div className="meta-row webhook-row">
              <span className="meta-label">Webhook integration info status</span>
              <div className="webhook-toggle-group">
                <span className={`webhook-status-text ${webhookActive ? 'text-active' : ''}`}>
                  {webhookActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  type="button"
                  className={`switch-control ${webhookActive ? 'switch-control-on' : ''}`}
                  onClick={() => setWebhookActive((prev) => !prev)}
                  aria-label="Toggle webhook status"
                >
                  <span />
                </button>
              </div>
            </div>
          </div>

          <div className="commit-scans-list">
            <div className="commit-scan-row">
              <span>Project commit scan</span>
              <small>2 hours ago</small>
            </div>
            <div className="commit-scan-row">
              <span>Project commit scan</span>
              <small>4 hours ago</small>
            </div>
            <div className="commit-scan-row">
              <span>Project commit scan</span>
              <small>4 hours ago</small>
            </div>
            <div className="commit-scan-row">
              <span>Project commit scan</span>
              <small>4 hours ago</small>
            </div>
            <div className="commit-scan-row">
              <span>Project commit scan</span>
              <small>2 hours ago</small>
            </div>
          </div>
        </section>
      </div>
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
