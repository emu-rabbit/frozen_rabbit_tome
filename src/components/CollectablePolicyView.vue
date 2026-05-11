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

const currentNode = computed(() => nodeStack.value[nodeStack.value.length - 1] ?? props.policy);
const previewBranches = computed(() => currentNode.value.branches.slice(0, 6));

watch(() => props.policy, (policy) => {
  nodeStack.value = [policy];
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

function openBranch(branch: CollectablePolicyBranch) {
  if (!branch.next) return;
  nodeStack.value = [...nodeStack.value, branch.next];
}

function goBack() {
  if (nodeStack.value.length <= 1) return;
  nodeStack.value = nodeStack.value.slice(0, -1);
}

function resetTree() {
  nodeStack.value = [props.policy];
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
        <span>{{ t('collectableSolver.policy.nextBranches') }}</span>
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
      <button
        v-for="branch in previewBranches"
        :key="`${currentNode.id}-${branch.labelKey}-${branch.probability}-${branch.outcome.collectability}`"
        type="button"
        class="branch-row"
        :class="{ 'is-clickable': !!branch.next }"
        :disabled="!branch.next"
        @click="openBranch(branch)"
      >
        <div>
          <strong>{{ t(branch.labelKey) }}</strong>
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
.branch-row {
  border: 1px solid #d1fae5;
  border-radius: 0.95rem;
  background: #f0fdf4;
}

:global(html.dark .collectable-summary),
:global(html.dark .current-action),
:global(html.dark .reward-strip),
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
  .tree-controls {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
