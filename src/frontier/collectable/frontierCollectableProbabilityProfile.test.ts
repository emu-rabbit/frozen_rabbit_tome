import { describe, expect, it } from 'vitest';
import {
  createFrontierBrazenBuckets,
  createDefaultFrontierProbabilityProfile,
  detectFrontierBrazenBucketOptions,
  normalizeFrontierBrazenBuckets,
  validateFrontierProbabilityProfile
} from './frontierCollectableProbabilityProfile';
import { getFrontierIntuitionRates } from './frontierCollectableMechanics';

describe('frontierCollectableProbabilityProfile', () => {
  it('accepts the default discrete Brazen bucket profile', () => {
    const profile = createDefaultFrontierProbabilityProfile();
    const result = validateFrontierProbabilityProfile(profile);

    expect(profile.highStandardProcRatePercent).toBe(10);
    expect(result.valid).toBe(true);
    expect(result.totalProbabilityPercent).toBe(100);
    expect(result.averageMultiplierPercent).toBe(100);
  });

  it('rejects invalid bucket totals and high standard rates', () => {
    const result = validateFrontierProbabilityProfile({
      brazenBuckets: [
        { id: 'low', multiplierPercent: 40, probabilityPercent: 60 },
        { id: 'high', multiplierPercent: 150, probabilityPercent: 20 }
      ],
      standardProcRatePercent: 10,
      highStandardProcRatePercent: 101
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('brazenBuckets.0.multiplierOutOfRange');
    expect(result.errors).toContain('brazenBuckets.totalProbabilityNot100');
    expect(result.errors).toContain('highStandardProcRatePercent.outOfRange');
    expect(result.errors).toContain('highStandardProcRatePercent.exceedsStandardProcRate');
  });

  it('treats High Standard as a share of the same Intuition pool', () => {
    const rates = getFrontierIntuitionRates({
      brazenBuckets: createFrontierBrazenBuckets('uniform', 5),
      standardProcRatePercent: 24,
      highStandardProcRatePercent: 10
    });

    expect(rates).toEqual({
      totalProcRatePercent: 24,
      standardProcRatePercent: 14,
      highStandardProcRatePercent: 10,
      noProcRatePercent: 76
    });
  });

  it('rejects a High Standard rate larger than the total Intuition pool', () => {
    const result = validateFrontierProbabilityProfile({
      brazenBuckets: createFrontierBrazenBuckets('uniform', 5),
      standardProcRatePercent: 9,
      highStandardProcRatePercent: 10
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('highStandardProcRatePercent.exceedsStandardProcRate');
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

  it('creates the five-bucket curve examples used by the Frontier UI', () => {
    expect(createFrontierBrazenBuckets('uniform', 5).map((bucket) => bucket.probabilityPercent))
      .toEqual([20, 20, 20, 20, 20]);
    expect(createFrontierBrazenBuckets('triangular', 5).map((bucket) => bucket.probabilityPercent))
      .toEqual([10, 20, 40, 20, 10]);
    expect(createFrontierBrazenBuckets('normal', 5).map((bucket) => bucket.probabilityPercent))
      .toEqual([6, 24, 40, 24, 6]);
    expect(createFrontierBrazenBuckets('skewLow', 5).map((bucket) => bucket.probabilityPercent))
      .toEqual([40, 25, 18, 11, 6]);
    expect(createFrontierBrazenBuckets('skewHigh', 5).map((bucket) => bucket.probabilityPercent))
      .toEqual([6, 11, 18, 25, 40]);
    expect(createFrontierBrazenBuckets('uShape', 5).map((bucket) => bucket.probabilityPercent))
      .toEqual([30, 10, 20, 10, 30]);
  });

  it('keeps generated granular curves valid and detectable', () => {
    const buckets = createFrontierBrazenBuckets('normal', 20);
    const result = validateFrontierProbabilityProfile({
      brazenBuckets: buckets,
      standardProcRatePercent: 25,
      highStandardProcRatePercent: 10
    });

    expect(buckets).toHaveLength(20);
    expect(result.valid).toBe(true);
    expect(result.totalProbabilityPercent).toBe(100);
    expect(detectFrontierBrazenBucketOptions(buckets)).toEqual({
      curve: 'normal',
      bucketCount: 20
    });
  });
});
