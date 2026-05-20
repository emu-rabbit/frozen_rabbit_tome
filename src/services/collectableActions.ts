import { getActionIcon, getActionName } from './gameData';
import type { CollectableActionKind } from '../types/collectable';

type JobType = 'miner' | 'botanist';

const REVISIT_TRAIT_ICON_URLS: Record<JobType, string> = {
  miner: 'https://xivapi.com/i/005000/005446.png',
  botanist: 'https://xivapi.com/i/005000/005471.png'
};

interface CollectableActionDefinition {
  kind: CollectableActionKind;
  minerActionId: number;
  botanistActionId: number;
  fallbackName: string | Record<JobType, string>;
  gpCost: number;
  minLevel: number;
}

export const COLLECTABLE_ACTION_DEFINITIONS: Record<CollectableActionKind, CollectableActionDefinition> = {
  collect: {
    kind: 'collect',
    minerActionId: 240,
    botanistActionId: 240,
    fallbackName: '收藏品採集',
    gpCost: 0,
    minLevel: 50
  },
  scour: {
    kind: 'scour',
    minerActionId: 22182,
    botanistActionId: 22182,
    fallbackName: '提煉',
    gpCost: 0,
    minLevel: 50
  },
  meticulous: {
    kind: 'meticulous',
    minerActionId: 22184,
    botanistActionId: 22188,
    fallbackName: '慎重提煉',
    gpCost: 0,
    minLevel: 50
  },
  scrutiny: {
    kind: 'scrutiny',
    minerActionId: 22185,
    botanistActionId: 22189,
    fallbackName: '集中檢查',
    gpCost: 200,
    minLevel: 50
  },
  collectorsFocus: {
    kind: 'collectorsFocus',
    minerActionId: 21205,
    botanistActionId: 21205,
    fallbackName: '價值矚目',
    gpCost: 100,
    minLevel: 85
  },
  primingTouch: {
    kind: 'primingTouch',
    minerActionId: 34871,
    botanistActionId: 34871,
    fallbackName: '預備碰觸',
    gpCost: 100,
    minLevel: 95
  },
  successI: {
    kind: 'successI',
    minerActionId: 235,
    botanistActionId: 218,
    fallbackName: '敏銳視野',
    gpCost: 50,
    minLevel: 4
  },
  successII: {
    kind: 'successII',
    minerActionId: 237,
    botanistActionId: 220,
    fallbackName: '敏銳視野II',
    gpCost: 100,
    minLevel: 5
  },
  successIII: {
    kind: 'successIII',
    minerActionId: 295,
    botanistActionId: 294,
    fallbackName: '敏銳視野III',
    gpCost: 250,
    minLevel: 10
  },
  nextCollectSuccess: {
    kind: 'nextCollectSuccess',
    minerActionId: 4072,
    botanistActionId: 4086,
    fallbackName: '明晰視野',
    gpCost: 50,
    minLevel: 23
  },
  restoreIntegrity: {
    kind: 'restoreIntegrity',
    minerActionId: 232,
    botanistActionId: 215,
    fallbackName: {
      miner: '石工之理',
      botanist: '農夫之智'
    },
    gpCost: 300,
    minLevel: 25
  },
  wiseToTheWorld: {
    kind: 'wiseToTheWorld',
    minerActionId: 26521,
    botanistActionId: 26521,
    fallbackName: '理智同興',
    gpCost: 0,
    minLevel: 90
  },
  revisitCheck: {
    kind: 'revisitCheck',
    minerActionId: 0,
    botanistActionId: 0,
    fallbackName: '確認再起',
    gpCost: 0,
    minLevel: 91
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

export function getCollectableActionMinLevel(kind: CollectableActionKind): number {
  return COLLECTABLE_ACTION_DEFINITIONS[kind].minLevel;
}

export function getCollectableActionName(kind: CollectableActionKind, jobType: JobType): string {
  const actionId = getCollectableActionId(kind, jobType);
  const fallbackName = COLLECTABLE_ACTION_DEFINITIONS[kind].fallbackName;
  const actionName = getActionName(actionId);
  const resolvedFallbackName = typeof fallbackName === 'string' ? fallbackName : fallbackName[jobType];
  return actionName && actionName !== `Action #${actionId}` ? actionName : resolvedFallbackName;
}

export function getCollectableActionIcon(kind: CollectableActionKind, jobType: JobType): string {
  if (kind === 'revisitCheck') return REVISIT_TRAIT_ICON_URLS[jobType];

  const actionId = getCollectableActionId(kind, jobType);
  return actionId > 0 ? getActionIcon(actionId) : '';
}
