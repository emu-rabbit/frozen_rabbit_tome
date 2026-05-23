import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NODE_BONUSES,
  COLLECTABLE_INPUT_LIMITS,
  clampIntegerInput,
  maxGatheringCountForBaseIntegrity,
  normalizeCollectableTierScoreWeights,
  normalizeNodeBonuses,
  normalizePlayerStats
} from './inputLimits';

describe('inputLimits', () => {
  it('clamps player stats to solver-safe UI limits', () => {
    expect(normalizePlayerStats({
      level: 999,
      gathering: 12000,
      perception: 12000,
      gp: 5000
    })).toEqual({
      level: 100,
      gathering: 9999,
      perception: 9999,
      gp: 4095
    });
  });

  it('keeps total integrity inside the WASM packed-state range', () => {
    expect(maxGatheringCountForBaseIntegrity(4)).toBe(10);
    expect(maxGatheringCountForBaseIntegrity(6)).toBe(9);

    expect(normalizeNodeBonuses({
      ...DEFAULT_NODE_BONUSES,
      baseIntegrity: 6,
      gatheringCount: 10,
      yieldCount: 99,
      extraRate: 200
    })).toEqual({
      baseIntegrity: 6,
      gatheringCount: 9,
      yieldCount: 50,
      extraRate: 100
    });
  });

  it('clamps custom tier scores to the configured score guard', () => {
    expect(normalizeCollectableTierScoreWeights({
      none: -1,
      low: 1.8,
      mid: Number.NaN,
      high: 999999
    }, {
      none: 0,
      low: 1,
      mid: 3,
      high: 8
    })).toEqual({
      none: 0,
      low: 1,
      mid: 3,
      high: COLLECTABLE_INPUT_LIMITS.customTierScore.max
    });
  });

  it('uses fallback values for invalid numeric input', () => {
    expect(clampIntegerInput('not-a-number', 0, 10, 4)).toBe(4);
  });
});
