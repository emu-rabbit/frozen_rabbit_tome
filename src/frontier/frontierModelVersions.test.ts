import { describe, expect, it } from 'vitest';
import {
  FRONTIER_MODEL_VERSION_CATALOG,
  buildFrontierModelVersionsForScenario
} from './frontierModelVersions';

describe('frontierModelVersions', () => {
  it('exports only Frontier collectable model versions', () => {
    expect(buildFrontierModelVersionsForScenario('frontier.collectable')).toEqual({
      frontierCollectableSchema: 1,
      app: FRONTIER_MODEL_VERSION_CATALOG.app.version,
      frontierCollectableSimulator: 'frontier-collectable-simulator-v1',
      frontierCollectableAnalyzer: 'frontier-collectable-analyzer-v1',
      frontierCollectableProbabilityProfile: 'frontier-collectable-probability-profile-v1'
    });
  });
});
