import { Position, type Edge, type Node } from '@xyflow/react';

import type { FileRole, GraphData, GraphNode } from '../types/domain.js';

export interface GraphNodeData extends Record<string, unknown> {
  label: string;
  file: GraphNode;
}

const graphSpacing = { column: 205, row: 104 };

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
  const byId = new Map(data.nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  const incomingCount = new Map(data.nodes.map((node) => [node.id, 0]));

  for (const edge of data.edges) {
    if (!byId.has(edge.source) || !byId.has(edge.target)) continue;
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge.source]);
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
  }

  const depthById = new Map<string, number>();
  const queue = data.nodes
    .filter((node) => node.role === 'entry' || incomingCount.get(node.id) === 0)
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((node) => node.id);

  const assignDepths = (starts: string[]) => {
    const pending = [...starts];
    for (const id of starts) depthById.set(id, depthById.get(id) ?? 0);
    for (let index = 0; index < pending.length; index += 1) {
      const id = pending[index];
      if (!id) continue;
      const depth = depthById.get(id) ?? 0;
      for (const targetId of outgoing.get(id) ?? []) {
        if (depthById.has(targetId)) continue;
        depthById.set(targetId, depth + 1);
        pending.push(targetId);
      }
    }
  };

  assignDepths(queue);
  const disconnected = data.nodes
    .filter((node) => !depthById.has(node.id))
    .sort((a, b) => a.path.localeCompare(b.path));
  for (const node of disconnected) {
    if (!depthById.has(node.id)) assignDepths([node.id]);
  }

  const backboneRoot =
    queue.find((id) => byId.get(id)?.role === 'entry') ?? queue[0] ?? data.nodes[0]?.id;
  const backbone = new Set<string>();
  let current = backboneRoot;
  while (current && !backbone.has(current)) {
    backbone.add(current);
    const candidates = (outgoing.get(current) ?? []).filter((id) => !backbone.has(id));
    candidates.sort((a, b) => {
      const childrenA = outgoing.get(a)?.length ?? 0;
      const childrenB = outgoing.get(b)?.length ?? 0;
      const roleA = byId.get(a)?.role;
      const roleB = byId.get(b)?.role;
      const rolePriority = (role: FileRole | undefined) =>
        role === 'controller' ? 3 : role === 'service' ? 2 : role === 'repository' ? 1 : 0;
      return (
        childrenB - childrenA || rolePriority(roleB) - rolePriority(roleA) || a.localeCompare(b)
      );
    });
    current = candidates[0] ?? '';
  }

  const layers = new Map<number, GraphNode[]>();
  for (const node of data.nodes) {
    const depth = depthById.get(node.id) ?? 0;
    layers.set(depth, [...(layers.get(depth) ?? []), node]);
  }

  const rowsById = new Map<string, number>();
  const orderedLayers = [...layers.entries()].sort(([a], [b]) => a - b);
  for (const [depth, layer] of orderedLayers) {
    const sourceRows = (node: GraphNode) =>
      (incoming.get(node.id) ?? [])
        .filter((sourceId) => depthById.get(sourceId) === depth - 1)
        .map((sourceId) => rowsById.get(sourceId))
        .filter((row): row is number => row !== undefined);
    const primaryNode = layer.find((node) => backbone.has(node.id));
    const orderedRemainder = layer
      .filter((node) => node.id !== primaryNode?.id)
      .sort((a, b) => {
        const rowsA = sourceRows(a);
        const rowsB = sourceRows(b);
        const averageA = rowsA.length ? rowsA.reduce((sum, row) => sum + row, 0) / rowsA.length : 0;
        const averageB = rowsB.length ? rowsB.reduce((sum, row) => sum + row, 0) / rowsB.length : 0;
        return averageA - averageB || a.path.localeCompare(b.path);
      });
    const usedRows = new Set<number>();
    if (primaryNode) {
      rowsById.set(primaryNode.id, 0);
      usedRows.add(0);
    }
    for (const node of orderedRemainder) {
      const parents = sourceRows(node);
      const preferred = parents.length
        ? Math.round(parents.reduce((sum, row) => sum + row, 0) / parents.length)
        : 0;
      let row = preferred;
      for (let distance = 0; usedRows.has(row); distance += 1) {
        const candidates =
          distance === 0 ? [preferred] : [preferred + distance, preferred - distance];
        row = candidates.find((candidate) => !usedRows.has(candidate)) ?? preferred + distance + 1;
      }
      rowsById.set(node.id, row);
      usedRows.add(row);
    }
  }

  const nodes = orderedLayers.flatMap(([depth, layer]) =>
    layer.map((file, row) => ({
      id: file.id,
      type: 'default',
      position: {
        x: depth * graphSpacing.column,
        y: (rowsById.get(file.id) ?? row) * graphSpacing.row,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: { label: `${file.path.split('/').at(-1) ?? file.path}`, file },
      style: {
        minWidth: 176,
        border: `1px solid color-mix(in srgb, ${roleStyles[file.role].color} 45%, white)`,
        borderLeft: `4px solid ${roleStyles[file.role].color}`,
        borderRadius: 6,
        background: roleStyles[file.role].background,
        color: 'var(--text-primary)',
        padding: '8px 12px',
        boxShadow: '0 2px 5px rgba(22, 39, 67, .10)',
        fontSize: 14,
        fontWeight: 550,
      },
    })),
  );
  const edges = data.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'default',
    animated: false,
    markerEnd: { type: 'arrowclosed' as const, color: '#9ba5b3' },
    style: { stroke: '#a2acb9', strokeWidth: 1.5 },
  }));
  return { nodes, edges };
}
