<script setup lang="ts">
defineOptions({ name: 'FavoriteItems' });

import { computed, ref } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import GatheringItemCard from '../components/GatheringItemCard.vue';
import { useFavoriteItems } from '../composables/useFavoriteItems';
import { useSimulatorStats } from '../composables/useSimulatorStats';
import { useSolver } from '../composables/useSolver';
import { getGatherableItemById, isGameDataLoading } from '../services/gameData';
import type { GatherableItem, GatheringJob } from '../types/game';
import { gatherableItemSupportsJob } from '../utils/gatherableItemJobs';

type FavoriteFilterJob = GatheringJob;
type FavoriteFilterSystem = 'regular' | 'collectable' | 'crystal';

interface FavoriteItemFilters {
  text: string;
  glvMin: string;
  glvMax: string;
  jobs: FavoriteFilterJob[];
  systems: FavoriteFilterSystem[];
}

const ALL_JOBS: FavoriteFilterJob[] = ['miner', 'botanist'];
const ALL_SYSTEMS: FavoriteFilterSystem[] = ['regular', 'collectable', 'crystal'];
const FILTER_STORAGE_KEY = 'frozen-rabbit-tome-favorite-item-filters';

const { t } = useI18n();
const router = useRouter();
const { favoriteItems, favoriteCount, removeFavorite } = useFavoriteItems();
const { setSelectedItem: setSolverItem } = useSolver();
const { setSelectedItem: setSimulatorItem } = useSimulatorStats();
const selectedItem = ref<GatherableItem | null>(null);
const isFilterDialogOpen = ref(false);
const filters = useLocalStorage<FavoriteItemFilters>(FILTER_STORAGE_KEY, {
  text: '',
  glvMin: '',
  glvMax: '',
  jobs: [],
  systems: []
});
filters.value = normalizeFilters(filters.value);

const displayItems = computed<GatherableItem[]>(() => favoriteItems.value.reduce<GatherableItem[]>((items, favorite) => {
    const item = getGatherableItemById(favorite.itemId);
    if (!item) return items;

    items.push({
      ...item,
      isCollectable: favorite.isCollectable ?? item.isCollectable,
      isCrystalGathering: favorite.isCrystalGathering ?? item.isCrystalGathering
    });

    return items;
  }, []));

const filteredItems = computed(() => displayItems.value.filter((item) => {
  const query = filterText();
  if (query && !item.nameLocale.toLowerCase().includes(query) && !item.nameEn.toLowerCase().includes(query)) {
    return false;
  }

  const minGlv = parseOptionalNumber(filters.value.glvMin);
  const maxGlv = parseOptionalNumber(filters.value.glvMax);
  if (minGlv !== null && item.glv < minGlv) return false;
  if (maxGlv !== null && item.glv > maxGlv) return false;

  const selectedJobs = filterJobs();
  if (isLimitedSelection(selectedJobs, ALL_JOBS) && !selectedJobs.some((job) => gatherableItemSupportsJob(item, job))) {
    return false;
  }

  const selectedSystems = filterSystems();
  if (isLimitedSelection(selectedSystems, ALL_SYSTEMS) && !selectedSystems.includes(itemSystem(item))) {
    return false;
  }

  return true;
}));

const hasActiveFilters = computed(() => {
  return !!filterText()
    || parseOptionalNumber(filters.value.glvMin) !== null
    || parseOptionalNumber(filters.value.glvMax) !== null
    || isLimitedSelection(filterJobs(), ALL_JOBS)
    || isLimitedSelection(filterSystems(), ALL_SYSTEMS);
});

const activeFilterCount = computed(() => {
  let count = 0;
  if (filterText()) count += 1;
  if (parseOptionalNumber(filters.value.glvMin) !== null || parseOptionalNumber(filters.value.glvMax) !== null) count += 1;
  if (isLimitedSelection(filterJobs(), ALL_JOBS)) count += 1;
  if (isLimitedSelection(filterSystems(), ALL_SYSTEMS)) count += 1;
  return count;
});

function normalizeFilters(value: Partial<FavoriteItemFilters> | null | undefined): FavoriteItemFilters {
  return {
    text: value?.text == null ? '' : String(value.text),
    glvMin: value?.glvMin == null ? '' : String(value.glvMin),
    glvMax: value?.glvMax == null ? '' : String(value.glvMax),
    jobs: Array.isArray(value?.jobs)
      ? value.jobs.filter((job): job is FavoriteFilterJob => ALL_JOBS.includes(job as FavoriteFilterJob))
      : [],
    systems: Array.isArray(value?.systems)
      ? value.systems.filter((system): system is FavoriteFilterSystem => ALL_SYSTEMS.includes(system as FavoriteFilterSystem))
      : []
  };
}

function filterText() {
  return String(filters.value.text ?? '').trim().toLowerCase();
}

function filterJobs() {
  return Array.isArray(filters.value.jobs) ? filters.value.jobs : [];
}

function filterSystems() {
  return Array.isArray(filters.value.systems) ? filters.value.systems : [];
}

function parseOptionalNumber(value: unknown) {
  const normalizedValue = String(value ?? '').trim();
  if (!normalizedValue) return null;
  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? parsed : null;
}

function isLimitedSelection<T>(selected: T[], allOptions: T[]) {
  return selected.length > 0 && selected.length < allOptions.length;
}

function itemSystem(item: GatherableItem): FavoriteFilterSystem {
  if (item.isCollectable) return 'collectable';
  if (item.isCrystalGathering) return 'crystal';
  return 'regular';
}

function toggleJob(job: FavoriteFilterJob) {
  filters.value.jobs = toggleArrayValue(filterJobs(), job);
}

function toggleSystem(system: FavoriteFilterSystem) {
  filters.value.systems = toggleArrayValue(filterSystems(), system);
}

function toggleArrayValue<T>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((current) => current !== value)
    : [...values, value];
}

function clearFilters() {
  filters.value = {
    text: '',
    glvMin: '',
    glvMax: '',
    jobs: [],
    systems: []
  };
}

function closeFilterDialog() {
  isFilterDialogOpen.value = false;
}

function openActionDialog(item: GatherableItem) {
  selectedItem.value = item;
}

function closeActionDialog() {
  selectedItem.value = null;
}

function createGuide() {
  if (!selectedItem.value) return;

  setSolverItem(selectedItem.value);
  closeActionDialog();
  router.push('/solver');
}

function createExperiment() {
  if (!selectedItem.value) return;

  setSimulatorItem(selectedItem.value);
  closeActionDialog();
  router.push({ path: '/simulator', query: { new: '1' } });
}
</script>

<template>
  <div class="favorite-items-page">
    <header class="page-header">
      <div>
        <h2 class="page-title text-soft-green-800 dark:text-soft-green-400">{{ t('favoriteItems.title') }}</h2>
        <p class="page-subtitle text-slate-500 dark:text-slate-400">{{ t('favoriteItems.subtitle') }}</p>
      </div>
      <button
        class="filter-trigger"
        :class="{ 'is-active': hasActiveFilters }"
        type="button"
        :aria-label="t('favoriteItems.filters.open')"
        :title="t('favoriteItems.filters.open')"
        @click="isFilterDialogOpen = true"
      >
        <i class="pi pi-filter"></i>
        <span v-if="hasActiveFilters" class="filter-active-dot">{{ activeFilterCount }}</span>
      </button>
    </header>

    <div v-if="isGameDataLoading && favoriteCount > 0" class="state-container">
      <div class="state-icon">
        <i class="pi pi-spin pi-spinner"></i>
      </div>
      <p>{{ t('createGuide.loading') }}</p>
    </div>

    <div v-else-if="displayItems.length === 0" class="state-container">
      <div class="state-icon">
        <i class="pi pi-heart"></i>
      </div>
      <h3>{{ t('favoriteItems.emptyTitle') }}</h3>
      <p>{{ t('favoriteItems.emptyDesc') }}</p>
    </div>

    <div v-else-if="filteredItems.length === 0" class="state-container">
      <div class="state-icon">
        <i class="pi pi-filter"></i>
      </div>
      <h3>{{ t('favoriteItems.filters.emptyTitle') }}</h3>
      <p>{{ t('favoriteItems.filters.emptyDesc') }}</p>
      <button class="clear-filter-button" type="button" @click="clearFilters">
        {{ t('favoriteItems.filters.clear') }}
      </button>
    </div>

    <div v-else class="favorite-grid">
      <GatheringItemCard
        v-for="item in filteredItems"
        :key="item.itemId"
        :item="item"
        favoriteable
        is-favorite
        @toggle-favorite="removeFavorite(item.itemId)"
        @select="openActionDialog"
      />
    </div>

    <Teleport to="body">
      <Transition name="favorite-dialog">
        <div
          v-if="isFilterDialogOpen"
          class="favorite-dialog-root"
          role="dialog"
          aria-modal="true"
          :aria-label="t('favoriteItems.filters.title')"
          @keydown.esc="closeFilterDialog"
        >
          <button class="favorite-dialog-backdrop" type="button" :aria-label="t('favoriteItems.filters.close')" @click="closeFilterDialog"></button>
          <section class="favorite-dialog-panel filter-dialog-panel">
            <header class="favorite-dialog-header">
              <div>
                <h3 class="filter-dialog-title">{{ t('favoriteItems.filters.title') }}</h3>
              </div>
              <button class="favorite-dialog-close" type="button" :aria-label="t('favoriteItems.filters.close')" @click="closeFilterDialog">
                <i class="pi pi-times"></i>
              </button>
            </header>

            <div class="filter-form">
              <label class="filter-field">
                <span>{{ t('favoriteItems.filters.text') }}</span>
                <input
                  v-model="filters.text"
                  class="filter-input"
                  type="search"
                  :placeholder="t('favoriteItems.filters.textPlaceholder')"
                  autocomplete="off"
                />
              </label>

              <div class="filter-row">
                <label class="filter-field">
                  <span>{{ t('favoriteItems.filters.glvMin') }}</span>
                  <input v-model="filters.glvMin" class="filter-input" type="number" min="0" inputmode="numeric" :placeholder="t('favoriteItems.filters.noLimit')" />
                </label>
                <label class="filter-field">
                  <span>{{ t('favoriteItems.filters.glvMax') }}</span>
                  <input v-model="filters.glvMax" class="filter-input" type="number" min="0" inputmode="numeric" :placeholder="t('favoriteItems.filters.noLimit')" />
                </label>
              </div>

              <fieldset class="filter-fieldset">
                <legend>{{ t('favoriteItems.filters.jobs') }}</legend>
                <div class="filter-choice-grid">
                  <button
                    v-for="job in ALL_JOBS"
                    :key="job"
                    class="filter-choice"
                    :class="{ 'is-selected': filterJobs().includes(job) }"
                    type="button"
                    @click="toggleJob(job)"
                  >
                    <i class="pi" :class="filterJobs().includes(job) ? 'pi-check-circle' : 'pi-circle'"></i>
                    {{ t(`game.jobs.${job}`) }}
                  </button>
                </div>
              </fieldset>

              <fieldset class="filter-fieldset">
                <legend>{{ t('favoriteItems.filters.systems') }}</legend>
                <div class="filter-choice-grid">
                  <button
                    v-for="system in ALL_SYSTEMS"
                    :key="system"
                    class="filter-choice"
                    :class="{ 'is-selected': filterSystems().includes(system) }"
                    type="button"
                    @click="toggleSystem(system)"
                  >
                    <i class="pi" :class="filterSystems().includes(system) ? 'pi-check-circle' : 'pi-circle'"></i>
                    {{ t(`favoriteItems.filters.systemOptions.${system}`) }}
                  </button>
                </div>
              </fieldset>
            </div>

            <footer class="filter-dialog-footer">
              <button class="filter-secondary-button" type="button" @click="clearFilters">
                {{ t('favoriteItems.filters.clear') }}
              </button>
              <button class="filter-primary-button" type="button" @click="closeFilterDialog">
                {{ t('favoriteItems.filters.done') }}
              </button>
            </footer>
          </section>
        </div>
      </Transition>

      <Transition name="favorite-dialog">
        <div
          v-if="selectedItem"
          class="favorite-dialog-root"
          role="dialog"
          aria-modal="true"
          :aria-label="t('favoriteItems.dialog.title', { item: selectedItem.nameLocale })"
          @keydown.esc="closeActionDialog"
        >
          <button class="favorite-dialog-backdrop" type="button" :aria-label="t('favoriteItems.dialog.close')" @click="closeActionDialog"></button>
          <section class="favorite-dialog-panel">
            <header class="favorite-dialog-header">
              <div class="favorite-dialog-item">
                <img v-if="selectedItem.iconUrl" :src="selectedItem.iconUrl" :alt="selectedItem.nameEn" class="favorite-dialog-icon" />
                <div v-else class="favorite-dialog-icon placeholder">
                  <i class="pi pi-box"></i>
                </div>
                <div>
                  <span class="favorite-dialog-kicker">{{ t('favoriteItems.dialog.kicker') }}</span>
                  <h3>{{ selectedItem.nameLocale }}</h3>
                </div>
              </div>
              <button class="favorite-dialog-close" type="button" :aria-label="t('favoriteItems.dialog.close')" @click="closeActionDialog">
                <i class="pi pi-times"></i>
              </button>
            </header>

            <div class="favorite-action-list">
              <button class="favorite-action-card" type="button" @click="createGuide">
                <i class="pi pi-pencil"></i>
                <span>
                  <strong>{{ t('nav.createGuide') }}</strong>
                  <small>{{ t('favoriteItems.dialog.guideDesc') }}</small>
                </span>
              </button>

              <button class="favorite-action-card" type="button" @click="createExperiment">
                <i class="pi pi-chart-line"></i>
                <span>
                  <strong>{{ t('nav.createExperiment') }}</strong>
                  <small>{{ t('favoriteItems.dialog.experimentDesc') }}</small>
                </span>
              </button>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.favorite-items-page {
  padding: 2rem 1.5rem;
  max-width: 860px;
  margin: 0 auto;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: pageIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@media (min-width: 768px) {
  .favorite-items-page {
    padding: 2.5rem 2rem;
  }
}

@keyframes pageIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0 0 0.35rem 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 0.9rem;
  margin: 0;
}

.filter-trigger {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 999px;
  border: 1px solid rgba(82, 168, 144, 0.22);
  background: rgba(255, 255, 255, 0.9);
  color: #52a890;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease, transform 0.18s ease;
  flex-shrink: 0;
}

.filter-trigger .pi {
  font-size: 1.12rem;
}

.filter-trigger:hover,
.filter-trigger:focus-visible {
  background: rgba(232, 245, 233, 0.95);
  border-color: rgba(82, 168, 144, 0.38);
  transform: translateY(-1px);
}

.filter-trigger:focus-visible {
  outline: 3px solid rgba(82, 168, 144, 0.18);
  outline-offset: 2px;
}

.filter-trigger.is-active {
  background: #52a890;
  border-color: #52a890;
  color: white;
  box-shadow: 0 10px 28px rgba(82, 168, 144, 0.28);
}

:global(.dark .filter-trigger) {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(82, 168, 144, 0.28);
}

:global(.dark .filter-trigger:hover),
:global(.dark .filter-trigger:focus-visible) {
  background: rgba(30, 41, 59, 0.95);
}

:global(.dark .filter-trigger.is-active) {
  background: #3d8b75;
  border-color: #52a890;
  color: white;
}

.filter-active-dot {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  color: white;
  font-size: 0.72rem;
  font-weight: 900;
  border: 2px solid white;
}

:global(.dark .filter-active-dot) {
  background: #f8fafc;
  color: #0f172a;
  border-color: #020617;
}

.favorite-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 1024px) {
  .favorite-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.state-container {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #94a3b8;
  text-align: center;
}

.state-container h3,
.state-container p {
  margin: 0;
}

.state-container h3 {
  color: #475569;
  font-size: 1.05rem;
}

:global(.dark .state-container h3) {
  color: #cbd5e1;
}

.state-icon {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(82, 168, 144, 0.1);
  color: #52a890;
  font-size: 1.4rem;
}

.clear-filter-button {
  margin-top: 0.35rem;
  border: 0;
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  background: #52a890;
  color: white;
  font-weight: 800;
  cursor: pointer;
}

.favorite-dialog-root {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.favorite-dialog-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(15, 23, 42, 0.58);
  backdrop-filter: blur(10px);
  cursor: pointer;
}

.favorite-dialog-panel {
  position: relative;
  width: min(100%, 460px);
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 22px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
  padding: 1.35rem;
}

:global(.dark .favorite-dialog-panel) {
  background: rgba(15, 23, 42, 0.98);
  border-color: rgba(51, 65, 85, 0.95);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
}

.filter-dialog-panel {
  width: min(100%, 520px);
}

.filter-dialog-title {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 900;
  color: #3d8b75;
  line-height: 1.18;
}

:global(.dark .filter-dialog-title) {
  color: #52a890;
}

.filter-form {
  display: grid;
  gap: 1rem;
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

@media (max-width: 520px) {
  .filter-row {
    grid-template-columns: 1fr;
  }
}

.filter-field {
  display: grid;
  gap: 0.4rem;
}

.filter-field span,
.filter-fieldset legend {
  color: #475569;
  font-size: 0.82rem;
  font-weight: 900;
}

:global(.dark .filter-field span),
:global(.dark .filter-fieldset legend) {
  color: #cbd5e1;
}

.filter-input {
  width: 100%;
  border-radius: 14px;
  border: 1px solid #dbe5df;
  background: rgba(248, 250, 252, 0.95);
  color: #0f172a;
  font-weight: 700;
  padding: 0.75rem 0.9rem;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.filter-input:focus {
  border-color: #52a890;
  box-shadow: 0 0 0 4px rgba(82, 168, 144, 0.14);
  background: white;
}

:global(.dark .filter-input) {
  background: rgba(30, 41, 59, 0.82);
  border-color: #334155;
  color: #f8fafc;
}

:global(.dark .filter-input:focus) {
  background: rgba(30, 41, 59, 1);
}

.filter-fieldset {
  min-width: 0;
  border: 0;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.5rem;
}

.filter-choice-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-choice {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  background: rgba(248, 250, 252, 0.9);
  color: #475569;
  font-weight: 850;
  padding: 0.45rem 0.75rem;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.filter-choice:hover,
.filter-choice:focus-visible {
  border-color: rgba(82, 168, 144, 0.36);
  transform: translateY(-1px);
}

.filter-choice.is-selected {
  background: rgba(82, 168, 144, 0.13);
  border-color: rgba(82, 168, 144, 0.38);
  color: #256f5e;
}

:global(.dark .filter-choice) {
  background: rgba(30, 41, 59, 0.78);
  border-color: rgba(148, 163, 184, 0.22);
  color: #cbd5e1;
}

:global(.dark .filter-choice.is-selected) {
  background: rgba(82, 168, 144, 0.2);
  border-color: rgba(82, 168, 144, 0.42);
  color: #86efac;
}

.filter-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 1.15rem;
}

.filter-primary-button,
.filter-secondary-button {
  border: 0;
  border-radius: 12px;
  padding: 0.68rem 1rem;
  font-weight: 900;
  cursor: pointer;
  min-height: 42px;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.filter-primary-button:hover,
.filter-secondary-button:hover,
.filter-primary-button:focus-visible,
.filter-secondary-button:focus-visible {
  transform: translateY(-1px);
}

.filter-primary-button:focus-visible,
.filter-secondary-button:focus-visible {
  outline: 3px solid rgba(82, 168, 144, 0.18);
  outline-offset: 2px;
}

.filter-primary-button {
  background: #52a890;
  color: white;
  box-shadow: 0 8px 20px rgba(82, 168, 144, 0.2);
}

.filter-primary-button:hover,
.filter-primary-button:focus-visible {
  background: #3d8b75;
}

.filter-secondary-button {
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(248, 250, 252, 0.92);
  color: #475569;
}

.filter-secondary-button:hover,
.filter-secondary-button:focus-visible {
  background: rgba(232, 245, 233, 0.75);
  color: #256f5e;
}

:global(.dark .filter-secondary-button) {
  background: rgba(30, 41, 59, 0.82);
  border-color: rgba(148, 163, 184, 0.22);
  color: #cbd5e1;
}

:global(.dark .filter-secondary-button:hover),
:global(.dark .filter-secondary-button:focus-visible) {
  background: rgba(82, 168, 144, 0.18);
  color: #86efac;
}

.favorite-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.favorite-dialog-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
}

.favorite-dialog-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #f1f5f9;
  object-fit: contain;
  image-rendering: pixelated;
  flex-shrink: 0;
}

.favorite-dialog-icon.placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

:global(.dark .favorite-dialog-icon) {
  background: #1e293b;
}

.favorite-dialog-kicker {
  display: block;
  font-size: 0.75rem;
  font-weight: 800;
  color: #52a890;
  line-height: 1.2;
}

.favorite-dialog-item h3 {
  margin: 0.2rem 0 0;
  font-size: 1.22rem;
  font-weight: 900;
  line-height: 1.25;
  color: #0f172a;
}

:global(.dark .favorite-dialog-item h3) {
  color: #f8fafc;
}

.favorite-dialog-close {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(248, 250, 252, 0.75);
  color: #64748b;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.favorite-dialog-close:hover,
.favorite-dialog-close:focus-visible {
  background: rgba(232, 245, 233, 0.85);
  border-color: rgba(82, 168, 144, 0.28);
  color: #3d8b75;
}

.favorite-action-list {
  display: grid;
  gap: 0.75rem;
}

.favorite-action-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1rem;
  border-radius: 18px;
  border: 1px solid rgba(82, 168, 144, 0.2);
  background: rgba(232, 245, 233, 0.55);
  color: #1e293b;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.favorite-action-card:hover,
.favorite-action-card:focus-visible {
  border-color: rgba(82, 168, 144, 0.45);
  background: rgba(232, 245, 233, 0.9);
  transform: translateY(-1px);
}

.favorite-action-card:focus-visible {
  outline: 3px solid rgba(82, 168, 144, 0.2);
  outline-offset: 2px;
}

:global(.dark .favorite-action-card) {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(82, 168, 144, 0.26);
  color: #f8fafc;
}

:global(.dark .favorite-action-card:hover),
:global(.dark .favorite-action-card:focus-visible) {
  background: rgba(30, 41, 59, 1);
}

.favorite-action-card > .pi {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #52a890;
  color: white;
  flex-shrink: 0;
}

.favorite-action-card span {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.favorite-action-card strong {
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.25;
  color: #0f172a;
}

.favorite-action-card small {
  color: #64748b;
  line-height: 1.45;
}

:global(.dark .favorite-action-card small) {
  color: #94a3b8;
}

:global(.dark .favorite-action-card strong) {
  color: #f8fafc;
}

.favorite-dialog-enter-active,
.favorite-dialog-leave-active {
  transition: opacity 0.18s ease;
}

.favorite-dialog-enter-from,
.favorite-dialog-leave-to {
  opacity: 0;
}
</style>
