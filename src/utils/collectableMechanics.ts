import { calculateSuccessRate } from './gatheringMath';
import {
  COLLECTABILITY_CAP,
  COLLECTORS_STANDARD_PROC_RATES,
  applyRelicToolValueIncreaseBonus,
  calculateCollectableMeticulousGain,
  calculateCollectableScourGain,
  calculateCollectableScourValue,
  calculateFocusedValueIncreaseRate,
  calculateMeticulousProcRate,
  calculatePrimedMeticulousProcRate,
  calculateScrutinyMultiplier,
  calculateValueIncreaseRate,
  clampCollectability
} from './collectableMath';
import { COLLECTABLE_ACTION_DEFINITIONS } from '../services/collectableActions';
import type { CollectableActionKind } from '../types/collectable';
import type { NodeBonuses, PlayerStats } from '../types/game';

export interface CollectableMechanicsState {
  gp: number;
  integrity: number;
  collectability: number;
  scrutinyActive: boolean;
  collectorsFocusActive: boolean;
  primingTouchActive: boolean;
  standardActive: boolean;
  hasUsedCollectableAction: boolean;
  hasCollected: boolean;
  successBonus: number;
  successIActive: boolean;
  successIIActive: boolean;
  successIIIActive: boolean;
  nextCollectSuccessBonus: number;
  wiseToTheWorldActive: boolean;
}

export interface CollectableMechanicsContext {
  maxIntegrity: number;
  maxGp: number;
  level: number;
  baseSuccessRate: number;
  scourValue: number;
  valueIncreaseRate: number;
  focusedValueIncreaseRate: number;
  meticulousRate: number;
  primedMeticulousRate: number;
  scrutinyMultiplier: number;
  standardProcRate: number;
}

export interface CollectableMechanicsBuildRequest {
  stats: PlayerStats;
  baseValues: {
    Gathering: number;
    Perception: number;
  };
  itemLevel: number;
  nodeBonuses: NodeBonuses;
  isTimedNode?: boolean;
  hasRelicToolBonus?: boolean;
}

export interface CollectableActionTransition {
  state: CollectableMechanicsState;
  probability: number;
  labelKey: string;
  labelKeys?: string[];
  conditionKey: string;
}

export const COLLECTABLE_STATE_KEY_FIELDS = [
  'gp',
  'integrity',
  'collectability',
  'scrutinyActive',
  'collectorsFocusActive',
  'primingTouchActive',
  'standardActive',
  'hasUsedCollectableAction',
  'hasCollected',
  'successBonus',
  'successIActive',
  'successIIActive',
  'successIIIActive',
  'nextCollectSuccessBonus',
  'wiseToTheWorldActive'
] as const;

export const MIN_COLLECTABLE_LEVEL = 50;

export function createCollectableMechanicsContext(request: CollectableMechanicsBuildRequest): CollectableMechanicsContext {
  if (request.stats.level < MIN_COLLECTABLE_LEVEL) {
    throw new Error(`Collectable gathering requires level ${MIN_COLLECTABLE_LEVEL} or higher.`);
  }

  const baseValueIncreaseRate = calculateValueIncreaseRate(request.stats.gathering, request.baseValues.Gathering);
  const valueIncreaseRate = request.hasRelicToolBonus
    ? applyRelicToolValueIncreaseBonus(baseValueIncreaseRate)
    : baseValueIncreaseRate;
  const meticulousRate = calculateMeticulousProcRate(request.stats.gathering, request.baseValues.Gathering);

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
    scourValue: calculateCollectableScourValue(request.stats.gathering, request.baseValues.Gathering),
    valueIncreaseRate,
    focusedValueIncreaseRate: calculateFocusedValueIncreaseRate(valueIncreaseRate),
    meticulousRate,
    primedMeticulousRate: calculatePrimedMeticulousProcRate(meticulousRate),
    scrutinyMultiplier: calculateScrutinyMultiplier(request.stats.perception, request.baseValues.Perception),
    standardProcRate: getCollectableStandardProcRate(request.itemLevel, !!request.isTimedNode)
  };
}

export function createInitialCollectableMechanicsState(
  context: CollectableMechanicsContext,
  temporaryGp: number
): CollectableMechanicsState {
  return {
    gp: Math.min(context.maxGp, temporaryGp),
    integrity: context.maxIntegrity,
    collectability: 0,
    scrutinyActive: false,
    collectorsFocusActive: false,
    primingTouchActive: false,
    standardActive: false,
    hasUsedCollectableAction: false,
    hasCollected: false,
    successBonus: 0,
    successIActive: false,
    successIIActive: false,
    successIIIActive: false,
    nextCollectSuccessBonus: 0,
    wiseToTheWorldActive: false
  };
}

export function collectableStateKey(state: CollectableMechanicsState): string {
  return [
    state.gp,
    state.integrity,
    state.collectability,
    state.scrutinyActive ? 1 : 0,
    state.collectorsFocusActive ? 1 : 0,
    state.primingTouchActive ? 1 : 0,
    state.standardActive ? 1 : 0,
    state.hasUsedCollectableAction ? 1 : 0,
    state.hasCollected ? 1 : 0,
    state.successBonus,
    state.successIActive ? 1 : 0,
    state.successIIActive ? 1 : 0,
    state.successIIIActive ? 1 : 0,
    state.nextCollectSuccessBonus,
    state.wiseToTheWorldActive ? 1 : 0
  ].join('|');
}

export function collectableDecisionKey(
  state: CollectableMechanicsState,
  pendingActions: CollectableActionKind[] = []
): string {
  return `${collectableStateKey(state)}|${pendingActions.join(',')}`;
}

export function canUseCollectableAction(
  action: CollectableActionKind,
  state: CollectableMechanicsState,
  context: CollectableMechanicsContext
): boolean {
  const definition = COLLECTABLE_ACTION_DEFINITIONS[action];
  const gpCost = definition.gpCost;
  if (context.level < definition.minLevel) return false;
  if (state.gp < gpCost) return false;

  if (action === 'revisitCheck') return false;
  if (action === 'collect') return state.integrity > 0;
  if (action === 'scour' || action === 'meticulous') return state.integrity > 0 && state.collectability < COLLECTABILITY_CAP;
  if (action === 'scrutiny') return state.collectability < COLLECTABILITY_CAP && !state.scrutinyActive;
  if (action === 'collectorsFocus') return state.collectability < COLLECTABILITY_CAP && !state.collectorsFocusActive;
  if (action === 'primingTouch') return state.collectability < COLLECTABILITY_CAP && !state.primingTouchActive;
  if (action === 'successI') return context.baseSuccessRate + state.successBonus < 100 && !state.successIActive;
  if (action === 'successII') return context.baseSuccessRate + state.successBonus < 100 && !state.successIIActive;
  if (action === 'successIII') return context.baseSuccessRate + state.successBonus < 100 && !state.successIIIActive;
  if (action === 'nextCollectSuccess') return context.baseSuccessRate + state.successBonus < 100 && state.nextCollectSuccessBonus === 0;
  if (action === 'restoreIntegrity') return state.integrity < context.maxIntegrity;
  if (action === 'wiseToTheWorld') return state.wiseToTheWorldActive && state.integrity < context.maxIntegrity;

  return false;
}

export function applyCollectableAction(
  action: CollectableActionKind,
  state: CollectableMechanicsState,
  context: CollectableMechanicsContext
): CollectableActionTransition[] {
  if (!canUseCollectableAction(action, state, context)) {
    throw new Error(
      `Illegal collectable action "${action}" for level ${context.level}, GP ${state.gp}, integrity ${state.integrity}, collectability ${state.collectability}.`
    );
  }

  if (action === 'collect') return applyCollect(state, context);
  if (action === 'scour' || action === 'meticulous') return applyRefine(action, state, context);
  if (action === 'restoreIntegrity') return applyRestoreIntegrity(state, context);
  if (action === 'wiseToTheWorld') {
    return [{
      state: {
        ...state,
        integrity: Math.min(context.maxIntegrity, state.integrity + 1),
        wiseToTheWorldActive: false
      },
      probability: 1,
      labelKey: 'collectableSolver.branches.integrityRestored',
      conditionKey: 'collectableSolver.conditions.integrityRestored'
    }];
  }

  return [{
    state: {
      ...state,
      ...getBuffPatch(action, state),
      gp: state.gp - COLLECTABLE_ACTION_DEFINITIONS[action].gpCost
    },
    probability: 1,
    labelKey: 'collectableSolver.branches.applied',
    conditionKey: 'collectableSolver.conditions.always'
  }];
}

export function gpPerCollect(level: number): number {
  return level >= 70 ? 6 : 5;
}

export function getCollectableStandardProcRate(itemLevel: number, isTimedNode: boolean): number {
  if (itemLevel === 55) return COLLECTORS_STANDARD_PROC_RATES.level55;
  if (isTimedNode) return COLLECTORS_STANDARD_PROC_RATES.timed;
  return COLLECTORS_STANDARD_PROC_RATES.regular;
}

function applyCollect(
  state: CollectableMechanicsState,
  context: CollectableMechanicsContext
): CollectableActionTransition[] {
  const successRate = Math.min(100, Math.max(0, context.baseSuccessRate + state.successBonus + state.nextCollectSuccessBonus)) / 100;
  const successState = {
    ...state,
    gp: Math.min(context.maxGp, state.gp + gpPerCollect(context.level)),
    integrity: state.integrity - 1,
    hasUsedCollectableAction: true,
    hasCollected: true,
    nextCollectSuccessBonus: 0
  };
  const failedState = {
    ...state,
    integrity: state.integrity - 1,
    hasUsedCollectableAction: true,
    hasCollected: true,
    nextCollectSuccessBonus: 0
  };

  return [
    {
      state: successState,
      probability: successRate,
      labelKey: 'collectableSolver.branches.collectSuccess',
      conditionKey: 'collectableSolver.conditions.collectSuccess'
    },
    {
      state: failedState,
      probability: 1 - successRate,
      labelKey: 'collectableSolver.branches.collectFailed',
      conditionKey: 'collectableSolver.conditions.collectFailed'
    }
  ].filter((branch) => branch.probability > 0);
}

function applyRefine(
  action: 'scour' | 'meticulous',
  state: CollectableMechanicsState,
  context: CollectableMechanicsContext
): CollectableActionTransition[] {
  const valueRate = (state.collectorsFocusActive ? context.focusedValueIncreaseRate : context.valueIncreaseRate) / 100;
  const valueBranches = [
    { valueIncrease: false, probability: 1 - valueRate, labelKey: 'collectableSolver.branches.valueNormal' },
    { valueIncrease: true, probability: valueRate, labelKey: 'collectableSolver.branches.valueIncreased' }
  ].filter((branch) => branch.probability > 0);
  const saveRate = (state.primingTouchActive ? context.primedMeticulousRate : context.meticulousRate) / 100;
  const durabilityBranches = action === 'meticulous'
    ? [
        {
          integrityCost: 0,
          probability: saveRate,
          labelKey: 'collectableSolver.branches.meticulousSaved'
        },
        {
          integrityCost: 1,
          probability: 1 - saveRate,
          labelKey: 'collectableSolver.branches.meticulousConsumed'
        }
      ].filter((branch) => branch.probability > 0)
    : [{ integrityCost: 1, probability: 1, labelKey: 'collectableSolver.branches.integrityConsumed' }];
  const branches: CollectableActionTransition[] = [];

  valueBranches.forEach((valueBranch) => {
    durabilityBranches.forEach((durabilityBranch) => {
      const gain = action === 'scour'
        ? calculateCollectableScourGain({
            scourValue: context.scourValue,
            scrutinyMultiplier: context.scrutinyMultiplier,
            scrutinyActive: state.scrutinyActive,
            valueIncrease: valueBranch.valueIncrease
          })
        : calculateCollectableMeticulousGain({
            scourValue: context.scourValue,
            scrutinyMultiplier: context.scrutinyMultiplier,
            scrutinyActive: state.scrutinyActive,
            standardActive: state.standardActive,
            valueIncrease: valueBranch.valueIncrease
          });
      const nextBase = {
        ...state,
        collectability: clampCollectability(state.collectability + gain),
        integrity: state.integrity - durabilityBranch.integrityCost,
        scrutinyActive: false,
        collectorsFocusActive: false,
        primingTouchActive: action === 'meticulous' ? false : state.primingTouchActive,
        standardActive: action === 'meticulous' ? false : state.standardActive,
        hasUsedCollectableAction: true
      };
      const baseProbability = valueBranch.probability * durabilityBranch.probability;
      const labelKeys = [valueBranch.labelKey, durabilityBranch.labelKey];
      const canProcStandard = nextBase.integrity > 0
        && nextBase.collectability < COLLECTABILITY_CAP
        && !nextBase.standardActive
        && context.standardProcRate > 0;

      if (!canProcStandard) {
        branches.push({
          state: nextBase,
          probability: baseProbability,
          labelKey: valueBranch.labelKey,
          labelKeys,
          conditionKey: 'collectableSolver.conditions.refineOutcome'
        });
        return;
      }

      branches.push({
        state: {
          ...nextBase,
          standardActive: true
        },
        probability: baseProbability * context.standardProcRate,
        labelKey: 'collectableSolver.branches.standardProc',
        labelKeys: [...labelKeys, 'collectableSolver.branches.standardProc'],
        conditionKey: 'collectableSolver.conditions.standardProc'
      });
      branches.push({
        state: nextBase,
        probability: baseProbability * (1 - context.standardProcRate),
        labelKey: 'collectableSolver.branches.standardNoProc',
        labelKeys: [...labelKeys, 'collectableSolver.branches.standardNoProc'],
        conditionKey: 'collectableSolver.conditions.standardNoProc'
      });
    });
  });

  return branches.filter((branch) => branch.probability > 0);
}

function applyRestoreIntegrity(
  state: CollectableMechanicsState,
  context: CollectableMechanicsContext
): CollectableActionTransition[] {
  const restoredState = {
    ...state,
    gp: state.gp - 300,
    integrity: Math.min(context.maxIntegrity, state.integrity + 1)
  };

  if (context.level < 90) {
    return [{
      state: restoredState,
      probability: 1,
      labelKey: 'collectableSolver.branches.integrityRestored',
      conditionKey: 'collectableSolver.conditions.integrityRestored'
    }];
  }

  return [
    {
      state: { ...restoredState, wiseToTheWorldActive: true },
      probability: 0.5,
      labelKey: 'collectableSolver.branches.wiseProc',
      conditionKey: 'collectableSolver.conditions.wiseProc'
    },
    {
      state: restoredState,
      probability: 0.5,
      labelKey: 'collectableSolver.branches.wiseNoProc',
      conditionKey: 'collectableSolver.conditions.wiseNoProc'
    }
  ];
}

function getBuffPatch(
  action: CollectableActionKind,
  state: CollectableMechanicsState
): Partial<CollectableMechanicsState> {
  if (action === 'scrutiny') return { scrutinyActive: true };
  if (action === 'collectorsFocus') return { collectorsFocusActive: true };
  if (action === 'primingTouch') return { primingTouchActive: true };
  if (action === 'successI') return { successIActive: true, successBonus: state.successBonus + 5 };
  if (action === 'successII') return { successIIActive: true, successBonus: state.successBonus + 15 };
  if (action === 'successIII') return { successIIIActive: true, successBonus: state.successBonus + 50 };
  if (action === 'nextCollectSuccess') return { nextCollectSuccessBonus: 15 };
  return {};
}
