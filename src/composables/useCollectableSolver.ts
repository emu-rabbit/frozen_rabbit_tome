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
    stats: PlayerStats;
    baseValues: { Gathering: number; Perception: number };
    itemLevel: number;
    nodeBonuses: NodeBonuses;
    temporaryGp: number;
    debugMode: boolean;
    objective?: CollectableObjective;
    manualMemoCapacityPower?: number;
  }) => {
    cancelCollectableSolve();
    collectableResult.value = null;
    collectableError.value = null;
    collectableErrorDetail.value = null;

    if (payload.stats.level < MIN_COLLECTABLE_LEVEL) {
      collectableError.value = 'unsupportedLevel';
      collectableErrorDetail.value = null;
      isCollectableSolving.value = false;
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
      return;
    }

    if (!rewardTable) {
      isCollectableSolving.value = false;
      collectableError.value = 'unsupportedReward';
      collectableErrorDetail.value = null;
      return;
    }

    let worker: Worker;
    try {
      worker = new Worker(new URL('../workers/collectableSolver.worker.ts', import.meta.url), { type: 'module' });
    } catch (error) {
      console.error('Collectable worker creation failed:', error);
      isCollectableSolving.value = false;
      collectableError.value = typeof window === 'undefined' ? 'workerFailed' : 'workerStale';
      collectableErrorDetail.value = null;
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
        return;
      }

      collectableResult.value = event.data;
      collectableError.value = null;
      collectableErrorDetail.value = null;
      isCollectableSolving.value = false;
      activeCollectableWorker = null;
      worker.terminate();
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
