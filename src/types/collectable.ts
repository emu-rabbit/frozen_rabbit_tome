import type { NodeBonuses, PlayerStats, SolverObjectiveMode } from './game';

export type CollectableObjectiveKind = 'scrip' | 'exp' | 'gil' | 'custom' | 'tierScore';

export interface CollectableRewardWeights {
  exp?: number;
  gil?: number;
  scrip?: number;
  items?: Record<number, number>;
}

export interface CollectableObjective {
  kind: CollectableObjectiveKind;
  weights?: CollectableRewardWeights;
  tierWeights?: CollectableTierScoreWeights;
  presetId?: CollectableObjectivePresetId;
}

export type CollectableObjectivePresetId =
  | 'scrip'
  | 'highValue'
  | 'midValue'
  | 'lowValue'
  | 'customTier';

export interface CollectableTierScoreWeights {
  none?: number;
  low?: number;
  mid?: number;
  high?: number;
}

export interface CollectableRewardVector {
  exp: number;
  gil: number;
  scrip: number;
  items: Record<number, number>;
}

export interface CollectableTierCounts {
  none: number;
  low: number;
  mid: number;
  high: number;
}

export type CollectableRewardTierName = 'none' | 'low' | 'mid' | 'high';

export interface CollectableRewardTier {
  collectability: number;
  reward: CollectableRewardVector;
}

export interface CollectableRewardTable {
  itemId: number;
  source:
    | 'collectables'
    | 'customDelivery'
    | 'sharlayanStudium'
    | 'wachumeqimeqi'
    | 'reduction'
    | 'cosmicExploration';
  rewardItemId?: number;
  tiers: {
    low: CollectableRewardTier;
    mid: CollectableRewardTier;
    high?: CollectableRewardTier;
  };
}

export interface CollectableRewardTableSummary {
  source: CollectableRewardTable['source'];
  rewardItemId?: number;
  lowCollectability: number;
  lowScrip: number;
  midCollectability: number;
  midScrip: number;
  highCollectability?: number;
  highScrip?: number;
}

export type CollectableActionKind =
  | 'collect'
  | 'scour'
  | 'meticulous'
  | 'scrutiny'
  | 'collectorsFocus'
  | 'primingTouch'
  | 'successI'
  | 'successII'
  | 'successIII'
  | 'nextCollectSuccess'
  | 'restoreIntegrity'
  | 'wiseToTheWorld'
  | 'revisitCheck';

export interface CollectableActionSummary {
  kind: CollectableActionKind;
  actionId?: number;
  nameKey: string;
  gpCost: number;
}

export interface CollectableStateSummary {
  gp: number;
  integrity: number;
  collectability: number;
  scrutinyActive: boolean;
  collectorsFocusActive: boolean;
  primingTouchActive: boolean;
  standardActive: boolean;
  successBonus: number;
  nextCollectSuccessBonus: number;
  wiseToTheWorldActive: boolean;
}

export interface CollectableOutcomeSummary {
  gp: number;
  integrity: number;
  collectability: number;
  reward: CollectableRewardVector;
  score: number;
}

export interface CollectableOutcomeDebugEntry {
  score: number;
  probability: number;
  tierCounts?: CollectableTierCounts;
}

export type CollectablePolicyPlanKind = 'primary' | 'revisit';

export interface CollectableRevisitInfo {
  enabled: boolean;
  chance: number;
  isFullGp: boolean;
}

export interface CollectablePolicyBranch {
  labelKey: string;
  labelKeys?: string[];
  conditionKey: string;
  probability: number;
  outcome: CollectableOutcomeSummary;
  next?: CollectablePolicyNode;
}

export interface CollectablePolicyNode {
  id: string;
  state: CollectableStateSummary;
  recommendedAction: CollectableActionSummary;
  expectedScore: number;
  expectedReward: CollectableRewardVector;
  expectedTierCounts: CollectableTierCounts;
  branches: CollectablePolicyBranch[];
}

export interface CollectablePolicyPlan {
  kind: CollectablePolicyPlanKind;
  startingGp: number;
  expectedScore: number;
  minScore: number;
  maxScore: number;
  minScoreChance: number;
  maxScoreChance: number;
  expectedReward: CollectableRewardVector;
  expectedTierCounts: CollectableTierCounts;
  minScoreTierCounts: CollectableTierCounts;
  maxScoreTierCounts: CollectableTierCounts;
  policy: CollectablePolicyNode;
}

export interface CollectableSolverRequest {
  stats: PlayerStats;
  baseValues: {
    Gathering: number;
    Perception: number;
  };
  itemLevel: number;
  nodeBonuses: NodeBonuses;
  temporaryGp: number;
  jobType: 'miner' | 'botanist';
  rewardTable: CollectableRewardTable;
  objective: CollectableObjective;
  objectiveMode?: SolverObjectiveMode;
  hasRelicToolBonus?: boolean;
  isTimedNode?: boolean;
  debugMode?: boolean;
  manualMemoCapacityPower?: number;
}

export interface CollectableFormulaDebugInfo {
  success: {
    gathering: number;
    baseGathering: number;
    score: number;
    rawRate: number;
    levelDifference: number;
    levelModifier: number;
    finalRate: number;
  };
  collectable: {
    gathering: number;
    baseGathering: number;
    perception: number;
    basePerception: number;
    scourValue: number;
    baseValueIncreaseRate: number;
    valueIncreaseRate: number;
    focusedValueIncreaseRate: number;
    hasRelicToolBonus: boolean;
    meticulousRate: number;
    primedMeticulousRate: number;
    scrutinyMultiplier: number;
    scrutinyBonus: number;
    standardProcRate: number;
  };
  rewardTable: CollectableRewardTableSummary;
}

export interface CollectableSearchDebugInfo {
  startingGp: number;
  workerCalculationTime?: number;
  statesSolved: number;
  memoHits: number;
  memoHitRate?: number;
  memoCapacityPower?: number;
  memoCapacity?: number;
  memoCapacityUsable?: number;
  actionsEvaluated: number;
  candidateComparisons: number;
  terminalStates: number;
  branchCount: number;
}

export interface CollectableSolverDebugInfo {
  formulas: CollectableFormulaDebugInfo;
  objective: CollectableObjective;
  plans: Array<{
    kind: CollectablePolicyPlanKind;
    startingGp: number;
    expectedScore: number;
    outcomeDistribution: CollectableOutcomeDebugEntry[];
    search: CollectableSearchDebugInfo;
  }>;
  combined: {
    expectedScore: number;
    revisitChance: number;
    expression: string;
  };
  limitations: string[];
  optimality: {
    engine: 'wasm-core' | 'ts-core';
    method: 'dynamic-programming-policy-search';
    stateKeyFields: string[];
    stateKeyEngine?: 'wasm-packed' | 'js-packed' | 'string';
  };
}

export interface CollectableSolverResult {
  expectedScore: number;
  minScore: number;
  maxScore: number;
  minScoreChance: number;
  maxScoreChance: number;
  objectiveMode: SolverObjectiveMode;
  objective: CollectableObjective;
  expectedReward: CollectableRewardVector;
  expectedTierCounts: CollectableTierCounts;
  minScoreTierCounts: CollectableTierCounts;
  maxScoreTierCounts: CollectableTierCounts;
  rewardItemId?: number;
  policyPlans: CollectablePolicyPlan[];
  revisit: CollectableRevisitInfo;
  policy: CollectablePolicyNode;
  calculationTime: number;
  debug?: CollectableSolverDebugInfo;
}

export type CollectableWorkerErrorType = 'memoCapacity' | 'memoAllocationFailed';

export interface CollectableWorkerErrorResponse {
  errorType: CollectableWorkerErrorType;
  memoCapacityPower?: number;
  nextMemoCapacityPower?: number;
}

export type CollectableWorkerResponse = CollectableSolverResult | CollectableWorkerErrorResponse;

export interface StoredCollectablePolicyBranch {
  labelKey: string;
  conditionKey: string;
  probability: number;
  actionKind?: CollectableActionKind;
}

export interface StoredCollectablePolicy {
  rootAction: CollectableActionSummary;
  previewBranches: StoredCollectablePolicyBranch[];
}
