<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import type { GatherableItem, NodeBonuses, PlayerStats } from '../types/game';
import type { CollectableActionKind } from '../types/collectable';
import {
  buildCollectableStrategyTree,
  collectableStrategyActionKinds,
  collectableStrategyBooleanFields,
  collectableStrategyNumericFields,
  createDefaultCollectableStrategyRules,
  isNumericStrategyField,
  type CollectableStrategyCondition,
  type CollectableStrategyComparator,
  type CollectableStrategyField,
  type CollectableStrategyNode,
  type CollectableStrategyRule
} from '../utils/collectableStrategyTree';
import { getCollectableActionIcon, getCollectableActionName } from '../services/collectableActions';

const { t } = useI18n();
const props = defineProps<{
  activeItem: GatherableItem;
  effectiveStats: PlayerStats;
  baseValues: { Gathering: number; Perception: number } | null;
  itemRealLevel: number;
  nodeBonuses: NodeBonuses;
  temporaryGp: number;
  hasRelicToolBonus?: boolean;
}>();

const rules = ref<CollectableStrategyRule[]>(createDefaultCollectableStrategyRules());
const editingRuleId = ref('');
const selectedUncoveredId = ref('');
const internalMaxNodes = 1200;

const jobType = computed(() => props.activeItem.jobType || 'miner');
const canBuildTree = computed(() => !!props.baseValues);
const treeResult = computed(() => {
  if (!props.baseValues) return null;

  return buildCollectableStrategyTree({
    stats: props.effectiveStats,
    baseValues: props.baseValues,
    itemLevel: props.itemRealLevel,
    nodeBonuses: props.nodeBonuses,
    temporaryGp: props.temporaryGp,
    jobType: jobType.value,
    isTimedNode: props.activeItem.isTimedNode ?? false,
    hasRelicToolBonus: props.hasRelicToolBonus,
    rules: rules.value,
    maxNodes: internalMaxNodes,
    formatActionLabel: actionName,
    formatBranchLabel: (labelKeys) => labelKeys.map((key) => t(key)).join(t('collectableStrategyLab.branchJoiner')),
    formatPathStep: ({ ruleName, actionLabel, branchLabel }) => ruleName
      ? t('collectableStrategyLab.pathStepWithRule', { rule: ruleName, action: actionLabel, branch: branchLabel })
      : t('collectableStrategyLab.pathStep', { action: actionLabel, branch: branchLabel })
  });
});
const summary = computed(() => treeResult.value?.summary);
const uncoveredNodes = computed(() => treeResult.value?.uncoveredNodes ?? []);
const editingRule = computed(() => rules.value.find((rule) => rule.id === editingRuleId.value) ?? null);
const selectedUncoveredNode = computed(() => (
  uncoveredNodes.value.find((node) => node.id === selectedUncoveredId.value) ?? uncoveredNodes.value[0]
));
const selectedUncoveredIndex = computed(() => {
  const index = uncoveredNodes.value.findIndex((node) => node.id === selectedUncoveredNode.value?.id);
  return index >= 0 ? index : 0;
});
const stateFieldOptions = computed(() => [
  ...collectableStrategyNumericFields.map((field) => ({ field, label: fieldLabel(field), type: 'number' })),
  ...collectableStrategyBooleanFields.map((field) => ({ field, label: fieldLabel(field), type: 'boolean' }))
]);
const ruleCoverage = computed(() => {
  const counts = new Map<string, number>();

  function walk(node?: CollectableStrategyNode, visited = new Set<string>()) {
    if (!node) return;
    if (visited.has(node.id)) return;
    visited.add(node.id);
    if (node.matchedRuleId) counts.set(node.matchedRuleId, (counts.get(node.matchedRuleId) ?? 0) + 1);
    node.branches.forEach((branch) => walk(branch.child, visited));
  }

  walk(treeResult.value?.root);
  return counts;
});

watch(uncoveredNodes, (nodes) => {
  if (!nodes.some((node) => node.id === selectedUncoveredId.value)) {
    selectedUncoveredId.value = nodes[0]?.id ?? '';
  }
}, { immediate: true });

function addRule() {
  const id = makeId();
  rules.value = [
    ...rules.value,
    {
      id,
      name: t('collectableStrategyLab.defaultRuleName', { index: rules.value.length + 1 }),
      mode: 'all',
      enabled: true,
      conditions: [createCondition('collectability')],
      actions: ['collect']
    }
  ];
  editingRuleId.value = id;
}

function removeRule(ruleId: string) {
  rules.value = rules.value.filter((rule) => rule.id !== ruleId);
  if (editingRuleId.value === ruleId) editingRuleId.value = '';
}

function moveRule(ruleId: string, direction: -1 | 1) {
  const index = rules.value.findIndex((rule) => rule.id === ruleId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= rules.value.length) return;
  const nextRules = [...rules.value];
  const [rule] = nextRules.splice(index, 1);
  nextRules.splice(nextIndex, 0, rule);
  rules.value = nextRules;
}

function openRuleEditor(ruleId: string) {
  editingRuleId.value = ruleId;
}

function closeRuleEditor() {
  editingRuleId.value = '';
}

function addCondition(rule: CollectableStrategyRule) {
  rule.conditions.push(createCondition('collectability'));
}

function removeCondition(rule: CollectableStrategyRule, conditionId: string) {
  rule.conditions = rule.conditions.filter((condition) => condition.id !== conditionId);
}

function updateConditionField(condition: CollectableStrategyCondition, field: CollectableStrategyField) {
  condition.field = field;
  condition.comparator = '=';
  condition.value = isNumericStrategyField(field) ? 0 : true;
}

function addAction(rule: CollectableStrategyRule) {
  rule.actions.push('collect');
}

function removeAction(rule: CollectableStrategyRule, index: number) {
  if (rule.actions.length <= 1) return;
  rule.actions.splice(index, 1);
}

function setAction(rule: CollectableStrategyRule, actionIndex: number, action: CollectableActionKind) {
  rule.actions[actionIndex] = action;
}

function actionName(action: CollectableActionKind) {
  return getCollectableActionName(action, jobType.value);
}

function actionIcon(action: CollectableActionKind) {
  return getCollectableActionIcon(action, jobType.value);
}

function fieldLabel(field: CollectableStrategyField) {
  return t(`collectableStrategyLab.fields.${field}`);
}

function comparatorLabel(comparator: CollectableStrategyComparator) {
  const labels: Record<CollectableStrategyComparator, string> = {
    '<': '<',
    '<=': '<=',
    '=': '=',
    '>=': '>=',
    '>': '>'
  };
  return labels[comparator];
}

function formatNodeState(node: CollectableStrategyNode) {
  return t('collectableStrategyLab.nodeState', {
    gp: node.state.gp,
    integrity: node.state.integrity,
    collectability: node.state.collectability
  });
}

function formatStateChips(node: CollectableStrategyNode) {
  return [
    node.state.scrutinyActive ? t('collectableStrategyLab.chips.scrutinyActive') : '',
    node.state.collectorsFocusActive ? t('collectableStrategyLab.chips.collectorsFocusActive') : '',
    node.state.primingTouchActive ? t('collectableStrategyLab.chips.primingTouchActive') : '',
    node.state.standardActive ? t('collectableStrategyLab.chips.standardActive') : '',
    node.state.wiseToTheWorldActive ? t('collectableStrategyLab.chips.wiseToTheWorldActive') : '',
    node.state.successBonus ? t('collectableStrategyLab.chips.successBonus', { value: node.state.successBonus }) : '',
    node.state.nextCollectSuccessBonus ? t('collectableStrategyLab.chips.nextCollectSuccessBonus', { value: node.state.nextCollectSuccessBonus }) : '',
    node.state.hasUsedCollectableAction ? t('collectableStrategyLab.chips.hasUsedCollectableAction') : '',
    node.state.hasCollected ? t('collectableStrategyLab.chips.hasCollected') : ''
  ].filter(Boolean);
}

function coverageText(rule: CollectableStrategyRule) {
  const count = ruleCoverage.value.get(rule.id) ?? 0;
  return t('collectableStrategyLab.coverageNodes', { count });
}

function conditionSummary(rule: CollectableStrategyRule) {
  if (rule.conditions.length === 0) return t('collectableStrategyLab.noConditions');
  const joiner = rule.mode === 'all' ? t('collectableStrategyLab.joiners.all') : t('collectableStrategyLab.joiners.any');
  return rule.conditions.map((condition) => {
    const label = fieldLabel(condition.field);
    if (!isNumericStrategyField(condition.field)) {
      return t('collectableStrategyLab.booleanCondition', {
        label,
        value: condition.value ? t('collectableStrategyLab.booleanValues.true') : t('collectableStrategyLab.booleanValues.false')
      });
    }
    return `${label} ${condition.comparator} ${condition.value}`;
  }).join(joiner);
}

function actionSummary(rule: CollectableStrategyRule) {
  return rule.actions.map(actionName).join(' -> ');
}

function goToUncoveredNode(direction: -1 | 1) {
  if (uncoveredNodes.value.length === 0) return;
  const nextIndex = (selectedUncoveredIndex.value + direction + uncoveredNodes.value.length) % uncoveredNodes.value.length;
  selectedUncoveredId.value = uncoveredNodes.value[nextIndex].id;
}

function createCondition(field: CollectableStrategyField): CollectableStrategyCondition {
  return {
    id: makeId(),
    field,
    comparator: '=',
    value: isNumericStrategyField(field) ? 0 : true
  };
}

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}
</script>

<template>
  <div class="collectable-lab">
    <section class="lab-layout">
      <div class="strategy-column">
        <div class="column-header">
          <div>
            <span>{{ t('collectableStrategyLab.strategyListKicker') }}</span>
            <h2>{{ t('collectableStrategyLab.strategyListTitle') }}</h2>
          </div>
          <Button icon="pi pi-plus" :label="t('collectableStrategyLab.addStrategy')" class="p-button-sm rounded-xl" @click="addRule" />
        </div>

        <div v-if="rules.length === 0" class="strategy-empty">
          <i class="pi pi-sitemap"></i>
          <strong>{{ t('collectableStrategyLab.emptyStrategyTitle') }}</strong>
          <p>{{ t('collectableStrategyLab.emptyStrategyDesc') }}</p>
        </div>

        <div v-if="rules.length > 0" class="strategy-list" :aria-label="t('collectableStrategyLab.strategyListAria')">
          <article
            v-for="(rule, ruleIndex) in rules"
            :key="rule.id"
            class="rule-card"
            :class="{ 'is-disabled': !rule.enabled }"
          >
            <header class="rule-card-header">
              <label class="rule-enabled">
                <input v-model="rule.enabled" type="checkbox" />
                <span>#{{ ruleIndex + 1 }}</span>
              </label>
              <strong class="rule-name-display">{{ rule.name }}</strong>
              <span class="coverage-pill">{{ coverageText(rule) }}</span>
              <div class="rule-tools">
                <button type="button" :disabled="ruleIndex === 0" :title="t('collectableStrategyLab.tools.moveUp')" @click="moveRule(rule.id, -1)">
                  <i class="pi pi-arrow-up"></i>
                </button>
                <button type="button" :disabled="ruleIndex === rules.length - 1" :title="t('collectableStrategyLab.tools.moveDown')" @click="moveRule(rule.id, 1)">
                  <i class="pi pi-arrow-down"></i>
                </button>
                <button type="button" :title="t('collectableStrategyLab.tools.edit')" @click="openRuleEditor(rule.id)">
                  <i class="pi pi-pencil"></i>
                </button>
                <button type="button" :title="t('collectableStrategyLab.tools.delete')" @click="removeRule(rule.id)">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </header>

            <div class="rule-summary-row" :class="{ muted: !rule.enabled }">
              <span>{{ conditionSummary(rule) }}</span>
              <i class="pi pi-arrow-right"></i>
              <strong>{{ actionSummary(rule) }}</strong>
            </div>
          </article>
        </div>
      </div>

      <aside class="tree-column">
        <div class="column-header">
          <div>
            <span>{{ t('collectableStrategyLab.treeKicker') }}</span>
            <h2>{{ t('collectableStrategyLab.treeTitle') }}</h2>
          </div>
        </div>

        <div v-if="!canBuildTree" class="tree-empty">
          <i class="pi pi-database"></i>
          <p>{{ t('collectableStrategyLab.loadingBaseValues') }}</p>
        </div>

        <template v-else-if="summary">
          <section class="summary-grid">
            <div>
              <span>{{ t('collectableStrategyLab.summary.totalNodes') }}</span>
              <strong>{{ summary.totalNodes }}</strong>
            </div>
            <div>
              <span>{{ t('collectableStrategyLab.summary.decidedNodes') }}</span>
              <strong>{{ summary.decidedNodes }}</strong>
            </div>
            <div :class="{ warning: summary.uncoveredNodes > 0 }">
              <span>{{ t('collectableStrategyLab.summary.uncoveredNodes') }}</span>
              <strong>{{ summary.uncoveredNodes }}</strong>
            </div>
            <div>
              <span>{{ t('collectableStrategyLab.summary.terminalNodes') }}</span>
              <strong>{{ summary.terminalNodes }}</strong>
            </div>
          </section>

          <p v-if="treeResult?.limited" class="limit-warning">
            {{ t('collectableStrategyLab.limitWarning') }}
          </p>

          <section class="uncovered-panel">
            <div class="panel-title-row">
              <h3>{{ t('collectableStrategyLab.uncoveredTitle') }}</h3>
            </div>

            <div v-if="uncoveredNodes.length === 0" class="tree-empty compact">
              <i class="pi pi-check-circle"></i>
              <p>{{ t('collectableStrategyLab.noUncoveredDesc') }}</p>
            </div>

            <div v-else class="uncovered-layout">
              <div class="node-pager">
                <button type="button" :aria-label="t('collectableStrategyLab.previousUncovered')" @click="goToUncoveredNode(-1)">
                  <i class="pi pi-angle-left"></i>
                </button>
                <span>{{ t('collectableStrategyLab.nodePager', { current: selectedUncoveredIndex + 1, total: uncoveredNodes.length }) }}</span>
                <button type="button" :aria-label="t('collectableStrategyLab.nextUncovered')" @click="goToUncoveredNode(1)">
                  <i class="pi pi-angle-right"></i>
                </button>
              </div>

              <article v-if="selectedUncoveredNode" class="uncovered-detail">
                <span>{{ t('collectableStrategyLab.pendingState') }}</span>
                <h4>{{ formatNodeState(selectedUncoveredNode) }}</h4>
                <div class="state-chip-list">
                  <span v-for="chip in formatStateChips(selectedUncoveredNode)" :key="chip">{{ chip }}</span>
                  <span v-if="formatStateChips(selectedUncoveredNode).length === 0">{{ t('collectableStrategyLab.noBuff') }}</span>
                </div>
                <div class="path-box">
                  <strong>{{ t('collectableStrategyLab.pathTitle') }}</strong>
                  <ol v-if="selectedUncoveredNode.path.length">
                    <li v-for="(step, index) in selectedUncoveredNode.path" :key="`${step}-${index}`">{{ step }}</li>
                  </ol>
                  <p v-else>{{ t('collectableStrategyLab.noPath') }}</p>
                </div>
              </article>
            </div>
          </section>
        </template>
      </aside>
    </section>

    <Teleport to="body">
      <div v-if="editingRule" class="rule-editor-overlay" role="presentation" @click.self="closeRuleEditor">
        <section class="rule-editor-dialog" role="dialog" aria-modal="true" aria-labelledby="collectable-rule-editor-title">
          <header class="rule-editor-dialog-header">
            <div>
              <span>{{ t('collectableStrategyLab.editor.kicker') }}</span>
              <h2 id="collectable-rule-editor-title">{{ editingRule.name }}</h2>
            </div>
            <button type="button" class="dialog-close-button" :aria-label="t('collectableStrategyLab.editor.close')" @click="closeRuleEditor">
              <i class="pi pi-times"></i>
            </button>
          </header>

          <div class="rule-editor-body">
            <label class="dialog-name-field">
              <span>{{ t('collectableStrategyLab.editor.name') }}</span>
              <input v-model="editingRule.name" type="text" />
            </label>

            <div class="rule-mode-row">
              <span>{{ t('collectableStrategyLab.editor.when') }}</span>
              <select v-model="editingRule.mode">
                <option value="all">{{ t('collectableStrategyLab.editor.allConditions') }}</option>
                <option value="any">{{ t('collectableStrategyLab.editor.anyCondition') }}</option>
              </select>
              <span>{{ t('collectableStrategyLab.editor.then') }}</span>
            </div>

            <div class="condition-list">
              <div
                v-for="condition in editingRule.conditions"
                :key="condition.id"
                class="condition-row"
                :class="{ 'is-boolean': !isNumericStrategyField(condition.field) }"
              >
                <select
                  :value="condition.field"
                  @change="updateConditionField(condition, ($event.target as HTMLSelectElement).value as CollectableStrategyField)"
                >
                  <option v-for="option in stateFieldOptions" :key="option.field" :value="option.field">
                    {{ option.label }}
                  </option>
                </select>

                <template v-if="isNumericStrategyField(condition.field)">
                  <select v-model="condition.comparator">
                    <option v-for="comparator in ['<', '<=', '=', '>=', '>']" :key="comparator" :value="comparator">
                      {{ comparatorLabel(comparator as CollectableStrategyComparator) }}
                    </option>
                  </select>
                  <input v-model.number="condition.value" type="number" />
                </template>

                <template v-else>
                  <select v-model="condition.value">
                    <option :value="true">{{ t('collectableStrategyLab.booleanValues.true') }}</option>
                    <option :value="false">{{ t('collectableStrategyLab.booleanValues.false') }}</option>
                  </select>
                </template>

                <button type="button" class="icon-button" :title="t('collectableStrategyLab.editor.removeCondition')" @click="removeCondition(editingRule, condition.id)">
                  <i class="pi pi-times"></i>
                </button>
              </div>
              <button type="button" class="text-tool" @click="addCondition(editingRule)">
                <i class="pi pi-plus"></i>
                {{ t('collectableStrategyLab.editor.addCondition') }}
              </button>
            </div>

            <div class="action-chain">
              <div class="action-chain-header">
                <span>{{ editingRule.actions.length > 1 ? t('collectableStrategyLab.editor.actionChain') : t('collectableStrategyLab.editor.singleAction') }}</span>
                <button type="button" class="text-tool" @click="addAction(editingRule)">
                  <i class="pi pi-plus"></i>
                  {{ t('collectableStrategyLab.editor.addAction') }}
                </button>
              </div>
              <div class="action-list">
                <div v-for="(action, actionIndex) in editingRule.actions" :key="`${editingRule.id}-${actionIndex}`" class="action-chip">
                  <div class="selected-action">
                    <img v-if="actionIcon(action)" :src="actionIcon(action)" alt="" />
                    <strong>{{ actionName(action) }}</strong>
                  </div>
                  <button type="button" :disabled="editingRule.actions.length <= 1" :title="t('collectableStrategyLab.editor.removeAction')" @click="removeAction(editingRule, actionIndex)">
                    <i class="pi pi-times"></i>
                  </button>
                  <div class="action-option-list">
                    <button
                      v-for="option in collectableStrategyActionKinds"
                      :key="option"
                      type="button"
                      class="action-option"
                      :class="{ active: action === option }"
                      @click="setAction(editingRule, actionIndex, option)"
                    >
                      <img v-if="actionIcon(option)" :src="actionIcon(option)" alt="" />
                      <span>{{ actionName(option) }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer class="rule-editor-dialog-footer">
            <Button :label="t('collectableStrategyLab.editor.done')" icon="pi pi-check" class="p-button-sm rounded-xl" @click="closeRuleEditor" />
          </footer>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.collectable-lab {
  width: 100%;
  margin: 0;
  padding: 0 0 3rem;
  display: grid;
  gap: 1rem;
  --strategy-workspace-height: clamp(34rem, 62vh, 46rem);
}

.strategy-column,
.tree-column,
.rule-card,
.uncovered-detail,
.rule-editor-dialog {
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  background: white;
  box-shadow: 0 2px 8px rgb(15 23 42 / 0.04);
}

:global(html.dark .strategy-column),
:global(html.dark .tree-column),
:global(html.dark .rule-card),
:global(html.dark .uncovered-detail),
:global(html.dark .rule-editor-dialog) {
  border-color: #334155;
  background: #0f172a;
}

.coverage-pill,
.state-chip-list span {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #ecfdf5;
  color: #15803d;
  font-size: 0.72rem;
  font-weight: 900;
  line-height: 1.35;
}

.coverage-pill,
.state-chip-list span {
  padding: 0.2rem 0.5rem;
}

.tree-empty p,
.limit-warning,
.path-box p {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.86rem;
  line-height: 1.5;
}

:global(html.dark .column-header h2),
:global(html.dark .uncovered-panel h3),
:global(html.dark .rule-editor-dialog-header h2),
:global(html.dark .uncovered-detail h4),
:global(html.dark .path-box strong) {
  color: #f8fafc;
}

:global(html.dark .tree-empty p),
:global(html.dark .limit-warning),
:global(html.dark .path-box p) {
  color: #94a3b8;
}

.column-header span,
.rule-editor-dialog-header span,
.summary-grid span,
.uncovered-detail > span {
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 900;
}

.lab-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(22rem, 0.85fr);
  gap: 1rem;
  align-items: stretch;
}

.strategy-column,
.tree-column {
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
  height: var(--strategy-workspace-height);
  min-height: 0;
  overflow: hidden;
}

.strategy-column {
  grid-template-rows: auto minmax(0, 1fr);
  align-content: start;
}

.tree-column {
  align-content: start;
  overflow-y: auto;
}

.column-header,
.rule-card-header,
.rule-mode-row,
.action-chain-header,
.panel-title-row,
.rule-editor-dialog-header,
.rule-editor-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.column-header h2,
.uncovered-panel h3,
.rule-editor-dialog-header h2 {
  margin: 0.1rem 0 0;
  color: #334155;
  font-size: 1.05rem;
  font-weight: 900;
}

.strategy-list {
  height: 100%;
  min-height: 0;
  display: grid;
  align-content: start;
  gap: 0.8rem;
  overflow-y: auto;
  padding-right: 0.25rem;
  scrollbar-gutter: stable;
}

.rule-card {
  display: grid;
  gap: 0.8rem;
  padding: 0.85rem;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.rule-card:hover,
.rule-card:focus-within {
  border-color: #52a890;
  box-shadow: 0 10px 28px rgb(82 168 144 / 0.12);
}

.rule-card.is-disabled {
  opacity: 0.72;
}

.strategy-empty {
  min-height: 0;
  height: 100%;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 0.45rem;
  border: 2px dashed #d1fae5;
  border-radius: 1rem;
  background: #f8fafc;
  padding: 2rem 1rem;
  text-align: center;
}

:global(html.dark .strategy-empty) {
  border-color: #334155;
  background: rgb(2 6 23 / 0.38);
}

.strategy-empty i {
  color: #52a890;
  font-size: 1.6rem;
}

.strategy-empty strong {
  color: #334155;
  font-weight: 900;
}

.strategy-empty p {
  max-width: 26rem;
  margin: 0;
  color: #64748b;
  font-size: 0.86rem;
  line-height: 1.5;
}

:global(html.dark .strategy-empty strong) {
  color: #f8fafc;
}

:global(html.dark .strategy-empty p) {
  color: #94a3b8;
}

.rule-enabled {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #64748b;
  font-weight: 900;
}

.rule-name-display {
  flex: 1 1 auto;
  min-width: 0;
  color: #334155;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(html.dark .rule-name-display) {
  color: #f8fafc;
}

.dialog-name-field input,
.condition-row input,
.condition-row select,
.rule-mode-row select {
  min-width: 0;
  border: 1px solid #cbd5e1;
  border-radius: 0.7rem;
  background: #fff;
  padding: 0.45rem 0.6rem;
  color: #334155;
  font-weight: 800;
}

:global(html.dark .dialog-name-field input),
:global(html.dark .condition-row input),
:global(html.dark .condition-row select),
:global(html.dark .rule-mode-row select) {
  border-color: #334155;
  background: #020617;
  color: #e2e8f0;
}

.dialog-name-field {
  display: grid;
  gap: 0.35rem;
}

.dialog-name-field span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 900;
}

.dialog-name-field input {
  width: 100%;
}

.rule-tools {
  display: flex;
  gap: 0.25rem;
}

.rule-tools button,
.icon-button,
.action-chip > button {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d1fae5;
  border-radius: 0.65rem;
  background: #f8fafc;
  color: #0f766e;
}

.rule-tools button:disabled,
.action-chip > button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

:global(html.dark .rule-tools button),
:global(html.dark .icon-button),
:global(html.dark .action-chip > button) {
  border-color: #334155;
  background: rgb(2 6 23 / 0.5);
  color: #99f6e4;
}

.rule-mode-row {
  justify-content: flex-start;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 900;
}

.rule-summary-row {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 0.72fr);
  align-items: center;
  gap: 0.65rem;
  border-radius: 0.85rem;
  background: #f8fafc;
  padding: 0.6rem 0.7rem;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.35;
}

.rule-summary-row span,
.rule-summary-row strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule-summary-row strong {
  color: #0f766e;
  font-weight: 900;
}

.rule-summary-row.muted {
  opacity: 0.52;
}

:global(html.dark .rule-summary-row) {
  background: rgb(30 41 59 / 0.42);
  color: #94a3b8;
}

:global(html.dark .rule-summary-row strong) {
  color: #99f6e4;
}

.rule-editor-body {
  display: grid;
  gap: 0.8rem;
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.condition-list,
.action-chain {
  display: grid;
  gap: 0.5rem;
}

.condition-row {
  display: grid;
  grid-template-columns: minmax(9rem, 1.2fr) minmax(4.5rem, 0.45fr) minmax(5rem, 0.55fr) auto;
  gap: 0.45rem;
}

.condition-row select:first-child {
  grid-column: auto;
}

.condition-row.is-boolean .icon-button {
  grid-column: 4;
}

.text-tool {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 0;
  background: transparent;
  color: #0f766e;
  padding: 0.25rem;
  font-size: 0.82rem;
  font-weight: 900;
}

.action-list {
  display: grid;
  gap: 0.5rem;
}

.action-chip {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.6rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.85rem;
  background: #f8fafc;
  padding: 0.55rem;
}

:global(html.dark .action-chip) {
  border-color: #334155;
  background: rgb(30 41 59 / 0.42);
}

.selected-action {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.selected-action strong {
  min-width: 0;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 900;
}

:global(html.dark .selected-action strong) {
  color: #f8fafc;
}

.selected-action img,
.action-option img {
  width: 2rem;
  height: 2rem;
  border-radius: 0.55rem;
  image-rendering: pixelated;
  flex-shrink: 0;
}

.action-option-list {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
  gap: 0.4rem;
}

.action-option {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: white;
  padding: 0.45rem 0.5rem;
  color: #334155;
  font-size: 0.8rem;
  font-weight: 850;
  text-align: left;
  transition: border-color 0.16s ease, background-color 0.16s ease, box-shadow 0.16s ease;
}

.action-option:hover,
.action-option.active {
  border-color: #52a890;
  background: #ecfdf5;
}

.action-option.active {
  box-shadow: 0 0 0 3px rgb(82 168 144 / 0.12);
  color: #0f766e;
}

.action-option span {
  min-width: 0;
  overflow-wrap: anywhere;
}

:global(html.dark .action-option) {
  border-color: #334155;
  background: rgb(2 6 23 / 0.5);
  color: #e2e8f0;
}

:global(html.dark .action-option:hover),
:global(html.dark .action-option.active) {
  border-color: #5eead4;
  background: rgb(20 83 45 / 0.24);
  color: #ccfbf1;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  align-items: stretch;
}

.summary-grid div {
  min-width: 0;
  min-height: 6.9rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.65rem;
  border-radius: 0.85rem;
  background: #f8fafc;
  padding: 0.75rem;
}

.summary-grid div.warning {
  background: #fff7ed;
}

:global(html.dark .summary-grid div) {
  background: rgb(30 41 59 / 0.55);
}

:global(html.dark .summary-grid div.warning) {
  background: rgb(154 52 18 / 0.18);
}

.summary-grid strong {
  display: block;
  margin-top: auto;
  color: #0f172a;
  font-size: 1.35rem;
  font-weight: 950;
  line-height: 1;
}

:global(html.dark .summary-grid strong) {
  color: #f8fafc;
}

.limit-warning {
  border: 1px solid #fed7aa;
  border-radius: 0.85rem;
  background: #fff7ed;
  padding: 0.75rem;
  color: #9a3412;
  font-weight: 800;
}

.uncovered-panel {
  display: grid;
  gap: 0.65rem;
}

.node-status {
  display: inline-flex;
  margin-bottom: 0.45rem;
  border-radius: 999px;
  padding: 0.18rem 0.5rem;
  background: #e2e8f0;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 900;
}

.node-status.decided {
  background: #dcfce7;
  color: #15803d;
}

.node-status.uncovered {
  background: #ffedd5;
  color: #c2410c;
}

.node-status.terminal {
  background: #e0f2fe;
  color: #0369a1;
}

.tree-empty {
  display: grid;
  justify-items: center;
  gap: 0.55rem;
  border: 2px dashed #e2e8f0;
  border-radius: 1rem;
  padding: 2rem 1rem;
  text-align: center;
}

.tree-empty.compact {
  padding: 1.25rem 1rem;
}

:global(html.dark .tree-empty) {
  border-color: #334155;
}

.tree-empty i {
  color: #52a890;
  font-size: 1.4rem;
}

.panel-title-row span {
  border-radius: 999px;
  background: #ffedd5;
  color: #c2410c;
  padding: 0.2rem 0.55rem;
  font-size: 0.76rem;
  font-weight: 900;
}

.uncovered-layout {
  display: grid;
  gap: 0.65rem;
}

.node-pager {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr) 2.5rem;
  align-items: center;
  gap: 0.5rem;
}

.node-pager button {
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid #d1fae5;
  border-radius: 0.75rem;
  background: #f0fdf4;
  color: #0f766e;
  font-size: 1rem;
}

.node-pager span {
  min-width: 0;
  color: #334155;
  font-size: 0.86rem;
  font-weight: 900;
  text-align: center;
}

:global(html.dark .node-pager button) {
  border-color: #334155;
  background: rgb(20 83 45 / 0.24);
  color: #99f6e4;
}

:global(html.dark .node-pager span) {
  color: #e2e8f0;
}

.uncovered-detail {
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
  align-self: start;
}

.uncovered-detail h4 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(1.35rem, 3vw, 1.8rem);
  font-weight: 900;
  line-height: 1.18;
}

.state-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.path-box {
  display: grid;
  gap: 0.4rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 0.65rem;
}

:global(html.dark .path-box) {
  border-top-color: #334155;
}

.path-box ol {
  margin: 0;
  padding-left: 1.2rem;
  color: #475569;
  font-size: 0.8rem;
  line-height: 1.5;
}

:global(html.dark .path-box ol) {
  color: #cbd5e1;
}

.rule-editor-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  background: rgb(15 23 42 / 0.42);
  padding: 1rem;
}

.rule-editor-dialog {
  width: min(100%, 58rem);
  max-height: min(88vh, 48rem);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 0.85rem;
  padding: 1rem;
}

.rule-editor-dialog-header {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.85rem;
}

:global(html.dark .rule-editor-dialog-header) {
  border-bottom-color: #334155;
}

.dialog-close-button {
  width: 2.35rem;
  height: 2.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d1fae5;
  border-radius: 0.75rem;
  background: #f8fafc;
  color: #0f766e;
}

:global(html.dark .dialog-close-button) {
  border-color: #334155;
  background: rgb(2 6 23 / 0.5);
  color: #99f6e4;
}

.rule-editor-dialog-footer {
  border-top: 1px solid #e2e8f0;
  padding-top: 0.85rem;
  justify-content: flex-end;
}

:global(html.dark .rule-editor-dialog-footer) {
  border-top-color: #334155;
}

@media (max-width: 1040px) {
  .lab-layout,
  .uncovered-layout {
    grid-template-columns: 1fr;
  }

  .strategy-column,
  .tree-column {
    height: auto;
    max-height: none;
    overflow: visible;
  }

  .strategy-list {
    max-height: 32rem;
  }
}

@media (max-width: 700px) {
  .column-header,
  .rule-card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .condition-row {
    grid-template-columns: 1fr;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
