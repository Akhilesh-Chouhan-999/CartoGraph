import { ArrowRight, Check, Clock3, GitBranch, LoaderCircle, ScanSearch } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ErrorState, LoadingState } from '../../components/common/async-states.js';
import { StatusBadge } from '../../components/analysis/status-badge.js';
import { PageHeader } from '../../components/ui/page-header.js';
import { errorMessage } from '../../services/api/api-client.js';
import { analysisService } from '../../services/analyses/analysis.service.js';
import type { Analysis, AnalysisStatusInfo, Project } from '../../types/domain.js';
import { projectService } from '../../services/projects/project.service.js';

export function AnalysisProgressPage() {
  const { analysisId = '' } = useParams();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [status, setStatus] = useState<AnalysisStatusInfo | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;
    async function refresh() {
      try {
        const current = await analysisService.get(analysisId);
        const [nextStatus, owner] = await Promise.all([
          analysisService.status(analysisId),
          projectService.get(current.projectId),
        ]);
        if (!active) return;
        setAnalysis(current);
        setStatus(nextStatus);
        setProject(owner);
        setError('');
        setLoading(false);
        if (nextStatus.status === 'queued' || nextStatus.status === 'processing')
          timer = window.setTimeout(() => void refresh(), 3000);
      } catch (caught) {
        if (active) {
          setError(errorMessage(caught));
          setLoading(false);
        }
      }
    }
    void refresh();
    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [analysisId]);

  if (loading) return <LoadingState label="Connecting to the analysis worker" />;
  if (error || !analysis || !status)
    return <ErrorState message={error || 'Analysis progress is unavailable.'} />;
  const steps = [
    {
      title: 'Queued',
      text: 'Analysis request accepted by the job queue.',
      icon: Clock3,
      done: status.status !== 'queued',
      active: status.status === 'queued',
    },
    {
      title: 'Processing',
      text: 'Repository files and dependencies are being analyzed.',
      icon: ScanSearch,
      done: status.status === 'completed',
      active: status.status === 'processing',
    },
    {
      title: status.status === 'failed' ? 'Failed' : 'Ready',
      text:
        status.status === 'failed'
          ? (status.errorMessage ?? 'The analysis could not be completed.')
          : 'Verified graph data is ready to explore.',
      icon: status.status === 'failed' ? Clock3 : GitBranch,
      done: status.status === 'completed',
      active: status.status === 'failed',
    },
  ];
  return (
    <div className="page-stack">
      <Link className="back-link" to={project ? `/projects/${project._id}` : '/analyses'}>
        <ArrowRight className="rotate-left" size={15} /> {project?.repository ?? 'Analysis'}
      </Link>
      <PageHeader
        eyebrow="ANALYSIS PIPELINE"
        title="Repository analysis"
        description={`Commit ${analysis.commitSha.slice(0, 12)} · ${project?.owner}/${project?.repository}`}
        actions={<StatusBadge status={status.status} />}
      />
      <section className="progress-layout">
        <div className="panel progress-main">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">WORKER STATUS</span>
              <h2>
                {status.status === 'completed'
                  ? 'Analysis complete'
                  : status.status === 'failed'
                    ? 'Analysis failed'
                    : status.status === 'queued'
                      ? 'Waiting for a worker'
                      : 'Analyzing repository'}
              </h2>
            </div>
            {status.status === 'processing' && (
              <LoaderCircle className="spin text-brand" size={22} />
            )}
          </div>
          <div className="progress-timeline">
            {steps.map(({ title, text, icon: Icon, done, active }, index) => (
              <div
                className={`progress-step${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}
                key={title}
              >
                <span className="progress-step-icon">
                  {done ? <Check size={17} /> : <Icon size={17} />}
                </span>
                <div className="progress-step-copy">
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
                {index < steps.length - 1 && <span className="progress-connector" />}
              </div>
            ))}
          </div>
          <p className="muted-note">
            The API reports the overall job status only. Individual AST and graph-construction stage
            progress is not available.
          </p>
          {status.status === 'completed' && (
            <Link className="button button-primary" to={`/analyses/${analysisId}`}>
              Open analysis overview <ArrowRight size={16} />
            </Link>
          )}
          {status.status === 'failed' && status.errorMessage && (
            <div className="callout callout-error">{status.errorMessage}</div>
          )}
        </div>
        <aside className="panel progress-side">
          <span className="eyebrow">COMMIT</span>
          <code className="commit-full">{analysis.commitSha}</code>
          <div className="progress-side-stats">
            <div>
              <span>Files parsed</span>
              <strong>{status.fileCount.toLocaleString()}</strong>
            </div>
            <div>
              <span>Dependencies</span>
              <strong>{status.dependencyCount.toLocaleString()}</strong>
            </div>
            <div>
              <span>Created</span>
              <strong>
                {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
                  new Date(analysis.createdAt),
                )}
              </strong>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
