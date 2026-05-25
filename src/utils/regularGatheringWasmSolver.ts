import wasmUrl from '../wasm/regular-gathering-solver-core.wasm?url';
import { calculateBoonChance, calculateBountifulYield, calculateSuccessRate } from './gatheringMath';
import {
  REGULAR_GATHERING_STATE_KEY_FIELDS,
  applyRegularGatheringAction,
  createInitialRegularGatheringMechanicsState,
  createRegularGatheringMechanicsContext,
  gpPerGather,
  type RegularGatheringActionKind,
  type RegularGatheringActionTransition,
  type RegularGatheringMechanicsState
} from './regularGatheringMechanics';
import type {
  SolverDebugInfo,
  SolverObjectiveMode,
  SolverRequest,
  SolverResponse,
  SolverRotationPlan,
  SolverSearchDebugInfo
} from '../types/game';

export interface RegularGatheringWasmCore {
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
    yieldBonus: number,
    boonBonus: number,
    memoCapacityPower: number,
    objectiveMode: number
  ): number;
  getExpectedYield(): number;
  getMinYield(): number;
  getMaxYield(): number;
  getBestAction(): number;
  getStatesSolved(): bigint;
  getMemoHits(): bigint;
  getActionsEvaluated(): bigint;
  getCandidateComparisons(): bigint;
  getTerminalStates(): bigint;
  getBranchCount(): bigint;
  getFailed(): number;
  getFailureReason(): number;
  getBaseSuccessRate(): number;
  getBaseBoonChance(): number;
  getExpectedYieldForState(
    gp: number,
    integrity: number,
    flags: number,
    successBonus: number,
    boonBonus: number,
    allYieldBonus: number,
    nextSuccessBonus: number,
    nextYieldBonus: number
  ): number;
  getBestActionForState(
    gp: number,
    integrity: number,
    flags: number,
    successBonus: number,
    boonBonus: number,
    allYieldBonus: number,
    nextSuccessBonus: number,
    nextYieldBonus: number
  ): number;
}

export interface RegularGatheringWasmSolveOptions {
  memoCapacityPower?: number;
  supportedMemoCapacityPower?: number;
}

export class RegularGatheringWasmMemoCapacityError extends Error {
  constructor(
    readonly memoCapacityPower: number,
    readonly supportedMemoCapacityPower = memoCapacityPower,
    readonly nextMemoCapacityPower = memoCapacityPower + 1
  ) {
    const supportedText = supportedMemoCapacityPower === memoCapacityPower
      ? ''
      : ` The current environment supports up to 2^${supportedMemoCapacityPower}.`;
    super(`Regular gathering WASM memo table exceeded capacity 2^${memoCapacityPower}.${supportedText}`);
    this.name = 'RegularGatheringWasmMemoCapacityError';
  }
}

export class RegularGatheringWasmMemoryAllocationError extends Error {
  constructor(readonly memoCapacityPower: number) {
    super(`Regular gathering WASM memory could not be allocated for memo table 2^${memoCapacityPower}.`);
    this.name = 'RegularGatheringWasmMemoryAllocationError';
  }
}

interface RegularGatheringWasmRun {
  startingGp: number;
  plan: MaterializedWasmPlan;
  search: SolverSearchDebugInfo;
}

interface MaterializedWasmPlan {
  rotation: string[];
  outcomes: Map<number, number>;
  expectedYield: number;
  minYield: number;
  maxYield: number;
  minYieldChance: number;
  maxYieldChance: number;
}

const ACTION_GATHER = 0;
const ACTION_BOUNTIFUL_I = 7;
const ACTION_WISE = 10;
const FLAG_HAS_GATHERED = 1 << 0;
const FLAG_SUCCESS_I = 1 << 1;
const FLAG_SUCCESS_II = 1 << 2;
const FLAG_SUCCESS_III = 1 << 3;
const FLAG_GIFT_I = 1 << 4;
const FLAG_GIFT_II = 1 << 5;
const FLAG_TIDINGS = 1 << 6;
const FLAG_WISE = 1 << 7;
const GATHER_ACTION = '採集';
const WISE_TO_THE_WORLD_ACTION = '理智同興(若觸發)';
const WISE_PROC_GATHER_ACTION = '採集(理智觸發)';
const REGULAR_REVISIT_CHANCE = 0.05;
const TIMED_REVISIT_CHANCE = 0.08;
const DEFAULT_MEMO_CAPACITY_POWER = 20;
const EXTENDED_MEMO_CAPACITY_POWER = 21;
const UNKNOWN_DESKTOP_MEMO_CAPACITY_POWER = 22;
const DESKTOP_MAX_MEMO_CAPACITY_POWER = 23;
const MAX_SAFE_MEMO_CAPACITY_POWER = 30;
const MEMO_ENTRY_BYTES_ESTIMATE = 73;
const MEMO_MEMORY_BUDGET_RATIO = 0.18;
const WASM_FAILURE_MEMO_CAPACITY = 1;
let wasmPromise: Promise<RegularGatheringWasmCore> | null = null;

export async function loadRegularGatheringWasmCore(): Promise<RegularGatheringWasmCore> {
  if (!wasmPromise) {
    wasmPromise = instantiateRegularGatheringWasmCore().catch((error) => {
      wasmPromise = null;
      throw error;
    });
  }

  return wasmPromise;
}

async function instantiateRegularGatheringWasmCore(): Promise<RegularGatheringWasmCore> {
  const response = await fetch(wasmUrl);
  if (!response.ok) {
    throw new Error(`Regular gathering WASM core failed to load: ${response.status}`);
  }

  const bytes = await response.arrayBuffer();
  const module = await WebAssembly.instantiate(bytes, {
    env: {
      abort() {
        throw new Error('Regular gathering WASM core aborted.');
      }
    }
  });
  return module.instance.exports as unknown as RegularGatheringWasmCore;
}

export async function solveGatheringRotationWithWasm(
  request: SolverRequest,
  core?: RegularGatheringWasmCore,
  options: RegularGatheringWasmSolveOptions = {}
): Promise<SolverResponse> {
  const selectedPower = options.memoCapacityPower ?? normalizeManualMemoCapacityPower(request.manualMemoCapacityPower, selectInitialMemoCapacityPower(request));
  const initialPower = selectedPower ?? selectInitialMemoCapacityPower(request);
  const supportedPower = options.supportedMemoCapacityPower ?? selectSupportedMemoCapacityPower();

  if (initialPower > MAX_SAFE_MEMO_CAPACITY_POWER) {
    throw new RegularGatheringWasmMemoryAllocationError(initialPower);
  }

  if (selectedPower === null && supportedPower < initialPower) {
    throw new RegularGatheringWasmMemoCapacityError(initialPower, supportedPower);
  }

  const wasmCore = core ?? await loadRegularGatheringWasmCore();

  try {
    return solveGatheringRotationWithWasmCore(request, wasmCore, initialPower);
  } catch (error) {
    wasmPromise = null;
    if (wasmCore.getFailed() !== 0) {
      throw createWasmFailureError(wasmCore, initialPower, supportedPower);
    }

    if (isLikelyWasmMemoryAllocationFailure(error)) {
      throw new RegularGatheringWasmMemoryAllocationError(initialPower);
    }

    throw error;
  }
}

function normalizeManualMemoCapacityPower(power: number | undefined, initialPower: number): number | null {
  if (typeof power !== 'number' || !Number.isFinite(power)) return null;
  const normalizedPower = Math.max(initialPower, Math.floor(power));
  if (normalizedPower > MAX_SAFE_MEMO_CAPACITY_POWER) {
    throw new RegularGatheringWasmMemoryAllocationError(normalizedPower);
  }
  return normalizedPower;
}

function solveGatheringRotationWithWasmCore(
  request: SolverRequest,
  core: RegularGatheringWasmCore,
  memoCapacityPower: number
): SolverResponse {
  const initial = runPlan(request, core, request.temporaryGp, memoCapacityPower);
  const isFullGp = Math.min(request.stats.gp, request.temporaryGp) >= request.stats.gp;
  const revisitEnabled = request.stats.level >= 91;
  const revisitChance = revisitEnabled ? (request.isTimedNode ? TIMED_REVISIT_CHANCE : REGULAR_REVISIT_CHANCE) : 0;
  const fullGpResult = revisitEnabled && !isFullGp ? runPlan(request, core, request.stats.gp, memoCapacityPower) : initial;
  const combinedOutcomes = revisitEnabled
    ? mergeWeightedOutcomes([
        { outcomes: initial.plan.outcomes, weight: 1 - revisitChance },
        { outcomes: combineSequentialOutcomes(initial.plan.outcomes, fullGpResult.plan.outcomes), weight: revisitChance }
      ])
    : initial.plan.outcomes;
  const combinedSummary = summarizeOutcomes(combinedOutcomes);
  const expectedYield = expectedValue(combinedOutcomes);
  const rotationPlans: SolverRotationPlan[] = isFullGp || !revisitEnabled
    ? [buildRotationPlan('primary', initial.plan)]
    : [
        buildRotationPlan('primary', initial.plan),
        buildRotationPlan('revisit', fullGpResult.plan)
      ];

  const response: SolverResponse = {
    bestRotation: initial.plan.rotation,
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
    objectiveMode: request.objectiveMode ?? 'expected',
    calculationTime: 0
  };

  if (request.debugMode) {
    response.debug = buildDebugInfo(request, initial, fullGpResult, rotationPlans, expectedYield, revisitChance);
  }

  return response;
}

function runPlan(
  request: SolverRequest,
  core: RegularGatheringWasmCore,
  startingGp: number,
  memoCapacityPower: number
): RegularGatheringWasmRun {
  const clampedGp = Math.min(request.stats.gp, startingGp);

  core.solvePlanObjective(
    request.stats.level,
    request.stats.gathering,
    request.stats.perception,
    request.stats.gp,
    request.baseValues.Gathering,
    request.baseValues.Perception,
    request.itemLevel,
    request.nodeBonuses.baseIntegrity + request.nodeBonuses.gatheringCount,
    clampedGp,
    request.nodeBonuses.yieldCount,
    request.nodeBonuses.extraRate,
    memoCapacityPower,
    objectiveModeToWasm(request.objectiveMode ?? 'expected')
  );

  return {
    startingGp: clampedGp,
    plan: materializeWasmPlan(core, request, clampedGp),
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
    }
  };
}

function materializeWasmPlan(
  core: RegularGatheringWasmCore,
  request: SolverRequest,
  startingGp: number
): MaterializedWasmPlan {
  const context = createRegularGatheringMechanicsContext(request);
  const initialState = createInitialRegularGatheringMechanicsState(context, startingGp);

  function materialize(state: RegularGatheringMechanicsState): MaterializedWasmPlan {
    if (state.integrity <= 0) return planFromRotationAndOutcomes([], new Map([[0, 1]]));

    const actionId = core.getBestActionForState(...wasmStateArgs(state));
    if (actionId < 0) {
      throw new Error(`No regular gathering WASM best action for state ${wasmStateArgs(state).join('|')}.`);
    }

    const actionKind = actionKindFromWasmId(actionId);
    const actionName = actionNameForKind(actionKind, request.jobType);
    const branches = applyRegularGatheringAction(actionKind, state, context);
    const branchResults = branches.map((branch) => materialize(branch.state));
    const outcomes = combineBranchOutcomes(branches, branchResults);

    if (actionKind === 'gather' || actionKind === 'wise') {
      return planFromRotationAndOutcomes([actionName, ...branchResults[0].rotation], outcomes);
    }

    if (actionKind === 'restore' && branches.length > 1) {
      const procIndex = branches.findIndex((branch) => branch.state.wiseReady);
      const noProcIndex = branches.findIndex((branch) => !branch.state.wiseReady);
      const procState = branches[procIndex >= 0 ? procIndex : 0].state;
      const noProcState = branches[noProcIndex >= 0 ? noProcIndex : 0].state;
      const procRotation = branchResults[procIndex >= 0 ? procIndex : 0].rotation;
      const noProcRotation = branchResults[noProcIndex >= 0 ? noProcIndex : 0].rotation;
      const preferredRotation = wasmExpectedYieldForState(core, procState) >= wasmExpectedYieldForState(core, noProcState)
        ? markWiseProcGathers(procRotation, countGatherActions(procRotation) - countGatherActions(noProcRotation))
        : noProcRotation;

      return planFromRotationAndOutcomes([actionName, ...preferredRotation], outcomes);
    }

    return planFromRotationAndOutcomes([actionName, ...branchResults[0].rotation], outcomes);
  }

  return materialize(initialState);
}

function buildRotationPlan(kind: SolverRotationPlan['kind'], plan: MaterializedWasmPlan): SolverRotationPlan {
  return {
    kind,
    rotation: plan.rotation,
    expectedYield: plan.expectedYield,
    minYield: plan.minYield,
    maxYield: plan.maxYield,
    minYieldChance: plan.minYieldChance,
    maxYieldChance: plan.maxYieldChance
  };
}

function buildDebugInfo(
  request: SolverRequest,
  initial: RegularGatheringWasmRun,
  fullGpResult: RegularGatheringWasmRun,
  rotationPlans: SolverRotationPlan[],
  expectedYield: number,
  revisitChance: number
): SolverDebugInfo {
  const plusTwoThreshold = Math.floor(request.baseValues.Gathering * 0.9);
  const plusThreeThreshold = Math.floor(request.baseValues.Gathering * 1.1);

  return {
    formulas: {
      success: calculateSuccessFormulaDebug(
        request.stats.gathering,
        request.baseValues.Gathering,
        request.stats.level,
        request.itemLevel
      ),
      boon: calculateBoonFormulaDebug(request.stats.perception, request.baseValues.Perception),
      bountiful: {
        gathering: request.stats.gathering,
        baseGathering: request.baseValues.Gathering,
        plusTwoThreshold,
        plusThreeThreshold,
        amount: calculateBountifulYield(request.stats.gathering, request.baseValues.Gathering)
      },
      gather: {
        gpRecoveredPerGather: gpPerGather(request.stats.level),
        baseIntegrity: request.nodeBonuses.baseIntegrity,
        bonusIntegrity: request.nodeBonuses.gatheringCount,
        maxIntegrity: request.nodeBonuses.baseIntegrity + request.nodeBonuses.gatheringCount,
        nodeYieldBonus: request.nodeBonuses.yieldCount,
        nodeBoonBonus: request.nodeBonuses.extraRate
      }
    },
    plans: rotationPlans.map((plan) => {
      const run = plan.kind === 'revisit' ? fullGpResult : initial;
      return {
        kind: plan.kind,
        startingGp: run.startingGp,
        expectedYield: Number(run.plan.expectedYield.toFixed(4)),
        minYield: run.plan.minYield,
        maxYield: run.plan.maxYield,
        outcomeDistribution: serializeOutcomes(run.plan.outcomes),
        search: run.search
      };
    }),
    combined: {
      expectedYield: Number(expectedYield.toFixed(4)),
      revisitChance,
      expression: request.stats.level >= 91
        ? `${Number(initial.plan.expectedYield.toFixed(4))} + ${revisitChance} * ${Number(fullGpResult.plan.expectedYield.toFixed(4))}`
        : `${Number(initial.plan.expectedYield.toFixed(4))}`
    },
    optimality: {
      engine: 'wasm-core',
      method: 'dynamic-programming-exhaustive-search',
      stateKeyFields: [...REGULAR_GATHERING_STATE_KEY_FIELDS],
      stateKeyEngine: 'wasm-packed'
    }
  };
}

function objectiveModeToWasm(mode: SolverObjectiveMode): number {
  if (mode === 'min') return 1;
  if (mode === 'max') return 2;
  return 0;
}

function actionKindFromWasmId(actionId: number): RegularGatheringActionKind {
  if (actionId === ACTION_GATHER) return 'gather';
  if (actionId === 1) return 'successI';
  if (actionId === 2) return 'successII';
  if (actionId === 3) return 'successIII';
  if (actionId === 4) return 'giftI';
  if (actionId === 5) return 'giftII';
  if (actionId === 6) return 'clearVision';
  if (actionId === ACTION_BOUNTIFUL_I) return 'bountifulI';
  if (actionId === 8) return 'bountifulII';
  if (actionId === 9) return 'restore';
  if (actionId === ACTION_WISE) return 'wise';
  if (actionId === 11) return 'kingI';
  if (actionId === 12) return 'kingII';
  if (actionId === 13) return 'tidings';
  throw new Error(`No regular gathering action kind mapping for WASM action id ${actionId}.`);
}

function actionNameForKind(kind: RegularGatheringActionKind, jobType: SolverRequest['jobType']): string {
  const isMiner = jobType === 'miner';

  if (kind === 'gather') return GATHER_ACTION;
  if (kind === 'wise') return WISE_TO_THE_WORLD_ACTION;
  if (kind === 'successI') return isMiner ? '敏銳視野' : '環境探知';
  if (kind === 'successII') return isMiner ? '敏銳視野II' : '環境探知II';
  if (kind === 'successIII') return isMiner ? '敏銳視野III' : '環境探知III';
  if (kind === 'giftI') return isMiner ? '富礦的饋贈I' : '沃土的饋贈I';
  if (kind === 'giftII') return isMiner ? '富礦的饋贈II' : '沃土的饋贈II';
  if (kind === 'clearVision') return isMiner ? '明晰視野' : '植被專精';
  if (kind === 'bountifulI') return isMiner ? '高產' : '豐收';
  if (kind === 'bountifulII') return isMiner ? '高產II' : '豐收II';
  if (kind === 'restore') return isMiner ? '石工之理' : '農夫之智';
  if (kind === 'kingI') return isMiner ? '莫非王土' : '天賜收成';
  if (kind === 'kingII') return isMiner ? '莫非王土II' : '天賜收成II';
  if (kind === 'tidings') return isMiner ? '納爾札爾福音' : '諾菲卡福音';
  throw new Error(`No regular gathering action name mapping for "${kind}".`);
}

function stateFlags(state: RegularGatheringMechanicsState): number {
  let flags = 0;
  if (state.hasGathered) flags |= FLAG_HAS_GATHERED;
  if (state.successIActive) flags |= FLAG_SUCCESS_I;
  if (state.successIIActive) flags |= FLAG_SUCCESS_II;
  if (state.successIIIActive) flags |= FLAG_SUCCESS_III;
  if (state.giftIActive) flags |= FLAG_GIFT_I;
  if (state.giftIIActive) flags |= FLAG_GIFT_II;
  if (state.tidings) flags |= FLAG_TIDINGS;
  if (state.wiseReady) flags |= FLAG_WISE;
  return flags;
}

function wasmStateArgs(state: RegularGatheringMechanicsState) {
  return [
    state.gp,
    state.integrity,
    stateFlags(state),
    state.successBonus,
    state.boonBonus,
    state.allYieldBonus,
    state.nextSuccessBonus,
    state.nextYieldBonus
  ] as const;
}

function wasmExpectedYieldForState(
  core: RegularGatheringWasmCore,
  state: RegularGatheringMechanicsState
): number {
  return core.getExpectedYieldForState(...wasmStateArgs(state));
}

function planFromRotationAndOutcomes(rotation: string[], outcomes: Map<number, number>): MaterializedWasmPlan {
  const summary = summarizeOutcomes(outcomes);

  return {
    rotation,
    outcomes,
    expectedYield: expectedValue(outcomes),
    minYield: summary.minYield,
    maxYield: summary.maxYield,
    minYieldChance: summary.minYieldChance,
    maxYieldChance: summary.maxYieldChance
  };
}

function combineBranchOutcomes(
  branches: RegularGatheringActionTransition[],
  branchResults: MaterializedWasmPlan[]
): Map<number, number> {
  const outcomes = new Map<number, number>();

  branches.forEach((branch, index) => {
    addShiftedOutcomes(outcomes, branchResults[index].outcomes, branch.yieldDelta, branch.probability);
  });

  return outcomes;
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

function summarizeOutcomes(outcomes: Map<number, number>) {
  const yields = [...outcomes.keys()].sort((left, right) => left - right);
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

function countGatherActions(rotation: string[]): number {
  return rotation.filter((action) => action.startsWith(GATHER_ACTION)).length;
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
  const rawRate = calculateSuccessRate(gathering, baseGathering, playerLevel, 0);
  const finalRate = calculateSuccessRate(gathering, baseGathering, playerLevel, itemLevel);

  return {
    gathering,
    baseGathering,
    score,
    rawRate,
    levelDifference: itemLevel > 0 ? playerLevel - itemLevel : 0,
    levelModifier: finalRate - rawRate,
    finalRate
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

function selectInitialMemoCapacityPower(request: SolverRequest): number {
  const maxIntegrity = request.nodeBonuses.baseIntegrity + request.nodeBonuses.gatheringCount;
  if (request.stats.gp >= 4000 || maxIntegrity >= 6) return EXTENDED_MEMO_CAPACITY_POWER;
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

function getDeviceMemoCapacityPower(): number | null {
  const maybeNavigator = globalThis.navigator as (Navigator & { deviceMemory?: number }) | undefined;
  const deviceMemory = maybeNavigator?.deviceMemory;
  return typeof deviceMemory === 'number' && Number.isFinite(deviceMemory) ? deviceMemory : null;
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
  return (2 ** memoCapacityPower) * MEMO_ENTRY_BYTES_ESTIMATE;
}

function clampMemoCapacityPower(power: number): number {
  return Math.min(DESKTOP_MAX_MEMO_CAPACITY_POWER, Math.max(DEFAULT_MEMO_CAPACITY_POWER, power));
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
    || message.includes('unreachable')
    || message.includes('aborted');
}

function createWasmFailureError(
  core: RegularGatheringWasmCore,
  memoCapacityPower: number,
  supportedMemoCapacityPower: number
): Error {
  if (core.getFailureReason() === WASM_FAILURE_MEMO_CAPACITY) {
    return new RegularGatheringWasmMemoCapacityError(memoCapacityPower, supportedMemoCapacityPower);
  }

  return new RegularGatheringWasmMemoryAllocationError(memoCapacityPower);
}

function calculateMemoHitRate(statesSolved: number, memoHits: number): number {
  const cacheableLookups = statesSolved + memoHits;
  if (cacheableLookups === 0) return 0;
  return Number(((memoHits / cacheableLookups) * 100).toFixed(2));
}
