import wasmUrl from '../wasm/collectable-solver-core.wasm?url';
import {
  addCollectableRewards,
  addCollectableTierCounts,
  applyRelicToolValueIncreaseBonus,
  calculateFocusedValueIncreaseRate,
  calculateMeticulousProcRate,
  calculatePrimedMeticulousProcRate,
  calculateScrutinyBonus,
  calculateScrutinyMultiplier,
  calculateValueIncreaseRate,
  createZeroTierCounts,
  scoreCollectability
} from './collectableMath';
import {
  COLLECTABLE_STATE_KEY_FIELDS,
  createCollectableMechanicsContext
} from './collectableMechanics';
import { serializeCollectableDebugOutcomes } from './collectableDebugDistribution';
import { calculateSuccessRate } from './gatheringMath';
import {
  attachCollectableRevisitGate,
  buildCollectablePolicyFromWasmCore,
  createCollectableWasmPolicySelector,
  evaluateCollectablePolicyFromWasmCore,
  type CollectableWasmPolicyCore,
  type CollectableWasmPolicyEvaluation
} from './collectableWasmPolicy';
import { summarizeCollectableRewardTable } from '../services/collectableRewards';
import type {
  CollectablePolicyNode,
  CollectablePolicyPlan,
  CollectableRewardTable,
  CollectableRewardVector,
  CollectableSearchDebugInfo,
  CollectableSolverRequest,
  CollectableSolverResult,
  CollectableTierCounts
} from '../types/collectable';

type CollectableWasmExports = CollectableWasmPolicyCore & {
  memory: WebAssembly.Memory;
  solvePlanObjective(
    playerLevel: number,
    gathering: number,
    perception: number,
    playerGp: number,
    baseGathering: number,
    basePerception: number,
    itemLevel: number,
    integrity: number,
    temporaryGp: number,
    isTimedNode: number,
    lowThreshold: number,
    lowRewardScore: number,
    midThreshold: number,
    midRewardScore: number,
    highThreshold: number,
    highRewardScore: number,
    hasRelicToolBonus: number,
    memoCapacityPower: number,
    objectiveMode: number
  ): number;
  solvePlanExpected(
    playerLevel: number,
    gathering: number,
    perception: number,
    playerGp: number,
    baseGathering: number,
    basePerception: number,
    itemLevel: number,
    integrity: number,
    temporaryGp: number,
    isTimedNode: number,
    lowThreshold: number,
    lowRewardScore: number,
    midThreshold: number,
    midRewardScore: number,
    highThreshold: number,
    highRewardScore: number,
    hasRelicToolBonus: number,
    memoCapacityPower: number
  ): number;
  getStatesSolved(): bigint;
  getMemoHits(): bigint;
  getActionsEvaluated(): bigint;
  getCandidateComparisons(): bigint;
  getTerminalStates(): bigint;
  getBranchCount(): bigint;
  getFailed(): number;
  getFailureReason(): number;
  getBaseSuccessRate(): number;
  getScourValue(): number;
};

export class CollectableWasmMemoCapacityError extends Error {
  constructor(
    readonly memoCapacityPower: number,
    readonly supportedMemoCapacityPower = memoCapacityPower,
    readonly nextMemoCapacityPower = memoCapacityPower + 1
  ) {
    const supportedText = supportedMemoCapacityPower === memoCapacityPower
      ? ''
      : ` The current environment supports up to 2^${supportedMemoCapacityPower}.`;
    super(`Collectable WASM memo table exceeded capacity 2^${memoCapacityPower}.${supportedText}`);
    this.name = 'CollectableWasmMemoCapacityError';
  }
}

export class CollectableWasmMemoryAllocationError extends Error {
  constructor(readonly memoCapacityPower: number) {
    super(`Collectable WASM memory could not be allocated for memo table 2^${memoCapacityPower}.`);
    this.name = 'CollectableWasmMemoryAllocationError';
  }
}

interface CollectableWasmRun {
  startingGp: number;
  expectedScore: number;
  evaluation: CollectableWasmPolicyEvaluation;
  search: CollectableSearchDebugInfo;
  policy: CollectablePolicyNode;
  core: CollectableWasmExports;
}

type OutcomeDetail = {
  score: number;
  probability: number;
  tierCounts: CollectableTierCounts;
};

const REGULAR_REVISIT_CHANCE = 0.05;
const TIMED_REVISIT_CHANCE = 0.08;
const DEFAULT_MEMO_CAPACITY_POWER = 20;
const EXTENDED_MEMO_CAPACITY_POWER = 21;
const UNKNOWN_DESKTOP_MEMO_CAPACITY_POWER = 22;
const DESKTOP_MAX_MEMO_CAPACITY_POWER = 23;
const MAX_SAFE_MEMO_CAPACITY_POWER = 30;
const MEMO_ENTRY_BYTES = 132;
const MEMO_FIXED_MEMORY_BYTES = 0;
const MEMO_MEMORY_BUDGET_RATIO = 0.22;
const WASM_FAILURE_MEMO_CAPACITY = 1;
let wasmPromise: Promise<CollectableWasmExports> | null = null;

export function canUseCollectableWasmSolver(request: CollectableSolverRequest): boolean {
  const mode = request.objectiveMode ?? 'expected';
  return import.meta.env.VITE_COLLECTABLE_WASM_SOLVER !== 'false'
    && (mode === 'expected' || mode === 'min' || mode === 'max');
}

export async function loadCollectableWasmCore(): Promise<CollectableWasmExports> {
  if (!wasmPromise) {
    wasmPromise = instantiateCollectableWasmCore();
  }

  return wasmPromise;
}

async function instantiateCollectableWasmCore(): Promise<CollectableWasmExports> {
  const response = await fetch(wasmUrl);
  if (!response.ok) {
    throw new Error(`Collectable WASM core failed to load: ${response.status}`);
  }

  const bytes = await response.arrayBuffer();
  const module = await WebAssembly.instantiate(bytes, {
    env: {
      abort() {
        throw new Error('Collectable WASM core aborted.');
      }
    }
  });
  return module.instance.exports as unknown as CollectableWasmExports;
}

export async function solveCollectableRotationWithWasm(
  request: CollectableSolverRequest,
  core?: CollectableWasmExports
): Promise<CollectableSolverResult> {
  if (!canUseCollectableWasmSolver(request)) {
    throw new Error(`Collectable WASM solver does not support objective mode "${request.objectiveMode}".`);
  }

  const initialPower = selectInitialMemoCapacityPower(request);
  const manualMemoCapacityPower = normalizeManualMemoCapacityPower(request.manualMemoCapacityPower, initialPower);
  if (manualMemoCapacityPower !== null) {
    return solveCollectableRotationWithWasmAtPower(request, manualMemoCapacityPower, core);
  }

  const supportedPower = selectSupportedMemoCapacityPower();
  if (supportedPower < initialPower) {
    throw new CollectableWasmMemoCapacityError(initialPower, supportedPower);
  }

  for (let memoCapacityPower = supportedPower; memoCapacityPower >= initialPower; memoCapacityPower -= 1) {
    const wasmCore = core ?? (memoCapacityPower === supportedPower ? await loadCollectableWasmCore() : await instantiateCollectableWasmCore());

    try {
      return solveCollectableRotationWithWasmCore(request, wasmCore, memoCapacityPower);
    } catch (error) {
      wasmPromise = null;
      if (wasmCore.getFailed() !== 0) {
        throw createWasmFailureError(wasmCore, memoCapacityPower, supportedPower);
      }

      if (memoCapacityPower > initialPower && isLikelyWasmMemoryAllocationFailure(error)) {
        continue;
      }

      if (isLikelyWasmMemoryAllocationFailure(error)) {
        throw new CollectableWasmMemoryAllocationError(memoCapacityPower);
      }

      throw error;
    }
  }

  throw new CollectableWasmMemoCapacityError(initialPower, supportedPower);
}

async function solveCollectableRotationWithWasmAtPower(
  request: CollectableSolverRequest,
  memoCapacityPower: number,
  core?: CollectableWasmExports
): Promise<CollectableSolverResult> {
  const wasmCore = core ?? await instantiateCollectableWasmCore();

  try {
    return solveCollectableRotationWithWasmCore(request, wasmCore, memoCapacityPower);
  } catch (error) {
    wasmPromise = null;
    if (wasmCore.getFailed() !== 0) {
      throw createWasmFailureError(wasmCore, memoCapacityPower, memoCapacityPower);
    }

    if (isLikelyWasmMemoryAllocationFailure(error)) {
      throw new CollectableWasmMemoryAllocationError(memoCapacityPower);
    }

    throw error;
  }
}

function solveCollectableRotationWithWasmCore(
  request: CollectableSolverRequest,
  wasmCore: CollectableWasmExports,
  memoCapacityPower: number
): CollectableSolverResult {
  const initial = runPlan(request, wasmCore, request.temporaryGp, memoCapacityPower);
  const isFullGp = Math.min(request.stats.gp, request.temporaryGp) >= request.stats.gp;
  const revisitEnabled = request.stats.level >= 91;
  const revisitChance = revisitEnabled ? (request.isTimedNode ? TIMED_REVISIT_CHANCE : REGULAR_REVISIT_CHANCE) : 0;
  const fullGpResult = revisitEnabled && !isFullGp ? runPlan(request, wasmCore, request.stats.gp, memoCapacityPower) : initial;
  const combinedOutcomes = revisitEnabled
    ? mergeWeightedOutcomeMaps([
        { outcomes: initial.evaluation.outcomes, weight: 1 - revisitChance },
        { outcomes: combineSequentialOutcomes(initial.evaluation.outcomes, fullGpResult.evaluation.outcomes), weight: revisitChance }
      ])
    : initial.evaluation.outcomes;
  const combinedSummary = summarizeOutcomes(combinedOutcomes);
  const expectedScore = expectedValue(combinedOutcomes);
  const expectedReward = revisitEnabled
    ? addCollectableRewards(initial.evaluation.expectedReward, fullGpResult.evaluation.expectedReward, revisitChance)
    : initial.evaluation.expectedReward;
  const expectedTierCounts = revisitEnabled
    ? addCollectableTierCounts(initial.evaluation.expectedTierCounts, fullGpResult.evaluation.expectedTierCounts, revisitChance)
    : initial.evaluation.expectedTierCounts;
  const combinedMinDetail = revisitEnabled
    ? representativeCombinedDetailForScore(
        combinedSummary.minScore,
        'min',
        initial.evaluation,
        fullGpResult.evaluation,
        1 - revisitChance,
        revisitChance
      )
    : initial.evaluation.minScoreDetail;
  const combinedMaxDetail = revisitEnabled
    ? representativeCombinedDetailForScore(
        combinedSummary.maxScore,
        'max',
        initial.evaluation,
        fullGpResult.evaluation,
        1 - revisitChance,
        revisitChance
      )
    : initial.evaluation.maxScoreDetail;
  const revisitPolicy = fullGpResult.policy;
  const primaryPolicy = revisitEnabled
    ? attachCollectableRevisitGate(initial.policy, revisitPolicy, revisitChance, request.jobType)
    : initial.policy;
  const policyPlans: CollectablePolicyPlan[] = isFullGp || !revisitEnabled
    ? [buildPolicyPlan('primary', initial, initial.policy)]
    : [
        buildPolicyPlan('primary', initial, initial.policy),
        buildPolicyPlan('revisit', fullGpResult, revisitPolicy)
      ];

  const result: CollectableSolverResult = {
    expectedScore: Number(expectedScore.toFixed(6)),
    minScore: combinedSummary.minScore,
    maxScore: combinedSummary.maxScore,
    minScoreChance: combinedSummary.minScoreChance,
    maxScoreChance: combinedSummary.maxScoreChance,
    objectiveMode: request.objectiveMode ?? 'expected',
    objective: request.objective,
    expectedReward,
    expectedTierCounts,
    minScoreTierCounts: combinedMinDetail.tierCounts,
    maxScoreTierCounts: combinedMaxDetail.tierCounts,
    rewardItemId: request.rewardTable.rewardItemId,
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
    result.debug = {
      formulas: buildFormulaDebug(request),
      objective: {
        ...request.objective,
        weights: request.objective.weights ? { ...request.objective.weights, items: { ...(request.objective.weights.items ?? {}) } } : undefined,
        tierWeights: request.objective.tierWeights ? { ...request.objective.tierWeights } : undefined
      },
      plans: policyPlans.map((plan) => {
        const run = plan.kind === 'revisit' ? fullGpResult : initial;
        return {
          kind: plan.kind,
          startingGp: run.startingGp,
          expectedScore: Number(run.evaluation.expectedScore.toFixed(6)),
          outcomeDistribution: serializeCollectableDebugOutcomes(run.evaluation.outcomes, request.objective, {
            policy: plan.policy,
            rewardTable: request.rewardTable
          }),
          search: run.search
        };
      }),
      combined: {
        expectedScore: Number(expectedScore.toFixed(6)),
        revisitChance,
        expression: revisitEnabled
          ? `${Number(initial.evaluation.expectedScore.toFixed(6))} + ${revisitChance} * ${Number(fullGpResult.evaluation.expectedScore.toFixed(6))}`
          : `${Number(initial.evaluation.expectedScore.toFixed(6))}`
      },
      limitations: [
        'brazen-excluded',
        'high-standard-excluded',
        'reduction-reward-model-excluded'
      ],
      optimality: {
        method: 'dynamic-programming-policy-search',
        stateKeyFields: [...COLLECTABLE_STATE_KEY_FIELDS],
        stateKeyEngine: 'wasm-packed'
      }
    };
  }

  return result;
}

function runPlan(
  request: CollectableSolverRequest,
  core: CollectableWasmExports,
  startingGp: number,
  memoCapacityPower = selectInitialMemoCapacityPower(request)
): CollectableWasmRun {
  const scoreTable = buildTierScoreTable(request);
  const clampedGp = Math.min(request.stats.gp, startingGp);
  const expectedScore = core.solvePlanObjective(
    request.stats.level,
    request.stats.gathering,
    request.stats.perception,
    request.stats.gp,
    request.baseValues.Gathering,
    request.baseValues.Perception,
    request.itemLevel,
    request.nodeBonuses.baseIntegrity + request.nodeBonuses.gatheringCount,
    clampedGp,
    request.isTimedNode ? 1 : 0,
    request.rewardTable.tiers.low.collectability,
    scoreTable.low,
    request.rewardTable.tiers.mid.collectability,
    scoreTable.mid,
    request.rewardTable.tiers.high?.collectability ?? 0,
    scoreTable.high,
    request.hasRelicToolBonus ? 1 : 0,
    memoCapacityPower,
    objectiveModeToWasm(request.objectiveMode ?? 'expected')
  );
  const selector = createCollectableWasmPolicySelector(request, core);

  return {
    startingGp: clampedGp,
    expectedScore,
    evaluation: evaluateCollectablePolicyFromWasmCore(request, core, {
      startingGp: clampedGp,
      selector,
    }),
    search: {
      startingGp: clampedGp,
      statesSolved: Number(core.getStatesSolved()),
      memoHits: Number(core.getMemoHits()),
      memoCapacityPower,
      memoCapacity: 2 ** memoCapacityPower,
      memoCapacityUsable: Math.floor((2 ** memoCapacityPower) * 0.85) - 1,
      actionsEvaluated: Number(core.getActionsEvaluated()),
      candidateComparisons: Number(core.getCandidateComparisons()),
      terminalStates: Number(core.getTerminalStates()),
      branchCount: Number(core.getBranchCount()),
      memoHitRate: calculateMemoHitRate(Number(core.getStatesSolved()), Number(core.getMemoHits()))
    },
    policy: buildCollectablePolicyFromWasmCore(request, core, {
      startingGp: clampedGp,
      nodeLimit: 200000,
      selector
    }),
    core
  };
}

function selectInitialMemoCapacityPower(request: CollectableSolverRequest): number {
  const mechanics = createCollectableMechanicsContext(request);
  const maxIntegrity = request.nodeBonuses.baseIntegrity + request.nodeBonuses.gatheringCount;
  if (maxIntegrity >= 6 && (mechanics.baseSuccessRate < 100 || mechanics.scourValue < 200)) {
    return EXTENDED_MEMO_CAPACITY_POWER;
  }

  return DEFAULT_MEMO_CAPACITY_POWER;
}

function selectSupportedMemoCapacityPower(): number {
  const signals = [
    getDeviceMemoCapacityPower(),
    getHeapMemoCapacityPower()
  ].filter((power): power is number => power !== null);

  if (signals.length > 0) {
    return clampMemoCapacityPower(Math.min(...signals));
  }

  if (isLikelyMobileDevice()) return EXTENDED_MEMO_CAPACITY_POWER;
  return UNKNOWN_DESKTOP_MEMO_CAPACITY_POWER;
}

function normalizeManualMemoCapacityPower(power: number | undefined, initialPower: number): number | null {
  if (typeof power !== 'number' || !Number.isFinite(power)) return null;
  const normalizedPower = Math.max(initialPower, Math.floor(power));
  if (normalizedPower > MAX_SAFE_MEMO_CAPACITY_POWER) {
    throw new CollectableWasmMemoryAllocationError(normalizedPower);
  }
  return normalizedPower;
}

function getDeviceMemoCapacityPower(): number | null {
  const deviceMemory = getDeviceMemoryGb();
  if (deviceMemory === null) return null;
  if (deviceMemory <= 2) return DEFAULT_MEMO_CAPACITY_POWER;
  if (deviceMemory <= 4) return EXTENDED_MEMO_CAPACITY_POWER;
  if (deviceMemory <= 8) return UNKNOWN_DESKTOP_MEMO_CAPACITY_POWER;
  return DESKTOP_MAX_MEMO_CAPACITY_POWER;
}

function getHeapMemoCapacityPower(): number | null {
  const maybePerformance = globalThis.performance as (Performance & {
    memory?: {
      jsHeapSizeLimit?: number;
    };
  }) | undefined;
  const heapLimit = maybePerformance?.memory?.jsHeapSizeLimit;
  if (typeof heapLimit !== 'number' || !Number.isFinite(heapLimit) || heapLimit <= 0) return null;

  const budgetBytes = heapLimit * MEMO_MEMORY_BUDGET_RATIO;
  let power = DEFAULT_MEMO_CAPACITY_POWER;
  while (
    power < DESKTOP_MAX_MEMO_CAPACITY_POWER
    && estimateMemoBytes(power + 1) <= budgetBytes
  ) {
    power += 1;
  }
  return power;
}

function estimateMemoBytes(memoCapacityPower: number): number {
  return (2 ** memoCapacityPower) * MEMO_ENTRY_BYTES + MEMO_FIXED_MEMORY_BYTES;
}

function clampMemoCapacityPower(power: number): number {
  return Math.min(DESKTOP_MAX_MEMO_CAPACITY_POWER, Math.max(DEFAULT_MEMO_CAPACITY_POWER, power));
}

function getDeviceMemoryGb(): number | null {
  const maybeNavigator = globalThis.navigator as (Navigator & { deviceMemory?: number }) | undefined;
  const deviceMemory = maybeNavigator?.deviceMemory;
  return typeof deviceMemory === 'number' && Number.isFinite(deviceMemory) ? deviceMemory : null;
}

function isLikelyMobileDevice(): boolean {
  const maybeNavigator = globalThis.navigator as (Navigator & { userAgent?: string }) | undefined;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(maybeNavigator?.userAgent ?? '');
}

function isLikelyWasmMemoryAllocationFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('memory')
    || message.includes('allocation')
    || message.includes('out of bounds')
    || message.includes('aborted');
}

function createWasmFailureError(
  core: CollectableWasmExports,
  memoCapacityPower: number,
  supportedMemoCapacityPower: number
): Error {
  if (core.getFailureReason() === WASM_FAILURE_MEMO_CAPACITY) {
    return new CollectableWasmMemoCapacityError(memoCapacityPower, supportedMemoCapacityPower);
  }

  return new CollectableWasmMemoryAllocationError(memoCapacityPower);
}

function objectiveModeToWasm(mode: CollectableSolverRequest['objectiveMode']): number {
  if (mode === 'min') return 1;
  if (mode === 'max') return 2;
  return 0;
}

function buildPolicyPlan(
  kind: CollectablePolicyPlan['kind'],
  run: CollectableWasmRun,
  policy: CollectablePolicyNode
): CollectablePolicyPlan {
  const summary = summarizeOutcomes(run.evaluation.outcomes);

  return {
    kind,
    startingGp: run.startingGp,
    expectedScore: Number(run.evaluation.expectedScore.toFixed(6)),
    minScore: summary.minScore,
    maxScore: summary.maxScore,
    minScoreChance: summary.minScoreChance,
    maxScoreChance: summary.maxScoreChance,
    expectedReward: run.evaluation.expectedReward,
    expectedTierCounts: run.evaluation.expectedTierCounts,
    minScoreTierCounts: run.evaluation.minScoreDetail.tierCounts,
    maxScoreTierCounts: run.evaluation.maxScoreDetail.tierCounts,
    policy
  };
}

function buildFormulaDebug(request: CollectableSolverRequest) {
  const mechanics = createCollectableMechanicsContext(request);
  const score = request.baseValues.Gathering
    ? Math.floor((100 * request.stats.gathering) / request.baseValues.Gathering)
    : 0;
  const finalRate = calculateSuccessRate(
    request.stats.gathering,
    request.baseValues.Gathering,
    request.stats.level,
    request.itemLevel
  );
  const rawRate = calculateSuccessRate(
    request.stats.gathering,
    request.baseValues.Gathering,
    request.stats.level,
    0
  );
  const baseValueIncreaseRate = calculateValueIncreaseRate(request.stats.gathering, request.baseValues.Gathering);
  const valueIncreaseRate = request.hasRelicToolBonus
    ? applyRelicToolValueIncreaseBonus(baseValueIncreaseRate)
    : baseValueIncreaseRate;
  const meticulousRate = calculateMeticulousProcRate(request.stats.gathering, request.baseValues.Gathering);
  const scrutinyMultiplier = calculateScrutinyMultiplier(request.stats.perception, request.baseValues.Perception);

  return {
    success: {
      gathering: request.stats.gathering,
      baseGathering: request.baseValues.Gathering,
      score,
      rawRate,
      levelDifference: request.itemLevel > 0 ? request.stats.level - request.itemLevel : 0,
      levelModifier: finalRate - rawRate,
      finalRate
    },
    collectable: {
      gathering: request.stats.gathering,
      baseGathering: request.baseValues.Gathering,
      perception: request.stats.perception,
      basePerception: request.baseValues.Perception,
      scourValue: mechanics.scourValue,
      baseValueIncreaseRate,
      valueIncreaseRate,
      focusedValueIncreaseRate: calculateFocusedValueIncreaseRate(valueIncreaseRate),
      hasRelicToolBonus: !!request.hasRelicToolBonus,
      meticulousRate,
      primedMeticulousRate: calculatePrimedMeticulousProcRate(meticulousRate),
      scrutinyMultiplier,
      scrutinyBonus: calculateScrutinyBonus(mechanics.scourValue, scrutinyMultiplier),
      standardProcRate: mechanics.standardProcRate
    },
    rewardTable: summarizeCollectableRewardTable(request.rewardTable)
  };
}

function detailWithWeight(detail: OutcomeDetail, weight: number): OutcomeDetail {
  return {
    ...detail,
    probability: detail.probability * weight
  };
}

function combineSequentialExtremeDetails(
  left: OutcomeDetail,
  right: OutcomeDetail,
  weight: number
): OutcomeDetail {
  return {
    score: left.score + right.score,
    probability: left.probability * right.probability * weight,
    tierCounts: addCollectableTierCounts(left.tierCounts, right.tierCounts)
  };
}

function representativeCombinedDetailForScore(
  score: number,
  direction: 'min' | 'max',
  initial: CollectableWasmPolicyEvaluation,
  fullGpResult: CollectableWasmPolicyEvaluation,
  noRevisitWeight: number,
  revisitWeight: number
): OutcomeDetail {
  const primaryDetail = direction === 'min' ? initial.minScoreDetail : initial.maxScoreDetail;
  const revisitPrimaryDetail = direction === 'min' ? initial.minScoreDetail : initial.maxScoreDetail;
  const revisitFullDetail = direction === 'min' ? fullGpResult.minScoreDetail : fullGpResult.maxScoreDetail;
  const candidates: OutcomeDetail[] = [];

  if (primaryDetail.score === score) {
    candidates.push(detailWithWeight(primaryDetail, noRevisitWeight));
  }

  if (revisitPrimaryDetail.score + revisitFullDetail.score === score) {
    candidates.push(combineSequentialExtremeDetails(revisitPrimaryDetail, revisitFullDetail, revisitWeight));
  }

  return pickRepresentativeOutcomeDetail(candidates, score, direction);
}

function pickRepresentativeOutcomeDetail(
  candidates: OutcomeDetail[],
  score: number,
  direction: 'min' | 'max'
): OutcomeDetail {
  if (candidates.length === 0) {
    return {
      score,
      probability: 0,
      tierCounts: createZeroTierCounts()
    };
  }

  return candidates.sort(compareOutcomeDetails(direction))[0];
}

function compareOutcomeDetails(direction: 'min' | 'max') {
  return (left: OutcomeDetail, right: OutcomeDetail) => {
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

function buildTierScoreTable(request: CollectableSolverRequest) {
  const scoreTier = (collectability: number) => scoreCollectability(collectability, request.rewardTable, request.objective);
  return {
    none: 0,
    low: scoreTier(request.rewardTable.tiers.low.collectability),
    mid: scoreTier(request.rewardTable.tiers.mid.collectability),
    high: request.rewardTable.tiers.high ? scoreTier(request.rewardTable.tiers.high.collectability) : 0
  };
}

function getMinScore(outcomes: Map<number, number>): number {
  return Math.min(...outcomes.keys());
}

function getMaxScore(outcomes: Map<number, number>): number {
  return Math.max(...outcomes.keys());
}

function summarizeOutcomes(outcomes: Map<number, number>) {
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

function calculateMemoHitRate(statesSolved: number, memoHits: number): number {
  const cacheableLookups = statesSolved + memoHits;
  if (cacheableLookups === 0) return 0;
  return Number(((memoHits / cacheableLookups) * 100).toFixed(2));
}
