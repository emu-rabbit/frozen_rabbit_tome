<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import type { GatherableItem, NodeBonuses, PlayerStats } from '../types/game';
import type { CollectableSolverResult } from '../types/collectable';
import { useCollectableSolver } from '../composables/useCollectableSolver';
import CollectablePolicyView from './CollectablePolicyView.vue';
import CollectableDebugDialog from './CollectableDebugDialog.vue';
import { getCollectableScripRewardMeta } from '../services/collectableScripRewards';
import { getCollectableActionName } from '../services/collectableActions';
import { useSettings } from '../composables/useSettings';

const props = defineProps<{
  activeItem: GatherableItem;
  effectiveStats: PlayerStats;
  baseValues: { Gathering: number; Perception: number } | null;
  itemRealLevel: number;
  nodeBonuses: NodeBonuses;
  temporaryGp: number;
  debugMode: boolean;
}>();

const emit = defineEmits<{
  save: [result: CollectableSolverResult];
}>();

const { t } = useI18n();
const { solverSettings } = useSettings();
const {
  collectableResult,
  isCollectableSolving,
  collectableError,
  solveCollectable,
  clearCollectableResult
} = useCollectableSolver();
const isDebugDialogOpen = ref(false);
const isSaved = ref(false);
const isDecisionTreeExported = ref(false);
const isDecisionTreeExporting = ref(false);
let savedTimer: ReturnType<typeof window.setTimeout> | null = null;
let exportedTimer: ReturnType<typeof window.setTimeout> | null = null;

const canSolve = computed(() => !!props.baseValues && !!props.activeItem.itemId);
const isWorkerError = computed(() => collectableError.value === 'workerStale' || collectableError.value === 'workerFailed');

onBeforeUnmount(() => {
  if (savedTimer) {
    window.clearTimeout(savedTimer);
  }
  if (exportedTimer) {
    window.clearTimeout(exportedTimer);
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
}, { deep: true });

async function handleSolve() {
  if (!props.baseValues || !canSolve.value) return;

  await solveCollectable({
    activeItem: props.activeItem,
    stats: { ...props.effectiveStats },
    baseValues: {
      Gathering: props.baseValues.Gathering,
      Perception: props.baseValues.Perception
    },
    itemLevel: props.itemRealLevel,
    nodeBonuses: { ...props.nodeBonuses },
    temporaryGp: Math.min(props.temporaryGp, props.effectiveStats.gp),
    debugMode: props.debugMode
  });
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
  if (!collectableResult.value || isDecisionTreeExported.value || isDecisionTreeExporting.value) return;

  isDecisionTreeExporting.value = true;
  await nextTick();
  await waitForUiFrame();

  try {
    downloadTextFile(
      await buildDecisionTreeMarkdown(collectableResult.value),
      buildDecisionTreeFileName()
    );

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

async function buildDecisionTreeMarkdown(result: CollectableSolverResult) {
  const policyGraph = await serializePolicyGraph(result.policy);
  const chunks = [
    `# ${t('collectableSolver.export.title', { item: props.activeItem.nameLocale || props.activeItem.nameEn })}\n\n`,
    `- ${t('collectableSolver.export.exportedAt')}：${new Date().toISOString()}\n`,
    `- ${t('collectableSolver.export.itemId')}：${props.activeItem.itemId}\n`,
    `- ${t('collectableSolver.export.job')}：${props.activeItem.jobType ? t(`game.jobs.${props.activeItem.jobType}`) : '-'}\n`,
    `- ${t('collectableSolver.results.expectedScore', { unit: formatScripUnit(result.rewardItemId) })}：${Number(result.expectedScore.toFixed(2))}\n`,
    `- ${t('collectableSolver.export.rootNode')}：\`${policyGraph.rootId}\`\n`,
    `- ${t('collectableSolver.export.nodeCount')}：${policyGraph.nodeCount}\n\n`,
    `## ${t('collectableSolver.export.howToReadTitle')}\n\n`,
    `${t('collectableSolver.export.howToReadDesc')}\n\n`,
    `## ${t('collectableSolver.export.nodeIndexTitle')}\n\n`
  ];

  for (let index = 0; index < policyGraph.nodes.length; index += 1) {
    chunks.push(formatPolicyNodeMarkdown(policyGraph.nodes[index]));
    if ((index + 1) % 200 === 0) {
      await waitForUiFrame();
    }
  }

  return chunks;
}

async function serializePolicyGraph(root: CollectableSolverResult['policy']) {
  const nodes = [];
  const visited = new Set<string>();
  const stack = [root];
  let processed = 0;

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || visited.has(node.id)) continue;

    visited.add(node.id);
    nodes.push({
      id: node.id,
      state: node.state,
      recommendedAction: node.recommendedAction,
      expectedScore: node.expectedScore,
      expectedReward: node.expectedReward,
      branches: node.branches.map((branch) => {
        const revisitGate = getInlineRevisitGate(branch.next);

        if (branch.next && !revisitGate && !visited.has(branch.next.id)) {
          stack.push(branch.next);
        }

        return {
          labelKey: branch.labelKey,
          labelKeys: branch.labelKeys,
          conditionKey: branch.conditionKey,
          probability: branch.probability,
          outcome: branch.outcome,
          nextId: revisitGate ? null : branch.next?.id ?? null,
          revisitGate
        };
      })
    });

    processed += 1;
    if (processed % 200 === 0) {
      await waitForUiFrame();
    }
  }

  return {
    rootId: root.id,
    nodeCount: nodes.length,
    nodes
  };
}

function getInlineRevisitGate(node?: CollectableSolverResult['policy']) {
  if (!node || node.recommendedAction.kind !== 'revisitCheck') return null;

  const procBranch = node.branches.find((branch) => branch.next);
  const noProcBranch = node.branches.find((branch) => !branch.next);
  if (!procBranch?.next || !noProcBranch) return null;

  return {
    procProbability: procBranch.probability,
    procNextId: procBranch.next.id,
    noProcProbability: noProcBranch.probability
  };
}

function formatScripUnit(rewardItemId?: number) {
  return t(getCollectableScripRewardMeta(rewardItemId).labelKey);
}

function buildDecisionTreeFileName() {
  const itemName = props.activeItem.nameLocale || props.activeItem.nameEn || `item-${props.activeItem.itemId}`;
  const date = new Date().toISOString().slice(0, 10);
  return sanitizeFileName(`${itemName} - ${t('collectableSolver.actions.exportDecisionTree')} - ${date}.md`);
}

function formatPolicyNodeMarkdown(node: Awaited<ReturnType<typeof serializePolicyGraph>>['nodes'][number]) {
  const chunks = [
    `### ${t('collectableSolver.export.node')} \`${node.id}\`\n\n`,
    `- ${t('collectableSolver.export.state')}：${formatState(node.state)}\n`,
    `- ${t('collectableSolver.export.recommendedAction')}：${actionName(node.recommendedAction.kind)}\n`,
    `- ${t('collectableSolver.export.nodeExpectedScore')}：${Number(node.expectedScore.toFixed(2))}\n\n`,
    `${t('collectableSolver.export.resultBranches')}：\n`
  ];

  if (node.branches.length === 0) {
    chunks.push(`- ${t('collectableSolver.export.noBranches')}\n\n`);
    return chunks.join('');
  }

  node.branches.forEach((branch) => {
    chunks.push(
      `- ${branchLabel(branch)}（${formatProbability(branch.probability)}）\n`,
      `  - ${t('collectableSolver.export.outcome')}：${formatOutcome(branch.outcome)}\n`,
      `  - ${t('collectableSolver.export.branchScore')}：${Number(branch.outcome.score.toFixed(2))}\n`,
      `  - ${t('collectableSolver.export.nextStep')}：${formatNextStep(branch)}\n`
    );
  });

  chunks.push('\n');
  return chunks.join('');
}

function formatNextStep(branch: Awaited<ReturnType<typeof serializePolicyGraph>>['nodes'][number]['branches'][number]) {
  if (branch.revisitGate) {
    return t('collectableSolver.export.revisitGateSummary', {
      procProbability: formatProbability(branch.revisitGate.procProbability),
      procNext: `${t('collectableSolver.export.node')} \`${branch.revisitGate.procNextId}\``,
      noProcProbability: formatProbability(branch.revisitGate.noProcProbability)
    });
  }

  return branch.nextId ? `${t('collectableSolver.export.node')} \`${branch.nextId}\`` : t('collectableSolver.export.end');
}

function actionName(kind: CollectableSolverResult['policy']['recommendedAction']['kind']) {
  return getCollectableActionName(kind, props.activeItem.jobType || 'miner');
}

function branchLabel(branch: Awaited<ReturnType<typeof serializePolicyGraph>>['nodes'][number]['branches'][number]) {
  return (branch.labelKeys?.length ? branch.labelKeys : [branch.labelKey]).map((key) => t(key)).join(' / ');
}

function formatProbability(probability: number) {
  if (probability > 0 && probability < 0.01) return '<0.01%';
  return `${probability.toFixed(2)}%`;
}

function formatState(state: CollectableSolverResult['policy']['state']) {
  return t('collectableSolver.export.stateSummary', {
    gp: state.gp,
    integrity: state.integrity,
    collectability: state.collectability
  });
}

function formatOutcome(outcome: CollectableSolverResult['policy']['branches'][number]['outcome']) {
  return t('collectableSolver.export.outcomeSummary', {
    gp: outcome.gp,
    integrity: outcome.integrity,
    collectability: outcome.collectability
  });
}

function sanitizeFileName(fileName: string) {
  return fileName
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/g, '')
    .slice(0, 160);
}

function downloadTextFile(chunks: string[], fileName: string) {
  const blob = new Blob(chunks, { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function waitForUiFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.setTimeout(resolve, 0);
    });
  });
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

    <div v-if="collectableError" class="collectable-alert" role="alert">
      <i class="pi pi-exclamation-circle"></i>
      <div>
        <strong>{{ t(`collectableSolver.errors.${collectableError}.title`) }}</strong>
        <p>{{ t(`collectableSolver.errors.${collectableError}.desc`) }}</p>
      </div>
      <Button
        v-if="isWorkerError"
        class="p-button-sm p-button-warning collectable-alert-action"
        :label="t('solver.strategy.workerErrors.reload')"
        icon="pi pi-refresh"
        @click="reloadPage"
      />
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
        :reward-item-id="collectableResult.rewardItemId"
        :job-type="activeItem.jobType || 'miner'"
        :revisit="collectableResult.revisit"
      />

      <div class="solver-result-action-bar">
        <Button
          class="solver-action-button p-button-outlined rounded-xl"
          :class="{ 'is-tome-saved': isDecisionTreeExported }"
          :aria-label="t('collectableSolver.actions.exportDecisionTree')"
          :loading="isDecisionTreeExporting"
          :disabled="isDecisionTreeExported || isDecisionTreeExporting"
          @click="handleExportDecisionTree"
        >
          <i class="p-button-icon p-button-icon-left" :class="isDecisionTreeExporting ? 'pi pi-spin pi-spinner' : isDecisionTreeExported ? 'pi pi-check' : 'pi pi-download'"></i>
          <span class="solver-action-label p-button-label">{{ isDecisionTreeExporting ? t('collectableSolver.actions.exportingDecisionTree') : isDecisionTreeExported ? t('collectableSolver.actions.exportedDecisionTree') : t('collectableSolver.actions.exportDecisionTree') }}</span>
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
}

@media (min-width: 1024px) {
  .solver-action-bar-primary {
    width: min(100%, 10rem);
  }
}

:deep(.solver-action-button) {
  width: 100%;
  min-height: 42px;
  justify-content: center;
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
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-start;
  border: 1px solid #fed7aa;
  border-radius: 0.85rem;
  background: #fff7ed;
  padding: 0.9rem;
  color: #c2410c;
}

:global(html.dark .collectable-alert) {
  border-color: rgb(154 52 18 / 0.6);
  background: rgb(67 20 7 / 0.34);
  color: #fdba74;
}

.collectable-alert strong {
  display: block;
  margin-bottom: 0.15rem;
}

.collectable-alert > div {
  min-width: 0;
  flex: 1 1 14rem;
}

:deep(.collectable-alert-action) {
  flex: 0 0 auto;
  border-radius: 0.75rem;
  font-weight: 800;
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
}
</style>
