import { getActionIcon, getActionName } from './gameData';
import type { CollectableActionKind } from '../types/collectable';

type JobType = 'miner' | 'botanist';

interface CollectableActionDefinition {
  kind: CollectableActionKind;
  minerActionId: number;
  botanistActionId: number;
  fallbackName: string;
  gpCost: number;
}

export const COLLECTABLE_ACTION_DEFINITIONS: Record<CollectableActionKind, CollectableActionDefinition> = {
  collect: {
    kind: 'collect',
    minerActionId: 240,
    botanistActionId: 240,
    fallbackName: '收藏品採集',
    gpCost: 0
  },
  scour: {
    kind: 'scour',
    minerActionId: 22182,
    botanistActionId: 22182,
    fallbackName: '提煉',
    gpCost: 0
  },
  meticulous: {
    kind: 'meticulous',
    minerActionId: 22184,
    botanistActionId: 22188,
    fallbackName: '慎重提煉',
    gpCost: 0
  },
  scrutiny: {
    kind: 'scrutiny',
    minerActionId: 22185,
    botanistActionId: 22189,
    fallbackName: '集中檢查',
    gpCost: 200
  },
  collectorsFocus: {
    kind: 'collectorsFocus',
    minerActionId: 21205,
    botanistActionId: 21205,
    fallbackName: '價值矚目',
    gpCost: 100
  },
  primingTouch: {
    kind: 'primingTouch',
    minerActionId: 34871,
    botanistActionId: 34871,
    fallbackName: '預備碰觸',
    gpCost: 100
  },
  successI: {
    kind: 'successI',
    minerActionId: 235,
    botanistActionId: 218,
    fallbackName: '敏銳視野',
    gpCost: 50
  },
  successII: {
    kind: 'successII',
    minerActionId: 237,
    botanistActionId: 220,
    fallbackName: '敏銳視野II',
    gpCost: 100
  },
  successIII: {
    kind: 'successIII',
    minerActionId: 295,
    botanistActionId: 294,
    fallbackName: '敏銳視野III',
    gpCost: 250
  },
  nextCollectSuccess: {
    kind: 'nextCollectSuccess',
    minerActionId: 4072,
    botanistActionId: 4086,
    fallbackName: '明晰視野',
    gpCost: 50
  },
  restoreIntegrity: {
    kind: 'restoreIntegrity',
    minerActionId: 232,
    botanistActionId: 215,
    fallbackName: '石工之理',
    gpCost: 300
  },
  wiseToTheWorld: {
    kind: 'wiseToTheWorld',
    minerActionId: 26521,
    botanistActionId: 26521,
    fallbackName: '理智同興',
    gpCost: 0
  }
};

export const COLLECTABLE_ACTION_IDS = new Set(
  Object.values(COLLECTABLE_ACTION_DEFINITIONS).flatMap((action) => [
    action.minerActionId,
    action.botanistActionId
  ])
);

export function getCollectableActionId(kind: CollectableActionKind, jobType: JobType): number {
  const action = COLLECTABLE_ACTION_DEFINITIONS[kind];
  return jobType === 'miner' ? action.minerActionId : action.botanistActionId;
}

export function getCollectableActionName(kind: CollectableActionKind, jobType: JobType): string {
  const actionId = getCollectableActionId(kind, jobType);
  return getActionName(actionId) || COLLECTABLE_ACTION_DEFINITIONS[kind].fallbackName;
}

export function getCollectableActionIcon(kind: CollectableActionKind, jobType: JobType): string {
  return getActionIcon(getCollectableActionId(kind, jobType));
}
