import DirectedGraph from "graphology-types";

/**
 * Computes the number of descendant nodes for each node in a Directed Acyclic Graph (DAG).
 * A descendant of a node is any node reachable by following directed edges.
 *
 * @param graph - The directed graph instance from Graphology.
 * @returns An object where keys are node identifiers and values represent the count of all
 * reachable outgoing nodes.
 *
 * @example
 * ```typescript
 * const graph = new DirectedGraph();
 * graph.addNode("A");
 * graph.addNode("B");
 * graph.addNode("C");
 * graph.addNode("D");
 * graph.addNode("E");
 *
 * graph.addEdge("A", "B");
 * graph.addEdge("A", "C");
 * graph.addEdge("B", "D");
 * graph.addEdge("C", "E");
 *
 * const descendants = countDescendants(graph);
 * console.log(descendants); // { A: 4, B: 1, C: 1, D: 0, E: 0 }
 * ```
 */
export function countDescendants(graph: DirectedGraph): Record<string, number> {
  // NOTE: Maybe some Greedy algorithm will be better suited to solve this…

  const memo: Record<string, number> = {};

  function dfs(node: string): number {
    if (memo[node] !== undefined) return memo[node];

    let count = 0;
    graph.forEachOutboundNeighbor(node, (neighbor) => {
      count += 1 + dfs(neighbor);
    });

    memo[node] = count;
    return count;
  }

  const result: Record<string, number> = {};
  graph.forEachNode((node) => {
    result[node] = dfs(node);
  });

  return result;
}
