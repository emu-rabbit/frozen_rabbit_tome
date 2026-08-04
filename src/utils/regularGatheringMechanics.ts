import { calculateBoonChance, calculateBountifulYield, calculateSuccessRate } from './gatheringMath';
import type { NodeBonuses, PlayerStats } from '../types/game';

export type RegularGatheringActionKind =
  | 'gather'
  | 'successI'
  | 'successII'
  | 'successIII'
  | 'giftI'
  | 'giftII'
  | 'clearVision'
  | 'bountifulI'
  | 'bountifulII'
  | 'restore'
  | 'wise'
  | 'kingI'
  | 'kingII'
  | 'tidings';

export interface RegularGatheringMechanicsState {
  gp: number;
  integrity: number;
  hasGathered: boolean;
  successBonus: number;
  successIActive: boolean;
  successIIActive: boolean;
  successIIIActive: boolean;
  boonBonus: number;
  giftIActive: boolean;
  giftIIActive: boolean;
  allYieldBonus: number;
  tidings: boolean;
  nextSuccessBonus: number;
  nextYieldBonus: number;
  wiseReady: boolean;
}

export interface RegularGatheringMechanicsContext {
  maxIntegrity: number;
  maxGp: number;
  level: number;
  baseSuccessRate: number;
  baseBoonChance: number;
  bountifulYield: number;
  nodeYieldBonus: number;
  nodeBoonBonus: number;
}

export interface RegularGatheringMechanicsBuildRequest {
  stats: PlayerStats;
  baseValues: {
    Gathering: number;
    Perception: number;
  };
  itemLevel: number;
  nodeBonuses: NodeBonuses;
}

export interface RegularGatheringActionTransition {
  state: RegularGatheringMechanicsState;
  probability: number;
  yieldDelta: number;
  labelKey: string;
}

export const REGULAR_GATHERING_STATE_KEY_FIELDS = [
  'gp',
  'integrity',
  'hasGathered',
  'successBonus',
  'successIActive',
  'successIIActive',
  'successIIIActive',
  'boonBonus',
  'giftIActive',
  'giftIIActive',
  'allYieldBonus',
  'tidings',
  'nextSuccessBonus',
  'nextYieldBonus',
  'wiseReady'
] as const;

const BOON_CAP = 100;
const SUCCESS_CAP = 100;
const REGULAR_GATHERING_ACTION_MIN_LEVELS: Record<RegularGatheringActionKind, number> = {
  gather: 1,
  successI: 4,
  successII: 5,
  successIII: 10,
  giftI: 15,
  giftII: 50,
  clearVision: 23,
  bountifulI: 24,
  bountifulII: 68,
  restore: 25,
  wise: 90,
  kingI: 30,
  kingII: 40,
  tidings: 81
};

export function createRegularGatheringMechanicsContext(
  request: RegularGatheringMechanicsBuildRequest
): RegularGatheringMechanicsContext {
  return {
    maxIntegrity: request.nodeBonuses.baseIntegrity + request.nodeBonuses.gatheringCount,
    maxGp: request.stats.gp,
    level: request.stats.level,
    baseSuccessRate: calculateSuccessRate(
      request.stats.gathering,
      request.baseValues.Gathering,
      request.stats.level,
      request.itemLevel
    ),
    baseBoonChance: calculateBoonChance(request.stats.perception, request.baseValues.Perception),
    bountifulYield: calculateBountifulYield(request.stats.gathering, request.baseValues.Gathering),
    nodeYieldBonus: request.nodeBonuses.yieldCount,
    nodeBoonBonus: request.nodeBonuses.extraRate
  };
}

export function createInitialRegularGatheringMechanicsState(
  context: RegularGatheringMechanicsContext,
  temporaryGp: number
): RegularGatheringMechanicsState {
  return {
    gp: Math.min(context.maxGp, temporaryGp),
    integrity: context.maxIntegrity,
    hasGathered: false,
    successBonus: 0,
    successIActive: false,
    successIIActive: false,
    successIIIActive: false,
    boonBonus: 0,
    giftIActive: false,
    giftIIActive: false,
    allYieldBonus: 0,
    tidings: false,
    nextSuccessBonus: 0,
    nextYieldBonus: 0,
    wiseReady: false
  };
}

export function regularGatheringStateKey(state: RegularGatheringMechanicsState): string {
  return [
    state.gp,
    state.integrity,
    state.hasGathered ? 1 : 0,
    state.successBonus,
    state.successIActive ? 1 : 0,
    state.successIIActive ? 1 : 0,
    state.successIIIActive ? 1 : 0,
    state.boonBonus,
    state.giftIActive ? 1 : 0,
    state.giftIIActive ? 1 : 0,
    state.allYieldBonus,
    state.tidings ? 1 : 0,
    state.nextSuccessBonus,
    state.nextYieldBonus,
    state.wiseReady ? 1 : 0
  ].join('|');
}

export function canUseRegularGatheringAction(
  action: RegularGatheringActionKind,
  state: RegularGatheringMechanicsState,
  context: RegularGatheringMechanicsContext
): boolean {
  if (context.level < REGULAR_GATHERING_ACTION_MIN_LEVELS[action]) return false;
  if (state.integrity <= 0) return false;

  if (action === 'gather') return true;
  if (action === 'wise') return state.integrity < context.maxIntegrity && state.wiseReady;
  if (action === 'restore') return state.integrity < context.maxIntegrity && state.gp >= 300;
  if (isWholeNodeAction(action) && state.hasGathered) return false;
  if (action === 'successI') return state.gp >= 50 && !state.successIActive && canRaiseSuccess(state, context);
  if (action === 'successII') return state.gp >= 100 && !state.successIIActive && canRaiseSuccess(state, context);
  if (action === 'successIII') return state.gp >= 250 && !state.successIIIActive && canRaiseSuccess(state, context);
  if (action === 'giftI') return state.gp >= 50 && !state.giftIActive && canRaiseBoon(state, context);
  if (action === 'giftII') return state.gp >= 100 && !state.giftIIActive && canRaiseBoon(state, context);
  if (action === 'clearVision') return state.gp >= 50 && state.nextSuccessBonus === 0 && canRaiseSuccess(state, context);
  if (action === 'bountifulI' || action === 'bountifulII') {
    return state.gp >= 100 && state.nextYieldBonus === 0 && context.baseSuccessRate + state.successBonus > 0;
  }
  if (action === 'kingI') return state.gp >= 400 && state.allYieldBonus === 0;
  if (action === 'kingII') return state.gp >= 500 && state.allYieldBonus === 0;
  if (action === 'tidings') {
    return state.gp >= 200 && !state.tidings && context.baseBoonChance + context.nodeBoonBonus + state.boonBonus > 0;
  }

  return false;
}

export function applyRegularGatheringAction(
  action: RegularGatheringActionKind,
  state: RegularGatheringMechanicsState,
  context: RegularGatheringMechanicsContext
): RegularGatheringActionTransition[] {
  if (!canUseRegularGatheringAction(action, state, context)) {
    throw new Error(
      `Illegal regular gathering action "${action}" for level ${context.level}, GP ${state.gp}, integrity ${state.integrity}.`
    );
  }

  if (action === 'gather') return applyGather(state, context);
  if (action === 'restore') return applyRestore(state, context);
  if (action === 'wise') {
    return [{
      state: {
        ...state,
        integrity: Math.min(context.maxIntegrity, state.integrity + 1),
        wiseReady: false
      },
      probability: 1,
      yieldDelta: 0,
      labelKey: 'regularGathering.branches.integrityRestored'
    }];
  }

  return [{
    state: {
      ...state,
      ...getBuffPatch(action, state, context),
      gp: state.gp - regularGatheringActionGpCost(action)
    },
    probability: 1,
    yieldDelta: 0,
    labelKey: 'regularGathering.branches.applied'
  }];
}

export function gpPerGather(level: number): number {
  return level >= 70 ? 6 : 5;
}

function applyGather(
  state: RegularGatheringMechanicsState,
  context: RegularGatheringMechanicsContext
): RegularGatheringActionTransition[] {
  const successRate = clampPercent(context.baseSuccessRate + state.successBonus + state.nextSuccessBonus, SUCCESS_CAP) / 100;
  const boonChance = clampPercent(context.baseBoonChance + context.nodeBoonBonus + state.boonBonus, BOON_CAP) / 100;
  const baseYield = 1 + context.nodeYieldBonus + state.allYieldBonus + state.nextYieldBonus;
  const boonYield = 1 + (state.tidings ? 1 : 0);
  const baseState = {
    ...state,
    integrity: state.integrity - 1,
    hasGathered: true,
    nextSuccessBonus: 0,
    nextYieldBonus: 0
  };
  const successState = {
    ...baseState,
    gp: Math.min(context.maxGp, state.gp + gpPerGather(context.level))
  };

  return [
    {
      state: baseState,
      probability: 1 - successRate,
      yieldDelta: 0,
      labelKey: 'regularGathering.branches.gatherFailed'
    },
    {
      state: successState,
      probability: successRate * (1 - boonChance),
      yieldDelta: baseYield,
      labelKey: 'regularGathering.branches.gatherSuccess'
    },
    {
      state: successState,
      probability: successRate * boonChance,
      yieldDelta: baseYield + boonYield,
      labelKey: 'regularGathering.branches.boonSuccess'
    }
  ].filter((branch) => branch.probability > 0);
}

function applyRestore(
  state: RegularGatheringMechanicsState,
  context: RegularGatheringMechanicsContext
): RegularGatheringActionTransition[] {
  const restored = {
    ...state,
    gp: state.gp - 300,
    integrity: Math.min(context.maxIntegrity, state.integrity + 1)
  };

  if (context.level < 90) {
    return [{
      state: restored,
      probability: 1,
      yieldDelta: 0,
      labelKey: 'regularGathering.branches.integrityRestored'
    }];
  }

  return [
    {
      state: { ...restored, wiseReady: true },
      probability: 0.5,
      yieldDelta: 0,
      labelKey: 'regularGathering.branches.wiseProc'
    },
    {
      state: { ...restored, wiseReady: false },
      probability: 0.5,
      yieldDelta: 0,
      labelKey: 'regularGathering.branches.wiseNoProc'
    }
  ];
}

function getBuffPatch(
  action: RegularGatheringActionKind,
  state: RegularGatheringMechanicsState,
  context: RegularGatheringMechanicsContext
): Partial<RegularGatheringMechanicsState> {
  if (action === 'successI') return { successBonus: state.successBonus + 5, successIActive: true };
  if (action === 'successII') return { successBonus: state.successBonus + 15, successIIActive: true };
  if (action === 'successIII') return { successBonus: state.successBonus + 50, successIIIActive: true };
  if (action === 'giftI') return { boonBonus: state.boonBonus + 10, giftIActive: true };
  if (action === 'giftII') return { boonBonus: state.boonBonus + 30, giftIIActive: true };
  if (action === 'clearVision') return { nextSuccessBonus: 15 };
  if (action === 'bountifulI') return { nextYieldBonus: 1 };
  if (action === 'bountifulII') return { nextYieldBonus: context.bountifulYield };
  if (action === 'kingI') return { allYieldBonus: 1 };
  if (action === 'kingII') return { allYieldBonus: 2 };
  if (action === 'tidings') return { tidings: true };
  return {};
}

export function regularGatheringActionGpCost(action: RegularGatheringActionKind): number {
  if (action === 'successI' || action === 'giftI' || action === 'clearVision') return 50;
  if (action === 'successII' || action === 'giftII' || action === 'bountifulI' || action === 'bountifulII') return 100;
  if (action === 'tidings') return 200;
  if (action === 'successIII') return 250;
  if (action === 'restore') return 300;
  if (action === 'kingI') return 400;
  if (action === 'kingII') return 500;
  return 0;
}

function isWholeNodeAction(action: RegularGatheringActionKind): boolean {
  return ['successI', 'successII', 'successIII', 'giftI', 'giftII', 'kingI', 'kingII', 'tidings'].includes(action);
}

function canRaiseSuccess(
  state: RegularGatheringMechanicsState,
  context: RegularGatheringMechanicsContext
): boolean {
  return context.baseSuccessRate > 1 && context.baseSuccessRate + state.successBonus < SUCCESS_CAP;
}

function canRaiseBoon(
  state: RegularGatheringMechanicsState,
  context: RegularGatheringMechanicsContext
): boolean {
  return context.baseBoonChance + context.nodeBoonBonus > 1
    && context.baseBoonChance + context.nodeBoonBonus + state.boonBonus < BOON_CAP;
}

function clampPercent(value: number, cap: number): number {
  return Math.min(cap, Math.max(0, value));
}
