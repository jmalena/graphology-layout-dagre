import * as v from "valibot";
import * as dagre from "@dagrejs/dagre";
import Graph from "graphology-types";
import { topologicalGenerations } from "graphology-dag";
import { isGraph } from "graphology-utils";

const DEFAULT_MAX_ITERATIONS = 500;
const DEFAULT_SETTINGS_MARGIN = 50;

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

type DagreSettings = v.InferOutput<typeof DagreSettingsSchema>;
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

  graph.forEachNode((node) => {
    const { x, y } = dagreGraph.node(node);
    graph.setNodeAttribute(node, "x", x);
    graph.setNodeAttribute(node, "y", y);
  });
}

/**
 * TODO: TSDoc
 */
function createDagreGraph(graph: Graph): dagre.graphlib.Graph {
  const generations = topologicalGenerations(graph);

  generations.forEach((nodes, index) => {
    nodes.forEach((node) => {
      graph.setNodeAttribute(node, "rank", index);
    });
  });

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: "BT",
    ranker: "tight-tree",
  });

  graph.forEachNode((node, attrs) => {
    dagreGraph.setNode(node, {
      label: node,
      width: 100,
      height: 50,
      rank: attrs.rank,
    });
  });

  graph.forEachEdge((edge, attr, source, target) => {
    dagreGraph.setEdge(source, target);
  });

  dagre.layout(dagreGraph);

  return dagreGraph;
}

const dagreLayout = abstractSynchronousLayout.bind(null, false);
dagreLayout.assign = abstractSynchronousLayout.bind(null, true);

export default dagreLayout;
