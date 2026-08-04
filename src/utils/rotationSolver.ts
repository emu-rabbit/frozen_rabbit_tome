import { calculateBoonChance } from './gatheringMath';
import { buildModelVersionsForScenario } from '../config/modelVersions';
import type { SolverDebugInfo, SolverObjectiveMode, SolverRequest, SolverResponse, SolverSearchDebugInfo } from '../types/game';
import {
  REGULAR_GATHERING_STATE_KEY_FIELDS,
  applyRegularGatheringAction,
  canUseRegularGatheringAction,
  createInitialRegularGatheringMechanicsState,
  createRegularGatheringMechanicsContext,
  gpPerGather,
  regularGatheringActionGpCost,
  regularGatheringStateKey,
  type RegularGatheringActionKind,
  type RegularGatheringActionTransition,
  type RegularGatheringMechanicsContext,
  type RegularGatheringMechanicsState
} from './regularGatheringMechanics';

type JobType = SolverRequest['jobType'];

interface SolverResult {
  expectedYield: number;
  rotation: string[];
  outcomes: Map<number, number>;
  gpSpent: number;
  habitScore: number;
}

type SearchState = RegularGatheringMechanicsState;

interface ActionOption {
  name: string;
  priority: number;
  gpCost: number;
  apply: (state: SearchState, solve: (state: SearchState) => SolverResult) => SolverResult;
}

interface SearchRunResult extends SolverResult {
  startingGp: number;
  search: SolverSearchDebugInfo;
}

const SUCCESS_CAP = 100;
const BOON_CAP = 100;
const EV_EPSILON = 0.0000001;
const REGULAR_REVISIT_CHANCE = 0.05;
const TIMED_REVISIT_CHANCE = 0.08;
const GATHER_ACTION = '採集';
const WISE_TO_THE_WORLD_ACTION = '理智同興(若觸發)';
const WISE_PROC_GATHER_ACTION = '採集(理智觸發)';
const STATE_KEY_FIELDS = [...REGULAR_GATHERING_STATE_KEY_FIELDS];

type OutcomeSummary = {
  minYield: number;
  maxYield: number;
  minYieldChance: number;
  maxYieldChance: number;
};

function actionNames(jobType: JobType) {
  const isMiner = jobType === 'miner';

  return {
    successI: isMiner ? '敏銳視野' : '環境探知',
    successII: isMiner ? '敏銳視野II' : '環境探知II',
    successIII: isMiner ? '敏銳視野III' : '環境探知III',
    giftI: isMiner ? '富礦的饋贈I' : '沃土的饋贈I',
    giftII: isMiner ? '富礦的饋贈II' : '沃土的饋贈II',
    clearVision: isMiner ? '明晰視野' : '植被專精',
    bountifulI: isMiner ? '高產' : '豐收',
    bountifulII: isMiner ? '高產II' : '豐收II',
    restore: isMiner ? '石工之理' : '農夫之智',
    kingI: isMiner ? '莫非王土' : '天賜收成',
    kingII: isMiner ? '莫非王土II' : '天賜收成II',
    tidings: isMiner ? '納爾札爾福音' : '諾菲卡福音'
  };
}

function calculateSuccessFormulaDebug(
  gathering: number,
  baseGathering: number,
  playerLevel: number,
  itemLevel: number
) {
  if (!baseGathering) {
    return {
      gathering,
      baseGathering,
      score: 0,
      rawRate: 0,
      levelDifference: itemLevel > 0 ? playerLevel - itemLevel : 0,
      levelModifier: 0,
      finalRate: 0
    };
  }

  const score = Math.floor((100 * gathering) / baseGathering);
  let rawRate = 0;

  if (score >= 80) rawRate = 100;
  else if (score >= 76) rawRate = 94 + (score - 75) * 1;
  else if (score >= 64) rawRate = 72 + (score - 64) * 2;
  else if (score >= 46) rawRate = 60 + Math.floor(((score - 45) * 5) / 9);
  else if (score === 45) rawRate = 60;
  else if (score === 44) rawRate = 58;
  else if (score >= 41) rawRate = 52 + (score - 40) * 2;
  else if (score >= 21) rawRate = Math.floor(20 + (score - 20) * 1.6);
  else if (score >= 11) rawRate = 2 + (score - 11) * 2;
  else if (score >= 1) rawRate = 1;

  const levelDifference = itemLevel > 0 ? playerLevel - itemLevel : 0;
  let levelModifier = 0;

  if (itemLevel > 0 && rawRate > 0 && rawRate < 100) {
    levelModifier = levelDifference > 0
      ? Math.min(5, levelDifference)
      : Math.max(-25, levelDifference * 5);
  }

  return {
    gathering,
    baseGathering,
    score,
    rawRate,
    levelDifference,
    levelModifier,
    finalRate: Math.min(100, Math.max(0, rawRate + levelModifier))
  };
}

function calculateBoonFormulaDebug(perception: number, basePerception: number) {
  const score = basePerception
    ? Math.min(150, Math.floor((100 * perception) / basePerception))
    : 0;

  return {
    perception,
    basePerception,
    score,
    finalRate: calculateBoonChance(perception, basePerception)
  };
}

function buildMemoKey(state: SearchState): string {
  return regularGatheringStateKey(state);
}

export function solveGatheringRotation(request: SolverRequest): SolverResponse {
  const { stats, baseValues, itemLevel, nodeBonuses, temporaryGp, jobType, isTimedNode = false } = request;
  const objectiveMode: SolverObjectiveMode = request.objectiveMode ?? 'expected';
  const names = actionNames(jobType);
  const mechanics = createRegularGatheringMechanicsContext(request);
  const maxIntegrity = mechanics.maxIntegrity;
  const baseSuccessRate = mechanics.baseSuccessRate;
  const baseBoonChance = mechanics.baseBoonChance;
  const bountifulAmount = mechanics.bountifulYield;
  const gatherGp = gpPerGather(stats.level);
  const memo = new Map<string, SolverResult>();
  let activeSearchStats: SolverSearchDebugInfo | null = null;

  const canRaiseSuccess = baseSuccessRate > 1 && baseSuccessRate < SUCCESS_CAP;
  const canRaiseBoon = baseBoonChance + nodeBonuses.extraRate > 1;

  function solve(state: SearchState): SolverResult {
    if (state.integrity <= 0) {
      activeSearchStats && (activeSearchStats.terminalStates += 1);
      return { expectedYield: 0, rotation: [], outcomes: new Map([[0, 1]]), gpSpent: 0, habitScore: 0 };
    }

    const memoKey = buildMemoKey(state);
    const memoized = memo.get(memoKey);
    if (memoized) {
      activeSearchStats && (activeSearchStats.memoHits += 1);
      return memoized;
    }

    activeSearchStats && (activeSearchStats.statesSolved += 1);

    let best = gather(state);
    const actions = buildActions(state).sort((a, b) => a.priority - b.priority);

    for (const action of actions) {
      activeSearchStats && (activeSearchStats.actionsEvaluated += 1);
      const result = action.apply(state, solve);
      const candidate = {
        expectedYield: result.expectedYield,
        rotation: [action.name, ...result.rotation],
        outcomes: result.outcomes,
        gpSpent: action.gpCost + result.gpSpent,
        habitScore: result.habitScore
      };

      activeSearchStats && (activeSearchStats.candidateComparisons += 1);
      if (isPreferredResult(candidate, best)) {
        best = candidate;
      }
    }

    memo.set(memoKey, best);
    return best;
  }

  function gather(state: SearchState): SolverResult {
    const outcomes = new Map<number, number>();
    const branches = applyRegularGatheringAction('gather', state, mechanics);
    const results = branches.map((branch) => solve(branch.state));

    activeSearchStats && (activeSearchStats.branchCount += branches.length);
    branches.forEach((branch, index) => {
      addShiftedOutcomes(outcomes, results[index].outcomes, branch.yieldDelta, branch.probability);
    });
    const representativeHabitScore = results[0]?.habitScore ?? 0;

    return {
      expectedYield: expectedValue(outcomes),
      rotation: [GATHER_ACTION, ...results[0].rotation],
      outcomes,
      gpSpent: weightedResultValue(branches, results, 'gpSpent'),
      habitScore: representativeHabitScore
    };
  }

  function buildActions(state: SearchState): ActionOption[] {
    const wiseAction = createWiseToTheWorldAction(state);
    if (wiseAction) return [wiseAction];

    const actions: ActionOption[] = [];
    const wholeNodeBuffAllowed = !state.hasGathered;

    if (
      wholeNodeBuffAllowed &&
      canRaiseSuccess &&
      baseSuccessRate + state.successBonus < SUCCESS_CAP
    ) {
      addSuccessActions(actions, state);
    }

    if (
      wholeNodeBuffAllowed &&
      canRaiseBoon &&
      baseBoonChance + nodeBonuses.extraRate + state.boonBonus < BOON_CAP
    ) {
      addBoonActions(actions, state);
    }

    if (wholeNodeBuffAllowed && state.allYieldBonus === 0) {
      if (canUseSolverAction('kingII', state)) {
        actions.push(setBuffAction(names.kingII, 'kingII', 30));
      }

      if (canUseSolverAction('kingI', state)) {
        actions.push(setBuffAction(names.kingI, 'kingI', 31));
      }
    }

    if (
      wholeNodeBuffAllowed &&
      !state.tidings &&
      canUseSolverAction('tidings', state)
    ) {
      actions.push(setBuffAction(names.tidings, 'tidings', 22));
    }

    if (
      canRaiseSuccess &&
      state.nextSuccessBonus === 0 &&
      canUseSolverAction('clearVision', state)
    ) {
      actions.push(setBuffAction(names.clearVision, 'clearVision', 70));
    }

    if (state.nextYieldBonus === 0 && state.gp >= 100 && baseSuccessRate + state.successBonus > 0) {
      if (canUseSolverAction('bountifulII', state)) {
        actions.push(setBuffAction(names.bountifulII, 'bountifulII', 80));
      } else if (canUseSolverAction('bountifulI', state)) {
        actions.push(setBuffAction(names.bountifulI, 'bountifulI', 80));
      }
    }

    if (canUseSolverAction('restore', state)) {
      addRestoreAction(actions, state);
    }

    return actions;
  }

  function addSuccessActions(actions: ActionOption[], state: SearchState) {
    if (canUseSolverAction('successIII', state)) {
      actions.push(setBuffAction(names.successIII, 'successIII', 10));
    }

    if (canUseSolverAction('successII', state)) {
      actions.push(setBuffAction(names.successII, 'successII', 11));
    }

    if (canUseSolverAction('successI', state)) {
      actions.push(setBuffAction(names.successI, 'successI', 12));
    }
  }

  function addBoonActions(actions: ActionOption[], state: SearchState) {
    if (canUseSolverAction('giftII', state)) {
      actions.push(setBuffAction(names.giftII, 'giftII', 20));
    }

    if (canUseSolverAction('giftI', state)) {
      actions.push(setBuffAction(names.giftI, 'giftI', 21));
    }
  }

  function addRestoreAction(actions: ActionOption[], state: SearchState) {
    const missingIntegrity = maxIntegrity - state.integrity;

    if (stats.level >= 90) {
      if (missingIntegrity < 1) return;

      actions.push({
        name: names.restore,
        priority: 90,
        gpCost: 300,
        apply: (current, nextSolve) => {
          const branches = applyRegularGatheringAction('restore', current, mechanics);
          const procBranch = branches.find((branch) => branch.state.wiseReady);
          const noProcBranch = branches.find((branch) => !branch.state.wiseReady);
          const noProc = nextSolve((noProcBranch ?? branches[0]).state);
          const proc = nextSolve((procBranch ?? branches[0]).state);
          const preferredBranch = proc.expectedYield >= noProc.expectedYield
            ? {
                ...proc,
                rotation: markWiseProcGathers(proc.rotation, countGatherActions(proc.rotation) - countGatherActions(noProc.rotation))
              }
            : noProc;

          activeSearchStats && (activeSearchStats.branchCount += branches.length);
          return {
            expectedYield: noProc.expectedYield * 0.5 + proc.expectedYield * 0.5,
            rotation: preferredBranch.rotation,
            outcomes: mergeWeightedOutcomes([
              { outcomes: noProc.outcomes, weight: 0.5 },
              { outcomes: proc.outcomes, weight: 0.5 }
            ]),
            gpSpent: noProc.gpSpent * 0.5 + proc.gpSpent * 0.5,
            habitScore: preferredBranch.habitScore + restoreIntegrityHabitScore(current)
          };
        }
      });
      return;
    }

    if (missingIntegrity < 1) return;

    actions.push({
      name: names.restore,
      priority: 90,
      gpCost: 300,
      apply: (current, nextSolve) => {
        activeSearchStats && (activeSearchStats.branchCount += 1);
        const [branch] = applyRegularGatheringAction('restore', current, mechanics);
        const next = nextSolve(branch.state);

        return {
          ...next,
          habitScore: next.habitScore + restoreIntegrityHabitScore(current)
        };
      }
    });
  }

  function restoreIntegrityHabitScore(state: SearchState): number {
    const missingIntegrity = maxIntegrity - state.integrity;
    const preferredMissingIntegrity = stats.level >= 90 ? 2 : 1;

    return missingIntegrity >= preferredMissingIntegrity ? 500 : -500;
  }

  function createWiseToTheWorldAction(state: SearchState): ActionOption | null {
    if (!canUseSolverAction('wise', state)) return null;

    return {
      name: WISE_TO_THE_WORLD_ACTION,
      priority: 0,
      gpCost: 0,
      apply: (current, nextSolve) => {
        activeSearchStats && (activeSearchStats.branchCount += 1);
        const [branch] = applyRegularGatheringAction('wise', current, mechanics);
        const next = nextSolve(branch.state);

        return {
          ...next,
          habitScore: next.habitScore + 250
        };
      }
    };
  }

  function canUseSolverAction(kind: RegularGatheringActionKind, state: SearchState): boolean {
    return canUseRegularGatheringAction(kind, state, mechanics);
  }

  function setBuffAction(
    name: string,
    kind: RegularGatheringActionKind,
    priority: number
  ): ActionOption {
    return {
      name,
      priority,
      gpCost: regularGatheringActionGpCost(kind),
      apply: (state, nextSolve) => {
        activeSearchStats && (activeSearchStats.branchCount += 1);
        const [branch] = applyRegularGatheringAction(kind, state, mechanics);
        return nextSolve(branch.state);
      }
    };
  }

  function isPreferredResult(candidate: SolverResult, current: SolverResult): boolean {
    const candidateScore = scoreResult(candidate);
    const currentScore = scoreResult(current);

    if (candidateScore > currentScore + EV_EPSILON) return true;
    if (candidateScore < currentScore - EV_EPSILON) return false;
    if (candidate.gpSpent < current.gpSpent - EV_EPSILON) return true;
    if (candidate.gpSpent > current.gpSpent + EV_EPSILON) return false;

    if (candidate.habitScore !== current.habitScore) {
      return candidate.habitScore > current.habitScore;
    }

    return rotationPreferenceScore(candidate.rotation) > rotationPreferenceScore(current.rotation);
  }

  function weightedResultValue(
    branches: RegularGatheringActionTransition[],
    results: SolverResult[],
    field: 'gpSpent'
  ): number {
    return results.reduce((total, result, index) => total + result[field] * branches[index].probability, 0);
  }

  function scoreResult(result: SolverResult): number {
    if (objectiveMode === 'max') return getMaxYield(result.outcomes);
    if (objectiveMode === 'min') return getMinYield(result.outcomes);

    return result.expectedYield;
  }

  function addShiftedOutcomes(
    target: Map<number, number>,
    source: Map<number, number>,
    yieldDelta: number,
    probability: number
  ) {
    if (probability <= 0) return;

    source.forEach((sourceProbability, totalYield) => {
      const nextYield = totalYield + yieldDelta;
      target.set(nextYield, (target.get(nextYield) ?? 0) + sourceProbability * probability);
    });
  }

  function mergeWeightedOutcomes(parts: Array<{ outcomes: Map<number, number>; weight: number }>) {
    const outcomes = new Map<number, number>();

    parts.forEach((part) => {
      part.outcomes.forEach((probability, totalYield) => {
        outcomes.set(totalYield, (outcomes.get(totalYield) ?? 0) + probability * part.weight);
      });
    });

    return outcomes;
  }

  function expectedValue(outcomes: Map<number, number>): number {
    let total = 0;
    outcomes.forEach((probability, totalYield) => {
      total += totalYield * probability;
    });
    return total;
  }

  function getMinYield(outcomes: Map<number, number>): number {
    return Math.min(...outcomes.keys());
  }

  function getMaxYield(outcomes: Map<number, number>): number {
    return Math.max(...outcomes.keys());
  }

  function summarizeOutcomes(outcomes: Map<number, number>): OutcomeSummary {
    const yields = [...outcomes.keys()].sort((a, b) => a - b);
    const minYield = yields[0] ?? 0;
    const maxYield = yields[yields.length - 1] ?? 0;

    return {
      minYield,
      maxYield,
      minYieldChance: (outcomes.get(minYield) ?? 0) * 100,
      maxYieldChance: (outcomes.get(maxYield) ?? 0) * 100
    };
  }

  function serializeOutcomes(outcomes: Map<number, number>) {
    return [...outcomes.entries()]
      .sort(([leftYield], [rightYield]) => leftYield - rightYield)
      .map(([totalYield, probability]) => ({
        yield: totalYield,
        probability: probability * 100
      }));
  }

  function combineSequentialOutcomes(left: Map<number, number>, right: Map<number, number>) {
    const outcomes = new Map<number, number>();

    left.forEach((leftProbability, leftYield) => {
      right.forEach((rightProbability, rightYield) => {
        const totalYield = leftYield + rightYield;
        outcomes.set(totalYield, (outcomes.get(totalYield) ?? 0) + leftProbability * rightProbability);
      });
    });

    return outcomes;
  }

  function countGatherActions(rotation: string[]): number {
    return rotation.filter(isGatherAction).length;
  }

  function isGatherAction(action: string): boolean {
    return action.startsWith(GATHER_ACTION);
  }

  function markWiseProcGathers(rotation: string[], extraGatherCount: number): string[] {
    if (extraGatherCount <= 0) return rotation;

    let remaining = extraGatherCount;
    const markedRotation = [...rotation];

    for (let index = markedRotation.length - 1; index >= 0 && remaining > 0; index -= 1) {
      if (markedRotation[index] !== GATHER_ACTION) continue;

      markedRotation[index] = WISE_PROC_GATHER_ACTION;
      remaining -= 1;
    }

    return markedRotation;
  }

  function rotationPreferenceScore(rotation: string[]): number {
    let score = 0;
    const firstGatherIndex = rotation.findIndex(isGatherAction);
    const effectiveFirstGatherIndex = firstGatherIndex === -1 ? rotation.length : firstGatherIndex;

    score += effectiveFirstGatherIndex;
    score += wholeNodeBeforeNextOnlyScore(rotation);

    for (const nextOnlyAction of [names.clearVision, names.bountifulI, names.bountifulII]) {
      const index = rotation.indexOf(nextOnlyAction);
      if (index === -1) continue;

      score += (rotation.length - index) * 10;
      if (index < effectiveFirstGatherIndex) score += 100;
    }

    score += comboPreferenceScore(rotation);

    return score;
  }

  function wholeNodeBeforeNextOnlyScore(rotation: string[]): number {
    const nextOnlyActions = [names.clearVision, names.bountifulI, names.bountifulII];
    const firstNextOnlyIndex = rotation.findIndex((action) => nextOnlyActions.includes(action));

    if (firstNextOnlyIndex === -1) return 0;

    const wholeNodeActions = [
      names.successI,
      names.successII,
      names.successIII,
      names.giftI,
      names.giftII,
      names.kingI,
      names.kingII,
      names.tidings
    ];

    return wholeNodeActions.reduce((score, actionName) => {
      const index = rotation.indexOf(actionName);
      if (index === -1) return score;

      return index < firstNextOnlyIndex ? score + 1000 : score - 1000;
    }, 0);
  }

  function comboPreferenceScore(rotation: string[]): number {
    const giftIndexes = rotation
      .map((action, index) => action === names.giftI || action === names.giftII ? index : -1)
      .filter((index) => index !== -1);
    const tidingsIndex = rotation.indexOf(names.tidings);

    if (giftIndexes.length === 0 || tidingsIndex === -1) return 0;

    const lastGiftIndex = giftIndexes[giftIndexes.length - 1];

    if (tidingsIndex === lastGiftIndex + 1) return 500;
    if (lastGiftIndex < tidingsIndex) return 100;

    return -100;
  }

  function solveWithGp(startingGp: number): SearchRunResult {
    memo.clear();
    activeSearchStats = {
      startingGp: Math.min(stats.gp, startingGp),
      statesSolved: 0,
      memoHits: 0,
      actionsEvaluated: 0,
      candidateComparisons: 0,
      terminalStates: 0,
      branchCount: 0
    };
    const result = solve({
      gp: Math.min(stats.gp, startingGp),
      integrity: maxIntegrity,
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
    });
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
  const revisitChance = revisitEnabled ? (isTimedNode ? TIMED_REVISIT_CHANCE : REGULAR_REVISIT_CHANCE) : 0;
  const fullGpResult = revisitEnabled && !isFullGp ? solveWithGp(stats.gp) : initial;
  const initialSummary = summarizeOutcomes(initial.outcomes);
  const fullGpSummary = summarizeOutcomes(fullGpResult.outcomes);
  const revisitOutcomes = combineSequentialOutcomes(initial.outcomes, fullGpResult.outcomes);
  const combinedOutcomes = revisitEnabled
    ? mergeWeightedOutcomes([
        { outcomes: initial.outcomes, weight: 1 - revisitChance },
        { outcomes: revisitOutcomes, weight: revisitChance }
      ])
    : initial.outcomes;
  const combinedSummary = summarizeOutcomes(combinedOutcomes);
  const expectedYield = expectedValue(combinedOutcomes);
  const rotationPlans = isFullGp || !revisitEnabled
    ? [{
        kind: 'primary' as const,
        rotation: initial.rotation,
        expectedYield: initial.expectedYield,
        minYield: initialSummary.minYield,
        maxYield: initialSummary.maxYield,
        minYieldChance: initialSummary.minYieldChance,
        maxYieldChance: initialSummary.maxYieldChance
      }]
    : [
        {
          kind: 'primary' as const,
          rotation: initial.rotation,
          expectedYield: initial.expectedYield,
          minYield: initialSummary.minYield,
          maxYield: initialSummary.maxYield,
          minYieldChance: initialSummary.minYieldChance,
          maxYieldChance: initialSummary.maxYieldChance
        },
        {
          kind: 'revisit' as const,
          rotation: fullGpResult.rotation,
          expectedYield: fullGpResult.expectedYield,
          minYield: fullGpSummary.minYield,
          maxYield: fullGpSummary.maxYield,
          minYieldChance: fullGpSummary.minYieldChance,
          maxYieldChance: fullGpSummary.maxYieldChance
        }
      ];

  const response: SolverResponse = {
    modelVersions: buildModelVersionsForScenario('tome.regular'),
    bestRotation: initial.rotation,
    rotationPlans,
    revisit: {
      enabled: revisitEnabled,
      chance: revisitChance,
      isFullGp
    },
    expectedYield: Number(expectedYield.toFixed(2)),
    minYield: combinedSummary.minYield,
    maxYield: combinedSummary.maxYield,
    minYieldChance: combinedSummary.minYieldChance,
    maxYieldChance: combinedSummary.maxYieldChance,
    objectiveMode,
    calculationTime: 0
  };

  if (request.debugMode) {
    const plusTwoThreshold = Math.floor(baseValues.Gathering * 0.9);
    const plusThreeThreshold = Math.floor(baseValues.Gathering * 1.1);
    const planDebugs: SolverDebugInfo['plans'] = rotationPlans.map((plan) => {
      const run = plan.kind === 'revisit' ? fullGpResult : initial;
      const summary = plan.kind === 'revisit' ? fullGpSummary : initialSummary;

      return {
        kind: plan.kind,
        startingGp: run.startingGp,
        expectedYield: Number(run.expectedYield.toFixed(4)),
        minYield: summary.minYield,
        maxYield: summary.maxYield,
        outcomeDistribution: serializeOutcomes(run.outcomes),
        search: run.search
      };
    });

    response.debug = {
      modelVersions: buildModelVersionsForScenario('tome.regular'),
      formulas: {
        success: calculateSuccessFormulaDebug(
          stats.gathering,
          baseValues.Gathering,
          stats.level,
          itemLevel
        ),
        boon: calculateBoonFormulaDebug(stats.perception, baseValues.Perception),
        bountiful: {
          gathering: stats.gathering,
          baseGathering: baseValues.Gathering,
          plusTwoThreshold,
          plusThreeThreshold,
          amount: bountifulAmount
        },
        gather: {
          gpRecoveredPerGather: gatherGp,
          baseIntegrity: nodeBonuses.baseIntegrity,
          bonusIntegrity: nodeBonuses.gatheringCount,
          maxIntegrity,
          nodeYieldBonus: nodeBonuses.yieldCount,
          nodeBoonBonus: nodeBonuses.extraRate
        }
      },
      plans: planDebugs,
      combined: {
        expectedYield: Number(expectedYield.toFixed(4)),
        revisitChance,
        expression: revisitEnabled
          ? `${Number(initial.expectedYield.toFixed(4))} + ${revisitChance} * ${Number(fullGpResult.expectedYield.toFixed(4))}`
          : `${Number(initial.expectedYield.toFixed(4))}`
      },
      optimality: {
        engine: 'ts-core',
        method: 'dynamic-programming-exhaustive-search',
        stateKeyFields: STATE_KEY_FIELDS,
        stateKeyEngine: 'string'
      }
    };
  }

  return response;
}

function calculateMemoHitRate(search: SolverSearchDebugInfo): number {
  const cacheableLookups = search.statesSolved + search.memoHits;
  if (cacheableLookups === 0) return 0;
  return Number(((search.memoHits / cacheableLookups) * 100).toFixed(2));
}
