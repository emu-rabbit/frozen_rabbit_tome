import { solveCollectableRotation } from '../utils/collectableSolver';
import type { CollectableSolverRequest, CollectableSolverResult } from '../types/collectable';

self.onmessage = (event: MessageEvent<CollectableSolverRequest>) => {
  const startTime = performance.now();
  const result = solveCollectableRotation(event.data);

  self.postMessage({
    ...result,
    expectedScore: Number(result.expectedScore.toFixed(6)),
    calculationTime: Math.floor(performance.now() - startTime)
  } as CollectableSolverResult);
};
