import { describe, expect, it } from 'vitest';
import { createDefaultFrontierProbabilityProfile } from './frontierCollectableProbabilityProfile';
import {
  analyzeFrontierCollectableStrategy,
  createFrontierCollectableContext,
  createInitialFrontierCollectableState,
  frontierCollectableStateKey,
  matchesFrontierCollectableStrategyRule
} from './frontierCollectableSimulator';
import type {
  FrontierCollectableSimulationRequest,
  FrontierCollectableStrategyRule
} from './frontierCollectableTypes';
import type { CollectableRewardTable } from '../../types/collectable';

const rewardTable: CollectableRewardTable = {
  itemId: 1,
  source: 'collectables',
  rewardItemId: 33914,
  tiers: {
    low: {
      collectability: 100,
      reward: { exp: 0, gil: 0, scrip: 10, items: {} }
    },
    mid: {
      collectability: 200,
      reward: { exp: 0, gil: 0, scrip: 20, items: {} }
    },
    high: {
      collectability: 300,
      reward: { exp: 0, gil: 0, scrip: 30, items: {} }
    }
  }
};

function rule(
  id: string,
  actions: FrontierCollectableStrategyRule['actions'],
  conditions: FrontierCollectableStrategyRule['conditions'] = []
): FrontierCollectableStrategyRule {
  return {
    id,
    name: id,
    enabled: true,
    mode: 'all',
    conditions,
    actions
  };
}

function request(strategy: FrontierCollectableStrategyRule[]): FrontierCollectableSimulationRequest {
  return {
    itemId: 1,
    stats: {
      level: 100,
      gathering: 5345,
      perception: 5173,
      gp: 930
    },
    baseValues: {
      Gathering: 4860,
      Perception: 4860
    },
    itemLevel: 100,
    nodeBonuses: {
      baseIntegrity: 2,
      gatheringCount: 0,
      yieldCount: 0,
      extraRate: 0
    },
    temporaryGp: 930,
    jobType: 'miner',
    isTimedNode: false,
    rewardTable,
    objective: { kind: 'scrip' },
    probabilityProfile: {
      ...createDefaultFrontierProbabilityProfile(),
      standardProcRatePercent: 0,
      highStandardProcRatePercent: null
    },
    strategy
  };
}

describe('frontierCollectableSimulator', () => {
  it('keys standard and high standard as one mutually exclusive state slot', () => {
    const context = createFrontierCollectableContext(request([]));
    const state = createInitialFrontierCollectableState(context, 930);

    expect(frontierCollectableStateKey({ ...state, standardMode: 'standard' }))
      .not.toBe(frontierCollectableStateKey({ ...state, standardMode: 'highStandard' }));
  });

  it('keeps regular Standard and High Standard conditions distinct', () => {
    const context = createFrontierCollectableContext(request([]));
    const baseState = createInitialFrontierCollectableState(context, 930);
    const noStandardState = { ...baseState, standardMode: 'none' as const };
    const regularStandardState = { ...baseState, standardMode: 'standard' as const };
    const highStandardState = { ...baseState, standardMode: 'highStandard' as const };

    expect(matchesFrontierCollectableStrategyRule(
      rule('regular-standard', ['scour'], [
        { id: 'regular', field: 'standardMode', comparator: '=', value: 'standard' }
      ]),
      regularStandardState
    )).toBe(true);
    expect(matchesFrontierCollectableStrategyRule(
      rule('regular-standard', ['scour'], [
        { id: 'regular', field: 'standardMode', comparator: '=', value: 'standard' }
      ]),
      highStandardState
    )).toBe(false);
    expect(matchesFrontierCollectableStrategyRule(
      rule('high-standard', ['brazen'], [
        { id: 'high', field: 'standardMode', comparator: '=', value: 'highStandard' }
      ]),
      highStandardState
    )).toBe(true);
    const anyStandardRule = rule('any-standard', ['meticulous'], [
      { id: 'any', field: 'standardMode', comparator: '!=', value: 'none' }
    ]);
    expect(matchesFrontierCollectableStrategyRule(anyStandardRule, regularStandardState)).toBe(true);
    expect(matchesFrontierCollectableStrategyRule(anyStandardRule, highStandardState)).toBe(true);
    expect(matchesFrontierCollectableStrategyRule(anyStandardRule, noStandardState)).toBe(false);
  });

  it('expands Brazen buckets with exact probabilities and scores collect results', () => {
    const result = analyzeFrontierCollectableStrategy({
      ...request([
        rule('brazen-first', ['brazen'], [
          { id: 'start', field: 'hasUsedCollectableAction', comparator: '=', value: false }
        ]),
        rule('collect-after', ['collect'])
      ]),
      probabilityProfile: {
        brazenBuckets: [
          { id: '50', multiplierPercent: 50, probabilityPercent: 50 },
          { id: '150', multiplierPercent: 150, probabilityPercent: 50 }
        ],
        standardProcRatePercent: 0,
        highStandardProcRatePercent: null
      }
    });

    expect(result.limited).toBe(false);
    expect(result.outcomeDistribution).toEqual([
      { score: 10, probability: 30 },
      { score: 20, probability: 20 },
      { score: 30, probability: 50 }
    ]);
    expect(result.collectabilityDistribution).toEqual([
      { collectability: 100, probability: 30 },
      { collectability: 200, probability: 20 },
      { collectability: 300, probability: 30 },
      { collectability: 400, probability: 20 }
    ]);
  });

  it('uses High Standard to make Brazen land at Scour x 150 before Scrutiny and value bonus', () => {
    const result = analyzeFrontierCollectableStrategy({
      ...request([
        rule('force-high-standard', ['scour'], [
          { id: 'start', field: 'hasUsedCollectableAction', comparator: '=', value: false }
        ]),
        rule('brazen-high', ['brazen'], [
          { id: 'high', field: 'standardMode', comparator: '=', value: 'highStandard' },
          { id: 'before-brazen', field: 'collectability', comparator: '<', value: 400 }
        ]),
        rule('collect-after', ['collect'])
      ]),
      nodeBonuses: {
        baseIntegrity: 3,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      probabilityProfile: {
        brazenBuckets: [
          { id: '50', multiplierPercent: 50, probabilityPercent: 100 }
        ],
        standardProcRatePercent: 0,
        highStandardProcRatePercent: 100
      }
    });

    expect(result.collectabilityDistribution).toEqual([
      { collectability: 500, probability: 36 },
      { collectability: 600, probability: 48 },
      { collectability: 700, probability: 16.000000000000004 }
    ]);
    expect(result.expectedScore).toBe(30);
  });

  it('Collect consumes Standard state before the next decision', () => {
    const result = analyzeFrontierCollectableStrategy({
      ...request([
        rule('scour-proc-standard', ['scour'], [
          { id: 'start', field: 'hasUsedCollectableAction', comparator: '=', value: false }
        ]),
        rule('collect-with-standard', ['collect'], [
          { id: 'standard', field: 'standardMode', comparator: '=', value: 'standard' }
        ]),
        rule('collect-without-standard', ['collect'], [
          { id: 'none-before-collect', field: 'standardMode', comparator: '=', value: 'none' },
          { id: 'not-collected', field: 'hasCollected', comparator: '=', value: false }
        ]),
        rule('after-standard-consumed', ['scour'], [
          { id: 'none', field: 'standardMode', comparator: '=', value: 'none' },
          { id: 'used', field: 'hasCollected', comparator: '=', value: true }
        ])
      ]),
      nodeBonuses: {
        baseIntegrity: 3,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      probabilityProfile: {
        ...createDefaultFrontierProbabilityProfile(),
        standardProcRatePercent: 0,
        highStandardProcRatePercent: null
      }
    });

    expect(result.terminalStateSummary.uncoveredStates).toBe(0);
    expect(result.collectabilityDistribution.some((entry) => entry.collectability > 200)).toBe(true);
  });

  it('returns a controlled limited result when the state guard is reached', () => {
    const result = analyzeFrontierCollectableStrategy({
      ...request([rule('always-meticulous', ['meticulous'])]),
      maxStates: 2
    });

    expect(result.limited).toBe(true);
    expect(result.terminalStateSummary.limitedStates).toBeGreaterThan(0);
  });
});
