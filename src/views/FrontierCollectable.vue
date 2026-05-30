<script setup lang="ts">
defineOptions({ name: 'FrontierCollectable' });

import { computed, onActivated, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { watchDebounced } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import GatheringItemCard from '../components/GatheringItemCard.vue';
import CollectableStrategyLab from '../components/CollectableStrategyLab.vue';
import CollectableItemSummaryPanel from '../components/collectable/CollectableItemSummaryPanel.vue';
import CollectableStatsPanel from '../components/collectable/CollectableStatsPanel.vue';
import FrontierCollectableAssumptionsPanel from '../components/frontier/FrontierCollectableAssumptionsPanel.vue';
import { useSettings } from '../composables/useSettings';
import { useSimulatorStats } from '../composables/useSimulatorStats';
import {
  currentLanguage,
  getGatherableItemById,
  getItemBaseIntegrity,
  getItemName,
  isGameDataLoading,
  searchGatherables
} from '../services/gameData';
import { buildFoodOption, type FoodOption } from '../services/foodOptions';
import { getCollectableRewardTable } from '../services/collectableRewards';
import { createDefaultFrontierProbabilityProfile } from '../frontier/collectable/frontierCollectableProbabilityProfile';
import { useFrontierCollectableStudies } from '../frontier/collectable/frontierCollectableStorage';
import { applySanitizedPaste, stripSpecialSearchCharacters } from '../utils/searchText';
import { calculateCollectableScourValue } from '../utils/collectableMath';
import { gatherableItemJobs } from '../utils/gatherableItemJobs';
import {
  PLAYER_INPUT_LIMITS,
  clampIntegerInput,
  normalizeNodeBonuses,
  normalizePlayerStats
} from '../config/inputLimits';
import type { CollectableRewardTable } from '../types/collectable';
import type { GatherableItem } from '../types/game';
import type { FrontierCollectableStudy } from '../frontier/collectable/frontierCollectableTypes';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { frontierSettings, solverSettings } = useSettings();
const {
  activeItem,
  simStats,
  selectedFood,
  selectedFoodItem,
  effectiveStats,
  nodeBonuses,
  gatheringCountMax,
  temporaryGp,
  baseValues,
  itemRealLevel,
  successRate,
  fetchItemLevelData,
  setSelectedItem,
  syncFromSettings
} = useSimulatorStats();
const { getStudy } = useFrontierCollectableStudies();

const searchQuery = ref('');
const searchResults = ref<GatherableItem[]>([]);
const hasSearched = ref(false);
const isSearching = ref(false);
const apiError = ref(false);
const selectedCandidate = ref<GatherableItem | null>(null);
const isModelDialogOpen = ref(false);
const hasSelectedModel = ref(false);
const probabilityProfile = ref(createDefaultFrontierProbabilityProfile());
const rewardTable = ref<CollectableRewardTable | null>(null);
const isRewardLoading = ref(false);
const loadedStudyId = ref<string | null>(null);
const loadedStudy = ref<FrontierCollectableStudy | null>(null);
let searchRequestId = 0;
const selectedFoodModel = computed<FoodOption | null>({
  get: () => selectedFoodItem.value ? buildFoodOption(selectedFoodItem.value, selectedFood.value.quality, t) : null,
  set: (option) => {
    selectedFood.value.foodId = option?.food.id ?? null;
    if (option) selectedFood.value.quality = option.quality;
  }
});
const activeItemJobs = computed(() => activeItem.value ? gatherableItemJobs(activeItem.value) : []);
const collectableScourValue = computed(() => {
  if (!baseValues.value?.Gathering) return null;
  return calculateCollectableScourValue(effectiveStats.value.gathering, baseValues.value.Gathering);
});
const collectableRelicToolBonusModel = computed<boolean>({
  get: () => !!solverSettings.value.collectableRelicToolBonus,
  set: (value) => {
    solverSettings.value.collectableRelicToolBonus = value;
  }
});

onMounted(() => {
  fetchItemLevelData();
  doSearch(searchQuery.value);
  if (!consumeCreateRoute()) loadStudyFromRoute();
});

onActivated(() => {
  if (!consumeCreateRoute()) loadStudyFromRoute();
});

watchDebounced(searchQuery, (query) => doSearch(query), { debounce: 450 });

watch(currentLanguage, () => doSearch(searchQuery.value));

watch(() => route.query.study, () => {
  if (!consumeCreateRoute()) loadStudyFromRoute();
});

watch(() => route.query.new, () => consumeCreateRoute());

watch(activeItem, async (item) => {
  rewardTable.value = null;
  if (!item?.isCollectable) return;

  isRewardLoading.value = true;
  try {
    rewardTable.value = await getCollectableRewardTable(item.itemId);
  } finally {
    isRewardLoading.value = false;
  }
}, { immediate: true });

async function doSearch(query: string) {
  const requestId = ++searchRequestId;
  isSearching.value = true;
  hasSearched.value = true;
  apiError.value = false;
  try {
    const results = await searchGatherables(query);
    if (requestId !== searchRequestId) return;
    searchResults.value = results;
  } catch (error) {
    if (requestId !== searchRequestId) return;
    console.error('[Frontier] Search failed:', error);
    apiError.value = true;
    searchResults.value = [];
  } finally {
    if (requestId === searchRequestId) isSearching.value = false;
  }
}

function handleSearchPaste(event: ClipboardEvent) {
  const pastedText = event.clipboardData?.getData('text') ?? '';
  if (!pastedText || stripSpecialSearchCharacters(pastedText) === pastedText) return;

  event.preventDefault();
  searchQuery.value = applySanitizedPaste(
    searchQuery.value,
    pastedText,
    (event.target as HTMLInputElement | null)?.selectionStart,
    (event.target as HTMLInputElement | null)?.selectionEnd
  );
}

function clearSearch() {
  searchQuery.value = '';
  selectedCandidate.value = null;
  isModelDialogOpen.value = false;
  doSearch('');
}

function selectCandidate(item: GatherableItem) {
  selectedCandidate.value = item;
  hasSelectedModel.value = false;
  isModelDialogOpen.value = true;
}

function closeModelDialog() {
  isModelDialogOpen.value = false;
}

function startCollectableModel() {
  if (!selectedCandidate.value?.isCollectable) return;
  setSelectedItem({ ...selectedCandidate.value, isCollectable: true, isCrystalGathering: false });
  syncFromSettings({ forceStats: true, resetTemporaryGp: true });
  hasSelectedModel.value = true;
  isModelDialogOpen.value = false;
  loadedStudyId.value = null;
  loadedStudy.value = null;
  router.replace({ path: '/frontier', query: {} });
}

function resetToCreateMode() {
  hasSelectedModel.value = false;
  selectedCandidate.value = null;
  isModelDialogOpen.value = false;
  loadedStudyId.value = null;
  loadedStudy.value = null;
}

function consumeCreateRoute() {
  if (route.query.new !== '1') return false;
  resetToCreateMode();
  router.replace({ path: '/frontier', query: {} });
  return true;
}

function loadStudyFromRoute() {
  const id = typeof route.query.study === 'string' ? route.query.study : '';
  if (!id || loadedStudyId.value === id) return;

  const study = getStudy(id);
  const item = study ? getGatherableItemById(study.itemId) : null;
  if (!study || !item) return;

  setSelectedItem({ ...item, isCollectable: true, isCrystalGathering: false });
  simStats.value = normalizePlayerStats(study.input.stats);
  selectedFood.value = study.input.food ? { ...study.input.food } : { foodId: null, quality: 'hq' };
  nodeBonuses.value = normalizeNodeBonuses({
    baseIntegrity: study.input.nodeBonuses.baseIntegrity ?? (item.gatheringItemId ? getItemBaseIntegrity(item.gatheringItemId) : 4),
    gatheringCount: study.input.nodeBonuses.gatheringCount,
    yieldCount: study.input.nodeBonuses.yieldCount,
    extraRate: study.input.nodeBonuses.extraRate
  });
  temporaryGp.value = clampIntegerInput(study.input.temporaryGp, PLAYER_INPUT_LIMITS.gp.min, simStats.value.gp, simStats.value.gp);
  solverSettings.value.collectableRelicToolBonus = !!study.input.hasRelicToolBonus;
  probabilityProfile.value = study.probabilityProfile;
  selectedCandidate.value = item;
  hasSelectedModel.value = true;
  isModelDialogOpen.value = false;
  loadedStudyId.value = id;
  loadedStudy.value = study;
}

function getUiState() {
  if (apiError.value) return 'error';
  if (isGameDataLoading.value || isSearching.value) return 'loading';
  if (!hasSearched.value) return 'idle';
  if (searchResults.value.length === 0) return 'empty';
  return 'results';
}
</script>

<template>
  <div
    class="frontier-page"
    :class="{
      'is-create-mode': frontierSettings.enabled && !hasSelectedModel,
      'is-workspace-mode': frontierSettings.enabled && hasSelectedModel
    }"
  >
    <header v-if="!frontierSettings.enabled" class="page-header">
      <h2 class="page-title text-soft-green-800 dark:text-soft-green-400">
        {{ $t('frontier.collectable.title') }}
      </h2>
      <p class="page-description">
        {{ $t('frontier.collectable.description') }}
      </p>
    </header>

    <section v-if="!frontierSettings.enabled" class="panel">
      <div class="empty-row">
        <div class="empty-icon"><i class="pi pi-lock"></i></div>
        <div>
          <h3>{{ $t('frontier.disabled.title') }}</h3>
          <p>{{ $t('frontier.disabled.description') }}</p>
        </div>
        <router-link to="/settings" class="primary-link">
          <i class="pi pi-cog"></i>
          <span>{{ $t('frontier.disabled.action') }}</span>
        </router-link>
      </div>
    </section>

    <template v-else>
      <section v-if="!hasSelectedModel" class="create-guide-page frontier-create">
        <header class="create-page-header">
          <div class="header-content">
            <h2 class="create-page-title text-soft-green-800 dark:text-soft-green-400">{{ $t('frontier.collectable.title') }}</h2>
            <p class="create-page-description text-sm text-slate-600 dark:text-slate-300 font-medium mb-4">{{ $t('frontier.collectable.description') }}</p>
            <div class="data-scope-badge">
              <i class="pi pi-info-circle"></i>
              <span>{{ $t('frontier.create.description') }}</span>
            </div>
          </div>
        </header>

        <div class="search-section">
          <IconField class="search-field">
            <InputIcon>
              <i v-if="isGameDataLoading || isSearching" class="pi pi-spin pi-spinner"></i>
              <i v-else class="pi pi-search"></i>
            </InputIcon>
            <InputText
              v-model="searchQuery"
              :placeholder="$t('frontier.create.searchPlaceholder')"
              class="search-input"
              autocomplete="off"
              :disabled="isGameDataLoading"
              @paste="handleSearchPaste"
            />
            <InputIcon v-if="searchQuery" style="cursor:pointer" @click="clearSearch">
              <i class="pi pi-times"></i>
            </InputIcon>
          </IconField>
        </div>

        <div class="results-section">
          <transition name="state-fade" mode="out-in">
            <div v-if="getUiState() === 'loading'" key="loading" class="state-container">
              <div class="loading-animation">
                <div class="loading-orb"></div>
                <div class="loading-orb delay-1"></div>
                <div class="loading-orb delay-2"></div>
              </div>
              <p class="state-text">{{ $t('frontier.create.states.loading') }}</p>
            </div>

            <div v-else-if="getUiState() === 'idle'" key="idle" class="state-container">
              <div class="idle-icon">
                <i class="pi pi-search"></i>
              </div>
              <p class="state-text">{{ $t('frontier.create.states.idle') }}</p>
            </div>

            <div v-else-if="getUiState() === 'empty'" key="empty" class="state-container">
              <div class="empty-icon">
                <i class="pi pi-inbox"></i>
              </div>
              <p class="state-text">{{ $t('frontier.create.states.empty') }}</p>
            </div>

            <div v-else-if="getUiState() === 'error'" key="error" class="state-container error-state">
              <div class="error-icon">
                <i class="pi pi-exclamation-triangle"></i>
              </div>
              <p class="state-text error-text">{{ $t('frontier.create.states.error') }}</p>
              <button class="retry-btn" @click="doSearch(searchQuery)">
                <i class="pi pi-refresh"></i>
                {{ $t('createGuide.retrySearch') }}
              </button>
            </div>

            <div v-else key="results">
              <div class="results-count">
                <span>{{ $t('createGuide.resultCount', { count: searchResults.length, plus: searchResults.length >= 50 ? '+' : '' }) }}</span>
              </div>
              <div class="results-grid">
                <GatheringItemCard
                  v-for="item in searchResults"
                  :key="item.itemId"
                  :item="item"
                  @select="selectCandidate"
                />
              </div>
            </div>
          </transition>
        </div>
      </section>

      <section v-else class="simulator-page frontier-model-workspace">
        <div class="frontier-workspace-stack">
          <CollectableItemSummaryPanel
            v-if="activeItem"
            :item="activeItem"
            :item-name="getItemName(activeItem.itemId)"
            :jobs="activeItemJobs"
            :item-real-level="itemRealLevel"
            :success-rate="successRate"
            :collectable-scour-value="collectableScourValue"
            :model-label="$t('frontier.create.dawntrailCollectableModel')"
          />

          <CollectableStatsPanel
            v-model:stats="simStats"
            v-model:selected-food="selectedFoodModel"
            v-model:temporary-gp="temporaryGp"
            v-model:node-bonuses="nodeBonuses"
            v-model:relic-tool-bonus="collectableRelicToolBonusModel"
            :effective-gp="effectiveStats.gp"
            :gathering-count-max="gatheringCountMax"
            is-collectable
          />

          <FrontierCollectableAssumptionsPanel v-model="probabilityProfile" />

          <CollectableStrategyLab
            v-if="activeItem"
            :active-item="activeItem"
            :effective-stats="effectiveStats"
            :base-values="baseValues"
            :item-real-level="itemRealLevel"
            :node-bonuses="nodeBonuses"
            :temporary-gp="temporaryGp"
            :selected-food="selectedFood"
            :has-relic-tool-bonus="collectableRelicToolBonusModel"
            :frontier-probability-profile="probabilityProfile"
            :frontier-study-id="loadedStudyId"
            :frontier-loaded-study="loadedStudy"
          />
        </div>
      </section>

      <Teleport to="body">
        <Transition name="frontier-model-dialog">
          <div
            v-if="isModelDialogOpen && selectedCandidate && !hasSelectedModel"
            class="frontier-model-dialog"
            role="dialog"
            aria-modal="true"
            :aria-label="$t('frontier.create.modelResult')"
          >
            <button
              type="button"
              class="frontier-model-backdrop"
              :aria-label="$t('saveEntry.cancel')"
              @click="closeModelDialog"
            ></button>
            <section class="frontier-model-panel" :class="{ unsupported: !selectedCandidate.isCollectable }">
              <button
                type="button"
                class="frontier-model-close"
                :aria-label="$t('saveEntry.cancel')"
                @click="closeModelDialog"
              >
                <i class="pi pi-times"></i>
              </button>
              <p class="model-kicker">{{ $t('frontier.create.modelResult') }}</p>
              <h3>
                {{ selectedCandidate.isCollectable ? $t('frontier.create.dawntrailCollectableModel') : $t('frontier.create.noModelTitle') }}
              </h3>
              <p>
                {{ selectedCandidate.isCollectable ? $t('frontier.create.modelDescription') : $t('frontier.create.noModelDescription') }}
              </p>
              <footer class="frontier-model-actions">
                <button type="button" class="secondary-action" @click="closeModelDialog">
                  <span>{{ $t('saveEntry.cancel') }}</span>
                </button>
                <button
                  v-if="selectedCandidate.isCollectable"
                  type="button"
                  class="primary-action"
                  @click="startCollectableModel"
                >
                  <i class="pi pi-arrow-right"></i>
                  <span>{{ $t('frontier.create.startModel') }}</span>
                </button>
              </footer>
            </section>
          </div>
        </Transition>
      </Teleport>
    </template>
  </div>
</template>

<style scoped>
.frontier-page {
  width: min(100%, 72rem);
  margin: 0 auto;
  padding: 2rem 1.5rem 6rem;
  display: grid;
  gap: 1.25rem;
  animation: pageIn 0.35s ease both;
}
.frontier-page.is-create-mode {
  width: min(100%, 860px);
  padding: 2rem 1.5rem 6rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.create-guide-page {
  width: 100%;
  max-width: none;
  padding: 0;
  margin: 0;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: pageIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.frontier-page.is-workspace-mode {
  width: 100%;
  max-width: none;
  padding: 0 1rem 6rem;
  display: block;
}
.simulator-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 1.5rem 0 3rem;
}
.frontier-workspace-stack {
  display: grid;
  gap: 1rem;
}
.create-page-header {
  display: flex;
  flex-direction: column;
}
.create-page-title {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0 0 0.35rem 0;
  line-height: 1.2;
}
.data-scope-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(82, 168, 144, 0.1);
  border: 1px solid rgba(82, 168, 144, 0.25);
  border-radius: 20px;
  font-size: 0.78rem;
  color: #3d8b75;
  align-self: flex-start;
}
:global(.dark .data-scope-badge) {
  background: rgba(82, 168, 144, 0.12);
  border-color: rgba(82, 168, 144, 0.3);
  color: #52a890;
}
.data-scope-badge .pi {
  font-size: 0.78rem;
}
.search-section {
  position: relative;
}
.search-spinner,
.search-icon {
  color: #52a890;
}
.search-icon {
  color: #94a3b8;
}
.results-section {
  flex: 1;
}
.state-fade-enter-active,
.state-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.state-fade-enter-from,
.state-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 1rem;
}
.state-text {
  font-size: 0.9rem;
  color: #94a3b8;
  text-align: center;
  margin: 0;
}
.loading-animation {
  display: flex;
  gap: 8px;
  align-items: center;
}
.loading-orb {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #52a890;
  animation: bounce 1.2s ease-in-out infinite;
}
.loading-orb.delay-1 { animation-delay: 0.2s; }
.loading-orb.delay-2 { animation-delay: 0.4s; }
.idle-icon,
.empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}
.idle-icon {
  background: rgba(82, 168, 144, 0.1);
  color: #52a890;
}
.empty-icon {
  background: #f1f5f9;
  color: #94a3b8;
}
:global(.dark .empty-icon) {
  background: #1e293b;
  color: #64748b;
}
.error-state {
  max-width: 400px;
  margin: 0 auto;
}
.error-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
.error-text {
  color: #ef4444;
  line-height: 1.5;
}
.retry-btn {
  margin-top: 0.5rem;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  border: none;
  background: #52a890;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}
.retry-btn:hover {
  background: #3d8b75;
}
.results-count {
  font-size: 0.78rem;
  color: #94a3b8;
  padding: 0 4px 4px;
}
:global(.dark .results-count),
:global(.dark .state-text) {
  color: #94a3b8;
}
.page-title {
  margin: 0 0 0.35rem;
  font-size: 1.9rem;
  font-weight: 900;
}
.page-description,
.frontier-model-panel p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.65;
}
:global(html.dark) .page-description,
:global(html.dark) .frontier-model-panel p {
  color: #cbd5e1;
}
.panel {
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: white;
  padding: 1rem;
  box-shadow: 0 2px 10px rgb(15 23 42 / 0.04);
}
:global(html.dark) .panel {
  border-color: #334155;
  background: #0f172a;
}
.empty-row {
  display: flex;
  gap: 0.85rem;
}
.empty-row h3,
.frontier-model-panel h3 {
  margin: 0 0 0.2rem;
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 900;
}
:global(html.dark) .empty-row h3,
:global(html.dark) .frontier-model-panel h3 {
  color: #f8fafc;
}
.search-field {
  width: 100%;
}
:deep(.search-input) {
  width: 100% !important;
  border-radius: 16px !important;
  padding: 1rem 3rem !important;
  background: white !important;
  border: 1.5px solid #e2e8f0 !important;
  font-size: 1rem !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
  transition: all 0.2s !important;
}
:global(.dark .search-input) {
  background: #1e293b !important;
  border-color: #334155 !important;
  color: #f1f5f9 !important;
}
:deep(.search-input:focus) {
  border-color: #52a890 !important;
  box-shadow: 0 0 0 4px rgba(82, 168, 144, 0.15), 0 2px 8px rgba(0, 0, 0, 0.06) !important;
}
:deep(.search-input:disabled) {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
}
.results-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
.frontier-model-dialog {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.frontier-model-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgb(15 23 42 / 0.48);
  cursor: pointer;
}
.frontier-model-panel {
  position: relative;
  z-index: 1;
  width: min(100%, 28rem);
  display: grid;
  gap: 0.85rem;
  border: 1px solid #dbe3ee;
  border-radius: 18px;
  background: white;
  padding: 1.15rem;
  box-shadow: 0 24px 60px rgb(15 23 42 / 0.22);
}
.frontier-model-panel.unsupported {
  border-color: #fed7aa;
}
.frontier-model-close {
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 10px;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
}
.frontier-model-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.2rem;
}
:global(html.dark) .frontier-model-panel {
  border-color: #334155;
  background: #0f172a;
}
:global(html.dark) .frontier-model-close {
  background: #1e293b;
  color: #cbd5e1;
}
.frontier-model-dialog-enter-active,
.frontier-model-dialog-leave-active {
  transition: opacity 0.18s ease;
}
.frontier-model-dialog-enter-active .frontier-model-panel,
.frontier-model-dialog-leave-active .frontier-model-panel {
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.frontier-model-dialog-enter-from,
.frontier-model-dialog-leave-to {
  opacity: 0;
}
.frontier-model-dialog-enter-from .frontier-model-panel,
.frontier-model-dialog-leave-to .frontier-model-panel {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
.model-kicker,
.rule-order {
  margin: 0;
  color: #0f766e;
  font-size: 0.72rem;
  font-weight: 900;
}
.primary-action,
.secondary-action,
.primary-link,
.text-action {
  min-height: 2.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border: 0;
  border-radius: 12px;
  padding: 0.55rem 0.85rem;
  font-weight: 900;
  cursor: pointer;
}
.primary-action,
.primary-link {
  background: #52a890;
  color: white;
}
.secondary-action {
  border: 1px solid #dbe3ee;
  background: #f8fafc;
  color: #334155;
}
.text-action {
  justify-self: start;
  background: transparent;
  color: #0f766e;
  padding-inline: 0.15rem;
}
.primary-action:disabled,
.secondary-action:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
:global(html.dark) .secondary-action {
  border-color: #334155;
  background: #1e293b;
  color: #e2e8f0;
}
@media (min-width: 768px) {
  .frontier-page.is-create-mode {
    padding: 2.5rem 2rem;
  }
  .create-page-title {
    font-size: 2.1rem;
  }
}
@media (min-width: 1024px) {
  .results-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 560px) {
  .frontier-page {
    padding-inline: 1rem;
  }
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
