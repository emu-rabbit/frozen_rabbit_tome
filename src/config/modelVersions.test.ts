import { describe, expect, it } from 'vitest';
import {
  TOME_MODEL_VERSION_CATALOG,
  buildModelVersionCatalogForScenario,
  buildModelVersionsForScenario
} from './modelVersions';

describe('modelVersions', () => {
  it('exports only scenario-relevant model versions', () => {
    expect(buildModelVersionsForScenario('tome.regular')).toEqual({
      exportSchema: 1,
      app: TOME_MODEL_VERSION_CATALOG.app.version,
      regularSolver: 'regular-solver-v3'
    });
    expect(buildModelVersionsForScenario('tome.collectable')).toEqual({
      exportSchema: 1,
      app: TOME_MODEL_VERSION_CATALOG.app.version,
      collectableSolver: 'collectable-solver-v1',
      collectableStrategyCodec: 'collectable-policy-strategy-rules-v1'
    });
    expect(buildModelVersionsForScenario('experiment.regular')).toEqual({
      exportSchema: 1,
      app: TOME_MODEL_VERSION_CATALOG.app.version,
      regularSimulator: 'regular-simulator-v1',
      regularAnalyzer: 'regular-analyzer-v1'
    });
    expect(buildModelVersionsForScenario('experiment.collectable')).toEqual({
      exportSchema: 1,
      app: TOME_MODEL_VERSION_CATALOG.app.version,
      collectableSimulator: 'collectable-simulator-v2',
      collectableAnalyzer: 'collectable-analyzer-v2'
    });
    expect(buildModelVersionsForScenario('frontier.collectable')).toEqual({
      exportSchema: 1,
      app: TOME_MODEL_VERSION_CATALOG.app.version,
      dawntrailCollectableSimulator: 'dawntrail-collectable-simulator-v3',
      dawntrailCollectableAnalyzer: 'dawntrail-collectable-analyzer-v3'
    });
  });

  it('keeps category labels available for internal diagnostics', () => {
    const collectableCatalog = buildModelVersionCatalogForScenario('tome.collectable');

    expect(collectableCatalog.map((entry) => entry.category)).toEqual([
      'schema',
      'application',
      'solver',
      'strategy-codec'
    ]);
    expect(TOME_MODEL_VERSION_CATALOG.collectableStrategyCodec.version).toBe('collectable-policy-strategy-rules-v1');
  });
});
