import { describe, expect, it } from 'vitest';
import {
  createDefaultFrontierProbabilityProfile,
  normalizeFrontierBrazenBuckets,
  validateFrontierProbabilityProfile
} from './frontierCollectableProbabilityProfile';

describe('frontierCollectableProbabilityProfile', () => {
  it('accepts the default discrete Brazen bucket profile', () => {
    const result = validateFrontierProbabilityProfile(createDefaultFrontierProbabilityProfile());

    expect(result.valid).toBe(true);
    expect(result.totalProbabilityPercent).toBe(100);
    expect(result.averageMultiplierPercent).toBe(100);
  });

  it('rejects invalid bucket totals and proc rates', () => {
    const result = validateFrontierProbabilityProfile({
      brazenBuckets: [
        { id: 'low', multiplierPercent: 40, probabilityPercent: 60 },
        { id: 'high', multiplierPercent: 150, probabilityPercent: 20 }
      ],
      standardProcRatePercent: 80,
      highStandardProcRatePercent: 30
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('brazenBuckets.0.multiplierOutOfRange');
    expect(result.errors).toContain('brazenBuckets.totalProbabilityNot100');
    expect(result.errors).toContain('standardProcRates.totalOver100');
  });

  it('normalizes bucket probabilities without changing multipliers', () => {
    expect(normalizeFrontierBrazenBuckets([
      { id: 'a', multiplierPercent: 50, probabilityPercent: 1 },
      { id: 'b', multiplierPercent: 150, probabilityPercent: 3 }
    ])).toEqual([
      { id: 'a', multiplierPercent: 50, probabilityPercent: 25 },
      { id: 'b', multiplierPercent: 150, probabilityPercent: 75 }
    ]);
  });
});
