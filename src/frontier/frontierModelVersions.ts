import packageInfo from '../../package.json';

export type FrontierModelScenario = 'frontier.collectable';

export type FrontierModelVersionKey =
  | 'frontierCollectableSchema'
  | 'app'
  | 'frontierCollectableSimulator'
  | 'frontierCollectableAnalyzer'
  | 'frontierCollectableProbabilityProfile';

export type FrontierModelVersions = Partial<Record<FrontierModelVersionKey, string | number>>;

export const FRONTIER_COLLECTABLE_SCHEMA_VERSION = 2;

export const FRONTIER_MODEL_VERSION_CATALOG = {
  frontierCollectableSchema: {
    key: 'frontierCollectableSchema',
    version: FRONTIER_COLLECTABLE_SCHEMA_VERSION
  },
  app: {
    key: 'app',
    version: packageInfo.version
  },
  frontierCollectableSimulator: {
    key: 'frontierCollectableSimulator',
    version: 'frontier-collectable-simulator-v1'
  },
  frontierCollectableAnalyzer: {
    key: 'frontierCollectableAnalyzer',
    version: 'frontier-collectable-analyzer-v1'
  },
  frontierCollectableProbabilityProfile: {
    key: 'frontierCollectableProbabilityProfile',
    version: 'frontier-collectable-probability-profile-v1'
  }
} as const satisfies Record<FrontierModelVersionKey, { key: FrontierModelVersionKey; version: string | number }>;

const SCENARIO_MODEL_VERSION_KEYS = {
  'frontier.collectable': [
    'frontierCollectableSchema',
    'app',
    'frontierCollectableSimulator',
    'frontierCollectableAnalyzer',
    'frontierCollectableProbabilityProfile'
  ]
} as const satisfies Record<FrontierModelScenario, readonly FrontierModelVersionKey[]>;

export function buildFrontierModelVersionsForScenario(scenario: FrontierModelScenario): FrontierModelVersions {
  return Object.fromEntries(
    SCENARIO_MODEL_VERSION_KEYS[scenario].map((key) => [key, FRONTIER_MODEL_VERSION_CATALOG[key].version])
  ) as FrontierModelVersions;
}
