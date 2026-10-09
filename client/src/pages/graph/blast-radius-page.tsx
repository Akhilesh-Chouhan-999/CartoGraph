import { ArrowLeft, ArrowRight, Crosshair, GitBranch, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { EmptyState, ErrorState, LoadingState } from '../../components/common/async-states.js';
import { PageHeader } from '../../components/ui/page-header.js';
import { errorMessage } from '../../services/api/api-client.js';
import { fileService } from '../../services/files/file.service.js';
import { graphService } from '../../services/graph/graph.service.js';
import type { BlastRadius, FileRecord } from '../../types/domain.js';

/**
 * Renders the blast radius page interface.
 */
export function BlastRadiusPage() {
  const { analysisId = '', fileId = '' } = useParams();
  const [file, setFile] = useState<FileRecord | null>(null);
  const [impact, setImpact] = useState<BlastRadius | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void Promise.all([
      fileService.get(analysisId, fileId),
      graphService.blastRadius(analysisId, fileId),
    ])
      .then(([record, result]) => {
        if (active) {
          setFile(record);
          setImpact(result);
        }
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
  }, [analysisId, fileId]);
  if (loading) return <LoadingState label="Calculating verified impact" />;
  if (error || !file || !impact)
    return <ErrorState message={error || 'Blast radius is unavailable.'} />;
  const affectedIds = [...impact.directDependents, ...impact.transitiveDependents].map(
    (item) => item.fileId,
  );
  return (
    <div className="page-stack">
      <Link className="back-link" to={`/analyses/${analysisId}/files/${fileId}`}>
        <ArrowLeft size={16} /> File details
      </Link>
      <PageHeader
        eyebrow="CHANGE IMPACT ANALYSIS"
        title="Blast radius"
        description="Transitive dependents are traversed in reverse over verified dependency edges."
        actions={
          <Link
            className="button button-outline button-small"
            to={`/analyses/${analysisId}/graph?impact=${affectedIds.join(',')}`}
          >
            <Crosshair size={15} /> Highlight in graph
          </Link>
        }
      />
      <section className="blast-summary">
        <span className="blast-summary-icon">
          <ShieldAlert size={22} />
        </span>
        <div>
          <span>Changing this file may affect</span>
          <strong>
            {impact.affectedCount} {impact.affectedCount === 1 ? 'file' : 'files'}
          </strong>
          <code>{file.path}</code>
        </div>
        <div className="blast-depth">
          <small>Direct</small>
          <strong>{impact.directDependents.length}</strong>
        </div>
        <div className="blast-depth">
          <small>Transitive</small>
          <strong>{impact.transitiveDependents.length}</strong>
        </div>
      </section>
      <div className="dependency-columns">
        <DependentPanel
          title="Direct dependents"
          values={impact.directDependents}
          analysisId={analysisId}
          empty="No files directly depend on this file."
        />
        <DependentPanel
          title="Transitive dependents"
          values={impact.transitiveDependents}
          analysisId={analysisId}
          empty="No additional transitive dependents were found."
        />
      </div>
      {impact.affectedCount === 0 && (
        <EmptyState
          title="No downstream impact found"
          description="No other analyzed files depend on the selected file."
        />
      )}
    </div>
  );
}

/**
 * Renders the dependent panel interface.
 * @param props - The component properties.
 */
function DependentPanel({
  title,
  values,
  analysisId,
  empty,
}: {
  title: string;
  values: { fileId: string; path: string }[];
  analysisId: string;
  empty: string;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">IMPACTED FILES</span>
          <h2>{title}</h2>
        </div>
        <span className="count-pill">{values.length}</span>
      </div>
      {values.length ? (
        <ul className="dependency-table">
          {values.map((item) => (
            <li key={item.fileId}>
              <span>
                <GitBranch size={15} />
                <Link to={`/analyses/${analysisId}/files/${item.fileId}`}>
                  <code>{item.path}</code>
                </Link>
              </span>
              <ArrowRight size={14} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted-note">{empty}</p>
      )}
    </section>
  );
}
