<script setup lang="ts">
defineOptions({ name: 'FrontierStudies' });

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useLocalStorage } from '@vueuse/core';
import Button from 'primevue/button';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import SelectButton from 'primevue/selectbutton';
import SaveEntryDialog from '../components/SaveEntryDialog.vue';
import FloatingJsonImportButton from '../components/FloatingJsonImportButton.vue';
import JsonImportErrorDialog from '../components/JsonImportErrorDialog.vue';
import { useSettings } from '../composables/useSettings';
import {
  useFrontierCollectableStudies
} from '../frontier/collectable/frontierCollectableStorage';
import {
  FrontierCollectableJsonImportError,
  parseFrontierCollectableJsonImport,
  type FrontierCollectableJsonImportProjection
} from '../frontier/collectable/frontierCollectableExport';
import { getFrontierCollectableActionIcon } from '../frontier/collectable/frontierCollectableActions';
import { getGatherableItemById, getItemEnglishName, getItemIcon, getItemName, currentLanguage } from '../services/gameData';
import type { FrontierCollectableActionKind, FrontierCollectableStudy } from '../frontier/collectable/frontierCollectableTypes';
import type { GatheringJob } from '../types/game';
import { gatherableItemJobs } from '../utils/gatherableItemJobs';

const { frontierSettings } = useSettings();
const { t, locale } = useI18n();
const router = useRouter();
const { studies, deleteStudy, saveStudy, searchQuery } = useFrontierCollectableStudies();
const pendingImport = ref<FrontierCollectableJsonImportProjection | null>(null);
const isImportSaveDialogOpen = ref(false);
const importErrorKey = ref<string | null>(null);
const displayMode = useLocalStorage<'compact' | 'detailed'>('frozen-rabbit-tome-frontier-studies-display-mode', 'detailed');
const displayModeOptions = computed(() => [
  { label: t('common.displayModes.compact'), value: 'compact' },
  { label: t('common.displayModes.detailed'), value: 'detailed' }
]);

const filteredStudies = computed(() => {
  currentLanguage.value;
  const query = searchQuery.value.trim().toLowerCase();
  const sorted = [...studies.value].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  if (!query) return sorted;

  return sorted.filter((study) => {
    const customName = (study.name ?? '').toLowerCase();
    const localizedName = getItemName(study.itemId).toLowerCase();
    const englishName = getItemEnglishName(study.itemId).toLowerCase();
    return customName.includes(query)
      || localizedName.includes(query)
      || englishName.includes(query)
      || study.itemId.toString().includes(query)
      || study.kind.includes(query);
  });
});

function openStudy(study: FrontierCollectableStudy) {
  router.push({ path: '/frontier', query: { study: study.id } });
}

function itemMeta(study: FrontierCollectableStudy) {
  return getGatherableItemById(study.itemId);
}

function itemJobs(study: FrontierCollectableStudy) {
  return gatherableItemJobs(itemMeta(study));
}

function primaryJob(study: FrontierCollectableStudy): GatheringJob {
  return itemJobs(study)[0] ?? 'miner';
}

function itemName(study: FrontierCollectableStudy) {
  return getItemName(study.itemId);
}

function displayName(study: FrontierCollectableStudy) {
  return study.name?.trim() || itemName(study);
}

function shouldShowItemSubtitle(study: FrontierCollectableStudy) {
  return !!study.name?.trim() && study.name.trim() !== itemName(study);
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatScore(value?: number) {
  return typeof value === 'number' ? Number(value.toFixed(2)).toString() : '-';
}

function formatChance(value?: number) {
  return typeof value === 'number' ? Number(value.toFixed(2)).toString() : '-';
}

function formatStats(study: FrontierCollectableStudy) {
  return `${study.input.stats.level}/${study.input.stats.gathering}/${study.input.stats.perception}`;
}

function formatGp(study: FrontierCollectableStudy) {
  return `${study.input.temporaryGp}/${study.input.stats.gp}`;
}

function formatFood(study: FrontierCollectableStudy) {
  if (!study.input.food?.foodId) return t('tomeLibrary.noFood');
  return `${getItemName(study.input.food.foodId)} ${t(`solver.food.${study.input.food.quality}`)}`;
}

function formatNodeBonuses(study: FrontierCollectableStudy) {
  return t('tomeLibrary.nodeState.collectable', {
    gathering: study.input.nodeBonuses.gatheringCount
  });
}

function relicBonusLabel(study: FrontierCollectableStudy) {
  return study.input.hasRelicToolBonus ? t('frontier.strategy.boolean.true') : t('frontier.strategy.boolean.false');
}

function enabledRules(study: FrontierCollectableStudy) {
  return study.strategy.filter((rule) => rule.enabled).length;
}

function previewRules(study: FrontierCollectableStudy) {
  return study.strategy.filter((rule) => rule.enabled).slice(0, 3);
}

function previewActions(actions: FrontierCollectableActionKind[]) {
  return actions.slice(0, 5);
}

function actionIcon(study: FrontierCollectableStudy, action: FrontierCollectableActionKind) {
  return getFrontierCollectableActionIcon(action, primaryJob(study));
}

async function handleImportFile(file: File) {
  try {
    pendingImport.value = parseFrontierCollectableJsonImport(await file.text());
    importErrorKey.value = null;
    isImportSaveDialogOpen.value = true;
  } catch (error) {
    pendingImport.value = null;
    importErrorKey.value = error instanceof FrontierCollectableJsonImportError ? error.message : 'unknown';
  }
}

function confirmImportSave(name: string) {
  if (!pendingImport.value) return;
  const saved = saveStudy({
    ...pendingImport.value.study,
    name
  });
  pendingImport.value = null;
  router.push({ path: '/frontier', query: { study: saved.id } });
}

function importErrorDescription() {
  const key = importErrorKey.value ?? 'unknown';
  return t(`frontier.json.errors.${key}`);
}
</script>

<template>
  <div class="frontier-studies-page">
    <header class="page-header">
      <div>
        <h2 class="page-title text-soft-green-800 dark:text-soft-green-400">{{ t('frontier.studies.title') }}</h2>
        <p class="page-subtitle text-slate-500 dark:text-slate-400">{{ t('frontier.studies.description') }}</p>
      </div>

      <IconField v-if="frontierSettings.enabled" class="search-field">
        <InputIcon>
          <i class="pi pi-search search-icon"></i>
        </InputIcon>
        <InputText
          v-model="searchQuery"
          :placeholder="t('frontier.studies.searchPlaceholder')"
          class="search-input"
          autocomplete="off"
        />
        <InputIcon v-if="searchQuery" style="cursor:pointer" @click="searchQuery = ''">
          <i class="pi pi-times clear-icon"></i>
        </InputIcon>
      </IconField>

      <div v-if="frontierSettings.enabled" class="display-mode-toolbar" :aria-label="t('common.displayMode')">
        <SelectButton
          v-model="displayMode"
          :options="displayModeOptions"
          optionLabel="label"
          optionValue="value"
          class="display-mode-toggle"
        />
      </div>
    </header>

    <div v-if="!frontierSettings.enabled" class="disabled-panel">
      <div class="empty-icon">
        <i class="pi pi-lock"></i>
      </div>
      <div class="disabled-content">
        <h3>{{ t('frontier.disabled.title') }}</h3>
        <p>{{ t('frontier.disabled.description') }}</p>
      </div>
      <Button
        icon="pi pi-cog"
        :label="t('frontier.disabled.action')"
        class="p-button-sm p-button-primary disabled-action"
        @click="router.push('/settings')"
      />
    </div>

    <div v-else-if="filteredStudies.length === 0" class="empty-state">
      <div class="empty-icon">
        <i class="pi pi-folder-open"></i>
      </div>
      <h3>{{ searchQuery ? t('frontier.studies.emptySearchTitle') : t('frontier.studies.emptyTitle') }}</h3>
      <p>{{ searchQuery ? t('frontier.studies.emptySearchDescription') : t('frontier.studies.emptyDescription') }}</p>
    </div>

    <div v-else class="study-list">
      <article
        v-for="study in filteredStudies"
        :key="study.id"
        class="study-card"
        :class="{ 'is-compact': displayMode === 'compact' }"
      >
        <div class="item-section">
          <div class="item-icon-wrap">
            <img
              v-if="getItemIcon(study.itemId)"
              :src="getItemIcon(study.itemId)"
              :alt="displayName(study)"
              class="item-icon"
              loading="lazy"
            />
            <i v-else class="pi pi-box text-slate-400"></i>
          </div>

          <div class="item-info">
            <h3>{{ displayName(study) }}</h3>
            <p v-if="shouldShowItemSubtitle(study)" class="item-subtitle">{{ itemName(study) }}</p>
            <div class="item-meta">
              <span class="item-glv-badge">{{ t('createGuide.glv') }} {{ itemMeta(study)?.glv ?? '-' }}</span>
              <span
                v-for="job in itemJobs(study)"
                :key="job"
                class="item-job-badge"
              >
                {{ t(`game.jobs.${job}`) }}
              </span>
              <span v-if="itemJobs(study).length === 0" class="item-job-badge">-</span>
              <span class="item-frontier-badge">
                <i class="pi pi-compass"></i>
                {{ t('frontier.create.dawntrailCollectableModel') }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="displayMode === 'compact'" class="compact-action-bar action-bar">
          <Button
            icon="pi pi-copy"
            :label="t('frontier.studies.open')"
            class="p-button-sm p-button-text library-action"
            @click="openStudy(study)"
          />
          <Button
            icon="pi pi-trash"
            :label="t('frontier.studies.delete')"
            class="p-button-sm p-button-text p-button-danger library-action"
            @click="deleteStudy(study.id)"
          />
        </div>

        <div v-if="displayMode === 'detailed'" class="summary-info-strip">
          <div class="info-group">
            <span>{{ t('experimentDatabase.rows.playerStats') }}</span>
            <strong>{{ formatStats(study) }}</strong>
          </div>
          <div class="info-group">
            <span>{{ t('experimentDatabase.rows.gpState') }}</span>
            <strong>{{ formatGp(study) }}</strong>
          </div>
          <div class="info-group">
            <span>{{ t('experimentDatabase.rows.nodeBonuses') }}</span>
            <strong>{{ formatNodeBonuses(study) }}</strong>
          </div>
          <div class="info-group food">
            <span>{{ t('tomeLibrary.rows.food') }}</span>
            <strong>{{ formatFood(study) }}</strong>
          </div>
          <div class="info-group">
            <span>{{ t('tomeLibrary.rows.relicBonus') }}</span>
            <strong>{{ relicBonusLabel(study) }}</strong>
          </div>
          <div class="info-group objective-info">
            <span>{{ t('frontier.profile.bucketCount') }}</span>
            <strong>{{ study.probabilityProfile.brazenBuckets.length }}</strong>
          </div>
        </div>

        <div v-if="displayMode === 'detailed'" class="rotation-plan-stats">
          <div class="is-primary-metric">
            <span>{{ t('frontier.analysis.expectedScore') }}</span>
            <strong>{{ formatScore(study.lastAnalysisSnapshot?.expectedScore) }}</strong>
          </div>
          <div>
            <span>{{ t('frontier.analysis.maxScore') }}</span>
            <strong>{{ formatScore(study.lastAnalysisSnapshot?.maxScore) }}</strong>
            <small>{{ t('solver.strategy.yieldChance', { chance: formatChance(study.lastAnalysisSnapshot?.maxScoreChance) }) }}</small>
          </div>
          <div>
            <span>{{ t('frontier.analysis.minScore') }}</span>
            <strong>{{ formatScore(study.lastAnalysisSnapshot?.minScore) }}</strong>
            <small>{{ t('solver.strategy.yieldChance', { chance: formatChance(study.lastAnalysisSnapshot?.minScoreChance) }) }}</small>
          </div>
        </div>

        <div v-if="displayMode === 'detailed'" class="rotation-preview-list">
          <div class="rotation-strip collectable-strategy-strip">
            <h4>{{ t('experimentDatabase.rotations.strategyPreview') }}</h4>
            <div class="collectable-rule-preview-list">
              <div
                v-for="rule in previewRules(study)"
                :key="`${study.id}-${rule.id}`"
                class="collectable-rule-preview"
              >
                <strong>{{ rule.name }}</strong>
                <div class="rotation-icons">
                  <template v-for="(action, index) in previewActions(rule.actions)" :key="`${study.id}-${rule.id}-${action}-${index}`">
                    <span class="rotation-icon-wrap rotation-action">
                      <img v-if="actionIcon(study, action)" :src="actionIcon(study, action)" class="rotation-icon" alt="" />
                      <i v-else class="pi pi-sparkles text-xs"></i>
                    </span>
                    <i v-if="index < previewActions(rule.actions).length - 1" class="pi pi-angle-right rotation-arrow"></i>
                  </template>
                </div>
              </div>
              <p v-if="previewRules(study).length === 0" class="strategy-preview-empty">
                {{ t('experimentDatabase.rotations.noStrategyPreview') }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="displayMode === 'detailed'" class="card-footer">
          <span>{{ t('frontier.studies.updatedAt', { time: formatUpdatedAt(study.updatedAt) }) }}</span>
          <div class="action-bar">
            <Button
              icon="pi pi-copy"
              :label="t('frontier.studies.open')"
              class="p-button-sm p-button-text library-action"
              @click="openStudy(study)"
            />
            <Button
              icon="pi pi-trash"
              :label="t('frontier.studies.delete')"
              class="p-button-sm p-button-text p-button-danger library-action"
              @click="deleteStudy(study.id)"
            />
          </div>
        </div>
      </article>
    </div>

    <SaveEntryDialog
      v-if="pendingImport"
      v-model="isImportSaveDialogOpen"
      :title="t('frontier.json.importTitle')"
      :description="t('frontier.json.importDescription')"
      :name-label="t('saveEntry.nameLabel')"
      :default-name="pendingImport.defaultName"
      :confirm-label="t('frontier.json.importConfirm')"
      :cancel-label="t('saveEntry.cancel')"
      @confirm="confirmImportSave"
    >
      <div class="import-preview">
        <strong>{{ pendingImport.defaultName }}</strong>
        <span>{{ t('frontier.studies.rules') }} {{ pendingImport.study.strategy.length }}</span>
      </div>
    </SaveEntryDialog>

    <JsonImportErrorDialog
      :model-value="!!importErrorKey"
      :title="t('frontier.json.errors.title')"
      :description="importErrorDescription()"
      :close-label="t('jsonImport.errors.close')"
      @update:model-value="importErrorKey = null"
    />

    <FloatingJsonImportButton
      v-if="frontierSettings.enabled"
      :label="t('frontier.json.import')"
      @select="handleImportFile"
    />
  </div>
</template>

<style scoped>
.frontier-studies-page {
  padding: 2rem 1.5rem;
  max-width: 980px;
  margin: 0 auto;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: pageIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.page-header {
  display: grid;
  gap: 1rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0 0 0.35rem;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 0.9rem;
  margin: 0;
}

.search-field {
  width: 100%;
}

.display-mode-toolbar {
  display: flex;
  justify-content: flex-start;
  min-width: 0;
}

:deep(.display-mode-toggle) {
  display: inline-flex;
  width: max-content;
  max-width: 100%;
  overflow-x: auto;
  border-radius: 0.85rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.2rem;
}

:deep(.display-mode-toggle .p-button) {
  border: 0 !important;
  border-radius: 0.65rem !important;
  padding: 0.45rem 0.85rem !important;
  color: #64748b !important;
  font-size: 0.82rem !important;
  font-weight: 900 !important;
  background: transparent !important;
}

:deep(.display-mode-toggle .p-button.p-highlight) {
  color: #0f766e !important;
  background: white !important;
  box-shadow: 0 1px 5px rgb(15 23 42 / 0.08) !important;
}

:global(html.dark .display-mode-toggle) {
  background: rgb(15 23 42 / 0.72);
  border-color: #334155;
}

:global(html.dark .display-mode-toggle .p-button) {
  color: #94a3b8 !important;
}

:global(html.dark .display-mode-toggle .p-button.p-highlight) {
  color: #99f6e4 !important;
  background: rgb(30 41 59 / 0.95) !important;
  box-shadow: 0 1px 8px rgb(0 0 0 / 0.24) !important;
}

.search-icon,
.clear-icon {
  color: #94a3b8;
}

:deep(.search-input) {
  width: 100% !important;
  padding: 1rem 3rem !important;
  border-radius: 16px !important;
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

:global(html.dark .search-input:focus) {
  border-color: rgba(82, 168, 144, 0.72) !important;
  box-shadow: 0 0 0 3px rgba(82, 168, 144, 0.11), 0 2px 10px rgba(0, 0, 0, 0.22) !important;
}

.study-list {
  display: grid;
  gap: 1rem;
}

.study-card,
.disabled-panel {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border-radius: 18px;
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.study-card.is-compact {
  gap: 0.65rem;
  padding: 0.85rem 0.9rem;
  border-radius: 14px;
}

:global(html.dark .study-card),
:global(html.dark .disabled-panel) {
  background: #0f172a;
  border-color: #334155;
}

.disabled-panel {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
}

.disabled-content {
  min-width: 0;
  display: grid;
  gap: 0.25rem;
}

.disabled-content h3,
.disabled-content p {
  margin: 0;
}

.disabled-content h3 {
  color: #1e293b;
  font-size: 1.05rem;
  font-weight: 900;
}

.disabled-content p {
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.55;
}

:global(html.dark .disabled-content h3) {
  color: #f8fafc;
}

:global(html.dark .disabled-content p) {
  color: #94a3b8;
}

.disabled-action {
  grid-column: 1 / -1;
  justify-self: start;
}

.item-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.item-icon-wrap {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 10px;
  overflow: hidden;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

:global(html.dark .item-icon-wrap) {
  background: #1e293b;
}

.item-icon {
  width: 60px;
  height: 60px;
  object-fit: contain;
  image-rendering: pixelated;
}

.item-info {
  min-width: 0;
}

.item-info h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1.05rem;
  font-weight: 900;
  overflow-wrap: anywhere;
}

:global(html.dark .item-info h3) {
  color: #f8fafc;
}

.item-subtitle {
  margin: 0.12rem 0 0;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

:global(html.dark .item-subtitle) {
  color: #94a3b8;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.45rem;
  flex-wrap: wrap;
}

.is-compact .item-section {
  align-items: center;
  gap: 0.85rem;
}

.is-compact .item-icon-wrap,
.is-compact .item-icon {
  width: 60px;
  height: 60px;
}

.is-compact .item-meta {
  gap: 0.35rem;
  margin-top: 0.35rem;
}

.is-compact .item-glv-badge,
.is-compact .item-job-badge,
.is-compact .item-frontier-badge {
  padding: 2px 8px;
  font-size: 0.68rem;
  line-height: 1.35;
}

.compact-action-bar {
  padding-top: 0.1rem;
}

.item-glv-badge,
.item-job-badge,
.item-frontier-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 800;
  color: white;
  white-space: nowrap;
}

.item-glv-badge {
  background: linear-gradient(135deg, #52a890, #3d8b75);
}

.item-job-badge {
  background: linear-gradient(135deg, #64748b, #475569);
}

.item-frontier-badge {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.summary-info-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8.2rem, 1fr));
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
}

:global(html.dark .summary-info-strip) {
  background: rgb(30 41 59 / 0.35);
  border-color: #1e293b;
}

.info-group {
  display: grid;
  align-content: start;
  gap: 0.2rem;
  min-width: 0;
}

.info-group span {
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
}

.info-group strong {
  color: #475569;
  font-size: 0.82rem;
  font-weight: 900;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

:global(html.dark .info-group strong) {
  color: #cbd5e1;
}

.rotation-plan-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.rotation-plan-stats > div {
  min-width: 0;
  border-radius: 0.75rem;
  background: white;
  padding: 0.65rem 0.75rem;
  border: 1px solid #e2e8f0;
}

:global(html.dark .rotation-plan-stats > div) {
  background: #1e293b;
  border-color: #334155;
}

.rotation-plan-stats > div.is-primary-metric {
  border-color: rgb(82 168 144 / 0.55);
  background: rgb(240 253 244 / 0.86);
}

:global(html.dark .rotation-plan-stats > div.is-primary-metric) {
  background: rgb(20 83 45 / 0.22);
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

:global(html.dark .rotation-plan-stats strong) {
  color: #f8fafc;
}

.rotation-plan-stats small {
  margin-top: 0.2rem;
  color: #64748b;
  font-size: 0.66rem;
  font-weight: 800;
}

:global(html.dark .rotation-plan-stats span),
:global(html.dark .rotation-plan-stats small) {
  color: #94a3b8;
}

.rotation-preview-list {
  display: grid;
  gap: 0.6rem;
}

.rotation-strip {
  display: grid;
  gap: 0.55rem;
  padding: 0.8rem 0.85rem;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
}

:global(html.dark .rotation-strip) {
  background: rgb(15 23 42 / 0.6);
  border-color: #1e293b;
}

.rotation-strip h4 {
  margin: 0;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
}

.collectable-strategy-strip {
  gap: 0.5rem;
  padding: 0.7rem 0.8rem;
  border-width: 1px;
  border-radius: 14px;
  background: #f8fafc;
}

:global(html.dark .collectable-strategy-strip) {
  background: rgb(15 23 42 / 0.6);
  border-color: #1e293b;
}

.collectable-rule-preview-list {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.collectable-rule-preview {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.38rem 0.5rem;
  border-radius: 0.65rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

:global(html.dark .collectable-rule-preview) {
  background: rgb(30 41 59 / 0.55);
  border-color: #334155;
}

.collectable-rule-preview strong {
  min-width: 0;
  max-width: 9rem;
  color: #334155;
  font-size: 0.8rem;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(html.dark .collectable-rule-preview strong) {
  color: #e2e8f0;
}

.strategy-preview-empty {
  margin: 0;
  color: #94a3b8;
  font-size: 0.78rem;
  font-weight: 800;
}

.rotation-icons {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.rotation-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rotation-action {
  background: #52a890;
}

.rotation-arrow {
  color: #cbd5e1;
  font-size: 0.8rem;
}

.rotation-icon {
  width: 34px;
  height: 34px;
  object-fit: cover;
  image-rendering: pixelated;
}

.collectable-strategy-strip .rotation-icons {
  flex: 0 0 auto;
  flex-wrap: nowrap;
  gap: 0.25rem;
}

.collectable-strategy-strip .rotation-icon-wrap,
.collectable-strategy-strip .rotation-icon {
  width: 26px;
  height: 26px;
}

.collectable-strategy-strip .rotation-icon-wrap {
  border-radius: 7px;
}

.card-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-top: 1px solid #f1f5f9;
  padding-top: 0.9rem;
}

:global(html.dark .card-footer) {
  border-color: #1e293b;
}

.card-footer > span {
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 700;
}

.action-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

:deep(.library-action) {
  min-height: 2rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem 1rem;
  color: #94a3b8;
  text-align: center;
}

.empty-state h3,
.empty-state p {
  margin: 0;
}

.empty-state h3 {
  color: #475569;
  font-size: 1.2rem;
  font-weight: 800;
}

:global(html.dark .empty-state h3) {
  color: #cbd5e1;
}

.empty-icon {
  width: 58px;
  height: 58px;
  border-radius: 999px;
  background: rgba(82, 168, 144, 0.1);
  color: #52a890;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.5rem;
}

.import-preview {
  display: grid;
  gap: 0.35rem;
  border-radius: 14px;
  background: #f8fafc;
  padding: 0.8rem;
}

.import-preview strong,
.import-preview span {
  overflow-wrap: anywhere;
}

:global(html.dark .import-preview) {
  background: #1e293b;
}

@media (max-width: 560px) {
  .summary-info-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rotation-plan-stats {
    grid-template-columns: 1fr;
  }

  .collectable-rule-preview {
    max-width: 100%;
  }

  .disabled-panel {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 768px) {
  .frontier-studies-page {
    padding: 2.5rem 2rem;
  }

  .card-footer {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .disabled-panel {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .disabled-action {
    grid-column: auto;
  }
}
</style>
