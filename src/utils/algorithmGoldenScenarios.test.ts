import { describe, expect, it } from 'vitest';
import { solveGatheringRotation } from './rotationSolver';
import { solveCollectableRotation } from './collectableSolver';
import type { SolverRequest } from '../types/game';
import type { CollectableSolverRequest } from '../types/collectable';

const regularNoSkillScenario: SolverRequest = {
  stats: {
    level: 89,
    gathering: 100,
    perception: 0,
    gp: 0
  },
  baseValues: {
    Gathering: 100,
    Perception: 100
  },
  itemLevel: 89,
  nodeBonuses: {
    baseIntegrity: 2,
    gatheringCount: 0,
    yieldCount: 0,
    extraRate: 0
  },
  temporaryGp: 0,
  jobType: 'miner',
  debugMode: true
};

const regularBountifulScenario: SolverRequest = {
  ...regularNoSkillScenario,
  stats: {
    level: 24,
    gathering: 100,
    perception: 0,
    gp: 100
  },
  itemLevel: 24,
  temporaryGp: 100
};

const collectableScourScenario: CollectableSolverRequest = {
  stats: {
    level: 89,
    gathering: 100,
    perception: 100,
    gp: 0
  },
  baseValues: {
    Gathering: 100,
    Perception: 100
  },
  itemLevel: 55,
  nodeBonuses: {
    baseIntegrity: 2,
    gatheringCount: 0,
    yieldCount: 0,
    extraRate: 0
  },
  temporaryGp: 0,
  jobType: 'miner',
  rewardTable: {
    itemId: 1,
    source: 'collectables',
    tiers: {
      low: { collectability: 200, reward: { exp: 0, gil: 0, scrip: 100, items: {} } },
      mid: { collectability: 200, reward: { exp: 0, gil: 0, scrip: 100, items: {} } },
      high: { collectability: 200, reward: { exp: 0, gil: 0, scrip: 100, items: {} } }
    }
  },
  objective: { kind: 'scrip' },
  debugMode: true
};

describe('algorithm golden scenarios', () => {
  it('普通採集無技能案例維持固定結果', () => {
    const result = solveGatheringRotation(regularNoSkillScenario);

    expect({
      rotation: result.bestRotation,
      expectedYield: result.expectedYield,
      minYield: result.minYield,
      maxYield: result.maxYield,
      minYieldChance: result.minYieldChance,
      maxYieldChance: result.maxYieldChance,
      outcomeDistribution: result.debug?.plans[0].outcomeDistribution
    }).toEqual({
      rotation: ['採集', '採集'],
      expectedYield: 2,
      minYield: 2,
      maxYield: 2,
      minYieldChance: 100,
      maxYieldChance: 100,
      outcomeDistribution: [{ yield: 2, probability: 100 }]
    });
  });

  it('普通採集高產案例維持固定結果', () => {
    const result = solveGatheringRotation(regularBountifulScenario);

    expect({
      rotation: result.bestRotation,
      expectedYield: result.expectedYield,
      minYield: result.minYield,
      maxYield: result.maxYield,
      outcomeDistribution: result.debug?.plans[0].outcomeDistribution
    }).toEqual({
      rotation: ['高產', '採集', '採集'],
      expectedYield: 3,
      minYield: 3,
      maxYield: 3,
      outcomeDistribution: [{ yield: 3, probability: 100 }]
    });
  });

  it('收藏品 Scour 基準案例維持固定結果', () => {
    const result = solveCollectableRotation(collectableScourScenario);

    expect({
      rootAction: result.policy.recommendedAction.kind,
      expectedScore: result.expectedScore,
      minScore: result.minScore,
      maxScore: result.maxScore,
      outcomeDistribution: result.debug?.plans[0].outcomeDistribution
    }).toEqual({
      rootAction: 'scour',
      expectedScore: 100,
      minScore: 100,
      maxScore: 100,
      outcomeDistribution: [{ score: 100, probability: 100 }]
    });
  });
});
