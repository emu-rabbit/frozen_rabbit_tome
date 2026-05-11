import { calculateBoonChance, calculateBountifulYield, calculateSuccessRate } from './gatheringMath';
import type { NodeBonuses, PlayerStats, SimulationResponse, SimulationRotationAnalysis, SolverRequest } from '../types/game';

type JobType = SolverRequest['jobType'];
type ActionKind =
  | 'gather'
  | 'successI'
  | 'successII'
  | 'successIII'
  | 'giftI'
  | 'giftII'
  | 'clearVision'
  | 'bountifulI'
  | 'bountifulII'
  | 'restore'
  | 'wise'
  | 'kingI'
  | 'kingII'
  | 'tidings';

export interface SimulatorAction {
  kind: ActionKind;
  name: string;
  category: 'gather' | 'success' | 'boon' | 'nextSuccess' | 'nextYield' | 'restore' | 'wholeYield' | 'boonYield';
  gpCost: number;
  minLevel: number;
  description: string;
}

export interface SimState {
  probability: number;
  yield: number;
  gp: number;
  integrity: number;
  hasGathered: boolean;
  successBonus: number;
  successIActive: boolean;
  successIIActive: boolean;
  successIIIActive: boolean;
  boonBonus: number;
  giftIActive: boolean;
  giftIIActive: boolean;
  allYieldBonus: number;
  tidings: boolean;
  nextSuccessBonus: number;
  nextYieldBonus: number;
  wiseReady: boolean;
}

export interface SimulationRequest {
  stats: PlayerStats;
  baseValues: { Gathering: number; Perception: number };
  itemLevel: number;
  nodeBonuses: NodeBonuses;
  temporaryGp: number;
  jobType: JobType;
  isTimedNode?: boolean;
  primaryRotation: string[];
  revisitRotation: string[];
}

const BOON_CAP = 100;
const SUCCESS_CAP = 100;
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
  const maxIntegrity = request.nodeBonuses.baseIntegrity + request.nodeBonuses.gatheringCount;
  const initialState = createInitialState(Math.min(request.temporaryGp, request.stats.gp), maxIntegrity);
  const primaryStates = runRotation([initialState], request.primaryRotation, request);
  const primary = summarizeRun('primary', request.primaryRotation, primaryStates);
  const revisitEnabled = request.stats.level >= 91;
  const revisitChance = revisitEnabled ? (request.isTimedNode ? TIMED_REVISIT_CHANCE : REGULAR_REVISIT_CHANCE) : 0;
  const revisitStates = request.revisitRotation.length > 0
    ? runRotation([createInitialState(request.stats.gp, maxIntegrity)], request.revisitRotation, request)
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
  return runRotation([createInitialState(Math.min(request.temporaryGp, request.stats.gp), request.nodeBonuses.baseIntegrity + request.nodeBonuses.gatheringCount)], rotation, {
    ...request,
    primaryRotation: rotation,
    revisitRotation: []
  });
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
  let states = [createInitialState(
    Math.min(request.temporaryGp, request.stats.gp),
    request.nodeBonuses.baseIntegrity + request.nodeBonuses.gatheringCount
  )];
  const invalidIndexes: number[] = [];

  rotation.forEach((actionName, index) => {
    const action = resolveAction(actionName, request.jobType);
    if (!action) {
      invalidIndexes.push(index);
      return;
    }

    if (!states.some((state) => canUseAction(action, state, request))) {
      invalidIndexes.push(index);
      return;
    }

    states = normalizeStates(states.flatMap((state) => applyAction(action, state, simulationRequest)));
  });

  return {
    invalidIndexes,
    isValid: invalidIndexes.length === 0
  };
}

export function canUseSimulatorAction(action: SimulatorAction, states: SimState[], request: Omit<SimulationRequest, 'primaryRotation' | 'revisitRotation'>): boolean {
  return states.some((state) => canUseAction(action, state, request));
}

function runRotation(states: SimState[], rotation: string[], request: SimulationRequest) {
  return rotation.reduce((currentStates, actionName) => {
    const action = resolveAction(actionName, request.jobType);
    if (!action) return currentStates;

    return normalizeStates(currentStates.flatMap((state) => applyAction(action, state, request)));
  }, states);
}

function applyAction(action: SimulatorAction, state: SimState, request: SimulationRequest): SimState[] {
  if (!canUseAction(action, state, request)) return [state];

  if (action.kind === 'gather') return gather(state, request);
  if (action.kind === 'restore') return restore(state, request);
  if (action.kind === 'wise') return [{ ...state, integrity: state.integrity + 1, wiseReady: false }];

  const next = { ...state, gp: state.gp - action.gpCost };
  if (action.kind === 'successI') return [{ ...next, successBonus: next.successBonus + 5, successIActive: true }];
  if (action.kind === 'successII') return [{ ...next, successBonus: next.successBonus + 15, successIIActive: true }];
  if (action.kind === 'successIII') return [{ ...next, successBonus: next.successBonus + 50, successIIIActive: true }];
  if (action.kind === 'giftI') return [{ ...next, boonBonus: next.boonBonus + 10, giftIActive: true }];
  if (action.kind === 'giftII') return [{ ...next, boonBonus: next.boonBonus + 30, giftIIActive: true }];
  if (action.kind === 'clearVision') return [{ ...next, nextSuccessBonus: 15 }];
  if (action.kind === 'bountifulI') return [{ ...next, nextYieldBonus: 1 }];
  if (action.kind === 'bountifulII') return [{ ...next, nextYieldBonus: calculateBountifulYield(request.stats.gathering, request.baseValues.Gathering) }];
  if (action.kind === 'kingI') return [{ ...next, allYieldBonus: 1 }];
  if (action.kind === 'kingII') return [{ ...next, allYieldBonus: 2 }];
  if (action.kind === 'tidings') return [{ ...next, tidings: true }];

  return [state];
}

function canUseAction(action: SimulatorAction, state: SimState, request: Omit<SimulationRequest, 'primaryRotation' | 'revisitRotation'>): boolean {
  if (request.stats.level < action.minLevel || state.gp < action.gpCost) return false;
  if (state.integrity <= 0) return false;
  const maxIntegrity = request.nodeBonuses.baseIntegrity + request.nodeBonuses.gatheringCount;
  const baseSuccessRate = calculateSuccessRate(request.stats.gathering, request.baseValues.Gathering, request.stats.level, request.itemLevel);
  const baseBoonChance = calculateBoonChance(request.stats.perception, request.baseValues.Perception);

  if (action.kind === 'gather') return state.integrity > 0;
  if (action.kind === 'wise') return state.integrity < maxIntegrity && state.wiseReady;
  if (action.kind === 'restore') return state.integrity < maxIntegrity;
  if (['successI', 'successII', 'successIII', 'giftI', 'giftII', 'kingI', 'kingII', 'tidings'].includes(action.kind) && state.hasGathered) return false;
  if (action.kind === 'successI') return !state.successIActive && baseSuccessRate > 1 && baseSuccessRate + state.successBonus < SUCCESS_CAP;
  if (action.kind === 'successII') return !state.successIIActive && baseSuccessRate > 1 && baseSuccessRate + state.successBonus < SUCCESS_CAP;
  if (action.kind === 'successIII') return !state.successIIIActive && baseSuccessRate > 1 && baseSuccessRate + state.successBonus < SUCCESS_CAP;
  if (action.kind === 'giftI') return !state.giftIActive && baseBoonChance + request.nodeBonuses.extraRate > 1;
  if (action.kind === 'giftII') return !state.giftIIActive && baseBoonChance + request.nodeBonuses.extraRate > 1;
  if (action.kind === 'clearVision') return state.nextSuccessBonus === 0 && baseSuccessRate > 1 && baseSuccessRate + state.successBonus < SUCCESS_CAP;
  if (action.kind === 'bountifulI' || action.kind === 'bountifulII') return state.nextYieldBonus === 0 && baseSuccessRate + state.successBonus > 0;
  if (action.kind === 'kingI' || action.kind === 'kingII') return state.allYieldBonus === 0;
  if (action.kind === 'tidings') return !state.tidings && baseBoonChance + request.nodeBonuses.extraRate + state.boonBonus > 0;

  return true;
}

function gather(state: SimState, request: SimulationRequest): SimState[] {
  const successRate = clampPercent(calculateSuccessRate(request.stats.gathering, request.baseValues.Gathering, request.stats.level, request.itemLevel) + state.successBonus + state.nextSuccessBonus, SUCCESS_CAP) / 100;
  const boonChance = clampPercent(calculateBoonChance(request.stats.perception, request.baseValues.Perception) + request.nodeBonuses.extraRate + state.boonBonus, BOON_CAP) / 100;
  const baseYield = 1 + request.nodeBonuses.yieldCount + state.allYieldBonus + state.nextYieldBonus;
  const boonYield = 1 + (state.tidings ? 1 : 0);
  const afterGather = {
    ...state,
    gp: Math.min(request.stats.gp, state.gp + gpPerGather(request.stats.level)),
    integrity: state.integrity - 1,
    hasGathered: true,
    nextSuccessBonus: 0,
    nextYieldBonus: 0
  };

  return [
    { ...afterGather, probability: state.probability * (1 - successRate) },
    { ...afterGather, probability: state.probability * successRate * (1 - boonChance), yield: state.yield + baseYield },
    { ...afterGather, probability: state.probability * successRate * boonChance, yield: state.yield + baseYield + boonYield }
  ].filter((next) => next.probability > 0);
}

function restore(state: SimState, request: SimulationRequest): SimState[] {
  const restored = { ...state, gp: state.gp - 300, integrity: state.integrity + 1 };
  if (request.stats.level < 90) return [restored];

  return [
    { ...restored, probability: state.probability * 0.5, wiseReady: false },
    { ...restored, probability: state.probability * 0.5, wiseReady: true }
  ];
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
    minYieldChance: Number(((distribution.get(minYield) ?? 0) * 100).toFixed(6)),
    maxYieldChance: Number(((distribution.get(maxYield) ?? 0) * 100).toFixed(6)),
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

function createInitialState(gp: number, integrity: number): SimState {
  return {
    probability: 1,
    yield: 0,
    gp,
    integrity,
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

function gpPerGather(level: number): number {
  return level >= 70 ? 6 : 5;
}

function clampPercent(value: number, cap: number): number {
  return Math.min(cap, Math.max(0, value));
}
