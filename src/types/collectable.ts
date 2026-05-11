import type { NodeBonuses, PlayerStats } from './game';

export type CollectableObjectiveKind = 'scrip' | 'exp' | 'gil' | 'custom';

export interface CollectableRewardWeights {
  exp?: number;
  gil?: number;
  scrip?: number;
  items?: Record<number, number>;
}

export interface CollectableObjective {
  kind: CollectableObjectiveKind;
  weights?: CollectableRewardWeights;
}

export interface CollectableRewardVector {
  exp: number;
  gil: number;
  scrip: number;
  items: Record<number, number>;
}

export type CollectableRewardTierName = 'none' | 'low' | 'mid' | 'high';

export interface CollectableRewardTier {
  collectability: number;
  reward: CollectableRewardVector;
}

export interface CollectableRewardTable {
  itemId: number;
  source: 'collectables';
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
  midCollectability: number;
  highCollectability?: number;
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
  | 'wiseToTheWorld';

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

export interface CollectablePolicyBranch {
  labelKey: string;
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
  branches: CollectablePolicyBranch[];
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
  isTimedNode?: boolean;
  debugMode?: boolean;
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
    valueIncreaseRate: number;
    focusedValueIncreaseRate: number;
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
  statesSolved: number;
  memoHits: number;
  actionsEvaluated: number;
  candidateComparisons: number;
  terminalStates: number;
  branchCount: number;
}

export interface CollectableSolverDebugInfo {
  formulas: CollectableFormulaDebugInfo;
  search: CollectableSearchDebugInfo;
  limitations: string[];
  optimality: {
    method: 'dynamic-programming-policy-search';
    stateKeyFields: string[];
  };
}

export interface CollectableSolverResult {
  expectedScore: number;
  expectedReward: CollectableRewardVector;
  policy: CollectablePolicyNode;
  calculationTime: number;
  debug?: CollectableSolverDebugInfo;
}

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
