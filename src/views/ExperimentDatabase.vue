<script setup lang="ts">
defineOptions({ name: 'ExperimentDatabase' });

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
import JsonImportPreview from '../components/JsonImportPreview.vue';
import JsonImportWarningDialog from '../components/JsonImportWarningDialog.vue';
import { useExperimentLibrary } from '../composables/useExperimentLibrary';
import { useTomeLibrary } from '../composables/useTomeLibrary';
import { getGatherableItemById, getItemEnglishName, getItemIcon, getItemName, currentLanguage } from '../services/gameData';
import { getGatheringFood } from '../services/foodData';
import { getRotationActionIconById } from '../services/actionIcons';
import { getCollectableActionIcon, getCollectableActionName } from '../services/collectableActions';
import { getCollectableScripRewardMeta } from '../services/collectableScripRewards';
import { hideRevisitExperimentFeatures } from '../config/experimentFeatures';
import type { StoredCollectableStrategyRule, StoredExperiment, StoredTomeRotationStep } from '../types/game';
import type { CollectableActionKind, CollectableObjective, CollectableTierCounts } from '../types/collectable';
import { gatherableItemJobs } from '../utils/gatherableItemJobs';
import { isModelVersionSnapshotStale } from '../utils/modelVersionStatus';
import {
  isCustomTierObjective,
  isTierCountObjective
} from '../utils/collectableObjectivePresets';
import {
  isImportMismatch,
  parseTomeJsonImport,
  TomeJsonImportError,
  type TomeJsonImportProjection
} from '../utils/tomeJsonImport';

const { t, locale } = useI18n();
const router = useRouter();
const { visibleExperiments, deleteExperiment, saveImportedExperiment, searchQuery } = useExperimentLibrary();
const { saveImportedTome } = useTomeLibrary();

const displayMode = useLocalStorage<'compact' | 'detailed'>('frozen-rabbit-tome-experiment-database-display-mode', 'detailed');
const pendingEditExperiment = ref<StoredExperiment | null>(null);
const pendingImport = ref<TomeJsonImportProjection | null>(null);
const importErrorKey = ref<string | null>(null);
const isImportWarningOpen = ref(false);
const isImportSaveDialogOpen = ref(false);
const tierCountVisibilityEpsilon = 0.000001;
const displayModeOptions = computed(() => [
  { label: t('common.displayModes.compact'), value: 'compact' },
  { label: t('common.displayModes.detailed'), value: 'detailed' }
]);
const filteredExperiments = computed(() => {
  currentLanguage.value;
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return visibleExperiments.value;

  return visibleExperiments.value.filter((experiment) => {
    const customName = (experiment.name ?? '').toLowerCase();
    const localizedName = getItemName(experiment.itemId).toLowerCase();
    const englishName = getItemEnglishName(experiment.itemId).toLowerCase();
    return customName.includes(query) || localizedName.includes(query) || englishName.includes(query);
  });
});

function itemMeta(experiment: StoredExperiment) {
  return getGatherableItemById(experiment.itemId);
}

function itemJobs(experiment: StoredExperiment) {
  return gatherableItemJobs(itemMeta(experiment));
}

function experimentDisplayName(experiment: StoredExperiment) {
  return experiment.name?.trim() || getItemName(experiment.itemId);
}

function shouldShowItemSubtitle(experiment: StoredExperiment) {
  return !!experiment.name?.trim() && experiment.name.trim() !== getItemName(experiment.itemId);
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('experimentDatabase.unknownDate');

  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatStats(experiment: StoredExperiment) {
  return `${experiment.input.stats.level}/${experiment.input.stats.gathering}/${experiment.input.stats.perception}`;
}

function formatGp(experiment: StoredExperiment) {
  return `${experiment.input.temporaryGp}/${experiment.input.stats.gp}`;
}

function formatNodeBonuses(experiment: StoredExperiment) {
  if (experiment.kind === 'collectable') {
    return t('tomeLibrary.nodeState.collectable', {
      gathering: experiment.input.nodeBonuses.gatheringCount
    });
  }
  return t('tomeLibrary.nodeState.regular', {
    gathering: experiment.input.nodeBonuses.gatheringCount,
    yield: experiment.input.nodeBonuses.yieldCount,
    extra: experiment.input.nodeBonuses.extraRate
  });
}

function rotationIcon(experiment: StoredExperiment, step: StoredTomeRotationStep) {
  if (step.type === 'gather') return getItemIcon(experiment.itemId);
  return getRotationActionIconById(step.actionId);
}

function collectableActionIcon(experiment: StoredExperiment, action: CollectableActionKind) {
  return getCollectableActionIcon(action, itemMeta(experiment)?.jobType ?? 'miner');
}

function handleEdit(experiment: StoredExperiment) {
  if (isExperimentSnapshotStale(experiment)) {
    pendingEditExperiment.value = experiment;
    return;
  }

  loadExperiment(experiment);
}

function loadExperiment(experiment: StoredExperiment) {
  pendingEditExperiment.value = null;
  router.push({ path: '/simulator', query: { experiment: experiment.id } });
}

function foodInfo(experiment: StoredExperiment) {
  const food = getGatheringFood(experiment.input.food.foodId);
  if (!food) return null;
  return {
    name: getItemName(food.id),
    quality: t(`solver.food.${experiment.input.food.quality}`)
  };
}

function formatFood(experiment: StoredExperiment) {
  const food = foodInfo(experiment);
  if (!food) return t('tomeLibrary.noFood');
  return `${food.name} ${food.quality}`;
}

function relicBonusLabel(experiment: StoredExperiment) {
  return experiment.input.hasRelicToolBonus
    ? t('tomeLibrary.relicBonus.enabled')
    : t('tomeLibrary.relicBonus.disabled');
}

function formatChance(chance: number) {
  if (chance < 0.01) return '<0.01';
  return Number(chance.toFixed(2)).toString();
}

function collectableActionLabel(experiment: StoredExperiment, action: CollectableActionKind) {
  return getCollectableActionName(action, itemMeta(experiment)?.jobType ?? 'miner');
}

function enabledCollectableRules(experiment: StoredExperiment) {
  return experiment.strategy.kind === 'collectable'
    ? experiment.strategy.rules.filter((rule) => rule.enabled)
    : [];
}

function previewCollectableActions(rule: StoredCollectableStrategyRule) {
  return rule.actions.slice(0, 5);
}

function isCollectableExperiment(experiment: StoredExperiment) {
  return experiment.kind === 'collectable';
}

function experimentSystemLabel(experiment: StoredExperiment) {
  if (isCollectableExperiment(experiment)) return t('createGuide.collectableSystem');
  if (itemMeta(experiment)?.isCrystalGathering) return t('createGuide.crystalGatheringSystem');
  return t('createGuide.regularSystem');
}

function totalExpectedLabel(experiment: StoredExperiment) {
  if (experiment.kind !== 'collectable') return t('experimentDatabase.rows.totalExpected');
  if (isCollectableTierCountExperiment(experiment)) return t('collectableSolver.results.expectedTierCounts');
  return t('collectableStrategyLab.analysis.expectedScore', { unit: collectableScoreUnitLabel(experiment) });
}

function maxMetricLabel(experiment: StoredExperiment) {
  if (experiment.kind !== 'collectable') return t('simulator.analysis.maxYield');
  if (isCollectableTierCountExperiment(experiment)) return t('collectableSolver.results.maxTierCounts');
  return t('collectableStrategyLab.analysis.maxScore', { unit: collectableScoreUnitLabel(experiment) });
}

function minMetricLabel(experiment: StoredExperiment) {
  if (experiment.kind !== 'collectable') return t('simulator.analysis.minYield');
  if (isCollectableTierCountExperiment(experiment)) return t('collectableSolver.results.minTierCounts');
  return t('collectableStrategyLab.analysis.minScore', { unit: collectableScoreUnitLabel(experiment) });
}

function totalExpectedValue(experiment: StoredExperiment) {
  return experiment.kind === 'collectable'
    ? formatNumber(experiment.lastAnalysisSnapshot?.kind === 'collectable' ? experiment.lastAnalysisSnapshot.expectedScore : undefined)
    : formatNumber(experiment.lastAnalysisSnapshot?.kind === 'regular' ? experiment.lastAnalysisSnapshot.expectedYield : undefined);
}

function maxValue(experiment: StoredExperiment) {
  return experiment.kind === 'collectable'
    ? formatNumber(experiment.lastAnalysisSnapshot?.kind === 'collectable' ? experiment.lastAnalysisSnapshot.maxScore : undefined)
    : formatNumber(experiment.lastAnalysisSnapshot?.kind === 'regular' ? experiment.lastAnalysisSnapshot.maxYield : undefined);
}

function minValue(experiment: StoredExperiment) {
  return experiment.kind === 'collectable'
    ? formatNumber(experiment.lastAnalysisSnapshot?.kind === 'collectable' ? experiment.lastAnalysisSnapshot.minScore : undefined)
    : formatNumber(experiment.lastAnalysisSnapshot?.kind === 'regular' ? experiment.lastAnalysisSnapshot.minYield : undefined);
}

function collectableObjective(experiment: StoredExperiment): CollectableObjective | undefined {
  return experiment.strategy.kind === 'collectable' ? experiment.strategy.objective : undefined;
}

function collectableObjectiveLabel(experiment: StoredExperiment) {
  const objective = collectableObjective(experiment);
  if (!objective) return t('collectableObjective.title');

  if (objective.kind === 'scrip') {
    const meta = experiment.strategy.kind === 'collectable'
      ? getCollectableScripRewardMeta(experiment.strategy.rewardTableSummary?.rewardItemId)
      : getCollectableScripRewardMeta(undefined);
    if (meta.kind === 'orange') return t('collectableObjective.presets.orangeScrip');
    if (meta.kind === 'purple') return t('collectableObjective.presets.purpleScrip');
    return t('collectableObjective.title');
  }

  if (objective.presetId) return t(`collectableObjective.presets.${objective.presetId}`);
  return t('collectableObjective.title');
}

function collectableScoreUnitLabel(experiment: StoredExperiment) {
  const objective = collectableObjective(experiment);
  if (isCustomTierObjective(objective)) return t('collectableStrategyLab.analysis.weightedScoreUnit');

  const meta = experiment.strategy.kind === 'collectable'
    ? getCollectableScripRewardMeta(experiment.strategy.rewardTableSummary?.rewardItemId)
    : getCollectableScripRewardMeta(undefined);
  return t(meta.labelKey);
}

function isCollectableTierCountExperiment(experiment: StoredExperiment) {
  return isTierCountObjective(collectableObjective(experiment));
}

function collectableMetricTierCounts(
  experiment: StoredExperiment,
  metric: 'expected' | 'max' | 'min'
): CollectableTierCounts | undefined {
  if (experiment.lastAnalysisSnapshot?.kind !== 'collectable') return undefined;
  if (metric === 'expected') return experiment.lastAnalysisSnapshot.expectedTierCounts;
  if (metric === 'max') return experiment.lastAnalysisSnapshot.maxScoreTierCounts;
  return experiment.lastAnalysisSnapshot.minScoreTierCounts;
}

function tierMetricEntries(counts?: CollectableTierCounts) {
  if (!counts) return [];
  return [
    { key: 'high', label: t('collectableObjective.tiers.high'), value: counts.high },
    { key: 'mid', label: t('collectableObjective.tiers.mid'), value: counts.mid },
    { key: 'low', label: t('collectableObjective.tiers.low'), value: counts.low }
  ];
}

function visibleTierMetricEntries(counts?: CollectableTierCounts) {
  const entries = tierMetricEntries(counts).filter((entry) => Math.abs(entry.value) > tierCountVisibilityEpsilon);
  return entries.length ? entries : [{ key: 'none', label: '', value: 0 }];
}

function formatTierCountValue(value: number) {
  return Number(value.toFixed(2)).toString();
}

function maxChance(experiment: StoredExperiment) {
  return experiment.kind === 'collectable'
    ? experiment.lastAnalysisSnapshot?.kind === 'collectable' ? experiment.lastAnalysisSnapshot.maxScoreChance ?? 0 : 0
    : experiment.lastAnalysisSnapshot?.kind === 'regular' ? experiment.lastAnalysisSnapshot.maxYieldChance ?? 0 : 0;
}

function minChance(experiment: StoredExperiment) {
  return experiment.kind === 'collectable'
    ? experiment.lastAnalysisSnapshot?.kind === 'collectable' ? experiment.lastAnalysisSnapshot.minScoreChance ?? 0 : 0
    : experiment.lastAnalysisSnapshot?.kind === 'regular' ? experiment.lastAnalysisSnapshot.minYieldChance ?? 0 : 0;
}

function regularPrimaryRotation(experiment: StoredExperiment) {
  return experiment.strategy.kind === 'regular' ? experiment.strategy.primaryRotation : [];
}

function regularRevisitRotation(experiment: StoredExperiment) {
  return experiment.strategy.kind === 'regular' ? experiment.strategy.revisitRotation : [];
}

function formatNumber(value?: number) {
  return typeof value === 'number' ? Number(value.toFixed(2)).toString() : '-';
}

function experimentScenario(experiment: StoredExperiment) {
  return experiment.kind === 'collectable' ? 'experiment.collectable' as const : 'experiment.regular' as const;
}

function isExperimentSnapshotStale(experiment: StoredExperiment) {
  return isModelVersionSnapshotStale(experimentScenario(experiment), experiment.lastAnalysisSnapshot?.modelVersions);
}

function cancelStaleSnapshotDialog() {
  pendingEditExperiment.value = null;
}

async function handleImportFile(file: File) {
  try {
    pendingImport.value = parseTomeJsonImport(await file.text());
    importErrorKey.value = null;
    if (isImportMismatch('experimentDatabase', pendingImport.value)) {
      isImportWarningOpen.value = true;
      return;
    }

    openImportSaveDialog();
  } catch (error) {
    pendingImport.value = null;
    importErrorKey.value = error instanceof TomeJsonImportError ? error.message : 'unknown';
  }
}

function openImportSaveDialog() {
  if (!pendingImport.value) return;
  isImportSaveDialogOpen.value = true;
}

function confirmImportSave(name: string) {
  if (!pendingImport.value) return;

  if (pendingImport.value.sourceType === 'tome') {
    saveImportedTome({ ...pendingImport.value.tome, name });
  } else {
    saveImportedExperiment({ ...pendingImport.value.experiment, name });
  }

  pendingImport.value = null;
}

function importSaveTitle() {
  if (pendingImport.value?.sourceType === 'tome') return t('jsonImport.save.tome.title');
  return t('jsonImport.save.experiment.title');
}

function importSaveDescription() {
  if (pendingImport.value?.sourceType === 'tome') return t('jsonImport.save.tome.description');
  return t('jsonImport.save.experiment.description');
}

function importSaveConfirmLabel() {
  if (pendingImport.value?.sourceType === 'tome') return t('jsonImport.save.tome.confirm');
  return t('jsonImport.save.experiment.confirm');
}

function importErrorDescription() {
  const key = importErrorKey.value ?? 'unknown';
  return t(`jsonImport.errors.${key.startsWith('missing:') ? 'invalidContent' : key}`);
}

</script>

<template>
  <div class="experiment-database-page">
    <header class="page-header">
      <div>
        <h2 class="page-title text-soft-green-800 dark:text-soft-green-400">{{ t('experimentDatabase.title') }}</h2>
        <p class="page-subtitle text-slate-500 dark:text-slate-400">{{ t('experimentDatabase.subtitle') }}</p>
      </div>

      <IconField class="search-field">
        <InputIcon><i class="pi pi-search search-icon"></i></InputIcon>
        <InputText v-model="searchQuery" :placeholder="t('experimentDatabase.searchPlaceholder')" class="search-input" autocomplete="off" />
        <InputIcon v-if="searchQuery" style="cursor:pointer" @click="searchQuery = ''">
          <i class="pi pi-times clear-icon"></i>
        </InputIcon>
      </IconField>

      <div class="display-mode-toolbar" :aria-label="t('common.displayMode')">
        <SelectButton
          v-model="displayMode"
          :options="displayModeOptions"
          optionLabel="label"
          optionValue="value"
          class="display-mode-toggle"
        />
      </div>
    </header>

    <div v-if="filteredExperiments.length === 0" class="empty-state">
      <div class="empty-icon"><i class="pi pi-database"></i></div>
      <h3>{{ searchQuery ? t('experimentDatabase.emptySearchTitle') : t('experimentDatabase.emptyTitle') }}</h3>
      <p>{{ searchQuery ? t('experimentDatabase.emptySearchDesc') : t('experimentDatabase.emptyDesc') }}</p>
    </div>

    <div v-else class="experiment-list">
      <article
        v-for="experiment in filteredExperiments"
        :key="experiment.id"
        class="experiment-card"
        :class="{ 'is-compact': displayMode === 'compact' }"
      >
        <div class="item-section">
          <div class="item-icon-wrap">
            <img v-if="getItemIcon(experiment.itemId)" :src="getItemIcon(experiment.itemId)" :alt="experimentDisplayName(experiment)" class="item-icon" loading="lazy" />
            <i v-else class="pi pi-box text-slate-400"></i>
          </div>
          <div class="item-info">
            <h3>{{ experimentDisplayName(experiment) }}</h3>
            <p v-if="shouldShowItemSubtitle(experiment)" class="item-subtitle">{{ getItemName(experiment.itemId) }}</p>
            <div class="item-meta">
              <span class="item-glv-badge">{{ t('createGuide.glv') }} {{ itemMeta(experiment)?.glv ?? '-' }}</span>
              <span
                v-for="job in itemJobs(experiment)"
                :key="job"
                class="item-job-badge"
              >
                {{ t(`game.jobs.${job}`) }}
              </span>
              <span v-if="itemJobs(experiment).length === 0" class="item-job-badge">-</span>
              <span v-if="isCollectableExperiment(experiment)" class="item-collectable-badge">
                <i class="pi pi-box"></i>
                {{ experimentSystemLabel(experiment) }}
              </span>
              <span v-else-if="itemMeta(experiment)?.isCrystalGathering" class="item-crystal-badge">
                <i class="pi pi-sparkles"></i>
                {{ experimentSystemLabel(experiment) }}
              </span>
              <span v-else class="item-regular-badge">
                <i class="pi pi-compass"></i>
                {{ experimentSystemLabel(experiment) }}
              </span>
              <span v-if="isExperimentSnapshotStale(experiment)" class="snapshot-stale-badge">
                <i class="pi pi-history"></i>
                {{ t('experimentDatabase.snapshot.staleBadge') }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="displayMode === 'compact'" class="compact-action-bar action-bar">
          <Button icon="pi pi-copy" :label="t('experimentDatabase.actions.edit')" class="p-button-sm p-button-text library-action" @click="handleEdit(experiment)" />
          <Button icon="pi pi-trash" :label="t('experimentDatabase.actions.delete')" class="p-button-sm p-button-text p-button-danger library-action" @click="deleteExperiment(experiment.id)" />
        </div>

        <div v-if="displayMode === 'detailed'" class="summary-info-strip">
          <div class="info-group">
            <span>{{ t('experimentDatabase.rows.playerStats') }}</span>
            <strong>{{ formatStats(experiment) }}</strong>
          </div>
          <div class="info-group">
            <span>{{ t('experimentDatabase.rows.gpState') }}</span>
            <strong>{{ formatGp(experiment) }}</strong>
          </div>
          <div class="info-group">
            <span>{{ t('experimentDatabase.rows.nodeBonuses') }}</span>
            <strong>{{ formatNodeBonuses(experiment) }}</strong>
          </div>
          <div class="info-group food">
            <span>{{ t('tomeLibrary.rows.food') }}</span>
            <strong>{{ formatFood(experiment) }}</strong>
          </div>
          <div v-if="experiment.kind === 'collectable'" class="info-group">
            <span>{{ t('tomeLibrary.rows.relicBonus') }}</span>
            <strong>{{ relicBonusLabel(experiment) }}</strong>
          </div>
          <div v-if="experiment.kind === 'collectable'" class="info-group objective-info">
            <span>{{ t('experimentDatabase.rows.objectivePreference') }}</span>
            <strong>{{ collectableObjectiveLabel(experiment) }}</strong>
          </div>
        </div>

        <div v-if="displayMode === 'detailed'" class="rotation-plan-stats">
          <div class="is-primary-metric">
            <span>{{ totalExpectedLabel(experiment) }}</span>
            <div v-if="isCollectableTierCountExperiment(experiment)" class="database-tier-count-list">
              <div v-for="entry in visibleTierMetricEntries(collectableMetricTierCounts(experiment, 'expected'))" :key="entry.key" class="database-tier-count-entry">
                <strong>{{ formatTierCountValue(entry.value) }}</strong>
                <small v-if="entry.label">{{ entry.label }}</small>
              </div>
            </div>
            <strong v-else>
              {{ totalExpectedValue(experiment) }}
              <small v-if="experiment.kind !== 'collectable'" class="rotation-plan-stat-unit">{{ t('game.units.count') }}</small>
            </strong>
          </div>
          <div>
            <span>{{ maxMetricLabel(experiment) }}</span>
            <div v-if="isCollectableTierCountExperiment(experiment)" class="database-tier-count-list">
              <div v-for="entry in visibleTierMetricEntries(collectableMetricTierCounts(experiment, 'max'))" :key="entry.key" class="database-tier-count-entry">
                <strong>{{ formatTierCountValue(entry.value) }}</strong>
                <small v-if="entry.label">{{ entry.label }}</small>
              </div>
            </div>
            <strong v-else>
              {{ maxValue(experiment) }}
              <small v-if="experiment.kind !== 'collectable'" class="rotation-plan-stat-unit">{{ t('game.units.count') }}</small>
            </strong>
            <small>{{ t('solver.strategy.yieldChance', { chance: formatChance(maxChance(experiment)) }) }}</small>
          </div>
          <div>
            <span>{{ minMetricLabel(experiment) }}</span>
            <div v-if="isCollectableTierCountExperiment(experiment)" class="database-tier-count-list">
              <div v-for="entry in visibleTierMetricEntries(collectableMetricTierCounts(experiment, 'min'))" :key="entry.key" class="database-tier-count-entry">
                <strong>{{ formatTierCountValue(entry.value) }}</strong>
                <small v-if="entry.label">{{ entry.label }}</small>
              </div>
            </div>
            <strong v-else>
              {{ minValue(experiment) }}
              <small v-if="experiment.kind !== 'collectable'" class="rotation-plan-stat-unit">{{ t('game.units.count') }}</small>
            </strong>
            <small>{{ t('solver.strategy.yieldChance', { chance: formatChance(minChance(experiment)) }) }}</small>
          </div>
        </div>

        <div v-if="displayMode === 'detailed'" class="rotation-preview-list">
          <div v-if="experiment.kind === 'collectable'" class="rotation-strip collectable-strategy-strip">
            <h4>{{ t('experimentDatabase.rotations.strategyPreview') }}</h4>
            <div class="collectable-rule-preview-list">
              <div
                v-for="rule in enabledCollectableRules(experiment).slice(0, 3)"
                :key="`${experiment.id}-${rule.id}`"
                class="collectable-rule-preview"
              >
                <strong>{{ rule.name }}</strong>
                <div class="rotation-icons">
                  <template v-for="(action, index) in previewCollectableActions(rule)" :key="`${experiment.id}-${rule.id}-${action}-${index}`">
                    <span class="rotation-icon-wrap rotation-action">
                      <img v-if="collectableActionIcon(experiment, action)" :src="collectableActionIcon(experiment, action)" class="rotation-icon" :alt="collectableActionLabel(experiment, action)" />
                      <i v-else class="pi pi-sparkles text-xs"></i>
                    </span>
                    <i v-if="index < previewCollectableActions(rule).length - 1" class="pi pi-angle-right rotation-arrow"></i>
                  </template>
                </div>
              </div>
              <p v-if="enabledCollectableRules(experiment).length === 0" class="strategy-preview-empty">
                {{ t('experimentDatabase.rotations.noStrategyPreview') }}
              </p>
            </div>
          </div>
          <div v-else class="rotation-strip">
            <h4>{{ hideRevisitExperimentFeatures ? t('experimentDatabase.rotations.preview') : t('experimentDatabase.rotations.primary') }}</h4>
            <div class="rotation-icons">
              <template v-for="(step, index) in regularPrimaryRotation(experiment)" :key="`p-${experiment.id}-${index}`">
                <span class="rotation-icon-wrap" :class="step.type === 'gather' ? 'rotation-gather' : 'rotation-action'">
                  <img v-if="rotationIcon(experiment, step)" :src="rotationIcon(experiment, step)" class="rotation-icon" alt="" />
                  <i v-else class="pi pi-sparkles text-xs"></i>
                </span>
                <i v-if="index < regularPrimaryRotation(experiment).length - 1" class="pi pi-angle-right rotation-arrow"></i>
              </template>
            </div>
          </div>
          <div v-if="experiment.kind !== 'collectable' && !hideRevisitExperimentFeatures && regularRevisitRotation(experiment).length" class="rotation-strip">
            <h4>{{ t('experimentDatabase.rotations.revisit') }}</h4>
            <div class="rotation-icons">
              <template v-for="(step, index) in regularRevisitRotation(experiment)" :key="`r-${experiment.id}-${index}`">
                <span class="rotation-icon-wrap" :class="step.type === 'gather' ? 'rotation-gather' : 'rotation-revisit'">
                  <img v-if="rotationIcon(experiment, step)" :src="rotationIcon(experiment, step)" class="rotation-icon" alt="" />
                  <i v-else class="pi pi-sparkles text-xs"></i>
                </span>
                <i v-if="index < regularRevisitRotation(experiment).length - 1" class="pi pi-angle-right rotation-arrow"></i>
              </template>
            </div>
          </div>
        </div>

        <div v-if="displayMode === 'detailed'" class="card-footer">
          <span>{{ t('experimentDatabase.createdAt', { time: formatCreatedAt(experiment.createdAt) }) }}</span>
          <div class="action-bar">
            <Button icon="pi pi-copy" :label="t('experimentDatabase.actions.edit')" class="p-button-sm p-button-text library-action" @click="handleEdit(experiment)" />
            <Button icon="pi pi-trash" :label="t('experimentDatabase.actions.delete')" class="p-button-sm p-button-text p-button-danger library-action" @click="deleteExperiment(experiment.id)" />
          </div>
        </div>
      </article>
    </div>

    <Teleport to="body">
      <Transition name="stale-snapshot">
        <div v-if="pendingEditExperiment" class="stale-snapshot-dialog" role="dialog" aria-modal="true">
          <button
            type="button"
            class="stale-snapshot-backdrop"
            :aria-label="t('experimentDatabase.snapshot.cancel')"
            @click="cancelStaleSnapshotDialog"
          ></button>
          <section class="stale-snapshot-panel">
            <div class="stale-snapshot-icon">
              <i class="pi pi-history"></i>
            </div>
            <div class="stale-snapshot-content">
              <p class="stale-snapshot-kicker">{{ t('experimentDatabase.snapshot.staleKicker') }}</p>
              <h3>{{ t('experimentDatabase.snapshot.staleTitle') }}</h3>
              <p>{{ t('experimentDatabase.snapshot.staleDesc') }}</p>
            </div>
            <div class="stale-snapshot-actions">
              <Button
                icon="pi pi-arrow-right"
                :label="t('experimentDatabase.snapshot.loadAnyway')"
                class="p-button-sm p-button-primary stale-snapshot-action"
                @click="loadExperiment(pendingEditExperiment)"
              />
              <Button
                icon="pi pi-times"
                :label="t('experimentDatabase.snapshot.cancel')"
                class="p-button-sm p-button-text stale-snapshot-action"
                @click="cancelStaleSnapshotDialog"
              />
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>

    <SaveEntryDialog
      v-if="pendingImport"
      v-model="isImportSaveDialogOpen"
      :title="importSaveTitle()"
      :description="importSaveDescription()"
      :name-label="t('saveEntry.nameLabel')"
      :default-name="pendingImport.defaultName"
      :confirm-label="importSaveConfirmLabel()"
      :cancel-label="t('saveEntry.cancel')"
      @confirm="confirmImportSave"
    >
      <JsonImportPreview :projection="pendingImport" />
    </SaveEntryDialog>

    <JsonImportWarningDialog
      v-model="isImportWarningOpen"
      :kicker="t('jsonImport.warning.kicker')"
      :title="t('jsonImport.warning.experimentDatabaseTitle')"
      :description="t('jsonImport.warning.experimentDatabaseDescription')"
      :continue-label="t('jsonImport.warning.continueToTome')"
      :cancel-label="t('jsonImport.warning.cancel')"
      @continue="openImportSaveDialog"
    />

    <JsonImportErrorDialog
      :model-value="!!importErrorKey"
      :title="t('jsonImport.errors.title')"
      :description="importErrorDescription()"
      :close-label="t('jsonImport.errors.close')"
      @update:model-value="importErrorKey = null"
    />

    <FloatingJsonImportButton
      :label="t('jsonImport.actions.upload')"
      @select="handleImportFile"
    />
  </div>
</template>

<style scoped>
.experiment-database-page {
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
.experiment-list {
  display: grid;
  gap: 1rem;
}
.experiment-card {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border-radius: 18px;
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}
.experiment-card.is-compact {
  gap: 0.65rem;
  padding: 0.85rem 0.9rem;
  border-radius: 14px;
}
:global(html.dark .experiment-card) {
  background: #0f172a;
  border-color: #334155;
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
.is-compact .item-regular-badge,
.is-compact .item-collectable-badge,
.is-compact .item-crystal-badge,
.is-compact .snapshot-stale-badge {
  padding: 2px 8px;
  font-size: 0.68rem;
  line-height: 1.35;
}
.compact-action-bar {
  padding-top: 0.1rem;
}
.item-glv-badge,
.item-job-badge,
.item-regular-badge,
.item-collectable-badge,
.item-crystal-badge,
.snapshot-stale-badge {
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
.item-collectable-badge {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}
.item-crystal-badge {
  background: linear-gradient(135deg, #06b6d4, #0284c7);
}
.snapshot-stale-badge {
  background: linear-gradient(135deg, #f59e0b, #d97706);
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
}
.database-tier-count-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.7rem;
  margin-top: 0.45rem;
}
.database-tier-count-entry {
  min-width: 0;
  display: inline-flex;
  align-items: baseline;
  gap: 0.22rem;
}
.database-tier-count-entry strong {
  margin: 0;
  font-size: 1rem;
}
.database-tier-count-entry small {
  margin: 0;
  color: #64748b;
  font-size: 0.66rem;
  font-weight: 800;
  line-height: 1.15;
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
.rotation-revisit {
  background: #2563eb;
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

@media (max-width: 560px) {
  .collectable-rule-preview {
    max-width: 100%;
  }
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
  font-size: 1.5rem;
}
@media (min-width: 640px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 560px) {
  .summary-info-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .rotation-plan-stats {
    grid-template-columns: 1fr;
  }
}
@media (min-width: 768px) {
  .experiment-database-page {
    padding: 2.5rem 2rem;
  }
  .card-footer {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
.stale-snapshot-dialog {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.stale-snapshot-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgb(15 23 42 / 0.48);
}
.stale-snapshot-panel {
  position: relative;
  z-index: 1;
  width: min(92vw, 460px);
  display: grid;
  gap: 1rem;
  padding: 1.15rem;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 60px rgb(15 23 42 / 0.2);
}
:global(html.dark .stale-snapshot-panel) {
  background: #0f172a;
  border-color: #334155;
  box-shadow: 0 20px 60px rgb(0 0 0 / 0.42);
}
.stale-snapshot-icon {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  color: #b45309;
  background: #fef3c7;
}
:global(html.dark .stale-snapshot-icon) {
  color: #fbbf24;
  background: rgb(120 53 15 / 0.34);
}
.stale-snapshot-content {
  display: grid;
  gap: 0.45rem;
}
.stale-snapshot-kicker {
  margin: 0;
  color: #d97706;
  font-size: 0.72rem;
  font-weight: 900;
}
.stale-snapshot-content h3,
.stale-snapshot-content p {
  margin: 0;
}
.stale-snapshot-content h3 {
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 900;
}
.stale-snapshot-content p {
  color: #64748b;
  font-size: 0.88rem;
  line-height: 1.65;
}
:global(html.dark .stale-snapshot-content h3) {
  color: #f8fafc;
}
:global(html.dark .stale-snapshot-content p) {
  color: #cbd5e1;
}
.stale-snapshot-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}
:deep(.stale-snapshot-action) {
  min-height: 2.25rem;
}
.stale-snapshot-enter-active,
.stale-snapshot-leave-active {
  transition: opacity 0.16s ease;
}
.stale-snapshot-enter-from,
.stale-snapshot-leave-to {
  opacity: 0;
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
