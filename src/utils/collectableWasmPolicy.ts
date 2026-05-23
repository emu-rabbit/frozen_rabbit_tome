import {
  addCollectableRewards,
  addCollectableTierCounts,
  createZeroReward,
  createZeroTierCounts,
  getCollectableRewardForValue,
  getCollectableTierCountForValue,
  scoreCollectability
} from './collectableMath';
import {
  applyCollectableAction,
  canUseCollectableAction,
  collectableStateKey,
  createCollectableMechanicsContext,
  createInitialCollectableMechanicsState,
  type CollectableMechanicsState
} from './collectableMechanics';
import { COLLECTABLE_ACTION_DEFINITIONS, getCollectableActionId } from '../services/collectableActions';
import type {
  CollectableActionKind,
  CollectableActionSummary,
  CollectablePolicyNode,
  CollectableRewardVector,
  CollectableSolverRequest,
  CollectableStateSummary,
  CollectableTierCounts
} from '../types/collectable';

const FLAG_SCRUTINY = 1 << 0;
const FLAG_FOCUS = 1 << 1;
const FLAG_PRIMING = 1 << 2;
const FLAG_STANDARD = 1 << 3;
const FLAG_HAS_USED = 1 << 4;
const FLAG_HAS_COLLECTED = 1 << 5;
const FLAG_SUCCESS_I = 1 << 6;
const FLAG_SUCCESS_II = 1 << 7;
const FLAG_SUCCESS_III = 1 << 8;
const FLAG_WISE = 1 << 9;

export interface CollectableWasmPolicyCore {
  getBestActionForState(
    gp: number,
    integrity: number,
    collectability: number,
    flags: number,
    successBonus: number,
    nextBonus: number
  ): number;
  getExpectedScoreForState?(
    gp: number,
    integrity: number,
    collectability: number,
    flags: number,
    successBonus: number,
    nextBonus: number
  ): number;
  getScoreForState(
    gp: number,
    integrity: number,
    collectability: number,
    flags: number,
    successBonus: number,
    nextBonus: number
  ): number;
}

interface BuildOptions {
  startingGp?: number;
  nodeLimit?: number;
  selector?: CollectableWasmPolicySelector;
}

export interface CollectableWasmTieBreakResult {
  actionKind: CollectableActionKind | null;
  expectedScore: number;
}

export interface CollectableWasmPolicySelector {
  select(state: CollectableMechanicsState): CollectableWasmTieBreakResult;
}

export interface CollectableWasmPolicyEvaluation {
  expectedScore: number;
  expectedReward: CollectableRewardVector;
  expectedTierCounts: CollectableTierCounts;
  outcomes: Map<number, number>;
  minScoreDetail: {
    score: number;
    probability: number;
    tierCounts: CollectableTierCounts;
  };
  maxScoreDetail: {
    score: number;
    probability: number;
    tierCounts: CollectableTierCounts;
  };
}

function actionSummary(kind: CollectableActionKind, jobType: CollectableSolverRequest['jobType']): CollectableActionSummary {
  const definition = COLLECTABLE_ACTION_DEFINITIONS[kind];
  return {
    kind,
    actionId: getCollectableActionId(kind, jobType),
    nameKey: `collectableSolver.actions.${kind}`,
    gpCost: definition.gpCost
  };
}

function summarizeState(state: CollectableMechanicsState): CollectableStateSummary {
  return {
    gp: state.gp,
    integrity: state.integrity,
    collectability: state.collectability,
    scrutinyActive: state.scrutinyActive,
    collectorsFocusActive: state.collectorsFocusActive,
    primingTouchActive: state.primingTouchActive,
    standardActive: state.standardActive,
    successBonus: state.successBonus,
    nextCollectSuccessBonus: state.nextCollectSuccessBonus,
    wiseToTheWorldActive: state.wiseToTheWorldActive
  };
}

function stateFlags(state: CollectableMechanicsState): number {
  let flags = 0;
  if (state.scrutinyActive) flags |= FLAG_SCRUTINY;
  if (state.collectorsFocusActive) flags |= FLAG_FOCUS;
  if (state.primingTouchActive) flags |= FLAG_PRIMING;
  if (state.standardActive) flags |= FLAG_STANDARD;
  if (state.hasUsedCollectableAction) flags |= FLAG_HAS_USED;
  if (state.hasCollected) flags |= FLAG_HAS_COLLECTED;
  if (state.successIActive) flags |= FLAG_SUCCESS_I;
  if (state.successIIActive) flags |= FLAG_SUCCESS_II;
  if (state.successIIIActive) flags |= FLAG_SUCCESS_III;
  if (state.wiseToTheWorldActive) flags |= FLAG_WISE;
  return flags;
}

function expectedScoreForState(core: CollectableWasmPolicyCore, state: CollectableMechanicsState): number {
  if (state.integrity <= 0) return 0;
  const getter = core.getExpectedScoreForState ?? core.getScoreForState;
  return getter(
    state.gp,
    state.integrity,
    state.collectability,
    stateFlags(state),
    state.successBonus,
    state.nextCollectSuccessBonus
  );
}

function actionKindForWasmId(actionId: number): CollectableActionKind | null {
  if (actionId === 0) return 'collect';
  if (actionId === 1) return 'scour';
  if (actionId === 2) return 'meticulous';
  if (actionId === 3) return 'scrutiny';
  if (actionId === 4) return 'collectorsFocus';
  if (actionId === 5) return 'primingTouch';
  if (actionId === 6) return 'successI';
  if (actionId === 7) return 'successII';
  if (actionId === 8) return 'successIII';
  if (actionId === 9) return 'nextCollectSuccess';
  if (actionId === 10) return 'restoreIntegrity';
  if (actionId === 11) return 'wiseToTheWorld';
  return null;
}

export function createCollectableWasmPolicySelector(
  request: CollectableSolverRequest,
  core: CollectableWasmPolicyCore,
  mechanics = createCollectableMechanicsContext(request)
) {
  const memo = new Map<string, CollectableWasmTieBreakResult>();

  function terminalResult(): CollectableWasmTieBreakResult {
    return {
      actionKind: null,
      expectedScore: 0
    };
  }

  function select(state: CollectableMechanicsState): CollectableWasmTieBreakResult {
    if (state.integrity <= 0) return terminalResult();

    const key = collectableStateKey(state);
    const cached = memo.get(key);
    if (cached) return cached;
    const actionKind = actionKindForWasmId(core.getBestActionForState(
      state.gp,
      state.integrity,
      state.collectability,
      stateFlags(state),
      state.successBonus,
      state.nextCollectSuccessBonus
    ));
    const result: CollectableWasmTieBreakResult = {
      actionKind,
      expectedScore: expectedScoreForState(core, state)
    };

    memo.set(key, result);
    return result;
  }

  return { select };
}

export function buildCollectablePolicyFromWasmCore(
  request: CollectableSolverRequest,
  core: CollectableWasmPolicyCore,
  options: BuildOptions = {}
): CollectablePolicyNode {
  const mechanics = createCollectableMechanicsContext(request);
  const startingGp = options.startingGp ?? request.temporaryGp;
  const initialState = createInitialCollectableMechanicsState(mechanics, startingGp);
  const selector = options.selector ?? createCollectableWasmPolicySelector(request, core, mechanics);
  const visited = new Map<string, CollectablePolicyNode>();
  let nodeCount = 0;

  function buildNode(state: CollectableMechanicsState): CollectablePolicyNode {
    const key = collectableStateKey(state);
    const cached = visited.get(key);
    if (cached) return cached;

    nodeCount += 1;
    if (options.nodeLimit && nodeCount > options.nodeLimit) {
      throw new Error(`Collectable WASM policy materialization exceeded ${options.nodeLimit} nodes.`);
    }

    const selection = selector.select(state);
    const bestAction = selection.actionKind ?? 'collect';
    const node: CollectablePolicyNode = {
      id: key,
      state: summarizeState(state),
      recommendedAction: actionSummary(bestAction, request.jobType),
      expectedScore: Number(selection.expectedScore.toFixed(6)),
      expectedReward: createZeroReward(),
      expectedTierCounts: createZeroTierCounts(),
      branches: []
    };
    visited.set(key, node);

    if (!canUseCollectableAction(bestAction, state, mechanics)) return node;

    const transitions = applyCollectableAction(bestAction, state, mechanics);
    let expectedReward = createZeroReward();
    let expectedTierCounts = createZeroTierCounts();

    node.branches = transitions.map((transition) => {
      const immediateReward = bestAction === 'collect' && transition.labelKey === 'collectableSolver.branches.collectSuccess'
        ? getCollectableRewardForValue(state.collectability, request.rewardTable)
        : createZeroReward();
      const immediateTierCounts = bestAction === 'collect' && transition.labelKey === 'collectableSolver.branches.collectSuccess'
        ? getCollectableTierCountForValue(state.collectability, request.rewardTable)
        : createZeroTierCounts();
      const immediateScore = bestAction === 'collect' && transition.labelKey === 'collectableSolver.branches.collectSuccess'
        ? scoreCollectability(state.collectability, request.rewardTable, request.objective)
        : 0;
      const childAction = selector.select(transition.state).actionKind;
      const next = childAction ? buildNode(transition.state) : undefined;
      const childReward = next?.expectedReward ?? createZeroReward();
      const childTierCounts = next?.expectedTierCounts ?? createZeroTierCounts();
      const branchReward = addCollectableRewards(immediateReward, childReward);
      const branchTierCounts = addCollectableTierCounts(immediateTierCounts, childTierCounts);

      expectedReward = addCollectableRewards(expectedReward, branchReward, transition.probability);
      expectedTierCounts = addCollectableTierCounts(expectedTierCounts, branchTierCounts, transition.probability);

      return {
        labelKey: transition.labelKey,
        labelKeys: transition.labelKeys,
        conditionKey: transition.conditionKey,
        probability: transition.probability * 100,
        outcome: {
          gp: transition.state.gp,
          integrity: transition.state.integrity,
          collectability: transition.state.collectability,
          reward: branchReward,
          score: immediateScore + (next?.expectedScore ?? 0)
        },
        next
      };
    });

    node.expectedReward = expectedReward;
    node.expectedTierCounts = expectedTierCounts;
    return node;
  }

  return buildNode(initialState);
}

function outcomeDetailKey(score: number, tierCounts: CollectableTierCounts) {
  return [
    score,
    tierCounts.none,
    tierCounts.low,
    tierCounts.mid,
    tierCounts.high
  ].join('|');
}

function compareOutcomeDetails(direction: 'min' | 'max') {
  return (
    left: CollectableWasmPolicyEvaluation['minScoreDetail'],
    right: CollectableWasmPolicyEvaluation['minScoreDetail']
  ) => {
    if (right.probability !== left.probability) return right.probability - left.probability;
    const highDiff = direction === 'max'
      ? right.tierCounts.high - left.tierCounts.high
      : left.tierCounts.high - right.tierCounts.high;
    if (highDiff !== 0) return highDiff;
    const midDiff = direction === 'max'
      ? right.tierCounts.mid - left.tierCounts.mid
      : left.tierCounts.mid - right.tierCounts.mid;
    if (midDiff !== 0) return midDiff;
    return direction === 'max'
      ? right.tierCounts.low - left.tierCounts.low
      : left.tierCounts.low - right.tierCounts.low;
  };
}

function pickRepresentativeOutcomeDetail(
  candidates: CollectableWasmPolicyEvaluation['minScoreDetail'][],
  score: number,
  direction: 'min' | 'max'
): CollectableWasmPolicyEvaluation['minScoreDetail'] {
  if (candidates.length === 0) {
    return {
      score,
      probability: 0,
      tierCounts: createZeroTierCounts()
    };
  }

  return candidates.sort(compareOutcomeDetails(direction))[0];
}

function detailForScore(
  branches: Array<{
    probability: number;
    immediateScore: number;
    immediateTierCounts: CollectableTierCounts;
    result: CollectableWasmPolicyEvaluation;
  }>,
  score: number,
  direction: 'min' | 'max'
): CollectableWasmPolicyEvaluation['minScoreDetail'] {
  const details = new Map<string, CollectableWasmPolicyEvaluation['minScoreDetail']>();

  branches.forEach((branch) => {
    const childDetail = direction === 'min' ? branch.result.minScoreDetail : branch.result.maxScoreDetail;
    if (branch.immediateScore + childDetail.score !== score) return;

    const totalTierCounts = addCollectableTierCounts(branch.immediateTierCounts, childDetail.tierCounts);
    const key = outcomeDetailKey(score, totalTierCounts);
    const current = details.get(key);
    details.set(key, {
      score,
      probability: (current?.probability ?? 0) + childDetail.probability * branch.probability,
      tierCounts: totalTierCounts
    });
  });

  return pickRepresentativeOutcomeDetail([...details.values()], score, direction);
}

function terminalEvaluation(): CollectableWasmPolicyEvaluation {
  return {
    expectedScore: 0,
    expectedReward: createZeroReward(),
    expectedTierCounts: createZeroTierCounts(),
    outcomes: new Map([[0, 1]]),
    minScoreDetail: {
      score: 0,
      probability: 1,
      tierCounts: createZeroTierCounts()
    },
    maxScoreDetail: {
      score: 0,
      probability: 1,
      tierCounts: createZeroTierCounts()
    }
  };
}

export function evaluateCollectablePolicyFromWasmCore(
  request: CollectableSolverRequest,
  core: CollectableWasmPolicyCore,
  options: BuildOptions = {}
): CollectableWasmPolicyEvaluation {
  const mechanics = createCollectableMechanicsContext(request);
  const startingGp = options.startingGp ?? request.temporaryGp;
  const initialState = createInitialCollectableMechanicsState(mechanics, startingGp);
  const selector = options.selector ?? createCollectableWasmPolicySelector(request, core, mechanics);
  const memo = new Map<string, CollectableWasmPolicyEvaluation>();

  function evaluate(state: CollectableMechanicsState): CollectableWasmPolicyEvaluation {
    if (state.integrity <= 0) return terminalEvaluation();

    const key = collectableStateKey(state);
    const cached = memo.get(key);
    if (cached) return cached;

    const bestAction = selector.select(state).actionKind;
    if (!bestAction || !canUseCollectableAction(bestAction, state, mechanics)) {
      const terminal = terminalEvaluation();
      memo.set(key, terminal);
      return terminal;
    }

    let expectedScore = 0;
    let expectedReward = createZeroReward();
    let expectedTierCounts = createZeroTierCounts();
    const outcomes = new Map<number, number>();
    const evaluatedBranches = applyCollectableAction(bestAction, state, mechanics).map((transition) => {
      const immediateReward = bestAction === 'collect' && transition.labelKey === 'collectableSolver.branches.collectSuccess'
        ? getCollectableRewardForValue(state.collectability, request.rewardTable)
        : createZeroReward();
      const immediateTierCounts = bestAction === 'collect' && transition.labelKey === 'collectableSolver.branches.collectSuccess'
        ? getCollectableTierCountForValue(state.collectability, request.rewardTable)
        : createZeroTierCounts();
      const immediateScore = bestAction === 'collect' && transition.labelKey === 'collectableSolver.branches.collectSuccess'
        ? scoreCollectability(state.collectability, request.rewardTable, request.objective)
        : 0;
      const result = evaluate(transition.state);
      const branchReward = addCollectableRewards(immediateReward, result.expectedReward);
      const branchTierCounts = addCollectableTierCounts(immediateTierCounts, result.expectedTierCounts);

      expectedReward = addCollectableRewards(expectedReward, branchReward, transition.probability);
      expectedTierCounts = addCollectableTierCounts(expectedTierCounts, branchTierCounts, transition.probability);
      expectedScore += (immediateScore + result.expectedScore) * transition.probability;
      result.outcomes.forEach((probability, score) => {
        const totalScore = immediateScore + score;
        outcomes.set(totalScore, (outcomes.get(totalScore) ?? 0) + probability * transition.probability);
      });

      return {
        probability: transition.probability,
        immediateScore,
        immediateTierCounts,
        result
      };
    });

    const scores = [...outcomes.keys()].sort((left, right) => left - right);
    const minScore = scores[0] ?? 0;
    const maxScore = scores[scores.length - 1] ?? 0;
    const evaluation: CollectableWasmPolicyEvaluation = {
      expectedScore,
      expectedReward,
      expectedTierCounts,
      outcomes,
      minScoreDetail: detailForScore(evaluatedBranches, minScore, 'min'),
      maxScoreDetail: detailForScore(evaluatedBranches, maxScore, 'max')
    };
    memo.set(key, evaluation);
    return evaluation;
  }

  return evaluate(initialState);
}

export function attachCollectableRevisitGate(
  policy: CollectablePolicyNode,
  nextPolicy: CollectablePolicyNode,
  probability: number,
  jobType: CollectableSolverRequest['jobType']
): CollectablePolicyNode {
  const visited = new Map<string, CollectablePolicyNode>();

  function clone(node: CollectablePolicyNode): CollectablePolicyNode {
    const cached = visited.get(node.id);
    if (cached) return cached;

    const cloned: CollectablePolicyNode = {
      ...node,
      state: { ...node.state },
      recommendedAction: { ...node.recommendedAction },
      expectedReward: { ...node.expectedReward, items: { ...node.expectedReward.items } },
      expectedTierCounts: { ...node.expectedTierCounts },
      branches: []
    };
    visited.set(node.id, cloned);
    cloned.branches = node.branches.map((branch, index) => ({
      ...branch,
      outcome: {
        ...branch.outcome,
        reward: {
          ...branch.outcome.reward,
          items: { ...branch.outcome.reward.items }
        }
      },
      next: branch.next
        ? clone(branch.next)
        : createRevisitGateNode(node, branch, index)
    }));

    return cloned;
  }

  function createRevisitGateNode(
    parent: CollectablePolicyNode,
    branch: CollectablePolicyNode['branches'][number],
    index: number
  ): CollectablePolicyNode {
    return {
      id: `${parent.id}|revisit|${index}`,
      state: {
        gp: branch.outcome.gp,
        integrity: branch.outcome.integrity,
        collectability: branch.outcome.collectability,
        scrutinyActive: false,
        collectorsFocusActive: false,
        primingTouchActive: false,
        standardActive: false,
        successBonus: 0,
        nextCollectSuccessBonus: 0,
        wiseToTheWorldActive: false
      },
      recommendedAction: actionSummary('revisitCheck', jobType),
      expectedScore: Number((probability * nextPolicy.expectedScore).toFixed(6)),
      expectedReward: addCollectableRewards(createZeroReward(), nextPolicy.expectedReward, probability),
      expectedTierCounts: addCollectableTierCounts(createZeroTierCounts(), nextPolicy.expectedTierCounts, probability),
      branches: [
        {
          labelKey: 'collectableSolver.branches.revisitProc',
          conditionKey: 'collectableSolver.conditions.revisitProc',
          probability: probability * 100,
          outcome: branch.outcome,
          next: nextPolicy
        },
        {
          labelKey: 'collectableSolver.branches.revisitNoProc',
          conditionKey: 'collectableSolver.conditions.revisitNoProc',
          probability: (1 - probability) * 100,
          outcome: branch.outcome
        }
      ]
    };
  }

  return clone(policy);
}
