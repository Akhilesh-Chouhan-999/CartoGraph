import { ArrowRight, FileCode2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { EmptyState, ErrorState, LoadingState } from '../../components/common/async-states.js';
import { PageHeader } from '../../components/ui/page-header.js';
import { errorMessage } from '../../services/api/api-client.js';
import { fileService } from '../../services/files/file.service.js';
import type { FileRecord } from '../../types/domain.js';
import { roleStyles } from '../../utils/graph-layout.js';

export function FilesPage() {
  const { analysisId = '' } = useParams();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    let active = true;
    void fileService
      .list(analysisId)
      .then((items) => {
        if (active) setFiles(items);
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
  const filtered = files.filter((file) =>
    `${file.path} ${file.language} ${file.role}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="ANALYZED SOURCE FILES"
        title="Files"
        description="Browse file metadata and inspect verified incoming and outgoing dependencies."
        actions={
          <span className="count-pill">
            <FileCode2 size={15} /> {files.length} files
          </span>
        }
      />
      <div className="filter-bar">
        <label className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by path, language, or role"
          />
        </label>
      </div>
      {loading ? (
        <LoadingState label="Loading analyzed files" />
      ) : error ? (
        <ErrorState message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={files.length ? 'No matching files' : 'No files in this analysis'}
          description={
            files.length
              ? 'Try another search term.'
              : 'The backend did not return any source files for this analysis.'
          }
        />
      ) : (
        <section className="panel">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>File path</th>
                  <th>Language</th>
                  <th>Role</th>
                  <th>Lines</th>
                  <th>Fan-in</th>
                  <th>Fan-out</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((file) => (
                  <tr key={file._id}>
                    <td>
                      <Link
                        to={`/analyses/${analysisId}/files/${file._id}`}
                        className="file-path-cell"
                      >
                        <FileCode2 size={15} />
                        <code>{file.path}</code>
                      </Link>
                    </td>
                    <td>{file.language}</td>
                    <td>
                      <span
                        className="role-pill"
                        style={{
                          background: roleStyles[file.role].background,
                          color: roleStyles[file.role].color,
                        }}
                      >
                        {roleStyles[file.role].label}
                      </span>
                    </td>
                    <td>{file.lines.toLocaleString()}</td>
                    <td>{file.fanIn}</td>
                    <td>{file.fanOut}</td>
                    <td>
                      <Link
                        className="icon-button"
                        to={`/analyses/${analysisId}/files/${file._id}`}
                        aria-label={`Open ${file.path}`}
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
