<script setup lang="ts">
defineOptions({ name: 'TomeLibrary' });

import { computed, onBeforeUnmount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import { useTomeLibrary } from '../composables/useTomeLibrary';
import { useSolver } from '../composables/useSolver';
import { useSettings } from '../composables/useSettings';
import { getActionName, getGatherableItemById, getItemEnglishName, getItemIcon, getItemName, currentLanguage } from '../services/gameData';
import { getRotationActionIconById } from '../services/actionIcons';
import type { StoredTome, StoredTomeRotationStep } from '../types/game';
import { buildGatheringMacroFromStoredRotation } from '../utils/macroGenerator';
import { copyTextToClipboard } from '../utils/clipboard';

const { t, locale } = useI18n();
const router = useRouter();
const { tomes, deleteTome } = useTomeLibrary();
const { loadTomeForEditing } = useSolver();
const { macroSettings } = useSettings();
const searchQuery = ref('');
const copiedTomeId = ref<string | null>(null);
const partialTomeId = ref<string | null>(null);
const failedTomeId = ref<string | null>(null);
let copyTimer: ReturnType<typeof window.setTimeout> | null = null;

const filteredTomes = computed(() => {
  currentLanguage.value;
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return tomes.value;

  return tomes.value.filter((tome) => {
    const localizedName = getItemName(tome.itemId).toLowerCase();
    const englishName = getItemEnglishName(tome.itemId).toLowerCase();
    return localizedName.includes(query) || englishName.includes(query);
  });
});

function itemMeta(tome: StoredTome) {
  return getGatherableItemById(tome.itemId);
}

function formatStats(tome: StoredTome) {
  return `${tome.stats.level}/${tome.stats.gathering}/${tome.stats.perception}`;
}

function formatGp(tome: StoredTome) {
  return `${tome.temporaryGp}/${tome.stats.gp}`;
}

function formatFood(tome: StoredTome) {
  if (!tome.food.foodId) return t('tomeLibrary.noFood');
  return `${getItemName(tome.food.foodId)} ${t(`solver.food.${tome.food.quality}`)}`;
}

function formatNodeBonuses(tome: StoredTome) {
  return `${tome.nodeBonuses.gatheringCount}/${tome.nodeBonuses.yieldCount}/${tome.nodeBonuses.extraRate}`;
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('tomeLibrary.unknownDate');

  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function rotationIcon(tome: StoredTome, step: StoredTomeRotationStep) {
  if (step.type === 'gather') {
    return getItemIcon(tome.itemId);
  }

  return getRotationActionIconById(step.actionId);
}

function handleEdit(tome: StoredTome) {
  if (!loadTomeForEditing(tome)) return;
  router.push('/solver');
}

async function handleCopyMacro(tome: StoredTome) {
  const macro = buildGatheringMacroFromStoredRotation(tome.rotation, macroSettings.value, {
    resolveActionName: (_, actionId) => actionId ? getActionName(actionId) : '',
    formatGatherPrompt: formatMacroGatherPrompt
  });
  const copied = await copyTextToClipboard(macro.text);

  copiedTomeId.value = copied && macro.isComplete ? tome.id : null;
  partialTomeId.value = copied && !macro.isComplete ? tome.id : null;
  failedTomeId.value = copied ? null : tome.id;

  if (copyTimer) {
    window.clearTimeout(copyTimer);
  }

  copyTimer = window.setTimeout(() => {
    copiedTomeId.value = null;
    partialTomeId.value = null;
    failedTomeId.value = null;
    copyTimer = null;
  }, 2200);
}

function formatMacroGatherPrompt(context: {
  count: number;
  hasConditionalGather: boolean;
  isFinalRun: boolean;
}) {
  if (context.isFinalRun) {
    return t('macro.prompts.finalGather');
  }

  return context.hasConditionalGather
    ? t('macro.prompts.conditionalGatherCount', { count: context.count })
    : t('macro.prompts.gatherCount', { count: context.count });
}

function copyMacroLabel(tome: StoredTome) {
  if (copiedTomeId.value === tome.id) return t('tomeLibrary.actions.copyMacroStates.copied');
  if (partialTomeId.value === tome.id) return t('tomeLibrary.actions.copyMacroStates.partial');
  if (failedTomeId.value === tome.id) return t('tomeLibrary.actions.copyMacroStates.failed');

  return t('tomeLibrary.actions.copyMacro');
}

function copyMacroIcon(tome: StoredTome) {
  if (failedTomeId.value === tome.id) return 'pi pi-exclamation-triangle';
  if (copiedTomeId.value === tome.id || partialTomeId.value === tome.id) return 'pi pi-check';

  return 'pi pi-copy';
}

onBeforeUnmount(() => {
  if (copyTimer) {
    window.clearTimeout(copyTimer);
  }
});
</script>

<template>
  <div class="tome-library-page">
    <header class="page-header">
      <div>
        <h2 class="page-title text-soft-green-800 dark:text-soft-green-400">{{ t('tomeLibrary.title') }}</h2>
        <p class="page-subtitle text-slate-500 dark:text-slate-400">{{ t('tomeLibrary.subtitle') }}</p>
      </div>

      <IconField class="search-field">
        <InputIcon>
          <i class="pi pi-search search-icon"></i>
        </InputIcon>
        <InputText
          v-model="searchQuery"
          :placeholder="t('tomeLibrary.searchPlaceholder')"
          class="search-input"
          autocomplete="off"
        />
        <InputIcon v-if="searchQuery" style="cursor:pointer" @click="searchQuery = ''">
          <i class="pi pi-times clear-icon"></i>
        </InputIcon>
      </IconField>
    </header>

    <div v-if="filteredTomes.length === 0" class="empty-state">
      <div class="empty-icon">
        <i class="pi pi-book"></i>
      </div>
      <h3>{{ searchQuery ? t('tomeLibrary.emptySearchTitle') : t('tomeLibrary.emptyTitle') }}</h3>
      <p>{{ searchQuery ? t('tomeLibrary.emptySearchDesc') : t('tomeLibrary.emptyDesc') }}</p>
    </div>

    <div v-else class="tome-list">
      <article v-for="tome in filteredTomes" :key="tome.id" class="tome-card">
        <div class="item-section">
          <div class="item-icon-wrap bg-slate-100 dark:bg-slate-900">
            <img
              v-if="getItemIcon(tome.itemId)"
              :src="getItemIcon(tome.itemId)"
              :alt="getItemName(tome.itemId)"
              class="item-icon"
              loading="lazy"
            />
            <i v-else class="pi pi-box text-slate-400"></i>
          </div>

          <div class="item-info">
            <h3 class="item-name text-slate-800 dark:text-slate-100">{{ getItemName(tome.itemId) }}</h3>
            <div class="item-meta">
              <span class="item-glv-badge">{{ t('createGuide.glv') }} {{ itemMeta(tome)?.glv ?? '-' }}</span>
              <span class="item-job-badge">{{ itemMeta(tome)?.jobType ? t(`game.jobs.${itemMeta(tome)?.jobType}`) : '-' }}</span>
              <span class="item-regular-badge">
                <i class="pi pi-compass"></i>
                {{ t('createGuide.regularSystem') }}
              </span>
            </div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-row">
            <span>{{ t('tomeLibrary.rows.playerStats') }}</span>
            <strong>{{ formatStats(tome) }}</strong>
          </div>
          <div class="summary-row">
            <span>{{ t('tomeLibrary.rows.gpState') }}</span>
            <strong>{{ formatGp(tome) }}</strong>
          </div>
          <div class="summary-row">
            <span>{{ t('tomeLibrary.rows.food') }}</span>
            <strong>{{ formatFood(tome) }}</strong>
          </div>
          <div class="summary-row">
            <span>{{ t('tomeLibrary.rows.nodeBonuses') }}</span>
            <strong>{{ formatNodeBonuses(tome) }}</strong>
          </div>
        </div>

        <div class="rotation-strip" :aria-label="t('tomeLibrary.rotationPreview')">
          <template v-for="(step, index) in tome.rotation" :key="`${tome.id}-${index}`">
            <span
              class="rotation-icon-wrap"
              :class="step.type === 'gather' ? 'rotation-gather' : 'rotation-action'"
            >
              <img v-if="rotationIcon(tome, step)" :src="rotationIcon(tome, step)" class="rotation-icon" alt="" />
              <i v-else class="pi pi-sparkles text-xs"></i>
            </span>
            <i v-if="index < tome.rotation.length - 1" class="pi pi-angle-right rotation-arrow"></i>
          </template>
        </div>

        <div class="card-footer">
          <span class="created-at">{{ t('tomeLibrary.createdAt', { time: formatCreatedAt(tome.createdAt) }) }}</span>
          <div class="action-bar">
            <Button
              icon="pi pi-pencil"
              :label="t('tomeLibrary.actions.edit')"
              class="p-button-sm p-button-text library-action"
              @click="handleEdit(tome)"
            />
            <Button
              :icon="copyMacroIcon(tome)"
              :label="copyMacroLabel(tome)"
              class="p-button-sm p-button-text library-action"
              :class="{ 'is-copy-success': copiedTomeId === tome.id, 'is-copy-partial': partialTomeId === tome.id, 'is-copy-failed': failedTomeId === tome.id }"
              @click="handleCopyMacro(tome)"
            />
            <Button
              icon="pi pi-trash"
              :label="t('tomeLibrary.actions.delete')"
              class="p-button-sm p-button-text p-button-danger library-action"
              @click="deleteTome(tome.id)"
            />
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.tome-library-page {
  padding: 2rem 1.5rem;
  max-width: 980px;
  margin: 0 auto;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: pageIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@media (min-width: 768px) {
  .tome-library-page {
    padding: 2.5rem 2rem;
  }
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

.tome-list {
  display: grid;
  gap: 1rem;
}

.tome-card {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border-radius: 18px;
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

:global(html.dark .tome-card) {
  background: #0f172a;
  border-color: #334155;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.22);
}

.item-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.item-icon-wrap {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  image-rendering: pixelated;
}

.item-info {
  min-width: 0;
}

.item-name {
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.35;
  margin: 0;
  overflow-wrap: anywhere;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.45rem;
  flex-wrap: wrap;
}

.item-glv-badge,
.item-job-badge,
.item-regular-badge {
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

.item-regular-badge {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

@media (min-width: 640px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: 12px;
  background: #f8fafc;
  color: #64748b;
  font-size: 0.82rem;
}

:global(html.dark .summary-row) {
  background: rgb(30 41 59 / 0.55);
  color: #94a3b8;
}

.summary-row strong {
  min-width: 0;
  color: #334155;
  font-weight: 800;
  text-align: right;
  overflow-wrap: anywhere;
}

:global(html.dark .summary-row strong) {
  color: #e2e8f0;
}

.rotation-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
}

:global(html.dark .rotation-strip) {
  background: rgb(15 23 42 / 0.6);
  border-color: #1e293b;
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

.rotation-gather {
  background: #e2e8f0;
}

:global(html.dark .rotation-gather) {
  background: #1e293b;
}

.rotation-arrow {
  color: #cbd5e1;
  font-size: 0.8rem;
  flex-shrink: 0;
}

:global(html.dark .rotation-arrow) {
  color: #64748b;
}

.rotation-icon {
  width: 34px;
  height: 34px;
  object-fit: cover;
  image-rendering: pixelated;
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

@media (min-width: 768px) {
  .card-footer {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.created-at {
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
:deep(.library-action.is-copy-success) {
  color: #15803d;
  background: rgb(220 252 231 / 0.75);
}
:global(html.dark .library-action.is-copy-success) {
  color: #bbf7d0;
  background: rgb(20 83 45 / 0.22);
}
:deep(.library-action.is-copy-partial) {
  color: #b45309;
  background: rgb(254 243 199 / 0.8);
}
:global(html.dark .library-action.is-copy-partial) {
  color: #fde68a;
  background: rgb(120 53 15 / 0.26);
}
:deep(.library-action.is-copy-failed) {
  color: #b91c1c;
  background: rgb(254 226 226 / 0.8);
}
:global(html.dark .library-action.is-copy-failed) {
  color: #fecaca;
  background: rgb(127 29 29 / 0.25);
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

.empty-state h3 {
  margin: 0;
  color: #475569;
  font-size: 1.2rem;
  font-weight: 800;
}

:global(html.dark .empty-state h3) {
  color: #cbd5e1;
}

.empty-state p {
  margin: 0;
  max-width: 26rem;
  line-height: 1.6;
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
  font-size: 1.5rem;
}

@keyframes pageIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
