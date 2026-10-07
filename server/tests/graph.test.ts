import { describe, expect, it } from 'vitest';

import GraphAlgorithms from '../src/analysis/graph.algorithms.js';

describe('GraphAlgorithms', () => {
  const algorithms = new GraphAlgorithms();
  const edges = [
    { source: 'A', target: 'B' },
    { source: 'B', target: 'C' },
    { source: 'C', target: 'D' },
    { source: 'E', target: 'D' },
  ];

  it('finds a shortest dependency path', () => {
    expect(algorithms.shortestPath(edges, 'A', 'D')).toEqual(['A', 'B', 'C', 'D']);
  });

  it('finds direct and transitive dependents in reverse direction', () => {
    expect(algorithms.dependents(edges, 'D')).toEqual({
      direct: ['C', 'E'],
      transitive: ['A', 'B'],
    });
  });

  it('handles cycles and source equals target', () => {
    const cycle = [
      { source: 'A', target: 'B' },
      { source: 'B', target: 'A' },
    ];
    expect(algorithms.shortestPath(cycle, 'A', 'A')).toEqual(['A']);
    expect(algorithms.shortestPath(cycle, 'A', 'Z')).toBeNull();
    expect(algorithms.dependents(cycle, 'A')).toEqual({ direct: ['B'], transitive: [] });
  });
});
