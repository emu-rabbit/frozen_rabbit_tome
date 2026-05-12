<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CollectablePolicyBranch, CollectablePolicyNode, CollectableRewardVector } from '../types/collectable';
import { getCollectableActionIcon, getCollectableActionName } from '../services/collectableActions';

const props = defineProps<{
  policy: CollectablePolicyNode;
  expectedReward: CollectableRewardVector;
  expectedScore: number;
  jobType: 'miner' | 'botanist';
}>();

const { t } = useI18n();
const nodeStack = ref<CollectablePolicyNode[]>([props.policy]);
const selectedStandard = ref<boolean | null>(null);
const selectedWise = ref<boolean | null>(null);
const selectedCollectSuccess = ref<boolean | null>(null);
const selectedCollectability = ref<number | null>(null);
const selectedIntegrity = ref<number | null>(null);

const currentNode = computed(() => nodeStack.value[nodeStack.value.length - 1] ?? props.policy);
const previewBranches = computed(() => currentNode.value.branches);
const collectSuccessOptions = computed(() => {
  const hasSuccess = previewBranches.value.some((branch) => hasBranchLabel(branch, 'collectableSolver.branches.collectSuccess'));
  const hasFailed = previewBranches.value.some((branch) => hasBranchLabel(branch, 'collectableSolver.branches.collectFailed'));
  if (!hasSuccess || !hasFailed) return [];
  return [
    { value: true, label: t('collectableSolver.policy.collectOptions.success') },
    { value: false, label: t('collectableSolver.policy.collectOptions.failed') }
  ];
});
const standardOptions = computed(() => {
  const hasProc = previewBranches.value.some((branch) => hasBranchLabel(branch, 'collectableSolver.branches.standardProc'));
  const hasNoProc = previewBranches.value.some((branch) => hasBranchLabel(branch, 'collectableSolver.branches.standardNoProc'));
  if (!hasProc || !hasNoProc) return [];
  return [
    { value: true, label: t('collectableSolver.policy.standardOptions.proc') },
    { value: false, label: t('collectableSolver.policy.standardOptions.noProc') }
  ];
});
const wiseOptions = computed(() => {
  const hasProc = previewBranches.value.some((branch) => hasBranchLabel(branch, 'collectableSolver.branches.wiseProc'));
  const hasNoProc = previewBranches.value.some((branch) => hasBranchLabel(branch, 'collectableSolver.branches.wiseNoProc'));
  if (!hasProc || !hasNoProc) return [];
  return [
    { value: true, label: t('collectableSolver.policy.wiseOptions.proc') },
    { value: false, label: t('collectableSolver.policy.wiseOptions.noProc') }
  ];
});
const collectabilityOptions = computed(() => {
  const hasValueOutcome = previewBranches.value.some((branch) => (
    hasBranchLabel(branch, 'collectableSolver.branches.valueNormal')
    || hasBranchLabel(branch, 'collectableSolver.branches.valueIncreased')
  ));
  if (!hasValueOutcome) return [];
  return uniqueNumbers(previewBranches.value.map((branch) => branch.outcome.collectability));
});
const integrityOptions = computed(() => {
  const hasMeticulousOutcome = previewBranches.value.some((branch) => (
    hasBranchLabel(branch, 'collectableSolver.branches.meticulousSaved')
    || hasBranchLabel(branch, 'collectableSolver.branches.meticulousConsumed')
  ));
  if (!hasMeticulousOutcome) return [];
  return uniqueNumbers(previewBranches.value.map((branch) => branch.outcome.integrity));
});
const usesGuidedQuestions = computed(() => (
  collectSuccessOptions.value.length > 0
  || standardOptions.value.length > 0
  || wiseOptions.value.length > 0
  || collectabilityOptions.value.length > 1
  || integrityOptions.value.length > 1
));
const isGuidedSelectionComplete = computed(() => {
  if (collectSuccessOptions.value.length > 0 && selectedCollectSuccess.value === null) return false;
  if (standardOptions.value.length > 0 && selectedStandard.value === null) return false;
  if (wiseOptions.value.length > 0 && selectedWise.value === null) return false;
  if (collectabilityOptions.value.length > 1 && selectedCollectability.value === null) return false;
  if (integrityOptions.value.length > 1 && selectedIntegrity.value === null) return false;
  return true;
});
const matchedGuidedBranches = computed(() => {
  if (!usesGuidedQuestions.value || !isGuidedSelectionComplete.value) return [];
  return previewBranches.value.filter((branch) => {
    if (collectSuccessOptions.value.length > 0) {
      const isCollectSuccess = hasBranchLabel(branch, 'collectableSolver.branches.collectSuccess');
      if (selectedCollectSuccess.value !== isCollectSuccess) return false;
    }
    if (standardOptions.value.length > 0) {
      const isStandardProc = hasBranchLabel(branch, 'collectableSolver.branches.standardProc');
      if (selectedStandard.value !== isStandardProc) return false;
    }
    if (wiseOptions.value.length > 0) {
      const isWiseProc = hasBranchLabel(branch, 'collectableSolver.branches.wiseProc');
      if (selectedWise.value !== isWiseProc) return false;
    }
    if (collectabilityOptions.value.length > 1 && selectedCollectability.value !== branch.outcome.collectability) {
      return false;
    }
    if (integrityOptions.value.length > 1 && selectedIntegrity.value !== branch.outcome.integrity) {
      return false;
    }
    return true;
  });
});
const selectedGuidedBranch = computed(() => {
  if (matchedGuidedBranches.value.length === 1) return matchedGuidedBranches.value[0];
  if (matchedGuidedBranches.value.length <= 1) return undefined;
  const routeKeys = new Set(matchedGuidedBranches.value.map((branch) => branchRouteKey(branch)));
  return routeKeys.size === 1 ? matchedGuidedBranches.value[0] : undefined;
});
const confluentBranch = computed(() => {
  if (usesGuidedQuestions.value || previewBranches.value.length === 0) return undefined;
  const routeKeys = new Set(previewBranches.value.map((branch) => branchRouteKey(branch)));
  return routeKeys.size === 1 ? previewBranches.value[0] : undefined;
});
const resolvedGuidedBranch = computed(() => selectedGuidedBranch.value ?? confluentBranch.value);
const showsGuidedPanel = computed(() => usesGuidedQuestions.value || !!confluentBranch.value);
const isConfluentOutcome = computed(() => !!confluentBranch.value && previewBranches.value.length > 1);

watch(() => props.policy, (policy) => {
  nodeStack.value = [policy];
  resetGuidedSelection();
});

function actionName(kind: typeof props.policy.recommendedAction.kind) {
  return getCollectableActionName(kind, props.jobType);
}

function actionIcon(kind: typeof props.policy.recommendedAction.kind) {
  return getCollectableActionIcon(kind, props.jobType);
}

function formatProbability(branch: CollectablePolicyBranch) {
  if (branch.probability > 0 && branch.probability < 0.01) return '<0.01%';
  return `${branch.probability.toFixed(2)}%`;
}

function uniqueNumbers(values: number[]) {
  return [...new Set(values)].sort((left, right) => left - right);
}

function hasBranchLabel(branch: CollectablePolicyBranch, labelKey: string) {
  return (branch.labelKeys ?? [branch.labelKey]).includes(labelKey);
}

function branchRouteKey(branch: CollectablePolicyBranch) {
  return [
    branch.outcome.gp,
    branch.outcome.integrity,
    branch.outcome.collectability,
    branch.next?.id ?? 'terminal'
  ].join('|');
}

function branchLabels(branch: CollectablePolicyBranch) {
  return (branch.labelKeys?.length ? branch.labelKeys : [branch.labelKey]).map((key) => t(key)).join(' / ');
}

function openBranch(branch: CollectablePolicyBranch) {
  if (!branch.next) return;
  nodeStack.value = [...nodeStack.value, branch.next];
  resetGuidedSelection();
}

function goBack() {
  if (nodeStack.value.length <= 1) return;
  nodeStack.value = nodeStack.value.slice(0, -1);
  resetGuidedSelection();
}

function resetTree() {
  nodeStack.value = [props.policy];
  resetGuidedSelection();
}

function resetGuidedSelection() {
  selectedStandard.value = null;
  selectedWise.value = null;
  selectedCollectSuccess.value = null;
  selectedCollectability.value = null;
  selectedIntegrity.value = null;
}

function continueGuidedBranch() {
  if (!resolvedGuidedBranch.value) return;
  openBranch(resolvedGuidedBranch.value);
}

function rewardSummary(reward: CollectableRewardVector) {
  return t('collectableSolver.results.rewardSummary', {
    scrip: Number(reward.scrip.toFixed(2)),
    gil: Number(reward.gil.toFixed(2))
  });
}
</script>

<template>
  <div class="collectable-policy">
    <section class="collectable-summary">
      <div>
        <span class="summary-kicker">{{ t('collectableSolver.results.kicker') }}</span>
        <h3>{{ t('collectableSolver.results.title') }}</h3>
        <p>{{ t('collectableSolver.results.subtitle') }}</p>
      </div>
      <div class="summary-score">
        <span>{{ t('collectableSolver.results.expectedScore') }}</span>
        <strong>{{ Number(expectedScore.toFixed(2)) }}</strong>
      </div>
    </section>

    <section class="current-action">
      <div class="action-icon-wrap">
        <img v-if="actionIcon(currentNode.recommendedAction.kind)" :src="actionIcon(currentNode.recommendedAction.kind)" alt="" />
        <i v-else class="pi pi-sparkles"></i>
      </div>
      <div>
        <span>{{ t('collectableSolver.policy.now') }}</span>
        <strong>{{ actionName(currentNode.recommendedAction.kind) }}</strong>
        <p>{{ t('collectableSolver.policy.stateSummary', {
          gp: currentNode.state.gp,
          integrity: currentNode.state.integrity,
          collectability: currentNode.state.collectability
        }) }}</p>
      </div>
    </section>

    <section class="reward-strip">
      <div>
        <span>{{ t('collectableSolver.results.expectedReward') }}</span>
        <strong>{{ rewardSummary(expectedReward) }}</strong>
      </div>
      <p>{{ t('collectableSolver.results.limitationNote') }}</p>
    </section>

    <section class="branch-list">
      <div class="branch-list-header">
        <span>{{ showsGuidedPanel ? t('collectableSolver.policy.confirmOutcome') : t('collectableSolver.policy.nextBranches') }}</span>
        <div class="tree-controls">
          <button type="button" :disabled="nodeStack.length <= 1" @click="goBack">
            <i class="pi pi-arrow-left"></i>
            {{ t('collectableSolver.policy.back') }}
          </button>
          <button type="button" :disabled="nodeStack.length <= 1" @click="resetTree">
            <i class="pi pi-home"></i>
            {{ t('collectableSolver.policy.root') }}
          </button>
        </div>
      </div>

      <div v-if="showsGuidedPanel" class="guided-panel">
        <p class="guided-hint">{{ confluentBranch ? t(isConfluentOutcome ? 'collectableSolver.policy.confluentHint' : 'collectableSolver.policy.deterministicHint') : t('collectableSolver.policy.confirmHint') }}</p>

        <fieldset v-if="collectSuccessOptions.length" class="guided-question">
          <legend>{{ t('collectableSolver.policy.collectQuestion') }}</legend>
          <div class="option-grid two-options">
            <button
              v-for="option in collectSuccessOptions"
              :key="String(option.value)"
              type="button"
              class="choice-button"
              :class="{ 'is-selected': selectedCollectSuccess === option.value }"
              @click="selectedCollectSuccess = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </fieldset>

        <fieldset v-if="standardOptions.length" class="guided-question">
          <legend>{{ t('collectableSolver.policy.standardQuestion') }}</legend>
          <div class="option-grid two-options">
            <button
              v-for="option in standardOptions"
              :key="String(option.value)"
              type="button"
              class="choice-button"
              :class="{ 'is-selected': selectedStandard === option.value }"
              @click="selectedStandard = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </fieldset>

        <fieldset v-if="wiseOptions.length" class="guided-question">
          <legend>{{ t('collectableSolver.policy.wiseQuestion') }}</legend>
          <div class="option-grid two-options">
            <button
              v-for="option in wiseOptions"
              :key="String(option.value)"
              type="button"
              class="choice-button"
              :class="{ 'is-selected': selectedWise === option.value }"
              @click="selectedWise = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </fieldset>

        <fieldset v-if="collectabilityOptions.length > 1" class="guided-question">
          <legend>{{ t('collectableSolver.policy.collectabilityQuestion') }}</legend>
          <div class="option-grid">
            <button
              v-for="value in collectabilityOptions"
              :key="value"
              type="button"
              class="choice-button numeric-choice"
              :class="{ 'is-selected': selectedCollectability === value }"
              @click="selectedCollectability = value"
            >
              {{ value }}
            </button>
          </div>
        </fieldset>

        <fieldset v-if="integrityOptions.length > 1" class="guided-question">
          <legend>{{ t('collectableSolver.policy.integrityQuestion') }}</legend>
          <div class="option-grid">
            <button
              v-for="value in integrityOptions"
              :key="value"
              type="button"
              class="choice-button numeric-choice"
              :class="{ 'is-selected': selectedIntegrity === value }"
              @click="selectedIntegrity = value"
            >
              {{ t('collectableSolver.policy.integrityOption', { integrity: value }) }}
            </button>
          </div>
        </fieldset>

        <div class="guided-result">
          <template v-if="resolvedGuidedBranch">
            <div>
              <span>{{ t(confluentBranch ? (isConfluentOutcome ? 'collectableSolver.policy.confluentOutcome' : 'collectableSolver.policy.deterministicOutcome') : 'collectableSolver.policy.matchedOutcome') }}</span>
              <strong>{{ confluentBranch ? t(isConfluentOutcome ? 'collectableSolver.policy.sameOutcome' : 'collectableSolver.policy.readyOutcome') : branchLabels(resolvedGuidedBranch) }}</strong>
              <p>{{ t('collectableSolver.policy.outcomeValue', {
                value: resolvedGuidedBranch.outcome.collectability,
                integrity: resolvedGuidedBranch.outcome.integrity
              }) }}</p>
              <small v-if="resolvedGuidedBranch.next">
                {{ t('collectableSolver.policy.nextAction', { action: actionName(resolvedGuidedBranch.next.recommendedAction.kind) }) }}
              </small>
              <small v-else>{{ t('collectableSolver.policy.terminal') }}</small>
            </div>
            <button type="button" class="guided-next-button" :disabled="!resolvedGuidedBranch.next" @click="continueGuidedBranch">
              {{ t('collectableSolver.policy.continue') }}
              <i class="pi pi-angle-right"></i>
            </button>
          </template>
          <p v-else>{{ t(isGuidedSelectionComplete ? 'collectableSolver.policy.noMatchedOutcome' : 'collectableSolver.policy.waitingSelection') }}</p>
        </div>
      </div>

      <button
        v-else
        v-for="branch in previewBranches"
        :key="`${currentNode.id}-${branch.labelKey}-${branch.probability}-${branch.outcome.collectability}`"
        type="button"
        class="branch-row"
        :class="{ 'is-clickable': !!branch.next }"
        :disabled="!branch.next"
        @click="openBranch(branch)"
      >
        <div>
          <strong>{{ branchLabels(branch) }}</strong>
          <p>{{ t(branch.conditionKey) }}</p>
          <small v-if="branch.next">
            {{ t('collectableSolver.policy.nextAction', { action: actionName(branch.next.recommendedAction.kind) }) }}
          </small>
          <small v-else>
            {{ t('collectableSolver.policy.terminal') }}
          </small>
        </div>
        <div class="branch-outcome">
          <span>{{ formatProbability(branch) }}</span>
          <small>{{ t('collectableSolver.policy.outcomeValue', {
            value: branch.outcome.collectability,
            integrity: branch.outcome.integrity
          }) }}</small>
          <i v-if="branch.next" class="pi pi-angle-right"></i>
        </div>
      </button>
    </section>
  </div>
</template>

<style scoped>
.collectable-policy {
  display: grid;
  gap: 1rem;
}

.collectable-summary,
.current-action,
.reward-strip,
.guided-panel,
.branch-row {
  border: 1px solid #d1fae5;
  border-radius: 0.95rem;
  background: #f0fdf4;
}

:global(html.dark .collectable-summary),
:global(html.dark .current-action),
:global(html.dark .reward-strip),
:global(html.dark .guided-panel),
:global(html.dark .branch-row) {
  border-color: rgb(51 65 85);
  background: rgb(15 23 42 / 0.72);
}

.collectable-summary {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
}

.summary-kicker,
.summary-score span,
.reward-strip span,
.current-action span,
.branch-list-header {
  color: #3f8f79;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.collectable-summary h3 {
  margin: 0.2rem 0;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 900;
}

:global(html.dark .collectable-summary h3) {
  color: #f8fafc;
}

.collectable-summary p,
.reward-strip p,
.current-action p,
.guided-hint,
.guided-result p,
.branch-row p,
.branch-outcome small {
  margin: 0;
  color: #64748b;
  font-size: 0.84rem;
  line-height: 1.45;
}

:global(html.dark .collectable-summary p),
:global(html.dark .reward-strip p),
:global(html.dark .current-action p),
:global(html.dark .guided-hint),
:global(html.dark .guided-result p),
:global(html.dark .branch-row p),
:global(html.dark .branch-outcome small) {
  color: #94a3b8;
}

.summary-score {
  flex-shrink: 0;
  text-align: right;
}

.summary-score strong {
  display: block;
  color: #166534;
  font-size: 2rem;
  font-weight: 950;
}

:global(html.dark .summary-score strong) {
  color: #bbf7d0;
}

.current-action {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
}

:global(html.dark .current-action) {
  background: rgb(2 6 23 / 0.38);
}

.action-icon-wrap {
  width: 3rem;
  height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 0.85rem;
  background: #ecfdf5;
  color: #3f8f79;
}

:global(html.dark .action-icon-wrap) {
  background: rgb(20 83 45 / 0.32);
}

.action-icon-wrap img {
  width: 2.35rem;
  height: 2.35rem;
}

.current-action strong {
  display: block;
  color: #0f172a;
  font-size: 1.2rem;
  font-weight: 900;
}

:global(html.dark .current-action strong) {
  color: #f8fafc;
}

.reward-strip {
  display: grid;
  gap: 0.35rem;
  padding: 0.9rem 1rem;
}

.reward-strip strong {
  display: block;
  color: #334155;
  font-size: 0.95rem;
}

:global(html.dark .reward-strip strong) {
  color: #e2e8f0;
}

.branch-list {
  display: grid;
  gap: 0.65rem;
}

.guided-panel {
  display: grid;
  gap: 0.9rem;
  padding: 1rem;
  background: white;
}

:global(html.dark .guided-panel) {
  background: rgb(2 6 23 / 0.38);
}

.guided-question {
  display: grid;
  gap: 0.55rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.guided-question legend,
.guided-result span {
  margin: 0;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 900;
}

:global(html.dark .guided-question legend),
:global(html.dark .guided-result span) {
  color: #e2e8f0;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  gap: 0.5rem;
}

.option-grid.two-options {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.choice-button {
  min-height: 2.65rem;
  border: 1px solid #d1fae5;
  border-radius: 0.7rem;
  background: #f8fafc;
  padding: 0.55rem 0.75rem;
  color: #0f766e;
  font-size: 0.88rem;
  font-weight: 900;
  transition: background-color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.choice-button:hover {
  border-color: #52a890;
  background: #f0fdf4;
  transform: translateY(-1px);
}

.choice-button.is-selected {
  border-color: #52a890;
  background: #dcfce7;
  box-shadow: 0 0 0 3px rgb(82 168 144 / 0.14);
  color: #14532d;
}

:global(html.dark .choice-button) {
  border-color: #334155;
  background: rgb(15 23 42 / 0.72);
  color: #99f6e4;
}

:global(html.dark .choice-button:hover) {
  border-color: #5eead4;
  background: rgb(20 83 45 / 0.22);
}

:global(html.dark .choice-button.is-selected) {
  border-color: #5eead4;
  background: rgb(20 83 45 / 0.38);
  box-shadow: 0 0 0 3px rgb(94 234 212 / 0.12);
  color: #ccfbf1;
}

.numeric-choice {
  font-size: 1rem;
}

.guided-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-top: 1px solid #d1fae5;
  padding-top: 0.9rem;
}

:global(html.dark .guided-result) {
  border-top-color: #334155;
}

.guided-result strong,
.guided-result small {
  display: block;
}

.guided-result strong {
  margin-top: 0.15rem;
  color: #0f172a;
  font-size: 0.98rem;
}

:global(html.dark .guided-result strong) {
  color: #f8fafc;
}

.guided-result small {
  margin-top: 0.25rem;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 800;
}

:global(html.dark .guided-result small) {
  color: #99f6e4;
}

.guided-next-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 2.5rem;
  flex-shrink: 0;
  border: 0;
  border-radius: 0.7rem;
  background: #52a890;
  padding: 0.55rem 0.85rem;
  color: white;
  font-size: 0.86rem;
  font-weight: 900;
}

.guided-next-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

:global(html.dark .guided-next-button) {
  background: #2dd4bf;
  color: #042f2e;
}

.branch-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: #3f8f79;
  letter-spacing: 0;
  text-transform: none;
}

.tree-controls {
  display: flex;
  gap: 0.4rem;
}

.tree-controls button {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid #d1fae5;
  border-radius: 0.55rem;
  background: white;
  padding: 0.32rem 0.55rem;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 800;
}

.tree-controls button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

:global(html.dark .tree-controls button) {
  border-color: #334155;
  background: rgb(2 6 23 / 0.5);
  color: #99f6e4;
}

.branch-row {
  width: 100%;
  border: 1px solid #d1fae5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  background: white;
  text-align: left;
  transition: border-color 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease;
}

:global(html.dark .branch-row) {
  background: rgb(2 6 23 / 0.38);
}

.branch-row.is-clickable {
  cursor: pointer;
}

.branch-row.is-clickable:hover {
  border-color: #52a890;
  box-shadow: 0 10px 24px rgb(82 168 144 / 0.12);
  transform: translateY(-1px);
}

:global(html.dark .branch-row.is-clickable:hover) {
  border-color: #5eead4;
  box-shadow: 0 12px 28px rgb(0 0 0 / 0.24);
}

.branch-row:disabled {
  cursor: default;
}

.branch-row strong {
  color: #334155;
  font-size: 0.92rem;
}

:global(html.dark .branch-row strong) {
  color: #e2e8f0;
}

.branch-row small {
  display: block;
  margin-top: 0.25rem;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 800;
}

:global(html.dark .branch-row small) {
  color: #99f6e4;
}

.branch-outcome {
  min-width: 7rem;
  text-align: right;
}

.branch-outcome span {
  display: block;
  color: #0f766e;
  font-weight: 900;
}

.branch-outcome i {
  display: inline-block;
  margin-top: 0.35rem;
  color: #52a890;
}

:global(html.dark .branch-outcome span) {
  color: #99f6e4;
}

@media (max-width: 640px) {
  .collectable-summary,
  .branch-row {
    flex-direction: column;
    align-items: stretch;
  }

  .summary-score,
  .branch-outcome {
    text-align: left;
  }

  .branch-list-header,
  .guided-result,
  .tree-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .option-grid.two-options {
    grid-template-columns: 1fr;
  }
}
</style>
