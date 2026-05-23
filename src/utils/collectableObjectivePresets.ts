import { getCollectableScripRewardMeta } from '../services/collectableScripRewards';
import type {
  CollectableObjective,
  CollectableObjectivePresetId,
  CollectableRewardTable,
  CollectableTierScoreWeights
} from '../types/collectable';
import { normalizeCollectableTierScoreWeights } from '../config/inputLimits';

export type CollectableObjectiveOption = {
  id: CollectableObjectivePresetId;
  objective: CollectableObjective;
  labelKey: string;
  descKey: string;
  scripKind?: 'purple' | 'orange';
};

const HIGH_VALUE_WEIGHTS: CollectableTierScoreWeights = { none: 0, low: 0, mid: 1, high: 100 };
const MID_VALUE_WEIGHTS: CollectableTierScoreWeights = { none: 0, low: 1, mid: 100, high: 20 };
const LOW_VALUE_WEIGHTS: CollectableTierScoreWeights = { none: 0, low: 100, mid: 20, high: 10 };

export const DEFAULT_CUSTOM_TIER_WEIGHTS: Required<CollectableTierScoreWeights> = {
  none: 0,
  low: 1,
  mid: 3,
  high: 8
};

export function createTierScoreObjective(
  presetId: CollectableObjectivePresetId,
  tierWeights: CollectableTierScoreWeights
): CollectableObjective {
  return {
    kind: 'tierScore',
    presetId,
    tierWeights: normalizeCollectableTierScoreWeights(tierWeights, DEFAULT_CUSTOM_TIER_WEIGHTS)
  };
}

export function createScripObjective(): CollectableObjective {
  return { kind: 'scrip', presetId: 'scrip' };
}

export function getDefaultCollectableObjectivePresetId(
  rewardTable: CollectableRewardTable
): CollectableObjectivePresetId {
  const scripOption = getScripObjectiveOption(rewardTable);
  if (rewardTable.source === 'collectables' && scripOption) return 'scrip';
  return 'highValue';
}

export function createCollectableObjectiveOptions(
  rewardTable: CollectableRewardTable,
  customTierWeights: CollectableTierScoreWeights = DEFAULT_CUSTOM_TIER_WEIGHTS
): CollectableObjectiveOption[] {
  const options: CollectableObjectiveOption[] = [
    {
      id: 'highValue',
      objective: createTierScoreObjective('highValue', HIGH_VALUE_WEIGHTS),
      labelKey: 'collectableObjective.presets.highValue',
      descKey: 'collectableObjective.presetDescriptions.highValue'
    },
    {
      id: 'midValue',
      objective: createTierScoreObjective('midValue', MID_VALUE_WEIGHTS),
      labelKey: 'collectableObjective.presets.midValue',
      descKey: 'collectableObjective.presetDescriptions.midValue'
    },
    {
      id: 'lowValue',
      objective: createTierScoreObjective('lowValue', LOW_VALUE_WEIGHTS),
      labelKey: 'collectableObjective.presets.lowValue',
      descKey: 'collectableObjective.presetDescriptions.lowValue'
    }
  ];
  const scripOption = getScripObjectiveOption(rewardTable);

  if (scripOption) {
    options.push(scripOption);
  }

  options.push({
    id: 'customTier',
    objective: createTierScoreObjective('customTier', customTierWeights),
    labelKey: 'collectableObjective.presets.customTier',
    descKey: 'collectableObjective.presetDescriptions.customTier'
  });

  return options;
}

export function isTierCountObjective(objective?: CollectableObjective) {
  return objective?.kind === 'tierScore' && objective.presetId !== 'customTier';
}

export function isCustomTierObjective(objective?: CollectableObjective) {
  return objective?.kind === 'tierScore' && objective.presetId === 'customTier';
}

function getScripObjectiveOption(rewardTable: CollectableRewardTable): CollectableObjectiveOption | null {
  const meta = getCollectableScripRewardMeta(rewardTable.rewardItemId);
  if (meta.kind === 'unknown') return null;

  return {
    id: 'scrip',
    objective: createScripObjective(),
    labelKey: meta.kind === 'orange'
      ? 'collectableObjective.presets.orangeScrip'
      : 'collectableObjective.presets.purpleScrip',
    descKey: 'collectableObjective.presetDescriptions.scrip',
    scripKind: meta.kind
  };
}
