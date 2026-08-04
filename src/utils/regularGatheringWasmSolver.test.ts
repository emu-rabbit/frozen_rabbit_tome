// @ts-expect-error Node-only Vitest fixture; keep Node globals out of the app tsconfig.
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { solveGatheringRotation } from './rotationSolver';
import {
  RegularGatheringWasmMemoCapacityError,
  RegularGatheringWasmMemoryAllocationError,
  solveGatheringRotationWithWasm
} from './regularGatheringWasmSolver';
import {
  applyRegularGatheringAction,
  createInitialRegularGatheringMechanicsState,
  createRegularGatheringMechanicsContext,
  type RegularGatheringActionKind,
  type RegularGatheringActionTransition,
  type RegularGatheringMechanicsState
} from './regularGatheringMechanics';
import type { SolverObjectiveMode, SolverRequest } from '../types/game';

interface RegularGatheringWasmCore {
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
  getMinYieldForState(
    gp: number,
    integrity: number,
    flags: number,
    successBonus: number,
    boonBonus: number,
    allYieldBonus: number,
    nextSuccessBonus: number,
    nextYieldBonus: number
  ): number;
  getMaxYieldForState(
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

async function loadWasmCore(): Promise<RegularGatheringWasmCore> {
  const bytes = await readFile(new URL('../wasm/regular-gathering-solver-core.wasm', import.meta.url));
  const module = await WebAssembly.instantiate(bytes, {
    env: {
      abort() {
        throw new Error('Regular gathering WASM core aborted.');
      }
    }
  });

  return module.instance.exports as unknown as RegularGatheringWasmCore;
}

function baseRequest(overrides: Partial<SolverRequest> = {}): SolverRequest {
  return {
    stats: {
      level: 89,
      gathering: 1200,
      perception: 1000,
      gp: 930
    },
    baseValues: {
      Gathering: 1000,
      Perception: 1000
    },
    itemLevel: 89,
    nodeBonuses: {
      baseIntegrity: 4,
      gatheringCount: 0,
      yieldCount: 0,
      extraRate: 0
    },
    temporaryGp: 930,
    jobType: 'miner',
    debugMode: true,
    ...overrides
  };
}

function objectiveModeToWasm(mode: SolverObjectiveMode): number {
  if (mode === 'min') return 1;
  if (mode === 'max') return 2;
  return 0;
}

function solveWasmPlan(
  core: RegularGatheringWasmCore,
  request: SolverRequest,
  memoCapacityPower = 16
) {
  const mode = request.objectiveMode ?? 'expected';
  const objectiveScore = core.solvePlanObjective(
    request.stats.level,
    request.stats.gathering,
    request.stats.perception,
    request.stats.gp,
    request.baseValues.Gathering,
    request.baseValues.Perception,
    request.itemLevel,
    request.nodeBonuses.baseIntegrity + request.nodeBonuses.gatheringCount,
    request.temporaryGp,
    request.nodeBonuses.yieldCount,
    request.nodeBonuses.extraRate,
    memoCapacityPower,
    objectiveModeToWasm(mode)
  );

  return {
    objectiveScore,
    expectedYield: core.getExpectedYield(),
    minYield: core.getMinYield(),
    maxYield: core.getMaxYield(),
    bestAction: core.getBestAction(),
    statesSolved: Number(core.getStatesSolved()),
    memoHits: Number(core.getMemoHits()),
    failed: core.getFailed(),
    failureReason: core.getFailureReason(),
    baseSuccessRate: core.getBaseSuccessRate(),
    baseBoonChance: core.getBaseBoonChance()
  };
}

function rootActionId(actionName: string): number {
  if (actionName === '採集') return ACTION_GATHER;
  if (actionName === '敏銳視野') return 1;
  if (actionName === '敏銳視野II') return 2;
  if (actionName === '敏銳視野III') return 3;
  if (actionName === '富礦的饋贈I') return 4;
  if (actionName === '富礦的饋贈II') return 5;
  if (actionName === '明晰視野') return 6;
  if (actionName === '高產') return ACTION_BOUNTIFUL_I;
  if (actionName === '高產II') return 8;
  if (actionName === '石工之理') return 9;
  if (actionName === '理智同興(若觸發)') return 10;
  if (actionName === '莫非王土') return 11;
  if (actionName === '莫非王土II') return 12;
  if (actionName === '納爾札爾福音') return 13;
  throw new Error(`No regular WASM action id mapping for "${actionName}".`);
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

function expectedValue(outcomes: Map<number, number>): number {
  let total = 0;
  outcomes.forEach((probability, totalYield) => {
    total += totalYield * probability;
  });
  return total;
}

function summarizeOutcomes(outcomes: Map<number, number>) {
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

function materializeWasmPlan(
  core: RegularGatheringWasmCore,
  request: SolverRequest
): MaterializedWasmPlan {
  const context = createRegularGatheringMechanicsContext(request);
  const initialState = createInitialRegularGatheringMechanicsState(context, request.temporaryGp);

  function materialize(state: RegularGatheringMechanicsState): MaterializedWasmPlan {
    if (state.integrity <= 0) return planFromRotationAndOutcomes([], new Map([[0, 1]]));

    const actionId = core.getBestActionForState(...wasmStateArgs(state));
    if (actionId < 0) {
      throw new Error(`No WASM best action for state ${wasmStateArgs(state).join('|')}.`);
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

function materializeWasmPlans(
  core: RegularGatheringWasmCore,
  request: SolverRequest,
  memoCapacityPower = 20,
  includeRevisit = solveGatheringRotation(request).rotationPlans.some((plan) => plan.kind === 'revisit')
): MaterializedWasmPlan[] {
  const plans: MaterializedWasmPlan[] = [];

  solveWasmPlan(core, request, memoCapacityPower);
  plans.push(materializeWasmPlan(core, request));

  if (includeRevisit) {
    const fullGpRequest = {
      ...request,
      temporaryGp: request.stats.gp
    };
    solveWasmPlan(core, fullGpRequest, memoCapacityPower);
    plans.push(materializeWasmPlan(core, fullGpRequest));
  }

  return plans;
}

function expectSameDistribution(actual: Map<number, number>, expected: Map<number, number>) {
  expect([...actual.keys()].sort((a, b) => a - b)).toEqual([...expected.keys()].sort((a, b) => a - b));

  expected.forEach((expectedProbability, totalYield) => {
    expect(actual.get(totalYield) ?? 0).toBeCloseTo(expectedProbability, 10);
  });

  const totalProbability = [...actual.values()].reduce((sum, probability) => sum + probability, 0);
  expect(totalProbability).toBeCloseTo(1, 10);
  expect(expectedValue(actual)).toBeCloseTo(
    [...actual.entries()].reduce((sum, [totalYield, probability]) => sum + totalYield * probability, 0),
    10
  );
}

function expectSamePrimarySummary(core: RegularGatheringWasmCore, request: SolverRequest) {
  const ts = solveGatheringRotation(request);
  const wasm = solveWasmPlan(core, request);
  const primary = ts.rotationPlans[0];

  expect(wasm.failed).toBe(0);
  expect(wasm.failureReason).toBe(0);
  expect(wasm.expectedYield).toBeCloseTo(primary.expectedYield, 8);
  expect(wasm.minYield).toBe(primary.minYield);
  expect(wasm.maxYield).toBe(primary.maxYield);
  expect(wasm.objectiveScore).toBeCloseTo(primary.expectedYield, 8);
  expect(wasm.statesSolved).toBeGreaterThan(0);
  expect(wasm.memoHits).toBeGreaterThanOrEqual(0);
  return { ts, wasm };
}

function expectSamePrimaryRotation(core: RegularGatheringWasmCore, request: SolverRequest) {
  const ts = solveGatheringRotation(request);
  solveWasmPlan(core, request);
  expect(materializeWasmPlan(core, request).rotation).toEqual(ts.rotationPlans[0].rotation);
}

function expectSamePlanRotations(core: RegularGatheringWasmCore, request: SolverRequest) {
  const ts = solveGatheringRotation(request);
  const wasmRotations = materializeWasmPlans(
    core,
    request,
    16,
    ts.rotationPlans.some((plan) => plan.kind === 'revisit')
  ).map((plan) => plan.rotation);

  expect(wasmRotations).toEqual(ts.rotationPlans.map((plan) => plan.rotation));
}

async function expectSamePlanParity(
  core: RegularGatheringWasmCore,
  request: SolverRequest,
  memoCapacityPower = 20
) {
  const ts = solveGatheringRotation({ ...request, debugMode: true });
  const wasm = await solveGatheringRotationWithWasm(
    { ...request, debugMode: true },
    core,
    { memoCapacityPower }
  );
  const wasmRotations = wasm.rotationPlans.map((plan) => plan.rotation);
  const tsRotations = ts.rotationPlans.map((plan) => plan.rotation);

  if (JSON.stringify(wasmRotations) !== JSON.stringify(tsRotations)) {
    throw new Error(`rotation mismatch\nTS: ${JSON.stringify(tsRotations)}\nWASM: ${JSON.stringify(wasmRotations)}`);
  }
  expect(wasm.bestRotation).toEqual(ts.bestRotation);
  expect(wasm.rotationPlans).toHaveLength(ts.rotationPlans.length);

  wasm.rotationPlans.forEach((wasmPlan, index) => {
    const tsPlan = ts.rotationPlans[index];
    expect(wasmPlan.expectedYield).toBeCloseTo(tsPlan.expectedYield, 8);
    expect(wasmPlan.minYield).toBe(tsPlan.minYield);
    expect(wasmPlan.maxYield).toBe(tsPlan.maxYield);
    expect(wasmPlan.minYieldChance).toBeCloseTo(tsPlan.minYieldChance, 8);
    expect(wasmPlan.maxYieldChance).toBeCloseTo(tsPlan.maxYieldChance, 8);
    const tsDebugPlan = ts.debug?.plans.find((plan) => plan.kind === tsPlan.kind);
    const wasmDebugPlan = wasm.debug?.plans.find((plan) => plan.kind === wasmPlan.kind);
    if (!tsDebugPlan) throw new Error(`Missing TS debug plan for ${tsPlan.kind}.`);
    if (!wasmDebugPlan) throw new Error(`Missing WASM debug plan for ${wasmPlan.kind}.`);
    expectSameDistribution(
      new Map(wasmDebugPlan.outcomeDistribution.map((entry) => [entry.yield, entry.probability / 100])),
      new Map(tsDebugPlan.outcomeDistribution.map((entry) => [entry.yield, entry.probability / 100]))
    );
  });

  expect(wasm.expectedYield).toBeCloseTo(ts.expectedYield, 2);
  expect(wasm.minYield).toBe(ts.minYield);
  expect(wasm.maxYield).toBe(ts.maxYield);
  expect(wasm.minYieldChance).toBeCloseTo(ts.minYieldChance, 8);
  expect(wasm.maxYieldChance).toBeCloseTo(ts.maxYieldChance, 8);
  expect(wasm.debug?.combined).toEqual(ts.debug?.combined);
  expect(wasm.debug?.optimality.engine).toBe('wasm-core');
  expect(wasm.debug?.optimality.stateKeyEngine).toBe('wasm-packed');
}

describe('regular gathering WASM solver core POC', () => {
  it('matches the TS primary plan for the no-skill golden case', async () => {
    const core = await loadWasmCore();
    const request = baseRequest({
      stats: {
        level: 89,
        gathering: 100,
        perception: 0,
        gp: 0
      },
      baseValues: {
        Gathering: 100,
        Perception: 100
      },
      nodeBonuses: {
        baseIntegrity: 2,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      temporaryGp: 0
    });
    const { ts, wasm } = expectSamePrimarySummary(core, request);

    expect(ts.bestRotation).toEqual(['採集', '採集']);
    expect(wasm.bestAction).toBe(ACTION_GATHER);
  });

  it('matches the TS primary plan for a next-gather yield skill case', async () => {
    const core = await loadWasmCore();
    const request = baseRequest({
      stats: {
        level: 24,
        gathering: 100,
        perception: 0,
        gp: 100
      },
      baseValues: {
        Gathering: 100,
        Perception: 100
      },
      itemLevel: 24,
      nodeBonuses: {
        baseIntegrity: 2,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      temporaryGp: 100
    });
    const { ts, wasm } = expectSamePrimarySummary(core, request);

    expect(ts.bestRotation).toEqual(['高產', '採集', '採集']);
    expect(wasm.bestAction).toBe(ACTION_BOUNTIFUL_I);
  });

  it('matches the TS primary plan across expected, min, and max objective modes', async () => {
    const core = await loadWasmCore();
    const request = baseRequest({
      stats: {
        level: 89,
        gathering: 760,
        perception: 850,
        gp: 500
      },
      baseValues: {
        Gathering: 1000,
        Perception: 1000
      },
      nodeBonuses: {
        baseIntegrity: 4,
        gatheringCount: 1,
        yieldCount: 1,
        extraRate: 10
      },
      temporaryGp: 500
    });

    for (const objectiveMode of ['expected', 'min', 'max'] as const) {
      const modeRequest = { ...request, objectiveMode };
      const ts = solveGatheringRotation(modeRequest);
      const wasm = solveWasmPlan(core, modeRequest);
      const primary = ts.rotationPlans[0];
      const expectedObjective = objectiveMode === 'min'
        ? primary.minYield
        : (objectiveMode === 'max' ? primary.maxYield : primary.expectedYield);

      expect(wasm.failed).toBe(0);
      expect(wasm.expectedYield).toBeCloseTo(primary.expectedYield, 8);
      expect(wasm.minYield).toBe(primary.minYield);
      expect(wasm.maxYield).toBe(primary.maxYield);
      expect(wasm.objectiveScore).toBeCloseTo(expectedObjective, 8);
    }
  });

  it('accepts GP values near the current input ceiling without key collisions in the POC range', async () => {
    const core = await loadWasmCore();
    const request = baseRequest({
      stats: {
        level: 89,
        gathering: 1200,
        perception: 1000,
        gp: 4095
      },
      nodeBonuses: {
        baseIntegrity: 3,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      temporaryGp: 4095
    });
    const { wasm } = expectSamePrimarySummary(core, request);

    const ts = solveGatheringRotation(request);
    expect(wasm.bestAction).toBe(rootActionId(ts.bestRotation[0]));
  });

  it('materializes WASM best actions into the same primary rotation shape as TS contract cases', async () => {
    const core = await loadWasmCore();
    const cases: SolverRequest[] = [
      baseRequest({
        stats: {
          level: 100,
          gathering: 1200,
          perception: 1000,
          gp: 100
        },
        nodeBonuses: {
          baseIntegrity: 2,
          gatheringCount: 0,
          yieldCount: 0,
          extraRate: 0
        },
        temporaryGp: 100
      }),
      baseRequest({
        stats: {
          level: 100,
          gathering: 800,
          perception: 1000,
          gp: 400
        },
        nodeBonuses: {
          baseIntegrity: 10,
          gatheringCount: 0,
          yieldCount: 0,
          extraRate: 0
        },
        temporaryGp: 400,
        jobType: 'botanist'
      }),
      baseRequest({
        stats: {
          level: 90,
          gathering: 1200,
          perception: 1000,
          gp: 300
        },
        nodeBonuses: {
          baseIntegrity: 4,
          gatheringCount: 0,
          yieldCount: 50,
          extraRate: 0
        },
        temporaryGp: 300
      }),
      baseRequest({
        temporaryGp: 300
      }),
      baseRequest({
        stats: {
          level: 100,
          gathering: 1200,
          perception: 950,
          gp: 931
        },
        nodeBonuses: {
          baseIntegrity: 6,
          gatheringCount: 0,
          yieldCount: 0,
          extraRate: 40
        },
        temporaryGp: 931,
        jobType: 'botanist'
      }),
      baseRequest({
        stats: {
          level: 10,
          gathering: 760,
          perception: 1000,
          gp: 250
        },
        itemLevel: 10,
        nodeBonuses: {
          baseIntegrity: 2,
          gatheringCount: 0,
          yieldCount: 0,
          extraRate: 0
        },
        temporaryGp: 250
      }),
      baseRequest({
        stats: {
          level: 50,
          gathering: 800,
          perception: 1500,
          gp: 100
        },
        itemLevel: 50,
        nodeBonuses: {
          baseIntegrity: 10,
          gatheringCount: 0,
          yieldCount: 0,
          extraRate: 30
        },
        temporaryGp: 100
      }),
      baseRequest({
        stats: {
          level: 100,
          gathering: 0,
          perception: 500,
          gp: 600
        },
        nodeBonuses: {
          baseIntegrity: 4,
          gatheringCount: 0,
          yieldCount: 0,
          extraRate: 0
        },
        temporaryGp: 600
      }),
      baseRequest({
        stats: {
          level: 10,
          gathering: 280,
          perception: 1000,
          gp: 250
        },
        itemLevel: 10,
        nodeBonuses: {
          baseIntegrity: 4,
          gatheringCount: 0,
          yieldCount: 0,
          extraRate: 0
        },
        temporaryGp: 250,
        objectiveMode: 'min'
      }),
      baseRequest({
        stats: {
          level: 10,
          gathering: 280,
          perception: 1000,
          gp: 250
        },
        itemLevel: 10,
        nodeBonuses: {
          baseIntegrity: 4,
          gatheringCount: 0,
          yieldCount: 0,
          extraRate: 0
        },
        temporaryGp: 250,
        objectiveMode: 'max'
      })
    ];

    for (const request of cases) {
      expectSamePrimaryRotation(core, request);
    }
  });

  it('materializes both primary and Revisit WASM rotations when the TS solver exposes two plans', async () => {
    const core = await loadWasmCore();
    const request = baseRequest({
      temporaryGp: 300
    });

    expectSamePlanRotations(core, request);
  });

  it('matches TS rotation plans and outcome distributions across the fast parity corpus', async () => {
    const core = await loadWasmCore();
    const cases: Array<{ name: string; request: SolverRequest; memoCapacityPower?: number }> = [
      {
        name: 'GP 2000 / integrity 4 / low success / high boon / no Revisit / expected',
        request: baseRequest({
          stats: {
            level: 89,
            gathering: 520,
            perception: 1500,
            gp: 2000
          },
          baseValues: {
            Gathering: 1000,
            Perception: 1000
          },
          itemLevel: 89,
          nodeBonuses: {
            baseIntegrity: 4,
            gatheringCount: 0,
            yieldCount: 0,
            extraRate: 0
          },
          temporaryGp: 2000,
          objectiveMode: 'expected'
        })
      },
      {
        name: 'GP 4000 / integrity 5 / node bonus / Revisit / expected',
        request: baseRequest({
          stats: {
            level: 91,
            gathering: 1200,
            perception: 1500,
            gp: 4000
          },
          baseValues: {
            Gathering: 1000,
            Perception: 1000
          },
          itemLevel: 91,
          nodeBonuses: {
            baseIntegrity: 4,
            gatheringCount: 1,
            yieldCount: 1,
            extraRate: 40
          },
          temporaryGp: 3500,
          objectiveMode: 'expected'
        }),
        memoCapacityPower: 20
      },
      {
        name: 'GP 2000 / integrity 5 / node bonus / no Revisit / max',
        request: baseRequest({
          stats: {
            level: 81,
            gathering: 900,
            perception: 1200,
            gp: 2000
          },
          baseValues: {
            Gathering: 1000,
            Perception: 1000
          },
          itemLevel: 81,
          nodeBonuses: {
            baseIntegrity: 5,
            gatheringCount: 0,
            yieldCount: 2,
            extraRate: 30
          },
          temporaryGp: 2000,
          objectiveMode: 'max',
          jobType: 'botanist'
        })
      }
    ];

    for (const parityCase of cases) {
      try {
        await expectSamePlanParity(core, parityCase.request, parityCase.memoCapacityPower);
      } catch (error) {
        throw new Error(`Expanded parity corpus failed for ${parityCase.name}: ${(error as Error).message}`);
      }
    }
  });

  it('reports memo capacity exhaustion as a controlled regular-gathering error without TS fallback', async () => {
    let calls = 0;
    const core = {
      solvePlanObjective() {
        calls += 1;
        throw new Error('Regular gathering WASM core aborted.');
      },
      getFailed() {
        return 1;
      },
      getFailureReason() {
        return 1;
      }
    } as unknown as RegularGatheringWasmCore;

    const rejection = await solveGatheringRotationWithWasm(baseRequest(), core, { memoCapacityPower: 20 })
      .then(() => null, (error: unknown) => error);

    expect(rejection).toBeInstanceOf(RegularGatheringWasmMemoCapacityError);
    expect((rejection as RegularGatheringWasmMemoCapacityError).nextMemoCapacityPower).toBe(21);
    expect(calls).toBe(1);
  });

  it('reports startup allocation failure separately from memo capacity exhaustion', async () => {
    let calls = 0;
    const core = {
      solvePlanObjective() {
        calls += 1;
        throw new WebAssembly.RuntimeError('unreachable');
      },
      getFailed() {
        return 0;
      },
      getFailureReason() {
        return 0;
      }
    } as unknown as RegularGatheringWasmCore;

    const rejection = await solveGatheringRotationWithWasm(baseRequest(), core, {
      memoCapacityPower: 24,
      supportedMemoCapacityPower: 24
    })
      .then(() => null, (error: unknown) => error);

    expect(rejection).toBeInstanceOf(RegularGatheringWasmMemoryAllocationError);
    expect(rejection).not.toBeInstanceOf(RegularGatheringWasmMemoCapacityError);
    expect(calls).toBe(1);
  });
});
