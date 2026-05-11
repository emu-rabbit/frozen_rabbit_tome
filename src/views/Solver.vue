<script setup lang="ts">
defineOptions({ name: 'Solver' });
import { computed, onBeforeUnmount, onMounted, ref, watch, onActivated } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSolver } from '../composables/useSolver';
import { GATHERING_FOODS } from '../services/foodData';
import { getActionName, getItemEnglishName, getItemName } from '../services/gameData';
import { getRotationActionIcon, getRotationActionName } from '../services/actionIcons';
import type { FoodQuality, GatheringFood, SolverObjectiveMode, SolverRotationPlan } from '../types/game';
import InputNumber from 'primevue/inputnumber';
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import MacroPreviewDialog from '../components/MacroPreviewDialog.vue';
import SolverDebugDialog from '../components/SolverDebugDialog.vue';
import { useSettings } from '../composables/useSettings';
import { useTomeLibrary } from '../composables/useTomeLibrary';
import { buildGatheringMacro, buildGatheringMacroGroups, type MacroBuildOptions, type MacroBuildResult } from '../utils/macroGenerator';

const { t, locale } = useI18n();
const {
  activeItem,
  solverStats,
  selectedFood,
  selectedFoodItem,
  foodBonus,
  effectiveStats,
  isDataLoading,
  fetchItemLevelData,
  saveToSettings,
  successRate,
  boonChance,
  isPerceptionMet,
  baseValues,
  syncFromSettings,
  itemRealLevel,
  displayName,
  temporaryGp,
  nodeBonuses,
  solve,
  rotationResult,
  isSolving,
  solverError,
  reloadPage
} = useSolver();

const { userStats, macroSettings, solverSettings, debugSettings } = useSettings();
const { saveTome } = useTomeLibrary();
type FoodOption = {
  food: GatheringFood;
  quality: FoodQuality;
  label: string;
  searchText: string;
};
type StrategyActionKey = 'copyMacro' | 'saveTome' | 'solve';
type YieldMetricKey = 'expected' | 'max' | 'min';
type YieldMetric = {
  key: YieldMetricKey;
  label: string;
  value: number;
  chance?: number;
};

const foodSuggestions = ref<FoodOption[]>([]);
const isSettingsSaved = ref(false);
const isTomeSaved = ref(false);
const isMacroPreviewOpen = ref(false);
const isDebugDialogOpen = ref(false);
const macroPreview = ref<MacroBuildResult | null>(null);
let settingsSavedTimer: ReturnType<typeof window.setTimeout> | null = null;
let tomeSavedTimer: ReturnType<typeof window.setTimeout> | null = null;

const strategyActionLineBreaks: Record<string, Partial<Record<StrategyActionKey, string[]>>> = {
  en: {
    solve: ['Solve It']
  },
  ja: {
    solve: ['計算']
  }
};

const selectedFoodModel = computed<FoodOption | null>({
  get: () => selectedFoodItem.value ? toFoodOption(selectedFoodItem.value, selectedFood.value.quality) : null,
  set: (option) => {
    selectedFood.value.foodId = option?.food.id ?? null;
    if (option) {
      selectedFood.value.quality = option.quality;
    }
  }
});

const displayedRotationPlans = computed(() => rotationResult.value?.rotationPlans?.length
  ? rotationResult.value.rotationPlans
  : rotationResult.value
    ? [{
        kind: 'primary',
        rotation: rotationResult.value.bestRotation,
        expectedYield: rotationResult.value.expectedYield,
        minYield: rotationResult.value.minYield,
        maxYield: rotationResult.value.maxYield,
        minYieldChance: rotationResult.value.minYieldChance,
        maxYieldChance: rotationResult.value.maxYieldChance
      } as SolverRotationPlan]
    : []);

const currentObjectiveMode = computed<SolverObjectiveMode>(() => (
  rotationResult.value?.objectiveMode ?? solverSettings.value.objectiveMode
));

const orderedYieldMetricKeys = computed<YieldMetricKey[]>(() => {
  if (currentObjectiveMode.value === 'max') return ['max', 'expected', 'min'];
  if (currentObjectiveMode.value === 'min') return ['min', 'expected', 'max'];

  return ['expected', 'max', 'min'];
});

const totalSummaryMetric = computed<YieldMetric | null>(() => {
  if (!rotationResult.value) return null;

  return buildYieldMetric(currentObjectiveMode.value, {
    expectedYield: rotationResult.value.expectedYield,
    minYield: rotationResult.value.minYield,
    maxYield: rotationResult.value.maxYield,
    minYieldChance: rotationResult.value.minYieldChance,
    maxYieldChance: rotationResult.value.maxYieldChance
  });
});

const hasUnsavedStats = computed(() => {
  const job = activeItem.value?.jobType;
  if (!job) return false;

  const savedStats = userStats.value[job];
  return savedStats.level !== solverStats.value.level
    || savedStats.gathering !== solverStats.value.gathering
    || savedStats.perception !== solverStats.value.perception
    || savedStats.gp !== solverStats.value.gp;
});

const shouldShowSaveSettingsButton = computed(() => hasUnsavedStats.value || isSettingsSaved.value);

function toFoodOption(food: GatheringFood, quality: FoodQuality): FoodOption {
  const localizedName = foodName(food);
  const englishName = foodEnglishName(food);
  const qualityLabel = t(`solver.food.${quality}`);

  return {
    food,
    quality,
    label: `${localizedName} ${qualityLabel}`,
    searchText: [localizedName, englishName, food.id.toString()].join(' ').toLowerCase()
  };
}

function foodName(food: GatheringFood) {
  return getItemName(food.id);
}

function foodEnglishName(food: GatheringFood) {
  return getItemEnglishName(food.id);
}

function foodSummary(food: GatheringFood, quality = selectedFood.value.quality) {
  return Object.entries(food.bonuses)
    .map(([stat, bonus]) => {
      const value = bonus[quality];
      return `${t(`game.stats.${foodStatKey(stat)}`)} +${value.value}% (${t('solver.food.max')} ${value.max})`;
    })
    .join(' / ');
}

function foodStatKey(stat: string) {
  if (stat === 'Gathering') return 'gathering';
  if (stat === 'Perception') return 'perception';
  return 'gp';
}

function searchFoods(event: { query: string }) {
  const query = event.query.trim().toLowerCase();
  const allOptions = GATHERING_FOODS.flatMap((food) => [
    toFoodOption(food, 'hq'),
    toFoodOption(food, 'nq')
  ]);
  const matchedOptions = query
    ? allOptions.filter((option) => option.searchText.includes(query))
    : allOptions;

  foodSuggestions.value = matchedOptions.slice(0, 40);
}

onMounted(() => {
  fetchItemLevelData();
});

// 當使用者從設定頁切換回來時，觸發同步以獲取最新數值
onActivated(() => {
  syncFromSettings();
});

// 當全域設定變更時，若在求解器頁面，也應觸發同步
watch(userStats, () => {
  syncFromSettings();
}, { deep: true });

function handleSync() {
  if (!hasUnsavedStats.value) return;

  saveToSettings();
  isSettingsSaved.value = true;

  if (settingsSavedTimer) {
    window.clearTimeout(settingsSavedTimer);
  }

  settingsSavedTimer = window.setTimeout(() => {
    isSettingsSaved.value = false;
    settingsSavedTimer = null;
  }, 1900);
}

function handleSaveTome() {
  if (!activeItem.value?.itemId || !rotationResult.value) return;

  saveTome({
    itemId: activeItem.value.itemId,
    stats: { ...solverStats.value },
    temporaryGp: temporaryGp.value,
    food: { ...selectedFood.value },
    nodeBonuses: { ...nodeBonuses.value },
    rotationResult: rotationResult.value
  });

  isTomeSaved.value = true;
  if (tomeSavedTimer) {
    window.clearTimeout(tomeSavedTimer);
  }

  tomeSavedTimer = window.setTimeout(() => {
    isTomeSaved.value = false;
    tomeSavedTimer = null;
  }, 1600);
}

function handlePreviewMacro() {
  if (!rotationResult.value) return;

  const options: MacroBuildOptions = {
    resolveActionName: (_, actionId) => actionId ? getActionName(actionId) : '',
    formatGatherPrompt: formatMacroGatherPrompt
  };
  const plans = displayedRotationPlans.value;
  macroPreview.value = plans.length > 1
    ? buildGatheringMacroGroups(plans.map((plan) => ({
        key: plan.kind,
        title: rotationPlanTitle(plan),
        rotation: plan.rotation
      })), macroSettings.value, options)
    : buildGatheringMacro(rotationResult.value.bestRotation, macroSettings.value, options);
  isMacroPreviewOpen.value = true;
}

function handleOpenDebugDialog() {
  if (!rotationResult.value?.debug) return;

  isDebugDialogOpen.value = true;
}

function rotationPlanTitle(plan: SolverRotationPlan) {
  return plan.kind === 'revisit'
    ? t('solver.strategy.revisitRotation')
    : t('solver.strategy.primaryRotation');
}

function rotationBlockTitle(kind: SolverRotationPlan['kind']) {
  if (kind === 'primary' && rotationResult.value?.revisit.enabled && rotationResult.value.revisit.isFullGp) {
    return t('solver.strategy.rotationTitles.primaryWithRevisit');
  }

  return kind === 'revisit'
    ? t('solver.strategy.rotationTitles.revisit')
    : t('solver.strategy.rotationTitles.primary');
}

function buildYieldMetric(key: YieldMetricKey, source: {
  expectedYield: number;
  minYield: number;
  maxYield: number;
  minYieldChance: number;
  maxYieldChance: number;
}): YieldMetric {
  if (key === 'max') {
    return {
      key,
      label: t('solver.strategy.maxYield'),
      value: source.maxYield,
      chance: source.maxYieldChance
    };
  }

  if (key === 'min') {
    return {
      key,
      label: t('solver.strategy.minYield'),
      value: source.minYield,
      chance: source.minYieldChance
    };
  }

  return {
    key,
    label: t('solver.strategy.expectedYield'),
    value: Number(source.expectedYield.toFixed(2))
  };
}

function planYieldMetrics(plan: SolverRotationPlan) {
  return orderedYieldMetricKeys.value.map((key) => buildYieldMetric(key, {
    expectedYield: plan.expectedYield,
    minYield: plan.minYield,
    maxYield: plan.maxYield,
    minYieldChance: plan.minYieldChance,
    maxYieldChance: plan.maxYieldChance
  }));
}

function formatMetricValue(metric: YieldMetric) {
  return metric.key === 'expected' ? Number(metric.value.toFixed(2)) : metric.value;
}

function formatChance(chance: number, useSpacePadding = false, includePercent = false) {
  const percentSuffix = includePercent ? '%' : '';
  if (chance > 0 && chance < 0.01) {
    return useSpacePadding ? `< 0.01${percentSuffix}` : `<0.01${percentSuffix}`;
  }
  const formatted = chance.toFixed(2);
  if (useSpacePadding) {
    return formatted.padStart(6, ' ') + percentSuffix;
  }
  return formatted + percentSuffix;
}

function formatMacroGatherPrompt(context: {
  count: number;
  hasConditionalGather: boolean;
  isFinalRun: boolean;
  waitSeconds: number | null;
}) {
  if (context.isFinalRun) {
    return t('macro.prompts.finalGather');
  }

  const gatherMessage = context.hasConditionalGather
    ? t('macro.prompts.conditionalGatherCount', { count: context.count })
    : t('macro.prompts.gatherCount', { count: context.count });

  return t('macro.prompts.continueAfterSeconds', {
    message: gatherMessage,
    seconds: context.waitSeconds ?? 0
  });
}

watch(hasUnsavedStats, (hasChanges) => {
  if (!hasChanges) return;

  isSettingsSaved.value = false;
  if (settingsSavedTimer) {
    window.clearTimeout(settingsSavedTimer);
    settingsSavedTimer = null;
  }
});

onBeforeUnmount(() => {
  if (settingsSavedTimer) {
    window.clearTimeout(settingsSavedTimer);
  }
  if (tomeSavedTimer) {
    window.clearTimeout(tomeSavedTimer);
  }
});

function actionIcon(action: string) {
  return getRotationActionIcon(action, activeItem.value?.iconUrl ?? '');
}

function actionName(action: string) {
  return getRotationActionName(
    action,
    t('solver.strategy.gatherAction'),
    t('solver.strategy.conditionalSuffix'),
    t('solver.strategy.conditionalGatherSuffix')
  );
}

function strategyActionLabel(key: StrategyActionKey) {
  return t(`solver.strategy.${key}`);
}

function strategyActionLabelLines(key: StrategyActionKey) {
  if (key !== 'solve') {
    return [strategyActionLabel(key)];
  }

  return strategyActionLineBreaks[locale.value]?.[key] ?? [strategyActionLabel(key)];
}
</script>

<template>
  <div class="solver-page p-6 max-w-4xl mx-auto">
    <!-- === 未選擇物品 (引導畫面) === -->
    <div v-if="!activeItem?.itemId" class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-8 border-2 border-dashed border-slate-200 dark:border-slate-700">
        <i class="pi pi-map text-4xl text-slate-300"></i>
      </div>
      <h2 class="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-3">{{ t('solver.noItemTitle') }}</h2>
      <p class="text-slate-500 dark:text-slate-400 mb-10 max-w-sm mx-auto leading-relaxed">
        {{ t('solver.noItemDesc') }}
      </p>
      <router-link to="/">
        <Button 
          :label="t('solver.goToCreate')" 
          icon="pi pi-search" 
          class="p-button-primary p-button-lg rounded-2xl px-10 shadow-lg shadow-emerald-200 dark:shadow-none" 
        />
      </router-link>
    </div>

    <!-- === 收藏品警告 === -->
    <div v-else-if="activeItem.isCollectable" class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-20 h-20 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-6">
        <i class="pi pi-hammer text-3xl text-purple-500"></i>
      </div>
      <h2 class="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">{{ displayName }}</h2>
      <p class="text-purple-600 dark:text-purple-400 font-semibold">{{ t('solver.collectableWarning') }}</p>
    </div>

    <!-- === 水晶採集系統警告 === -->
    <div v-else-if="activeItem.isCrystalGathering" class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-20 h-20 bg-cyan-50 dark:bg-cyan-900/20 rounded-full flex items-center justify-center mb-6">
        <i class="pi pi-sparkles text-3xl text-cyan-500"></i>
      </div>
      <h2 class="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">{{ displayName }}</h2>
      <p class="text-cyan-600 dark:text-cyan-300 font-semibold">{{ t('solver.crystalGatheringWarning') }}</p>
    </div>

    <!-- === 求解器主畫面 === -->
    <div v-else class="space-y-6">
      <!-- 物品標題卡 -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        <div class="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-4 sm:gap-6 text-center sm:text-left">
          <div class="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
            <img v-if="activeItem.iconUrl" :src="activeItem.iconUrl" class="w-12 h-12 pixelated" />
            <i v-else class="pi pi-box text-2xl text-slate-400"></i>
          </div>
          <div class="flex-1">
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <span class="text-xs font-bold px-2 py-0.5 bg-soft-green-500 text-white rounded-md uppercase tracking-wider">
                {{ t(`game.jobs.${activeItem.jobType}`) }}
              </span>
              <span class="text-xs font-bold px-2 py-0.5 bg-slate-700 text-slate-100 rounded-md">
                {{ t('createGuide.glv') }} {{ activeItem.glv }}
              </span>
              <span v-if="itemRealLevel > 0" class="text-xs font-bold px-2 py-0.5 bg-amber-500 text-white rounded-md">
                Lv {{ itemRealLevel }}
              </span>
            </div>
            <h1 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{{ displayName }}</h1>
          </div>
        </div>

        <!-- 鑑別力不足警告 -->
        <div v-if="!isPerceptionMet" class="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl animate-shake">
          <i class="pi pi-exclamation-circle text-red-500 text-lg"></i>
          <div class="flex flex-col">
            <span class="text-red-600 dark:text-red-400 font-bold text-sm">鑑別力不達標，無法採集</span>
            <span class="text-red-500/80 dark:text-red-400/60 text-[10px]">最低需求: {{ activeItem.perceptionReq }}</span>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <!-- 數值調整區 -->
        <div class="md:col-span-2">
          <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h3 class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <i class="pi pi-user-edit text-soft-green-500"></i>
                {{ t('solver.statsTitle') }}
              </h3>
              <div class="solver-save-settings-slot">
                <Transition name="save-settings">
                  <Button
                    v-if="shouldShowSaveSettingsButton"
                    :icon="isSettingsSaved ? 'pi pi-check' : 'pi pi-save'"
                    :label="isSettingsSaved ? t('solver.syncSuccess') : t('solver.syncToSettings', { job: t(`game.jobs.${activeItem.jobType}`) })"
                    class="p-button-text p-button-sm text-xs solver-save-settings-button"
                    :class="{ 'is-saved': isSettingsSaved }"
                    :disabled="isSettingsSaved"
                    @click="handleSync"
                  />
                </Transition>
              </div>
            </div>
            
            <div class="flex flex-col sm:grid sm:grid-cols-2 gap-x-6 gap-y-4 flex-1">
              <!-- 第一排：等級與食物 -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t('game.stats.level') }}</label>
                <InputNumber v-model="solverStats.level" :min="1" :max="100" class="w-full" fluid />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t('solver.food.label') }}</label>
                <AutoComplete
                  v-model="selectedFoodModel"
                  :suggestions="foodSuggestions"
                  optionLabel="label"
                  :placeholder="t('solver.food.placeholder')"
                  forceSelection
                  dropdown
                  showClear
                  class="w-full"
                  inputClass="w-full"
                  @complete="searchFoods"
                >
                  <template #option="{ option }">
                    <div class="flex items-start gap-3 min-w-0 w-full">
                      <span
                        class="px-2 py-0.5 rounded-md text-[11px] font-black flex-shrink-0"
                        :class="option.quality === 'hq'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                          : 'bg-soft-green-100 text-soft-green-700 dark:bg-soft-green-900/40 dark:text-soft-green-200'"
                      >
                        {{ t(`solver.food.${option.quality}`) }}
                      </span>
                      <div class="flex flex-col min-w-0">
                        <span class="font-semibold text-sm text-slate-700 dark:text-slate-100 truncate">{{ foodName(option.food) }}</span>
                        <span class="text-[11px] text-slate-400 truncate">{{ foodSummary(option.food, option.quality) }}</span>
                      </div>
                    </div>
                  </template>
                </AutoComplete>
              </div>

              <!-- 第二排：獲得力 與 鑑別力 -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between gap-2">
                  <span>{{ t('game.stats.gathering') }}</span>
                  <span v-if="foodBonus.gathering > 0" class="text-soft-green-600 dark:text-soft-green-300">+{{ foodBonus.gathering }} = {{ effectiveStats.gathering }}</span>
                </label>
                <InputNumber v-model="solverStats.gathering" :min="0" class="w-full" fluid />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between gap-2">
                  <span>{{ t('game.stats.perception') }}</span>
                  <span v-if="foodBonus.perception > 0" class="text-soft-green-600 dark:text-soft-green-300">+{{ foodBonus.perception }} = {{ effectiveStats.perception }}</span>
                </label>
                <InputNumber v-model="solverStats.perception" :min="0" class="w-full" fluid />
              </div>

              <!-- 第三排：當前 GP 與 最大 GP -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider flex flex-wrap items-center justify-between gap-1">
                  <span>{{ t('solver.currentGp') }}</span>
                  <span class="text-[10px] text-amber-600">{{ t('solver.effectiveMaxGp') }}: {{ effectiveStats.gp }}</span>
                </label>
                <InputNumber v-model="temporaryGp" :min="0" :max="effectiveStats.gp" class="w-full" fluid />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between gap-2" :title="t('solver.maxGp')">
                  <span class="truncate">{{ t('solver.maxGp') }}</span>
                  <span v-if="foodBonus.gp > 0" class="text-soft-green-600 dark:text-soft-green-300 flex-shrink-0">+{{ foodBonus.gp }} = {{ effectiveStats.gp }}</span>
                </label>
                <InputNumber v-model="solverStats.gp" :min="0" class="w-full" fluid />
              </div>
            </div>
          </div>
        </div>

        <!-- 結果顯示區 -->
        <div class="flex flex-col gap-4">
          <!-- 成功率卡片 -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group flex-1 flex flex-col justify-center">
            <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <i class="pi pi-check-circle text-6xl text-soft-green-500"></i>
            </div>
            <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">{{ t('solver.results.gatheringRate') }}</p>
            <div class="flex items-baseline gap-1 relative z-10">
              <template v-if="isPerceptionMet">
                <span class="text-4xl font-black text-slate-800 dark:text-slate-100">{{ successRate }}</span>
                <span class="text-xl font-bold text-slate-400">%</span>
              </template>
              <span v-else class="text-3xl font-black text-red-500 dark:text-red-400">未知</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full mt-4 overflow-hidden border border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
              <div 
                class="h-full rounded-full" 
                :style="`width: ${isPerceptionMet ? successRate : 0}%; background-color: #52a890;`"
              ></div>
            </div>
          </div>

          <!-- 加成率卡片 -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group flex-1 flex flex-col justify-center">
            <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <i class="pi pi-star text-6xl text-amber-500"></i>
            </div>
            <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">{{ t('solver.results.boonRate') }}</p>
            <div class="flex items-baseline gap-1 relative z-10">
              <template v-if="isPerceptionMet">
                <span class="text-4xl font-black text-slate-800 dark:text-slate-100">{{ boonChance }}</span>
                <span class="text-xl font-bold text-slate-400">%</span>
              </template>
              <span v-else class="text-3xl font-black text-red-500 dark:text-red-400">未知</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full mt-4 overflow-hidden border border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
              <div 
                class="h-full rounded-full" 
                :style="`width: ${isPerceptionMet ? (boonChance / 60 * 100).toFixed(1) : 0}%; background-color: #f59e0b;`"
              ></div>
            </div>
            <p class="text-[9px] text-slate-400 mt-2 font-bold text-right">MAX 60%</p>
          </div>
        </div>
      </div>

      <!-- 採集點獎勵區 -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-6">
          <i class="pi pi-gift text-amber-500"></i>
          {{ t('solver.nodeBonusesTitle') }}
        </h3>
        <div class="flex flex-col lg:flex-row gap-4">
          <!-- 基礎數值顯示 -->
          <div class="lg:w-1/4 flex flex-col">
            <div class="h-full py-3 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col items-center justify-center text-center">
              <span class="font-bold text-slate-400 uppercase tracking-widest mb-1" :class="locale === 'en' ? 'text-[10px]' : 'text-sm'">{{ t('solver.nodeBonuses.baseIntegrity') }}</span>
              <div class="flex items-baseline gap-1">
                <span class="text-4xl font-black text-slate-700 dark:text-slate-200">{{ nodeBonuses.baseIntegrity }}</span>
                <span class="text-sm font-bold text-slate-400">{{ t('game.units.times') }}</span>
              </div>
            </div>
          </div>

          <!-- 加成調整區 -->
          <div class="lg:w-3/4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="flex flex-col py-3 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
              <label class="font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center mb-2" :class="locale === 'en' ? 'text-xs' : 'text-sm'">
                <span class="leading-tight">{{ t('solver.nodeBonuses.gatheringCount') }}</span>
                <span class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] flex-shrink-0 ml-2">{{ t('game.units.times') }}</span>
              </label>
              <InputNumber v-model="nodeBonuses.gatheringCount" :min="0" :max="10" fluid class="p-inputtext-sm mt-auto" />
            </div>

            <div class="flex flex-col py-3 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
              <label class="font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center mb-2" :class="locale === 'en' ? 'text-xs' : 'text-sm'">
                <span class="leading-tight">{{ t('solver.nodeBonuses.yieldCount') }}</span>
                <span class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] flex-shrink-0 ml-2">{{ t('game.units.count') }}</span>
              </label>
              <InputNumber v-model="nodeBonuses.yieldCount" :min="0" :max="50" fluid class="p-inputtext-sm mt-auto" />
            </div>

            <div class="flex flex-col py-3 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
              <label class="font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center mb-2" :class="locale === 'en' ? 'text-xs' : 'text-sm'">
                <span class="leading-tight">{{ t('solver.nodeBonuses.extraRate') }}</span>
                <span class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] flex-shrink-0 ml-2">{{ t('game.units.percent') }}</span>
              </label>
              <InputNumber v-model="nodeBonuses.extraRate" :min="0" :max="100" fluid class="p-inputtext-sm mt-auto" />
            </div>
          </div>
        </div>
      </div>

      <!-- 策略演算區 -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-5 mb-8">
          <div class="flex flex-col gap-1 text-center sm:text-left">
            <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center sm:justify-start gap-2">
              <i class="pi pi-bolt text-amber-500"></i>
              {{ t('solver.strategy.title') }}
              <button
                v-if="debugSettings.solverDebugMode && rotationResult?.debug"
                type="button"
                class="solver-debug-info-button"
                :aria-label="t('solver.debug.open')"
                :title="t('solver.debug.open')"
                @click="handleOpenDebugDialog"
              >
                <i class="pi pi-info-circle"></i>
              </button>
            </h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">{{ t(`solver.strategy.modeDescriptions.${currentObjectiveMode}`) }}</p>
          </div>
          <div class="solver-action-bar solver-action-bar-primary">
            <Button
              class="solver-action-button p-button-primary rounded-xl shadow-md"
              :aria-label="strategyActionLabel('solve')"
              :loading="isSolving"
              :disabled="!isPerceptionMet"
              @click="solve"
            >
              <i class="p-button-icon p-button-icon-left" :class="isSolving ? 'pi pi-spin pi-spinner' : 'pi pi-play'"></i>
              <span class="solver-action-label p-button-label">
                <span v-for="line in strategyActionLabelLines('solve')" :key="line">{{ line }}</span>
              </span>
            </Button>
          </div>
        </div>

        <div
          v-if="solverError"
          class="solver-error-alert"
          role="alert"
        >
          <i class="pi pi-refresh"></i>
          <div>
            <p>{{ t(`solver.strategy.workerErrors.${solverError}.title`) }}</p>
            <span>{{ t(`solver.strategy.workerErrors.${solverError}.desc`) }}</span>
          </div>
          <Button
            class="p-button-sm p-button-warning solver-error-reload-button"
            :label="t('solver.strategy.workerErrors.reload')"
            icon="pi pi-refresh"
            @click="reloadPage"
          />
        </div>

        <!-- 演算結果 -->
        <div v-if="rotationResult" class="space-y-6">
          <div v-if="totalSummaryMetric" class="solver-total-summary">
            <div>
              <span class="text-xs font-bold text-soft-green-700 dark:text-soft-green-300 uppercase tracking-widest">{{ t(`solver.strategy.summary.${currentObjectiveMode}`) }}</span>
              <div class="mt-1 flex items-end gap-1">
                <span class="text-3xl font-black text-soft-green-800 dark:text-soft-green-200">{{ formatMetricValue(totalSummaryMetric) }}</span>
                <span class="pb-1 text-xs font-bold text-soft-green-600 dark:text-soft-green-300">{{ t('game.units.count') }}</span>
              </div>
              <p v-if="totalSummaryMetric.chance !== undefined" class="solver-total-chance">
                {{ t('solver.strategy.yieldChance', { chance: formatChance(totalSummaryMetric.chance) }) }}
              </p>
            </div>
            <p v-if="rotationResult.revisit.enabled" class="solver-total-note">
              {{ rotationResult.revisit.isFullGp
                ? t(`solver.strategy.revisitSameRotationNote.${currentObjectiveMode}`)
                : t(`solver.strategy.revisitTotalNote.${currentObjectiveMode}`) }}
            </p>
          </div>

          <div
            v-for="plan in displayedRotationPlans"
            :key="plan.kind"
            class="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50"
          >
            <div class="flex flex-wrap items-center gap-2 mb-4">
              <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">{{ rotationBlockTitle(plan.kind) }}</p>
            </div>
            <div class="rotation-plan-stats">
              <div
                v-for="metric in planYieldMetrics(plan)"
                :key="`${plan.kind}-${metric.key}`"
                :class="{ 'is-primary-metric': metric.key === currentObjectiveMode }"
              >
                <span>{{ metric.label }}</span>
                <strong>
                  {{ formatMetricValue(metric) }}
                  <small class="rotation-plan-stat-unit">{{ t('game.units.count') }}</small>
                </strong>
                <small v-if="metric.chance !== undefined">
                  {{ t('solver.strategy.yieldChance', { chance: formatChance(metric.chance) }) }}
                </small>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2.5">
              <template v-for="(action, index) in plan.rotation" :key="`${plan.kind}-${index}`">
                <span
                  class="rotation-step"
                  :class="action.startsWith('採集') ? 'rotation-step-gather' : 'rotation-step-action'"
                  :title="actionName(action)"
                >
                  <span class="rotation-icon-wrap">
                    <img v-if="actionIcon(action)" :src="actionIcon(action)" class="rotation-icon" :alt="actionName(action)" />
                    <i v-else class="pi pi-sparkles text-sm"></i>
                  </span>
                  <span class="rotation-label">{{ actionName(action) }}</span>
                </span>
                <i v-if="index < plan.rotation.length - 1" class="pi pi-angle-right text-slate-300"></i>
              </template>
            </div>
          </div>

          <div class="solver-result-action-bar">
            <Button
              class="solver-action-button p-button-outlined rounded-xl"
              :aria-label="strategyActionLabel('copyMacro')"
              @click="handlePreviewMacro"
            >
              <i class="p-button-icon p-button-icon-left pi pi-file-edit"></i>
              <span class="solver-action-label p-button-label">{{ strategyActionLabel('copyMacro') }}</span>
            </Button>
            <Button
              class="solver-action-button p-button-outlined rounded-xl"
              :class="{ 'is-tome-saved': isTomeSaved }"
              :aria-label="strategyActionLabel('saveTome')"
              :disabled="isTomeSaved"
              @click="handleSaveTome"
            >
              <i class="p-button-icon p-button-icon-left" :class="isTomeSaved ? 'pi pi-check' : 'pi pi-bookmark'"></i>
              <span class="solver-action-label p-button-label">{{ isTomeSaved ? t('solver.strategy.savedTome') : strategyActionLabel('saveTome') }}</span>
            </Button>
          </div>
        </div>

        <!-- 初始狀態或計算中 -->
        <div v-else-if="isSolving" class="py-12 flex flex-col items-center justify-center gap-4 text-slate-400">
          <i class="pi pi-spin pi-spinner text-4xl"></i>
          <p class="font-medium animate-pulse">正在為您尋找最優解...</p>
        </div>
        
        <div v-else class="py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-3 text-slate-400">
          <i class="pi pi-calculator text-3xl opacity-20"></i>
          <p class="text-sm">{{ t('solver.strategy.empty') }}</p>
        </div>
      </div>
    </div>

    <MacroPreviewDialog v-model="isMacroPreviewOpen" :macro="macroPreview" />
    <SolverDebugDialog v-model="isDebugDialogOpen" :debug="rotationResult?.debug" />
  </div>
</template>

<style scoped>
.pixelated {
  image-rendering: pixelated;
}
:deep(.p-autocomplete) {
  width: 100%;
}
.solver-action-bar {
  display: grid;
  width: 100%;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}
.solver-action-bar-primary {
  width: 100%;
}
.solver-result-action-bar {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}
.solver-total-summary {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid rgb(187 247 208 / 0.86);
  border-radius: 0.875rem;
  background: rgb(240 253 244 / 0.9);
}
.solver-total-note {
  margin: 0;
  color: #3f8f79;
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1.5;
}
.solver-total-chance {
  margin: 0.25rem 0 0;
  color: #3f8f79;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1.35;
}
.solver-error-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid rgb(253 186 116 / 0.8);
  border-radius: 0.875rem;
  background: rgb(255 247 237 / 0.95);
  color: #9a3412;
}
.solver-error-alert > div {
  flex: 1;
  min-width: 0;
}
.solver-error-alert i {
  margin-top: 0.15rem;
  color: #f97316;
}
.solver-error-alert p {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 900;
  line-height: 1.3;
}
.solver-error-alert span {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.45;
}
:deep(.solver-error-reload-button) {
  flex-shrink: 0;
  align-self: center;
  border-radius: 0.75rem;
  font-weight: 800;
}
.rotation-plan-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.rotation-plan-stats div {
  min-width: 0;
  border-radius: 0.75rem;
  background: white;
  padding: 0.65rem 0.75rem;
  border: 1px solid rgb(226 232 240);
}
.rotation-plan-stats div.is-primary-metric {
  border-color: rgb(82 168 144 / 0.55);
  background: rgb(240 253 244 / 0.86);
}
.rotation-plan-stats span,
.rotation-plan-stats strong,
.rotation-plan-stats small {
  display: block;
}
.rotation-plan-stats span {
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 800;
  line-height: 1.2;
}
.rotation-plan-stats strong {
  margin-top: 0.15rem;
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 900;
  line-height: 1.1;
}
.rotation-plan-stats .rotation-plan-stat-unit {
  display: inline;
  margin: 0 0 0 0.15rem;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 900;
  line-height: 1;
}
.rotation-plan-stats small {
  margin-top: 0.2rem;
  color: #64748b;
  font-size: 0.66rem;
  font-weight: 800;
  line-height: 1.25;
}
:global(html.dark .solver-total-summary) {
  border-color: rgb(21 128 61 / 0.5);
  background: rgb(20 83 45 / 0.2);
}
:global(html.dark .solver-total-note) {
  color: #86efac;
}
:global(html.dark .solver-total-chance) {
  color: #86efac;
}
:global(html.dark .solver-error-alert) {
  border-color: rgb(194 65 12 / 0.55);
  background: rgb(154 52 18 / 0.16);
  color: #fed7aa;
}
:global(html.dark .solver-error-alert i) {
  color: #fdba74;
}
:global(html.dark .rotation-plan-stats div) {
  border-color: rgb(51 65 85);
  background: rgb(15 23 42 / 0.9);
}
:global(html.dark .rotation-plan-stats div.is-primary-metric) {
  border-color: rgb(74 222 128 / 0.42);
  background: rgb(20 83 45 / 0.22);
}
:global(html.dark .rotation-plan-stats span) {
  color: #94a3b8;
}
:global(html.dark .rotation-plan-stats strong) {
  color: #f8fafc;
}
:global(html.dark .rotation-plan-stats .rotation-plan-stat-unit) {
  color: #cbd5e1;
}
:global(html.dark .rotation-plan-stats small) {
  color: #cbd5e1;
}
@media (min-width: 640px) {
  .solver-result-action-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .solver-total-summary {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .solver-total-note {
    max-width: 28rem;
    text-align: right;
  }
}
@media (max-width: 480px) {
  .rotation-plan-stats {
    grid-template-columns: 1fr;
  }
  .solver-error-alert {
    flex-direction: column;
  }
  :deep(.solver-error-reload-button) {
    width: 100%;
  }
}
@media (min-width: 1024px) {
  .solver-action-bar-primary {
    width: min(100%, 10rem);
  }
}
:deep(.solver-action-button) {
  width: 100%;
  min-height: 42px;
  justify-content: center;
}
:deep(.solver-action-button.is-tome-saved) {
  color: #15803d;
  border-color: rgb(134 239 172);
  background: rgb(220 252 231 / 0.75);
  box-shadow: 0 0 0 1px rgb(34 197 94 / 0.12);
}
:global(.dark .solver-action-button.is-tome-saved) {
  color: #bbf7d0;
  border-color: rgb(21 128 61 / 0.55);
  background: rgb(20 83 45 / 0.22);
  box-shadow: 0 0 0 1px rgb(74 222 128 / 0.08);
}
.solver-action-label {
  flex: 0 1 auto;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.15;
  white-space: nowrap;
  min-width: 0;
}
.solver-debug-info-button {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(187 247 208);
  border-radius: 0.75rem;
  background: rgb(240 253 244);
  color: #15803d;
  font-size: 0.9rem;
  transition: all 0.18s ease;
}
.solver-debug-info-button:hover {
  transform: translateY(-1px);
  border-color: #52a890;
  background: rgb(220 252 231);
}
:global(html.dark .solver-debug-info-button) {
  border-color: rgb(21 128 61 / 0.55);
  background: rgb(20 83 45 / 0.22);
  color: #bbf7d0;
}
.rotation-step {
  min-height: 44px;
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.75rem;
  padding: 0.375rem 0.75rem 0.375rem 0.375rem;
  font-size: 0.875rem;
  font-weight: 800;
  line-height: 1.1;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.06);
}
.rotation-step-action {
  background: #52a890;
  color: white;
}
.rotation-step-gather {
  background: white;
  color: rgb(71 85 105);
  border: 1px solid rgb(226 232 240);
}
:global(.dark .rotation-step-gather) {
  background: rgb(15 23 42);
  color: rgb(203 213 225);
  border-color: rgb(51 65 85);
}
.rotation-icon-wrap {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 0.5rem;
  overflow: hidden;
  background: rgb(255 255 255 / 0.22);
}
.rotation-step-gather .rotation-icon-wrap {
  background: rgb(241 245 249);
}
:global(.dark .rotation-step-gather .rotation-icon-wrap) {
  background: rgb(30 41 59);
}
.rotation-icon {
  width: 32px;
  height: 32px;
  object-fit: cover;
  image-rendering: pixelated;
}
.rotation-label {
  min-width: 0;
  overflow-wrap: anywhere;
}
:deep(.solver-save-settings-button) {
  min-height: 2rem;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    opacity 0.2s ease;
}
.solver-save-settings-slot {
  min-height: 2rem;
  display: flex;
  justify-content: flex-end;
}
:deep(.solver-save-settings-button.is-saved) {
  color: #15803d;
  background: rgb(220 252 231 / 0.75);
  animation: saveSettingsSuccess 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}
:global(.dark .solver-save-settings-button.is-saved) {
  color: #bbf7d0;
  background: rgb(20 83 45 / 0.22);
}
:deep(.solver-save-settings-button.is-saved .p-button-icon) {
  animation: saveSettingsCheck 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}
.save-settings-enter-active,
.save-settings-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.save-settings-enter-from,
.save-settings-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem) scale(0.98);
}
.animate-shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}
@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
  40%, 60% { transform: translate3d(3px, 0, 0); }
}
@keyframes saveSettingsSuccess {
  0% { transform: scale(0.98); }
  45% { transform: scale(1.04); }
  100% { transform: scale(1); }
}
@keyframes saveSettingsCheck {
  0% { transform: scale(0.4) rotate(-16deg); opacity: 0; }
  55% { transform: scale(1.18) rotate(0deg); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
