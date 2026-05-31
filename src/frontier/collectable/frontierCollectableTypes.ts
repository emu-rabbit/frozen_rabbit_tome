import type {
  CollectableObjective,
  CollectableRewardTable,
  CollectableTierCounts
} from '../../types/collectable';
import type { FoodSelection, GatherableItem, GatheringJob, NodeBonuses, PlayerStats } from '../../types/game';
import type { FrontierModelVersions } from '../frontierModelVersions';

export type FrontierCollectableStandardMode = 'none' | 'standard' | 'highStandard';

export type FrontierCollectableActionKind =
  | 'collect'
  | 'scour'
  | 'brazen'
  | 'meticulous'
  | 'scrutiny'
  | 'collectorsFocus'
  | 'primingTouch'
  | 'successI'
  | 'successII'
  | 'successIII'
  | 'nextCollectSuccess'
  | 'restoreIntegrity'
  | 'wiseToTheWorld';

export interface FrontierCollectableState {
  gp: number;
  integrity: number;
  collectability: number;
  scrutinyActive: boolean;
  collectorsFocusActive: boolean;
  primingTouchActive: boolean;
  standardMode: FrontierCollectableStandardMode;
  hasUsedCollectableAction: boolean;
  hasCollected: boolean;
  successBonus: number;
  successIActive: boolean;
  successIIActive: boolean;
  successIIIActive: boolean;
  nextCollectSuccessBonus: number;
  wiseToTheWorldActive: boolean;
}

export interface FrontierCollectableProbabilityProfile {
  brazenBuckets: FrontierBrazenBucket[];
  standardProcRatePercent: number;
  highStandardProcRatePercent: number | null;
  notes?: string;
}

export type FrontierBrazenDistributionCurve =
  | 'uniform'
  | 'triangular'
  | 'normal'
  | 'skewLow'
  | 'skewHigh'
  | 'uShape';

export type FrontierBrazenBucketCount = 5 | 10 | 20;

export interface FrontierBrazenBucket {
  id: string;
  multiplierPercent: number;
  probabilityPercent: number;
}

export interface FrontierProbabilityProfileValidation {
  valid: boolean;
  errors: string[];
  totalProbabilityPercent: number;
  averageMultiplierPercent: number;
}

export type FrontierCollectableStrategyComparator = '<' | '<=' | '=' | '!=' | '>=' | '>';
export type FrontierCollectableStrategyConditionMode = 'all' | 'any';

export type FrontierCollectableStrategyField =
  | 'gp'
  | 'integrity'
  | 'collectability'
  | 'scrutinyActive'
  | 'collectorsFocusActive'
  | 'primingTouchActive'
  | 'standardMode'
  | 'wiseToTheWorldActive'
  | 'successBonus'
  | 'nextCollectSuccessBonus'
  | 'hasUsedCollectableAction'
  | 'hasCollected';

export interface FrontierCollectableStrategyCondition {
  id: string;
  field: FrontierCollectableStrategyField;
  comparator: FrontierCollectableStrategyComparator;
  value: number | boolean | FrontierCollectableStandardMode;
}

export interface FrontierCollectableStrategyRule {
  id: string;
  name: string;
  mode: FrontierCollectableStrategyConditionMode;
  enabled: boolean;
  conditions: FrontierCollectableStrategyCondition[];
  actions: FrontierCollectableActionKind[];
}

export interface FrontierCollectableSimulationRequest {
  itemId: number;
  stats: PlayerStats;
  baseValues: {
    Gathering: number;
    Perception: number;
  };
  itemLevel: number;
  nodeBonuses: NodeBonuses;
  temporaryGp: number;
  jobType: GatheringJob;
  isTimedNode: boolean;
  hasRelicToolBonus?: boolean;
  rewardTable: CollectableRewardTable;
  objective: CollectableObjective;
  probabilityProfile: FrontierCollectableProbabilityProfile;
  strategy: FrontierCollectableStrategyRule[];
  maxStates?: number;
  maxTransitions?: number;
}

export interface FrontierCollectableScoreDistributionEntry {
  score: number;
  probability: number;
  tierCounts?: CollectableTierCounts;
}

export interface FrontierCollectableTerminalStateSummary {
  terminalStates: number;
  uncoveredStates: number;
  limitedStates: number;
}

export interface FrontierCollectableAnalysisResult {
  modelVersions: FrontierModelVersions;
  expectedScore: number;
  minScore: number;
  maxScore: number;
  minScoreChance: number;
  maxScoreChance: number;
  expectedTierCounts: CollectableTierCounts;
  outcomeDistribution: FrontierCollectableScoreDistributionEntry[];
  collectabilityDistribution: Array<{ collectability: number; probability: number }>;
  terminalStateSummary: FrontierCollectableTerminalStateSummary;
  limited: boolean;
  stateCount: number;
  transitionCount: number;
  assumptionsUsed: string[];
}

export interface FrontierCollectableStudy {
  schemaVersion: 2;
  kind: 'frontier.collectable';
  id: string;
  name?: string;
  itemId: number;
  input: {
    stats: PlayerStats;
    temporaryGp: number;
    food?: FoodSelection;
    nodeBonuses: NodeBonuses;
    hasRelicToolBonus?: boolean;
  };
  probabilityProfile: FrontierCollectableProbabilityProfile;
  strategy: FrontierCollectableStrategyRule[];
  lastAnalysisSnapshot?: FrontierCollectableAnalysisResult;
  createdAt: string;
  updatedAt: string;
}

export interface FrontierCollectableJsonExportInput {
  item: GatherableItem;
  request: FrontierCollectableSimulationRequest;
  analysis: FrontierCollectableAnalysisResult;
  food?: {
    selection: FoodSelection;
    baseStats?: PlayerStats;
  };
  generatedAt?: string;
  locale?: string;
  commit?: string | null;
}
