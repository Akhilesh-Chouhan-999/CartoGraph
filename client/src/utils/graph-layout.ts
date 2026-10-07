import { Position, type Edge, type Node } from '@xyflow/react';

import type { FileRole, GraphData, GraphNode } from '../types/domain.js';

export interface GraphNodeData extends Record<string, unknown> {
  label: string;
  file: GraphNode;
}

const roleColumns: FileRole[][] = [
  ['entry'],
  ['controller'],
  ['service'],
  ['repository'],
  ['model'],
  ['middleware', 'utility', 'config', 'test', 'unknown'],
];

export const roleStyles: Record<FileRole, { color: string; background: string; label: string }> = {
  entry: {
    color: 'var(--graph-entry)',
    background: 'var(--graph-entry-surface)',
    label: 'Entry point',
  },
  controller: {
    color: 'var(--graph-controller)',
    background: 'var(--graph-controller-surface)',
    label: 'Controller',
  },
  service: {
    color: 'var(--graph-service)',
    background: 'var(--graph-service-surface)',
    label: 'Service',
  },
  repository: {
    color: 'var(--graph-repository)',
    background: 'var(--graph-repository-surface)',
    label: 'Repository',
  },
  model: { color: 'var(--graph-model)', background: 'var(--graph-model-surface)', label: 'Model' },
  middleware: {
    color: 'var(--graph-other)',
    background: 'var(--graph-other-surface)',
    label: 'Middleware',
  },
  utility: {
    color: 'var(--graph-other)',
    background: 'var(--graph-other-surface)',
    label: 'Utility',
  },
  config: {
    color: 'var(--graph-other)',
    background: 'var(--graph-other-surface)',
    label: 'Config',
  },
  test: { color: 'var(--graph-other)', background: 'var(--graph-other-surface)', label: 'Test' },
  unknown: {
    color: 'var(--graph-other)',
    background: 'var(--graph-other-surface)',
    label: 'Other',
  },
};

export function toFlowGraph(data: GraphData): { nodes: Node<GraphNodeData>[]; edges: Edge[] } {
  const nodes = roleColumns.flatMap((roles, column) =>
    data.nodes
      .filter((node) => roles.includes(node.role))
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((file, row) => ({
        id: file.id,
        type: 'default',
        position: { x: column * 195, y: row * 92 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: `${file.path.split('/').at(-1) ?? file.path}`, file },
        style: {
          minWidth: 164,
          border: `1px solid color-mix(in srgb, ${roleStyles[file.role].color} 45%, white)`,
          borderLeft: `4px solid ${roleStyles[file.role].color}`,
          borderRadius: 6,
          background: roleStyles[file.role].background,
          color: 'var(--text-primary)',
          padding: '10px 12px',
          boxShadow: '0 2px 5px rgba(22, 39, 67, .10)',
          fontSize: 13,
          fontWeight: 550,
        },
      })),
  );
  const edges = data.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: false,
    markerEnd: { type: 'arrowclosed' as const, color: '#9ba5b3' },
    style: { stroke: '#9da7b5', strokeWidth: 1.25 },
  }));
  return { nodes, edges };
}
