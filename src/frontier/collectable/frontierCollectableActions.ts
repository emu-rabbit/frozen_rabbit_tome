import type { FrontierCollectableActionKind } from './frontierCollectableTypes';
import { getActionIcon, getActionName } from '../../services/gameData';

interface FrontierCollectableActionDefinition {
  kind: FrontierCollectableActionKind;
  gpCost: number;
  minLevel: number;
}

export const FRONTIER_COLLECTABLE_ACTION_DEFINITIONS: Record<FrontierCollectableActionKind, FrontierCollectableActionDefinition> = {
  collect: { kind: 'collect', gpCost: 0, minLevel: 50 },
  scour: { kind: 'scour', gpCost: 0, minLevel: 50 },
  brazen: { kind: 'brazen', gpCost: 0, minLevel: 50 },
  meticulous: { kind: 'meticulous', gpCost: 0, minLevel: 50 },
  scrutiny: { kind: 'scrutiny', gpCost: 200, minLevel: 50 },
  collectorsFocus: { kind: 'collectorsFocus', gpCost: 100, minLevel: 85 },
  primingTouch: { kind: 'primingTouch', gpCost: 100, minLevel: 95 },
  successI: { kind: 'successI', gpCost: 50, minLevel: 4 },
  successII: { kind: 'successII', gpCost: 100, minLevel: 5 },
  successIII: { kind: 'successIII', gpCost: 250, minLevel: 10 },
  nextCollectSuccess: { kind: 'nextCollectSuccess', gpCost: 50, minLevel: 23 },
  restoreIntegrity: { kind: 'restoreIntegrity', gpCost: 300, minLevel: 25 },
  wiseToTheWorld: { kind: 'wiseToTheWorld', gpCost: 0, minLevel: 90 }
};

export const frontierCollectableActionKinds = Object.keys(
  FRONTIER_COLLECTABLE_ACTION_DEFINITIONS
) as FrontierCollectableActionKind[];

const FRONTIER_COLLECTABLE_ACTION_IDS: Record<FrontierCollectableActionKind, { miner: number; botanist: number; fallback: string | Record<'miner' | 'botanist', string> }> = {
  collect: { miner: 240, botanist: 240, fallback: '收藏品採集' },
  scour: { miner: 22182, botanist: 22182, fallback: '提煉' },
  brazen: { miner: 22183, botanist: 22187, fallback: '大膽提煉' },
  meticulous: { miner: 22184, botanist: 22188, fallback: '慎重提煉' },
  scrutiny: { miner: 22185, botanist: 22189, fallback: '集中檢查' },
  collectorsFocus: { miner: 21205, botanist: 21205, fallback: '價值矚目' },
  primingTouch: { miner: 34871, botanist: 34871, fallback: '預備碰觸' },
  successI: { miner: 235, botanist: 218, fallback: { miner: '敏銳視野', botanist: '環境探知' } },
  successII: { miner: 237, botanist: 220, fallback: { miner: '敏銳視野II', botanist: '環境探知II' } },
  successIII: { miner: 295, botanist: 294, fallback: { miner: '敏銳視野III', botanist: '環境探知III' } },
  nextCollectSuccess: { miner: 4072, botanist: 4086, fallback: { miner: '明晰視野', botanist: '植被專精' } },
  restoreIntegrity: { miner: 232, botanist: 215, fallback: { miner: '石工之理', botanist: '農夫之智' } },
  wiseToTheWorld: { miner: 26521, botanist: 26521, fallback: '理智同興' }
};

export function getFrontierCollectableActionId(kind: FrontierCollectableActionKind, jobType: 'miner' | 'botanist') {
  return FRONTIER_COLLECTABLE_ACTION_IDS[kind][jobType];
}

export function getFrontierCollectableActionName(kind: FrontierCollectableActionKind, jobType: 'miner' | 'botanist') {
  const action = FRONTIER_COLLECTABLE_ACTION_IDS[kind];
  const actionId = action[jobType];
  const fallback = typeof action.fallback === 'string' ? action.fallback : action.fallback[jobType];
  const name = getActionName(actionId);
  return name && name !== `Action #${actionId}` ? name : fallback;
}

export function getFrontierCollectableActionIcon(kind: FrontierCollectableActionKind, jobType: 'miner' | 'botanist') {
  const actionId = getFrontierCollectableActionId(kind, jobType);
  return actionId > 0 ? getActionIcon(actionId) : '';
}
