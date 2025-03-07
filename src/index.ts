import Graph from "graphology-types";
import isGraph from "graphology-utils/is-graph";

/*
var iterate = require('./iterate.js');
var helpers = require('./helpers.js');

var DEFAULT_SETTINGS = require('./defaults.js');
*/

export type DagreSettings = {
  margin?: number;
};

export type DagreLayoutParameters = {
  maxIterations?: number;
  settings?: DagreSettings;
};

const DEFAULT_MAX_ITERATIONS = 500;
const DEFAULT_SETTINGS = {
  margin: 200,
} satisfies DagreSettings;

/**
 * Asbtract function used to run a certain number of iterations.
 *
 * @param  {boolean}       assign        - Whether to assign positions.
 * @param  {Graph}         graph         - Target graph.
 * @param  {object|number} params        - If number, params.maxIterations, else:
 * @param  {number}        maxIterations - Maximum number of iterations.
 * @param  {object}        [settings]    - Settings.
 * @return {object|undefined}
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
    params = { maxIterations: params };
  }

  var maxIterations = params.maxIterations || DEFAULT_MAX_ITERATIONS;

  if (typeof maxIterations !== "number" || maxIterations <= 0) {
    throw new Error(
      "graphology-layout-dagre: you should provide a positive number of maximum iterations.",
    );
  }

  /*
  // Validating settings
  var settings = Object.assign({}, DEFAULT_SETTINGS, params.settings),
    validationError = helpers.validateSettings(settings);

  if (validationError)
    throw new Error('graphology-layout-noverlap: ' + validationError.message);

  // Building matrices
  var matrix = helpers.graphToByteArray(graph, params.inputReducer),
    converged = false,
    i;

  // Iterating
  for (i = 0; i < maxIterations && !converged; i++)
    converged = iterate(settings, matrix).converged;

  // Applying
  if (assign) {
    helpers.assignLayoutChanges(graph, matrix, params.outputReducer);
    return;
  }

  return helpers.collectLayoutChanges(graph, matrix, params.outputReducer);
  */
}

const dagreLayout = abstractSynchronousLayout.bind(null, false);
dagreLayout.assign = abstractSynchronousLayout.bind(null, true);

export default dagreLayout;
