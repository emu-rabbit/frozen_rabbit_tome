import { describe, expect, it } from 'vitest';
import { solveGatheringRotation } from './rotationSolver';
import { solveCollectableRotation } from './collectableSolver';
import type { SolverRequest } from '../types/game';
import type { CollectablePolicyNode, CollectableSolverRequest } from '../types/collectable';

function createRegularRequest(overrides: Partial<SolverRequest> = {}): SolverRequest {
  return {
    stats: {
      level: 100,
      gathering: 5345,
      perception: 5173,
      gp: 930
    },
    baseValues: {
      Gathering: 4000,
      Perception: 4000
    },
    itemLevel: 100,
    nodeBonuses: {
      baseIntegrity: 4,
      gatheringCount: 1,
      yieldCount: 1,
      extraRate: 10
    },
    temporaryGp: 930,
    jobType: 'miner',
    debugMode: true,
    ...overrides
  };
}

function createCollectableRequest(overrides: Partial<CollectableSolverRequest> = {}): CollectableSolverRequest {
  return {
    stats: {
      level: 100,
      gathering: 1000,
      perception: 1000,
      gp: 930
    },
    baseValues: {
      Gathering: 1000,
      Perception: 1000
    },
    itemLevel: 100,
    nodeBonuses: {
      baseIntegrity: 4,
      gatheringCount: 0,
      yieldCount: 0,
      extraRate: 0
    },
    temporaryGp: 930,
    jobType: 'miner',
    rewardTable: {
      itemId: 1,
      source: 'collectables',
      tiers: {
        low: { collectability: 200, reward: { exp: 0, gil: 0, scrip: 1, items: {} } },
        mid: { collectability: 600, reward: { exp: 0, gil: 0, scrip: 10, items: {} } },
        high: { collectability: 1000, reward: { exp: 0, gil: 0, scrip: 20, items: {} } }
      }
    },
    objective: { kind: 'scrip' },
    debugMode: true,
    ...overrides
  };
}

function sumProbabilities(entries: Array<{ probability: number }>): number {
  return entries.reduce((sum, entry) => sum + entry.probability, 0);
}

function expectedFromDistribution(entries: Array<{ yield?: number; score?: number; probability: number }>): number {
  return entries.reduce((sum, entry) => {
    return sum + (entry.yield ?? entry.score ?? 0) * (entry.probability / 100);
  }, 0);
}

function collectPolicyNodes(node: CollectablePolicyNode, visited = new Set<string>()): CollectablePolicyNode[] {
  if (visited.has(node.id)) return [];
  visited.add(node.id);

  return [
    node,
    ...node.branches.flatMap((branch) => branch.next ? collectPolicyNodes(branch.next, visited) : [])
  ];
}

describe('algorithm invariants', () => {
  it('普通採集求解器的 outcome distribution 機率總和與 EV 一致', () => {
    const result = solveGatheringRotation(createRegularRequest());
    const distribution = result.debug?.plans[0].outcomeDistribution ?? [];

    expect(sumProbabilities(distribution)).toBeCloseTo(100, 8);
    expect(expectedFromDistribution(distribution)).toBeCloseTo(result.rotationPlans[0].expectedYield, 8);
    expect(result.minYield).toBeLessThanOrEqual(result.expectedYield);
    expect(result.expectedYield).toBeLessThanOrEqual(result.maxYield);
  });

  it('收藏品求解器的 outcome distribution 機率總和與期望分數一致', () => {
    const result = solveCollectableRotation(createCollectableRequest());
    const distribution = result.debug?.plans[0].outcomeDistribution ?? [];

    expect(sumProbabilities(distribution)).toBeCloseTo(100, 8);
    expect(expectedFromDistribution(distribution)).toBeCloseTo(result.policyPlans[0].expectedScore, 6);
    expect(result.minScore).toBeLessThanOrEqual(result.expectedScore);
    expect(result.expectedScore).toBeLessThanOrEqual(result.maxScore);
  });

  it('收藏品決策樹每個節點的機率分支與狀態都維持在合法範圍', () => {
    const request = createCollectableRequest();
    const result = solveCollectableRotation(request);
    const nodes = collectPolicyNodes(result.policy);

    expect(nodes.length).toBeGreaterThan(0);
    nodes.forEach((node) => {
      if (node.branches.length > 0) {
        expect(sumProbabilities(node.branches)).toBeCloseTo(100, 8);
      }

      node.branches.forEach((branch) => {
        expect(branch.outcome.gp).toBeGreaterThanOrEqual(0);
        expect(branch.outcome.gp).toBeLessThanOrEqual(request.stats.gp);
        expect(branch.outcome.integrity).toBeGreaterThanOrEqual(0);
        expect(branch.outcome.collectability).toBeGreaterThanOrEqual(0);
        expect(branch.outcome.collectability).toBeLessThanOrEqual(1000);
      });
    });
  });

  it('代表性搜尋案例維持在寬鬆效能門檻內', () => {
    const regular = solveGatheringRotation(createRegularRequest());
    const collectable = solveCollectableRotation(createCollectableRequest());
    const regularSearch = regular.debug!.plans[0].search;
    const collectableSearch = collectable.debug!.plans[0].search;

    expect(regularSearch.statesSolved).toBeLessThan(10000);
    expect(regularSearch.branchCount).toBeLessThan(50000);
    expect(collectableSearch.statesSolved).toBeLessThan(100000);
    expect(collectableSearch.branchCount).toBeLessThan(700000);
  });
});
