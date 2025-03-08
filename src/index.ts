import * as v from "valibot";
import * as dagre from "@dagrejs/dagre";
import DirectedGraph from "graphology-types";
import { topologicalGenerations } from "graphology-dag";
import { isGraph } from "graphology-utils";
//import { countDescendants } from '/~/utils';
import { countDescendants } from "./utils";

const DEFAULT_MAX_ITERATIONS: number = 500;
const DEFAULT_SETTINGS_NODE_WIDTH: number = 30;
const DEFAULT_SETTINGS_NODE_HEIGHT: number = 20;

const DagreSettingsSchema = v.object({
  nodeWidth: v.pipe(
    v.optional(v.number(), DEFAULT_SETTINGS_NODE_WIDTH),
    v.minValue(
      1,
      "graphology-layout-dagre: the `maxWidth` setting should be positive number.",
    ),
  ),
  nodeHeight: v.pipe(
    v.optional(v.number(), DEFAULT_SETTINGS_NODE_HEIGHT),
    v.minValue(
      1,
      "graphology-layout-dagre: the `maxHeight` setting should be positive number.",
    ),
  ),
});

const DagreLayoutParametersSchema = v.object({
  maxIterations: v.pipe(
    v.optional(v.number(), DEFAULT_MAX_ITERATIONS),
    v.minValue(
      1,
      "graphology-layout-dagre: you should provide a positive number of maximum iterations.",
    ),
  ),
  settings: v.optional(DagreSettingsSchema, {}),
});

type DagreSettings = v.InferOutput<typeof DagreSettingsSchema>;
type DagreLayoutParameters = v.InferOutput<typeof DagreLayoutParametersSchema>;

/**
 * TODO: TSDoc
 */
function abstractSynchronousLayout(
  assign: boolean,
  graph: DirectedGraph,
  params: DagreLayoutParameters | number = {},
) {
  // cbeck input parameters are correct

  if (!isGraph(graph)) {
    throw new Error(
      "graphology-layout-dagre: the given graph is not a valid graphology instance.",
    );
  }

  if (graph.type !== "directed") {
    throw new Error(
      "graphology-layout-dagre: the given graph must be directed.",
    );
  }

  if (typeof params === "number") {
    params = v.parse(DagreLayoutParametersSchema, { maxIterations: params });
  } else {
    params = v.parse(DagreLayoutParametersSchema, params);
  }

  // generate Dagre Graph from given graph

  const dagreGraph = createDagreGraph(graph, params.settings);

  // update tne given graph to the computed dagre parameters

  graph.nodes().forEach((node) => {
    const attrs = dagreGraph.node(node);
    attrs.x = attrs.x - attrs.width / 2;
    attrs.y = attrs.y - attrs.height / 2;
    graph.replaceNodeAttributes(node, attrs);
  });

  dagreGraph.edges().forEach((edges) => {
    const attrs = dagreGraph.edge(edges);
    graph.replaceEdgeAttributes(edges.v, edges.w, attrs);
  });
}

/**
 * TODO: TSDoc
 */
function createDagreGraph(
  graph: DirectedGraph,
  settings: DagreSettings,
): dagre.graphlib.Graph {
  const dagreGraph = new dagre.graphlib.Graph({
    multigraph: false,
    //compound: false,
    directed: true,
  });
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: "BT",
    //align: "UR",
    ranker: "tight-tree",
    nodesep: settings.nodeWidth,
    edgesep: settings.nodeWidth,
    ranksep: settings.nodeHeight,
  });

  const generations = topologicalGenerations(graph);
  const descendants = countDescendants(graph);

  console.log("descendants", descendants);

  // map generations to rank – more important nodes has less precedence
  generations.forEach((nodes, rank) => {
    nodes.forEach((node) => {
      // Add node

      const weight = generations[rank].length;
      const attrs = graph.getNodeAttributes(node);

      dagreGraph.setNode(node, {
        ...attrs,
        width: settings.nodeWidth,
        height: settings.nodeHeight,
        rank,
      });

      // Add node's direct neighbors

      // neighbors sorted by how much greedy they are
      const neighbors = graph
        .outNeighbors(node)
        .toSorted((a, b) => descendants[b] - descendants[a]);

      neighbors.forEach((neighbor) => {
        const weight = Math.log(descendants[neighbor] + 1);
        const attrs = graph.getEdgeAttributes(node, neighbor);

        dagreGraph.setEdge(
          node,
          neighbor,
          {
            ...attrs,
            minlen: Math.log(weight + 1), // NOTE: constraint on the min edge length
            weight, // more weight means more edges needs to be generated => thus they needs more space
          },
          // edge, // NOTE: don't need named edges yet
        );
      });
    });
  });

  dagre.layout(dagreGraph);

  console.log(dagreGraph.edges().length);
  console.log(graph.edges().length);

  return dagreGraph;
}

const dagreLayout = abstractSynchronousLayout.bind(null, false);
dagreLayout.assign = abstractSynchronousLayout.bind(null, true);

export default dagreLayout;
