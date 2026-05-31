import { describe, expect, it } from 'vitest';
import { createDefaultFrontierProbabilityProfile } from './frontierCollectableProbabilityProfile';
import {
  buildFrontierCollectableStrategyTreeAsync,
  type FrontierCollectableStrategyTreeRequest
} from './frontierCollectableStrategyTree';
import type {
  FrontierCollectableStrategyRule
} from './frontierCollectableTypes';

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

function request(strategy: FrontierCollectableStrategyRule[]): FrontierCollectableStrategyTreeRequest {
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
      baseIntegrity: 3,
      gatheringCount: 0,
      yieldCount: 0,
      extraRate: 0
    },
    temporaryGp: 930,
    jobType: 'miner',
    isTimedNode: false,
    probabilityProfile: {
      ...createDefaultFrontierProbabilityProfile(),
      standardProcRatePercent: 100,
      highStandardProcRatePercent: 100
    },
    strategy
  };
}

describe('frontierCollectableStrategyTree', () => {
  it('builds an initial uncovered root without reward table data', async () => {
    const result = await buildFrontierCollectableStrategyTreeAsync(request([]));

    expect(result.summary.totalNodes).toBe(1);
    expect(result.summary.uncoveredNodes).toBe(1);
    expect(result.uncoveredNodes[0]?.state.collectability).toBe(0);
  });

  it('keeps Brazen and High Standard visible in the strategy tree state', async () => {
    const result = await buildFrontierCollectableStrategyTreeAsync(request([
      rule('open-with-scour', ['scour'], [
        { id: 'start', field: 'hasUsedCollectableAction', comparator: '=', value: false }
      ]),
      rule('brazen-on-high-standard', ['brazen'], [
        { id: 'high', field: 'standardMode', comparator: '=', value: 'highStandard' }
      ]),
      rule('collect', ['collect'])
    ]));

    expect(result.summary.decidedNodes).toBeGreaterThan(0);
    expect(JSON.stringify(result.root)).toContain('brazen');
    expect(JSON.stringify(result.root)).toContain('highStandard');
  });
});
