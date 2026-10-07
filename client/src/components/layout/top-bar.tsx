import { Bell, GitBranch, Menu, ScanLine } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { PROJECTS_CHANGED_EVENT, projectService } from '../../services/projects/project.service.js';
import { analysisService } from '../../services/analyses/analysis.service.js';
import type { Project } from '../../types/domain.js';
import { ScanDialog } from './scan-dialog.js';

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const navigate = useNavigate();
  const { projectId, analysisId } = useParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState('');
  const [scanOpen, setScanOpen] = useState(false);

  useEffect(() => {
    let alive = true;
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
          </span>
        </div>
        <div className="top-actions">
          <button className="button button-primary button-small" onClick={() => setScanOpen(true)}>
            <ScanLine size={16} /> Scan repo
          </button>
          <span className="top-divider" />
          <span className="org-label">Organization</span>
          <button
            className="switch-control"
            disabled
            aria-label="Organization switching is not available"
            title="Organization switching is not available yet"
          >
            <span />
          </button>
          <Link className="icon-button notification-button" to="/settings" aria-label="Settings">
            <Bell size={18} />
          </Link>
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
