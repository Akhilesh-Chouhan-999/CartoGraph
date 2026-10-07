import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import {
  Bot,
  Crosshair,
  FileCode2,
  Filter,
  Maximize,
  RotateCcw,
  Search,
  Waypoints,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { ErrorState, LoadingState } from '../../components/common/async-states.js';
import { roleStyles, toFlowGraph, type GraphNodeData } from '../../utils/graph-layout.js';
import { graphService } from '../../services/graph/graph.service.js';
import { errorMessage } from '../../services/api/api-client.js';
import type { FileRole, GraphData, GraphNode } from '../../types/domain.js';

const roles: FileRole[] = [
  'entry',
  'controller',
  'service',
  'repository',
  'model',
  'middleware',
  'utility',
  'config',
  'test',
  'unknown',
];
const legendRoles: FileRole[] = [
  'entry',
  'controller',
  'service',
  'repository',
  'model',
  'unknown',
];

export function GraphPage() {
  const { analysisId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { fitView } = useReactFlow();
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<FileRole | 'all'>('all');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<GraphNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    let active = true;
    void graphService
      .get(analysisId)
      .then((result) => {
        if (active) {
          setGraph(result);
          setSelectedId(
            result.nodes.find((node) => node.role === 'entry')?.id ?? result.nodes[0]?.id ?? '',
          );
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
  }, [analysisId]);

  const converted = useMemo(() => (graph ? toFlowGraph(graph) : null), [graph]);
  useEffect(() => {
    if (!converted) return;
    const term = query.trim().toLowerCase();
    const impactedIds = new Set((searchParams.get('impact') ?? '').split(',').filter(Boolean));
    const pathIds = (searchParams.get('path') ?? '').split(',').filter(Boolean);
    const pathIdSet = new Set(pathIds);
    const pathEdges = new Set(pathIds.slice(1).map((id, index) => `${pathIds[index]}:${id}`));
    const filteredNodes = converted.nodes
      .filter((node) => {
        const matchesQuery = !term || node.data.file.path.toLowerCase().includes(term);
        const matchesRole = roleFilter === 'all' || node.data.file.role === roleFilter;
        return matchesQuery && matchesRole;
      })
      .map((node) => {
        if (pathIdSet.has(node.id))
          return {
            ...node,
            style: { ...node.style, outline: '3px solid var(--primary)', outlineOffset: 3 },
          };
        if (impactedIds.has(node.id))
          return {
            ...node,
            style: { ...node.style, outline: '3px solid var(--warning)', outlineOffset: 3 },
          };
        if (node.id === selectedId)
          return {
            ...node,
            style: { ...node.style, outline: '2px solid var(--primary)', outlineOffset: 2 },
          };
        return node;
      });
    const visibleIds = new Set(filteredNodes.map((node) => node.id));
    setNodes(filteredNodes);
    setEdges(
      converted.edges
        .filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target))
        .map((edge) =>
          pathEdges.has(`${edge.source}:${edge.target}`)
            ? {
                ...edge,
                animated: true,
                style: { ...edge.style, stroke: 'var(--primary)', strokeWidth: 3 },
              }
            : edge,
        ),
    );
  }, [converted, query, roleFilter, searchParams, selectedId, setEdges, setNodes]);

  useEffect(() => {
    const focusId = searchParams.get('fileId');
    if (focusId) setSelectedId(focusId);
  }, [searchParams]);

  const selected = graph?.nodes.find((node) => node.id === selectedId) ?? null;
  if (loading) return <LoadingState label="Building dependency graph" />;
  if (error || !graph) return <ErrorState message={error || 'Graph data is unavailable.'} />;

  function onNodeClick(_event: MouseEvent, node: Node<GraphNodeData>) {
    setSelectedId(node.id);
  }

  function resetGraph() {
    setQuery('');
    setRoleFilter('all');
    setSelectedId('');
    setSearchParams({});
    void fitView({ padding: 0.2 });
  }

  return (
    <div className="graph-page">
      <div className="graph-toolbar">
        <div>
          <span className="eyebrow">STATIC ANALYSIS GRAPH</span>
          <h1>Dependency graph</h1>
          <p>
            {graph.nodes.length.toLocaleString()} files <span>·</span>{' '}
            {graph.edges.length.toLocaleString()} verified relationships
          </p>
        </div>
        <div className="graph-toolbar-controls">
          <label className="graph-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search files"
            />
          </label>
          <label className="graph-filter">
            <Filter size={15} />
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as FileRole | 'all')}
              aria-label="Filter by role"
            >
              <option value="all">All roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {roleStyles[role].label}
                </option>
              ))}
            </select>
          </label>
          <Link className="button button-outline button-small" to={`/analyses/${analysisId}/files`}>
            <FileCode2 size={15} /> Files
          </Link>
          <button className="button button-outline button-small" onClick={resetGraph}>
            <RotateCcw size={15} /> Reset
          </button>
        </div>
      </div>
      {graph.nodes.length === 0 ? (
        <div className="graph-empty">
          <ErrorState message="This analysis does not contain any graph nodes." />
        </div>
      ) : (
        <div className="graph-workspace">
          <section className="graph-canvas" aria-label="Interactive dependency graph">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.12}
              maxZoom={2.2}
              nodesDraggable
              nodesConnectable={false}
              proOptions={{ hideAttribution: true }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={18}
                size={1}
                color="var(--graph-dot, #cfd6e0)"
              />
              <Controls showInteractive={false} />
              <MiniMap
                nodeStrokeWidth={3}
                pannable
                zoomable
                nodeColor={(node) => roleStyles[(node.data as GraphNodeData).file.role].color}
              />
            </ReactFlow>
            <div className="graph-legend">
              <div className="legend-heading">
                <span>Graph node styles</span>
                <span className="legend-hint">Click a node for details</span>
              </div>
              <div className="legend-grid">
                {legendRoles.map((role) => (
                  <span key={role}>
                    <i style={{ background: roleStyles[role].color }} />
                    {roleStyles[role].label}
                  </span>
                ))}
              </div>
            </div>
            <div className="graph-count">
              <Crosshair size={14} /> {nodes.length} visible nodes
            </div>
          </section>
          {selected && (
            <GraphDetailsPanel
              graph={graph}
              file={selected}
              analysisId={analysisId}
              onClose={() => setSelectedId('')}
            />
          )}
          {!selected && (
            <aside className="graph-select-prompt">
              <span>
                <Waypoints size={18} />
              </span>
              <strong>Select a file node</strong>
              <small>Explore its dependencies, dependents, and impact.</small>
              <button
                className="icon-button"
                onClick={() => setSelectedId(graph.nodes[0]?.id ?? '')}
                aria-label="Select first graph node"
              >
                <Maximize size={16} />
              </button>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

function GraphDetailsPanel({
  graph,
  file,
  analysisId,
  onClose,
}: {
  graph: GraphData;
  file: GraphNode;
  analysisId: string;
  onClose: () => void;
}) {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const outgoing = graph.edges.flatMap((edge) => {
    const node = edge.source === file.id ? byId.get(edge.target) : undefined;
    return node ? [{ edge, node }] : [];
  });
  const incoming = graph.edges.flatMap((edge) => {
    const node = edge.target === file.id ? byId.get(edge.source) : undefined;
    return node ? [{ edge, node }] : [];
  });
  return (
    <aside className="graph-details">
      <div className="details-title-row">
        <div>
          <span className="eyebrow">FILE INFO</span>
          <button className="icon-button" onClick={onClose} aria-label="Close details">
            <X size={17} />
          </button>
        </div>
        <h2>{file.path.split('/').at(-1)}</h2>
        <code>{file.path}</code>
      </div>
      <div className="graph-detail-actions">
        <Link
          className="button button-outline button-small"
          to={`/analyses/${analysisId}/files/${file.id}`}
        >
          <FileCode2 size={15} /> View file
        </Link>
        <Link
          className="button button-outline button-small"
          to={`/analyses/${analysisId}/path?source=${file.id}&target=${graph.nodes.find((node) => node.id !== file.id)?.id ?? ''}`}
        >
          <Waypoints size={15} /> Find path
        </Link>
        <Link
          className="button button-soft button-small"
          to={`/analyses/${analysisId}/files/${file.id}/blast-radius`}
        >
          <Crosshair size={15} /> Blast radius
        </Link>
        <Link
          className="button button-outline button-small"
          to={`/analyses/${analysisId}/chat`}
          state={{ prompt: `Explain ${file.path} and its verified dependencies.` }}
        >
          <Bot size={15} /> Explain with AI
        </Link>
      </div>
      <div className="fan-metrics">
        <div>
          <span>Fan-in</span>
          <strong>{file.fanIn}</strong>
        </div>
        <div>
          <span>Fan-out</span>
          <strong>{file.fanOut}</strong>
        </div>
      </div>
      <div className="details-section">
        <h3>File metadata</h3>
        <dl>
          <div>
            <dt>Role</dt>
            <dd>
              <span
                className="role-pill"
                style={{
                  color: roleStyles[file.role].color,
                  background: roleStyles[file.role].background,
                }}
              >
                {roleStyles[file.role].label}
              </span>
            </dd>
          </div>
          <div>
            <dt>Language</dt>
            <dd>{file.language}</dd>
          </div>
          <div>
            <dt>Lines</dt>
            <dd>{file.lines.toLocaleString()}</dd>
          </div>
        </dl>
      </div>
      <DependencyMiniList
        title="Dependencies"
        items={outgoing.map(({ edge, node }) => ({ path: node.path, type: edge.type }))}
      />
      <DependencyMiniList
        title="Dependents"
        items={incoming.map(({ edge, node }) => ({ path: node.path, type: edge.type }))}
      />
    </aside>
  );
}

function DependencyMiniList({
  title,
  items,
}: {
  title: string;
  items: { path: string; type: string }[];
}) {
  return (
    <div className="details-section">
      <h3>
        {title}
        <span>{items.length}</span>
      </h3>
      {items.length ? (
        <ul className="mini-dependency-list">
          {items.slice(0, 8).map((item, index) => (
            <li key={`${item.path}-${index}`}>
              <code>{item.path}</code>
              <small>{item.type}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mini-empty">No {title.toLowerCase()} in this analysis.</p>
      )}
    </div>
  );
}
