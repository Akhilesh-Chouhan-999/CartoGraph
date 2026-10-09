import { ChevronDown, Github, GitBranch, Menu, ScanLine } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { PROJECTS_CHANGED_EVENT, projectService } from '../../services/projects/project.service.js';
import { analysisService } from '../../services/analyses/analysis.service.js';
import type { Project } from '../../types/domain.js';
import { ScanDialog } from './scan-dialog.js';

/**
 * Renders the top bar interface.
 * @param props - The component properties.
 */
export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const navigate = useNavigate();
  const { projectId, analysisId } = useParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState('');
  const [scanOpen, setScanOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    /**
     * Loads the user’s projects for the repository selector.
     */
    const loadProjects = () => {
      void projectService
        .list()
        .then((items) => {
          if (!alive) return;
          setProjects(items);
          setSelected(
            items.find((project) => project._id === projectId)?._id ?? items[0]?._id ?? '',
          );
        })
        .catch(() => undefined);
    };
    loadProjects();
    window.addEventListener(PROJECTS_CHANGED_EVENT, loadProjects);
    return () => {
      alive = false;
      window.removeEventListener(PROJECTS_CHANGED_EVENT, loadProjects);
    };
  }, [projectId]);

  useEffect(() => {
    if (!analysisId) return;
    let alive = true;
    void analysisService
      .get(analysisId)
      .then((analysis) => {
        if (alive) setSelected(analysis.projectId);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [analysisId]);

  const current = projects.find((project) => project._id === selected);

  return (
    <>
      <header className="top-bar">
        <button className="icon-button top-menu" aria-label="Open menu" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <div className="top-context">
          <label className="select-wrap repository-select">
            <span className="sr-only">Repository</span>
            <Github className="repository-icon" size={18} aria-hidden="true" />
            <select
              value={selected}
              onChange={(event) => {
                const projectId = event.target.value;
                setSelected(projectId);
                if (projectId) navigate(`/projects/${projectId}`);
              }}
              aria-label="Repository selector"
            >
              {projects.length === 0 && <option value="">No repositories yet</option>}
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.owner} / {project.repository}
                </option>
              ))}
            </select>
          </label>
          <span className="branch-chip">
            <GitBranch size={15} />
            {current?.defaultBranch ?? '—'}
            <ChevronDown size={14} />
          </span>
        </div>
        <div className="top-actions">
          <button className="button button-primary button-small" onClick={() => setScanOpen(true)}>
            <ScanLine size={16} /> Scan Repo
          </button>
          <span className="top-divider" />
          <span className="org-label">Org switching</span>
          <button
            className="switch-control switch-control-on"
            disabled
            aria-label="Organization switching is not available"
            title="Organization switching is not available yet"
          >
            <span />
          </button>
        </div>
      </header>
      {scanOpen && (
        <ScanDialog
          projects={projects}
          initialProjectId={selected}
          onClose={() => setScanOpen(false)}
        />
      )}
    </>
  );
}
