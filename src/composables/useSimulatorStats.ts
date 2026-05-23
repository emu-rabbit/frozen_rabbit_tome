import { ref, computed, watch } from 'vue';
import type { FoodSelection, GatherableItem, GearStatProfile, GatheringJob, PlayerStats, NodeBonuses } from '../types/game';
import { useSettings } from './useSettings';
import { profileToStats, useGearProfiles } from './useGearProfiles';
import { getItemLevelData, getGatheringItemsData, getItemName, isGameDataLoading, getItemBaseIntegrity } from '../services/gameData';
import { shouldHideCrystalGatheringItem } from '../config/crystalGathering';
import { applyFoodBonus, calculateFoodBonus, getGatheringFood } from '../services/foodData';
import { calculateSuccessRate, calculateBoonChance } from '../utils/gatheringMath';
import { useSimulator } from './useSimulator';
import {
  DEFAULT_NODE_BONUSES,
  maxGatheringCountForBaseIntegrity,
  normalizeNodeBonuses,
  normalizePlayerStats
} from '../config/inputLimits';

type SyncFromSettingsOptions = {
  forceStats?: boolean;
  resetTemporaryGp?: boolean;
};

// ── 模擬台獨立狀態：與求解台完全隔離，不共享任何 ref ──
const activeItem = ref<GatherableItem | null>(null);
const simStats = ref<PlayerStats>({
  level: 100,
  gathering: 5345,
  perception: 5137,
  gp: 930
});
const selectedFood = ref<FoodSelection>({
  foodId: null,
  quality: 'hq'
});
const nodeBonuses = ref<NodeBonuses>({
  baseIntegrity: 4,
  gatheringCount: 0,
  yieldCount: 0,
  extraRate: 0
});
const temporaryGp = ref(930);

const itemLevelData = ref<Record<string, any> | null>(null);
const gatheringItemsData = ref<Record<string, any> | null>(null);

// 追蹤「上次同步設定時的屬性值」，以判斷是否需要更新
const lastSyncedSettingsStats: Partial<Record<GatheringJob, PlayerStats>> = {};
const lastSyncedSettingsProfileSignatures: Partial<Record<GatheringJob, string>> = {};

const areStatsEqual = (a: PlayerStats, b: PlayerStats) =>
  a.level === b.level && a.gathering === b.gathering && a.perception === b.perception && a.gp === b.gp;

const areNodeBonusesEqual = (left: NodeBonuses, right: NodeBonuses) => (
  left.baseIntegrity === right.baseIntegrity
  && left.gatheringCount === right.gatheringCount
  && left.yieldCount === right.yieldCount
  && left.extraRate === right.extraRate
);

const cloneStats = (s: PlayerStats): PlayerStats => ({ ...s });
const DEFAULT_SIMULATOR_STATS: PlayerStats = { ...simStats.value };
const normalizeStatsForSimulator = (stats?: Partial<PlayerStats>) => normalizePlayerStats(stats, DEFAULT_SIMULATOR_STATS);
const normalizeNodeBonusesForSimulator = (bonuses?: Partial<NodeBonuses>) => normalizeNodeBonuses(bonuses, DEFAULT_NODE_BONUSES);
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

export function useSimulatorStats() {
  const { solverSettings } = useSettings();
  const { defaultProfileForJob } = useGearProfiles();
  const gatheringCountMax = computed(() => maxGatheringCountForBaseIntegrity(nodeBonuses.value.baseIntegrity));

  // ── 遊戲資料載入 ──
  const fetchItemLevelData = async () => {
    itemLevelData.value = getItemLevelData();
    gatheringItemsData.value = getGatheringItemsData();
  };

  watch(isGameDataLoading, (loading) => {
    if (!loading) {
      fetchItemLevelData();
      if (activeItem.value?.gatheringItemId) {
        nodeBonuses.value = normalizeNodeBonusesForSimulator({
          ...nodeBonuses.value,
          baseIntegrity: getItemBaseIntegrity(activeItem.value.gatheringItemId)
        });
      }
    }
  }, { immediate: true });

  // ── 從全域設定同步屬性（不強制覆蓋使用者已手動調整的值）──
  const syncFromSettings = (options: SyncFromSettingsOptions = {}) => {
    if (!activeItem.value) return;
    const job: GatheringJob = activeItem.value.jobType || 'miner';
    const profile = defaultProfileForJob(job);
    const stats = normalizeStatsForSimulator(profileToStats(profile));
    const profileSignature = createProfileSignature(profile);
    const prev = lastSyncedSettingsStats[job];
    const prevProfileSignature = lastSyncedSettingsProfileSignatures[job];
    const shouldSync = options.forceStats || !prev || !areStatsEqual(prev, stats) || prevProfileSignature !== profileSignature;

    if (shouldSync) {
      lastSyncedSettingsStats[job] = cloneStats(stats);
      lastSyncedSettingsProfileSignatures[job] = profileSignature;
      if (!areStatsEqual(simStats.value, stats)) {
        simStats.value = cloneStats(stats);
      }
      selectedFood.value = { ...profile.food };
      solverSettings.value.collectableRelicToolBonus = profile.collectableRelicToolBonus;
    }

    if (options.resetTemporaryGp) {
      temporaryGp.value = Math.min(profile.currentGp, effectiveStats.value.gp);
    }
  };

  const applyGearProfile = (profile: GearStatProfile) => {
    simStats.value = normalizeStatsForSimulator(profileToStats(profile));
    selectedFood.value = { ...profile.food };
    solverSettings.value.collectableRelicToolBonus = profile.collectableRelicToolBonus;
    temporaryGp.value = Math.min(profile.currentGp, effectiveStats.value.gp);

    for (const job of profile.jobs) {
      lastSyncedSettingsStats[job] = normalizeStatsForSimulator(profileToStats(profile));
      lastSyncedSettingsProfileSignatures[job] = createProfileSignature(profile);
    }
  };

  // ── 選擇物品：相同物品保留現有狀態；不同物品完整重置 ──
  const setSelectedItem = (item: GatherableItem) => {
    if (shouldHideCrystalGatheringItem(item)) return;

    const isSameItem = activeItem.value?.itemId === item.itemId;

    if (isSameItem) {
      // 只更新 activeItem 以防物件參考變動，其餘參數一律保留
      activeItem.value = item;
      return;
    }

    // 不同物品 → 完整重置
    activeItem.value = item;
    nodeBonuses.value = normalizeNodeBonusesForSimulator({
      baseIntegrity: item.gatheringItemId ? getItemBaseIntegrity(item.gatheringItemId) : 4,
      gatheringCount: 0,
      yieldCount: 0,
      extraRate: 0
    });
    selectedFood.value = { foodId: null, quality: 'hq' };

    // 重置模擬手法與分析結果
    const { reset: resetSimulator } = useSimulator();
    resetSimulator();

    // 從全域設定載入屬性
    syncFromSettings({ forceStats: true, resetTemporaryGp: true });
  };

  // ── computed ──
  const displayName = computed(() => activeItem.value ? getItemName(activeItem.value.itemId) : '');
  const selectedFoodItem = computed(() => getGatheringFood(selectedFood.value.foodId));
  const foodBonus = computed(() => calculateFoodBonus(simStats.value, selectedFoodItem.value, selectedFood.value.quality));
  const effectiveStats = computed(() => normalizeStatsForSimulator(applyFoodBonus(simStats.value, foodBonus.value)));

  const baseValues = computed(() => {
    if (!activeItem.value || !itemLevelData.value) return null;
    return itemLevelData.value[activeItem.value.glv.toString()] || null;
  });

  const itemRealLevel = computed(() => {
    if (!activeItem.value || !gatheringItemsData.value) return 0;
    const entry = Object.values(gatheringItemsData.value).find((i: any) => i.itemId === activeItem.value?.itemId);
    return (entry as any)?.level || 0;
  });

  const successRate = computed(() => {
    if (!baseValues.value || !activeItem.value) return 0;
    const baseGathering = baseValues.value.Gathering;
    if (!baseGathering) return 0;
    return calculateSuccessRate(effectiveStats.value.gathering, baseGathering, effectiveStats.value.level, itemRealLevel.value);
  });

  const boonChance = computed(() => {
    if (!baseValues.value || !activeItem.value) return 0;
    const basePerception = baseValues.value.Perception;
    if (!basePerception) return 0;
    return calculateBoonChance(effectiveStats.value.perception, basePerception);
  });

  const isPerceptionMet = computed(() => {
    if (!activeItem.value) return true;
    return effectiveStats.value.perception >= (activeItem.value.perceptionReq || 0);
  });

  // GP 自動修正：當有效最大 GP 下調時，temporaryGp 跟著縮小
  watch(() => effectiveStats.value.gp, (maxGp, prevMaxGp) => {
    const wasFullGp = prevMaxGp === undefined
      ? temporaryGp.value >= simStats.value.gp
      : temporaryGp.value === prevMaxGp;
    if (wasFullGp || temporaryGp.value > maxGp) {
      temporaryGp.value = maxGp;
    }
  }, { immediate: true });

  watch(simStats, (stats) => {
    const normalized = normalizeStatsForSimulator(stats);
    if (!areStatsEqual(stats, normalized)) {
      simStats.value = normalized;
    }
  }, { deep: true, immediate: true });

  watch(nodeBonuses, (bonuses) => {
    const normalized = normalizeNodeBonusesForSimulator(bonuses);
    if (!areNodeBonusesEqual(bonuses, normalized)) {
      nodeBonuses.value = normalized;
    }
  }, { deep: true, immediate: true });

  return {
    activeItem,
    simStats,
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
    syncFromSettings,
    applyGearProfile,
    displayName,
    baseValues,
    itemRealLevel,
    successRate,
    boonChance,
    isPerceptionMet
  };
}
