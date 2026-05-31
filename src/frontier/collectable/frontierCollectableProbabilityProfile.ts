import type {
  FrontierBrazenBucketCount,
  FrontierBrazenDistributionCurve,
  FrontierBrazenBucket,
  FrontierCollectableProbabilityProfile,
  FrontierProbabilityProfileValidation
} from './frontierCollectableTypes';

export const FRONTIER_STANDARD_PROC_RATE_PERCENT = 25;

export const FRONTIER_BRAZEN_BUCKET_COUNTS = [5, 10, 20] as const;

export const FRONTIER_BRAZEN_DISTRIBUTION_CURVES: FrontierBrazenDistributionCurve[] = [
  'uniform',
  'triangular',
  'normal',
  'skewLow',
  'skewHigh',
  'uShape'
];

const FIVE_BUCKET_PERCENTAGES: Record<FrontierBrazenDistributionCurve, number[]> = {
  uniform: [20, 20, 20, 20, 20],
  triangular: [10, 20, 40, 20, 10],
  normal: [6, 24, 40, 24, 6],
  skewLow: [40, 25, 18, 11, 6],
  skewHigh: [6, 11, 18, 25, 40],
  uShape: [30, 10, 20, 10, 30]
};

export const DEFAULT_FRONTIER_BRAZEN_BUCKETS: FrontierBrazenBucket[] = createFrontierBrazenBuckets('uniform', 5);

export function createDefaultFrontierProbabilityProfile(): FrontierCollectableProbabilityProfile {
  return {
    brazenBuckets: DEFAULT_FRONTIER_BRAZEN_BUCKETS.map((bucket) => ({ ...bucket })),
    standardProcRatePercent: FRONTIER_STANDARD_PROC_RATE_PERCENT,
    highStandardProcRatePercent: 10
  };
}

export function createFrontierBrazenBuckets(
  curve: FrontierBrazenDistributionCurve,
  bucketCount: FrontierBrazenBucketCount
): FrontierBrazenBucket[] {
  const multipliers = buildMultiplierBuckets(bucketCount);
  const probabilities = bucketCount === 5
    ? FIVE_BUCKET_PERCENTAGES[curve]
    : percentagesFromWeights(buildCurveWeights(curve, bucketCount));

  return multipliers.map((multiplierPercent, index) => ({
    id: `brazen-${curve}-${bucketCount}-${formatBucketId(multiplierPercent)}`,
    multiplierPercent,
    probabilityPercent: probabilities[index]
  }));
}

export function detectFrontierBrazenBucketOptions(buckets: FrontierBrazenBucket[]): {
  curve: FrontierBrazenDistributionCurve;
  bucketCount: FrontierBrazenBucketCount;
} | null {
  const bucketCount = FRONTIER_BRAZEN_BUCKET_COUNTS.find((count) => count === buckets.length);
  if (!bucketCount) return null;

  const match = FRONTIER_BRAZEN_DISTRIBUTION_CURVES
    .map((curve) => ({ curve, bucketCount, buckets: createFrontierBrazenBuckets(curve, bucketCount) }))
    .find((candidate) => bucketsMatch(candidate.buckets, buckets));

  return match ? { curve: match.curve, bucketCount: match.bucketCount } : null;
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

function buildMultiplierBuckets(bucketCount: FrontierBrazenBucketCount) {
  const step = 100 / (bucketCount - 1);
  return Array.from({ length: bucketCount }, (_, index) => Number((50 + step * index).toFixed(2)));
}

function buildCurveWeights(curve: FrontierBrazenDistributionCurve, bucketCount: FrontierBrazenBucketCount) {
  return Array.from({ length: bucketCount }, (_, index) => {
    const position = (index / (bucketCount - 1)) * 2 - 1;
    const distanceFromCenter = Math.abs(position);

    switch (curve) {
      case 'triangular':
        return 1 + (1 - distanceFromCenter) * 3;
      case 'normal':
        return Math.exp(-0.5 * Math.pow(position / 0.45, 2));
      case 'skewLow':
        return Math.pow(bucketCount - index, 1.35);
      case 'skewHigh':
        return Math.pow(index + 1, 1.35);
      case 'uShape':
        return 1 + Math.pow(distanceFromCenter, 1.6) * 3;
      case 'uniform':
      default:
        return 1;
    }
  });
}

function percentagesFromWeights(weights: number[]) {
  const totalWeight = sum(weights);
  if (totalWeight <= 0) return weights.map(() => 0);

  const percentages = weights.map((weight) => roundPercent((weight / totalWeight) * 100));
  const remainder = roundPercent(100 - sum(percentages));
  if (Math.abs(remainder) <= 0.0001) return percentages;

  const targetIndex = weights.reduce((bestIndex, weight, index) => (
    weight > weights[bestIndex] ? index : bestIndex
  ), 0);
  percentages[targetIndex] = roundPercent(percentages[targetIndex] + remainder);
  return percentages;
}

function bucketsMatch(expected: FrontierBrazenBucket[], actual: FrontierBrazenBucket[]) {
  if (expected.length !== actual.length) return false;

  return expected.every((bucket, index) => (
    nearlyEqual(bucket.multiplierPercent, actual[index].multiplierPercent, 0.01)
      && nearlyEqual(bucket.probabilityPercent, actual[index].probabilityPercent, 0.01)
  ));
}

function nearlyEqual(left: number, right: number, tolerance: number) {
  return Math.abs(left - right) <= tolerance;
}

function formatBucketId(value: number) {
  return value.toFixed(2).replace('.', '-');
}
