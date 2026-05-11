<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CollectablePolicyNode, CollectableActionType } from '../types/collectable';

const MAX_DISPLAY_DEPTH = 3;

const props = defineProps<{
  node: CollectablePolicyNode;
  depth?: number;
}>();

const { t } = useI18n();
const depth = computed(() => props.depth ?? 0);
const isMaxDepth = computed(() => depth.value >= MAX_DISPLAY_DEPTH);

const actionIcon: Record<CollectableActionType, string> = {
  scour: 'pi-box',
  meticulous: 'pi-wrench',
  scrutiny: 'pi-eye',
  'collectors-focus': 'pi-search-plus',
  'priming-touch': 'pi-bolt',
  collect: 'pi-arrow-circle-down'
};

const actionColor: Record<CollectableActionType, string> = {
  scour:             'bg-teal-500 dark:bg-teal-600',
  meticulous:        'bg-blue-500 dark:bg-blue-600',
  scrutiny:          'bg-violet-500 dark:bg-violet-600',
  'collectors-focus':'bg-amber-500 dark:bg-amber-600',
  'priming-touch':   'bg-rose-500 dark:bg-rose-600',
  collect:           'bg-emerald-600 dark:bg-emerald-700'
};

function actionLabel(action: CollectableActionType) {
  return t(`collectableSolver.actions.${action}`);
}

function terminalLabel(reason: string | undefined) {
  if (reason === 'no-durability') return t('collectableSolver.policy.terminal.noDurability');
  if (reason === 'no-gp') return t('collectableSolver.policy.terminal.noGp');
  return t('collectableSolver.policy.terminal.collect');
}

// Group branches: merge branches with same collectabilityDelta and same next action
// to reduce visual noise (standard-proc vs no-proc often leads to same action)
const mergedBranches = computed(() => {
  if (props.node.isTerminal || props.node.branches.length === 0) return [];

  interface MergedBranch {
    probability: number;
    collectabilityDelta: number;
    consumesDurability: boolean;
    next: CollectablePolicyNode | null;
    labelKey: string;
  }

  const groups = new Map<string, MergedBranch>();
  for (const branch of props.node.branches) {
    const nextAction = branch.next?.recommendedAction ?? '__terminal__';
    const key = `${branch.collectabilityDelta}|${nextAction}|${branch.next?.isTerminal ?? true}`;
    const existing = groups.get(key);
    if (existing) {
      existing.probability += branch.probability;
    } else {
      groups.set(key, {
        probability: branch.probability,
        collectabilityDelta: branch.collectabilityDelta,
        consumesDurability: branch.consumesDurability,
        next: branch.next,
        labelKey: key
      });
    }
  }
  return [...groups.values()].sort((a, b) => b.probability - a.probability);
});

function formatDelta(delta: number) {
  if (delta === 0) return '±0';
  return delta > 0 ? `+${delta}` : `${delta}`;
}
</script>

<template>
  <div class="policy-node-wrapper">
    <!-- Node card -->
    <div
      class="policy-node-card"
      :class="{
        'terminal-node': node.isTerminal,
        'depth-0': depth === 0,
        'depth-1': depth === 1,
        'depth-2': depth === 2,
        'depth-max': depth >= 3
      }"
    >
      <!-- State bar -->
      <div class="node-state-bar">
        <span class="state-chip">
          <i class="pi pi-bolt state-icon"></i>
          {{ node.state.gp }}
        </span>
        <span class="state-chip">
          <i class="pi pi-heart state-icon"></i>
          {{ node.state.integrity }}
        </span>
        <span class="state-chip">
          <i class="pi pi-star state-icon"></i>
          {{ node.state.collectability }}
        </span>
      </div>

      <!-- Recommended action -->
      <div class="node-action-row" v-if="!node.isTerminal">
        <span
          class="action-badge"
          :class="actionColor[node.recommendedAction]"
        >
          <i class="pi" :class="actionIcon[node.recommendedAction]"></i>
          {{ actionLabel(node.recommendedAction) }}
          <span v-if="node.gpCost > 0" class="gp-cost">-{{ node.gpCost }}</span>
        </span>
        <span class="expected-scrip">
          {{ node.expectedScrip.toFixed(1) }}
        </span>
      </div>

      <!-- Terminal label -->
      <div class="node-terminal-row" v-else>
        <span class="terminal-badge">
          <i class="pi pi-check-circle"></i>
          {{ terminalLabel(node.terminalReason) }}
        </span>
        <span class="expected-scrip">{{ node.expectedScrip.toFixed(1) }}</span>
      </div>
    </div>

    <!-- Branches (only if non-terminal and not at max depth) -->
    <template v-if="!node.isTerminal && !node.isTerminal && mergedBranches.length > 0">
      <!-- Depth limit indicator -->
      <div v-if="isMaxDepth" class="depth-limit-note">
        {{ t('collectableSolver.policy.depthLimit') }}
      </div>

      <div v-else class="branches-container" :class="mergedBranches.length === 1 ? 'single-branch' : 'multi-branch'">
        <div
          v-for="branch in mergedBranches"
          :key="branch.labelKey"
          class="branch-slot"
        >
          <!-- Branch label (probability + delta) -->
          <div class="branch-label">
            <span class="branch-prob">{{ Math.round(branch.probability) }}%</span>
            <span v-if="branch.collectabilityDelta !== 0" class="branch-delta">
              {{ formatDelta(branch.collectabilityDelta) }}
            </span>
          </div>
          <div class="branch-line"></div>

          <!-- Child node (recursive) -->
          <CollectablePolicyNodeCard
            v-if="branch.next"
            :node="branch.next"
            :depth="depth + 1"
          />
          <div v-else class="terminal-stub">
            <span class="terminal-badge-sm">{{ t('collectableSolver.policy.terminal.noDurability') }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.policy-node-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  min-width: 0;
}

.policy-node-card {
  width: 100%;
  min-width: 160px;
  max-width: 260px;
  border-radius: 14px;
  padding: 0.7rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border: 1.5px solid #e2e8f0;
  background: white;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.05);
  position: relative;
}

:global(html.dark .policy-node-card) {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}

.depth-0 {
  border-color: #52a890;
  border-width: 2px;
}

:global(html.dark .depth-0) {
  border-color: #52a890;
}

.terminal-node {
  border-color: #10b981;
  background: #f0fdf4;
}

:global(html.dark .terminal-node) {
  background: #022c22;
  border-color: #059669;
}

.node-state-bar {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.state-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 20px;
}

:global(html.dark .state-chip) {
  color: #94a3b8;
  background: #0f172a;
}

.state-icon {
  font-size: 0.65rem;
  color: #94a3b8;
}

.node-action-row,
.node-terminal-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 800;
  color: white;
}

.action-badge .pi {
  font-size: 0.7rem;
}

.gp-cost {
  font-size: 0.68rem;
  opacity: 0.85;
}

.terminal-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 800;
  color: white;
  background: linear-gradient(135deg, #10b981, #059669);
}

.terminal-badge .pi {
  font-size: 0.7rem;
}

.expected-scrip {
  font-size: 0.75rem;
  font-weight: 800;
  color: #52a890;
  white-space: nowrap;
}

/* Branches */

.branches-container {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  position: relative;
  padding-top: 0;
  width: 100%;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.single-branch {
  flex-direction: column;
  align-items: center;
}

.multi-branch {
  flex-direction: row;
  justify-content: center;
}

.branch-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}

.branch-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  padding: 0.25rem 0;
}

.branch-prob {
  font-size: 0.72rem;
  font-weight: 800;
  color: #64748b;
}

:global(html.dark .branch-prob) {
  color: #94a3b8;
}

.branch-delta {
  font-size: 0.68rem;
  font-weight: 700;
  color: #52a890;
}

.branch-line {
  width: 1.5px;
  height: 12px;
  background: #cbd5e1;
  margin: 0 auto;
}

:global(html.dark .branch-line) {
  background: #475569;
}

.depth-limit-note {
  font-size: 0.7rem;
  color: #94a3b8;
  padding: 0.4rem 0.8rem;
  text-align: center;
  font-style: italic;
}

.terminal-stub {
  padding: 0.3rem 0.5rem;
}

.terminal-badge-sm {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.68rem;
  font-weight: 700;
  color: white;
  background: #64748b;
}
</style>
