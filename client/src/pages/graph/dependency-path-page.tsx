import { ArrowDown, ArrowLeft, ArrowRight, GitBranch, LoaderCircle, Waypoints } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';

import { EmptyState, ErrorState, LoadingState } from '../../components/common/async-states.js';
import { PageHeader } from '../../components/ui/page-header.js';
import { errorMessage } from '../../services/api/api-client.js';
import { graphService } from '../../services/graph/graph.service.js';
import type { DependencyPath, GraphData } from '../../types/domain.js';

/**
 * Renders the dependency path page interface.
 */
export function DependencyPathPage() {
  const { analysisId = '' } = useParams();
  const [params] = useSearchParams();
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [source, setSource] = useState(params.get('source') ?? '');
  const [target, setTarget] = useState(params.get('target') ?? '');
  const [result, setResult] = useState<DependencyPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void graphService
      .get(analysisId)
      .then((data) => {
        if (active) setGraph(data);
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
  }, [analysisId]);

  /**
   * Submits the selected source and target files to find their verified dependency path.
   * @param event - The event value used by this operation.
   */
  async function findPath(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearching(true);
    setError('');
    setResult(null);
    try {
      setResult(await graphService.path(analysisId, source, target));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSearching(false);
    }
  }
  if (loading) return <LoadingState label="Loading graph files" />;
  if (error && !graph) return <ErrorState message={error} />;
  if (!graph)
    return (
      <EmptyState
        title="No graph available"
        description="Complete an analysis before finding paths."
      />
    );
  const labels = new Map(graph.nodes.map((node) => [node.id, node.path]));
  return (
    <div className="page-stack">
      <Link className="back-link" to={`/analyses/${analysisId}/graph`}>
        <ArrowLeft size={16} /> Dependency graph
      </Link>
      <PageHeader
        eyebrow="GRAPH EXPLORATION"
        title="Find a dependency path"
        description="Find the shortest verified route through the directed dependency graph."
      />
      <section className="panel path-form-panel">
        <form className="path-form" onSubmit={(event) => void findPath(event)}>
          <label className="field-label">
            Source file
            <select value={source} onChange={(event) => setSource(event.target.value)} required>
              <option value="">Choose a source</option>
              {graph.nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.path}
                </option>
              ))}
            </select>
          </label>
          <span className="path-arrow">
            <ArrowRight size={20} />
          </span>
          <label className="field-label">
            Target file
            <select value={target} onChange={(event) => setTarget(event.target.value)} required>
              <option value="">Choose a target</option>
              {graph.nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.path}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button button-primary path-submit"
            disabled={searching || !graph.nodes.length}
          >
            {searching ? <LoaderCircle className="spin" size={17} /> : <Waypoints size={17} />} Find
            shortest path
          </button>
        </form>
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
        <p className="muted-note">
          The result uses the backend’s breadth-first search over verified static dependencies.
        </p>
      </section>
      {result &&
        (result.found ? (
          <section className="panel path-result">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">SHORTEST VERIFIED ROUTE</span>
                <h2>
                  {result.path.length} files · {Math.max(0, result.path.length - 1)} edges
                </h2>
              </div>
              <span className="result-pill">
                <GitBranch size={14} /> Path found
              </span>
            </div>
            <div className="path-steps">
              {result.path.map((step, index) => (
                <div className="path-step" key={step.fileId}>
                  <Link to={`/analyses/${analysisId}/files/${step.fileId}`}>
                    <span className="path-step-number">{String(index + 1).padStart(2, '0')}</span>
                    <FilePathLabel path={step.path} />
                  </Link>
                  {index < result.path.length - 1 && (
                    <div className="path-edge">
                      <ArrowDown size={16} />
                      <small>
                        {graph.edges.find(
                          (edge) =>
                            edge.source === step.fileId &&
                            edge.target === result.path[index + 1]?.fileId,
                        )?.type ?? 'dependency'}
                      </small>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="path-text">
              {result.path.map((step) => labels.get(step.fileId) ?? step.path).join('  →  ')}
            </p>
            <Link
              className="button button-primary button-small"
              to={`/analyses/${analysisId}/graph?path=${encodeURIComponent(result.path.map((step) => step.fileId).join(','))}`}
            >
              Highlight route in graph <ArrowRight size={14} />
            </Link>
          </section>
        ) : (
          <EmptyState
            title="No dependency path found"
            description="The backend could not verify a directed path between these files in this analysis."
          />
        ))}
    </div>
  );
}

/**
 * Renders the file path label interface.
 * @param props - The component properties.
 */
function FilePathLabel({ path }: { path: string }) {
  return (
    <span className="path-file-label">
      <strong>{path.split('/').at(-1)}</strong>
      <small>{path}</small>
    </span>
  );
}
