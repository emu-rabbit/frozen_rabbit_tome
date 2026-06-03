import { ref } from 'vue';
import type {
  CollectableObjective,
  CollectableSolverRequest,
  CollectableSolverResult,
  CollectableWorkerErrorResponse,
  CollectableWorkerErrorType,
  CollectableWorkerResponse
} from '../types/collectable';
import type { GatherableItem, NodeBonuses, PlayerStats } from '../types/game';
import { getCollectableRewardTable } from '../services/collectableRewards';
import { MIN_COLLECTABLE_LEVEL } from '../utils/collectableMechanics';
import { useSettings } from './useSettings';
import { normalizeCollectableObjective } from '../config/inputLimits';
import {
  trackCollectableSolverCompleted,
  trackCollectableSolverFailed
} from '../services/analytics';
import type { FoodSelection } from '../types/game';

const collectableResult = ref<CollectableSolverResult | null>(null);
const isCollectableSolving = ref(false);
const collectableError = ref<'unsupportedLevel' | 'unsupportedReward' | CollectableWorkerErrorType | 'workerStale' | 'workerFailed' | null>(null);
const collectableErrorDetail = ref<CollectableWorkerErrorResponse | null>(null);
const collectableObjective = ref<CollectableObjective>(normalizeCollectableObjective({ kind: 'scrip' }));
let activeCollectableWorker: Worker | null = null;
let collectableSolveVersion = 0;

export function useCollectableSolver() {
  const { solverSettings } = useSettings();

  const cancelCollectableSolve = () => {
    collectableSolveVersion += 1;
    activeCollectableWorker?.terminate();
    activeCollectableWorker = null;
    isCollectableSolving.value = false;
  };

  const clearCollectableResult = () => {
    cancelCollectableSolve();
    collectableResult.value = null;
    collectableError.value = null;
    collectableErrorDetail.value = null;
  };

  const solveCollectable = async (payload: {
    activeItem: GatherableItem;
    baseStats?: PlayerStats;
    stats: PlayerStats;
    baseValues: { Gathering: number; Perception: number };
    itemLevel: number;
    nodeBonuses: NodeBonuses;
    temporaryGp: number;
    selectedFood?: FoodSelection;
    debugMode: boolean;
    objective?: CollectableObjective;
    manualMemoCapacityPower?: number;
  }) => {
    cancelCollectableSolve();
    collectableResult.value = null;
    collectableError.value = null;
    collectableErrorDetail.value = null;
    const analyticsInput = {
      item: payload.activeItem,
      stats: { ...(payload.baseStats ?? payload.stats) },
      maxGp: payload.stats.gp,
      temporaryGp: Math.min(payload.temporaryGp, payload.stats.gp),
      selectedFood: payload.selectedFood ? { ...payload.selectedFood } : undefined,
      nodeBonuses: { ...payload.nodeBonuses },
      hasRelicToolBonus: solverSettings.value.collectableRelicToolBonus
    };

    if (payload.stats.level < MIN_COLLECTABLE_LEVEL) {
      collectableError.value = 'unsupportedLevel';
      collectableErrorDetail.value = null;
      isCollectableSolving.value = false;
      trackCollectableSolverFailed({
        input: analyticsInput,
        error: { errorType: 'unsupportedLevel' }
      });
      return;
    }

    isCollectableSolving.value = true;
    const currentVersion = collectableSolveVersion;

    let rewardTable;
    try {
      rewardTable = await getCollectableRewardTable(payload.activeItem.itemId);
    } catch (error) {
      console.error('Collectable reward table loading failed:', error);
      isCollectableSolving.value = false;
      collectableError.value = 'unsupportedReward';
      collectableErrorDetail.value = null;
      trackCollectableSolverFailed({
        input: analyticsInput,
        error: { errorType: 'unsupportedReward' }
      });
      return;
    }

    if (!rewardTable) {
      isCollectableSolving.value = false;
      collectableError.value = 'unsupportedReward';
      collectableErrorDetail.value = null;
      trackCollectableSolverFailed({
        input: analyticsInput,
        error: { errorType: 'unsupportedReward' }
      });
      return;
    }

    let worker: Worker;
    try {
      worker = new Worker(new URL('../workers/collectableSolver.worker.ts', import.meta.url), { type: 'module' });
    } catch (error) {
      console.error('Collectable worker creation failed:', error);
      isCollectableSolving.value = false;
      const errorType = typeof window === 'undefined' ? 'workerFailed' : 'workerStale';
      collectableError.value = errorType;
      collectableErrorDetail.value = null;
      trackCollectableSolverFailed({
        input: analyticsInput,
        error: { errorType }
      });
      return;
    }

    activeCollectableWorker = worker;
    const request: CollectableSolverRequest = {
      stats: payload.stats,
      baseValues: payload.baseValues,
      itemLevel: payload.itemLevel,
      nodeBonuses: payload.nodeBonuses,
      temporaryGp: payload.temporaryGp,
      jobType: payload.activeItem.jobType || 'miner',
      rewardTable,
      objective: normalizeCollectableObjective(payload.objective ?? collectableObjective.value),
      objectiveMode: solverSettings.value.objectiveMode,
      hasRelicToolBonus: solverSettings.value.collectableRelicToolBonus,
      isTimedNode: payload.activeItem.isTimedNode ?? false,
      debugMode: payload.debugMode,
      manualMemoCapacityPower: payload.manualMemoCapacityPower
    };

    try {
      worker.postMessage(JSON.parse(JSON.stringify(request)) as CollectableSolverRequest);
    } catch (error) {
      console.error('Collectable worker postMessage failed:', error);
      worker.terminate();
      activeCollectableWorker = null;
      isCollectableSolving.value = false;
      collectableError.value = 'workerFailed';
      collectableErrorDetail.value = null;
      trackCollectableSolverFailed({
        input: analyticsInput,
        error: { errorType: 'workerFailed' }
      });
      return;
    }
    worker.onmessage = (event: MessageEvent<CollectableWorkerResponse>) => {
      if (currentVersion !== collectableSolveVersion || activeCollectableWorker !== worker) {
        worker.terminate();
        return;
      }

      if ('errorType' in event.data) {
        collectableResult.value = null;
        collectableError.value = event.data.errorType;
        collectableErrorDetail.value = event.data;
        isCollectableSolving.value = false;
        activeCollectableWorker = null;
        worker.terminate();
        trackCollectableSolverFailed({
          input: analyticsInput,
          error: event.data
        });
        return;
      }

      collectableResult.value = event.data;
      collectableError.value = null;
      collectableErrorDetail.value = null;
      isCollectableSolving.value = false;
      activeCollectableWorker = null;
      worker.terminate();
      trackCollectableSolverCompleted({
        input: analyticsInput,
        result: event.data
      });
    };

    worker.onerror = (error) => {
      if (currentVersion !== collectableSolveVersion || activeCollectableWorker !== worker) {
        worker.terminate();
        return;
      }

      console.error('Collectable worker error:', error);
      isCollectableSolving.value = false;
      activeCollectableWorker = null;
      worker.terminate();
      collectableError.value = 'workerFailed';
      collectableErrorDetail.value = null;
      trackCollectableSolverFailed({
        input: analyticsInput,
        error: { errorType: 'workerFailed' }
      });
    };
  };

  return {
    collectableObjective,
    collectableResult,
    isCollectableSolving,
    collectableError,
    collectableErrorDetail,
    solveCollectable,
    clearCollectableResult,
    cancelCollectableSolve
  };
}
