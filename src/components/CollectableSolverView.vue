<script setup lang="ts">
defineOptions({ name: 'CollectableSolverView' });

import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import InputNumber from 'primevue/inputnumber';
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import Select from 'primevue/select';
import CollectablePolicyNodeCard from './CollectablePolicyNodeCard.vue';
import CollectableDebugDialog from './CollectableDebugDialog.vue';
import { useCollectableSolver } from '../composables/useCollectableSolver';
import { useTomeLibrary } from '../composables/useTomeLibrary';
import { useSettings } from '../composables/useSettings';
import { GATHERING_FOODS } from '../services/foodData';
import { getItemName, getItemEnglishName } from '../services/gameData';
import type { FoodQuality, GatheringFood } from '../types/game';
import type { CollectableNodeType } from '../types/collectable';

type FoodOption = {
  food: GatheringFood;
  quality: FoodQuality;
  label: string;
  searchText: string;
};

const { t } = useI18n();
const {
  activeItem,
  solverStats,
  selectedFood,
  selectedFoodItem,
  foodBonus,
  effectiveStats,
  integrityBonus,
  nodeType,
  baseIntegrity,
  totalIntegrity,
  rewardThresholds,
  rewardLoadError,
  isLoadingRewards,
  solve,
  isSolving,
  solveError,
  solverResult,
  isDebugDialogOpen,
  buildStoredTome
} = useCollectableSolver();

const { saveCollectableTome } = useTomeLibrary();
const { debugSettings } = useSettings();

// ─── Food autocomplete ───────────────────────────────────────────────────────

const foodSuggestions = ref<FoodOption[]>([]);

function toFoodOption(food: GatheringFood, quality: FoodQuality): FoodOption {
  const localName = getItemName(food.id);
  const enName = getItemEnglishName(food.id);
  const qLabel = t(`solver.food.${quality}`);
  return {
    food,
    quality,
    label: `${localName} ${qLabel}`,
    searchText: `${localName} ${enName} ${food.id}`.toLowerCase()
  };
}

const selectedFoodModel = computed<FoodOption | null>({
  get: () => selectedFoodItem.value ? toFoodOption(selectedFoodItem.value, selectedFood.value.quality) : null,
  set: (option) => {
    selectedFood.value.foodId = option?.food.id ?? null;
    if (option) selectedFood.value.quality = option.quality;
  }
});

function searchFoods(event: { query: string }) {
  const q = event.query.toLowerCase();
  const opts: FoodOption[] = [];
  for (const food of GATHERING_FOODS) {
    for (const quality of ['hq', 'nq'] as FoodQuality[]) {
      const opt = toFoodOption(food, quality);
      if (!q || opt.searchText.includes(q)) opts.push(opt);
    }
  }
  foodSuggestions.value = opts.slice(0, 30);
}

// ─── Node type options ───────────────────────────────────────────────────────

const nodeTypeOptions: { label: string; value: CollectableNodeType }[] = [
  { label: t('collectableSolver.nodeTypes.normal'), value: 'normal' },
  { label: t('collectableSolver.nodeTypes.satisfaction'), value: 'satisfaction' },
  { label: t('collectableSolver.nodeTypes.legendary'), value: 'legendary' },
  { label: t('collectableSolver.nodeTypes.unknown'), value: 'unknown' }
];

// ─── Save tome ───────────────────────────────────────────────────────────────

const isTomeSaved = ref(false);
let tomeSavedTimer: ReturnType<typeof window.setTimeout> | null = null;

function handleSaveTome() {
  const tome = buildStoredTome();
  if (!tome) return;
  saveCollectableTome(tome);
  isTomeSaved.value = true;
  if (tomeSavedTimer) clearTimeout(tomeSavedTimer);
  tomeSavedTimer = window.setTimeout(() => { isTomeSaved.value = false; }, 2500);
}

// ─── GP display helpers ──────────────────────────────────────────────────────

const foodBonusGp = computed(() => {
  const base = solverStats.value.gp;
  const effective = effectiveStats.value.gp;
  return effective - base;
});

const foodBonusGathering = computed(() => effectiveStats.value.gathering - solverStats.value.gathering);
const foodBonusPerception = computed(() => effectiveStats.value.perception - solverStats.value.perception);
</script>

<template>
  <div class="collectable-solver space-y-6" v-if="activeItem">
    <!-- ── Item header ─────────────────────────────────────────────────── -->
    <div class="card-panel">
      <div class="item-header">
        <div class="item-icon-box">
          <img v-if="activeItem.iconUrl" :src="activeItem.iconUrl" class="w-12 h-12 pixelated" :alt="getItemName(activeItem.itemId)" />
          <i v-else class="pi pi-box text-2xl text-slate-400"></i>
        </div>
        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <span v-if="activeItem.jobType" class="badge-green">{{ t(`game.jobs.${activeItem.jobType}`) }}</span>
            <span class="badge-slate">{{ t('createGuide.glv') }} {{ activeItem.glv }}</span>
            <span class="badge-purple">{{ t('createGuide.collectableSystem') }}</span>
          </div>
          <h1 class="text-xl font-extrabold text-slate-800 dark:text-slate-100">{{ getItemName(activeItem.itemId) }}</h1>
        </div>
      </div>
    </div>

    <!-- ── Stats + Integrity form ─────────────────────────────────────── -->
    <div class="card-panel">
      <h3 class="section-title">
        <i class="pi pi-user-edit text-soft-green-500"></i>
        {{ t('solver.statsTitle') }}
      </h3>

      <div class="form-grid">
        <!-- Level -->
        <div class="field-group">
          <label class="field-label">{{ t('game.stats.level') }}</label>
          <InputNumber v-model="solverStats.level" :min="1" :max="100" fluid class="w-full" />
        </div>

        <!-- Food -->
        <div class="field-group">
          <label class="field-label">{{ t('solver.food.label') }}</label>
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
          />
        </div>

        <!-- Gathering -->
        <div class="field-group">
          <label class="field-label">{{ t('game.stats.gathering') }}</label>
          <InputNumber v-model="solverStats.gathering" :min="1" :max="99999" fluid class="w-full" />
          <span v-if="foodBonusGathering > 0" class="food-bonus-hint">+{{ foodBonusGathering }} 食物</span>
        </div>

        <!-- Perception -->
        <div class="field-group">
          <label class="field-label">{{ t('game.stats.perception') }}</label>
          <InputNumber v-model="solverStats.perception" :min="1" :max="99999" fluid class="w-full" />
          <span v-if="foodBonusPerception > 0" class="food-bonus-hint">+{{ foodBonusPerception }} 食物</span>
        </div>

        <!-- GP -->
        <div class="field-group">
          <label class="field-label">{{ t('game.stats.gp') }}</label>
          <InputNumber v-model="solverStats.gp" :min="1" :max="9999" fluid class="w-full" />
          <span v-if="foodBonusGp > 0" class="food-bonus-hint">+{{ foodBonusGp }} 食物 → {{ effectiveStats.gp }}</span>
        </div>

        <!-- Node type -->
        <div class="field-group">
          <label class="field-label">{{ t('collectableSolver.nodeType') }}</label>
          <Select
            v-model="nodeType"
            :options="nodeTypeOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>

        <!-- Integrity -->
        <div class="field-group col-span-full">
          <label class="field-label">{{ t('collectableSolver.integritySection') }}</label>
          <div class="integrity-row">
            <div class="integrity-chip">
              <span class="integrity-label">{{ t('collectableSolver.baseIntegrity') }}</span>
              <span class="integrity-value">{{ baseIntegrity }}</span>
            </div>
            <span class="integrity-plus">+</span>
            <div class="flex flex-col gap-0.5">
              <label class="text-xs text-slate-400">{{ t('collectableSolver.integrityBonus') }}</label>
              <InputNumber v-model="integrityBonus" :min="0" :max="10" :step="1" class="w-24" />
            </div>
            <span class="integrity-equals">=</span>
            <div class="integrity-chip integrity-total">
              <span class="integrity-label">{{ t('collectableSolver.totalIntegrity') }}</span>
              <span class="integrity-value">{{ totalIntegrity }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Reward data status ─────────────────────────────────────────── -->
    <div v-if="isLoadingRewards" class="status-banner status-loading">
      <i class="pi pi-spin pi-spinner"></i>
      {{ t('collectableSolver.loadingRewards') }}
    </div>
    <div v-else-if="rewardLoadError" class="status-banner status-error">
      <i class="pi pi-exclamation-circle"></i>
      {{ t(`collectableSolver.rewardDataError.${rewardLoadError}`) }}
    </div>

    <!-- ── Solve button ────────────────────────────────────────────────── -->
    <div class="solve-area">
      <Button
        :icon="isSolving ? 'pi pi-spin pi-spinner' : 'pi pi-cog'"
        :label="isSolving ? t('collectableSolver.solving') : t('collectableSolver.solve')"
        :disabled="isSolving || isLoadingRewards || !!rewardLoadError"
        class="p-button-lg solve-button"
        @click="solve"
      />
    </div>

    <!-- ── Solve error ─────────────────────────────────────────────────── -->
    <div v-if="solveError" class="status-banner status-error">
      <i class="pi pi-exclamation-circle"></i>
      {{ t('collectableSolver.solveError') }}
    </div>

    <!-- ── Results ────────────────────────────────────────────────────── -->
    <template v-if="solverResult">
      <!-- Summary row -->
      <div class="card-panel">
        <h3 class="section-title">
          <i class="pi pi-chart-bar text-soft-green-500"></i>
          {{ t('collectableSolver.results.rewardTiers') }}
        </h3>
        <div class="results-grid">
          <div class="result-chip" v-if="rewardThresholds">
            <span class="result-label">{{ t('collectableSolver.results.expectedCollectability') }}</span>
            <span class="result-value text-teal-600 dark:text-teal-400">
              {{ Math.round(solverResult.expectedCollectability) }}
            </span>
            <span class="result-sub">
              / {{ rewardThresholds.low }} / {{ rewardThresholds.mid }}
              <template v-if="rewardThresholds.high > 0">/ {{ rewardThresholds.high }}</template>
            </span>
          </div>
          <div class="result-chip">
            <span class="result-label">{{ t('collectableSolver.results.expectedScrip') }}</span>
            <span class="result-value text-amber-600 dark:text-amber-400">
              {{ solverResult.expectedScrip.toFixed(1) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Policy tree -->
      <div class="card-panel">
        <div class="flex items-center justify-between gap-2 mb-4">
          <h3 class="section-title !mb-0">
            <i class="pi pi-sitemap text-soft-green-500"></i>
            {{ t('collectableSolver.policy.title') }}
          </h3>
          <Button
            v-if="solverResult"
            :icon="isTomeSaved ? 'pi pi-check' : 'pi pi-bookmark'"
            :label="isTomeSaved ? t('collectableSolver.savedTome') : t('collectableSolver.saveTome')"
            class="p-button-sm p-button-text"
            :class="{ 'text-soft-green-500': isTomeSaved }"
            :disabled="isTomeSaved"
            @click="handleSaveTome"
          />
        </div>
        <div class="policy-tree-scroll">
          <CollectablePolicyNodeCard :node="solverResult.policy" :depth="0" />
        </div>

        <!-- Debug button (only in debug mode) -->
        <div v-if="debugSettings.solverDebugMode && solverResult.debug" class="debug-bar">
          <Button
            icon="pi pi-code"
            :label="t('solver.debug.open')"
            class="p-button-sm p-button-text text-slate-400"
            @click="isDebugDialogOpen = true"
          />
        </div>
      </div>
    </template>

    <!-- Debug dialog -->
    <CollectableDebugDialog
      v-model="isDebugDialogOpen"
      :debug="solverResult?.debug"
    />
  </div>
</template>

<style scoped>
.collectable-solver {
  max-width: 860px;
  margin: 0 auto;
  padding: 1.5rem;
}

@media (min-width: 768px) {
  .collectable-solver {
    padding: 2rem;
  }
}

.card-panel {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

:global(html.dark .card-panel) {
  background: #0f172a;
  border-color: #334155;
  box-shadow: 0 2px 12px rgba(0,0,0,0.2);
}

.item-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.item-icon-box {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  background: #f8fafc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

:global(html.dark .item-icon-box) {
  background: #1e293b;
}

.badge-green {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 2px 10px;
  border-radius: 20px;
  background: linear-gradient(135deg, #52a890, #3d8b75);
  color: white;
}

.badge-slate {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 2px 10px;
  border-radius: 20px;
  background: linear-gradient(135deg, #64748b, #475569);
  color: white;
}

.badge-purple {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 2px 10px;
  border-radius: 20px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1.25rem;
}

:global(html.dark .section-title) {
  color: #e2e8f0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.col-span-full {
  grid-column: 1 / -1;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
}

.food-bonus-hint {
  font-size: 0.72rem;
  color: #52a890;
  font-weight: 600;
}

.integrity-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.integrity-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.5rem 0.9rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

:global(html.dark .integrity-chip) {
  background: #1e293b;
  border-color: #334155;
}

.integrity-total {
  background: rgba(82, 168, 144, 0.08);
  border-color: rgba(82, 168, 144, 0.3);
}

.integrity-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.integrity-value {
  font-size: 1.15rem;
  font-weight: 800;
  color: #334155;
}

:global(html.dark .integrity-value) {
  color: #e2e8f0;
}

.integrity-plus,
.integrity-equals {
  font-size: 1rem;
  font-weight: 700;
  color: #94a3b8;
}

.status-banner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.9rem 1.2rem;
  border-radius: 14px;
  font-size: 0.88rem;
  font-weight: 600;
}

.status-loading {
  background: rgba(82, 168, 144, 0.08);
  color: #3d8b75;
  border: 1px solid rgba(82, 168, 144, 0.2);
}

:global(html.dark .status-loading) {
  color: #52a890;
  background: rgba(82, 168, 144, 0.06);
  border-color: rgba(82, 168, 144, 0.15);
}

.status-error {
  background: rgba(239, 68, 68, 0.06);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

:global(html.dark .status-error) {
  color: #f87171;
  background: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.15);
}

.solve-area {
  display: flex;
  justify-content: center;
}

.solve-button {
  min-width: 180px;
  background: linear-gradient(135deg, #52a890, #3d8b75) !important;
  border: none !important;
  border-radius: 16px !important;
  font-weight: 800 !important;
  font-size: 1rem !important;
  padding: 0.85rem 2rem !important;
  box-shadow: 0 4px 12px rgba(82, 168, 144, 0.35) !important;
  transition: all 0.2s !important;
}

.solve-button:not(:disabled):hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 16px rgba(82, 168, 144, 0.45) !important;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

@media (max-width: 400px) {
  .results-grid {
    grid-template-columns: 1fr;
  }
}

.result-chip {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.8rem 1rem;
  background: #f8fafc;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
}

:global(html.dark .result-chip) {
  background: #1e293b;
  border-color: #334155;
}

.result-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.result-value {
  font-size: 1.3rem;
  font-weight: 900;
}

.result-sub {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 600;
}

.policy-tree-scroll {
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.debug-bar {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
  border-top: 1px solid #f1f5f9;
  margin-top: 0.5rem;
}

:global(html.dark .debug-bar) {
  border-color: #1e293b;
}
</style>
