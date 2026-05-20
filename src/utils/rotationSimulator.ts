import type { NodeBonuses, PlayerStats, SimulationResponse, SimulationRotationAnalysis, SolverRequest } from '../types/game';
import {
  applyRegularGatheringAction,
  canUseRegularGatheringAction,
  createInitialRegularGatheringMechanicsState,
  createRegularGatheringMechanicsContext,
  type RegularGatheringActionKind,
  type RegularGatheringMechanicsContext,
  type RegularGatheringMechanicsState
} from './regularGatheringMechanics';

type JobType = SolverRequest['jobType'];

export interface SimulatorAction {
  kind: RegularGatheringActionKind;
  name: string;
  category: 'gather' | 'success' | 'boon' | 'nextSuccess' | 'nextYield' | 'restore' | 'wholeYield' | 'boonYield';
  gpCost: number;
  minLevel: number;
  description: string;
}

export interface SimState extends RegularGatheringMechanicsState {
  probability: number;
  yield: number;
}

export interface SimulationRequest {
  stats: PlayerStats;
  baseValues: { Gathering: number; Perception: number };
  itemLevel: number;
  nodeBonuses: NodeBonuses;
  temporaryGp: number;
  jobType: JobType;
  isTimedNode?: boolean;
  includeRevisit?: boolean;
  primaryRotation: string[];
  revisitRotation: string[];
}

const REGULAR_REVISIT_CHANCE = 0.05;
const TIMED_REVISIT_CHANCE = 0.08;

export function getSimulatorActions(jobType: JobType): SimulatorAction[] {
  const names = actionNames(jobType);

  return [
    { kind: 'gather', name: '採集', category: 'gather', gpCost: 0, minLevel: 1, description: '消耗 1 點耐久並採集目前物品。' },
    { kind: 'successI', name: names.successI, category: 'success', gpCost: 50, minLevel: 4, description: '整個採集點獲得率 +5%。' },
    { kind: 'successII', name: names.successII, category: 'success', gpCost: 100, minLevel: 5, description: '整個採集點獲得率 +15%。' },
    { kind: 'successIII', name: names.successIII, category: 'success', gpCost: 250, minLevel: 10, description: '整個採集點獲得率 +50%。' },
    { kind: 'giftI', name: names.giftI, category: 'boon', gpCost: 50, minLevel: 15, description: '整個採集點額外採集率 +10%。' },
    { kind: 'giftII', name: names.giftII, category: 'boon', gpCost: 100, minLevel: 50, description: '整個採集點額外採集率 +30%。' },
    { kind: 'clearVision', name: names.clearVision, category: 'nextSuccess', gpCost: 50, minLevel: 23, description: '下一次採集獲得率 +15%。' },
    { kind: 'bountifulI', name: names.bountifulI, category: 'nextYield', gpCost: 100, minLevel: 24, description: '下一次採集獲得數 +1。' },
    { kind: 'bountifulII', name: names.bountifulII, category: 'nextYield', gpCost: 100, minLevel: 68, description: '下一次採集獲得數 +1 到 +3。' },
    { kind: 'restore', name: names.restore, category: 'restore', gpCost: 300, minLevel: 25, description: '恢復 1 點耐久；90 級後有 50% 機率預備理智同興。' },
    { kind: 'wise', name: '理智同興', category: 'restore', gpCost: 0, minLevel: 90, description: '理智同興預備中可用，恢復 1 點耐久。' },
    { kind: 'kingI', name: names.kingI, category: 'wholeYield', gpCost: 400, minLevel: 30, description: '整個採集點獲得數 +1。' },
    { kind: 'kingII', name: names.kingII, category: 'wholeYield', gpCost: 500, minLevel: 40, description: '整個採集點獲得數 +2。' },
    { kind: 'tidings', name: names.tidings, category: 'boonYield', gpCost: 200, minLevel: 81, description: '額外採集成功時獲得數再 +1。' }
  ];
}

export function simulateGatheringRotation(request: SimulationRequest): SimulationResponse {
  const mechanics = createRegularGatheringMechanicsContext(request);
  const initialState = createInitialState(mechanics, request.temporaryGp);
  const primaryStates = runRotation([initialState], request.primaryRotation, request, mechanics);
  const primary = summarizeRun('primary', request.primaryRotation, primaryStates);
  const revisitEnabled = request.includeRevisit !== false && request.stats.level >= 91;
  const revisitChance = revisitEnabled ? (request.isTimedNode ? TIMED_REVISIT_CHANCE : REGULAR_REVISIT_CHANCE) : 0;
  const revisitStates = request.revisitRotation.length > 0
    ? runRotation([createInitialState(mechanics, request.stats.gp)], request.revisitRotation, request, mechanics)
    : [];
  const revisit = revisitStates.length > 0
    ? summarizeRun('revisit', request.revisitRotation, revisitStates)
    : undefined;
  const totalOutcomes = revisitEnabled && revisit
    ? combineWithRevisit(primaryStates, revisitStates, revisitChance)
    : primaryStates;

  return {
    primary,
    revisit,
    total: summarizeRun('total', [], totalOutcomes),
    revisitChance
  };
}

export function previewRotationState(request: Omit<SimulationRequest, 'primaryRotation' | 'revisitRotation'>, rotation: string[]) {
  const mechanics = createRegularGatheringMechanicsContext(request);
  return runRotation([createInitialState(mechanics, request.temporaryGp)], rotation, {
    ...request,
    primaryRotation: rotation,
    revisitRotation: []
  }, mechanics);
}

export function validateSimulatorRotation(
  request: Omit<SimulationRequest, 'primaryRotation' | 'revisitRotation'>,
  rotation: string[]
) {
  const simulationRequest: SimulationRequest = {
    ...request,
    primaryRotation: rotation,
    revisitRotation: []
  };
  const mechanics = createRegularGatheringMechanicsContext(request);
  let states = [createInitialState(mechanics, request.temporaryGp)];
  const invalidIndexes: number[] = [];

  rotation.forEach((actionName, index) => {
    const action = resolveAction(actionName, request.jobType);
    if (!action) {
      invalidIndexes.push(index);
      return;
    }

    if (!states.some((state) => canUseAction(action, state, request, mechanics))) {
      invalidIndexes.push(index);
      return;
    }

    states = normalizeStates(states.flatMap((state) => applyAction(action, state, simulationRequest, mechanics)));
  });

  return {
    invalidIndexes,
    isValid: invalidIndexes.length === 0
  };
}

export function canUseSimulatorAction(action: SimulatorAction, states: SimState[], request: Omit<SimulationRequest, 'primaryRotation' | 'revisitRotation'>): boolean {
  const mechanics = createRegularGatheringMechanicsContext(request);
  return states.some((state) => canUseAction(action, state, request, mechanics));
}

function runRotation(
  states: SimState[],
  rotation: string[],
  request: SimulationRequest,
  mechanics: RegularGatheringMechanicsContext
) {
  return rotation.reduce((currentStates, actionName) => {
    const action = resolveAction(actionName, request.jobType);
    if (!action) return currentStates;

    return normalizeStates(currentStates.flatMap((state) => applyAction(action, state, request, mechanics)));
  }, states);
}

function applyAction(
  action: SimulatorAction,
  state: SimState,
  request: SimulationRequest,
  mechanics: RegularGatheringMechanicsContext
): SimState[] {
  if (!canUseAction(action, state, request, mechanics)) return [state];

  return applyRegularGatheringAction(action.kind, state, mechanics).map((transition) => ({
    ...transition.state,
    probability: state.probability * transition.probability,
    yield: state.yield + transition.yieldDelta
  }));
}

function canUseAction(
  action: SimulatorAction,
  state: SimState,
  request: Omit<SimulationRequest, 'primaryRotation' | 'revisitRotation'>,
  mechanics: RegularGatheringMechanicsContext
): boolean {
  if (request.stats.level < action.minLevel || state.gp < action.gpCost) return false;
  return canUseRegularGatheringAction(action.kind, state, mechanics);
}

function combineWithRevisit(primaryStates: SimState[], revisitStates: SimState[], revisitChance: number) {
  const noRevisit = primaryStates.map((state) => ({ ...state, probability: state.probability * (1 - revisitChance) }));
  const withRevisit = primaryStates.flatMap((primary) => revisitStates.map((revisit) => ({
    ...revisit,
    probability: primary.probability * revisit.probability * revisitChance,
    yield: primary.yield + revisit.yield
  })));

  return normalizeStates([...noRevisit, ...withRevisit]);
}

function summarizeRun(kind: SimulationRotationAnalysis['kind'], rotation: string[], states: SimState[]): SimulationRotationAnalysis {
  const distribution = new Map<number, number>();
  states.forEach((state) => distribution.set(state.yield, (distribution.get(state.yield) ?? 0) + state.probability));
  const yields = [...distribution.keys()].sort((a, b) => a - b);
  const minYield = yields[0] ?? 0;
  const maxYield = yields[yields.length - 1] ?? 0;
  const integrities = states.map((state) => state.integrity);
  const gps = states.map((state) => state.gp);

  return {
    kind,
    expectedYield: Number(states.reduce((sum, state) => sum + state.yield * state.probability, 0).toFixed(2)),
    minYield,
    maxYield,
    minYieldChance: (distribution.get(minYield) ?? 0) * 100,
    maxYieldChance: (distribution.get(maxYield) ?? 0) * 100,
    outcomeDistribution: [...distribution.entries()].sort(([a], [b]) => a - b).map(([totalYield, probability]) => ({
      yield: totalYield,
      probability: probability * 100
    })),
    finalIntegrityRange: [integrities.length ? Math.min(...integrities) : 0, integrities.length ? Math.max(...integrities) : 0],
    finalGpRange: [gps.length ? Math.min(...gps) : 0, gps.length ? Math.max(...gps) : 0]
  };
}

function normalizeStates(states: SimState[]) {
  const merged = new Map<string, SimState>();
  states.forEach((state) => {
    const key = JSON.stringify({ ...state, probability: 0 });
    const existing = merged.get(key);
    if (existing) existing.probability += state.probability;
    else merged.set(key, { ...state });
  });

  return [...merged.values()].filter((state) => state.probability > 0.000000001);
}

function createInitialState(
  mechanics: RegularGatheringMechanicsContext,
  temporaryGp: number
): SimState {
  return {
    ...createInitialRegularGatheringMechanicsState(mechanics, temporaryGp),
    probability: 1,
    yield: 0
  };
}

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

function resolveAction(actionName: string, jobType: JobType) {
  return getSimulatorActions(jobType).find((option) => option.name === actionName || (option.kind === 'gather' && actionName.startsWith('採集')));
}
