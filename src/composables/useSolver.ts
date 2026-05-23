import { ref, computed, watch } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import type { FoodSelection, GatherableItem, GearStatProfile, GatheringJob, PlayerStats, NodeBonuses, StoredTome } from '../types/game';
import { useSettings } from './useSettings';
import { profileToStats, useGearProfiles } from './useGearProfiles';
import { getItemLevelData, getGatheringItemsData, getItemName, isGameDataLoading, getItemBaseIntegrity, getGatherableItemById } from '../services/gameData';
import { shouldHideCrystalGatheringItem } from '../config/crystalGathering';
import { applyFoodBonus, calculateFoodBonus, getGatheringFood } from '../services/foodData';
import { calculateSuccessRate, calculateBoonChance } from '../utils/gatheringMath';
import type { SolverRequest, SolverResponse } from '../types/game';
import {
  DEFAULT_NODE_BONUSES,
  clampIntegerInput,
  maxGatheringCountForBaseIntegrity,
  normalizeNodeBonuses,
  normalizePlayerStats
} from '../config/inputLimits';

type TomeEditingOptions = {
  syncObjectiveMode?: boolean;
};
type SyncFromSettingsOptions = {
  forceStats?: boolean;
  resetTemporaryGp?: boolean;
};

const activeItem = useLocalStorage<GatherableItem | null>('frozen-rabbit-tome-active-item', null);
if (shouldHideCrystalGatheringItem(activeItem.value)) {
  activeItem.value = null;
}
const DEFAULT_SOLVER_STATS: PlayerStats = {
  level: 100,
  gathering: 5345,
  perception: 5137,
  gp: 930
};
const solverStats = useLocalStorage<PlayerStats>('frozen-rabbit-tome-solver-stats', DEFAULT_SOLVER_STATS);

const selectedFood = useLocalStorage<FoodSelection>('frozen-rabbit-tome-selected-food', {
  foodId: null,
  quality: 'hq'
});

const nodeBonuses = useLocalStorage<NodeBonuses>('frozen-rabbit-tome-node-bonuses', {
  baseIntegrity: 4,
  gatheringCount: 0,
  yieldCount: 0,
  extraRate: 0
});

// 當前 GP 是暫時性的，不進入 localStorage
const temporaryGp = ref(930);

const itemLevelData = ref<Record<string, any> | null>(null);
const gatheringItemsData = ref<Record<string, any> | null>(null);

// 求解器結果
const rotationResult = ref<SolverResponse | null>(null);
const isSolving = ref(false);
const solverError = ref<'workerStale' | 'workerFailed' | null>(null);
let activeWorker: Worker | null = null;
let solveVersion = 0;
let latestSolveInputSignature = '';
const lastSyncedSettingsStats: Partial<Record<GatheringJob, PlayerStats>> = {};
const lastSyncedSettingsProfileSignatures: Partial<Record<GatheringJob, string>> = {};
const { solverSettings: globalSolverSettings } = useSettings();

const createSolveInputSignature = () => {
  return JSON.stringify({
    itemId: activeItem.value?.itemId ?? null,
    jobType: activeItem.value?.jobType ?? null,
    jobTypes: activeItem.value?.jobTypes ?? [],
    isTimedNode: activeItem.value?.isTimedNode ?? false,
    stats: solverStats.value,
    selectedFood: selectedFood.value,
    nodeBonuses: nodeBonuses.value,
    temporaryGp: temporaryGp.value,
    objectiveMode: globalSolverSettings.value.objectiveMode
  });
};

const areStatsEqual = (left: PlayerStats, right: PlayerStats) => (
  left.level === right.level
  && left.gathering === right.gathering
  && left.perception === right.perception
  && left.gp === right.gp
);

const areNodeBonusesEqual = (left: NodeBonuses, right: NodeBonuses) => (
  left.baseIntegrity === right.baseIntegrity
  && left.gatheringCount === right.gatheringCount
  && left.yieldCount === right.yieldCount
  && left.extraRate === right.extraRate
);

const cloneStats = (stats: PlayerStats): PlayerStats => ({ ...stats });
const normalizeStatsForSolver = (stats?: Partial<PlayerStats>) => normalizePlayerStats(stats, DEFAULT_SOLVER_STATS);
const normalizeNodeBonusesForSolver = (bonuses?: Partial<NodeBonuses>) => normalizeNodeBonuses(bonuses, DEFAULT_NODE_BONUSES);
const createProfileSignature = (profile: GearStatProfile) => JSON.stringify({
  jobs: profile.jobs,
  level: profile.level,
  gathering: profile.gathering,
  perception: profile.perception,
  currentGp: profile.currentGp,
  maxGp: profile.maxGp,
  food: profile.food,
  collectableRelicToolBonus: profile.collectableRelicToolBonus
});

export function useSolver() {
  const { debugSettings, solverSettings } = useSettings();
  const { defaultProfileForJob } = useGearProfiles();
  const gatheringCountMax = computed(() => maxGatheringCountForBaseIntegrity(nodeBonuses.value.baseIntegrity));

  const fetchItemLevelData = async () => {
    const levels = getItemLevelData();
    const items = getGatheringItemsData();
    
    if (Object.keys(levels).length > 0 && Object.keys(items).length > 0) {
      itemLevelData.value = levels;
      gatheringItemsData.value = items;
      return;
    }

    itemLevelData.value = levels;
    gatheringItemsData.value = items;
  };

  // 當靜態資料載入完成時，重新拉取一次
  watch(isGameDataLoading, (loading) => {
    if (!loading) {
      fetchItemLevelData();
      // 資料載入後，若已有選擇物品，則更新一次基礎次數
      if (activeItem.value?.gatheringItemId) {
        nodeBonuses.value = normalizeNodeBonusesForSolver({
          ...nodeBonuses.value,
          baseIntegrity: getItemBaseIntegrity(activeItem.value.gatheringItemId)
        });
      }
    }
  }, { immediate: true });

  const cancelActiveSolve = () => {
    solveVersion += 1;
    activeWorker?.terminate();
    activeWorker = null;
    isSolving.value = false;
  };

  const invalidateSolveResult = () => {
    if (isSolving.value) {
      cancelActiveSolve();
    }

    rotationResult.value = null;
  };

  const requestWorkerReload = () => {
    solverError.value = typeof window === 'undefined' ? 'workerFailed' : 'workerStale';
  };

  const reloadPage = () => {
    if (typeof window === 'undefined') return;

    window.location.reload();
  };

  const setSelectedItem = (item: GatherableItem) => {
    if (shouldHideCrystalGatheringItem(item)) return;

    const isDifferentItem = activeItem.value?.itemId !== item.itemId;

    if (isDifferentItem) {
      cancelActiveSolve();
      rotationResult.value = null;
    }

    activeItem.value = item;
    // 重設節點獎勵
    nodeBonuses.value = normalizeNodeBonusesForSolver({
      baseIntegrity: item.gatheringItemId ? getItemBaseIntegrity(item.gatheringItemId) : 4,
      gatheringCount: 0,
      yieldCount: 0,
      extraRate: 0
    });
    syncFromSettings({ forceStats: true, resetTemporaryGp: true });
  };

  // 求解台是一份可編輯草稿；只在設定真的變動或明確初始化時覆蓋，避免切頁回來洗掉手填 GP。
  const syncFromSettings = (options: SyncFromSettingsOptions = {}) => {
    if (!activeItem.value) return;

    const job: GatheringJob = activeItem.value.jobType || 'miner';
    const profile = defaultProfileForJob(job);
    const stats = normalizeStatsForSolver(profileToStats(profile));
    const profileSignature = createProfileSignature(profile);
    const previousSyncedStats = lastSyncedSettingsStats[job];
    const previousProfileSignature = lastSyncedSettingsProfileSignatures[job];
    const shouldSyncStats = options.forceStats
      || !previousSyncedStats
      || !areStatsEqual(previousSyncedStats, stats)
      || previousProfileSignature !== profileSignature;

    if (shouldSyncStats) {
      lastSyncedSettingsStats[job] = cloneStats(stats);
      lastSyncedSettingsProfileSignatures[job] = profileSignature;
      if (!areStatsEqual(solverStats.value, stats)) {
        solverStats.value = cloneStats(stats);
      }
      selectedFood.value = { ...profile.food };
      solverSettings.value.collectableRelicToolBonus = profile.collectableRelicToolBonus;
    }

    if (options.resetTemporaryGp) {
      temporaryGp.value = Math.min(profile.currentGp, effectiveStats.value.gp);
    }
  };

  const applyGearProfile = (profile: GearStatProfile) => {
    solverStats.value = normalizeStatsForSolver(profileToStats(profile));
    selectedFood.value = { ...profile.food };
    solverSettings.value.collectableRelicToolBonus = profile.collectableRelicToolBonus;
    temporaryGp.value = Math.min(profile.currentGp, effectiveStats.value.gp);

    for (const job of profile.jobs) {
      lastSyncedSettingsStats[job] = normalizeStatsForSolver(profileToStats(profile));
      lastSyncedSettingsProfileSignatures[job] = createProfileSignature(profile);
    }
  };

  const loadTomeForEditing = (tome: StoredTome, options: TomeEditingOptions = {}) => {
    const item = getGatherableItemById(tome.itemId);
    if (!item) return false;

    const tomeObjectiveMode = tome.objectiveMode ?? 'expected';
    const shouldSyncObjectiveMode = options.syncObjectiveMode ?? true;

    cancelActiveSolve();
    activeItem.value = tome.kind === 'collectable' ? { ...item, isCollectable: true } : item;
    solverStats.value = normalizeStatsForSolver(tome.stats);
    selectedFood.value = { ...tome.food };
    nodeBonuses.value = normalizeNodeBonusesForSolver({
      baseIntegrity: item.gatheringItemId ? getItemBaseIntegrity(item.gatheringItemId) : 4,
      gatheringCount: tome.nodeBonuses.gatheringCount,
      yieldCount: tome.nodeBonuses.yieldCount,
      extraRate: tome.nodeBonuses.extraRate
    });
    temporaryGp.value = clampIntegerInput(tome.temporaryGp, 0, effectiveStats.value.gp, effectiveStats.value.gp);
    if (shouldSyncObjectiveMode) {
      solverSettings.value.objectiveMode = tomeObjectiveMode;
    }
    rotationResult.value = null;
    latestSolveInputSignature = createSolveInputSignature();
    const job: GatheringJob = item.jobType || 'miner';
    const defaultProfile = defaultProfileForJob(job);
    lastSyncedSettingsStats[job] = profileToStats(defaultProfile);
    lastSyncedSettingsProfileSignatures[job] = createProfileSignature(defaultProfile);

    return true;
  };

  /** 動態物品名稱（連動語言切換） */
  const displayName = computed(() => {
    if (!activeItem.value) return '';
    return getItemName(activeItem.value.itemId);
  });

  const selectedFoodItem = computed(() => getGatheringFood(selectedFood.value.foodId));

  const foodBonus = computed(() => calculateFoodBonus(
    solverStats.value,
    selectedFoodItem.value,
    selectedFood.value.quality
  ));

  const effectiveStats = computed(() => normalizeStatsForSolver(applyFoodBonus(solverStats.value, foodBonus.value)));

  // 基礎值查詢
  const baseValues = computed(() => {
    if (!activeItem.value || !itemLevelData.value) return null;
    return itemLevelData.value[activeItem.value.glv.toString()] || null;
  });

  // 物品等級查詢
  const itemRealLevel = computed(() => {
    if (!activeItem.value || !gatheringItemsData.value) return 0;
    const items = gatheringItemsData.value;
    const entry = Object.values(items).find((i: any) => i.itemId === activeItem.value?.itemId);
    return (entry as any)?.level || 0;
  });

  // 1. 成功率計算
  const successRate = computed(() => {
    if (!baseValues.value || !activeItem.value) return 0;
    const baseGathering = baseValues.value.Gathering;
    if (!baseGathering) return 0;

    return calculateSuccessRate(
      effectiveStats.value.gathering,
      baseGathering,
      effectiveStats.value.level,
      itemRealLevel.value
    );
  });

  // 2. 獲得力加成率計算
  const boonChance = computed(() => {
    if (!baseValues.value || !activeItem.value) return 0;
    const basePerception = baseValues.value.Perception;
    if (!basePerception) return 0;

    return calculateBoonChance(effectiveStats.value.perception, basePerception);
  });

  // 3. 鑑別力門檻檢查
  const isPerceptionMet = computed(() => {
    if (!activeItem.value) return true;
    const req = activeItem.value.perceptionReq || 0;
    return effectiveStats.value.perception >= req;
  });

  watch(() => effectiveStats.value.gp, (maxGp, previousMaxGp) => {
    const wasPlanningWithFullGp = previousMaxGp === undefined
      ? temporaryGp.value >= solverStats.value.gp
      : temporaryGp.value === previousMaxGp;

    if (wasPlanningWithFullGp || temporaryGp.value > maxGp) {
      temporaryGp.value = maxGp;
    }
  }, { immediate: true });

  watch(solverStats, (stats) => {
    const normalized = normalizeStatsForSolver(stats);
    if (!areStatsEqual(stats, normalized)) {
      solverStats.value = normalized;
    }
  }, { deep: true, immediate: true });

  watch(nodeBonuses, (bonuses) => {
    const normalized = normalizeNodeBonusesForSolver(bonuses);
    if (!areNodeBonusesEqual(bonuses, normalized)) {
      nodeBonuses.value = normalized;
    }
  }, { deep: true, immediate: true });

  latestSolveInputSignature = createSolveInputSignature();

  watch([activeItem, solverStats, nodeBonuses, temporaryGp, selectedFood, solverSettings], () => {
    const currentSignature = createSolveInputSignature();
    if (currentSignature === latestSolveInputSignature) return;

    latestSolveInputSignature = currentSignature;
    invalidateSolveResult();
  }, { deep: true });

  return {
    activeItem,
    solverStats,
    selectedFood,
    selectedFoodItem,
    foodBonus,
    effectiveStats,
    nodeBonuses,
    gatheringCountMax,
    temporaryGp,
    isDataLoading: isGameDataLoading,
    fetchItemLevelData,
    setSelectedItem,
    loadTomeForEditing,
    syncFromSettings,
    applyGearProfile,
    successRate,
    boonChance,
    isPerceptionMet,
    baseValues,
    itemRealLevel,
    displayName,
    // 求解功能
    solve: async () => {
      if (!activeItem.value || !baseValues.value || !isPerceptionMet.value) return;
      cancelActiveSolve();
      solverError.value = null;
      isSolving.value = true;
      const currentSolveVersion = solveVersion;
      
      let worker: Worker;
      try {
        worker = new Worker(new URL('../workers/solver.worker.ts', import.meta.url), { type: 'module' });
      } catch (err) {
        console.error('Worker creation failed:', err);
        isSolving.value = false;
        requestWorkerReload();
        return;
      }

      activeWorker = worker;
      
      const request: SolverRequest = {
        stats: { ...effectiveStats.value },
        baseValues: {
          Gathering: baseValues.value.Gathering,
          Perception: baseValues.value.Perception
        },
        itemLevel: itemRealLevel.value,
        nodeBonuses: { ...nodeBonuses.value },
        temporaryGp: Math.min(temporaryGp.value, effectiveStats.value.gp),
        jobType: activeItem.value.jobType || 'miner',
        isTimedNode: activeItem.value.isTimedNode ?? false,
        objectiveMode: solverSettings.value.objectiveMode,
        debugMode: debugSettings.value.solverDebugMode
      };

      try {
        worker.postMessage(request);
      } catch (err) {
        console.error('Worker postMessage failed:', err);
        worker.terminate();
        activeWorker = null;
        isSolving.value = false;
        solverError.value = 'workerFailed';
        return;
      }
      
      worker.onmessage = (e: MessageEvent<SolverResponse>) => {
        if (currentSolveVersion !== solveVersion || activeWorker !== worker) {
          worker.terminate();
          return;
        }

        rotationResult.value = e.data;
        solverError.value = null;
        isSolving.value = false;
        activeWorker = null;
        worker.terminate();
      };

      worker.onerror = (err) => {
        if (currentSolveVersion !== solveVersion || activeWorker !== worker) {
          worker.terminate();
          return;
        }

        console.error('Worker error:', err);
        isSolving.value = false;
        activeWorker = null;
        worker.terminate();
        requestWorkerReload();
      };
    },
    rotationResult,
    isSolving,
    solverError,
    reloadPage
  };
}
