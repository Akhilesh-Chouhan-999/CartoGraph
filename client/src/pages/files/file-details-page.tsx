import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Crosshair,
  FileCode2,
  GitBranch,
  Waypoints,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ErrorState, LoadingState } from '../../components/common/async-states.js';
import { PageHeader } from '../../components/ui/page-header.js';
import { errorMessage } from '../../services/api/api-client.js';
import { fileService } from '../../services/files/file.service.js';
import type { DependencyRecord, FileRecord } from '../../types/domain.js';
import { roleStyles } from '../../utils/graph-layout.js';

/**
 * Renders the file details page interface.
 */
export function FileDetailsPage() {
  const { analysisId = '', fileId = '' } = useParams();
  const [file, setFile] = useState<FileRecord | null>(null);
  const [dependencies, setDependencies] = useState<DependencyRecord[]>([]);
  const [dependents, setDependents] = useState<DependencyRecord[]>([]);
  const [labels, setLabels] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void Promise.all([
      fileService.get(analysisId, fileId),
      fileService.dependencies(analysisId, fileId),
      fileService.dependents(analysisId, fileId),
      fileService.list(analysisId),
    ])
      .then(([record, outgoing, incoming, allFiles]) => {
        if (!active) return;
        setFile(record);
        setDependencies(outgoing);
        setDependents(incoming);
        setLabels(new Map(allFiles.map((item) => [item._id, item.path])));
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
  if (loading) return <LoadingState label="Loading file details" />;
  if (error || !file) return <ErrorState message={error || 'File not found.'} />;
  return (
    <div className="page-stack">
      <Link className="back-link" to={`/analyses/${analysisId}/files`}>
        <ArrowLeft size={16} /> All files
      </Link>
      <PageHeader
        eyebrow="FILE DETAILS"
        title={file.path.split('/').at(-1) ?? file.path}
        description={file.path}
        actions={
          <span
            className="role-pill"
            style={{
              background: roleStyles[file.role].background,
              color: roleStyles[file.role].color,
            }}
          >
            {roleStyles[file.role].label}
          </span>
        }
      />
      <div className="file-detail-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">SOURCE METADATA</span>
              <h2>File overview</h2>
            </div>
            <FileCode2 size={19} className="text-brand" />
          </div>
          <dl className="metadata-grid">
            <div>
              <dt>Language</dt>
              <dd>{file.language}</dd>
            </div>
            <div>
              <dt>Lines</dt>
              <dd>{file.lines.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Fan-in</dt>
              <dd>{file.fanIn}</dd>
            </div>
            <div>
              <dt>Fan-out</dt>
              <dd>{file.fanOut}</dd>
            </div>
            <div className="metadata-wide">
              <dt>Content hash</dt>
              <dd>
                <code>{file.hash}</code>
              </dd>
            </div>
          </dl>
          <div className="callout callout-neutral">
            <FileCode2 size={17} />
            <span>
              Source contents are not exposed by the current file API. This view shows verified
              metadata and dependency relationships.
            </span>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">EXPLORE IMPACT</span>
              <h2>Actions</h2>
            </div>
          </div>
          <div className="file-action-list">
            <Link to={`/analyses/${analysisId}/path?source=${file._id}`}>
              <Waypoints size={17} />
              <span>
                <strong>Find a dependency path</strong>
                <small>Choose another file as the target.</small>
              </span>
              <ArrowRight size={15} />
            </Link>
            <Link to={`/analyses/${analysisId}/files/${file._id}/blast-radius`}>
              <Crosshair size={17} />
              <span>
                <strong>Calculate blast radius</strong>
                <small>See transitive dependents.</small>
              </span>
              <ArrowRight size={15} />
            </Link>
            <Link
              to={`/analyses/${analysisId}/chat`}
              state={{ prompt: `Explain ${file.path} using the verified repository graph.` }}
            >
              <Bot size={17} />
              <span>
                <strong>Explain with AI</strong>
                <small>Ask about verified file context.</small>
              </span>
              <ArrowRight size={15} />
            </Link>
            <Link to={`/analyses/${analysisId}/graph?fileId=${file._id}`}>
              <GitBranch size={17} />
              <span>
                <strong>Open in graph</strong>
                <small>Explore this file visually.</small>
              </span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </div>
      <div className="dependency-columns">
        <DependencyList
          title="Dependencies"
          values={dependencies.map((item) => ({
            path: labels.get(item.targetFileId) ?? item.targetFileId,
            type: item.type,
          }))}
          empty="This file has no internal dependencies in the graph."
        />
        <DependencyList
          title="Dependents"
          values={dependents.map((item) => ({
            path: labels.get(item.sourceFileId) ?? item.sourceFileId,
            type: item.type,
          }))}
          empty="No analyzed files depend on this file."
        />
      </div>
    </div>
  );
}

/**
 * Renders the dependency list interface.
 * @param props - The component properties.
 */
function DependencyList({
  title,
  values,
  empty,
}: {
  title: string;
  values: { path: string; type: string }[];
  empty: string;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">GRAPH RELATIONSHIPS</span>
          <h2>{title}</h2>
        </div>
        <span className="count-pill">{values.length}</span>
      </div>
      {values.length ? (
        <ul className="dependency-table">
          {values.map((item, index) => (
            <li key={`${item.path}-${index}`}>
              <span>
                <GitBranch size={15} />
                <code>{item.path}</code>
              </span>
              <small>{item.type}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted-note">{empty}</p>
      )}
    </section>
  );
}
