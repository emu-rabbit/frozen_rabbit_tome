<script setup lang="ts">
defineOptions({ name: 'FrontierStudies' });

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
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
import { getGatherableItemById, getItemIcon, getItemName } from '../services/gameData';
import type { FrontierCollectableStudy } from '../frontier/collectable/frontierCollectableTypes';

const { frontierSettings } = useSettings();
const { t, locale } = useI18n();
const router = useRouter();
const { visibleStudies, deleteStudy, saveStudy, searchQuery } = useFrontierCollectableStudies();
const pendingImport = ref<FrontierCollectableJsonImportProjection | null>(null);
const isImportSaveDialogOpen = ref(false);
const importErrorKey = ref<string | null>(null);

const hasStudies = computed(() => visibleStudies.value.length > 0);

function openStudy(study: FrontierCollectableStudy) {
  router.push({ path: '/frontier', query: { study: study.id } });
}

function itemName(study: FrontierCollectableStudy) {
  return getItemName(study.itemId);
}

function itemMeta(study: FrontierCollectableStudy) {
  return getGatherableItemById(study.itemId);
}

function displayName(study: FrontierCollectableStudy) {
  return study.name?.trim() || itemName(study);
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

function enabledRules(study: FrontierCollectableStudy) {
  return study.strategy.filter((rule) => rule.enabled).length;
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
        <h2 class="page-title text-soft-green-800 dark:text-soft-green-400">
          {{ $t('frontier.studies.title') }}
        </h2>
        <p class="page-description">
          {{ $t('frontier.studies.description') }}
        </p>
      </div>

      <IconField v-if="frontierSettings.enabled" class="search-field">
        <InputIcon><i class="pi pi-search"></i></InputIcon>
        <InputText v-model="searchQuery" :placeholder="$t('frontier.studies.searchPlaceholder')" class="search-input" autocomplete="off" />
        <InputIcon v-if="searchQuery" style="cursor:pointer" @click="searchQuery = ''">
          <i class="pi pi-times"></i>
        </InputIcon>
      </IconField>
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

    <section v-else-if="!hasStudies" class="empty-state">
      <div class="empty-icon"><i class="pi pi-folder-open"></i></div>
      <h3>{{ searchQuery ? $t('frontier.studies.emptySearchTitle') : $t('frontier.studies.emptyTitle') }}</h3>
      <p>{{ searchQuery ? $t('frontier.studies.emptySearchDescription') : $t('frontier.studies.emptyDescription') }}</p>
    </section>

    <section v-else class="study-list">
      <article v-for="study in visibleStudies" :key="study.id" class="study-card">
        <div class="item-section">
          <div class="item-icon-wrap">
            <img v-if="getItemIcon(study.itemId)" :src="getItemIcon(study.itemId)" :alt="displayName(study)" class="item-icon" loading="lazy" />
            <i v-else class="pi pi-box"></i>
          </div>
          <div class="item-info">
            <h3>{{ displayName(study) }}</h3>
            <p v-if="displayName(study) !== itemName(study)" class="item-subtitle">{{ itemName(study) }}</p>
            <div class="item-meta">
              <span>{{ $t('createGuide.glv') }} {{ itemMeta(study)?.glv ?? '-' }}</span>
              <span>{{ $t('frontier.create.dawntrailCollectableModel') }}</span>
              <span>{{ $t('frontier.studies.updatedAt', { time: formatUpdatedAt(study.updatedAt) }) }}</span>
            </div>
          </div>
        </div>

        <div class="summary-grid">
          <div>
            <span>{{ $t('frontier.analysis.expectedScore') }}</span>
            <strong>{{ formatScore(study.lastAnalysisSnapshot?.expectedScore) }}</strong>
          </div>
          <div>
            <span>{{ $t('frontier.studies.rules') }}</span>
            <strong>{{ enabledRules(study) }}/{{ study.strategy.length }}</strong>
          </div>
          <div>
            <span>{{ $t('frontier.profile.bucketCount') }}</span>
            <strong>{{ study.probabilityProfile.brazenBuckets.length }}</strong>
          </div>
        </div>

        <footer class="card-actions">
          <button type="button" class="primary-action" @click="openStudy(study)">
            <i class="pi pi-arrow-right"></i>
            <span>{{ $t('frontier.studies.open') }}</span>
          </button>
          <button type="button" class="danger-action" @click="deleteStudy(study.id)">
            <i class="pi pi-trash"></i>
            <span>{{ $t('frontier.studies.delete') }}</span>
          </button>
        </footer>
      </article>
    </section>

    <SaveEntryDialog
      v-if="pendingImport"
      v-model="isImportSaveDialogOpen"
      :title="$t('frontier.json.importTitle')"
      :description="$t('frontier.json.importDescription')"
      :name-label="$t('saveEntry.nameLabel')"
      :default-name="pendingImport.defaultName"
      :confirm-label="$t('frontier.json.importConfirm')"
      :cancel-label="$t('saveEntry.cancel')"
      @confirm="confirmImportSave"
    >
      <div class="import-preview">
        <strong>{{ pendingImport.defaultName }}</strong>
        <span>{{ $t('frontier.studies.rules') }} {{ pendingImport.study.strategy.length }}</span>
      </div>
    </SaveEntryDialog>

    <JsonImportErrorDialog
      :model-value="!!importErrorKey"
      :title="$t('frontier.json.errors.title')"
      :description="importErrorDescription()"
      :close-label="$t('jsonImport.errors.close')"
      @update:model-value="importErrorKey = null"
    />

    <FloatingJsonImportButton
      v-if="frontierSettings.enabled"
      :label="$t('frontier.json.import')"
      @select="handleImportFile"
    />
  </div>
</template>

<style scoped>
.frontier-studies-page {
  width: min(100%, 62rem);
  margin: 0 auto;
  padding: 2rem 1.5rem 6rem;
  display: grid;
  gap: 1.25rem;
  animation: pageIn 0.35s ease both;
}
.page-header {
  display: grid;
  gap: 1rem;
}
.page-title {
  margin: 0 0 0.35rem;
  font-size: 1.9rem;
  font-weight: 900;
}
.page-description,
.empty-row p,
.empty-state p,
.item-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.6;
}
:global(html.dark) .page-description,
:global(html.dark) .empty-row p,
:global(html.dark) .empty-state p,
:global(html.dark) .item-subtitle {
  color: #cbd5e1;
}
.panel,
.study-card {
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: white;
  padding: 1rem;
  box-shadow: 0 2px 10px rgb(15 23 42 / 0.04);
}
:global(html.dark) .panel,
:global(html.dark) .study-card {
  border-color: #334155;
  background: #0f172a;
}
.search-field {
  width: 100%;
}
:deep(.search-input) {
  width: 100% !important;
  border-radius: 16px !important;
  padding: 0.9rem 3rem !important;
}
.empty-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.empty-row h3,
.empty-state h3,
.item-info h3 {
  margin: 0 0 0.2rem;
  color: #0f172a;
  font-weight: 900;
}
:global(html.dark) .empty-row h3,
:global(html.dark) .empty-state h3,
:global(html.dark) .item-info h3 {
  color: #f8fafc;
}
.empty-icon,
.item-icon-wrap {
  width: 3.5rem;
  height: 3.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 14px;
  background: #f1f5f9;
  color: #52a890;
}
.empty-state {
  display: grid;
  place-items: center;
  gap: 0.7rem;
  min-height: 16rem;
  color: #94a3b8;
  text-align: center;
}
.study-list {
  display: grid;
  gap: 1rem;
}
.study-card {
  display: grid;
  gap: 1rem;
}
.item-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}
.item-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}
.item-info {
  min-width: 0;
}
.item-info h3 {
  overflow-wrap: anywhere;
}
.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.45rem;
}
.item-meta span {
  border-radius: 999px;
  background: #ecfdf5;
  padding: 0.2rem 0.55rem;
  color: #047857;
  font-size: 0.72rem;
  font-weight: 900;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
  gap: 0.55rem;
}
.summary-grid div {
  border-radius: 14px;
  background: #f8fafc;
  padding: 0.75rem;
}
.summary-grid span {
  display: block;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
}
.summary-grid strong {
  display: block;
  margin-top: 0.15rem;
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 900;
}
.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.primary-action,
.danger-action,
.primary-link {
  min-height: 2.35rem;
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
.danger-action {
  background: #fff1f2;
  color: #be123c;
}
.import-preview {
  display: grid;
  gap: 0.35rem;
  border-radius: 14px;
  background: #f8fafc;
  padding: 0.8rem;
}
@media (min-width: 720px) {
  .page-header {
    grid-template-columns: 1fr minmax(18rem, 24rem);
    align-items: end;
  }
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
