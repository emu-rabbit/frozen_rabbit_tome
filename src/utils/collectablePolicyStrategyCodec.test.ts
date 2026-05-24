import { describe, expect, it } from 'vitest';
import { solveCollectableRotation } from './collectableSolver';
import {
  compressCollectablePolicyToExactStrategy,
  compressCollectablePolicyToExactStrategyAsync,
  inflateCollectablePolicyFromExactStrategy,
  verifyCollectablePolicyExactStrategyRoundTrip,
  verifyCollectablePolicyExactStrategyRoundTripAsync
} from './collectablePolicyStrategyCodec';
import type { CollectableSolverRequest } from '../types/collectable';

function createRequest(overrides: Partial<CollectableSolverRequest> = {}): CollectableSolverRequest {
  return {
    stats: {
      level: 100,
      gathering: 5345,
      perception: 5173,
      gp: 930
    },
    baseValues: {
      Gathering: 5085,
      Perception: 5085
    },
    itemLevel: 100,
    nodeBonuses: {
      baseIntegrity: 4,
      gatheringCount: 0,
      yieldCount: 0,
      extraRate: 0
    },
    temporaryGp: 720,
    jobType: 'miner',
    isTimedNode: false,
    rewardTable: {
      itemId: 43922,
      source: 'collectables',
      tiers: {
        low: { collectability: 600, reward: { exp: 0, gil: 0, scrip: 16, items: {} } },
        mid: { collectability: 800, reward: { exp: 0, gil: 0, scrip: 18, items: {} } },
        high: { collectability: 1000, reward: { exp: 0, gil: 0, scrip: 22, items: {} } }
      }
    },
    objective: { kind: 'scrip' },
    objectiveMode: 'expected',
    debugMode: true,
    ...overrides
  };
}

describe('collectablePolicyStrategyCodec', () => {
  it('round-trips a primary policy plan without changing the decision tree', () => {
    const request = createRequest();
    const result = solveCollectableRotation(request);
    const plan = result.policyPlans[0];
    const strategy = compressCollectablePolicyToExactStrategy(plan.policy, {
      kind: plan.kind,
      startingGp: plan.startingGp
    });
    const roundTrip = verifyCollectablePolicyExactStrategyRoundTrip(request, plan.policy, strategy);

    expect(strategy.codec).toBe('collectable-policy-strategy-rules-v1');
    expect(strategy.kind).toBe('primary');
    expect(strategy.rules.length).toBeGreaterThan(0);
    expect('entries' in strategy).toBe(false);
    expect(strategy.rules[0].action).toBeTruthy();
    expect(strategy.rules.filter((rule) => !rule.stateKey)[0].conditions?.length).toBeGreaterThan(0);
    expect(strategy.rules.filter((rule) => !!rule.stateKey).every((rule) => (
      !!rule.stateKey && !rule.conditions
    ))).toBe(true);
    expect(strategy.compression.ruleCount).toBeLessThan(strategy.nodeCount);
    expect(strategy.compression.broadRuleCount).toBeGreaterThan(0);
    expect(roundTrip.ok).toBe(true);
    expect(roundTrip.differences).toEqual([]);
  });

  it('keeps revisit policies as separate codec plans', () => {
    const request = createRequest({ temporaryGp: 200 });
    const result = solveCollectableRotation(request);
    const strategies = result.policyPlans.map((plan) => compressCollectablePolicyToExactStrategy(plan.policy, {
      kind: plan.kind,
      startingGp: plan.startingGp
    }));

    expect(result.policyPlans.map((plan) => plan.kind)).toEqual(['primary', 'revisit']);
    expect(strategies.map((strategy) => strategy.kind)).toEqual(['primary', 'revisit']);
    strategies.forEach((strategy, index) => {
      const inflated = inflateCollectablePolicyFromExactStrategy(request, strategy);
      expect(inflated.recommendedAction.kind).toBe(result.policyPlans[index].policy.recommendedAction.kind);
    });
  });

  it('round-trips through the async codec path while yielding to the event queue', async () => {
    const request = createRequest({ temporaryGp: 200 });
    const result = solveCollectableRotation(request);
    const plan = result.policyPlans[0];
    let yieldCount = 0;
    const asyncOptions = {
      yieldEvery: 1,
      yieldToEventLoop: async () => {
        yieldCount += 1;
      }
    };
    const strategy = await compressCollectablePolicyToExactStrategyAsync(plan.policy, {
      kind: plan.kind,
      startingGp: plan.startingGp
    }, asyncOptions);
    const roundTrip = await verifyCollectablePolicyExactStrategyRoundTripAsync(request, plan.policy, strategy, asyncOptions);

    expect(roundTrip.ok).toBe(true);
    expect(roundTrip.differences).toEqual([]);
    expect(yieldCount).toBeGreaterThan(0);
  });

  it('rejects the combined policy when it contains a synthetic revisit gate', () => {
    const request = createRequest({ temporaryGp: 200 });
    const result = solveCollectableRotation(request);

    expect(() => compressCollectablePolicyToExactStrategy(result.policy, {
      kind: 'primary',
      startingGp: request.temporaryGp
    })).toThrow(/revisit gate/);
  });
});
