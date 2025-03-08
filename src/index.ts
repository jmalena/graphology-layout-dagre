import * as v from "valibot";
import * as dagre from "@dagrejs/dagre";
import Graph from "graphology-types";
import { topologicalGenerations } from "graphology-dag";
import { isGraph } from "graphology-utils";

const DEFAULT_MAX_ITERATIONS = 500;
const DEFAULT_SETTINGS_MARGIN = 50;

// TODO: not implemented (much)
const IS_HORIZONTAL = false;
const DEFAULT_SETTINGS_EDGE_MIN_LEN = 10;
const DEFAULT_SETTINGS_EDGE_MAX_LEN = 30;

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

  const dagreGraph = createDagreGraph(graph);

  const { width: graphWidth, height: graphHeight } = dagreGraph.graph();

  graph.forEachNode((node, attrs) => {
    const { x, y } = dagreGraph.node(node);
    graph.updateNodeAttributes(node, (attr) => ({
      ...attrs,
      targetPosition: IS_HORIZONTAL ? "left" : "top",
      sourcePosition: IS_HORIZONTAL ? "right" : "bottoom",
      x,
      y,
    }));
  });
}

/**
 * TODO: TSDoc
 */
function createDagreGraph(graph: Graph): dagre.graphlib.Graph {
  const dagreGraph = new dagre.graphlib.Graph({
    multigraph: true,
    compound: true,
    directed: true,
  });
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: "BT",
    ranker: "network-simplex",
    ranksep: 500,
    nodesep: 200,
  });

  const generations = topologicalGenerations(graph);
  const maxGenerationCount = Math.max(
    ...generations.map(({ length }) => length),
  );
  console.log("generations", generations, maxGenerationCount);

  generations.forEach((nodes, i) => {
    const rank = generations.length - i;

    nodes.forEach((node) => {
      const attrs = graph.getNodeAttributes(node);

      graph.setNodeAttribute(node, "rank", rank);

      dagreGraph.setNode(node, {
        label: node,
        width: attrs.size,
        height: attrs.size,
        rank,
        cluster: "cluster1",
      });
    });
  });

  graph.forEachEdge((edge, attr, source, target) => {
    const sourceAttrs = graph.getNodeAttributes(source);
    const edgeDensityRatio =
      generations[generations.length - sourceAttrs.rank + 1].length /
      maxGenerationCount;
    const minlen = Math.round(
      DEFAULT_SETTINGS_EDGE_MIN_LEN +
        edgeDensityRatio *
          (DEFAULT_SETTINGS_EDGE_MAX_LEN - DEFAULT_SETTINGS_EDGE_MIN_LEN),
    ); // more height for edgest with higher density and vice versa
    dagreGraph.setEdge(
      source,
      target,
      { weight: sourceAttrs.rank, minlen: 5 },
      edge,
    );
  });

  dagre.layout(dagreGraph);

  return dagreGraph;
}

const dagreLayout = abstractSynchronousLayout.bind(null, false);
dagreLayout.assign = abstractSynchronousLayout.bind(null, true);

export default dagreLayout;
