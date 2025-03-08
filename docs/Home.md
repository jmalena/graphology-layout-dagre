# graphology-layout-dagre

## Prerequisites

For node sizes to work correctly, you have to set:

```ts
const sigmaInstance = new Sigma(graph, containerEl, {
  // …
  autoRescale: false,
  zoomToSizeRatioFunction: (x) => x,
  // …
});
```

during [sigma.js](https://github.com/jacomyal/sigma.js/) Initialization.
