<script setup lang="ts">
defineOptions({ name: 'TomeLibrary' });

import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useLocalStorage } from '@vueuse/core';
import Button from 'primevue/button';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import SelectButton from 'primevue/selectbutton';
import MacroPreviewDialog from '../components/MacroPreviewDialog.vue';
import { useTomeLibrary } from '../composables/useTomeLibrary';
import { useSolver } from '../composables/useSolver';
import { useSettings } from '../composables/useSettings';
import { getActionName, getGatherableItemById, getItemEnglishName, getItemIcon, getItemName, currentLanguage } from '../services/gameData';
import { getRotationActionIconById } from '../services/actionIcons';
import { getCollectableActionIcon, getCollectableActionName } from '../services/collectableActions';
import { getCollectableScripRewardMeta } from '../services/collectableScripRewards';
import type { CollectableTierCounts } from '../types/collectable';
import type { SolverObjectiveMode, SolverRotationPlanKind, StoredCollectableTomeSnapshot, StoredTome, StoredTomeRotationStep } from '../types/game';
import { buildGatheringMacroFromStoredRotation, buildGatheringMacroGroupsFromStoredRotations, type MacroBuildOptions, type MacroBuildResult } from '../utils/macroGenerator';
import { gatherableItemJobs } from '../utils/gatherableItemJobs';
import { isModelVersionSnapshotStale } from '../utils/modelVersionStatus';
import { isCustomTierObjective, isTierCountObjective } from '../utils/collectableObjectivePresets';

const { t, locale } = useI18n();
const router = useRouter();
const { visibleTomes, deleteTome } = useTomeLibrary();
const { loadTomeForEditing } = useSolver();
const { macroSettings, solverSettings } = useSettings();
const searchQuery = ref('');
const isMacroPreviewOpen = ref(false);
const pendingEditTome = ref<StoredTome | null>(null);
const macroPreview = ref<MacroBuildResult | null>(null);
const displayMode = useLocalStorage<'compact' | 'detailed'>('frozen-rabbit-tome-library-display-mode', 'detailed');
const tierCountVisibilityEpsilon = 0.000001;
const displayModeOptions = computed(() => [
  { label: t('common.displayModes.compact'), value: 'compact' },
  { label: t('common.displayModes.detailed'), value: 'detailed' }
]);

type SnapshotMetricRow = {
  label: string;
  value: string;
  unit?: string;
  chance?: number;
  primary?: boolean;
};

const filteredTomes = computed(() => {
  currentLanguage.value;
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return visibleTomes.value;

  return visibleTomes.value.filter((tome) => {
    const customName = (tome.name ?? '').toLowerCase();
    const localizedName = getItemName(tome.itemId).toLowerCase();
    const englishName = getItemEnglishName(tome.itemId).toLowerCase();
    return customName.includes(query) || localizedName.includes(query) || englishName.includes(query);
  });
});

function itemMeta(tome: StoredTome) {
  return getGatherableItemById(tome.itemId);
}

function itemJobs(tome: StoredTome) {
  return gatherableItemJobs(itemMeta(tome));
}

function tomeDisplayName(tome: StoredTome) {
  return tome.name?.trim() || getItemName(tome.itemId);
}

function shouldShowItemSubtitle(tome: StoredTome) {
  return !!tome.name?.trim() && tome.name.trim() !== getItemName(tome.itemId);
}

function formatStats(tome: StoredTome) {
  return `${tome.input.stats.level}/${tome.input.stats.gathering}/${tome.input.stats.perception}`;
}

function formatGp(tome: StoredTome) {
  return `${tome.input.temporaryGp}/${tome.input.stats.gp}`;
}

function formatFood(tome: StoredTome) {
  if (!tome.input.food.foodId) return t('tomeLibrary.noFood');
  return `${getItemName(tome.input.food.foodId)} ${t(`solver.food.${tome.input.food.quality}`)}`;
}

function formatNodeState(tome: StoredTome) {
  return isCollectableTome(tome)
    ? t('tomeLibrary.nodeState.collectable', { gathering: tome.input.nodeBonuses.gatheringCount })
    : t('tomeLibrary.nodeState.regular', {
        gathering: tome.input.nodeBonuses.gatheringCount,
        yield: tome.input.nodeBonuses.yieldCount,
        extra: tome.input.nodeBonuses.extraRate
      });
}

function tomeObjectiveMode(tome: StoredTome): SolverObjectiveMode {
  return tome.lastSolvedSnapshot?.objectiveMode ?? 'expected';
}

function formatObjectiveMode(tome: StoredTome) {
  return t(`settings.solverModes.${tomeObjectiveMode(tome)}`);
}

function isCollectableTome(tome: StoredTome) {
  return tome.kind === 'collectable';
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

function tomeRotationPlans(tome: StoredTome) {
  const snapshot = tome.lastSolvedSnapshot;
  if (!snapshot || snapshot.kind !== 'regular') return [];
  return snapshot.rotationPlans?.length
    ? snapshot.rotationPlans
    : snapshot.rotation.length
      ? [{ kind: 'primary' as const, rotation: snapshot.rotation }]
      : [];
}

function rotationPlanTitle(kind: SolverRotationPlanKind) {
  return kind === 'revisit'
    ? t('solver.strategy.revisitRotation')
    : t('solver.strategy.primaryRotation');
}

function rotationCardTitle(tome: StoredTome, kind: SolverRotationPlanKind) {
  const revisit = tome.lastSolvedSnapshot?.kind === 'regular' ? tome.lastSolvedSnapshot.revisit : undefined;
  if (kind === 'primary' && revisit?.enabled && revisit.isFullGp && tomeRotationPlans(tome).length === 1) {
    return t('solver.strategy.rotationTitles.primaryWithRevisit');
  }

  return kind === 'revisit'
    ? t('solver.strategy.rotationTitles.revisit')
    : t('solver.strategy.rotationTitles.primary');
}

function handleEdit(tome: StoredTome) {
  if (shouldConfirmBeforeEdit(tome)) {
    pendingEditTome.value = tome;
    return;
  }

  loadTomeAndOpen(tome, true);
}

function loadTomeAndOpen(tome: StoredTome, syncObjectiveMode: boolean) {
  if (!loadTomeForEditing(tome, { syncObjectiveMode })) return;
  pendingEditTome.value = null;
  router.push('/solver');
}

function handleEditWithTomeMode() {
  if (!pendingEditTome.value) return;
  loadTomeAndOpen(pendingEditTome.value, true);
}

function handleEditWithCurrentMode() {
  if (!pendingEditTome.value) return;
  loadTomeAndOpen(pendingEditTome.value, false);
}

function cancelEditModeChoice() {
  pendingEditTome.value = null;
}

function handlePreviewMacro(tome: StoredTome) {
  if (isCollectableTome(tome)) return;

  const options: MacroBuildOptions = {
    resolveActionName: (_, actionId) => actionId ? getActionName(actionId) : '',
    formatGatherPrompt: formatMacroGatherPrompt
  };
  const plans = tomeRotationPlans(tome);
  const primaryRotation = plans[0]?.rotation ?? [];
  if (!primaryRotation.length) return;
  macroPreview.value = plans.length > 1
    ? buildGatheringMacroGroupsFromStoredRotations(plans.map((plan) => ({
        key: plan.kind,
        title: rotationPlanTitle(plan.kind),
        rotation: plan.rotation
      })), macroSettings.value, options)
    : buildGatheringMacroFromStoredRotation(primaryRotation, macroSettings.value, options);
  isMacroPreviewOpen.value = true;
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

function copyMacroLabel() {
  return t('tomeLibrary.actions.copyMacro');
}

function copyMacroIcon() {
  return 'pi pi-file-edit';
}

function collectableRootActionName(tome: StoredTome) {
  const rootAction = tome.lastSolvedSnapshot?.kind === 'collectable'
    ? tome.lastSolvedSnapshot.rootAction
    : undefined;
  if (!rootAction) return '-';
  return getCollectableActionName(rootAction.kind, itemMeta(tome)?.jobType || 'miner');
}

function collectableRootActionIcon(tome: StoredTome) {
  const rootAction = collectableSnapshot(tome)?.rootAction;
  if (!rootAction) return '';
  return getCollectableActionIcon(rootAction.kind, itemMeta(tome)?.jobType || 'miner');
}

function collectableSnapshot(tome: StoredTome): StoredCollectableTomeSnapshot | null {
  return tome.lastSolvedSnapshot?.kind === 'collectable' ? tome.lastSolvedSnapshot : null;
}

function collectableScoreLabel(tome: StoredTome) {
  const scoreKey = collectableScoreKey(tome);
  if (collectableUsesTierCountUnit(tome)) {
    return collectableTierCountLabel(scoreKey);
  }

  if (collectableUsesCustomScoreUnit(tome)) {
    return t(`collectableSolver.results.${scoreKey}Score`, { unit: t('collectableSolver.results.pointUnit') });
  }

  return t(`collectableSolver.results.${scoreKey}Score`, { unit: collectableScripUnit(tome) });
}

function collectableScoreKey(tome: StoredTome) {
  const snapshot = collectableSnapshot(tome);
  const mode = tomeObjectiveMode(tome);
  if (mode === 'max' && typeof snapshot?.maxScore === 'number') return 'max';
  if (mode === 'min' && typeof snapshot?.minScore === 'number') return 'min';
  return 'expected';
}

function collectableScore(tome: StoredTome) {
  const snapshot = collectableSnapshot(tome);
  const mode = tomeObjectiveMode(tome);
  if (collectableUsesTierCountUnit(tome)) {
    return formatTierCounts(collectableTierCountsForMode(snapshot, mode));
  }

  const fallbackRewardScore = collectableUsesScripUnit(tome) ? snapshot?.expectedReward?.scrip : undefined;
  const score = mode === 'max'
    ? snapshot?.maxScore ?? snapshot?.expectedScore ?? fallbackRewardScore
    : mode === 'min'
      ? snapshot?.minScore ?? snapshot?.expectedScore ?? fallbackRewardScore
      : snapshot?.expectedScore ?? fallbackRewardScore;
  return typeof score === 'number' ? Number(score.toFixed(2)) : '-';
}

function collectableScoreChance(tome: StoredTome) {
  const snapshot = collectableSnapshot(tome);
  const mode = tomeObjectiveMode(tome);
  if (mode === 'max') return snapshot?.maxScoreChance;
  if (mode === 'min') return snapshot?.minScoreChance;
  return undefined;
}

function formatChance(chance: number) {
  if (chance < 0.01) return '<0.01%';
  return `${chance.toFixed(2)}%`;
}

function formatChanceValue(chance: number) {
  if (chance < 0.01) return '<0.01';
  return Number(chance.toFixed(2)).toString();
}

function collectableScripMeta(tome: StoredTome) {
  const snapshot = collectableSnapshot(tome);
  return getCollectableScripRewardMeta(snapshot?.rewardItemId ?? snapshot?.rewardTableSummary?.rewardItemId);
}

function collectableScripUnit(tome: StoredTome) {
  return t(collectableScripMeta(tome).labelKey);
}

function collectableUsesScripUnit(tome: StoredTome) {
  return collectableSnapshot(tome)?.objective?.kind === 'scrip';
}

function collectableUsesTierCountUnit(tome: StoredTome) {
  return isTierCountObjective(collectableSnapshot(tome)?.objective);
}

function collectableUsesCustomScoreUnit(tome: StoredTome) {
  return isCustomTierObjective(collectableSnapshot(tome)?.objective);
}

function collectableScoreTitle(tome: StoredTome) {
  return collectableUsesScripUnit(tome)
    ? t(collectableScripMeta(tome).labelKey)
    : collectableScoreLabel(tome);
}

function collectableTierCountLabel(scoreKey: SolverObjectiveMode) {
  if (scoreKey === 'max') return t('collectableSolver.results.maxTierCounts');
  if (scoreKey === 'min') return t('collectableSolver.results.minTierCounts');
  return t('collectableSolver.results.expectedTierCounts');
}

function collectableTierCountsForMode(snapshot: StoredCollectableTomeSnapshot | null, mode: SolverObjectiveMode) {
  if (mode === 'max') return snapshot?.maxScoreTierCounts;
  if (mode === 'min') return snapshot?.minScoreTierCounts;
  return snapshot?.expectedTierCounts;
}

function tierMetricEntries(counts?: CollectableTierCounts) {
  const safeCounts = counts ?? { none: 0, low: 0, mid: 0, high: 0 };
  return [
    { key: 'high', label: t('collectableObjective.tiers.high'), value: safeCounts.high },
    { key: 'mid', label: t('collectableObjective.tiers.mid'), value: safeCounts.mid },
    { key: 'low', label: t('collectableObjective.tiers.low'), value: safeCounts.low }
  ];
}

function visibleTierMetricEntries(counts?: CollectableTierCounts) {
  const entries = tierMetricEntries(counts).filter((entry) => Math.abs(entry.value) > tierCountVisibilityEpsilon);
  return entries.length ? entries : [{ key: 'none', label: '', value: 0 }];
}

function formatTierCountValue(value: number) {
  return Number(value.toFixed(2)).toString();
}

function formatTierCounts(counts?: CollectableTierCounts) {
  return visibleTierMetricEntries(counts)
    .map((entry) => entry.label ? `${formatTierCountValue(entry.value)} ${entry.label}` : formatTierCountValue(entry.value))
    .join(' / ');
}

function relicBonusLabel(tome: StoredTome) {
  return tome.input.hasRelicToolBonus
    ? t('tomeLibrary.relicBonus.enabled')
    : t('tomeLibrary.relicBonus.disabled');
}

function shouldConfirmBeforeEdit(tome: StoredTome) {
  return hasObjectiveModeConflict(tome) || isTomeSnapshotStale(tome);
}

function hasObjectiveModeConflict(tome: StoredTome) {
  return tomeObjectiveMode(tome) !== solverSettings.value.objectiveMode;
}

function tomeScenario(tome: StoredTome) {
  return tome.kind === 'collectable' ? 'tome.collectable' as const : 'tome.regular' as const;
}

function isTomeSnapshotStale(tome: StoredTome) {
  return isModelVersionSnapshotStale(tomeScenario(tome), tome.lastSolvedSnapshot?.modelVersions);
}

function pendingEditHasModeConflict() {
  return pendingEditTome.value ? hasObjectiveModeConflict(pendingEditTome.value) : false;
}

function pendingEditHasStaleSnapshot() {
  return pendingEditTome.value ? isTomeSnapshotStale(pendingEditTome.value) : false;
}

function snapshotMetricRows(tome: StoredTome): SnapshotMetricRow[] {
  const snapshot = tome.lastSolvedSnapshot;
  if (!snapshot) return [];

  if (snapshot.kind === 'collectable') {
    if (isTierCountObjective(snapshot.objective)) {
      return [
        { label: t('collectableSolver.results.expectedTierCounts'), value: formatTierCounts(snapshot.expectedTierCounts), primary: true },
        { label: t('collectableSolver.results.maxTierCounts'), value: formatTierCounts(snapshot.maxScoreTierCounts), chance: snapshot.maxScoreChance },
        { label: t('collectableSolver.results.minTierCounts'), value: formatTierCounts(snapshot.minScoreTierCounts), chance: snapshot.minScoreChance }
      ];
    }

    const unit = isCustomTierObjective(snapshot.objective)
      ? t('collectableSolver.results.pointUnit')
      : collectableScripUnit(tome);

    return [
      { label: t('collectableSolver.results.expectedScore', { unit }), value: formatNumber(snapshot.expectedScore), primary: true },
      { label: t('collectableSolver.results.maxScore', { unit }), value: formatNumber(snapshot.maxScore), chance: snapshot.maxScoreChance },
      { label: t('collectableSolver.results.minScore', { unit }), value: formatNumber(snapshot.minScore), chance: snapshot.minScoreChance }
    ];
  }

  return [
    { label: t('tomeLibrary.snapshot.expectedYield'), value: formatNumber(snapshot.expectedYield), unit: t('game.units.count'), primary: true },
    { label: t('tomeLibrary.snapshot.maxYield'), value: formatNumber(snapshot.maxYield), unit: t('game.units.count'), chance: snapshot.maxYieldChance },
    { label: t('tomeLibrary.snapshot.minYield'), value: formatNumber(snapshot.minYield), unit: t('game.units.count'), chance: snapshot.minYieldChance }
  ];
}

function formatNumber(value?: number) {
  return typeof value === 'number' ? Number(value.toFixed(2)).toString() : '-';
}
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

    <div v-if="filteredTomes.length === 0" class="empty-state">
      <div class="empty-icon">
        <i class="pi pi-book"></i>
      </div>
      <h3>{{ searchQuery ? t('tomeLibrary.emptySearchTitle') : t('tomeLibrary.emptyTitle') }}</h3>
      <p>{{ searchQuery ? t('tomeLibrary.emptySearchDesc') : t('tomeLibrary.emptyDesc') }}</p>
    </div>

    <div v-else class="tome-list">
      <article
        v-for="tome in filteredTomes"
        :key="tome.id"
        class="tome-card"
        :class="{ 'is-compact': displayMode === 'compact' }"
      >
        <div class="item-section">
          <div class="item-icon-wrap bg-slate-100 dark:bg-slate-900">
            <img
              v-if="getItemIcon(tome.itemId)"
              :src="getItemIcon(tome.itemId)"
              :alt="tomeDisplayName(tome)"
              class="item-icon"
              loading="lazy"
            />
            <i v-else class="pi pi-box text-slate-400"></i>
          </div>

          <div class="item-info">
            <h3 class="item-name text-slate-800 dark:text-slate-100">{{ tomeDisplayName(tome) }}</h3>
            <p v-if="shouldShowItemSubtitle(tome)" class="item-subtitle">{{ getItemName(tome.itemId) }}</p>
            <div class="item-meta">
              <span class="item-glv-badge">{{ t('createGuide.glv') }} {{ itemMeta(tome)?.glv ?? '-' }}</span>
              <span
                v-for="job in itemJobs(tome)"
                :key="job"
                class="item-job-badge"
              >
                {{ t(`game.jobs.${job}`) }}
              </span>
              <span v-if="itemJobs(tome).length === 0" class="item-job-badge">-</span>
              <span v-if="isCollectableTome(tome) || itemMeta(tome)?.isCollectable" class="item-collectable-badge">
                <i class="pi pi-box"></i>
                {{ t('createGuide.collectableSystem') }}
              </span>
              <span v-else-if="itemMeta(tome)?.isCrystalGathering" class="item-crystal-badge">
                <i class="pi pi-sparkles"></i>
                {{ t('createGuide.crystalGatheringSystem') }}
              </span>
              <span v-else class="item-regular-badge">
                <i class="pi pi-compass"></i>
                {{ t('createGuide.regularSystem') }}
              </span>
              <span v-if="isTomeSnapshotStale(tome)" class="snapshot-stale-badge">
                <i class="pi pi-history"></i>
                {{ t('tomeLibrary.snapshot.staleBadge') }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="displayMode === 'compact'" class="compact-action-bar action-bar">
          <Button
            icon="pi pi-pencil"
            :label="t('tomeLibrary.actions.edit')"
            class="p-button-sm p-button-text library-action"
            @click="handleEdit(tome)"
          />
          <Button
            v-if="!isCollectableTome(tome)"
            :icon="copyMacroIcon()"
            :label="copyMacroLabel()"
            class="p-button-sm p-button-text library-action"
            @click="handlePreviewMacro(tome)"
          />
          <Button
            icon="pi pi-trash"
            :label="t('tomeLibrary.actions.delete')"
            class="p-button-sm p-button-text p-button-danger library-action"
            @click="deleteTome(tome.id)"
          />
        </div>

        <div v-if="displayMode === 'detailed'" class="summary-grid">
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
            <strong>{{ formatNodeState(tome) }}</strong>
          </div>
          <div class="summary-row" :class="{ 'summary-row-wide': !isCollectableTome(tome) }">
            <span>{{ t('tomeLibrary.rows.objectiveMode') }}</span>
            <strong>{{ formatObjectiveMode(tome) }}</strong>
          </div>
          <div v-if="isCollectableTome(tome)" class="summary-row">
            <span>{{ t('tomeLibrary.rows.relicBonus') }}</span>
            <strong>{{ relicBonusLabel(tome) }}</strong>
          </div>
        </div>

        <div v-if="displayMode === 'detailed' && snapshotMetricRows(tome).length" class="snapshot-metric-grid">
          <div
            v-for="metric in snapshotMetricRows(tome)"
            :key="metric.label"
            class="snapshot-metric"
            :class="{ 'is-primary-metric': metric.primary }"
          >
            <span>{{ metric.label }}</span>
            <strong>
              {{ metric.value }}
              <small v-if="metric.unit">{{ metric.unit }}</small>
            </strong>
            <small v-if="metric.chance !== undefined">
              {{ t('solver.strategy.yieldChance', { chance: formatChanceValue(metric.chance) }) }}
            </small>
          </div>
        </div>

        <div v-if="displayMode === 'detailed' && isCollectableTome(tome)" class="rotation-preview-list" :aria-label="t('tomeLibrary.rotationPreview')">
          <div class="collectable-tome-summary">
            <div class="collectable-method">
              <span class="collectable-method-label">{{ t('solver.strategy.rotationTitles.primary') }}</span>
              <div class="collectable-method-action">
                <span class="collectable-action-icon">
                  <img v-if="collectableRootActionIcon(tome)" :src="collectableRootActionIcon(tome)" alt="" />
                  <i v-else class="pi pi-sitemap"></i>
                </span>
                <strong>{{ t('tomeLibrary.startFromAction', { action: collectableRootActionName(tome) }) }}</strong>
              </div>
            </div>

            <div
              class="collectable-score"
              :class="{
                'is-tier-count': collectableUsesTierCountUnit(tome),
                'has-reward-icon': collectableUsesScripUnit(tome)
              }"
              :title="collectableScoreTitle(tome)"
            >
              <span>{{ collectableScoreLabel(tome) }}</span>
              <div class="collectable-score-value">
                <strong>{{ collectableScore(tome) }}</strong>
                <span
                  v-if="collectableUsesScripUnit(tome)"
                  class="collectable-scrip-icon"
                  :class="`is-${collectableScripMeta(tome).kind}`"
                  :aria-label="t(collectableScripMeta(tome).labelKey)"
                >
                  <img
                    v-if="collectableScripMeta(tome).iconUrl"
                    :src="collectableScripMeta(tome).iconUrl"
                    :alt="t(collectableScripMeta(tome).labelKey)"
                  />
                  <i v-else class="pi pi-question-circle" aria-hidden="true"></i>
                </span>
              </div>
              <small v-if="collectableScoreChance(tome) !== undefined" class="collectable-score-chance">
                {{ t('collectableSolver.results.scoreChance', { chance: formatChance(collectableScoreChance(tome) as number) }) }}
              </small>
            </div>
          </div>
        </div>

        <div v-else-if="displayMode === 'detailed'" class="rotation-preview-list" :aria-label="t('tomeLibrary.rotationPreview')">
          <div v-for="plan in tomeRotationPlans(tome)" :key="`${tome.id}-${plan.kind}`" class="rotation-preview-block">
            <div class="rotation-strip">
              <h4 class="rotation-strip-title">{{ rotationCardTitle(tome, plan.kind) }}</h4>
              <div class="rotation-icons">
              <template v-for="(step, index) in plan.rotation" :key="`${tome.id}-${plan.kind}-${index}`">
                <span
                  class="rotation-icon-wrap"
                  :class="step.type === 'gather' ? 'rotation-gather' : 'rotation-action'"
                >
                  <img v-if="rotationIcon(tome, step)" :src="rotationIcon(tome, step)" class="rotation-icon" alt="" />
                  <i v-else class="pi pi-sparkles text-xs"></i>
                </span>
                <i v-if="index < plan.rotation.length - 1" class="pi pi-angle-right rotation-arrow"></i>
              </template>
              </div>
            </div>
          </div>
        </div>

        <div v-if="displayMode === 'detailed'" class="card-footer">
          <span class="created-at">{{ t('tomeLibrary.createdAt', { time: formatCreatedAt(tome.createdAt) }) }}</span>
          <div class="action-bar">
            <Button
              icon="pi pi-pencil"
              :label="t('tomeLibrary.actions.edit')"
              class="p-button-sm p-button-text library-action"
              @click="handleEdit(tome)"
            />
            <Button
              v-if="!isCollectableTome(tome)"
              :icon="copyMacroIcon()"
              :label="copyMacroLabel()"
              class="p-button-sm p-button-text library-action"
              @click="handlePreviewMacro(tome)"
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

    <MacroPreviewDialog v-model="isMacroPreviewOpen" :macro="macroPreview" />

    <Teleport to="body">
      <Transition name="mode-choice">
        <div v-if="pendingEditTome" class="mode-choice-dialog" role="dialog" aria-modal="true">
          <button
            type="button"
            class="mode-choice-backdrop"
            :aria-label="t('tomeLibrary.editModeConflict.cancel')"
            @click="cancelEditModeChoice"
          ></button>
          <section class="mode-choice-panel">
            <div class="mode-choice-icon">
              <i class="pi pi-compass"></i>
            </div>
            <div class="mode-choice-content">
              <p class="mode-choice-kicker">
                {{ pendingEditHasStaleSnapshot() ? t('tomeLibrary.snapshot.staleKicker') : t('tomeLibrary.editModeConflict.kicker') }}
              </p>
              <h3>
                {{ pendingEditHasStaleSnapshot() ? t('tomeLibrary.snapshot.staleTitle') : t('tomeLibrary.editModeConflict.title') }}
              </h3>
              <p v-if="pendingEditHasStaleSnapshot()">
                {{ t('tomeLibrary.snapshot.staleDesc') }}
              </p>
              <p v-if="pendingEditHasModeConflict()">
                {{ t('tomeLibrary.editModeConflict.desc', {
                  tomeMode: formatObjectiveMode(pendingEditTome),
                  currentMode: t(`settings.solverModes.${solverSettings.objectiveMode}`)
                }) }}
              </p>
            </div>
            <div class="mode-choice-actions">
              <Button
                icon="pi pi-refresh"
                :label="pendingEditHasModeConflict() ? t('tomeLibrary.editModeConflict.useTomeMode') : t('tomeLibrary.snapshot.loadAnyway')"
                class="p-button-sm p-button-primary mode-choice-action"
                @click="handleEditWithTomeMode"
              />
              <Button
                v-if="pendingEditHasModeConflict()"
                icon="pi pi-arrow-right"
                :label="t('tomeLibrary.editModeConflict.useCurrentMode')"
                class="p-button-sm p-button-outlined mode-choice-action"
                @click="handleEditWithCurrentMode"
              />
              <Button
                icon="pi pi-times"
                :label="t('tomeLibrary.editModeConflict.cancel')"
                class="p-button-sm p-button-text mode-choice-action"
                @click="cancelEditModeChoice"
              />
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
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

.tome-card.is-compact {
  gap: 0.65rem;
  padding: 0.85rem 0.9rem;
  border-radius: 14px;
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
  width: 60px;
  height: 60px;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
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

.item-name {
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.35;
  margin: 0;
  overflow-wrap: anywhere;
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

@media (min-width: 640px) {
  .summary-row-wide {
    grid-column: 1 / -1;
  }
}

:global(html.dark .summary-row strong) {
  color: #e2e8f0;
}

.rotation-preview-list {
  display: grid;
  gap: 0.6rem;
}

.rotation-preview-block {
  display: grid;
}

.rotation-strip {
  display: grid;
  gap: 0.55rem;
  padding: 0.8rem 0.85rem;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
}

.rotation-strip-title {
  margin: 0;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1.2;
}

.rotation-icons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

:global(html.dark .rotation-strip) {
  background: rgb(15 23 42 / 0.6);
  border-color: #1e293b;
}

:global(html.dark .rotation-strip-title) {
  color: #94a3b8;
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

.snapshot-metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.snapshot-metric {
  min-width: 0;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 0.65rem 0.75rem;
}

.snapshot-metric.is-primary-metric {
  border-color: rgb(82 168 144 / 0.55);
  background: rgb(240 253 244 / 0.86);
}

:global(html.dark .snapshot-metric) {
  background: #1e293b;
  border-color: #334155;
}

:global(html.dark .snapshot-metric.is-primary-metric) {
  background: rgb(20 83 45 / 0.22);
}

.snapshot-metric span,
.snapshot-metric strong,
.snapshot-metric small {
  display: block;
}

.snapshot-metric span {
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 800;
  line-height: 1.2;
}

.snapshot-metric strong {
  margin-top: 0.15rem;
  color: #0f172a;
  font-size: 1.12rem;
  font-weight: 900;
  line-height: 1.1;
}

.snapshot-metric strong small {
  display: inline;
  margin-left: 0.15rem;
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 900;
}

.snapshot-metric > small {
  margin-top: 0.2rem;
  color: #64748b;
  font-size: 0.66rem;
  font-weight: 800;
}

:global(html.dark .snapshot-metric span),
:global(html.dark .snapshot-metric > small),
:global(html.dark .snapshot-metric strong small) {
  color: #94a3b8;
}

:global(html.dark .snapshot-metric strong) {
  color: #f8fafc;
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

.collectable-tome-summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.9rem;
  padding: 0.85rem;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: linear-gradient(135deg, #f8fafc 0%, #eefdf6 100%);
}

:global(html.dark .collectable-tome-summary) {
  border-color: #1e293b;
  background: linear-gradient(135deg, rgb(15 23 42 / 0.72) 0%, rgb(20 83 45 / 0.18) 100%);
}

.collectable-method {
  min-width: 0;
  display: grid;
  gap: 0.45rem;
}

.collectable-method-label,
.collectable-score span:first-child {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  line-height: 1.2;
}

:global(html.dark .collectable-method-label),
:global(html.dark .collectable-score span:first-child) {
  color: #94a3b8;
}

.collectable-method-action {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.collectable-action-icon {
  width: 2.35rem;
  height: 2.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 10px;
  background: #dff7ec;
  color: #3f8f79;
  box-shadow: inset 0 0 0 1px rgb(82 168 144 / 0.16);
}

:global(html.dark .collectable-action-icon) {
  background: rgb(20 83 45 / 0.34);
  color: #99f6e4;
  box-shadow: inset 0 0 0 1px rgb(94 234 212 / 0.12);
}

.collectable-action-icon img {
  width: 2.35rem;
  height: 2.35rem;
  object-fit: cover;
  image-rendering: pixelated;
}

.collectable-method-action strong {
  min-width: 0;
  color: #1e293b;
  font-size: 0.98rem;
  font-weight: 900;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

:global(html.dark .collectable-method-action strong) {
  color: #f8fafc;
}

.collectable-score {
  min-width: 8rem;
  max-width: min(18rem, 100%);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-self: end;
  gap: 0.15rem;
  text-align: right;
}

.collectable-score-value {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  margin-top: 0.18rem;
}

.collectable-score strong {
  color: #0f766e;
  font-size: 1.18rem;
  font-weight: 950;
  line-height: 1;
  overflow-wrap: anywhere;
}

.collectable-score.is-tier-count {
  max-width: 18rem;
}

.collectable-score-chance {
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 1.2;
}

:global(html.dark .collectable-score-chance) {
  color: #cbd5e1;
}

:global(html.dark .collectable-score strong) {
  color: #99f6e4;
}

.collectable-scrip-icon {
  width: 1.75rem;
  height: 1.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid #d1fae5;
  border-radius: 8px;
  background: white;
  color: #64748b;
  box-shadow: 0 5px 14px rgb(15 23 42 / 0.08);
}

:global(html.dark .collectable-scrip-icon) {
  border-color: #334155;
  background: rgb(2 6 23 / 0.52);
  color: #94a3b8;
  box-shadow: 0 8px 16px rgb(0 0 0 / 0.22);
}

.collectable-scrip-icon img {
  width: 1.45rem;
  height: 1.45rem;
  object-fit: contain;
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

@media (max-width: 560px) {
  .collectable-tome-summary {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .collectable-score {
    min-width: 0;
    justify-self: start;
    align-items: flex-start;
    text-align: left;
    padding-top: 0.7rem;
    border-top: 1px solid rgb(209 250 229 / 0.72);
  }

  .collectable-score-value {
    justify-content: flex-start;
  }

  .snapshot-metric-grid {
    grid-template-columns: 1fr;
  }

  :global(html.dark .collectable-score) {
    border-top-color: #334155;
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

.mode-choice-dialog {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.mode-choice-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgb(15 23 42 / 0.42);
  backdrop-filter: blur(5px);
}

.mode-choice-panel {
  position: relative;
  z-index: 1;
  width: min(100%, 31rem);
  display: grid;
  gap: 1rem;
  padding: 1.15rem;
  border-radius: 18px;
  border: 1px solid #dbeafe;
  background: white;
  box-shadow: 0 24px 70px rgb(15 23 42 / 0.22);
}

:global(html.dark .mode-choice-panel) {
  border-color: #334155;
  background: #0f172a;
  box-shadow: 0 24px 70px rgb(0 0 0 / 0.5);
}

.mode-choice-icon {
  width: 2.75rem;
  height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #dcfce7;
  color: #15803d;
  font-size: 1.15rem;
}

:global(html.dark .mode-choice-icon) {
  background: rgb(20 83 45 / 0.34);
  color: #bbf7d0;
}

.mode-choice-content {
  display: grid;
  gap: 0.45rem;
}

.mode-choice-kicker {
  margin: 0;
  color: #52a890;
  font-size: 0.72rem;
  font-weight: 900;
  line-height: 1.2;
}

.mode-choice-content h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1.18rem;
  font-weight: 900;
  line-height: 1.25;
}

:global(html.dark .mode-choice-content h3) {
  color: #f8fafc;
}

.mode-choice-content p:last-child {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 650;
  line-height: 1.6;
}

:global(html.dark .mode-choice-content p:last-child) {
  color: #cbd5e1;
}

.mode-choice-actions {
  display: grid;
  gap: 0.55rem;
}

:deep(.mode-choice-action) {
  width: 100%;
  justify-content: center;
  border-radius: 0.8rem;
  min-height: 2.5rem;
  font-weight: 800;
}

.mode-choice-enter-active,
.mode-choice-leave-active {
  transition: opacity 0.16s ease;
}

.mode-choice-enter-active .mode-choice-panel,
.mode-choice-leave-active .mode-choice-panel {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.mode-choice-enter-from,
.mode-choice-leave-to {
  opacity: 0;
}

.mode-choice-enter-from .mode-choice-panel,
.mode-choice-leave-to .mode-choice-panel {
  opacity: 0;
  transform: translateY(0.4rem) scale(0.98);
}

@media (min-width: 560px) {
  .mode-choice-actions {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
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
