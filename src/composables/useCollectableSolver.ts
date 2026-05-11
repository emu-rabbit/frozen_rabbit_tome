import { ref, computed, watch } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { isGameDataLoading, getItemBaseIntegrity, getItemLevelData, getGatheringItemsData } from '../services/gameData';
import { getCollectableRewardInfo } from '../services/collectableRewards';
import { applyFoodBonus, calculateFoodBonus, getGatheringFood } from '../services/foodData';
import { useSettings } from './useSettings';
import type {
  CollectableNodeType,
  CollectableRewardThreshold,
  CollectableSolverRequest,
  CollectableSolverResult,
  StoredCollectableTome
} from '../types/collectable';
import type { GatherableItem, FoodSelection, PlayerStats } from '../types/game';

// ─── 共用模組級別狀態（與 useSolver 共用） ──────────────────────────────────

const activeItem = useLocalStorage<GatherableItem | null>('frozen-rabbit-tome-active-item', null);
const solverStats = useLocalStorage<PlayerStats>('frozen-rabbit-tome-solver-stats', {
  level: 100,
  gathering: 5345,
  perception: 5137,
  gp: 930
});
const selectedFood = useLocalStorage<FoodSelection>('frozen-rabbit-tome-selected-food', {
  foodId: null,
  quality: 'hq'
});

// ─── 收藏品求解台專屬狀態 ────────────────────────────────────────────────────

const integrityBonus = useLocalStorage<number>('frozen-rabbit-tome-collectable-integrity-bonus', 0);
const nodeType = useLocalStorage<CollectableNodeType>('frozen-rabbit-tome-collectable-node-type', 'normal');

const rewardThresholds = ref<CollectableRewardThreshold | null>(null);
const rewardLoadError = ref<string | null>(null);
const isLoadingRewards = ref(false);

const solverResult = ref<CollectableSolverResult | null>(null);
const isSolving = ref(false);
const solveError = ref<string | null>(null);
const isDebugDialogOpen = ref(false);

const itemLevelData = ref<Record<string, unknown> | null>(null);
const gatheringItemsData = ref<Record<string, unknown> | null>(null);

let activeWorker: Worker | null = null;
let solveVersion = 0;

// ─── 資料初始化 ───────────────────────────────────────────────────────────────

function syncGameData() {
  const levels = getItemLevelData();
  const items = getGatheringItemsData();
  if (Object.keys(levels).length > 0) itemLevelData.value = levels;
  if (Object.keys(items).length > 0) gatheringItemsData.value = items;
}

async function fetchRewards(itemId: number) {
  isLoadingRewards.value = true;
  rewardLoadError.value = null;
  try {
    const result = await getCollectableRewardInfo(itemId);
    rewardThresholds.value = result;
    if (!result) {
      rewardLoadError.value = 'notFound';
    }
  } catch {
    rewardThresholds.value = null;
    rewardLoadError.value = 'fetchFailed';
  } finally {
    isLoadingRewards.value = false;
  }
}

// ─── 公開 composable ─────────────────────────────────────────────────────────

export function useCollectableSolver() {
  const { debugSettings } = useSettings();

  watch(isGameDataLoading, (loading) => {
    if (!loading) syncGameData();
  }, { immediate: true });

  watch(activeItem, (item) => {
    if (item?.isCollectable && item.itemId) {
      fetchRewards(item.itemId);
      if (item.gatheringItemId) {
        const base = getItemBaseIntegrity(item.gatheringItemId);
        // 重設獎勵為 0（新物品）
        integrityBonus.value = 0;
      }
      solverResult.value = null;
      solveError.value = null;
    }
  }, { immediate: true });

  // ─── 基礎計算 ──────────────────────────────────────────────────────────────

  const selectedFoodItem = computed(() => getGatheringFood(selectedFood.value.foodId));

  const foodBonus = computed(() => calculateFoodBonus(
    solverStats.value,
    selectedFoodItem.value,
    selectedFood.value.quality
  ));

  const effectiveStats = computed(() => applyFoodBonus(solverStats.value, foodBonus.value));

  const baseValues = computed(() => {
    if (!activeItem.value || !itemLevelData.value) return null;
    return (itemLevelData.value[activeItem.value.glv.toString()] as { Gathering: number; Perception: number } | undefined) ?? null;
  });

  const itemRealLevel = computed(() => {
    if (!activeItem.value || !gatheringItemsData.value) return 0;
    const entry = Object.values(gatheringItemsData.value).find(
      (i: unknown) => (i as { itemId: number }).itemId === activeItem.value?.itemId
    );
    return (entry as { level?: number })?.level ?? 0;
  });

  const baseIntegrity = computed(() => {
    if (!activeItem.value?.gatheringItemId) return 4;
    return getItemBaseIntegrity(activeItem.value.gatheringItemId);
  });

  const totalIntegrity = computed(() => baseIntegrity.value + integrityBonus.value);

  // ─── 求解 ──────────────────────────────────────────────────────────────────

  function cancelActiveSolve() {
    solveVersion++;
    activeWorker?.terminate();
    activeWorker = null;
    isSolving.value = false;
  }

  async function solve() {
    if (!activeItem.value || !baseValues.value || !rewardThresholds.value) return;

    cancelActiveSolve();
    solveError.value = null;
    isSolving.value = true;
    const currentSolveVersion = solveVersion;

    let worker: Worker;
    try {
      worker = new Worker(
        new URL('../workers/collectableSolver.worker.ts', import.meta.url),
        { type: 'module' }
      );
    } catch (err) {
      console.error('Collectable worker creation failed:', err);
      isSolving.value = false;
      solveError.value = 'workerFailed';
      return;
    }

    activeWorker = worker;

    const request: CollectableSolverRequest = {
      stats: {
        level: effectiveStats.value.level,
        gathering: effectiveStats.value.gathering,
        perception: effectiveStats.value.perception,
        gp: effectiveStats.value.gp
      },
      baseValues: {
        Gathering: baseValues.value.Gathering,
        Perception: baseValues.value.Perception
      },
      itemLevel: itemRealLevel.value,
      integrity: totalIntegrity.value,
      rewardThresholds: rewardThresholds.value,
      nodeType: nodeType.value,
      debugMode: debugSettings.value.solverDebugMode
    };

    worker.postMessage(request);

    worker.onmessage = (e: MessageEvent<CollectableSolverResult>) => {
      if (currentSolveVersion !== solveVersion || activeWorker !== worker) {
        worker.terminate();
        return;
      }
      solverResult.value = e.data;
      solveError.value = null;
      isSolving.value = false;
      activeWorker = null;
      worker.terminate();
    };

    worker.onerror = (err) => {
      if (currentSolveVersion !== solveVersion || activeWorker !== worker) {
        worker.terminate();
        return;
      }
      console.error('Collectable worker error:', err);
      isSolving.value = false;
      activeWorker = null;
      worker.terminate();
      solveError.value = 'workerFailed';
    };
  }

  function reset() {
    cancelActiveSolve();
    solverResult.value = null;
    solveError.value = null;
    integrityBonus.value = 0;
    nodeType.value = 'normal';
  }

  // ─── 藏書庫 ────────────────────────────────────────────────────────────────

  function buildStoredTome(): StoredCollectableTome | null {
    if (!activeItem.value || !solverResult.value) return null;
    return {
      tomeType: 'collectable',
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      itemId: activeItem.value.itemId,
      stats: { ...solverStats.value },
      temporaryGp: effectiveStats.value.gp,
      food: { ...selectedFood.value },
      integrity: totalIntegrity.value,
      policy: solverResult.value.policy,
      expectedScrip: solverResult.value.expectedScrip,
      expectedCollectability: solverResult.value.expectedCollectability,
      createdAt: new Date().toISOString()
    };
  }

  function loadFromTome(tome: StoredCollectableTome) {
    solverStats.value = { ...tome.stats };
    selectedFood.value = { ...tome.food };
    const base = activeItem.value?.gatheringItemId
      ? getItemBaseIntegrity(activeItem.value.gatheringItemId)
      : 4;
    integrityBonus.value = Math.max(0, tome.integrity - base);
    solverResult.value = {
      expectedScrip: tome.expectedScrip,
      expectedCollectability: tome.expectedCollectability,
      rewardTierProbabilities: { high: 0, mid: 0, low: 0, none: 0 },
      policy: tome.policy
    };
    solveError.value = null;
  }

  return {
    // 共用狀態
    activeItem,
    solverStats,
    selectedFood,
    selectedFoodItem,
    foodBonus,
    effectiveStats,
    // 收藏品專屬
    integrityBonus,
    nodeType,
    baseIntegrity,
    totalIntegrity,
    baseValues,
    rewardThresholds,
    rewardLoadError,
    isLoadingRewards,
    // 求解
    solve,
    reset,
    isSolving,
    solveError,
    solverResult,
    isDebugDialogOpen,
    // 藏書庫
    buildStoredTome,
    loadFromTome
  };
}
