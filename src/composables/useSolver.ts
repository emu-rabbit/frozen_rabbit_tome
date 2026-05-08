import { ref, computed, watch } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import type { GatherableItem, PlayerStats, NodeBonuses } from '../types/game';
import { useSettings } from './useSettings';
import { getItemLevelData, getGatheringItemsData, getItemName, isGameDataLoading, getItemBaseIntegrity } from '../services/gameData';
import { calculateSuccessRate, calculateBoonChance } from '../utils/gatheringMath';
import type { SolverRequest, SolverResponse } from '../types/game';

const activeItem = useLocalStorage<GatherableItem | null>('frozen-rabbit-tome-active-item', null);
const solverStats = useLocalStorage<PlayerStats>('frozen-rabbit-tome-solver-stats', {
  level: 100,
  gathering: 5345,
  perception: 5137,
  gp: 930
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
let activeWorker: Worker | null = null;
let solveVersion = 0;

export function useSolver() {
  const { userStats } = useSettings();

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
        nodeBonuses.value.baseIntegrity = getItemBaseIntegrity(activeItem.value.gatheringItemId);
      }
    }
  }, { immediate: true });

  const cancelActiveSolve = () => {
    solveVersion += 1;
    activeWorker?.terminate();
    activeWorker = null;
    isSolving.value = false;
  };

  const setSelectedItem = (item: GatherableItem) => {
    const isDifferentItem = activeItem.value?.itemId !== item.itemId;

    if (isDifferentItem) {
      cancelActiveSolve();
      rotationResult.value = null;
    }

    activeItem.value = item;
    // 重設節點獎勵
    nodeBonuses.value = {
      baseIntegrity: item.gatheringItemId ? getItemBaseIntegrity(item.gatheringItemId) : 4,
      gatheringCount: 0,
      yieldCount: 0,
      extraRate: 0
    };
    syncFromSettings();
  };

  const syncFromSettings = () => {
    if (!activeItem.value) return;
    const job = activeItem.value.jobType || 'miner';
    const stats = userStats.value[job];
    solverStats.value = { ...stats };
    // 同步時將臨時 GP 設為最大 GP
    temporaryGp.value = stats.gp;
  };

  const saveToSettings = () => {
    if (!activeItem.value) return;
    const job = activeItem.value.jobType || 'miner';
    // 將 solverStats (包含修改後的 max GP) 寫回全域設定
    userStats.value[job] = { ...solverStats.value };
  };

  /** 動態物品名稱（連動語言切換） */
  const displayName = computed(() => {
    if (!activeItem.value) return '';
    return getItemName(activeItem.value.itemId);
  });

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

    const score = Math.floor((100 * solverStats.value.gathering) / baseGathering);
    
    return calculateSuccessRate(
      solverStats.value.gathering,
      baseGathering,
      solverStats.value.level,
      itemRealLevel.value
    );
  });

  // 2. 獲得力加成率計算
  const boonChance = computed(() => {
    if (!baseValues.value || !activeItem.value) return 0;
    const basePerception = baseValues.value.Perception;
    if (!basePerception) return 0;

    return calculateBoonChance(solverStats.value.perception, basePerception);
  });

  // 3. 鑑別力門檻檢查
  const isPerceptionMet = computed(() => {
    if (!activeItem.value) return true;
    const req = activeItem.value.perceptionReq || 0;
    return solverStats.value.perception >= req;
  });

  return {
    activeItem,
    solverStats,
    nodeBonuses,
    temporaryGp,
    isDataLoading: isGameDataLoading,
    fetchItemLevelData,
    setSelectedItem,
    syncFromSettings,
    saveToSettings,
    successRate,
    boonChance,
    isPerceptionMet,
    baseValues,
    itemRealLevel,
    displayName,
    // 求解功能
    solve: async () => {
      if (!activeItem.value || !baseValues.value) return;
      cancelActiveSolve();
      isSolving.value = true;
      const currentSolveVersion = solveVersion;
      
      const worker = new Worker(new URL('../workers/solver.worker.ts', import.meta.url), { type: 'module' });
      activeWorker = worker;
      
      const request: SolverRequest = {
        stats: { ...solverStats.value },
        baseValues: {
          Gathering: baseValues.value.Gathering,
          Perception: baseValues.value.Perception
        },
        itemLevel: itemRealLevel.value,
        nodeBonuses: { ...nodeBonuses.value },
        temporaryGp: temporaryGp.value,
        jobType: activeItem.value.jobType || 'miner'
      };

      worker.postMessage(request);
      
      worker.onmessage = (e: MessageEvent<SolverResponse>) => {
        if (currentSolveVersion !== solveVersion || activeWorker !== worker) {
          worker.terminate();
          return;
        }

        rotationResult.value = e.data;
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
      };
    },
    rotationResult,
    isSolving
  };
}
