import { solveGatheringRotation } from '../utils/rotationSolver';
import type { SolverRequest, SolverResponse } from '../types/game';

self.onmessage = (e: MessageEvent<SolverRequest>) => {
  const startTime = performance.now();
  const result = solveGatheringRotation(e.data);

  self.postMessage({
    bestRotation: result.bestRotation,
    rotationPlans: result.rotationPlans,
    revisit: result.revisit,
    expectedYield: Number(result.expectedYield.toFixed(2)),
    minYield: result.minYield,
    maxYield: result.maxYield,
    minYieldChance: result.minYieldChance,
    maxYieldChance: result.maxYieldChance,
    calculationTime: Math.floor(performance.now() - startTime),
    debug: result.debug
  } as SolverResponse);
};
