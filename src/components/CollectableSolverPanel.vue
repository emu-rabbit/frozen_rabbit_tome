<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import type { AppliedFoodBonus, FoodSelection, GatherableItem, NodeBonuses, PlayerStats } from '../types/game';
import type { CollectableObjective, CollectableRewardTable, CollectableSolverRequest, CollectableSolverResult } from '../types/collectable';
import { useCollectableSolver } from '../composables/useCollectableSolver';
import FloatingJsonExportButton from './FloatingJsonExportButton.vue';
import CollectablePolicyView from './CollectablePolicyView.vue';
import CollectableDebugDialog from './CollectableDebugDialog.vue';
import CollectableObjectivePreferenceDialog from './CollectableObjectivePreferenceDialog.vue';
import { getCollectableRewardTable } from '../services/collectableRewards';
import { getCollectableActionIcon, getCollectableActionName } from '../services/collectableActions';
import { getItemName } from '../services/gameData';
import { useSettings } from '../composables/useSettings';
import {
  createCollectableObjectiveOptions,
  getDefaultCollectableObjectivePresetId
} from '../utils/collectableObjectivePresets';
import { MIN_COLLECTABLE_LEVEL } from '../utils/collectableMechanics';
import {
  buildCollectableDecisionTreeHtml,
  buildCollectableDecisionTreeSnapshot,
  buildHtmlExportFileName,
  downloadHtmlFile,
  type CollectableDecisionTreeHtmlDocument,
  type CollectableDecisionTreeHtmlRow
} from '../utils/collectableDecisionTreeHtmlExport';
import {
  buildCollectableSolverJsonExportAsync,
  buildJsonExportFileName,
  downloadJsonFile
} from '../utils/tomeJsonExport';

const props = defineProps<{
  activeItem: GatherableItem;
  baseStats: PlayerStats;
  effectiveStats: PlayerStats;
  baseValues: { Gathering: number; Perception: number } | null;
  itemRealLevel: number;
  nodeBonuses: NodeBonuses;
  temporaryGp: number;
  selectedFood: FoodSelection;
  appliedFoodBonus: AppliedFoodBonus;
  debugMode: boolean;
}>();

const emit = defineEmits<{
  save: [result: CollectableSolverResult];
}>();

const { t, locale } = useI18n();
const { isDarkMode, solverSettings } = useSettings();
const {
  collectableObjective,
  collectableResult,
  isCollectableSolving,
  collectableError,
  collectableErrorDetail,
  solveCollectable,
  clearCollectableResult
} = useCollectableSolver();
const isDebugDialogOpen = ref(false);
const isObjectiveDialogOpen = ref(false);
const isSaved = ref(false);
const isDecisionTreeExported = ref(false);
const isDecisionTreeExporting = ref(false);
const isJsonExported = ref(false);
const isJsonExporting = ref(false);
const rewardTable = ref<CollectableRewardTable | null>(null);
let savedTimer: ReturnType<typeof window.setTimeout> | null = null;
let exportedTimer: ReturnType<typeof window.setTimeout> | null = null;
let jsonExportTimer: ReturnType<typeof window.setTimeout> | null = null;

const isCollectableLevelLocked = computed(() => props.effectiveStats.level < MIN_COLLECTABLE_LEVEL);
const canSolve = computed(() => !!props.baseValues && !!props.activeItem.itemId && !isCollectableLevelLocked.value);
const isWorkerError = computed(() => collectableError.value === 'workerStale' || collectableError.value === 'workerFailed');
const nextMemoCapacityPower = computed(() => collectableErrorDetail.value?.nextMemoCapacityPower ?? null);
const canRaiseMemoBudget = computed(() => collectableError.value === 'memoCapacity' && nextMemoCapacityPower.value !== null);
const selectedObjectiveLabel = computed(() => {
  if (!rewardTable.value) return t('collectableObjective.title');
  const option = createCollectableObjectiveOptions(rewardTable.value)
    .find((entry) => entry.id === collectableObjective.value.presetId || (entry.id === 'scrip' && collectableObjective.value.kind === 'scrip'));
  return option ? t(option.labelKey) : t('collectableObjective.title');
});

onBeforeUnmount(() => {
  if (savedTimer) {
    window.clearTimeout(savedTimer);
  }
  if (exportedTimer) {
    window.clearTimeout(exportedTimer);
  }
  if (jsonExportTimer) {
    window.clearTimeout(jsonExportTimer);
  }
});

watch(() => [
  props.activeItem.itemId,
  props.effectiveStats.level,
  props.effectiveStats.gathering,
  props.effectiveStats.perception,
  props.effectiveStats.gp,
  props.temporaryGp,
  props.nodeBonuses.baseIntegrity,
  props.nodeBonuses.gatheringCount,
  solverSettings.value.objectiveMode,
  solverSettings.value.collectableRelicToolBonus
], () => {
  clearCollectableResult();
  isSaved.value = false;
  isDecisionTreeExported.value = false;
  isJsonExported.value = false;
}, { deep: true });

watch(() => props.activeItem.itemId, async () => {
  rewardTable.value = null;
  if (!props.activeItem.itemId) return;

  try {
    const table = await getCollectableRewardTable(props.activeItem.itemId);
    rewardTable.value = table;
    if (table) applyDefaultObjective(table);
  } catch (error) {
    console.error('Collectable reward table loading failed:', error);
  }
}, { immediate: true });

function applyDefaultObjective(table: CollectableRewardTable) {
  const defaultId = getDefaultCollectableObjectivePresetId(table);
  const option = createCollectableObjectiveOptions(table).find((entry) => entry.id === defaultId);
  if (option) {
    collectableObjective.value = option.objective;
  }
}

async function handleSolve() {
  await runCollectableSolve();
}

async function handleRaiseMemoBudget() {
  if (nextMemoCapacityPower.value === null) return;
  await runCollectableSolve(nextMemoCapacityPower.value);
}

async function runCollectableSolve(manualMemoCapacityPower?: number) {
  if (!props.baseValues || !canSolve.value || isCollectableLevelLocked.value) return;

  await solveCollectable({
    activeItem: props.activeItem,
    baseStats: { ...props.baseStats },
    stats: { ...props.effectiveStats },
    baseValues: {
      Gathering: props.baseValues.Gathering,
      Perception: props.baseValues.Perception
    },
    itemLevel: props.itemRealLevel,
    nodeBonuses: { ...props.nodeBonuses },
    temporaryGp: Math.min(props.temporaryGp, props.effectiveStats.gp),
    selectedFood: { ...props.selectedFood },
    debugMode: props.debugMode,
    objective: collectableObjective.value,
    manualMemoCapacityPower
  });
}

function handleObjectiveChange(objective: CollectableObjective) {
  collectableObjective.value = objective;
  clearCollectableResult();
  isSaved.value = false;
  isDecisionTreeExported.value = false;
  isJsonExported.value = false;
}

function handleSave() {
  if (!collectableResult.value) return;

  emit('save', collectableResult.value);
}

function reloadPage() {
  if (typeof window === 'undefined') return;
  window.location.reload();
}

async function handleExportDecisionTree() {
  const request = buildCurrentCollectableRequest();
  if (!collectableResult.value || !request || isDecisionTreeExported.value || isDecisionTreeExporting.value) return;

  isDecisionTreeExporting.value = true;
  await nextTick();
  await waitForUiFrame();

  try {
    const generatedAt = new Date().toISOString();
    const html = buildCollectableDecisionTreeHtml(buildDecisionTreeHtmlDocument(request, collectableResult.value, generatedAt));

    downloadHtmlFile(html, buildHtmlExportFileName({
      item: props.activeItem,
      scenarioLabel: t('collectableSolver.export.fileScenario')
    }));

    isDecisionTreeExported.value = true;
    if (exportedTimer) {
      window.clearTimeout(exportedTimer);
    }
    exportedTimer = window.setTimeout(() => {
      isDecisionTreeExported.value = false;
      exportedTimer = null;
    }, 1600);
  } finally {
    isDecisionTreeExporting.value = false;
  }
}

async function handleExportCollectableSolverJson() {
  const request = buildCurrentCollectableRequest();
  if (!collectableResult.value || !request || isJsonExported.value || isJsonExporting.value) return;

  isJsonExporting.value = true;
  await nextTick();
  await waitForUiFrame();

  try {
    const payload = await buildCollectableSolverJsonExportAsync({
      meta: { locale: locale.value },
      item: props.activeItem,
      request,
      result: collectableResult.value,
      food: {
        selection: { ...props.selectedFood },
        appliedBonus: { ...props.appliedFoodBonus },
        baseStats: { ...props.baseStats }
      }
    });

    downloadJsonFile(payload, buildJsonExportFileName({
      item: props.activeItem,
      scenario: 'tome.collectable',
      scenarioLabel: t('jsonExport.scenarios.tomeCollectable')
    }));
    markJsonExported();
  } catch (error) {
    console.error('Collectable solver JSON export failed:', error);
  } finally {
    isJsonExporting.value = false;
  }
}

function markJsonExported() {
  isJsonExported.value = true;
  if (jsonExportTimer) window.clearTimeout(jsonExportTimer);
  jsonExportTimer = window.setTimeout(() => {
    isJsonExported.value = false;
    jsonExportTimer = null;
  }, 1600);
}

function waitForUiFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.setTimeout(resolve, 0);
    });
  });
}

function buildCurrentCollectableRequest(): CollectableSolverRequest | null {
  if (!props.baseValues || !rewardTable.value) return null;

  return {
    stats: { ...props.effectiveStats },
    baseValues: {
      Gathering: props.baseValues.Gathering,
      Perception: props.baseValues.Perception
    },
    itemLevel: props.itemRealLevel,
    nodeBonuses: { ...props.nodeBonuses },
    temporaryGp: Math.min(props.temporaryGp, props.effectiveStats.gp),
    jobType: props.activeItem.jobType || 'miner',
    rewardTable: rewardTable.value,
    objective: collectableResult.value?.objective ?? collectableObjective.value,
    objectiveMode: collectableResult.value?.objectiveMode ?? solverSettings.value.objectiveMode,
    hasRelicToolBonus: solverSettings.value.collectableRelicToolBonus,
    isTimedNode: props.activeItem.isTimedNode ?? false,
    debugMode: !!collectableResult.value?.debug
  };
}

function buildDecisionTreeHtmlDocument(
  request: CollectableSolverRequest,
  result: CollectableSolverResult,
  generatedAt: string
): CollectableDecisionTreeHtmlDocument {
  return {
    locale: locale.value,
    generatedAt,
    theme: isDarkMode.value ? 'dark' : 'light',
    item: props.activeItem,
    texts: buildDecisionTreeTexts(),
    inputSections: buildDecisionTreeInputSections(request, result),
    resultMetrics: [],
    modelVersionRows: [],
    policy: buildCollectableDecisionTreeSnapshot(result.policy, {
      actionName: (kind) => getCollectableActionName(kind, request.jobType),
      actionIcon: (kind) => getCollectableActionIcon(kind, request.jobType),
      branchLabel: (labelKey) => t(labelKey),
      conditionLabel: (conditionKey) => t(conditionKey),
      formatStateSummary: (state) => t('collectableSolver.policy.stateSummary', {
        gp: state.gp,
        integrity: state.integrity,
        collectability: state.collectability
      }),
      guidedQuestionLabels: buildGuidedQuestionLabels()
    })
  };
}

function buildDecisionTreeTexts() {
  const itemName = props.activeItem.nameLocale || props.activeItem.nameEn;

  return {
    documentTitle: t('collectableSolver.export.title', { item: itemName }),
    appTitle: t('app.title'),
    appSubtitle: t('collectableSolver.results.kicker'),
    inputTitle: t('collectableSolver.export.inputTitle'),
    resultTitle: t('collectableSolver.results.title'),
    modelVersionsTitle: t('collectableSolver.export.modelVersionsTitle'),
    howToReadTitle: t('collectableSolver.export.howToReadTitle'),
    howToReadDescription: t('collectableSolver.export.howToReadDesc'),
    generatedAt: t('collectableSolver.export.exportedAt'),
    policy: {
      now: t('collectableSolver.policy.now'),
      confirmOutcome: t('collectableSolver.policy.confirmOutcome'),
      nextBranches: t('collectableSolver.policy.nextBranches'),
      confirmHint: t('collectableSolver.policy.confirmHint'),
      confluentHint: t('collectableSolver.policy.confluentHint'),
      deterministicHint: t('collectableSolver.policy.deterministicHint'),
      collectQuestion: t('collectableSolver.policy.collectQuestion'),
      standardQuestion: t('collectableSolver.policy.standardQuestion'),
      wiseQuestion: t('collectableSolver.policy.wiseQuestion'),
      revisitQuestion: t('collectableSolver.policy.revisitQuestion'),
      collectabilityQuestion: t('collectableSolver.policy.collectabilityQuestion'),
      integrityQuestion: t('collectableSolver.policy.integrityQuestion'),
      integrityOption: t('collectableSolver.policy.integrityOption', { integrity: '{integrity}' }),
      collectOptions: {
        success: t('collectableSolver.policy.collectOptions.success'),
        failed: t('collectableSolver.policy.collectOptions.failed')
      },
      standardOptions: {
        proc: t('collectableSolver.policy.standardOptions.proc'),
        noProc: t('collectableSolver.policy.standardOptions.noProc')
      },
      wiseOptions: {
        proc: t('collectableSolver.policy.wiseOptions.proc'),
        noProc: t('collectableSolver.policy.wiseOptions.noProc')
      },
      revisitOptions: {
        proc: t('collectableSolver.policy.revisitOptions.proc'),
        noProc: t('collectableSolver.policy.revisitOptions.noProc')
      },
      matchedOutcome: t('collectableSolver.policy.matchedOutcome'),
      confluentOutcome: t('collectableSolver.policy.confluentOutcome'),
      deterministicOutcome: t('collectableSolver.policy.deterministicOutcome'),
      sameOutcome: t('collectableSolver.policy.sameOutcome'),
      readyOutcome: t('collectableSolver.policy.readyOutcome'),
      waitingSelection: t('collectableSolver.policy.waitingSelection'),
      noMatchedOutcome: t('collectableSolver.policy.noMatchedOutcome'),
      continue: t('collectableSolver.policy.continue'),
      outcomeValue: t('collectableSolver.policy.outcomeValue', { value: '{value}', integrity: '{integrity}' }),
      nextAction: t('collectableSolver.policy.nextAction', { action: '{action}' }),
      terminal: t('collectableSolver.policy.terminal'),
      back: t('collectableSolver.policy.back'),
      root: t('collectableSolver.policy.root')
    }
  };
}

function buildGuidedQuestionLabels() {
  return {
    collectQuestion: t('collectableSolver.policy.collectQuestion'),
    standardQuestion: t('collectableSolver.policy.standardQuestion'),
    wiseQuestion: t('collectableSolver.policy.wiseQuestion'),
    revisitQuestion: t('collectableSolver.policy.revisitQuestion'),
    collectabilityQuestion: t('collectableSolver.policy.collectabilityQuestion'),
    integrityQuestion: t('collectableSolver.policy.integrityQuestion'),
    integrityOption: (integrity: number) => t('collectableSolver.policy.integrityOption', { integrity }),
    collectOptions: {
      success: t('collectableSolver.policy.collectOptions.success'),
      failed: t('collectableSolver.policy.collectOptions.failed')
    },
    standardOptions: {
      proc: t('collectableSolver.policy.standardOptions.proc'),
      noProc: t('collectableSolver.policy.standardOptions.noProc')
    },
    wiseOptions: {
      proc: t('collectableSolver.policy.wiseOptions.proc'),
      noProc: t('collectableSolver.policy.wiseOptions.noProc')
    },
    revisitOptions: {
      proc: t('collectableSolver.policy.revisitOptions.proc'),
      noProc: t('collectableSolver.policy.revisitOptions.noProc')
    }
  };
}

function buildDecisionTreeInputSections(
  request: CollectableSolverRequest,
  result: CollectableSolverResult
) {
  return [
    {
      title: t('collectableSolver.export.sections.item'),
      rows: [
        row(t('collectableSolver.export.fields.item'), props.activeItem.nameLocale || props.activeItem.nameEn),
        row(t('createGuide.glv'), props.activeItem.glv),
        row(t('collectableSolver.export.job'), t(`game.jobs.${request.jobType}`))
      ]
    },
    {
      title: t('collectableSolver.export.sections.player'),
      rows: [
        row(t('game.stats.level'), request.stats.level),
        row(t('game.stats.gathering'), props.baseStats.gathering),
        row(t('game.stats.perception'), props.baseStats.perception),
        row(t('game.stats.gp'), props.baseStats.gp),
        row(t('solver.currentGp'), request.temporaryGp)
      ]
    },
    {
      title: t('collectableSolver.export.sections.food'),
      rows: [
        row(t('solver.food.label'), formatFood())
      ]
    },
    {
      title: t('collectableSolver.export.sections.node'),
      rows: [
        row(t('solver.nodeBonuses.baseIntegrity'), request.nodeBonuses.baseIntegrity),
        row(t('solver.nodeBonuses.gatheringCount'), request.nodeBonuses.gatheringCount)
      ]
    },
    {
      title: t('collectableSolver.export.sections.solver'),
      rows: [
        row(t('solver.nodeBonuses.collectableRelicToolBonus'), formatBoolean(!!request.hasRelicToolBonus)),
        row(t('collectableSolver.export.fields.solverVersion'), result.modelVersions.collectableSolver ?? '-')
      ]
    }
  ];
}

function row(label: string, value: unknown): CollectableDecisionTreeHtmlRow {
  return {
    label,
    value: String(value)
  };
}

function formatFood() {
  if (!props.selectedFood.foodId) return t('tomeLibrary.noFood');
  return `${getItemName(props.selectedFood.foodId)} ${t(`solver.food.${props.selectedFood.quality}`)}`;
}

function formatBoolean(value: boolean) {
  return value ? t('solver.nodeBonuses.enabled') : t('solver.nodeBonuses.disabled');
}

</script>

<template>
  <div class="collectable-panel">
    <header class="collectable-panel-header">
      <div class="collectable-panel-title">
        <h2>
          <i class="pi pi-bolt text-amber-500"></i>
          {{ t('solver.strategy.title') }}
          <button
            v-if="debugMode && collectableResult?.debug"
            type="button"
            class="solver-debug-info-button"
            :title="t('collectableSolver.debug.open')"
            :aria-label="t('collectableSolver.debug.open')"
            @click="isDebugDialogOpen = true"
          >
            <i class="pi pi-info-circle"></i>
          </button>
        </h2>
        <p>{{ t('collectableSolver.description') }}</p>
      </div>
      <div class="solver-action-bar solver-action-bar-primary">
        <button
          type="button"
          class="solver-action-button p-button p-button-outlined rounded-xl objective-button"
          :aria-label="t('collectableObjective.title')"
          :title="selectedObjectiveLabel"
          :disabled="!rewardTable"
          @click="isObjectiveDialogOpen = true"
        >
          <i class="pi pi-cog" aria-hidden="true"></i>
        </button>
        <Button
          class="solver-action-button p-button-primary rounded-xl shadow-md"
          :aria-label="t('collectableSolver.actions.solve')"
          :loading="isCollectableSolving"
          :disabled="!canSolve"
          @click="handleSolve"
        >
          <i class="p-button-icon p-button-icon-left" :class="isCollectableSolving ? 'pi pi-spin pi-spinner' : 'pi pi-play'"></i>
          <span class="solver-action-label p-button-label">{{ t('collectableSolver.actions.solve') }}</span>
        </Button>
      </div>
    </header>

    <div
      v-if="collectableError"
      class="collectable-alert"
      :class="{ 'collectable-alert-with-actions': isWorkerError || canRaiseMemoBudget }"
      role="alert"
    >
      <span class="collectable-alert-icon" aria-hidden="true">
        <i class="pi pi-exclamation-circle"></i>
      </span>
      <div class="collectable-alert-body">
        <strong>{{ t(`collectableSolver.errors.${collectableError}.title`) }}</strong>
        <p>{{ t(`collectableSolver.errors.${collectableError}.desc`) }}</p>
      </div>
      <div v-if="isWorkerError || canRaiseMemoBudget" class="collectable-alert-actions">
        <p v-if="canRaiseMemoBudget" class="collectable-alert-risk">
          {{ t('collectableSolver.errors.memoCapacity.manualRisk') }}
        </p>
        <Button
          v-if="canRaiseMemoBudget"
          class="p-button-sm collectable-alert-action"
          :label="t('collectableSolver.errors.memoCapacity.raiseBudget')"
          icon="pi pi-refresh"
          :loading="isCollectableSolving"
          @click="handleRaiseMemoBudget"
        />
        <Button
          v-if="isWorkerError"
          class="p-button-sm p-button-warning collectable-alert-action"
          :label="t('solver.strategy.workerErrors.reload')"
          icon="pi pi-refresh"
          @click="reloadPage"
        />
      </div>
    </div>

    <div v-else-if="isCollectableLevelLocked" class="collectable-alert" role="alert">
      <span class="collectable-alert-icon" aria-hidden="true">
        <i class="pi pi-exclamation-circle"></i>
      </span>
      <div class="collectable-alert-body">
        <strong>{{ t('collectableSolver.errors.unsupportedLevel.title') }}</strong>
        <p>{{ t('collectableSolver.errors.unsupportedLevel.desc', { level: MIN_COLLECTABLE_LEVEL }) }}</p>
      </div>
    </div>

    <div v-if="collectableResult" class="collectable-result">
      <CollectablePolicyView
        :policy="collectableResult.policy"
        :expected-score="collectableResult.expectedScore"
        :min-score="collectableResult.minScore"
        :max-score="collectableResult.maxScore"
        :min-score-chance="collectableResult.minScoreChance"
        :max-score-chance="collectableResult.maxScoreChance"
        :objective-mode="collectableResult.objectiveMode"
        :objective="collectableObjective"
        :expected-tier-counts="collectableResult.expectedTierCounts"
        :min-score-tier-counts="collectableResult.minScoreTierCounts"
        :max-score-tier-counts="collectableResult.maxScoreTierCounts"
        :item-icon-url="activeItem.iconUrl"
        :reward-item-id="collectableResult.rewardItemId"
        :job-type="activeItem.jobType || 'miner'"
        :revisit="collectableResult.revisit"
      />

      <div class="solver-result-action-bar">
        <Button
          class="solver-action-button p-button-outlined rounded-xl"
          :class="{ 'is-tome-saved': isDecisionTreeExported }"
          :aria-label="t('collectableSolver.export.actions.exportHtml')"
          :disabled="isDecisionTreeExported || isDecisionTreeExporting"
          :loading="isDecisionTreeExporting"
          @click="handleExportDecisionTree"
        >
          <i class="p-button-icon p-button-icon-left" :class="isDecisionTreeExported ? 'pi pi-check' : 'pi pi-download'"></i>
          <span class="solver-action-label p-button-label">
            {{ isDecisionTreeExporting ? t('collectableSolver.export.actions.exportingHtml') : isDecisionTreeExported ? t('collectableSolver.export.actions.exportedHtml') : t('collectableSolver.export.actions.exportHtml') }}
          </span>
        </Button>
        <Button
          class="solver-action-button p-button-outlined rounded-xl"
          :class="{ 'is-tome-saved': isSaved }"
          :aria-label="t('solver.strategy.saveTome')"
          :disabled="isSaved"
          @click="handleSave"
        >
          <i class="p-button-icon p-button-icon-left" :class="isSaved ? 'pi pi-check' : 'pi pi-bookmark'"></i>
          <span class="solver-action-label p-button-label">{{ isSaved ? t('solver.strategy.savedTome') : t('solver.strategy.saveTome') }}</span>
        </Button>
      </div>
    </div>

    <div v-else-if="isCollectableSolving" class="collectable-empty">
      <i class="pi pi-spin pi-spinner"></i>
      <p>{{ t('collectableSolver.solving') }}</p>
    </div>

    <div v-else class="collectable-empty">
      <i class="pi pi-sitemap"></i>
      <p>{{ t('collectableSolver.empty') }}</p>
    </div>

    <CollectableDebugDialog v-model="isDebugDialogOpen" :debug="collectableResult?.debug" />
    <CollectableObjectivePreferenceDialog
      v-model="isObjectiveDialogOpen"
      :reward-table="rewardTable"
      :objective="collectableObjective"
      context="solver"
      @change="handleObjectiveChange"
    />
    <FloatingJsonExportButton
      v-if="collectableResult"
      :label="t('common.exportJson')"
      :busy-label="t('common.exportingJson')"
      :exported-label="t('common.exportedJson')"
      :busy="isJsonExporting"
      :exported="isJsonExported"
      @click="handleExportCollectableSolverJson"
    />
  </div>
</template>

<style scoped>
.collectable-panel {
  display: grid;
  gap: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  background: white;
  padding: 1.25rem;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
}

:global(html.dark .collectable-panel) {
  border-color: #1e293b;
  background: rgb(15 23 42);
}

.collectable-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.25rem;
}

.collectable-panel-header h2 {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
  margin: 0;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 900;
}

:global(html.dark .collectable-panel-header h2) {
  color: #f8fafc;
}

.collectable-panel-header p,
.collectable-alert p,
.collectable-empty p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.5;
}

:global(html.dark .collectable-panel-header p),
:global(html.dark .collectable-alert p),
:global(html.dark .collectable-empty p) {
  color: #94a3b8;
}

.collectable-panel-title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  text-align: left;
}

.solver-action-bar {
  width: 100%;
  display: grid;
  grid-template-columns: 2.75rem minmax(6.75rem, 1fr);
  gap: 0.6rem;
}

@media (min-width: 1024px) {
  .solver-action-bar-primary {
    width: min(100%, 12.25rem);
  }
}

:deep(.solver-action-button) {
  width: 100%;
  min-height: 42px;
  justify-content: center;
}

:deep(.objective-button) {
  padding: 0;
  line-height: 1;
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

.collectable-alert {
  display: grid;
  grid-template-columns: 1.5rem minmax(0, 1fr);
  gap: 0.75rem 0.85rem;
  align-items: flex-start;
  border: 1px solid #fed7aa;
  border-radius: 0.85rem;
  background: #fff7ed;
  padding: 0.95rem 1rem;
  color: #c2410c;
}

.collectable-alert-with-actions {
  grid-template-columns: 1.5rem minmax(0, 1fr) minmax(17rem, 0.78fr);
}

:global(html.dark .collectable-alert) {
  border-color: rgb(154 52 18 / 0.6);
  background: rgb(67 20 7 / 0.34);
  color: #fdba74;
}

.collectable-alert-icon {
  display: inline-grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  margin-top: 0.05rem;
  border-radius: 0.55rem;
  background: rgb(249 115 22 / 0.1);
  color: #ea580c;
}

:global(html.dark .collectable-alert-icon) {
  background: rgb(251 146 60 / 0.14);
  color: #fdba74;
}

.collectable-alert strong {
  display: block;
  margin-bottom: 0.2rem;
  color: #9a3412;
  font-size: 0.92rem;
  line-height: 1.35;
}

:global(html.dark .collectable-alert strong) {
  color: #fed7aa;
}

.collectable-alert-body {
  min-width: 0;
}

.collectable-alert-actions {
  grid-column: 3;
  display: grid;
  justify-items: end;
  align-content: center;
  gap: 0.6rem;
  min-width: 0;
  padding-left: 1rem;
  border-left: 1px solid rgb(251 146 60 / 0.28);
}

:global(html.dark .collectable-alert-actions) {
  border-left-color: rgb(251 146 60 / 0.22);
}

.collectable-alert-risk {
  width: 100%;
  max-width: 24rem;
  border: 1px solid rgb(251 146 60 / 0.28);
  border-radius: 0.75rem;
  background: rgb(255 237 213 / 0.58);
  padding: 0.6rem 0.7rem;
  color: #9a3412;
  font-size: 0.84rem;
  font-weight: 650;
  line-height: 1.45;
}

:global(html.dark .collectable-alert-risk) {
  border-color: rgb(251 146 60 / 0.24);
  background: rgb(124 45 18 / 0.24);
  color: #fed7aa;
}

:deep(.collectable-alert-action) {
  border-color: #ea580c;
  border-radius: 0.75rem;
  background: #ea580c;
  color: white;
  font-weight: 800;
  box-shadow: 0 8px 18px rgb(234 88 12 / 0.16);
}

:deep(.collectable-alert-action:hover),
:deep(.collectable-alert-action:enabled:hover),
:deep(.collectable-alert-action:active),
:deep(.collectable-alert-action:enabled:active) {
  border-color: #c2410c;
  background: #c2410c;
  color: white;
}

:global(html.dark) :deep(.collectable-alert-action) {
  border-color: rgb(251 146 60 / 0.72);
  background: rgb(194 65 12 / 0.9);
  color: #fff7ed;
  box-shadow: 0 8px 18px rgb(0 0 0 / 0.22);
}

:global(html.dark) :deep(.collectable-alert-action:hover),
:global(html.dark) :deep(.collectable-alert-action:enabled:hover),
:global(html.dark) :deep(.collectable-alert-action:active),
:global(html.dark) :deep(.collectable-alert-action:enabled:active) {
  border-color: rgb(253 186 116 / 0.82);
  background: rgb(154 52 18 / 0.95);
  color: #fff7ed;
}

:deep(.collectable-alert-action:focus-visible) {
  outline: 2px solid rgb(251 146 60 / 0.72);
  outline-offset: 2px;
}

.collectable-result {
  display: grid;
  gap: 1rem;
}

.solver-result-action-bar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.collectable-empty {
  display: grid;
  justify-items: center;
  gap: 0.6rem;
  border: 2px dashed #e2e8f0;
  border-radius: 1rem;
  padding: 2.5rem 1rem;
  text-align: center;
}

:global(html.dark .collectable-empty) {
  border-color: #334155;
}

.collectable-empty i {
  color: #94a3b8;
  font-size: 2rem;
}

@media (max-width: 640px) {
  .collectable-panel-header,
  .solver-result-action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .collectable-panel-header {
    display: flex;
  }

  .collectable-panel-title {
    text-align: center;
  }

  .collectable-panel-header h2 {
    justify-content: center;
  }

  .solver-result-action-bar {
    grid-template-columns: 1fr;
  }

  .collectable-alert,
  .collectable-alert-with-actions {
    grid-template-columns: 1.5rem minmax(0, 1fr);
  }

  .collectable-alert-actions {
    grid-column: 1 / -1;
    justify-items: stretch;
    padding-left: 0;
    padding-top: 0.75rem;
    border-top: 1px solid rgb(251 146 60 / 0.28);
    border-left: 0;
  }

  :global(html.dark .collectable-alert-actions) {
    border-top-color: rgb(251 146 60 / 0.22);
    border-left: 0;
  }

  .collectable-alert-risk {
    max-width: none;
  }

  :deep(.collectable-alert-action) {
    width: 100%;
    justify-content: center;
  }
}
</style>
