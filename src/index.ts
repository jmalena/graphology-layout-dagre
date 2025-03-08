import * as v from "valibot";
import * as dagre from "@dagrejs/dagre";
import Graph from "graphology-types";
import { topologicalGenerations } from "graphology-dag";
import { isGraph } from "graphology-utils";

const DEFAULT_MAX_ITERATIONS: number = 500;
const DEFAULT_SETTINGS_NODE_WIDTH: number = 20;
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
  graph: Graph,
  settings: DagreSettings,
): dagre.graphlib.Graph {
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
    nodesep: settings.nodeWidth,
    edgesep: settings.nodeWidth,
    ranksep: settings.nodeHeight,
  });

  const generations = topologicalGenerations(graph);

  // map generations to rank – more important nodes has less precedence
  generations.forEach((nodes, rank) => {
    nodes.forEach((node) => {
      const weight = Math.log(generations[rank].length);
      const attrs = graph.getNodeAttributes(node);

      // Setup Dagre Graph's Nodes
      dagreGraph.setNode(node, {
        ...attrs,
        width: settings.nodeWidth,
        height: settings.nodeHeight,
        rank,
      });

      // Setup outgoing relationshiops from the current node
      graph.forEachDirectedNeighbor(node, (neighbor, neighborAttr) => {
        dagreGraph.setEdge(
          node,
          neighbor,
          {
            ...attrs,
            minlen: 10, // NOTE: constraint on the min edge length
            weight, // more weight means more edges needs to be generated => thus they needs more space
          },
          // edge, // NOTE: don't need named edges yet
        );
      });
    });
  });

  dagre.layout(dagreGraph);

  return dagreGraph;
}

const dagreLayout = abstractSynchronousLayout.bind(null, false);
dagreLayout.assign = abstractSynchronousLayout.bind(null, true);

export default dagreLayout;
