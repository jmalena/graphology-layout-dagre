import * as v from "valibot";
import * as dagre from "@dagrejs/dagre";
import Graph from "graphology-types";
import { topologicalGenerations } from "graphology-dag";
import { isGraph } from "graphology-utils";

const DEFAULT_MAX_ITERATIONS: number = 500;
const DEFAULT_SETTINGS_MARGIN: number = 50;

const DagreSettingsSchema = v.object({
  margin: v.pipe(
    v.optional(v.number(), DEFAULT_SETTINGS_MARGIN),
    v.minValue(
      0,
      "graphology-layout-dagre: the `margin` setting should be non-negative number.",
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
  settings: v.optional(DagreSettingsSchema),
});

type DagreLayoutParameters = v.InferOutput<typeof DagreLayoutParametersSchema>;

/**
 * TODO: TSDoc
 */
function abstractSynchronousLayout(
  assign: boolean,
  graph: Graph,
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

  const dagreGraph = createDagreGraph(graph);

  // update tne given graph to the computed dagre parameters

  graph.nodes().forEach((node) => {
    const attrs = dagreGraph.node(node);
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
function createDagreGraph(graph: Graph): dagre.graphlib.Graph {
  const dagreGraph = new dagre.graphlib.Graph({
    multigraph: false,
    //compound: false,
    //directed: true,
  });
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: "BT",
    //align: "UR",
    ranker: "tight-tree",
    nodesep: 20,
    edgesep: 5,
    ranksep: 10,
  });

  const generations = topologicalGenerations(graph);
  // map generations to rank – more important nodes has more precedence
  const ranks = generations.map((_, i) => i);
  // maps rank to weight – generation with most edges needs shortest edges
  const weights = generations
    .map((arr, index) => ({ index, size: arr.length }))
    .sort((a, b) => a.size - b.size)
    .map((obj) => obj.index);

  generations.forEach((nodes, i) => {
    nodes.forEach((node) => {
      const attrs = graph.getNodeAttributes(node);
      const rank = ranks[i];

      // Setup Dagre Graph's Nodes
      dagreGraph.setNode(node, {
        ...attrs,
        rank,
      });

      // Setup Dagre Graph's Edges
      graph.forEachEdge(
        (edge, attrs, source, target, sourceAttrs, targetAttrs) => {
          const weight = weights[rank];

          dagreGraph.setEdge(
            source,
            target,
            {
              ...attrs,
              minlen: 10, // NOTE: constraint on the min edge length
              weight: weight,
            },
            // edge, // NOTE: don't need named edges yet
          );
        },
      );
    });
  });

  dagre.layout(dagreGraph);

  return dagreGraph;
}

const dagreLayout = abstractSynchronousLayout.bind(null, false);
dagreLayout.assign = abstractSynchronousLayout.bind(null, true);

export default dagreLayout;
