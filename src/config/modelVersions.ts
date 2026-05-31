import packageInfo from '../../package.json';

export type TomeModelScenario =
  | 'tome.regular'
  | 'tome.collectable'
  | 'experiment.regular'
  | 'experiment.collectable'
  | 'frontier.collectable';

export type TomeModelVersionKey =
  | 'exportSchema'
  | 'app'
  | 'regularSolver'
  | 'collectableSolver'
  | 'regularSimulator'
  | 'regularAnalyzer'
  | 'collectableSimulator'
  | 'collectableAnalyzer'
  | 'collectableStrategyCodec'
  | 'dawntrailCollectableSimulator'
  | 'dawntrailCollectableAnalyzer';

export type TomeModelCategory =
  | 'schema'
  | 'application'
  | 'solver'
  | 'simulator'
  | 'analyzer'
  | 'strategy-codec';

export type TomeModelVisibility = 'external' | 'internal';

export type TomeModelVersionValue = string | number;

export type TomeModelVersions = Partial<Record<TomeModelVersionKey, TomeModelVersionValue>>;

export interface TomeModelVersionCatalogEntry {
  key: TomeModelVersionKey;
  category: TomeModelCategory;
  label: string;
  version: TomeModelVersionValue;
  visibility: readonly TomeModelVisibility[];
}

export const TOME_EXPORT_SCHEMA_VERSION = 1;
export const COLLECTABLE_POLICY_STRATEGY_CODEC_VERSION = 'collectable-policy-strategy-rules-v1';

export const TOME_MODEL_VERSION_CATALOG = {
  exportSchema: {
    key: 'exportSchema',
    category: 'schema',
    label: 'JSON export schema',
    version: TOME_EXPORT_SCHEMA_VERSION,
    visibility: ['external', 'internal']
  },
  app: {
    key: 'app',
    category: 'application',
    label: 'Frozen Rabbit Tome',
    version: packageInfo.version,
    visibility: ['external', 'internal']
  },
  regularSolver: {
    key: 'regularSolver',
    category: 'solver',
    label: 'Regular gathering recommendation model',
    version: 'regular-solver-v1',
    visibility: ['external', 'internal']
  },
  collectableSolver: {
    key: 'collectableSolver',
    category: 'solver',
    label: 'Collectable gathering recommendation model',
    version: 'collectable-solver-v1',
    visibility: ['external', 'internal']
  },
  regularSimulator: {
    key: 'regularSimulator',
    category: 'simulator',
    label: 'Regular gathering simulation model',
    version: 'regular-simulator-v1',
    visibility: ['external', 'internal']
  },
  regularAnalyzer: {
    key: 'regularAnalyzer',
    category: 'analyzer',
    label: 'Regular gathering analysis model',
    version: 'regular-analyzer-v1',
    visibility: ['external', 'internal']
  },
  collectableSimulator: {
    key: 'collectableSimulator',
    category: 'simulator',
    label: 'Collectable strategy simulation model',
    version: 'collectable-simulator-v2',
    visibility: ['external', 'internal']
  },
  collectableAnalyzer: {
    key: 'collectableAnalyzer',
    category: 'analyzer',
    label: 'Collectable strategy analysis model',
    version: 'collectable-analyzer-v2',
    visibility: ['external', 'internal']
  },
  collectableStrategyCodec: {
    key: 'collectableStrategyCodec',
    category: 'strategy-codec',
    label: 'Collectable policy strategy codec',
    version: COLLECTABLE_POLICY_STRATEGY_CODEC_VERSION,
    visibility: ['external', 'internal']
  },
  dawntrailCollectableSimulator: {
    key: 'dawntrailCollectableSimulator',
    category: 'simulator',
    label: 'Dawntrail collectable model simulator',
    version: 'dawntrail-collectable-simulator-v2',
    visibility: ['external', 'internal']
  },
  dawntrailCollectableAnalyzer: {
    key: 'dawntrailCollectableAnalyzer',
    category: 'analyzer',
    label: 'Dawntrail collectable model analyzer',
    version: 'dawntrail-collectable-analyzer-v2',
    visibility: ['external', 'internal']
  }
} as const satisfies Record<TomeModelVersionKey, TomeModelVersionCatalogEntry>;

const SCENARIO_MODEL_VERSION_KEYS = {
  'tome.regular': ['exportSchema', 'app', 'regularSolver'],
  'tome.collectable': ['exportSchema', 'app', 'collectableSolver', 'collectableStrategyCodec'],
  'experiment.regular': ['exportSchema', 'app', 'regularSimulator', 'regularAnalyzer'],
  'experiment.collectable': ['exportSchema', 'app', 'collectableSimulator', 'collectableAnalyzer'],
  'frontier.collectable': ['exportSchema', 'app', 'dawntrailCollectableSimulator', 'dawntrailCollectableAnalyzer']
} as const satisfies Record<TomeModelScenario, readonly TomeModelVersionKey[]>;

export function buildModelVersionsForScenario(scenario: TomeModelScenario): TomeModelVersions {
  return Object.fromEntries(
    SCENARIO_MODEL_VERSION_KEYS[scenario].map((key) => [key, TOME_MODEL_VERSION_CATALOG[key].version])
  ) as TomeModelVersions;
}

export function buildModelVersionCatalogForScenario(scenario: TomeModelScenario): TomeModelVersionCatalogEntry[] {
  return SCENARIO_MODEL_VERSION_KEYS[scenario].map((key) => TOME_MODEL_VERSION_CATALOG[key]);
}
