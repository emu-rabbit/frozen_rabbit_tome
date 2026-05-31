import { calculateScrutinyBonus } from './collectableMath';
import { createCooperativeScheduler, type CooperativeSchedulerOptions } from './cooperativeScheduler';
import {
  applyCollectableAction,
  canUseCollectableAction,
  collectableStateKey,
  gpPerCollect,
  type CollectableMechanicsContext,
  type CollectableMechanicsState
} from './collectableMechanics';
import type { CollectableActionKind } from '../types/collectable';

export type CollectableEffectMetricKind =
  | 'collectabilityGain'
  | 'integrityDelta'
  | 'scrutinyBonus'
  | 'valueIncreaseRate'
  | 'meticulousSaveRate'
  | 'collectSuccessBonus'
  | 'nextCollectSuccessBonus'
  | 'collectSuccessRate'
  | 'collectSuccessGp';

export interface CollectableEffectRange {
  min: number;
  max: number;
}

export interface CollectableEffectMetric {
  kind: CollectableEffectMetricKind;
  range?: CollectableEffectRange;
  value?: number;
  from?: number;
  to?: number;
  delta?: number;
}

export interface CollectableActionEffectPreview {
  action: CollectableActionKind;
  castableStateCount: number;
  sourceStateCount: number;
  metrics: CollectableEffectMetric[];
}

export interface CollectableActionEffectPreviewRequest {
  actions: CollectableActionKind[];
  states: CollectableMechanicsState[];
  mechanics: CollectableMechanicsContext | null;
}

interface TransitionSample {
  before: CollectableMechanicsState;
  after: CollectableMechanicsState;
}

export function buildCollectableActionEffectPreviews(
  request: CollectableActionEffectPreviewRequest
): CollectableActionEffectPreview[] {
  if (!request.mechanics) return [];

  let currentStates = uniqueStates(request.states);

  return request.actions.map((action) => {
    const castableStates = currentStates.filter((state) => (
      canUseCollectableAction(action, state, request.mechanics!)
    ));
    const transitions = castableStates.flatMap((state) => (
      applyCollectableAction(action, state, request.mechanics!).map((transition) => ({
        before: state,
        after: transition.state
      }))
    ));
    const preview = buildActionPreview(action, currentStates, castableStates.length, transitions, request.mechanics!);

    currentStates = uniqueStates(transitions.map((transition) => transition.after));

    return preview;
  });
}

export async function buildCollectableActionEffectPreviewsAsync(
  request: CollectableActionEffectPreviewRequest,
  options: CooperativeSchedulerOptions = {}
): Promise<CollectableActionEffectPreview[]> {
  if (!request.mechanics) return [];

  const scheduler = createCooperativeScheduler(options);
  let currentStates = uniqueStates(request.states);
  const previews: CollectableActionEffectPreview[] = [];

  await scheduler.yieldNow();
  for (const action of request.actions) {
    await scheduler.step();
    const castableStates: CollectableMechanicsState[] = [];
    for (const state of currentStates) {
      await scheduler.step();
      if (canUseCollectableAction(action, state, request.mechanics)) {
        castableStates.push(state);
      }
    }

    const transitions: TransitionSample[] = [];
    for (const state of castableStates) {
      await scheduler.step();
      applyCollectableAction(action, state, request.mechanics).forEach((transition) => {
        transitions.push({
          before: state,
          after: transition.state
        });
      });
    }

    previews.push(buildActionPreview(action, currentStates, castableStates.length, transitions, request.mechanics));
    currentStates = uniqueStates(transitions.map((transition) => transition.after));
  }

  return previews;
}

function buildActionPreview(
  action: CollectableActionKind,
  sourceStates: CollectableMechanicsState[],
  castableStateCount: number,
  transitions: TransitionSample[],
  mechanics: CollectableMechanicsContext
): CollectableActionEffectPreview {
  const metrics: CollectableEffectMetric[] = [];

  if (castableStateCount === 0) {
    return {
      action,
      sourceStateCount: sourceStates.length,
      castableStateCount,
      metrics
    };
  }

  if (action === 'scour' || action === 'meticulous') {
    const collectabilityRange = rangeFromTransitions(transitions, (transition) => (
      transition.after.collectability - transition.before.collectability
    ));
    if (collectabilityRange) metrics.push({ kind: 'collectabilityGain', range: collectabilityRange });
    metrics.push({
      kind: 'integrityDelta',
      range: action === 'scour' ? { min: -1, max: -1 } : { min: -1, max: 0 }
    });
  }

  if (action === 'scrutiny') {
    metrics.push({
      kind: 'scrutinyBonus',
      value: calculateScrutinyBonus(mechanics.scourValue, mechanics.scrutinyMultiplier)
    });
  }

  if (action === 'collectorsFocus') {
    metrics.push({
      kind: 'valueIncreaseRate',
      from: mechanics.valueIncreaseRate,
      to: mechanics.focusedValueIncreaseRate,
      delta: mechanics.focusedValueIncreaseRate - mechanics.valueIncreaseRate
    });
  }

  if (action === 'primingTouch') {
    metrics.push({
      kind: 'meticulousSaveRate',
      from: mechanics.meticulousRate,
      to: mechanics.primedMeticulousRate,
      delta: mechanics.primedMeticulousRate - mechanics.meticulousRate
    });
  }

  if (action === 'successI') metrics.push({ kind: 'collectSuccessBonus', value: 5 });
  if (action === 'successII') metrics.push({ kind: 'collectSuccessBonus', value: 15 });
  if (action === 'successIII') metrics.push({ kind: 'collectSuccessBonus', value: 50 });
  if (action === 'nextCollectSuccess') metrics.push({ kind: 'nextCollectSuccessBonus', value: 15 });

  if (action === 'restoreIntegrity' || action === 'wiseToTheWorld') {
    const integrityRange = restorationRange(action, sourceStates, mechanics);
    if (integrityRange) metrics.push({ kind: 'integrityDelta', range: integrityRange });
  }

  if (action === 'collect') {
    const beforeStates = uniqueStates(transitions.map((transition) => transition.before));
    const collectSuccessRate = rangeFromStates(beforeStates, (state) => (
      clampPercent(mechanics.baseSuccessRate + state.successBonus + state.nextCollectSuccessBonus)
    ));
    const successGp = rangeFromTransitions(transitions, (transition) => (
      transition.after.gp - transition.before.gp
    ));
    if (collectSuccessRate) metrics.push({ kind: 'collectSuccessRate', range: collectSuccessRate });
    metrics.push({ kind: 'integrityDelta', range: { min: -1, max: -1 } });
    if (successGp) {
      metrics.push({
        kind: 'collectSuccessGp',
        range: {
          min: Math.max(0, successGp.min),
          max: Math.min(gpPerCollect(mechanics.level), successGp.max)
        }
      });
    }
  }

  return {
    action,
    sourceStateCount: sourceStates.length,
    castableStateCount,
    metrics
  };
}

function restorationRange(
  action: 'restoreIntegrity' | 'wiseToTheWorld',
  sourceStates: CollectableMechanicsState[],
  mechanics: CollectableMechanicsContext
): CollectableEffectRange | null {
  const deltas = sourceStates.flatMap((state) => {
    if (canUseCollectableAction(action, state, mechanics)) return [1];
    if (state.integrity >= mechanics.maxIntegrity) return [0];
    return [];
  });

  if (deltas.length === 0 || !deltas.some((delta) => delta > 0)) return null;

  return {
    min: Math.min(...deltas),
    max: Math.max(...deltas)
  };
}

function rangeFromTransitions(
  transitions: TransitionSample[],
  getValue: (transition: TransitionSample) => number
): CollectableEffectRange | null {
  if (transitions.length === 0) return null;
  const values = transitions.map(getValue);
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

function rangeFromStates(
  states: CollectableMechanicsState[],
  getValue: (state: CollectableMechanicsState) => number
): CollectableEffectRange | null {
  if (states.length === 0) return null;
  const values = states.map(getValue);
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

function uniqueStates(states: CollectableMechanicsState[]): CollectableMechanicsState[] {
  const seen = new Set<string>();
  const unique: CollectableMechanicsState[] = [];

  states.forEach((state) => {
    const key = collectableStateKey(state);
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(state);
  });

  return unique;
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}
