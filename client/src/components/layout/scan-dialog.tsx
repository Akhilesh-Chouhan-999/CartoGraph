import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, LoaderCircle, X } from 'lucide-react';

import { analysisService } from '../../services/analyses/analysis.service.js';
import type { Project } from '../../types/domain.js';

/**
 * Renders the scan dialog interface.
 * @param props - The component properties.
 */
export function ScanDialog({
  projects,
  initialProjectId,
  onClose,
}: {
  projects: Project[];
  initialProjectId?: string;
  onClose: () => void;
}) {
  const [projectId, setProjectId] = useState(
    initialProjectId && projects.some((project) => project._id === initialProjectId)
      ? initialProjectId
      : (projects[0]?._id ?? ''),
  );
  const [commitSha, setCommitSha] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  /**
   * Validates and submits the current form values.
   * @param event - The event value used by this operation.
   */
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await analysisService.create(projectId, commitSha.trim());
      navigate(`/analyses/${result.analysisId}/progress`);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not queue the analysis.');
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
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="scan-title">
        <button className="icon-button modal-close" aria-label="Close" onClick={onClose}>
          <X size={18} />
        </button>
        <span className="modal-icon">
          <GitBranch size={20} />
        </span>
        <h2 id="scan-title">Analyze a commit</h2>
        <p>Choose a saved repository and provide the exact commit SHA to analyze.</p>
        {projects.length === 0 ? (
          <p className="callout">Add a project before starting an analysis.</p>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="form-stack">
            <label className="field-label">
              Repository
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                required
              >
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.owner}/{project.repository}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-hint">
              Default branch:{' '}
              {projects.find((project) => project._id === projectId)?.defaultBranch ?? '—'}
            </div>
            <label className="field-label">
              Commit SHA
              <input
                value={commitSha}
                onChange={(event) => setCommitSha(event.target.value)}
                placeholder="40-character commit SHA"
                minLength={40}
                maxLength={64}
                pattern="[a-fA-F0-9]{40}|[a-fA-F0-9]{64}"
                required
              />
            </label>
            <p className="form-hint">
              The API requires a full 40 or 64 character commit hash. Branch lookup is not available
              yet.
            </p>
            {error && (
              <p className="inline-error" role="alert">
                {error}
              </p>
            )}
            <button className="button button-primary full-width" disabled={busy || !projectId}>
              {busy ? (
                <>
                  <LoaderCircle className="spin" size={17} /> Queueing analysis…
                </>
              ) : (
                'Start analysis'
              )}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
