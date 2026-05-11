<script setup lang="ts">
defineOptions({ name: 'Simulator' });

import { computed, onActivated, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import AutoComplete from 'primevue/autocomplete';
import { useSolver } from '../composables/useSolver';
import { useSettings } from '../composables/useSettings';
import { useExperimentLibrary } from '../composables/useExperimentLibrary';
import { useSimulator } from '../composables/useSimulator';
import { GATHERING_FOODS } from '../services/foodData';
import { getGatherableItemById, getItemEnglishName, getItemName, getItemBaseIntegrity } from '../services/gameData';
import { getRotationActionIcon, getRotationActionName } from '../services/actionIcons';
import { simulateGatheringRotation, getSimulatorActions, previewRotationState, canUseSimulatorAction, validateSimulatorRotation } from '../utils/rotationSimulator';
import type { SimulationRequest } from '../utils/rotationSimulator';
import type { FoodQuality, GatheringFood, SimulationResponse } from '../types/game';

type FoodOption = {
  food: GatheringFood;
  quality: FoodQuality;
  label: string;
  searchText: string;
};

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const {
  activeItem,
  solverStats,
  selectedFood,
  selectedFoodItem,
  effectiveStats,
  nodeBonuses,
  temporaryGp,
  baseValues,
  itemRealLevel,
  displayName,
  successRate,
  boonChance,
  isPerceptionMet,
  fetchItemLevelData,
  syncFromSettings,
  setSelectedItem
} = useSolver();
const { userStats } = useSettings();
const { saveExperiment, getExperiment, fromStoredRotationStep } = useExperimentLibrary();
const { primaryRotation, revisitRotation, simulatorAnalysis: analysis, reset: resetSimulator } = useSimulator();

const activeBlock = ref<'primary' | 'revisit'>('primary');
const savedExperimentId = ref<string | null>(null);
const isSaved = ref(false);
const foodSuggestions = ref<FoodOption[]>([]);
let saveTimer: ReturnType<typeof window.setTimeout> | null = null;
const actionCategoryOrder = ['gather', 'success', 'boon', 'nextSuccess', 'nextYield', 'restore', 'wholeYield', 'boonYield'] as const;

const actionOptions = computed(() => activeItem.value?.jobType ? getSimulatorActions(activeItem.value.jobType) : []);
const actionGroups = computed(() => actionCategoryOrder
  .map((category) => ({
    category,
    label: t(`simulator.actionCategories.${category}`),
    actions: actionOptions.value.filter((action) => action.category === category)
  }))
  .filter((group) => group.actions.length > 0));
const canSimulate = computed(() => !!activeItem.value && !!baseValues.value && isPerceptionMet.value && primaryRotation.value.length > 0);
const selectedFoodModel = computed<FoodOption | null>({
  get: () => selectedFoodItem.value ? toFoodOption(selectedFoodItem.value, selectedFood.value.quality) : null,
  set: (option) => {
    selectedFood.value.foodId = option?.food.id ?? null;
    if (option) selectedFood.value.quality = option.quality;
  }
});

const primaryPreviewStates = computed(() => {
  const request = buildRequest();
  return request ? previewRotationState(request, primaryRotation.value) : [];
});

const revisitPreviewStates = computed(() => {
  const request = buildRequest(effectiveStats.value.gp);
  return request ? previewRotationState(request, revisitRotation.value) : [];
});

const activePreviewStates = computed(() => activeBlock.value === 'primary' ? primaryPreviewStates.value : revisitPreviewStates.value);
const canCreateRevisitBlock = computed(() => {
  if (!activeItem.value || effectiveStats.value.level < 91) return false;
  return primaryPreviewStates.value.some((state) => state.integrity <= 0);
});

const activeStatus = computed(() => summarizePreview(activePreviewStates.value));
const activeIntegrityMax = computed(() => Math.max(1, nodeBonuses.value.baseIntegrity + nodeBonuses.value.gatheringCount));
const activeGpMax = computed(() => Math.max(1, effectiveStats.value.gp));
const activeIntegrityPercent = computed(() => progressPercent(activeStatus.value.integrity, activeIntegrityMax.value));
const activeGpPercent = computed(() => progressPercent(activeStatus.value.gp, activeGpMax.value));
const activeRotation = computed(() => activeBlock.value === 'primary' ? primaryRotation.value : revisitRotation.value);
const activeRotationTitle = computed(() => activeBlock.value === 'primary'
  ? t('simulator.primaryGathering')
  : t('simulator.revisitGathering'));
const activeRotationEmptyText = computed(() => activeBlock.value === 'primary'
  ? t('simulator.emptyPrimaryRotation')
  : t('simulator.emptyRevisitRotation'));
const primaryValidation = computed(() => {
  const request = buildRequest();
  return request ? validateSimulatorRotation(request, primaryRotation.value) : { invalidIndexes: [], isValid: true };
});
const revisitValidation = computed(() => {
  const request = buildRequest(effectiveStats.value.gp);
  return request ? validateSimulatorRotation(request, revisitRotation.value) : { invalidIndexes: [], isValid: true };
});
const hasRotationIssue = computed(() => !primaryValidation.value.isValid || !revisitValidation.value.isValid);
const canRunSimulation = computed(() => canSimulate.value && !hasRotationIssue.value);
const activeInvalidIndexes = computed(() => activeBlock.value === 'primary'
  ? primaryValidation.value.invalidIndexes
  : revisitValidation.value.invalidIndexes);

onMounted(() => {
  fetchItemLevelData();
  syncFromSettings();
  loadExperimentFromRoute();
});

onActivated(() => {
  syncFromSettings();
  
  const isFromDatabase = !!route.query.experiment;
  const isNewExperiment = route.query.new === '1';

  if (isFromDatabase) {
    loadExperimentFromRoute();
  } else if (isNewExperiment) {
    // 強制重置模擬台內容
    resetSimulator();
    savedExperimentId.value = null;
    isSaved.value = false;
    
    // 清除 URL 中的 new 參數，避免重新整理時又重置
    router.replace({ path: '/simulator', query: {} });
  }
});

watch(userStats, () => syncFromSettings(), { deep: true });
watch([primaryRotation, revisitRotation, solverStats, nodeBonuses, temporaryGp, selectedFood], () => {
  analysis.value = null;
  isSaved.value = false;
}, { deep: true });

function buildRequest(startingGp = temporaryGp.value): Omit<SimulationRequest, 'primaryRotation' | 'revisitRotation'> | null {
  if (!activeItem.value || !baseValues.value) return null;

  return {
    stats: { ...effectiveStats.value },
    baseValues: {
      Gathering: baseValues.value.Gathering,
      Perception: baseValues.value.Perception
    },
    itemLevel: itemRealLevel.value,
    nodeBonuses: { ...nodeBonuses.value },
    temporaryGp: Math.min(startingGp, effectiveStats.value.gp),
    jobType: activeItem.value.jobType || 'miner',
    isTimedNode: activeItem.value.isTimedNode ?? false
  };
}

function runSimulation() {
  const request = buildRequest();
  if (!request || !canRunSimulation.value) return;

  analysis.value = simulateGatheringRotation({
    ...request,
    primaryRotation: primaryRotation.value,
    revisitRotation: revisitRotation.value
  });
}

function addAction(actionName: string) {
  const target = activeBlock.value === 'primary' ? primaryRotation : revisitRotation;
  target.value = [...target.value, actionName];
}

function removeAction(block: 'primary' | 'revisit', index: number) {
  const target = block === 'primary' ? primaryRotation : revisitRotation;
  target.value = target.value.slice(0, index);
}

function clearRotation(block: 'primary' | 'revisit') {
  if (block === 'primary') primaryRotation.value = [];
  else revisitRotation.value = [];
}

function copyPrimaryToRevisit() {
  revisitRotation.value = [...primaryRotation.value];
  activeBlock.value = 'revisit';
}

function enableRevisitBlock() {
  if (!canCreateRevisitBlock.value) return;
  activeBlock.value = 'revisit';
  if (revisitRotation.value.length === 0) revisitRotation.value = [];
}

function selectRotationTab(block: 'primary' | 'revisit') {
  if (block === 'revisit' && !canCreateRevisitBlock.value && revisitRotation.value.length === 0) return;
  activeBlock.value = block;
}

function clearActiveRotation() {
  clearRotation(activeBlock.value);
}

function isActionDisabled(actionName: string) {
  const request = buildRequest(activeBlock.value === 'revisit' ? effectiveStats.value.gp : temporaryGp.value);
  const action = actionOptions.value.find((option) => option.name === actionName);
  if (!request || !action) return true;
  return !canUseSimulatorAction(action, activePreviewStates.value, request);
}

function actionIcon(actionName: string) {
  return getRotationActionIcon(actionName, activeItem.value?.iconUrl ?? '');
}

function actionLabel(actionName: string) {
  return getRotationActionName(
    actionName,
    t('solver.strategy.gatherAction'),
    t('solver.strategy.conditionalSuffix'),
    t('solver.strategy.conditionalGatherSuffix')
  );
}

function formatFood(food: GatheringFood, quality: FoodQuality) {
  return `${getItemName(food.id)} ${t(`solver.food.${quality}`)}`;
}

function toFoodOption(food: GatheringFood, quality: FoodQuality): FoodOption {
  const localizedName = getItemName(food.id);
  const englishName = getItemEnglishName(food.id);
  return {
    food,
    quality,
    label: formatFood(food, quality),
    searchText: [localizedName, englishName, food.id.toString(), quality].join(' ').toLowerCase()
  };
}

function searchFoods(event: { query: string }) {
  const query = event.query.trim().toLowerCase();
  const allOptions = GATHERING_FOODS.flatMap((food) => [toFoodOption(food, 'hq'), toFoodOption(food, 'nq')]);
  foodSuggestions.value = (query ? allOptions.filter((option) => option.searchText.includes(query)) : allOptions).slice(0, 40);
}

function saveCurrentExperiment() {
  if (!activeItem.value || !analysis.value) return;
  const saved = saveExperiment({
    existingId: savedExperimentId.value,
    itemId: activeItem.value.itemId,
    stats: { ...solverStats.value },
    temporaryGp: temporaryGp.value,
    food: { ...selectedFood.value },
    nodeBonuses: { ...nodeBonuses.value },
    primaryRotation: primaryRotation.value,
    revisitRotation: revisitRotation.value,
    analysis: analysis.value
  });
  savedExperimentId.value = saved.id;
  isSaved.value = true;
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    isSaved.value = false;
    saveTimer = null;
  }, 1600);
}

function loadExperimentFromRoute() {
  const id = typeof route.query.experiment === 'string' ? route.query.experiment : '';
  if (!id || savedExperimentId.value === id) return;

  const experiment = getExperiment(id);
  const item = experiment ? getGatherableItemById(experiment.itemId) : null;
  if (!experiment || !item) return;

  // 1. 設置物品
  setSelectedItem(item);
  
  // 2. 設置數值 (需要確保 setSelectedItem 觸發的 syncFromSettings 不會蓋掉這些)
  solverStats.value = { ...experiment.stats };
  selectedFood.value = { ...experiment.food };
  nodeBonuses.value = {
    baseIntegrity: experiment.nodeBonuses.baseIntegrity ?? (item.gatheringItemId ? getItemBaseIntegrity(item.gatheringItemId) : 4),
    gatheringCount: experiment.nodeBonuses.gatheringCount,
    yieldCount: experiment.nodeBonuses.yieldCount,
    extraRate: experiment.nodeBonuses.extraRate
  };
  temporaryGp.value = experiment.temporaryGp;
  
  // 3. 設置手法
  primaryRotation.value = experiment.primaryRotation.map(fromStoredRotationStep).filter(Boolean);
  revisitRotation.value = experiment.revisitRotation.map(fromStoredRotationStep).filter(Boolean);
  
  // 4. 設置分析結果
  if (experiment.analysis && experiment.analysis.total) {
    analysis.value = experiment.analysis;
  } else {
    analysis.value = null;
  }
  savedExperimentId.value = id;
}

function goCreateExperiment() {
  router.push('/experiment');
}

function formatChance(chance: number) {
  if (chance > 0 && chance < 0.01) return '<0.01';
  return Number(chance.toFixed(2)).toString();
}

function summarizePreview(states: Array<{ gp: number; integrity: number }>) {
  if (states.length === 0) return { gp: [0, 0], integrity: [0, 0] };
  const gps = states.map((state) => state.gp);
  const integrities = states.map((state) => state.integrity);
  return {
    gp: [Math.min(...gps), Math.max(...gps)],
    integrity: [Math.min(...integrities), Math.max(...integrities)]
  };
}

function rangeLabel(range: number[]) {
  return range[0] === range[1] ? `${range[0]}` : `${range[0]}-${range[1]}`;
}

function progressPercent(range: number[], maxValue: number) {
  const highValue = Math.max(0, range[1] ?? 0);
  return `${Math.min(100, Math.max(0, (highValue / maxValue) * 100))}%`;
}

function analysisChance(chance: number) {
  return Number(chance.toFixed(2));
}
</script>

<template>
  <div class="simulator-page">
    <div v-if="!activeItem?.itemId" class="empty-state">
      <div class="empty-icon"><i class="pi pi-flask"></i></div>
      <h2>{{ t('simulator.noItemTitle') }}</h2>
      <p>{{ t('simulator.noItemDesc') }}</p>
      <Button :label="t('simulator.goToCreate')" icon="pi pi-search" class="rounded-xl" @click="goCreateExperiment" />
    </div>

    <div v-else-if="activeItem.isCollectable || activeItem.isCrystalGathering" class="empty-state">
      <div class="empty-icon"><i class="pi pi-hammer"></i></div>
      <h2>{{ displayName }}</h2>
      <p>{{ activeItem.isCollectable ? t('simulator.collectablePending') : t('simulator.crystalPending') }}</p>
    </div>

    <div v-else class="space-y-6">
      <section class="panel item-panel">
        <div class="item-heading">
          <div class="item-icon-wrap">
            <img v-if="activeItem.iconUrl" :src="activeItem.iconUrl" class="item-icon" alt="" />
            <i v-else class="pi pi-box text-slate-400"></i>
          </div>
          <div class="min-w-0">
            <div class="item-badges">
              <span>{{ t(`game.jobs.${activeItem.jobType}`) }}</span>
              <span>GLV {{ activeItem.glv }}</span>
              <span>Lv {{ itemRealLevel || '-' }}</span>
            </div>
            <h1>{{ displayName }}</h1>
          </div>
        </div>
        <div class="rate-grid">
          <div><span>{{ t('simulator.rates.success') }}</span><strong>{{ successRate }}%</strong></div>
          <div><span>{{ t('simulator.rates.boon') }}</span><strong>{{ boonChance }}%</strong></div>
          <div><span>{{ t('simulator.rates.currentGp') }}</span><strong>{{ temporaryGp }}/{{ effectiveStats.gp }}</strong></div>
        </div>
      </section>

      <section class="panel">
        <div class="section-title">
          <i class="pi pi-sliders-h text-soft-green-500"></i>
          <h2>{{ t('simulator.statsTitle') }}</h2>
        </div>
        <div class="input-grid">
          <label><span>{{ t('game.stats.level') }}</span><InputNumber v-model="solverStats.level" :min="1" :max="100" fluid /></label>
          <label><span>{{ t('game.stats.gathering') }}</span><InputNumber v-model="solverStats.gathering" :min="0" fluid /></label>
          <label><span>{{ t('game.stats.perception') }}</span><InputNumber v-model="solverStats.perception" :min="0" fluid /></label>
          <label><span>{{ t('solver.maxGp') }}</span><InputNumber v-model="solverStats.gp" :min="0" fluid /></label>
          <label><span>{{ t('solver.currentGp') }}</span><InputNumber v-model="temporaryGp" :min="0" :max="effectiveStats.gp" fluid /></label>
          <label>
            <span>{{ t('solver.food.label') }}</span>
            <AutoComplete
              v-model="selectedFoodModel"
              :suggestions="foodSuggestions"
              optionLabel="label"
              forceSelection
              dropdown
              showClear
              fluid
              @complete="searchFoods"
            />
          </label>
          <label><span>{{ t('solver.nodeBonuses.baseIntegrity') }}</span><InputNumber v-model="nodeBonuses.baseIntegrity" :min="1" :max="10" fluid /></label>
          <label><span>{{ t('solver.nodeBonuses.gatheringCount') }}</span><InputNumber v-model="nodeBonuses.gatheringCount" :min="0" :max="10" fluid /></label>
          <label><span>{{ t('solver.nodeBonuses.yieldCount') }}</span><InputNumber v-model="nodeBonuses.yieldCount" :min="0" :max="50" fluid /></label>
          <label><span>{{ t('solver.nodeBonuses.extraRate') }}</span><InputNumber v-model="nodeBonuses.extraRate" :min="0" :max="100" fluid /></label>
        </div>
        <p v-if="!isPerceptionMet" class="warning">{{ t('simulator.perceptionWarning') }}</p>
      </section>

      <section class="panel simulation-panel">
        <div class="simulation-header">
          <div class="section-title">
            <i class="pi pi-bolt text-amber-500"></i>
            <h2>{{ t('simulator.rotationSimulation') }}</h2>
          </div>
          <div class="status-bars">
            <div class="status-bar-card">
              <div class="status-bar-meta">
                <span>{{ t('simulator.integrity') }}</span>
                <strong>{{ rangeLabel(activeStatus.integrity) }} / {{ activeIntegrityMax }}</strong>
              </div>
              <div class="status-track">
                <div class="status-fill integrity" :style="{ width: activeIntegrityPercent }"></div>
              </div>
            </div>
            <div class="status-bar-card">
              <div class="status-bar-meta">
                <span>GP</span>
                <strong>{{ rangeLabel(activeStatus.gp) }} / {{ activeGpMax }}</strong>
              </div>
              <div class="status-track">
                <div class="status-fill gp" :style="{ width: activeGpPercent }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="rotation-tabs-wrap">
          <div class="rotation-tabs" role="tablist" :aria-label="t('simulator.tabsLabel')">
            <button
              id="primary-rotation-tab"
              type="button"
              role="tab"
              :aria-selected="activeBlock === 'primary'"
              aria-controls="active-rotation-panel"
              class="rotation-tab"
              :class="{ active: activeBlock === 'primary', 'has-issue': !primaryValidation.isValid }"
              @click="selectRotationTab('primary')"
            >
              {{ t('simulator.primaryGathering') }}
            </button>
            <button
              id="revisit-rotation-tab"
              type="button"
              role="tab"
              :aria-selected="activeBlock === 'revisit'"
              aria-controls="active-rotation-panel"
              class="rotation-tab"
              :class="{ active: activeBlock === 'revisit', 'has-issue': !revisitValidation.isValid }"
              :disabled="!canCreateRevisitBlock && revisitRotation.length === 0"
              @click="selectRotationTab('revisit')"
            >
              {{ t('simulator.revisitGathering') }}
            </button>
          </div>

          <button v-if="activeBlock === 'revisit'" class="rotation-copy-button" :disabled="!canCreateRevisitBlock" @click="copyPrimaryToRevisit">
            <i class="pi pi-copy"></i>
            {{ t('simulator.copyPrimaryRotation') }}
          </button>
        </div>

        <div v-if="hasRotationIssue" class="rotation-issue-alert" role="alert">
          <i class="pi pi-exclamation-triangle"></i>
          <div>
            <strong>{{ t('simulator.rotationIssueTitle') }}</strong>
            <span>{{ t('simulator.rotationIssueDesc') }}</span>
          </div>
        </div>

        <div class="rotation-editor">
          <div
            id="active-rotation-panel"
            class="rotation-column"
            role="tabpanel"
            :aria-labelledby="activeBlock === 'primary' ? 'primary-rotation-tab' : 'revisit-rotation-tab'"
          >
            <div class="rotation-title">
              <strong>{{ activeRotationTitle }}</strong>
              <button :aria-label="t('simulator.clearRotation', { name: activeRotationTitle })" @click="clearActiveRotation"><i class="pi pi-trash"></i></button>
            </div>
            <div class="rotation-steps">
              <template v-if="activeRotation.length">
                <template v-for="(action, index) in activeRotation" :key="`${activeBlock}-${index}`">
                  <button
                    type="button"
                    class="rotation-step"
                    :class="{ revisit: activeBlock === 'revisit', 'is-invalid': activeInvalidIndexes.includes(index) }"
                    :title="`${actionLabel(action)} - ${t('simulator.removeFromHere')}`"
                    @click="removeAction(activeBlock, index)"
                  >
                    <img v-if="actionIcon(action)" :src="actionIcon(action)" alt="" />
                    <i v-else class="pi pi-sparkles"></i>
                  </button>
                  <i v-if="index < activeRotation.length - 1" class="pi pi-angle-right rotation-inline-arrow"></i>
                </template>
              </template>
              <p v-else>{{ activeRotationEmptyText }}</p>
            </div>
          </div>

          <div class="action-palette">
            <section v-for="group in actionGroups" :key="group.category" class="action-group">
              <h3>{{ group.label }}</h3>
              <div class="action-group-grid">
                <button
                  v-for="action in group.actions"
                  :key="action.kind"
                  :disabled="isActionDisabled(action.name)"
                  :title="`${actionLabel(action.name)} · ${action.gpCost} GP`"
                  @click="addAction(action.name)"
                >
                  <img v-if="actionIcon(action.name)" :src="actionIcon(action.name)" alt="" />
                  <i v-else class="pi pi-hand-pointer"></i>
                  <span>{{ actionLabel(action.name) }}</span>
                  <small>{{ action.gpCost }} GP</small>
                </button>
              </div>
            </section>
          </div>
        </div>

        <div class="simulate-actions">
          <Button :label="t('simulator.actions.simulate')" icon="pi pi-play" class="rounded-xl" :disabled="!canRunSimulation" @click="runSimulation" />
          <Button
            :label="isSaved ? t('simulator.actions.saved') : t('simulator.actions.save')"
            :icon="isSaved ? 'pi pi-check' : 'pi pi-save'"
            class="rounded-xl p-button-outlined"
            :disabled="!analysis || isSaved"
            @click="saveCurrentExperiment"
          />
        </div>
      </section>

      <section v-if="analysis && analysis.total" class="analysis-grid">
        <article class="panel analysis-card total">
          <h3>{{ t('simulator.analysis.summary') }}</h3>
          <div class="analysis-content">
            <div class="metric-grid">
              <div><span>{{ t('simulator.analysis.expectedYield') }}</span><strong>{{ analysis.total.expectedYield }}</strong></div>
              <div><span>{{ t('simulator.analysis.maxYield') }}</span><strong>{{ analysis.total.maxYield }}</strong><small>{{ t('simulator.analysis.chance', { chance: analysisChance(analysis.total.maxYieldChance) }) }}</small></div>
              <div><span>{{ t('simulator.analysis.minYield') }}</span><strong>{{ analysis.total.minYield }}</strong><small>{{ t('simulator.analysis.chance', { chance: analysisChance(analysis.total.minYieldChance) }) }}</small></div>
            </div>
            <div class="distribution">
              <div v-for="entry in analysis.total.outcomeDistribution" :key="`total-${entry.yield}`" class="bar-row">
                <span>{{ entry.yield }}</span>
                <div class="bar-track"><div class="bar-fill" :style="{ width: `${Math.max(2, Math.min(100, entry.probability))}%` }"></div></div>
                <small>{{ analysisChance(entry.probability) }}%</small>
              </div>
            </div>
          </div>
          <p v-if="analysis.revisitChance > 0" class="note">{{ t('simulator.analysis.revisitNote', { chance: formatChance(analysis.revisitChance * 100) }) }}</p>
        </article>
        <article v-if="analysis.primary" class="panel analysis-card">
          <h3>{{ t('simulator.primaryRotationAnalysis') }}</h3>
          <div class="analysis-content">
            <div class="metric-grid">
              <div><span>{{ t('simulator.analysis.expectedYield') }}</span><strong>{{ analysis.primary.expectedYield }}</strong></div>
              <div><span>{{ t('simulator.analysis.maxYield') }}</span><strong>{{ analysis.primary.maxYield }}</strong><small>{{ t('simulator.analysis.chance', { chance: analysisChance(analysis.primary.maxYieldChance) }) }}</small></div>
              <div><span>{{ t('simulator.analysis.minYield') }}</span><strong>{{ analysis.primary.minYield }}</strong><small>{{ t('simulator.analysis.chance', { chance: analysisChance(analysis.primary.minYieldChance) }) }}</small></div>
            </div>
            <div class="distribution">
              <div v-for="entry in analysis.primary.outcomeDistribution" :key="`primary-${entry.yield}`" class="bar-row">
                <span>{{ entry.yield }}</span>
                <div class="bar-track"><div class="bar-fill" :style="{ width: `${Math.max(2, Math.min(100, entry.probability))}%` }"></div></div>
                <small>{{ analysisChance(entry.probability) }}%</small>
              </div>
            </div>
          </div>
        </article>
        <article v-if="analysis.revisit" class="panel analysis-card">
          <h3>{{ t('simulator.revisitRotationAnalysis') }}</h3>
          <div class="analysis-content">
            <div class="metric-grid">
              <div><span>{{ t('simulator.analysis.expectedYield') }}</span><strong>{{ analysis.revisit.expectedYield }}</strong></div>
              <div><span>{{ t('simulator.analysis.maxYield') }}</span><strong>{{ analysis.revisit.maxYield }}</strong><small>{{ t('simulator.analysis.chance', { chance: analysisChance(analysis.revisit.maxYieldChance) }) }}</small></div>
              <div><span>{{ t('simulator.analysis.minYield') }}</span><strong>{{ analysis.revisit.minYield }}</strong><small>{{ t('simulator.analysis.chance', { chance: analysisChance(analysis.revisit.minYieldChance) }) }}</small></div>
            </div>
            <div class="distribution">
              <div v-for="entry in analysis.revisit.outcomeDistribution" :key="`revisit-${entry.yield}`" class="bar-row">
                <span>{{ entry.yield }}</span>
                <div class="bar-track"><div class="bar-fill" :style="{ width: `${Math.max(2, Math.min(100, entry.probability))}%` }"></div></div>
                <small>{{ analysisChance(entry.probability) }}%</small>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped>
.simulator-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 2rem 1rem 3rem;
}
.panel {
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: white;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}
:global(html.dark .panel) {
  border-color: #334155;
  background: #0f172a;
}
.item-panel,
.simulation-header,
.item-heading,
.section-title,
.simulate-actions {
  display: flex;
  gap: 1rem;
}
.item-panel,
.simulation-header {
  flex-direction: column;
}
.item-heading {
  align-items: center;
}
.item-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  overflow: hidden;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.item-icon {
  width: 48px;
  height: 48px;
  image-rendering: pixelated;
}
.item-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.item-badges span {
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: #ecfdf5;
  color: #15803d;
  font-size: 0.75rem;
  font-weight: 900;
}
.item-heading h1 {
  margin: 0.35rem 0 0;
  color: #1e293b;
  font-size: 1.45rem;
  font-weight: 900;
  overflow-wrap: anywhere;
}
:global(html.dark .item-heading h1) {
  color: #f8fafc;
}
.rate-grid,
.input-grid,
.analysis-grid,
.metric-grid {
  display: grid;
  gap: 0.75rem;
}
.rate-grid,
.metric-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.rate-grid div,
.metric-grid div {
  border-radius: 14px;
  background: #f8fafc;
  padding: 0.75rem;
}
:global(html.dark .rate-grid div),
:global(html.dark .metric-grid div) {
  background: rgb(30 41 59 / 0.65);
}
.rate-grid span,
.metric-grid span,
.input-grid span {
  display: block;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
}
.rate-grid strong,
.metric-grid strong {
  display: block;
  margin-top: 0.2rem;
  color: #0f172a;
  font-size: 1.2rem;
  font-weight: 900;
}
:global(html.dark .rate-grid strong),
:global(html.dark .metric-grid strong) {
  color: #f8fafc;
}
.section-title {
  align-items: center;
  margin-bottom: 1rem;
}
.section-title h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 900;
  color: #334155;
}
:global(html.dark .section-title h2) {
  color: #e2e8f0;
}
.input-grid {
  grid-template-columns: 1fr;
}
.input-grid label {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
}
.input-grid :deep(.p-inputnumber),
.input-grid :deep(.p-autocomplete),
.input-grid :deep(.p-inputtext),
.input-grid :deep(input) {
  width: 100% !important;
  min-width: 0 !important;
}
.warning {
  margin: 1rem 0 0;
  color: #dc2626;
  font-weight: 800;
}
.simulation-header {
  justify-content: space-between;
}
.status-bars {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.55rem;
}
.status-bar-card {
  min-width: 0;
  display: grid;
  gap: 0.35rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
}
:global(html.dark .status-bar-card) {
  border-color: #334155;
  background: rgb(30 41 59 / 0.55);
}
.status-bar-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.status-bar-meta span {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
}
.status-bar-meta strong {
  color: #0f172a;
  font-size: 0.78rem;
  font-weight: 950;
  white-space: nowrap;
}
:global(html.dark .status-bar-meta span) {
  color: #94a3b8;
}
:global(html.dark .status-bar-meta strong) {
  color: #e2e8f0;
}
.status-track {
  height: 0.48rem;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}
:global(html.dark .status-track) {
  background: #1e293b;
}
.status-fill {
  height: 100%;
  min-width: 2px;
  border-radius: inherit;
  transition: width 0.2s ease;
}
.status-fill.integrity {
  background: linear-gradient(90deg, #52a890, #22c55e);
}
.status-fill.gp {
  background: linear-gradient(90deg, #38bdf8, #2563eb);
}
.rotation-title button,
.rotation-step button {
  border: 0;
  cursor: pointer;
}
.rotation-tabs-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0;
  border-bottom: 1px solid #e2e8f0;
  overflow: hidden;
}
:global(html.dark .rotation-tabs-wrap) {
  border-color: #334155;
}
.rotation-tabs {
  display: flex;
  align-items: flex-end;
  gap: 0.3rem;
  min-width: 0;
  overflow: visible;
  scrollbar-width: none;
}
.rotation-tabs::-webkit-scrollbar {
  display: none;
}
.rotation-tab {
  position: relative;
  min-height: 42px;
  padding: 0.7rem 1rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-bottom: 0;
  border-radius: 14px 14px 0 0;
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 900;
  white-space: nowrap;
  transition: background-color 0.16s ease, color 0.16s ease, transform 0.16s ease;
}
.rotation-tab.active {
  z-index: 1;
  background: white;
  color: #15803d;
  transform: translateY(1px);
}
.rotation-tab.has-issue::after {
  content: '';
  position: absolute;
  top: 0.45rem;
  right: 0.45rem;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: #ef4444;
}
.rotation-tab:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}
:global(html.dark .rotation-tab) {
  border-color: #334155;
  background: rgb(30 41 59 / 0.55);
  color: #cbd5e1;
}
:global(html.dark .rotation-tab.active) {
  background: #0f172a;
  color: #86efac;
}
.rotation-copy-button {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #15803d;
  cursor: pointer;
  padding: 0.55rem 0.25rem;
  font-size: 0.86rem;
  font-weight: 900;
}
.rotation-copy-button:disabled,
.action-palette button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
.rotation-issue-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid rgb(251 146 60 / 0.75);
  border-radius: 14px;
  background: rgb(255 247 237 / 0.96);
  color: #9a3412;
}
.rotation-issue-alert i {
  margin-top: 0.12rem;
  color: #f97316;
}
.rotation-issue-alert strong,
.rotation-issue-alert span {
  display: block;
  line-height: 1.45;
}
.rotation-issue-alert strong {
  font-size: 0.9rem;
  font-weight: 900;
}
.rotation-issue-alert span {
  margin-top: 0.1rem;
  font-size: 0.78rem;
  font-weight: 750;
}
:global(html.dark .rotation-issue-alert) {
  border-color: rgb(194 65 12 / 0.55);
  background: rgb(154 52 18 / 0.16);
  color: #fed7aa;
}
.rotation-editor {
  display: grid;
  gap: 1rem;
}
.rotation-column {
  border: 1px solid #e2e8f0;
  border-top: 0;
  border-radius: 0 0 16px 16px;
  background: #f8fafc;
  padding: 0.85rem;
}
:global(html.dark .rotation-column) {
  border-color: #334155;
  background: rgb(30 41 59 / 0.5);
}
.rotation-title {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  color: #475569;
}
.rotation-title button {
  color: #94a3b8;
  background: transparent;
}
.rotation-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 48px;
}
.rotation-steps p {
  margin: 0;
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 700;
}
.rotation-step {
  width: 38px;
  height: 38px;
  border: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-radius: 12px;
  padding: 0.25rem;
  background: #52a890;
  color: white;
  font-size: 0.82rem;
  font-weight: 900;
  transition: transform 0.16s ease, filter 0.16s ease;
}
.rotation-step:hover {
  filter: brightness(0.96);
  transform: translateY(-1px);
}
.rotation-step.revisit {
  background: #2563eb;
}
.rotation-step.is-invalid {
  background: #ef4444;
  box-shadow: 0 0 0 3px rgb(239 68 68 / 0.18);
  animation: invalidPulse 1.2s ease-in-out infinite;
}
.rotation-step img,
.action-palette img {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  image-rendering: pixelated;
}
.rotation-inline-arrow {
  color: #94a3b8;
  font-size: 0.82rem;
  flex-shrink: 0;
}
:global(html.dark .rotation-inline-arrow) {
  color: #64748b;
}
.action-palette {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}
.action-group {
  display: grid;
  gap: 0.45rem;
  min-width: 0;
  padding: 0.65rem;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #f8fafc;
}
:global(html.dark .action-group) {
  border-color: #334155;
  background: rgb(30 41 59 / 0.38);
}
.action-group h3 {
  margin: 0;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 900;
  line-height: 1.2;
}
:global(html.dark .action-group h3) {
  color: #cbd5e1;
}
.action-group-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.45rem;
}
.action-group-grid button {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.45rem;
  height: 48px;
  min-width: 0;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: white;
  padding: 0.5rem;
  color: #334155;
  text-align: left;
  font-weight: 900;
}
:global(html.dark .action-group-grid button) {
  border-color: #334155;
  background: #0f172a;
  color: #e2e8f0;
}
.action-group-grid span {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow-wrap: anywhere;
}
.action-group-grid small,
.metric-grid small {
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 800;
}
.simulate-actions {
  flex-direction: column;
  margin-top: 1rem;
}
.analysis-grid {
  grid-template-columns: 1fr;
}
.analysis-card h3 {
  margin: 0 0 1rem;
  color: #334155;
  font-weight: 900;
}
:global(html.dark .analysis-card h3) {
  color: #e2e8f0;
}
.analysis-card.total {
  border-color: rgb(82 168 144 / 0.5);
  background: #f0fdf4;
}
:global(html.dark .analysis-card.total) {
  background: rgb(20 83 45 / 0.2);
}
.distribution {
  display: grid;
  gap: 0.45rem;
  margin-top: 1rem;
}
.bar-row {
  display: grid;
  grid-template-columns: 2.5rem 1fr 3.75rem;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
}
.bar-track {
  height: 0.6rem;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}
.bar-fill {
  height: 100%;
  border-radius: inherit;
  background: #52a890;
}
.note {
  margin: 1rem 0 0;
  color: #15803d;
  font-size: 0.82rem;
  font-weight: 800;
}
.empty-state {
  display: flex;
  min-height: 60vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  text-align: center;
  color: #64748b;
}
.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  background: rgba(82, 168, 144, 0.1);
  color: #52a890;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}
.empty-state h2,
.empty-state p {
  margin: 0;
}
@media (min-width: 640px) {
  .input-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .simulate-actions {
    flex-direction: row;
  }
}
@media (min-width: 768px) {
  .simulator-page {
    padding: 2.5rem 2rem 3rem;
  }
  .item-panel,
  .simulation-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .status-bars {
    width: min(100%, 23rem);
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .rotation-tabs-wrap {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
  .rotation-copy-button {
    align-self: center;
    padding-bottom: 0.75rem;
  }
}
@media (min-width: 1024px) {
  .input-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .action-palette {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .action-group-grid {
    grid-template-columns: 1fr;
  }
  .analysis-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .analysis-card.total {
    grid-column: 1 / -1;
  }
}
@media (max-width: 520px) {
  .rate-grid,
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
@keyframes invalidPulse {
  0%, 100% { box-shadow: 0 0 0 3px rgb(239 68 68 / 0.14); }
  50% { box-shadow: 0 0 0 5px rgb(239 68 68 / 0.24); }
}
</style>
