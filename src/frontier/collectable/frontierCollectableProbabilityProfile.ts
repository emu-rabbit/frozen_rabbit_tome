import type {
  FrontierBrazenBucket,
  FrontierCollectableProbabilityProfile,
  FrontierProbabilityProfileValidation
} from './frontierCollectableTypes';

export const FRONTIER_STANDARD_PROC_RATE_PERCENT = 25;

export const DEFAULT_FRONTIER_BRAZEN_BUCKETS: FrontierBrazenBucket[] = [
  { id: '50', multiplierPercent: 50, probabilityPercent: 20 },
  { id: '75', multiplierPercent: 75, probabilityPercent: 20 },
  { id: '100', multiplierPercent: 100, probabilityPercent: 20 },
  { id: '125', multiplierPercent: 125, probabilityPercent: 20 },
  { id: '150', multiplierPercent: 150, probabilityPercent: 20 }
];

export function createDefaultFrontierProbabilityProfile(): FrontierCollectableProbabilityProfile {
  return {
    brazenBuckets: DEFAULT_FRONTIER_BRAZEN_BUCKETS.map((bucket) => ({ ...bucket })),
    standardProcRatePercent: FRONTIER_STANDARD_PROC_RATE_PERCENT,
    highStandardProcRatePercent: 10
  };
}

export function validateFrontierProbabilityProfile(
  profile: FrontierCollectableProbabilityProfile
): FrontierProbabilityProfileValidation {
  const errors: string[] = [];
  const totalProbabilityPercent = roundPercent(sum(profile.brazenBuckets.map((bucket) => bucket.probabilityPercent)));
  const averageMultiplierPercent = profile.brazenBuckets.reduce((total, bucket) => (
    total + bucket.multiplierPercent * (bucket.probabilityPercent / 100)
  ), 0);

  if (profile.brazenBuckets.length === 0) {
    errors.push('brazenBuckets.empty');
  }

  profile.brazenBuckets.forEach((bucket, index) => {
    if (!Number.isFinite(bucket.multiplierPercent) || bucket.multiplierPercent < 50 || bucket.multiplierPercent > 150) {
      errors.push(`brazenBuckets.${index}.multiplierOutOfRange`);
    }
    if (!Number.isFinite(bucket.probabilityPercent) || bucket.probabilityPercent < 0 || bucket.probabilityPercent > 100) {
      errors.push(`brazenBuckets.${index}.probabilityOutOfRange`);
    }
  });

  if (Math.abs(totalProbabilityPercent - 100) > 0.0001) {
    errors.push('brazenBuckets.totalProbabilityNot100');
  }

  const highStandardProcRate = profile.highStandardProcRatePercent ?? 0;
  if (!Number.isFinite(highStandardProcRate) || highStandardProcRate < 0 || highStandardProcRate > 100) {
    errors.push('highStandardProcRatePercent.outOfRange');
  }

  return {
    valid: errors.length === 0,
    errors,
    totalProbabilityPercent,
    averageMultiplierPercent: Number(averageMultiplierPercent.toFixed(4))
  };
}

export function getFrontierStandardProcRatePercent() {
  return FRONTIER_STANDARD_PROC_RATE_PERCENT;
}

export function normalizeFrontierBrazenBuckets(buckets: FrontierBrazenBucket[]): FrontierBrazenBucket[] {
  const total = sum(buckets.map((bucket) => Math.max(0, bucket.probabilityPercent)));
  if (total <= 0) return buckets.map((bucket) => ({ ...bucket, probabilityPercent: 0 }));

  return buckets.map((bucket) => ({
    ...bucket,
    probabilityPercent: Number(((Math.max(0, bucket.probabilityPercent) / total) * 100).toFixed(4))
  }));
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function roundPercent(value: number) {
  return Number(value.toFixed(4));
}
