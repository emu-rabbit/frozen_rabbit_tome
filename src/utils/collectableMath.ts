import type {
  CollectableObjective,
  CollectableRewardTable,
  CollectableRewardTierName,
  CollectableRewardVector
} from '../types/collectable';

export const COLLECTABILITY_CAP = 1000;
export const RELIC_TOOL_VALUE_INCREASE_BONUS = 20;
export const COLLECTORS_STANDARD_PROC_RATES = {
  level55: 0,
  regular: 0.25,
  timed: 0.13,
  timedBelowCap: 0.25,
  ephemeral: 0.2
} as const;

function calculateScore(currentStat: number, baseValue: number): number {
  if (!baseValue) return 0;
  return Math.floor((100 * currentStat) / baseValue);
}

export function calculateCollectableActionScore(currentStat: number, baseValue: number): number {
  return Math.min(95, calculateScore(currentStat, baseValue));
}

export function calculateCollectableRateScore(currentStat: number, baseValue: number): number {
  return Math.min(100, calculateScore(currentStat, baseValue));
}

export function calculateCollectableScourValue(gathering: number, baseGathering: number): number {
  const actionScore = calculateCollectableActionScore(gathering, baseGathering);

  if (actionScore <= 66) return 150;
  if (actionScore <= 85) return Math.floor(((actionScore - 66) * 40) / 19 + 150);
  return actionScore - 85 + 190;
}

export function calculateValueIncreaseRate(gathering: number, baseGathering: number): number {
  const rateScore = calculateCollectableRateScore(gathering, baseGathering);

  if (rateScore <= 66) return 10;
  if (rateScore <= 85) return Math.floor(((rateScore - 66) * 10) / 19 + 10);
  return Math.floor(((rateScore - 85) * 20) / 15 + 20);
}

export function applyRelicToolValueIncreaseBonus(valueIncreaseRate: number): number {
  return Math.min(100, valueIncreaseRate + RELIC_TOOL_VALUE_INCREASE_BONUS);
}

export function calculateFocusedValueIncreaseRate(valueIncreaseRate: number): number {
  return Math.min(100, Math.floor((valueIncreaseRate * 175) / 100));
}

export function calculateMeticulousProcRate(gathering: number, baseGathering: number): number {
  const rateScore = calculateCollectableRateScore(gathering, baseGathering);

  if (rateScore <= 66) return 5;
  if (rateScore <= 85) return Math.floor(((rateScore - 66) * 5) / 19 + 5);
  return rateScore - 85 + 10;
}

export function calculatePrimedMeticulousProcRate(meticulousRate: number): number {
  return Math.min(100, meticulousRate * 2);
}

export function calculateScrutinyMultiplier(perception: number, basePerception: number): number {
  const actionScore = calculateCollectableActionScore(perception, basePerception);

  if (actionScore <= 66) return 90;
  if (actionScore <= 85) return Math.floor(((actionScore - 66) * 25) / 19 + 90);
  return actionScore - 85 + 115;
}

export function calculateScrutinyBonus(scourValue: number, scrutinyMultiplier: number): number {
  return Math.floor((scourValue * scrutinyMultiplier) / 100);
}

export function calculateCollectableScourGain(options: {
  scourValue: number;
  scrutinyActive: boolean;
  valueIncrease: boolean;
  scrutinyMultiplier: number;
}): number {
  const scrutinyBonus = options.scrutinyActive
    ? calculateScrutinyBonus(options.scourValue, options.scrutinyMultiplier)
    : 0;
  const valueIncreaseBonus = options.valueIncrease
    ? Math.floor((options.scourValue * 50) / 100)
    : 0;

  return options.scourValue + scrutinyBonus + valueIncreaseBonus;
}

export function calculateCollectableMeticulousGain(options: {
  scourValue: number;
  scrutinyActive: boolean;
  standardActive: boolean;
  valueIncrease: boolean;
  scrutinyMultiplier: number;
}): number {
  const baseGain = options.standardActive
    ? options.scourValue
    : Math.floor((options.scourValue * 75) / 100);
  const scrutinyBonus = options.scrutinyActive
    ? calculateScrutinyBonus(options.scourValue, options.scrutinyMultiplier)
    : 0;
  const valueIncreaseBonus = options.valueIncrease
    ? Math.floor((options.scourValue * 50) / 100)
    : 0;

  return baseGain + scrutinyBonus + valueIncreaseBonus;
}

export function clampCollectability(value: number): number {
  return Math.min(COLLECTABILITY_CAP, Math.max(0, value));
}

export function getCollectableRewardTier(
  collectability: number,
  rewardTable: CollectableRewardTable
): CollectableRewardTierName {
  const high = rewardTable.tiers.high;
  if (high && high.collectability > 0 && collectability >= high.collectability) return 'high';
  if (collectability >= rewardTable.tiers.mid.collectability) return 'mid';
  if (collectability >= rewardTable.tiers.low.collectability) return 'low';
  return 'none';
}

export function createZeroReward(): CollectableRewardVector {
  return {
    exp: 0,
    gil: 0,
    scrip: 0,
    items: {}
  };
}

export function addCollectableRewards(
  left: CollectableRewardVector,
  right: CollectableRewardVector,
  rightWeight = 1
): CollectableRewardVector {
  const items = { ...left.items };
  Object.entries(right.items).forEach(([itemId, quantity]) => {
    items[Number(itemId)] = (items[Number(itemId)] ?? 0) + quantity * rightWeight;
  });

  return {
    exp: left.exp + right.exp * rightWeight,
    gil: left.gil + right.gil * rightWeight,
    scrip: left.scrip + right.scrip * rightWeight,
    items
  };
}

export function scaleCollectableReward(
  reward: CollectableRewardVector,
  weight: number
): CollectableRewardVector {
  return addCollectableRewards(createZeroReward(), reward, weight);
}

export function getCollectableRewardForValue(
  collectability: number,
  rewardTable: CollectableRewardTable
): CollectableRewardVector {
  const tier = getCollectableRewardTier(collectability, rewardTable);
  if (tier === 'none') return createZeroReward();
  return rewardTable.tiers[tier]?.reward ?? createZeroReward();
}

export function scoreCollectableReward(
  reward: CollectableRewardVector,
  objective: CollectableObjective
): number {
  if (objective.kind === 'exp') return reward.exp;
  if (objective.kind === 'gil') return reward.gil;
  if (objective.kind === 'scrip') return reward.scrip;

  const weights = objective.weights ?? {};
  const itemScore = Object.entries(weights.items ?? {}).reduce((sum, [itemId, weight]) => (
    sum + (reward.items[Number(itemId)] ?? 0) * weight
  ), 0);

  return reward.exp * (weights.exp ?? 0)
    + reward.gil * (weights.gil ?? 0)
    + reward.scrip * (weights.scrip ?? 0)
    + itemScore;
}
