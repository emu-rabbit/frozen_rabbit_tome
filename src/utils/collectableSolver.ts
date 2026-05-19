import { calculateSuccessRate } from './gatheringMath';
import {
  COLLECTABILITY_CAP,
  addCollectableRewards,
  calculateScrutinyBonus,
  calculateValueIncreaseRate,
  createZeroReward,
  getCollectableRewardForValue,
  scoreCollectableReward
} from './collectableMath';
import {
  COLLECTABLE_STATE_KEY_FIELDS,
  applyCollectableAction,
  collectableStateKey,
  createCollectableMechanicsContext,
  createInitialCollectableMechanicsState,
  type CollectableMechanicsContext,
  type CollectableMechanicsState
} from './collectableMechanics';
import { COLLECTABLE_ACTION_DEFINITIONS, getCollectableActionId } from '../services/collectableActions';
import { summarizeCollectableRewardTable } from '../services/collectableRewards';
import type {
  CollectableActionKind,
  CollectableActionSummary,
  CollectablePolicyBranch,
  CollectablePolicyNode,
  CollectablePolicyPlan,
  CollectableRewardVector,
  CollectableSearchDebugInfo,
  CollectableSolverDebugInfo,
  CollectableSolverRequest,
  CollectableSolverResult,
  CollectableStateSummary
} from '../types/collectable';
import type { SolverObjectiveMode } from '../types/game';

type SearchState = CollectableMechanicsState;

interface SearchResult {
  expectedScore: number;
  expectedReward: CollectableRewardVector;
  outcomes: Map<number, number>;
  policy: CollectablePolicyNode;
  gpSpent: number;
  actionCount: number;
  nodeCount: number;
}

interface SearchRunResult extends SearchResult {
  startingGp: number;
  search: CollectableSearchDebugInfo;
}

interface ActionOption {
  kind: CollectableActionKind;
  priority: number;
  apply: (state: SearchState, solve: (state: SearchState) => SearchResult) => SearchResult;
}

type WeightedState = {
  state: SearchState;
  probability: number;
  labelKey: string;
  labelKeys?: string[];
  conditionKey: string;
  reward?: CollectableRewardVector;
};

type ScoreSummary = {
  minScore: number;
  maxScore: number;
  minScoreChance: number;
  maxScoreChance: number;
};

const EV_EPSILON = 0.0000001;
const REGULAR_REVISIT_CHANCE = 0.05;
const TIMED_REVISIT_CHANCE = 0.08;
const STATE_KEY_FIELDS = [...COLLECTABLE_STATE_KEY_FIELDS];

function emptyPolicy(state: SearchState): CollectablePolicyNode {
  return {
    id: buildMemoKey(state),
    state: summarizeState(state),
    recommendedAction: actionSummary('collect', 'miner'),
    expectedScore: 0,
    expectedReward: createZeroReward(),
    branches: []
  };
}

function buildMemoKey(state: SearchState): string {
  return collectableStateKey(state);
}

function summarizeState(state: SearchState): CollectableStateSummary {
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

function actionSummary(kind: CollectableActionKind, jobType: CollectableSolverRequest['jobType']): CollectableActionSummary {
  const definition = COLLECTABLE_ACTION_DEFINITIONS[kind];
  return {
    kind,
    actionId: getCollectableActionId(kind, jobType),
    nameKey: `collectableSolver.actions.${kind}`,
    gpCost: definition.gpCost
  };
}

function calculateSuccessFormulaDebug(
  gathering: number,
  baseGathering: number,
  playerLevel: number,
  itemLevel: number
) {
  const score = baseGathering ? Math.floor((100 * gathering) / baseGathering) : 0;
  const finalRate = calculateSuccessRate(gathering, baseGathering, playerLevel, itemLevel);
  const rawRate = calculateSuccessRate(gathering, baseGathering, playerLevel, 0);
  const levelDifference = itemLevel > 0 ? playerLevel - itemLevel : 0;
  const levelModifier = finalRate - rawRate;

  return {
    gathering,
    baseGathering,
    score,
    rawRate,
    levelDifference,
    levelModifier,
    finalRate
  };
}

export function solveCollectableRotation(request: CollectableSolverRequest): CollectableSolverResult {
  const { stats, baseValues, itemLevel, nodeBonuses, temporaryGp, jobType, rewardTable, objective } = request;
  const objectiveMode: SolverObjectiveMode = request.objectiveMode ?? 'expected';
  const baseValueIncreaseRate = calculateValueIncreaseRate(stats.gathering, baseValues.Gathering);
  const mechanics = createCollectableMechanicsContext(request);
  let memo = new Map<string, SearchResult>();
  let activeSearchStats: CollectableSearchDebugInfo | null = null;

  function solve(state: SearchState): SearchResult {
    if (state.integrity <= 0) {
      activeSearchStats && (activeSearchStats.terminalStates += 1);
      return {
        expectedScore: 0,
        expectedReward: createZeroReward(),
        outcomes: new Map([[0, 1]]),
        policy: emptyPolicy(state),
        gpSpent: 0,
        actionCount: 0,
        nodeCount: 1
      };
    }

    const memoKey = buildMemoKey(state);
    const cached = memo.get(memoKey);
    if (cached) {
      activeSearchStats && (activeSearchStats.memoHits += 1);
      return cached;
    }

    activeSearchStats && (activeSearchStats.statesSolved += 1);
    let best = applyCollect(state, solve);
    const actions = buildActions(state).sort((left, right) => left.priority - right.priority);

    actions.forEach((action) => {
      activeSearchStats && (activeSearchStats.actionsEvaluated += 1);
      const candidate = action.apply(state, solve);
      activeSearchStats && (activeSearchStats.candidateComparisons += 1);
      if (isPreferred(candidate, best)) {
        best = candidate;
      }
    });

    memo.set(memoKey, best);
    return best;
  }

  function buildActions(state: SearchState): ActionOption[] {
    const wiseAction = createWiseToTheWorldAction(state);
    if (wiseAction) return [wiseAction];

    const actions: ActionOption[] = [];
    const canRefineCollectability = state.collectability < COLLECTABILITY_CAP;

    if (canRefineCollectability && state.gp >= 200 && !state.scrutinyActive) {
      actions.push(buffAction('scrutiny', 10, 200));
    }

    if (canRefineCollectability && state.gp >= 100 && !state.collectorsFocusActive) {
      actions.push(buffAction('collectorsFocus', 20, 100));
    }

    if (canRefineCollectability && state.gp >= 100 && !state.primingTouchActive) {
      actions.push(buffAction('primingTouch', 30, 100));
    }

    if (mechanics.baseSuccessRate + state.successBonus < 100 && !state.hasCollected) {
      if (stats.level >= 10 && state.gp >= 250 && !state.successIIIActive) {
        actions.push(buffAction('successIII', 40, 250));
      }

      if (stats.level >= 5 && state.gp >= 100 && !state.successIIActive) {
        actions.push(buffAction('successII', 41, 100));
      }

      if (stats.level >= 4 && state.gp >= 50 && !state.successIActive) {
        actions.push(buffAction('successI', 42, 50));
      }

      if (stats.level >= 23 && state.gp >= 50 && state.nextCollectSuccessBonus === 0) {
        actions.push(buffAction('nextCollectSuccess', 50, 50));
      }
    }

    addIntegrityRestoreActions(actions, state);

    if (canRefineCollectability) {
      actions.push({
        kind: 'scour',
        priority: 70,
        apply: (current, nextSolve) => applyRefine(current, nextSolve, 'scour')
      });
      actions.push({
        kind: 'meticulous',
        priority: 80,
        apply: (current, nextSolve) => applyRefine(current, nextSolve, 'meticulous')
      });
    }

    return actions;
  }

  function addIntegrityRestoreActions(actions: ActionOption[], state: SearchState) {
    const missingIntegrity = mechanics.maxIntegrity - state.integrity;

    if (stats.level < 25 || state.gp < 300 || missingIntegrity < 1) return;

    actions.push({
      kind: 'restoreIntegrity',
      priority: 65,
      apply: (current, nextSolve) => applyMechanicsAction(current, nextSolve, 'restoreIntegrity', 300, 1)
    });
  }

  function createWiseToTheWorldAction(state: SearchState): ActionOption | null {
    const missingIntegrity = mechanics.maxIntegrity - state.integrity;
    if (!state.wiseToTheWorldActive || missingIntegrity < 1) return null;

    return {
      kind: 'wiseToTheWorld',
      priority: 0,
      apply: (current, nextSolve) => applyMechanicsAction(current, nextSolve, 'wiseToTheWorld', 0, 1)
    };
  }

  function buffAction(kind: CollectableActionKind, priority: number, gpCost: number): ActionOption {
    return {
      kind,
      priority,
      apply: (state, nextSolve) => applyMechanicsAction(state, nextSolve, kind, gpCost, 1)
    };
  }

  function applyCollect(state: SearchState, nextSolve: (state: SearchState) => SearchResult): SearchResult {
    const reward = getCollectableRewardForValue(state.collectability, rewardTable);
    return applyMechanicsAction(state, nextSolve, 'collect', 0, 1, (branch) => (
      branch.labelKey === 'collectableSolver.branches.collectSuccess' ? reward : createZeroReward()
    ));
  }

  function applyRefine(
    state: SearchState,
    nextSolve: (state: SearchState) => SearchResult,
    kind: 'scour' | 'meticulous'
  ): SearchResult {
    return applyMechanicsAction(state, nextSolve, kind, 0, 1);
  }

  function applyMechanicsAction(
    state: SearchState,
    nextSolve: (state: SearchState) => SearchResult,
    kind: CollectableActionKind,
    gpSpent: number,
    actionCount: number,
    rewardForBranch: (branch: WeightedState) => CollectableRewardVector = () => createZeroReward()
  ): SearchResult {
    const branches: WeightedState[] = applyCollectableAction(kind, state, mechanics).map((transition) => ({
      state: transition.state,
      probability: transition.probability,
      labelKey: transition.labelKey,
      labelKeys: transition.labelKeys,
      conditionKey: transition.conditionKey
    }));
    const branchesWithReward = branches.map((branch) => ({
      ...branch,
      reward: rewardForBranch(branch)
    }));
    const results = branchesWithReward.map((branch) => nextSolve(branch.state));

    return buildPolicyResult(state, kind, branchesWithReward, results, gpSpent, actionCount);
  }

  function buildPolicyResult(
    state: SearchState,
    kind: CollectableActionKind,
    branches: WeightedState[],
    results: SearchResult[],
    gpSpent: number,
    actionCount: number
  ): SearchResult {
    let expectedReward = createZeroReward();
    let expectedScore = 0;
    let nodeCount = 1;
    const policyBranches: CollectablePolicyBranch[] = branches.map((branch, index) => {
      const result = results[index];
      const branchReward = addCollectableRewards(branch.reward ?? createZeroReward(), result.expectedReward);
      const branchScore = scoreCollectableReward(branchReward, objective);
      expectedReward = addCollectableRewards(expectedReward, branchReward, branch.probability);
      expectedScore += branchScore * branch.probability;
      nodeCount += result.nodeCount;
      activeSearchStats && (activeSearchStats.branchCount += 1);

      return {
        labelKey: branch.labelKey,
        labelKeys: branch.labelKeys,
        conditionKey: branch.conditionKey,
        probability: branch.probability * 100,
        outcome: {
          gp: branch.state.gp,
          integrity: branch.state.integrity,
          collectability: branch.state.collectability,
          reward: branchReward,
          score: branchScore
        },
        next: result.policy.branches.length > 0 ? result.policy : undefined
      };
    });
    const outcomes = mergeOutcomeDistributions(branches, results);

    return {
      expectedScore,
      expectedReward,
      outcomes,
      gpSpent: gpSpent + weightedSum(results, branches, 'gpSpent'),
      actionCount: actionCount + weightedSum(results, branches, 'actionCount'),
      nodeCount,
      policy: {
        id: buildMemoKey(state),
        state: summarizeState(state),
        recommendedAction: actionSummary(kind, jobType),
        expectedScore: Number(expectedScore.toFixed(6)),
        expectedReward,
        branches: policyBranches
      }
    };
  }

  function weightedSum(results: SearchResult[], branches: WeightedState[], field: 'gpSpent' | 'actionCount') {
    return results.reduce((sum, result, index) => sum + result[field] * branches[index].probability, 0);
  }

  function mergeOutcomeDistributions(branches: WeightedState[], results: SearchResult[]) {
    const outcomes = new Map<number, number>();

    branches.forEach((branch, index) => {
      const immediateScore = scoreCollectableReward(branch.reward ?? createZeroReward(), objective);
      results[index].outcomes.forEach((probability, score) => {
        const totalScore = immediateScore + score;
        outcomes.set(totalScore, (outcomes.get(totalScore) ?? 0) + probability * branch.probability);
      });
    });

    return outcomes;
  }

  function isPreferred(candidate: SearchResult, current: SearchResult): boolean {
    const candidateScore = scoreSearchResult(candidate);
    const currentScore = scoreSearchResult(current);

    if (candidateScore > currentScore + EV_EPSILON) return true;
    if (candidateScore < currentScore - EV_EPSILON) return false;
    if (candidate.gpSpent !== current.gpSpent) return candidate.gpSpent < current.gpSpent;
    if (habitPreferenceScore(candidate) !== habitPreferenceScore(current)) {
      return habitPreferenceScore(candidate) > habitPreferenceScore(current);
    }
    if (candidate.actionCount !== current.actionCount) return candidate.actionCount < current.actionCount;
    return candidate.nodeCount < current.nodeCount;
  }

  function habitPreferenceScore(result: SearchResult): number {
    let score = 0;
    const nextCollectSuccessDepth = findActionDepth(result.policy, 'nextCollectSuccess');

    if (nextCollectSuccessDepth !== null) {
      score += 1000 - nextCollectSuccessDepth * 50;
    }

    const wiseToTheWorldDepth = findActionDepth(result.policy, 'wiseToTheWorld');
    if (wiseToTheWorldDepth !== null) {
      score += 800 - wiseToTheWorldDepth * 40;
    }

    score += integrityRestorePreferenceScore(result.policy);

    return score;
  }

  function integrityRestorePreferenceScore(
    node: CollectablePolicyNode,
    depth = 0,
    visited = new Set<string>()
  ): number {
    if (visited.has(node.id)) return 0;
    visited.add(node.id);

    let score = 0;
    if (node.recommendedAction.kind === 'restoreIntegrity') {
      const missingIntegrity = mechanics.maxIntegrity - node.state.integrity;
      const preferredMissingIntegrity = stats.level >= 90 ? 2 : 1;
      score += missingIntegrity >= preferredMissingIntegrity ? 500 - depth * 20 : -500;
    }

    return node.branches.reduce((total, branch) => {
      return total + (branch.next ? integrityRestorePreferenceScore(branch.next, depth + 1, visited) : 0);
    }, score);
  }

  function findActionDepth(
    node: CollectablePolicyNode,
    actionKind: CollectableActionKind,
    depth = 0,
    visited = new Set<string>()
  ): number | null {
    if (visited.has(node.id)) return null;
    visited.add(node.id);

    if (node.recommendedAction.kind === actionKind) return depth;

    const childDepths = node.branches
      .map((branch) => branch.next ? findActionDepth(branch.next, actionKind, depth + 1, visited) : null)
      .filter((childDepth): childDepth is number => childDepth !== null);

    return childDepths.length > 0 ? Math.min(...childDepths) : null;
  }

  function scoreSearchResult(result: SearchResult): number {
    if (objectiveMode === 'max') return getMaxScore(result.outcomes);
    if (objectiveMode === 'min') return getMinScore(result.outcomes);

    return result.expectedScore;
  }

  function solveWithGp(startingGp: number): SearchRunResult {
    memo = new Map<string, SearchResult>();
    activeSearchStats = {
      startingGp: Math.min(stats.gp, startingGp),
      statesSolved: 0,
      memoHits: 0,
      actionsEvaluated: 0,
      candidateComparisons: 0,
      terminalStates: 0,
      branchCount: 0
    };

    const result = solve(createInitialCollectableMechanicsState(mechanics, startingGp));
    const search = activeSearchStats;
    search.memoHitRate = calculateMemoHitRate(search);
    activeSearchStats = null;

    return {
      ...result,
      startingGp: Math.min(stats.gp, startingGp),
      search
    };
  }

  const initial = solveWithGp(temporaryGp);
  const isFullGp = Math.min(stats.gp, temporaryGp) >= stats.gp;
  const revisitEnabled = stats.level >= 91;
  const revisitChance = revisitEnabled ? (request.isTimedNode ? TIMED_REVISIT_CHANCE : REGULAR_REVISIT_CHANCE) : 0;
  const fullGpResult = revisitEnabled && !isFullGp ? solveWithGp(stats.gp) : initial;
  const initialSummary = summarizeOutcomes(initial.outcomes);
  const fullGpSummary = summarizeOutcomes(fullGpResult.outcomes);
  const revisitOutcomes = combineSequentialOutcomes(initial.outcomes, fullGpResult.outcomes);
  const combinedOutcomes = revisitEnabled
    ? mergeWeightedOutcomeMaps([
        { outcomes: initial.outcomes, weight: 1 - revisitChance },
        { outcomes: revisitOutcomes, weight: revisitChance }
      ])
    : initial.outcomes;
  const combinedSummary = summarizeOutcomes(combinedOutcomes);
  const expectedScore = expectedValue(combinedOutcomes);
  const expectedReward = revisitEnabled
    ? addCollectableRewards(initial.expectedReward, fullGpResult.expectedReward, revisitChance)
    : initial.expectedReward;
  const revisitPolicy = fullGpResult.policy;
  const primaryPolicy = revisitEnabled
    ? attachRevisitGate(initial.policy, revisitPolicy, revisitChance)
    : initial.policy;
  const policyPlans: CollectablePolicyPlan[] = isFullGp || !revisitEnabled
    ? [{
        kind: 'primary',
        startingGp: initial.startingGp,
        expectedScore: Number(initial.expectedScore.toFixed(6)),
        minScore: initialSummary.minScore,
        maxScore: initialSummary.maxScore,
        minScoreChance: initialSummary.minScoreChance,
        maxScoreChance: initialSummary.maxScoreChance,
        expectedReward: initial.expectedReward,
        policy: primaryPolicy
      }]
    : [
        {
          kind: 'primary',
          startingGp: initial.startingGp,
          expectedScore: Number(initial.expectedScore.toFixed(6)),
          minScore: initialSummary.minScore,
          maxScore: initialSummary.maxScore,
          minScoreChance: initialSummary.minScoreChance,
          maxScoreChance: initialSummary.maxScoreChance,
          expectedReward: initial.expectedReward,
          policy: primaryPolicy
        },
        {
          kind: 'revisit',
          startingGp: fullGpResult.startingGp,
          expectedScore: Number(fullGpResult.expectedScore.toFixed(6)),
          minScore: fullGpSummary.minScore,
          maxScore: fullGpSummary.maxScore,
          minScoreChance: fullGpSummary.minScoreChance,
          maxScoreChance: fullGpSummary.maxScoreChance,
          expectedReward: fullGpResult.expectedReward,
          policy: revisitPolicy
        }
      ];
  const response: CollectableSolverResult = {
    expectedScore: Number(expectedScore.toFixed(6)),
    minScore: combinedSummary.minScore,
    maxScore: combinedSummary.maxScore,
    minScoreChance: combinedSummary.minScoreChance,
    maxScoreChance: combinedSummary.maxScoreChance,
    objectiveMode,
    expectedReward,
    rewardItemId: rewardTable.rewardItemId,
    policyPlans,
    revisit: {
      enabled: revisitEnabled,
      chance: revisitChance,
      isFullGp
    },
    policy: primaryPolicy,
    calculationTime: 0
  };

  if (request.debugMode) {
    response.debug = buildDebugInfo();
  }

  return response;

  function buildDebugInfo(): CollectableSolverDebugInfo {
    return {
      formulas: {
        success: calculateSuccessFormulaDebug(stats.gathering, baseValues.Gathering, stats.level, itemLevel),
        collectable: {
          gathering: stats.gathering,
          baseGathering: baseValues.Gathering,
          perception: stats.perception,
          basePerception: baseValues.Perception,
          scourValue: mechanics.scourValue,
          baseValueIncreaseRate,
          valueIncreaseRate: mechanics.valueIncreaseRate,
          focusedValueIncreaseRate: mechanics.focusedValueIncreaseRate,
          hasRelicToolBonus: !!request.hasRelicToolBonus,
          meticulousRate: mechanics.meticulousRate,
          primedMeticulousRate: mechanics.primedMeticulousRate,
          scrutinyMultiplier: mechanics.scrutinyMultiplier,
          scrutinyBonus: calculateScrutinyBonus(mechanics.scourValue, mechanics.scrutinyMultiplier),
          standardProcRate: mechanics.standardProcRate
        },
        rewardTable: summarizeCollectableRewardTable(rewardTable)
      },
      plans: policyPlans.map((plan) => {
        const run = plan.kind === 'revisit' ? fullGpResult : initial;
        return {
          kind: plan.kind,
          startingGp: run.startingGp,
          expectedScore: Number(run.expectedScore.toFixed(6)),
          outcomeDistribution: serializeOutcomes(run.outcomes),
          search: run.search
        };
      }),
      combined: {
        expectedScore: Number(expectedScore.toFixed(6)),
        revisitChance,
        expression: revisitEnabled
          ? `${Number(initial.expectedScore.toFixed(6))} + ${revisitChance} * ${Number(fullGpResult.expectedScore.toFixed(6))}`
          : `${Number(initial.expectedScore.toFixed(6))}`
      },
      limitations: [
        'brazen-excluded',
        'high-standard-excluded',
        'reduction-reward-model-excluded'
      ],
      optimality: {
        method: 'dynamic-programming-policy-search',
        stateKeyFields: STATE_KEY_FIELDS
      }
    };
  }

  function attachRevisitGate(
    policy: CollectablePolicyNode,
    nextPolicy: CollectablePolicyNode,
    probability: number
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
          : createRevisitGateNode(node, branch, index, nextPolicy, probability)
      }));

      return cloned;
    }

    return clone(policy);
  }

  function createRevisitGateNode(
    parent: CollectablePolicyNode,
    branch: CollectablePolicyBranch,
    index: number,
    nextPolicy: CollectablePolicyNode,
    probability: number
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
}

function getMinScore(outcomes: Map<number, number>): number {
  return Math.min(...outcomes.keys());
}

function getMaxScore(outcomes: Map<number, number>): number {
  return Math.max(...outcomes.keys());
}

function summarizeOutcomes(outcomes: Map<number, number>): ScoreSummary {
  const scores = [...outcomes.keys()].sort((left, right) => left - right);
  const minScore = scores[0] ?? 0;
  const maxScore = scores[scores.length - 1] ?? 0;

  return {
    minScore,
    maxScore,
    minScoreChance: (outcomes.get(minScore) ?? 0) * 100,
    maxScoreChance: (outcomes.get(maxScore) ?? 0) * 100
  };
}

function serializeOutcomes(outcomes: Map<number, number>) {
  return [...outcomes.entries()]
    .sort(([leftScore], [rightScore]) => leftScore - rightScore)
    .map(([score, probability]) => ({
      score,
      probability: probability * 100
    }));
}

function combineSequentialOutcomes(left: Map<number, number>, right: Map<number, number>) {
  const outcomes = new Map<number, number>();

  left.forEach((leftProbability, leftScore) => {
    right.forEach((rightProbability, rightScore) => {
      const totalScore = leftScore + rightScore;
      outcomes.set(totalScore, (outcomes.get(totalScore) ?? 0) + leftProbability * rightProbability);
    });
  });

  return outcomes;
}

function mergeWeightedOutcomeMaps(parts: Array<{ outcomes: Map<number, number>; weight: number }>) {
  const outcomes = new Map<number, number>();

  parts.forEach((part) => {
    part.outcomes.forEach((probability, score) => {
      outcomes.set(score, (outcomes.get(score) ?? 0) + probability * part.weight);
    });
  });

  return outcomes;
}

function expectedValue(outcomes: Map<number, number>): number {
  let total = 0;
  outcomes.forEach((probability, score) => {
    total += score * probability;
  });
  return total;
}

function calculateMemoHitRate(search: CollectableSearchDebugInfo): number {
  const cacheableLookups = search.statesSolved + search.memoHits;
  if (cacheableLookups === 0) return 0;
  return Number(((search.memoHits / cacheableLookups) * 100).toFixed(2));
}
