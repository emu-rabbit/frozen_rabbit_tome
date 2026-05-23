import type { CollectableObjective, CollectableTierScoreWeights } from '../types/collectable';
import type { NodeBonuses, PlayerStats } from '../types/game';

export interface NumericInputLimit {
  min: number;
  max: number;
}

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  level: 100,
  gathering: 5345,
  perception: 5173,
  gp: 930
};

export const DEFAULT_NODE_BONUSES: NodeBonuses = {
  baseIntegrity: 4,
  gatheringCount: 0,
  yieldCount: 0,
  extraRate: 0
};

export const PLAYER_INPUT_LIMITS = {
  level: { min: 1, max: 100 },
  gathering: { min: 0, max: 9999 },
  perception: { min: 0, max: 9999 },
  gp: { min: 0, max: 4095 }
} as const satisfies Record<keyof PlayerStats, NumericInputLimit>;

export const NODE_BONUS_INPUT_LIMITS = {
  baseIntegrity: { min: 0, max: 15 },
  gatheringCount: { min: 0, max: 10 },
  yieldCount: { min: 0, max: 50 },
  extraRate: { min: 0, max: 100 }
} as const satisfies Record<keyof NodeBonuses, NumericInputLimit>;

export const COLLECTABLE_INPUT_LIMITS = {
  collectability: { min: 0, max: 1000 },
  successBonus: { min: 0, max: 127 },
  nextCollectSuccessBonus: { min: 0, max: 31 },
  customTierScore: { min: 0, max: 9999 }
} as const satisfies Record<string, NumericInputLimit>;

export const WASM_PACKED_STATE_LIMITS = {
  gp: { min: 0, max: 4095 },
  integrity: { min: 0, max: 15 },
  collectability: { min: 0, max: 1023 },
  successBonus: { min: 0, max: 127 },
  nextCollectSuccessBonus: { min: 0, max: 31 }
} as const satisfies Record<string, NumericInputLimit>;

export function clampIntegerInput(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(numeric)));
}

export function maxGatheringCountForBaseIntegrity(baseIntegrity: unknown): number {
  const base = clampIntegerInput(
    baseIntegrity,
    NODE_BONUS_INPUT_LIMITS.baseIntegrity.min,
    NODE_BONUS_INPUT_LIMITS.baseIntegrity.max,
    DEFAULT_NODE_BONUSES.baseIntegrity
  );
  return Math.max(
    NODE_BONUS_INPUT_LIMITS.gatheringCount.min,
    Math.min(NODE_BONUS_INPUT_LIMITS.gatheringCount.max, WASM_PACKED_STATE_LIMITS.integrity.max - base)
  );
}

export function normalizePlayerStats(
  stats: Partial<PlayerStats> | undefined,
  fallback: PlayerStats = DEFAULT_PLAYER_STATS
): PlayerStats {
  return {
    level: clampIntegerInput(stats?.level, PLAYER_INPUT_LIMITS.level.min, PLAYER_INPUT_LIMITS.level.max, fallback.level),
    gathering: clampIntegerInput(stats?.gathering, PLAYER_INPUT_LIMITS.gathering.min, PLAYER_INPUT_LIMITS.gathering.max, fallback.gathering),
    perception: clampIntegerInput(stats?.perception, PLAYER_INPUT_LIMITS.perception.min, PLAYER_INPUT_LIMITS.perception.max, fallback.perception),
    gp: clampIntegerInput(stats?.gp, PLAYER_INPUT_LIMITS.gp.min, PLAYER_INPUT_LIMITS.gp.max, fallback.gp)
  };
}

export function normalizeNodeBonuses(
  nodeBonuses: Partial<NodeBonuses> | undefined,
  fallback: NodeBonuses = DEFAULT_NODE_BONUSES
): NodeBonuses {
  const baseIntegrity = clampIntegerInput(
    nodeBonuses?.baseIntegrity,
    NODE_BONUS_INPUT_LIMITS.baseIntegrity.min,
    NODE_BONUS_INPUT_LIMITS.baseIntegrity.max,
    fallback.baseIntegrity
  );
  const gatheringCountMax = maxGatheringCountForBaseIntegrity(baseIntegrity);

  return {
    baseIntegrity,
    gatheringCount: clampIntegerInput(
      nodeBonuses?.gatheringCount,
      NODE_BONUS_INPUT_LIMITS.gatheringCount.min,
      gatheringCountMax,
      Math.min(fallback.gatheringCount, gatheringCountMax)
    ),
    yieldCount: clampIntegerInput(
      nodeBonuses?.yieldCount,
      NODE_BONUS_INPUT_LIMITS.yieldCount.min,
      NODE_BONUS_INPUT_LIMITS.yieldCount.max,
      fallback.yieldCount
    ),
    extraRate: clampIntegerInput(
      nodeBonuses?.extraRate,
      NODE_BONUS_INPUT_LIMITS.extraRate.min,
      NODE_BONUS_INPUT_LIMITS.extraRate.max,
      fallback.extraRate
    )
  };
}

export function normalizeCollectableTierScoreWeights(
  weights: CollectableTierScoreWeights | undefined,
  fallback: Required<CollectableTierScoreWeights>
): Required<CollectableTierScoreWeights> {
  const limit = COLLECTABLE_INPUT_LIMITS.customTierScore;
  return {
    none: clampIntegerInput(weights?.none, limit.min, limit.max, fallback.none),
    low: clampIntegerInput(weights?.low, limit.min, limit.max, fallback.low),
    mid: clampIntegerInput(weights?.mid, limit.min, limit.max, fallback.mid),
    high: clampIntegerInput(weights?.high, limit.min, limit.max, fallback.high)
  };
}

export function normalizeCollectableObjective(objective: CollectableObjective): CollectableObjective {
  if (objective.kind !== 'tierScore') return objective;

  return {
    ...objective,
    tierWeights: normalizeCollectableTierScoreWeights(objective.tierWeights, {
      none: 0,
      low: 1,
      mid: 3,
      high: 8
    })
  };
}
