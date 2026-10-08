import { describe, expect, it } from 'vitest';

import type { GraphData } from '../types/domain.js';
import { toFlowGraph } from './graph-layout.js';

const graph: GraphData = {
  nodes: [
    {
      id: 'model',
      path: 'src/user.model.ts',
      language: 'typescript',
      role: 'model',
      lines: 20,
      fanIn: 1,
      fanOut: 0,
    },
    {
      id: 'service',
      path: 'src/user.service.ts',
      language: 'typescript',
      role: 'service',
      lines: 30,
      fanIn: 0,
      fanOut: 1,
    },
  ],
  edges: [{ id: 'edge-1', source: 'service', target: 'model', type: 'import', line: 4 }],
};

describe('toFlowGraph', () => {
  it('creates positioned nodes and preserves verified dependency direction', () => {
    const result = toFlowGraph(graph);

    expect(result.nodes).toHaveLength(2);
    expect(result.nodes.find((node) => node.id === 'service')?.data.label).toBe('user.service.ts');
    expect(result.nodes.find((node) => node.id === 'service')?.position.y).toBe(
      result.nodes.find((node) => node.id === 'model')?.position.y,
    );
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]).toMatchObject({ source: 'service', target: 'model' });
  });

  it('lays out cyclic files without dropping their verified edges', () => {
    const cyclicGraph: GraphData = {
      nodes: [
        { ...graph.nodes[0]!, id: 'cycle-a', path: 'a.ts' },
        { ...graph.nodes[1]!, id: 'cycle-b', path: 'b.ts' },
      ],
      edges: [
        { id: 'a-b', source: 'cycle-a', target: 'cycle-b', type: 'import' },
        { id: 'b-a', source: 'cycle-b', target: 'cycle-a', type: 'import' },
      ],
    };
    const result = toFlowGraph(cyclicGraph);

    expect(result.nodes).toHaveLength(2);
    expect(result.nodes.every((node) => Number.isFinite(node.position.x + node.position.y))).toBe(
      true,
    );
    expect(result.edges).toHaveLength(2);
  });

  it('produces stable positions independent of API node order', () => {
    const first = toFlowGraph(graph);
    const second = toFlowGraph({ ...graph, nodes: [...graph.nodes].reverse() });

    expect(second.nodes.map(({ id, position }) => ({ id, position }))).toEqual(
      first.nodes.map(({ id, position }) => ({ id, position })),
    );
  });
});
