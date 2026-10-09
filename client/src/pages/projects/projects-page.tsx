import { ArrowRight, ExternalLink, GitBranch, Plus, Search, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState, ErrorState, LoadingState } from '../../components/common/async-states.js';
import { StatusBadge } from '../../components/analysis/status-badge.js';
import { Button } from '../../components/ui/button.js';
import { PageHeader } from '../../components/ui/page-header.js';
import { errorMessage } from '../../services/api/api-client.js';
import {
  PROJECTS_CHANGED_EVENT,
  projectService,
  type ProjectInput,
} from '../../services/projects/project.service.js';
import type { Project } from '../../types/domain.js';

/**
 * Renders the projects page interface.
 */
export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    void projectService
      .list()
      .then((items) => {
        if (active) setProjects(items);
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
  }, [refresh]);

  /**
   * Creates this module data from the supplied input.
   * @param input - The input value to process.
   */
  async function createProject(input: ProjectInput) {
    await projectService.create(input);
    window.dispatchEvent(new Event(PROJECTS_CHANGED_EVENT));
    setCreateOpen(false);
    setRefresh((key) => key + 1);
  }

  const filtered = projects.filter((project) =>
    `${project.name} ${project.owner}/${project.repository}`
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="REPOSITORIES"
        title="Projects"
        description="Connect public GitHub repositories and explore their verified architecture."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={17} /> Add project
          </Button>
        }
      />
      <div className="filter-bar">
        <label className="search-field">
          <Search size={17} />
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Search repositories"
          />
        </label>
        <span className="filter-count">
          {projects.length} {projects.length === 1 ? 'repository' : 'repositories'}
        </span>
      </div>
      {loading ? (
        <LoadingState label="Loading projects" />
      ) : error ? (
        <ErrorState
          message={error}
          retry={() => {
            setError('');
            setRefresh((key) => key + 1);
          }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={projects.length ? 'No matching projects' : 'No projects yet'}
          description={
            projects.length
              ? 'Try another repository name.'
              : 'Add a public GitHub repository to start exploring its codebase using the Add project button above.'
          }
        />
      ) : (
        <section className="project-card-grid">
          {filtered.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </section>
      )}
      {createOpen && (
        <CreateProjectDialog onClose={() => setCreateOpen(false)} onCreate={createProject} />
      )}
    </div>
  );
}

/**
 * Renders the project card interface.
 * @param props - The component properties.
 */
function ProjectCard({ project }: { project: Project }) {
  const [latest, setLatest] = useState<
    Awaited<ReturnType<typeof projectService.analyses>>[number] | null
  >(null);
  useEffect(() => {
    let active = true;
    void projectService
      .analyses(project._id)
      .then((items) => {
        const newest = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
        if (active) setLatest(newest);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [project._id]);

  return (
    <article className="project-card">
      <div className="project-card-top">
        <span className="project-avatar">
          <GitBranch size={18} />
        </span>
        <span className="branch-chip">
          <GitBranch size={12} />
          {project.defaultBranch}
        </span>
      </div>
      <div className="project-card-title">
        <h2>{project.name}</h2>
        <p>
          {project.owner}/{project.repository}
        </p>
      </div>
      <a className="project-url" href={project.githubUrl} target="_blank" rel="noreferrer">
        Open repository <ExternalLink size={14} />
      </a>
      <div className="project-card-meta">
        <span>Latest analysis</span>
        {latest ? (
          <StatusBadge status={latest.status} />
        ) : (
          <span className="text-muted">Not analyzed</span>
        )}
      </div>
      <div className="project-card-footer">
        <span>
          {latest
            ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
                new Date(latest.createdAt),
              )
            : '—'}
        </span>
        <Link className="button button-ghost button-small" to={`/projects/${project._id}`}>
          Open project <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}

/**
 * Renders the create project dialog interface.
 * @param props - The component properties.
 */
function CreateProjectDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: ProjectInput) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  /**
   * Validates and submits the current form values.
   * @param event - The event value used by this operation.
   */
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onCreate({ name, githubUrl, defaultBranch });
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
        aria-labelledby="project-modal-title"
      >
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <span className="modal-icon">
          <GitBranch size={20} />
        </span>
        <h2 id="project-modal-title">Connect a repository</h2>
        <p>Add a public GitHub repository to your workspace.</p>
        <form className="form-stack" onSubmit={(event) => void submit(event)}>
          <label className="field-label">
            Project name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              placeholder="CartoGraph"
              required
            />
          </label>
          <label className="field-label">
            GitHub repository URL
            <input
              type="url"
              value={githubUrl}
              onChange={(event) => setGithubUrl(event.target.value)}
              placeholder="https://github.com/owner/repository"
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
            {busy ? 'Saving repository…' : 'Add project'}
          </button>
        </form>
      </section>
    </div>
  );
}
