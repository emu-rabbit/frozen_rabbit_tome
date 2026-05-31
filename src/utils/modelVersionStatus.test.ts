import { describe, expect, it } from 'vitest';
import {
  TOME_MODEL_VERSION_CATALOG,
  buildModelVersionsForScenario
} from '../config/modelVersions';
import { isModelVersionSnapshotStale } from './modelVersionStatus';

describe('modelVersionStatus', () => {
  it('treats missing snapshot model versions as stale', () => {
    expect(isModelVersionSnapshotStale('tome.collectable')).toBe(true);
  });

  it('ignores app and schema changes for tome snapshots', () => {
    expect(isModelVersionSnapshotStale('tome.collectable', {
      ...buildModelVersionsForScenario('tome.collectable'),
      exportSchema: 0,
      app: '0.9.1',
      collectableStrategyCodec: 'old-codec'
    })).toBe(false);

    expect(isModelVersionSnapshotStale('tome.regular', {
      ...buildModelVersionsForScenario('tome.regular'),
      exportSchema: 0,
      app: '0.9.1'
    })).toBe(false);
  });

  it('marks tome snapshots stale when their solver version is missing or outdated', () => {
    expect(isModelVersionSnapshotStale('tome.collectable', {
      ...buildModelVersionsForScenario('tome.collectable'),
      collectableSolver: 'collectable-solver-v0'
    })).toBe(true);

    expect(isModelVersionSnapshotStale('tome.regular', {
      exportSchema: 1,
      app: TOME_MODEL_VERSION_CATALOG.app.version
    })).toBe(true);
  });

  it('checks simulator and analyzer versions for experiment snapshots', () => {
    expect(isModelVersionSnapshotStale('experiment.regular', {
      ...buildModelVersionsForScenario('experiment.regular'),
      exportSchema: 0,
      app: '0.9.1'
    })).toBe(false);

    expect(isModelVersionSnapshotStale('experiment.collectable', {
      ...buildModelVersionsForScenario('experiment.collectable'),
      collectableAnalyzer: 'collectable-analyzer-v0'
    })).toBe(true);

    expect(isModelVersionSnapshotStale('experiment.regular', {
      regularSimulator: 'regular-simulator-v1'
    })).toBe(true);
  });

  it('checks Dawntrail collectable simulator and analyzer versions for Frontier snapshots', () => {
    expect(isModelVersionSnapshotStale('frontier.collectable', {
      ...buildModelVersionsForScenario('frontier.collectable'),
      exportSchema: 0,
      app: '0.9.1'
    })).toBe(false);

    expect(isModelVersionSnapshotStale('frontier.collectable', {
      ...buildModelVersionsForScenario('frontier.collectable'),
      dawntrailCollectableAnalyzer: 'dawntrail-collectable-analyzer-v1'
    })).toBe(true);
  });
});
