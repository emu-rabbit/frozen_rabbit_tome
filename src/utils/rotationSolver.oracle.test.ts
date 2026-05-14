import { describe, expect, it } from 'vitest';
import { solveGatheringRotation } from './rotationSolver';
import type { SolverRequest } from '../types/game';

interface OracleState {
  gp: number;
  integrity: number;
  nextYieldBonus: number;
}

interface OracleResult {
  expectedYield: number;
  rotations: string[][];
}

const request: SolverRequest = {
  stats: {
    level: 24,
    gathering: 100,
    perception: 0,
    gp: 100
  },
  baseValues: {
    Gathering: 100,
    Perception: 100
  },
  itemLevel: 24,
  nodeBonuses: {
    baseIntegrity: 2,
    gatheringCount: 0,
    yieldCount: 0,
    extraRate: 0
  },
  temporaryGp: 100,
  jobType: 'miner'
};

function solveRestrictedOracle(state: OracleState): OracleResult {
  if (state.integrity <= 0) {
    return { expectedYield: 0, rotations: [[]] };
  }

  const gatherNext = solveRestrictedOracle({
    gp: Math.min(request.stats.gp, state.gp + 5),
    integrity: state.integrity - 1,
    nextYieldBonus: 0
  });
  let best: OracleResult = {
    expectedYield: 1 + state.nextYieldBonus + gatherNext.expectedYield,
    rotations: gatherNext.rotations.map((rotation) => ['採集', ...rotation])
  };

  if (state.gp >= 100 && state.nextYieldBonus === 0) {
    const afterBountiful = solveRestrictedOracle({
      ...state,
      gp: state.gp - 100,
      nextYieldBonus: 1
    });
    const candidate: OracleResult = {
      expectedYield: afterBountiful.expectedYield,
      rotations: afterBountiful.rotations.map((rotation) => ['高產', ...rotation])
    };

    if (candidate.expectedYield > best.expectedYield) {
      best = candidate;
    } else if (candidate.expectedYield === best.expectedYield) {
      best = {
        expectedYield: best.expectedYield,
        rotations: [...best.rotations, ...candidate.rotations]
      };
    }
  }

  return best;
}

describe('rotation solver oracle checks', () => {
  it('小狀態空間下與獨立 brute-force oracle 結果一致', () => {
    const solver = solveGatheringRotation(request);
    const oracle = solveRestrictedOracle({
      gp: request.temporaryGp,
      integrity: request.nodeBonuses.baseIntegrity,
      nextYieldBonus: 0
    });

    expect(solver.expectedYield).toBe(oracle.expectedYield);
    expect(oracle.rotations).toContainEqual(solver.bestRotation);
  });
});
