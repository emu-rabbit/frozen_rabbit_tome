import { calculateSuccessRate, calculateBoonChance, calculateBountifulYield } from './gatheringMath';
import type { SolverRequest, SolverResponse } from '../types/game';

type JobType = SolverRequest['jobType'];

interface SolverResult {
  expectedYield: number;
  rotation: string[];
}

interface SearchState {
  gp: number;
  integrity: number;
  hasGathered: boolean;
  successBonus: number;
  boonBonus: number;
  allYieldBonus: number;
  tidings: boolean;
  nextSuccessBonus: number;
  nextYieldBonus: number;
}

interface ActionOption {
  name: string;
  priority: number;
  apply: (state: SearchState, solve: (state: SearchState) => SolverResult) => SolverResult;
}

const BOON_CAP = 100;
const SUCCESS_CAP = 100;
const EV_EPSILON = 0.0000001;

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

function gpPerGather(level: number): number {
  return level >= 70 ? 6 : 5;
}

function clampPercent(value: number, cap: number): number {
  return Math.min(cap, Math.max(0, value));
}

function buildMemoKey(state: SearchState): string {
  return [
    state.gp,
    state.integrity,
    state.hasGathered ? 1 : 0,
    state.successBonus,
    state.boonBonus,
    state.allYieldBonus,
    state.tidings ? 1 : 0,
    state.nextSuccessBonus,
    state.nextYieldBonus
  ].join('|');
}

export function solveGatheringRotation(request: SolverRequest): SolverResponse {
  const { stats, baseValues, itemLevel, nodeBonuses, temporaryGp, jobType } = request;
  const names = actionNames(jobType);
  const maxIntegrity = nodeBonuses.baseIntegrity + nodeBonuses.gatheringCount;
  const baseSuccessRate = calculateSuccessRate(
    stats.gathering,
    baseValues.Gathering,
    stats.level,
    itemLevel
  );
  const baseBoonChance = calculateBoonChance(stats.perception, baseValues.Perception);
  const bountifulAmount = calculateBountifulYield(stats.gathering, baseValues.Gathering);
  const gatherGp = gpPerGather(stats.level);
  const memo = new Map<string, SolverResult>();

  const canRaiseSuccess = baseSuccessRate > 1 && baseSuccessRate < SUCCESS_CAP;
  const canRaiseBoon = baseBoonChance + nodeBonuses.extraRate > 1;

  function solve(state: SearchState): SolverResult {
    if (state.integrity <= 0) {
      return { expectedYield: 0, rotation: [] };
    }

    const memoKey = buildMemoKey(state);
    const memoized = memo.get(memoKey);
    if (memoized) return memoized;

    let best = gather(state);
    const actions = buildActions(state).sort((a, b) => a.priority - b.priority);

    for (const action of actions) {
      const result = action.apply(state, solve);
      const candidate = {
        expectedYield: result.expectedYield,
        rotation: [action.name, ...result.rotation]
      };

      if (isPreferredResult(candidate, best)) {
        best = candidate;
      }
    }

    memo.set(memoKey, best);
    return best;
  }

  function gather(state: SearchState): SolverResult {
    const successRate = clampPercent(
      baseSuccessRate + state.successBonus + state.nextSuccessBonus,
      SUCCESS_CAP
    ) / 100;
    const boonChance = clampPercent(
      baseBoonChance + nodeBonuses.extraRate + state.boonBonus,
      BOON_CAP
    ) / 100;
    const baseYield = 1 + nodeBonuses.yieldCount + state.allYieldBonus + state.nextYieldBonus;
    const boonYield = 1 + (state.tidings ? 1 : 0);
    const currentYield = successRate * (baseYield + boonChance * boonYield);
    const next = solve({
      ...state,
      gp: Math.min(stats.gp, state.gp + gatherGp),
      integrity: state.integrity - 1,
      hasGathered: true,
      nextSuccessBonus: 0,
      nextYieldBonus: 0
    });

    return {
      expectedYield: currentYield + next.expectedYield,
      rotation: ['採集', ...next.rotation]
    };
  }

  function buildActions(state: SearchState): ActionOption[] {
    const actions: ActionOption[] = [];
    const wholeNodeBuffAllowed = !state.hasGathered;

    if (wholeNodeBuffAllowed && canRaiseSuccess && state.successBonus === 0) {
      addSuccessActions(actions, state);
    }

    if (wholeNodeBuffAllowed && canRaiseBoon && state.boonBonus === 0) {
      addBoonActions(actions, state);
    }

    if (wholeNodeBuffAllowed && state.allYieldBonus === 0) {
      if (stats.level >= 40 && state.gp >= 500) {
        actions.push(setBuffAction(names.kingII, 30, 500, { allYieldBonus: 2 }));
      }

      if (stats.level >= 30 && state.gp >= 400) {
        actions.push(setBuffAction(names.kingI, 31, 400, { allYieldBonus: 1 }));
      }
    }

    if (
      wholeNodeBuffAllowed &&
      !state.tidings &&
      stats.level >= 81 &&
      state.gp >= 200 &&
      baseBoonChance + nodeBonuses.extraRate + state.boonBonus > 0
    ) {
      actions.push(setBuffAction(names.tidings, 22, 200, { tidings: true }));
    }

    if (
      canRaiseSuccess &&
      state.nextSuccessBonus === 0 &&
      stats.level >= 23 &&
      state.gp >= 50 &&
      baseSuccessRate + state.successBonus < SUCCESS_CAP
    ) {
      actions.push(setBuffAction(names.clearVision, 70, 50, { nextSuccessBonus: 15 }));
    }

    if (state.nextYieldBonus === 0 && state.gp >= 100 && baseSuccessRate + state.successBonus > 0) {
      if (stats.level >= 68) {
        actions.push(setBuffAction(names.bountifulII, 80, 100, { nextYieldBonus: bountifulAmount }));
      } else if (stats.level >= 24) {
        actions.push(setBuffAction(names.bountifulI, 80, 100, { nextYieldBonus: 1 }));
      }
    }

    if (stats.level >= 25 && state.gp >= 300) {
      addRestoreAction(actions, state);
    }

    return actions;
  }

  function addSuccessActions(actions: ActionOption[], state: SearchState) {
    if (stats.level >= 10 && state.gp >= 250) {
      actions.push(setBuffAction(names.successIII, 10, 250, { successBonus: 50 }));
    }

    if (stats.level >= 5 && state.gp >= 100) {
      actions.push(setBuffAction(names.successII, 11, 100, { successBonus: 15 }));
    }

    if (stats.level >= 4 && state.gp >= 50) {
      actions.push(setBuffAction(names.successI, 12, 50, { successBonus: 5 }));
    }
  }

  function addBoonActions(actions: ActionOption[], state: SearchState) {
    if (stats.level >= 50 && state.gp >= 100) {
      actions.push(setBuffAction(names.giftII, 20, 100, { boonBonus: 30 }));
    }

    if (stats.level >= 15 && state.gp >= 50) {
      actions.push(setBuffAction(names.giftI, 21, 50, { boonBonus: 10 }));
    }
  }

  function addRestoreAction(actions: ActionOption[], state: SearchState) {
    const missingIntegrity = maxIntegrity - state.integrity;

    if (stats.level >= 90) {
      if (missingIntegrity < 2) return;

      actions.push({
        name: names.restore,
        priority: 90,
        apply: (current, nextSolve) => {
          const afterRestore = {
            ...current,
            gp: current.gp - 300,
            integrity: current.integrity + 1
          };
          const noProc = nextSolve(afterRestore);
          const proc = nextSolve({
            ...afterRestore,
            integrity: afterRestore.integrity + 1
          });
          const preferredBranch = proc.expectedYield >= noProc.expectedYield ? proc : noProc;

          return {
            expectedYield: noProc.expectedYield * 0.5 + proc.expectedYield * 0.5,
            rotation: ['理智同興(若觸發)', ...preferredBranch.rotation]
          };
        }
      });
      return;
    }

    if (missingIntegrity < 1) return;

    actions.push({
      name: names.restore,
      priority: 90,
      apply: (current, nextSolve) => nextSolve({
        ...current,
        gp: current.gp - 300,
        integrity: current.integrity + 1
      })
    });
  }

  function setBuffAction(
    name: string,
    priority: number,
    gpCost: number,
    patch: Partial<SearchState>
  ): ActionOption {
    return {
      name,
      priority,
      apply: (state, nextSolve) => nextSolve({
        ...state,
        ...patch,
        gp: state.gp - gpCost
      })
    };
  }

  function isPreferredResult(candidate: SolverResult, current: SolverResult): boolean {
    if (candidate.expectedYield > current.expectedYield + EV_EPSILON) return true;
    if (candidate.expectedYield < current.expectedYield - EV_EPSILON) return false;

    return rotationPreferenceScore(candidate.rotation) > rotationPreferenceScore(current.rotation);
  }

  function rotationPreferenceScore(rotation: string[]): number {
    let score = 0;
    const firstGatherIndex = rotation.indexOf('採集');
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
    const giftIndex = rotation.findIndex((action) => action === names.giftI || action === names.giftII);
    const tidingsIndex = rotation.indexOf(names.tidings);

    if (giftIndex === -1 || tidingsIndex === -1) return 0;
    if (tidingsIndex === giftIndex + 1) return 500;
    if (giftIndex < tidingsIndex) return 100;

    return -100;
  }

  const initial = solve({
    gp: Math.min(stats.gp, temporaryGp),
    integrity: maxIntegrity,
    hasGathered: false,
    successBonus: 0,
    boonBonus: 0,
    allYieldBonus: 0,
    tidings: false,
    nextSuccessBonus: 0,
    nextYieldBonus: 0
  });

  return {
    bestRotation: initial.rotation,
    expectedYield: Number(initial.expectedYield.toFixed(2)),
    calculationTime: 0
  };
}
