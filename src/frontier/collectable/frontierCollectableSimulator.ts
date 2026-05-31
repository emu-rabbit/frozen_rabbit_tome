import { calculateSuccessRate } from '../../utils/gatheringMath';
import {
  COLLECTABILITY_CAP,
  addCollectableTierCounts,
  calculateCollectableMeticulousGain,
  calculateCollectableScourValue,
  calculateFocusedValueIncreaseRate,
  calculateMeticulousProcRate,
  calculateScrutinyBonus,
  calculateScrutinyMultiplier,
  calculateValueIncreaseRate,
  clampCollectability,
  createZeroTierCounts,
  getCollectableTierCountForValue,
  scoreCollectability
} from '../../utils/collectableMath';
import { applyRelicToolValueIncreaseBonus } from '../../utils/collectableMath';
import { gpPerCollect, MIN_COLLECTABLE_LEVEL } from '../../utils/collectableMechanics';
import { isTierCountObjective } from '../../utils/collectableObjectivePresets';
import { buildModelVersionsForScenario } from '../../config/modelVersions';
import { FRONTIER_COLLECTABLE_ACTION_DEFINITIONS } from './frontierCollectableActions';
import {
  validateFrontierProbabilityProfile
} from './frontierCollectableProbabilityProfile';
import {
  getFrontierIntuitionRates,
  getFrontierMeticulousSaveRatePercent
} from './frontierCollectableMechanics';
import type {
  FrontierCollectableActionKind,
  FrontierCollectableAnalysisResult,
  FrontierCollectableProbabilityProfile,
  FrontierCollectableSimulationRequest,
  FrontierCollectableStandardMode,
  FrontierCollectableState,
  FrontierCollectableStrategyRule
} from './frontierCollectableTypes';
import type { CollectableTierCounts } from '../../types/collectable';
import type { NodeBonuses, PlayerStats } from '../../types/game';

export interface FrontierCollectableContext {
  maxIntegrity: number;
  maxGp: number;
  level: number;
  baseSuccessRate: number;
  scourValue: number;
  valueIncreaseRate: number;
  focusedValueIncreaseRate: number;
  meticulousRate: number;
  scrutinyMultiplier: number;
  probabilityProfile: FrontierCollectableProbabilityProfile;
}

export interface FrontierCollectableMechanicsRequest {
  stats: PlayerStats;
  baseValues: {
    Gathering: number;
    Perception: number;
  };
  itemLevel: number;
  nodeBonuses: NodeBonuses;
  hasRelicToolBonus?: boolean;
  probabilityProfile: FrontierCollectableProbabilityProfile;
}

export interface FrontierTransition {
  state: FrontierCollectableState;
  probability: number;
  collectSuccess?: boolean;
  label?: string;
  labelKeys?: string[];
}

interface OutcomeDetail {
  score: number;
  probability: number;
  tierCounts: CollectableTierCounts;
  terminalCollectability: number;
}

interface SimulationCounters {
  stateCount: number;
  transitionCount: number;
  limited: boolean;
  terminalStates: number;
  uncoveredStates: number;
  limitedStates: number;
}

export function analyzeFrontierCollectableStrategy(
  request: FrontierCollectableSimulationRequest
): FrontierCollectableAnalysisResult {
  const startedAt = performanceNow();
  const profileValidation = validateFrontierProbabilityProfile(request.probabilityProfile);
  if (!profileValidation.valid) {
    throw new Error(`Invalid Frontier probability profile: ${profileValidation.errors.join(', ')}`);
  }

  const context = createFrontierCollectableContext(request);
  const counters: SimulationCounters = {
    stateCount: 0,
    transitionCount: 0,
    limited: false,
    terminalStates: 0,
    uncoveredStates: 0,
    limitedStates: 0
  };
  const memo = new Map<string, Map<string, OutcomeDetail>>();
  const initialState = createInitialFrontierCollectableState(context, request.temporaryGp);
  const details = scoreDecisionState(initialState, [], request, context, memo, counters);
  const outcomes = mergeScoreDistribution(details);
  const scores = [...outcomes.keys()].sort((left, right) => left - right);
  const minScore = scores[0] ?? 0;
  const maxScore = scores[scores.length - 1] ?? 0;

  return {
    modelVersions: buildModelVersionsForScenario('frontier.collectable'),
    expectedScore: roundScore(expectedScore(details)),
    minScore,
    maxScore,
    minScoreChance: (outcomes.get(minScore) ?? 0) * 100,
    maxScoreChance: (outcomes.get(maxScore) ?? 0) * 100,
    expectedTierCounts: expectedTierCounts(details),
    outcomeDistribution: buildOutcomeDistribution(details, request.objective),
    collectabilityDistribution: buildCollectabilityDistribution(details),
    terminalStateSummary: {
      terminalStates: counters.terminalStates,
      uncoveredStates: counters.uncoveredStates,
      limitedStates: counters.limitedStates
    },
    limited: counters.limited,
    stateCount: counters.stateCount,
    transitionCount: counters.transitionCount,
    assumptionsUsed: buildAssumptionsUsed(request.probabilityProfile, performanceNow() - startedAt)
  };
}

export function createFrontierCollectableContext(
  request: FrontierCollectableMechanicsRequest
): FrontierCollectableContext {
  if (request.stats.level < MIN_COLLECTABLE_LEVEL) {
    throw new Error(`Frontier collectable analysis requires level ${MIN_COLLECTABLE_LEVEL} or higher.`);
  }

  const baseValueIncreaseRate = calculateValueIncreaseRate(request.stats.gathering, request.baseValues.Gathering);
  const valueIncreaseRate = request.hasRelicToolBonus
    ? applyRelicToolValueIncreaseBonus(baseValueIncreaseRate)
    : baseValueIncreaseRate;

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
    meticulousRate: calculateMeticulousProcRate(request.stats.gathering, request.baseValues.Gathering),
    scrutinyMultiplier: calculateScrutinyMultiplier(request.stats.perception, request.baseValues.Perception),
    probabilityProfile: request.probabilityProfile
  };
}

export function createInitialFrontierCollectableState(
  context: FrontierCollectableContext,
  temporaryGp: number
): FrontierCollectableState {
  return {
    gp: Math.min(context.maxGp, temporaryGp),
    integrity: context.maxIntegrity,
    collectability: 0,
    scrutinyActive: false,
    collectorsFocusActive: false,
    primingTouchActive: false,
    standardMode: 'none',
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

export function frontierCollectableStateKey(state: FrontierCollectableState): string {
  return [
    state.gp,
    state.integrity,
    state.collectability,
    state.scrutinyActive ? 1 : 0,
    state.collectorsFocusActive ? 1 : 0,
    state.primingTouchActive ? 1 : 0,
    state.standardMode,
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

export function canUseFrontierCollectableAction(
  action: FrontierCollectableActionKind,
  state: FrontierCollectableState,
  context: FrontierCollectableContext
): boolean {
  const definition = FRONTIER_COLLECTABLE_ACTION_DEFINITIONS[action];
  if (context.level < definition.minLevel) return false;
  if (state.gp < definition.gpCost) return false;

  if (action === 'collect') return state.integrity > 0;
  if (action === 'scour' || action === 'brazen' || action === 'meticulous') {
    return state.integrity > 0 && state.collectability < COLLECTABILITY_CAP;
  }
  if (action === 'scrutiny') return state.collectability < COLLECTABILITY_CAP && !state.scrutinyActive;
  if (action === 'collectorsFocus') return state.collectability < COLLECTABILITY_CAP && !state.collectorsFocusActive;
  if (action === 'primingTouch') return state.collectability < COLLECTABILITY_CAP && !state.primingTouchActive;
  if (action === 'successI') return !state.successIActive && canRaiseCollectSuccess(state, context);
  if (action === 'successII') return !state.successIIActive && canRaiseCollectSuccess(state, context);
  if (action === 'successIII') return !state.successIIIActive && canRaiseCollectSuccess(state, context);
  if (action === 'nextCollectSuccess') return state.nextCollectSuccessBonus === 0 && canRaiseCollectSuccess(state, context);
  if (action === 'restoreIntegrity') return state.integrity < context.maxIntegrity;
  if (action === 'wiseToTheWorld') return state.wiseToTheWorldActive && state.integrity < context.maxIntegrity;

  return false;
}

function scoreDecisionState(
  state: FrontierCollectableState,
  pendingActions: FrontierCollectableActionKind[],
  request: FrontierCollectableSimulationRequest,
  context: FrontierCollectableContext,
  memo: Map<string, Map<string, OutcomeDetail>>,
  counters: SimulationCounters
): Map<string, OutcomeDetail> {
  const key = `${frontierCollectableStateKey(state)}|${pendingActions.join(',')}`;
  const cached = memo.get(key);
  if (cached) return cached;

  counters.stateCount += 1;
  if (counters.stateCount > (request.maxStates ?? 5000)) {
    counters.limited = true;
    counters.limitedStates += 1;
    return terminalOutcome(state.collectability);
  }

  if (state.integrity <= 0) {
    counters.terminalStates += 1;
    return terminalOutcome(state.collectability);
  }

  const actionPlan = resolveNextAction(state, pendingActions, request.strategy, context);
  if (!actionPlan) {
    counters.uncoveredStates += 1;
    return terminalOutcome(state.collectability);
  }

  const outcomes = new Map<string, OutcomeDetail>();
  memo.set(key, outcomes);

  const transitions = applyFrontierCollectableAction(actionPlan.action, state, context);
  counters.transitionCount += transitions.length;
  if (counters.transitionCount > (request.maxTransitions ?? 50000)) {
    counters.limited = true;
    counters.limitedStates += 1;
    return terminalOutcome(state.collectability);
  }

  transitions.forEach((transition) => {
    const immediateScore = transition.collectSuccess
      ? scoreCollectability(state.collectability, request.rewardTable, request.objective)
      : 0;
    const immediateTierCounts = transition.collectSuccess
      ? getCollectableTierCountForValue(state.collectability, request.rewardTable)
      : createZeroTierCounts();
    const childDetails = scoreDecisionState(
      transition.state,
      actionPlan.nextPendingActions,
      request,
      context,
      memo,
      counters
    );

    childDetails.forEach((child) => {
      const score = immediateScore + child.score;
      const tierCounts = addCollectableTierCounts(immediateTierCounts, child.tierCounts);
      const detailKey = outcomeDetailKey(score, tierCounts, child.terminalCollectability);
      const current = outcomes.get(detailKey);
      outcomes.set(detailKey, {
        score,
        probability: (current?.probability ?? 0) + transition.probability * child.probability,
        tierCounts,
        terminalCollectability: child.terminalCollectability
      });
    });
  });

  return outcomes;
}

function resolveNextAction(
  state: FrontierCollectableState,
  pendingActions: FrontierCollectableActionKind[],
  rules: FrontierCollectableStrategyRule[],
  context: FrontierCollectableContext
): { action: FrontierCollectableActionKind; nextPendingActions: FrontierCollectableActionKind[] } | null {
  const pendingIndex = pendingActions.findIndex((action) => canUseFrontierCollectableAction(action, state, context));
  if (pendingIndex >= 0) {
    return {
      action: pendingActions[pendingIndex],
      nextPendingActions: pendingActions.slice(pendingIndex + 1)
    };
  }

  for (const rule of rules.filter((candidate) => candidate.enabled)) {
    if (!matchesRule(rule, state)) continue;
    const actionIndex = rule.actions.findIndex((action) => canUseFrontierCollectableAction(action, state, context));
    if (actionIndex < 0) continue;

    return {
      action: rule.actions[actionIndex],
      nextPendingActions: rule.actions.slice(actionIndex + 1)
    };
  }

  return null;
}

export function applyFrontierCollectableAction(
  action: FrontierCollectableActionKind,
  state: FrontierCollectableState,
  context: FrontierCollectableContext
): FrontierTransition[] {
  if (action === 'collect') return applyCollect(state, context);
  if (action === 'scour' || action === 'brazen' || action === 'meticulous') return applyRefine(action, state, context);
  if (action === 'restoreIntegrity') return applyRestoreIntegrity(state, context);
  if (action === 'wiseToTheWorld') {
    return [{
      state: cloneFrontierState(state, {
        integrity: Math.min(context.maxIntegrity, state.integrity + 1),
        wiseToTheWorldActive: false
      }),
      probability: 1
    }];
  }

  return [{
    state: applyBuffAction(action, state),
    probability: 1
  }];
}

function applyCollect(state: FrontierCollectableState, context: FrontierCollectableContext): FrontierTransition[] {
  const successRate = Math.min(100, Math.max(0, context.baseSuccessRate + state.successBonus + state.nextCollectSuccessBonus)) / 100;
  const common = {
    integrity: state.integrity - 1,
    hasUsedCollectableAction: true,
    hasCollected: true,
    nextCollectSuccessBonus: 0,
    standardMode: 'none' as FrontierCollectableStandardMode
  };

  return [
    {
      state: cloneFrontierState(state, {
        ...common,
        gp: Math.min(context.maxGp, state.gp + gpPerCollect(context.level))
      }),
      probability: successRate,
      collectSuccess: true,
      labelKeys: ['collectableSolver.branches.collectSuccess']
    },
    {
      state: cloneFrontierState(state, common),
      probability: 1 - successRate,
      collectSuccess: false,
      labelKeys: ['collectableSolver.branches.collectFailed']
    }
  ].filter((branch) => branch.probability > 0);
}

function applyRefine(
  action: 'scour' | 'brazen' | 'meticulous',
  state: FrontierCollectableState,
  context: FrontierCollectableContext
): FrontierTransition[] {
  const valueRate = (state.collectorsFocusActive ? context.focusedValueIncreaseRate : context.valueIncreaseRate) / 100;
  const valueBranches = [
    { valueIncrease: false, probability: 1 - valueRate },
    { valueIncrease: true, probability: valueRate }
  ].filter((branch) => branch.probability > 0);
  const durabilityBranches = buildDurabilityBranches(action, state, context);
  const gainBranches = buildGainBranches(action, state, context);
  const transitions: FrontierTransition[] = [];

  valueBranches.forEach((valueBranch) => {
    durabilityBranches.forEach((durabilityBranch) => {
      gainBranches.forEach((gainBranch) => {
        const gain = gainBranch.gain + (valueBranch.valueIncrease ? Math.floor(context.scourValue * 50 / 100) : 0);
        const baseState = cloneFrontierState(state, {
          collectability: clampCollectability(state.collectability + gain),
          integrity: state.integrity - durabilityBranch.integrityCost,
          scrutinyActive: false,
          collectorsFocusActive: false,
          primingTouchActive: action === 'meticulous' ? false : state.primingTouchActive,
          standardMode: 'none',
          hasUsedCollectableAction: true
        });
        const probability = valueBranch.probability * durabilityBranch.probability * gainBranch.probability;

        const labels = [
          ...(gainBranch.label ? [gainBranch.label] : []),
          ...(valueBranch.valueIncrease
            ? [contextBranchLabel('collectableSolver.branches.valueIncreased')]
            : [contextBranchLabel('collectableSolver.branches.valueNormal')]),
          ...(durabilityBranch.labelKeys ?? []).map(contextBranchLabel)
        ];

        applyStandardProc(baseState, probability, context).forEach((transition) => transitions.push({
          ...transition,
          label: [...labels, transition.label].filter(Boolean).join(' / '),
          labelKeys: transition.labelKeys
        }));
      });
    });
  });

  return transitions.filter((transition) => transition.probability > 0);
}

function buildGainBranches(
  action: 'scour' | 'brazen' | 'meticulous',
  state: FrontierCollectableState,
  context: FrontierCollectableContext
): Array<{ gain: number; probability: number; label?: string }> {
  const scrutinyBonus = state.scrutinyActive
    ? calculateScrutinyBonus(context.scourValue, context.scrutinyMultiplier)
    : 0;

  if (action === 'scour') {
    return [{ gain: context.scourValue + scrutinyBonus, probability: 1 }];
  }

  if (action === 'meticulous') {
    return [{
      gain: calculateCollectableMeticulousGain({
        scourValue: context.scourValue,
        scrutinyMultiplier: context.scrutinyMultiplier,
        scrutinyActive: state.scrutinyActive,
        standardActive: state.standardMode !== 'none',
        valueIncrease: false
      }),
      probability: 1
    }];
  }

  if (state.standardMode === 'highStandard') {
    return [{
      gain: Math.floor(context.scourValue * 150 / 100 + scrutinyBonus),
      probability: 1,
      label: '150%'
    }];
  }

  return context.probabilityProfile.brazenBuckets
    .filter((bucket) => bucket.probabilityPercent > 0)
    .map((bucket) => {
      const rawGain = context.scourValue * bucket.multiplierPercent / 100;
      const standardizedGain = state.standardMode === 'standard'
        ? Math.max(context.scourValue, rawGain)
        : rawGain;

      return {
        gain: Math.floor(standardizedGain + scrutinyBonus),
        probability: bucket.probabilityPercent / 100,
        label: `${bucket.multiplierPercent}%`
      };
    });
}

function buildDurabilityBranches(
  action: 'scour' | 'brazen' | 'meticulous',
  state: FrontierCollectableState,
  context: FrontierCollectableContext
): Array<{ integrityCost: number; probability: number; labelKeys?: string[] }> {
  if (action !== 'meticulous') {
    return [{ integrityCost: 1, probability: 1, labelKeys: ['collectableSolver.branches.integrityConsumed'] }];
  }

  const saveRate = getFrontierMeticulousSaveRatePercent(state, context) / 100;

  return [
    { integrityCost: 0, probability: saveRate, labelKeys: ['collectableSolver.branches.meticulousSaved'] },
    { integrityCost: 1, probability: 1 - saveRate, labelKeys: ['collectableSolver.branches.meticulousConsumed'] }
  ].filter((branch) => branch.probability > 0);
}

function applyStandardProc(
  state: FrontierCollectableState,
  probability: number,
  context: FrontierCollectableContext
): FrontierTransition[] {
  const intuitionRates = getFrontierIntuitionRates(context.probabilityProfile);
  const highRate = intuitionRates.highStandardProcRatePercent / 100;
  const standardRate = intuitionRates.standardProcRatePercent / 100;
  const noProcRate = intuitionRates.noProcRatePercent / 100;
  const canProc = state.integrity > 0
    && state.collectability < COLLECTABILITY_CAP
    && state.standardMode === 'none'
    && (standardRate > 0 || highRate > 0);

  if (!canProc) return [{ state, probability }];

  return [
    {
      state: cloneFrontierState(state, { standardMode: 'highStandard' }),
      probability: probability * highRate,
      labelKeys: ['frontier.branches.highStandardProc'],
      label: contextBranchLabel('frontier.branches.highStandardProc')
    },
    {
      state: cloneFrontierState(state, { standardMode: 'standard' }),
      probability: probability * standardRate,
      labelKeys: ['collectableSolver.branches.standardProc'],
      label: contextBranchLabel('collectableSolver.branches.standardProc')
    },
    {
      state,
      probability: probability * noProcRate,
      labelKeys: ['collectableSolver.branches.standardNoProc'],
      label: contextBranchLabel('collectableSolver.branches.standardNoProc')
    }
  ].filter((transition) => transition.probability > 0);
}

function applyRestoreIntegrity(state: FrontierCollectableState, context: FrontierCollectableContext): FrontierTransition[] {
  const restoredState = cloneFrontierState(state, {
    gp: state.gp - FRONTIER_COLLECTABLE_ACTION_DEFINITIONS.restoreIntegrity.gpCost,
    integrity: Math.min(context.maxIntegrity, state.integrity + 1)
  });

  if (context.level < 90) return [{ state: restoredState, probability: 1 }];

  return [
    { state: cloneFrontierState(restoredState, { wiseToTheWorldActive: true }), probability: 0.5 },
    { state: restoredState, probability: 0.5 }
  ];
}

function applyBuffAction(
  action: FrontierCollectableActionKind,
  state: FrontierCollectableState
): FrontierCollectableState {
  const gp = state.gp - FRONTIER_COLLECTABLE_ACTION_DEFINITIONS[action].gpCost;
  if (action === 'scrutiny') return cloneFrontierState(state, { gp, scrutinyActive: true });
  if (action === 'collectorsFocus') return cloneFrontierState(state, { gp, collectorsFocusActive: true });
  if (action === 'primingTouch') return cloneFrontierState(state, { gp, primingTouchActive: true });
  if (action === 'successI') return cloneFrontierState(state, { gp, successIActive: true, successBonus: state.successBonus + 5 });
  if (action === 'successII') return cloneFrontierState(state, { gp, successIIActive: true, successBonus: state.successBonus + 15 });
  if (action === 'successIII') return cloneFrontierState(state, { gp, successIIIActive: true, successBonus: state.successBonus + 50 });
  if (action === 'nextCollectSuccess') return cloneFrontierState(state, { gp, nextCollectSuccessBonus: 15 });
  return cloneFrontierState(state, { gp });
}

function canRaiseCollectSuccess(state: FrontierCollectableState, context: FrontierCollectableContext): boolean {
  return context.baseSuccessRate > 1 && context.baseSuccessRate + state.successBonus < 100;
}

export function matchesFrontierCollectableStrategyRule(rule: FrontierCollectableStrategyRule, state: FrontierCollectableState): boolean {
  if (rule.conditions.length === 0) return true;
  const results = rule.conditions.map((condition) => {
    const left = state[condition.field];
    if (typeof left === 'boolean') return left === Boolean(condition.value);
    if (typeof left === 'string') {
      if (condition.comparator === '!=') return left !== condition.value;
      return left === condition.value;
    }

    const right = Number(condition.value);
    if (condition.comparator === '<') return left < right;
    if (condition.comparator === '<=') return left <= right;
    if (condition.comparator === '>=') return left >= right;
    if (condition.comparator === '>') return left > right;
    return left === right;
  });

  return rule.mode === 'all' ? results.every(Boolean) : results.some(Boolean);
}

function matchesRule(rule: FrontierCollectableStrategyRule, state: FrontierCollectableState): boolean {
  return matchesFrontierCollectableStrategyRule(rule, state);
}

function contextBranchLabel(labelKey: string) {
  return labelKey;
}

function terminalOutcome(terminalCollectability: number): Map<string, OutcomeDetail> {
  const tierCounts = createZeroTierCounts();
  return new Map([[
    outcomeDetailKey(0, tierCounts, terminalCollectability),
    { score: 0, probability: 1, tierCounts, terminalCollectability }
  ]]);
}

function mergeScoreDistribution(details: Map<string, OutcomeDetail>): Map<number, number> {
  const outcomes = new Map<number, number>();
  details.forEach((detail) => {
    outcomes.set(detail.score, (outcomes.get(detail.score) ?? 0) + detail.probability);
  });
  return outcomes;
}

function expectedScore(details: Map<string, OutcomeDetail>) {
  let total = 0;
  details.forEach((detail) => {
    total += detail.score * detail.probability;
  });
  return total;
}

function expectedTierCounts(details: Map<string, OutcomeDetail>) {
  let counts = createZeroTierCounts();
  details.forEach((detail) => {
    counts = addCollectableTierCounts(counts, detail.tierCounts, detail.probability);
  });
  return counts;
}

function buildOutcomeDistribution(
  details: Map<string, OutcomeDetail>,
  objective: FrontierCollectableSimulationRequest['objective']
) {
  if (!isTierCountObjective(objective)) {
    const outcomes = mergeScoreDistribution(details);
    return [...outcomes.keys()].sort((left, right) => left - right).map((score) => ({
      score,
      probability: (outcomes.get(score) ?? 0) * 100
    }));
  }

  const outcomes = mergeScoreDistribution(details);
  return [...outcomes.keys()].sort((left, right) => left - right).map((score) => ({
    score,
    probability: (outcomes.get(score) ?? 0) * 100,
    tierCounts: representativeTierCountsForScore(details, score)
  }));
}

function representativeTierCountsForScore(details: Map<string, OutcomeDetail>, score: number) {
  const matches = [...details.values()].filter((detail) => detail.score === score);
  if (matches.length === 0) return createZeroTierCounts();

  return {
    ...matches.sort((left, right) => (
      right.probability - left.probability
        || right.tierCounts.high - left.tierCounts.high
        || right.tierCounts.mid - left.tierCounts.mid
        || right.tierCounts.low - left.tierCounts.low
    ))[0].tierCounts
  };
}

function buildCollectabilityDistribution(details: Map<string, OutcomeDetail>) {
  const distribution = new Map<number, number>();
  details.forEach((detail) => {
    distribution.set(
      detail.terminalCollectability,
      (distribution.get(detail.terminalCollectability) ?? 0) + detail.probability
    );
  });

  return [...distribution.entries()]
    .sort(([left], [right]) => left - right)
    .map(([collectability, probability]) => ({ collectability, probability: probability * 100 }));
}

function buildAssumptionsUsed(profile: FrontierCollectableProbabilityProfile, calculationTime: number): string[] {
  const assumptions = [
    'frontier-user-supplied-probabilities',
    'brazen-distribution-user-supplied',
    'not-a-solver',
    `frontier-calculation-ms:${Math.round(calculationTime)}`
  ];
  if (profile.highStandardProcRatePercent !== null) assumptions.push('high-standard-proc-rate-user-supplied');
  return assumptions;
}

function outcomeDetailKey(score: number, tierCounts: CollectableTierCounts, terminalCollectability: number) {
  return [score, tierCounts.none, tierCounts.low, tierCounts.mid, tierCounts.high, terminalCollectability].join('|');
}

function cloneFrontierState(
  state: FrontierCollectableState,
  patch: Partial<FrontierCollectableState>
): FrontierCollectableState {
  return {
    gp: patch.gp ?? state.gp,
    integrity: patch.integrity ?? state.integrity,
    collectability: patch.collectability ?? state.collectability,
    scrutinyActive: patch.scrutinyActive ?? state.scrutinyActive,
    collectorsFocusActive: patch.collectorsFocusActive ?? state.collectorsFocusActive,
    primingTouchActive: patch.primingTouchActive ?? state.primingTouchActive,
    standardMode: patch.standardMode ?? state.standardMode,
    hasUsedCollectableAction: patch.hasUsedCollectableAction ?? state.hasUsedCollectableAction,
    hasCollected: patch.hasCollected ?? state.hasCollected,
    successBonus: patch.successBonus ?? state.successBonus,
    successIActive: patch.successIActive ?? state.successIActive,
    successIIActive: patch.successIIActive ?? state.successIIActive,
    successIIIActive: patch.successIIIActive ?? state.successIIIActive,
    nextCollectSuccessBonus: patch.nextCollectSuccessBonus ?? state.nextCollectSuccessBonus,
    wiseToTheWorldActive: patch.wiseToTheWorldActive ?? state.wiseToTheWorldActive
  };
}

function roundScore(score: number) {
  return Number(score.toFixed(2));
}

function performanceNow() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
