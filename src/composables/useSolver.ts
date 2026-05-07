import { ref, computed, watch } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import type { GatherableItem, PlayerStats } from '../types/game';
import { useSettings } from './useSettings';
import { getItemLevelData, getGatheringItemsData, getItemName, isGameDataLoading } from '../services/gameData';

const activeItem = useLocalStorage<GatherableItem | null>('frozen-rabbit-tome-active-item', null);
const solverStats = useLocalStorage<PlayerStats>('frozen-rabbit-tome-solver-stats', {
  level: 100,
  gathering: 5345,
  perception: 5137,
  gp: 930
});

// 當前 GP 是暫時性的，不進入 localStorage
const temporaryGp = ref(930);

// 靜態資料快取
const itemLevelData = ref<Record<string, any> | null>(null);
const gatheringItemsData = ref<Record<string, any> | null>(null);

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
    }
  }, { immediate: true });

  const setSelectedItem = (item: GatherableItem) => {
    activeItem.value = item;
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
    let rate = 0;

    if (score >= 80) rate = 100;
    else if (score >= 76) rate = 94 + (score - 75) * 1;
    else if (score >= 64) rate = 72 + (score - 64) * 2;
    else if (score >= 46) rate = 60 + Math.floor(((score - 45) * 5) / 9);
    else if (score === 45) rate = 60;
    else if (score === 44) rate = 58;
    else if (score >= 41) rate = 52 + (score - 40) * 2;
    else if (score >= 21) rate = Math.floor(20 + (score - 20) * 1.6);
    else if (score >= 11) rate = 2 + (score - 11) * 2;
    else if (score >= 1) rate = 1;
    else rate = 0;

    // 等級修正
    const itemLv = itemRealLevel.value;
    const playerLv = solverStats.value.level;
    
    if (itemLv > 0 && rate > 0 && rate < 100) {
      const diff = playerLv - itemLv;
      if (diff > 0) {
        rate += Math.min(5, diff);
      } else if (diff < 0) {
        rate += Math.max(-25, diff * 5);
      }
    }
    
    return Math.min(100, Math.max(0, rate));
  });

  // 2. 獲得力加成率計算
  const boonChance = computed(() => {
    if (!baseValues.value || !activeItem.value) return 0;
    const basePerception = baseValues.value.Perception;
    if (!basePerception) return 0;

    const boonScore = Math.min(150, Math.floor((100 * solverStats.value.perception) / basePerception));
    let rate = 0;

    if (boonScore >= 100) rate = ((boonScore - 100) / 50) * 25 + 35;
    else if (boonScore >= 80) rate = ((boonScore - 80) / 20) * 20 + 15;
    else if (boonScore >= 70) rate = ((boonScore - 70) / 10) * 5 + 10;
    else if (boonScore >= 60) rate = ((boonScore - 60) / 10) * 10;
    else rate = 0;

    return Math.min(60, Math.max(0, Math.floor(rate)));
  });

  return {
    activeItem,
    solverStats,
    temporaryGp,
    isDataLoading: isGameDataLoading,
    fetchItemLevelData,
    setSelectedItem,
    syncFromSettings,
    saveToSettings,
    successRate,
    boonChance,
    baseValues,
    itemRealLevel,
    displayName
  };
}
