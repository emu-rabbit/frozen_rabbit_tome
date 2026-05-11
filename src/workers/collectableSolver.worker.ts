import { solveCollectable } from '../utils/collectableSolver';
import type { CollectableSolverRequest, CollectableSolverResult } from '../types/collectable';

self.onmessage = (e: MessageEvent<CollectableSolverRequest>) => {
  const startTime = performance.now();
  const result = solveCollectable(e.data);

  self.postMessage({
    ...result,
    calculationTime: Math.floor(performance.now() - startTime)
  } as CollectableSolverResult & { calculationTime: number });
};
