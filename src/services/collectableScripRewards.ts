import { getItemIcon } from './gameData';

export type CollectableScripKind = 'purple' | 'orange' | 'unknown';

type CollectableScripRewardMeta = {
  kind: CollectableScripKind;
  itemId?: number;
  labelKey: string;
  iconUrl: string;
};

const PURPLE_GATHERERS_SCRIP_IDS = new Set([33914]);
const ORANGE_GATHERERS_SCRIP_IDS = new Set([41785]);

export function getCollectableScripRewardMeta(rewardItemId?: number): CollectableScripRewardMeta {
  if (rewardItemId && PURPLE_GATHERERS_SCRIP_IDS.has(rewardItemId)) {
    return {
      kind: 'purple',
      itemId: rewardItemId,
      labelKey: 'collectableSolver.results.scripUnits.purple',
      iconUrl: getItemIcon(rewardItemId)
    };
  }

  if (rewardItemId && ORANGE_GATHERERS_SCRIP_IDS.has(rewardItemId)) {
    return {
      kind: 'orange',
      itemId: rewardItemId,
      labelKey: 'collectableSolver.results.scripUnits.orange',
      iconUrl: getItemIcon(rewardItemId)
    };
  }

  return {
    kind: 'unknown',
    labelKey: 'collectableSolver.results.scripUnits.unknown',
    iconUrl: ''
  };
}
