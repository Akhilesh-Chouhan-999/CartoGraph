export interface DirectedEdge<T extends string = string> {
  source: T;
  target: T;
}

class GraphAlgorithms {
  public shortestPath<T extends string>(
    edges: readonly DirectedEdge<T>[],
    source: T,
    target: T,
  ): T[] | null {
    if (source === target) return [source];
    const adjacency = this.adjacency(edges, false);
    const visited = new Set<T>([source]);
    const parent = new Map<T, T>();
    const queue: T[] = [source];
    for (let head = 0; head < queue.length; head += 1) {
      const current = queue[head];
      if (current === undefined) continue;
      for (const next of adjacency.get(current) ?? []) {
        if (visited.has(next)) continue;
        visited.add(next);
        parent.set(next, current);
        if (next === target) return this.reconstruct(parent, source, target);
        queue.push(next);
      }
    }
    return null;
  }

  public dependents<T extends string>(
    edges: readonly DirectedEdge<T>[],
    target: T,
  ): { direct: T[]; transitive: T[] } {
    const reverse = this.adjacency(edges, true);
    const direct = [...(reverse.get(target) ?? [])].filter((id) => id !== target).sort();
    const visited = new Set<T>(direct);
    const queue = [...direct];
    for (let head = 0; head < queue.length; head += 1) {
      const current = queue[head];
      if (current === undefined) continue;
      for (const dependent of reverse.get(current) ?? []) {
        if (dependent === target || visited.has(dependent)) continue;
        visited.add(dependent);
        queue.push(dependent);
      }
    }
    return { direct, transitive: [...visited].filter((id) => !direct.includes(id)).sort() };
  }

  private adjacency<T extends string>(
    edges: readonly DirectedEdge<T>[],
    reverse: boolean,
  ): Map<T, T[]> {
    const map = new Map<T, T[]>();
    for (const edge of edges) {
      const from = reverse ? edge.target : edge.source;
      const to = reverse ? edge.source : edge.target;
      const values = map.get(from) ?? [];
      values.push(to);
      map.set(from, values);
    }
    for (const values of map.values()) values.sort();
    return map;
  }

  private reconstruct<T extends string>(parent: ReadonlyMap<T, T>, source: T, target: T): T[] {
    const result: T[] = [target];
    let current = target;
    while (current !== source) {
      const previous = parent.get(current);
      if (previous === undefined) return [];
      result.push(previous);
      current = previous;
    }
    return result.reverse();
  }
}

export default GraphAlgorithms;
