<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import type { FoodSelection, GatherableItem, NodeBonuses, PlayerStats, StoredCollectableStrategyRule } from '../types/game';
import type { CollectableActionKind, CollectableObjective, CollectableRewardTable, CollectableRewardTableSummary, CollectableTierCounts } from '../types/collectable';
import { useCollectableSolver } from '../composables/useCollectableSolver';
import { useExperimentLibrary } from '../composables/useExperimentLibrary';
import { getCollectableRewardTable } from '../services/collectableRewards';
import { getCollectableScripRewardMeta } from '../services/collectableScripRewards';
import { getItemName } from '../services/gameData';
import { analyzeCollectableStrategyTree, type CollectableStrategyAnalysis } from '../utils/collectableStrategyAnalysis';
import {
  buildCollectableStrategyTree,
  collectableStrategyActionKinds,
  collectableStrategyFields,
  collectMatchingUncoveredStrategyNodes,
  createDefaultCollectableStrategyRules,
  createSimpleCollectableStrategyRules,
  isNumericStrategyField,
  type CollectableStrategyCondition,
  type CollectableStrategyComparator,
  type CollectableStrategyField,
  type CollectableStrategyNumericField,
  type CollectableStrategyNode,
  type CollectableStrategyRule
} from '../utils/collectableStrategyTree';
import { getCollectableActionIcon, getCollectableActionMinLevel, getCollectableActionName } from '../services/collectableActions';
import CollectableObjectivePreferenceDialog from './CollectableObjectivePreferenceDialog.vue';
import SaveEntryDialog from './SaveEntryDialog.vue';
import {
  createCollectableObjectiveOptions,
  getDefaultCollectableObjectivePresetId,
  isCustomTierObjective,
  isTierCountObjective
} from '../utils/collectableObjectivePresets';
import { MIN_COLLECTABLE_LEVEL } from '../utils/collectableMechanics';
import {
  COLLECTABLE_INPUT_LIMITS,
  PLAYER_INPUT_LIMITS,
  WASM_PACKED_STATE_LIMITS,
  clampIntegerInput,
  normalizeCollectableObjective
} from '../config/inputLimits';

const { t } = useI18n();
const route = useRoute();
const { saveCollectableExperiment, getExperiment } = useExperimentLibrary();

type RuleEditorView = 'main' | 'managedNodes' | 'actions';
type ManagedNodesView = 'summary' | 'individual';
type ManagedNodeMeterKey = 'gp' | 'integrity' | 'collectability';
type ManagedOverviewMetricKey = 'gp' | 'integrity' | 'collectability';

const props = defineProps<{
  activeItem: GatherableItem;
  effectiveStats: PlayerStats;
  baseValues: { Gathering: number; Perception: number } | null;
  itemRealLevel: number;
  nodeBonuses: NodeBonuses;
  temporaryGp: number;
  selectedFood: FoodSelection;
  hasRelicToolBonus?: boolean;
}>();

const rules = ref<CollectableStrategyRule[]>(createDefaultCollectableStrategyRules());
const editingRuleId = ref('');
const editingRuleDraft = ref<CollectableStrategyRule | null>(null);
const ruleEditorView = ref<RuleEditorView>('main');
const managedNodesView = ref<ManagedNodesView>('summary');
const managedNodeIndex = ref(0);
const analysis = ref<CollectableStrategyAnalysis | null>(null);
const rewardTable = ref<CollectableRewardTable | null>(null);
const rewardError = ref(false);
const isObjectiveDialogOpen = ref(false);
const isSaveExperimentDialogOpen = ref(false);
const isSaved = ref(false);
const isReportCopied = ref(false);
const internalMaxNodes = 1200;
const tierCountVisibilityEpsilon = 0.000001;
const compactPathHiddenBranchKeys = new Set([
  'collectableSolver.branches.standardProc',
  'collectableSolver.branches.standardNoProc',
  'collectableSolver.branches.wiseProc',
  'collectableSolver.branches.wiseNoProc'
]);
const { collectableObjective } = useCollectableSolver();
let saveTimer: ReturnType<typeof window.setTimeout> | null = null;
let copyTimer: ReturnType<typeof window.setTimeout> | null = null;
const strategyConditionValueLimits: Record<CollectableStrategyNumericField, { min: number; max: number }> = {
  gp: PLAYER_INPUT_LIMITS.gp,
  integrity: WASM_PACKED_STATE_LIMITS.integrity,
  collectability: COLLECTABLE_INPUT_LIMITS.collectability,
  successBonus: COLLECTABLE_INPUT_LIMITS.successBonus,
  nextCollectSuccessBonus: COLLECTABLE_INPUT_LIMITS.nextCollectSuccessBonus
};

const jobType = computed(() => props.activeItem.jobType || 'miner');
const isCollectableLevelLocked = computed(() => props.effectiveStats.level < MIN_COLLECTABLE_LEVEL);
const canBuildTree = computed(() => !!props.baseValues && !isCollectableLevelLocked.value);
const treeResult = computed(() => buildStrategyTreeForRules(rules.value));

function buildStrategyTreeForRules(strategyRules: CollectableStrategyRule[]) {
  if (!props.baseValues || isCollectableLevelLocked.value) return null;

  return buildCollectableStrategyTree({
    stats: props.effectiveStats,
    baseValues: props.baseValues,
    itemLevel: props.itemRealLevel,
    nodeBonuses: props.nodeBonuses,
    temporaryGp: props.temporaryGp,
    jobType: jobType.value,
    isTimedNode: props.activeItem.isTimedNode ?? false,
    hasRelicToolBonus: props.hasRelicToolBonus,
    rules: strategyRules,
    maxNodes: internalMaxNodes,
    formatActionLabel: actionName,
    formatBranchLabel: (labelKeys) => labelKeys.map((key) => t(key)).join(t('collectableStrategyLab.branchJoiner')),
    formatPathStep: ({ ruleName, actionLabel, branchLabel, branchLabelKeys }) => formatCompactPathStep({
      ruleName,
      actionLabel,
      branchLabel,
      branchLabelKeys
    })
  });
}
const summary = computed(() => treeResult.value?.summary);
const uncoveredNodes = computed(() => treeResult.value?.uncoveredNodes ?? []);
const uncoveredStateGroups = computed(() => buildUncoveredStateGroups(uncoveredNodes.value));
const editingRule = computed(() => editingRuleDraft.value);
const activeGpMax = computed(() => Math.max(1, props.effectiveStats.gp));
const activeIntegrityMax = computed(() => Math.max(1, props.nodeBonuses.baseIntegrity + props.nodeBonuses.gatheringCount));
const editorFrontierRules = computed(() => {
  const draft = editingRuleDraft.value;
  if (!draft) return rules.value;

  const index = rules.value.findIndex((rule) => rule.id === editingRuleId.value);
  return index < 0 ? rules.value : rules.value.slice(0, index);
});
const editorFrontierTreeResult = computed(() => buildStrategyTreeForRules(editorFrontierRules.value));
const managedNodes = computed(() => collectMatchingUncoveredStrategyNodes(editorFrontierTreeResult.value?.uncoveredNodes ?? [], editingRuleDraft.value));
const managedNodeOverview = computed(() => buildManagedNodeOverview(managedNodes.value));
const currentManagedNode = computed(() => managedNodes.value[managedNodeIndex.value] ?? null);
const editorCoverageText = computed(() => t('collectableStrategyLab.coverageNodes', { count: managedNodes.value.length }));
const ruleActionPreview = computed(() => editingRuleDraft.value?.actions.slice(0, 6) ?? []);
const stateFieldOptions = computed(() => [
  ...collectableStrategyFields.map((field) => ({
    field,
    label: fieldLabel(field),
    type: isNumericStrategyField(field) ? 'number' : 'boolean'
  }))
]);
const analysisUnit = computed(() => t(getCollectableScripRewardMeta(rewardTable.value?.rewardItemId).labelKey));
const selectedObjectiveLabel = computed(() => {
  if (!rewardTable.value) return t('collectableObjective.title');
  const option = createCollectableObjectiveOptions(rewardTable.value)
    .find((entry) => entry.id === collectableObjective.value.presetId || (entry.id === 'scrip' && collectableObjective.value.kind === 'scrip'));
  return option ? t(option.labelKey) : t('collectableObjective.title');
});
const strategyLevelIssues = computed(() => rules.value.flatMap((rule) => {
  if (!rule.enabled) return [];

  return rule.actions
    .filter((action) => isActionLevelLocked(action))
    .map((action) => ({
      ruleId: rule.id,
      ruleName: rule.name,
      action,
      actionName: actionName(action),
      minLevel: getCollectableActionMinLevel(action)
    }));
}));
const hasStrategyLevelIssue = computed(() => strategyLevelIssues.value.length > 0);
const firstStrategyLevelIssue = computed(() => strategyLevelIssues.value[0] ?? null);

watch(() => props.activeItem.itemId, async () => {
  analysis.value = null;
  rewardTable.value = null;
  rewardError.value = false;

  try {
    rewardTable.value = await getCollectableRewardTable(props.activeItem.itemId);
    rewardError.value = !rewardTable.value;
    if (rewardTable.value && !routeCollectableExperiment()) applyDefaultObjective(rewardTable.value);
  } catch (error) {
    console.error('Collectable strategy reward table loading failed:', error);
    rewardError.value = true;
  }
}, { immediate: true });

watch([
  () => route.query.experiment,
  () => props.activeItem.itemId
], () => {
  loadCollectableExperimentFromRoute();
}, { immediate: true });

watch([
  rules,
  () => props.effectiveStats,
  () => props.baseValues,
  () => props.itemRealLevel,
  () => props.nodeBonuses,
  () => props.temporaryGp,
  () => props.hasRelicToolBonus,
  collectableObjective
], () => {
  analysis.value = null;
  isSaved.value = false;
}, { deep: true });

watch(rules, () => {
  sanitizeRuleConditions();
}, { deep: true });

watch(() => managedNodes.value.length, (length) => {
  if (length === 0) {
    managedNodeIndex.value = 0;
    return;
  }
  if (managedNodeIndex.value >= length) managedNodeIndex.value = length - 1;
});

onUnmounted(() => {
  if (saveTimer) window.clearTimeout(saveTimer);
  if (copyTimer) window.clearTimeout(copyTimer);
});

function runAnalysis() {
  if (isCollectableLevelLocked.value || !treeResult.value?.root || !rewardTable.value || hasStrategyLevelIssue.value) return;

  analysis.value = analyzeCollectableStrategyTree(
    treeResult.value.root,
    rewardTable.value,
    collectableObjective.value
  );
}

function defaultExperimentName() {
  return getItemName(props.activeItem.itemId);
}

function rewardTableSummary(table: CollectableRewardTable | null): CollectableRewardTableSummary | undefined {
  if (!table) return undefined;
  return {
    source: table.source,
    rewardItemId: table.rewardItemId,
    lowCollectability: table.tiers.low.collectability,
    lowScrip: table.tiers.low.reward.scrip,
    midCollectability: table.tiers.mid.collectability,
    midScrip: table.tiers.mid.reward.scrip,
    highCollectability: table.tiers.high?.collectability,
    highScrip: table.tiers.high?.reward.scrip
  };
}

function storedRules(): StoredCollectableStrategyRule[] {
  return rules.value.map((rule) => ({
    id: rule.id,
    name: rule.name,
    mode: rule.mode,
    enabled: rule.enabled,
    conditions: rule.conditions.map((condition) => ({ ...condition })),
    actions: [...rule.actions]
  }));
}

function saveCurrentExperiment() {
  if (!analysis.value) return;
  isSaveExperimentDialogOpen.value = true;
}

function confirmSaveExperiment(name: string) {
  if (!analysis.value) return;

  saveCollectableExperiment({
    name,
    itemId: props.activeItem.itemId,
    stats: { ...props.effectiveStats },
    temporaryGp: props.temporaryGp,
    food: { ...props.selectedFood },
    nodeBonuses: { ...props.nodeBonuses },
    rules: storedRules(),
    objective: collectableObjective.value,
    rewardTableSummary: rewardTableSummary(rewardTable.value),
    analysis: analysis.value,
    hasRelicToolBonus: props.hasRelicToolBonus
  });

  isSaved.value = true;
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    isSaved.value = false;
    saveTimer = null;
  }, 1600);
}

async function copyReport() {
  if (!analysis.value) return;

  const report = {
    kind: 'collectable',
    itemId: props.activeItem.itemId,
    stats: { ...props.effectiveStats },
    temporaryGp: props.temporaryGp,
    food: { ...props.selectedFood },
    nodeBonuses: { ...props.nodeBonuses },
    hasRelicToolBonus: !!props.hasRelicToolBonus,
    objective: collectableObjective.value,
    rewardTable: rewardTableSummary(rewardTable.value),
    strategyRules: storedRules(),
    analysis: analysis.value
  };

  try {
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    isReportCopied.value = true;
    if (copyTimer) window.clearTimeout(copyTimer);
    copyTimer = window.setTimeout(() => {
      isReportCopied.value = false;
      copyTimer = null;
    }, 1600);
  } catch (error) {
    console.error('Failed to copy collectable experiment report:', error);
  }
}

function loadCollectableExperimentFromRoute() {
  const id = typeof route.query.experiment === 'string' ? route.query.experiment : '';
  if (!id) return;

  const experiment = routeCollectableExperiment();
  if (!experiment || experiment.kind !== 'collectable' || experiment.itemId !== props.activeItem.itemId) return;

  if (experiment.collectableRules?.length) {
    rules.value = clonePlain(experiment.collectableRules) as CollectableStrategyRule[];
  }
  if (experiment.collectableObjective) {
    collectableObjective.value = normalizeCollectableObjective(clonePlain(experiment.collectableObjective));
  }
  analysis.value = null;
}

function clonePlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function routeCollectableExperiment() {
  const id = typeof route.query.experiment === 'string' ? route.query.experiment : '';
  if (!id) return null;
  const experiment = getExperiment(id);
  if (!experiment || experiment.kind !== 'collectable' || experiment.itemId !== props.activeItem.itemId) return null;
  return experiment;
}

function previewRuleActionIcons(rule: CollectableStrategyRule) {
  return rule.actions.slice(0, 5);
}

function applyDefaultObjective(table: CollectableRewardTable) {
  const defaultId = getDefaultCollectableObjectivePresetId(table);
  const option = createCollectableObjectiveOptions(table).find((entry) => entry.id === defaultId);
  if (option) collectableObjective.value = normalizeCollectableObjective(option.objective);
}

function handleObjectiveChange(objective: CollectableObjective) {
  collectableObjective.value = normalizeCollectableObjective(objective);
  analysis.value = null;
}

function scoreUnitLabel() {
  if (isCustomTierObjective(collectableObjective.value)) return t('collectableStrategyLab.analysis.weightedScoreUnit');
  return analysisUnit.value;
}

function tierMetricEntries(counts: CollectableTierCounts) {
  return [
    { key: 'high', label: t('collectableObjective.tiers.high'), value: counts.high },
    { key: 'mid', label: t('collectableObjective.tiers.mid'), value: counts.mid },
    { key: 'low', label: t('collectableObjective.tiers.low'), value: counts.low }
  ];
}

function visibleTierMetricEntries(counts: CollectableTierCounts) {
  const entries = tierMetricEntries(counts).filter((entry) => Math.abs(entry.value) > tierCountVisibilityEpsilon);
  return entries.length ? entries : [{ key: 'none', label: '', value: 0 }];
}

function formatTierCountValue(value: number) {
  return Number(value.toFixed(2));
}

function formatSingleTierCount(counts: CollectableTierCounts) {
  const entry = visibleTierMetricEntries(counts)[0];
  return entry.label ? `${formatTierCountValue(entry.value)} ${entry.label}` : `${formatTierCountValue(entry.value)}`;
}

function distributionTitle() {
  if (isTierCountObjective(collectableObjective.value)) return t('collectableStrategyLab.analysis.distributionTierCounts');
  if (isCustomTierObjective(collectableObjective.value)) return t('collectableStrategyLab.analysis.distributionWeightedScore');
  return t('collectableStrategyLab.analysis.distributionScrip');
}

function distributionUnitText() {
  if (isTierCountObjective(collectableObjective.value)) return t('collectableStrategyLab.analysis.distributionUnitTierCounts');
  if (isCustomTierObjective(collectableObjective.value)) return t('collectableStrategyLab.analysis.distributionUnitWeightedScore');
  return t('collectableStrategyLab.analysis.distributionUnitScrip', { unit: scoreUnitLabel() });
}

function distributionTierColumns() {
  if (!analysis.value || !isTierCountObjective(collectableObjective.value)) return [];

  const entries = analysis.value.outcomeDistribution;
  const hasMixedTierOutcome = entries.some((entry) => {
    const counts = entry.tierCounts;
    if (!counts) return false;
    return ['high', 'mid', 'low'].filter((key) => Math.abs(counts[key as keyof CollectableTierCounts]) > tierCountVisibilityEpsilon).length > 1;
  });

  if (hasMixedTierOutcome) return ['high', 'mid', 'low'] as const;

  const visibleKeys = (['high', 'mid', 'low'] as const).filter((key) => (
    entries.some((entry) => Math.abs(entry.tierCounts?.[key] ?? 0) > tierCountVisibilityEpsilon)
  ));

  return visibleKeys.length === 1 ? visibleKeys : (['high', 'mid', 'low'] as const);
}

function distributionTierColumnLabels() {
  return distributionTierColumns().map((key) => t(`collectableObjective.tiers.${key}`)).join(' / ');
}

function formatDistributionTierCount(entry: { tierCounts?: CollectableTierCounts }, key: 'high' | 'mid' | 'low') {
  return formatTierCountValue(entry.tierCounts?.[key] ?? 0);
}

function outcomeDistributionKey(entry: { score: number; tierCounts?: CollectableTierCounts }) {
  const counts = entry.tierCounts;
  return counts
    ? `${entry.score}-${counts.high}-${counts.mid}-${counts.low}`
    : `${entry.score}`;
}

function distributionClass() {
  const columns = distributionTierColumns();
  return {
    'is-score': !isTierCountObjective(collectableObjective.value),
    'is-tier-single': isTierCountObjective(collectableObjective.value) && columns.length === 1,
    'is-tier-vector': isTierCountObjective(collectableObjective.value) && columns.length > 1
  };
}

function addRule() {
  if (isCollectableLevelLocked.value) return;

  const id = makeId();
  editingRuleId.value = '';
  editingRuleDraft.value = {
    id,
    name: t('collectableStrategyLab.defaultRuleName', { index: rules.value.length + 1 }),
    mode: 'all',
    enabled: true,
    conditions: [createCondition('collectability')],
    actions: ['collect']
  };
  resetRuleEditorView();
}

function loadSimpleExampleRules() {
  if (isCollectableLevelLocked.value) return;

  const highTierCollectability = rewardTable.value?.tiers.high?.collectability ?? rewardTable.value?.tiers.mid.collectability ?? 1000;
  rules.value = createSimpleCollectableStrategyRules({
    highTierCollectability,
    improveName: t('collectableStrategyLab.simpleExample.improveName'),
    collectName: t('collectableStrategyLab.simpleExample.collectName')
  });
  editingRuleId.value = '';
  analysis.value = null;
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
  const rule = rules.value.find((entry) => entry.id === ruleId);
  editingRuleDraft.value = rule ? clonePlain(rule) : null;
  resetRuleEditorView();
}

function closeRuleEditor() {
  editingRuleId.value = '';
  editingRuleDraft.value = null;
  resetRuleEditorView();
}

function closeRuleEditorFromBackdrop() {
  if (ruleEditorView.value !== 'main') return;
  closeRuleEditor();
}

function saveRuleEditor() {
  if (!editingRuleDraft.value) return;

  sanitizeRule(editingRuleDraft.value);
  const draft = clonePlain(editingRuleDraft.value);
  const index = rules.value.findIndex((rule) => rule.id === editingRuleId.value);

  if (index < 0) {
    rules.value = [...rules.value, draft];
  } else {
    const nextRules = [...rules.value];
    nextRules[index] = draft;
    rules.value = nextRules;
  }

  closeRuleEditor();
}

function resetRuleEditorView() {
  ruleEditorView.value = 'main';
  managedNodesView.value = 'summary';
  managedNodeIndex.value = 0;
}

function goRuleEditorView(view: RuleEditorView) {
  ruleEditorView.value = view;
  if (view === 'managedNodes') managedNodeIndex.value = 0;
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
  clampConditionValue(condition);
}

function conditionValueLimit(field: CollectableStrategyField) {
  return isNumericStrategyField(field)
    ? strategyConditionValueLimits[field]
    : COLLECTABLE_INPUT_LIMITS.collectability;
}

function clampConditionValue(condition: CollectableStrategyCondition) {
  if (!isNumericStrategyField(condition.field)) return;

  const limit = conditionValueLimit(condition.field);
  condition.value = clampIntegerInput(condition.value, limit.min, limit.max, limit.min);
}

function sanitizeRuleConditions() {
  for (const rule of rules.value) {
    sanitizeRule(rule);
  }
  if (editingRuleDraft.value) sanitizeRule(editingRuleDraft.value);
}

function sanitizeRule(rule: CollectableStrategyRule) {
  for (const condition of rule.conditions) clampConditionValue(condition);
}

function addAction(rule: CollectableStrategyRule) {
  rule.actions.push('collect');
}

function removeAction(rule: CollectableStrategyRule, index: number) {
  if (rule.actions.length <= 1) return;
  rule.actions.splice(index, 1);
}

function setAction(rule: CollectableStrategyRule, actionIndex: number, action: CollectableActionKind) {
  if (isActionLevelLocked(action)) return;
  rule.actions[actionIndex] = action;
}

function actionName(action: CollectableActionKind) {
  return getCollectableActionName(action, jobType.value);
}

function actionIcon(action: CollectableActionKind) {
  return getCollectableActionIcon(action, jobType.value);
}

function isActionLevelLocked(action: CollectableActionKind) {
  return props.effectiveStats.level < getCollectableActionMinLevel(action);
}

function hasRuleLevelIssue(rule: CollectableStrategyRule) {
  return rule.enabled && rule.actions.some(isActionLevelLocked);
}

function actionLevelRequirement(action: CollectableActionKind) {
  return t('collectableStrategyLab.actionLevelRequirement', {
    level: getCollectableActionMinLevel(action)
  });
}

function fieldLabel(field: CollectableStrategyField) {
  return t(`collectableStrategyLab.fields.${field}`);
}

function fieldDescription(field: CollectableStrategyField) {
  return t(`collectableStrategyLab.fieldDescriptions.${field}`);
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

function formatProbability(chance: number, useSpacePadding = false, includePercent = true) {
  const percentSuffix = includePercent ? '%' : '';
  if (chance > 0 && chance < 0.01) {
    return useSpacePadding ? `< 0.01${percentSuffix}` : `<0.01${percentSuffix}`;
  }
  const formatted = chance.toFixed(2);
  if (useSpacePadding) {
    return formatted.padStart(6, ' ') + percentSuffix;
  }
  return formatted + percentSuffix;
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

function buildUncoveredStateGroups(nodes: CollectableStrategyNode[]) {
  const total = nodes.length;
  const metrics: Array<{ key: CollectableStrategyNumericField; label: string }> = [
    { key: 'gp', label: t('collectableStrategyLab.pendingOverview.gp') },
    { key: 'integrity', label: t('collectableStrategyLab.pendingOverview.integrity') },
    { key: 'collectability', label: t('collectableStrategyLab.pendingOverview.collectability') }
  ];

  return metrics.map((metric) => {
    const counts = new Map<number, number>();
    nodes.forEach((node) => {
      const value = node.state[metric.key];
      counts.set(value, (counts.get(value) ?? 0) + 1);
    });

    const entries = [...counts.entries()]
      .map(([value, count]) => ({
        value,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);

    return {
      ...metric,
      entries
    };
  });
}

function buildManagedNodeOverview(nodes: CollectableStrategyNode[]) {
  const metrics: Array<{ key: ManagedOverviewMetricKey; label: string; icon: string }> = [
    { key: 'gp', label: t('collectableStrategyLab.pendingOverview.gp'), icon: 'pi pi-bolt' },
    { key: 'integrity', label: t('collectableStrategyLab.pendingOverview.integrity'), icon: 'pi pi-shield' },
    { key: 'collectability', label: t('collectableStrategyLab.pendingOverview.collectability'), icon: 'pi pi-sparkles' }
  ];

  return {
    ranges: metrics.map((metric) => {
      const values = nodes.map((node) => node.state[metric.key]);
      const min = values.length > 0 ? Math.min(...values) : 0;
      const max = values.length > 0 ? Math.max(...values) : 0;

      return {
        ...metric,
        value: formatStateRange(min, max)
      };
    }),
    buffChips: buildManagedBuffChips(nodes)
  };
}

function buildManagedBuffChips(nodes: CollectableStrategyNode[]) {
  if (nodes.length === 0) return [];

  const buffStates: Array<{ key: string; label: string; hasBuff: (node: CollectableStrategyNode) => boolean }> = [
    { key: 'scrutinyActive', label: fieldLabel('scrutinyActive'), hasBuff: (node) => node.state.scrutinyActive },
    { key: 'collectorsFocusActive', label: fieldLabel('collectorsFocusActive'), hasBuff: (node) => node.state.collectorsFocusActive },
    { key: 'primingTouchActive', label: fieldLabel('primingTouchActive'), hasBuff: (node) => node.state.primingTouchActive },
    { key: 'standardActive', label: fieldLabel('standardActive'), hasBuff: (node) => node.state.standardActive },
    { key: 'wiseToTheWorldActive', label: fieldLabel('wiseToTheWorldActive'), hasBuff: (node) => node.state.wiseToTheWorldActive },
    { key: 'successIActive', label: fieldLabel('successIActive'), hasBuff: (node) => node.state.successIActive },
    { key: 'successIIActive', label: fieldLabel('successIIActive'), hasBuff: (node) => node.state.successIIActive },
    { key: 'successIIIActive', label: fieldLabel('successIIIActive'), hasBuff: (node) => node.state.successIIIActive },
    { key: 'successBonus', label: fieldLabel('successBonus'), hasBuff: (node) => node.state.successBonus > 0 },
    { key: 'nextCollectSuccessBonus', label: fieldLabel('nextCollectSuccessBonus'), hasBuff: (node) => node.state.nextCollectSuccessBonus > 0 }
  ];

  const chips = buffStates.flatMap((buff) => {
    const count = nodes.filter(buff.hasBuff).length;
    if (count === 0) return [];

    return [{
      key: buff.key,
      label: t(
        count === nodes.length
          ? 'collectableStrategyLab.managedOverview.allHasBuff'
          : 'collectableStrategyLab.managedOverview.someHasBuff',
        { buff: buff.label }
      )
    }];
  });

  if (chips.length > 0) return chips;

  return [{
    key: 'noBuff',
    label: t('collectableStrategyLab.noBuff')
  }];
}

function formatStateRange(min: number, max: number) {
  return min === max ? `${min}` : `${min}~${max}`;
}

function moveManagedNode(direction: -1 | 1) {
  if (!managedNodes.value.length) return;
  managedNodeIndex.value = Math.max(0, Math.min(managedNodes.value.length - 1, managedNodeIndex.value + direction));
}

function formatNodeState(node: CollectableStrategyNode) {
  return t('collectableStrategyLab.nodeState', {
    gp: node.state.gp,
    integrity: node.state.integrity,
    collectability: node.state.collectability
  });
}

function formatCompactPathStep(payload: {
  ruleName?: string;
  actionLabel: string;
  branchLabel: string;
  branchLabelKeys: string[];
}) {
  const visibleBranchKeys = payload.branchLabelKeys.filter((key) => !compactPathHiddenBranchKeys.has(key));
  const branchLabel = visibleBranchKeys.length > 0
    ? visibleBranchKeys.map((key) => t(key)).join(t('collectableStrategyLab.branchJoiner'))
    : '';

  if (!branchLabel) return payload.ruleName ? `${payload.ruleName} -> ${payload.actionLabel}` : payload.actionLabel;
  return payload.ruleName
    ? t('collectableStrategyLab.pathStepWithRule', { rule: payload.ruleName, action: payload.actionLabel, branch: branchLabel })
    : t('collectableStrategyLab.pathStep', { action: payload.actionLabel, branch: branchLabel });
}

function stateChips(node: CollectableStrategyNode) {
  const chips: string[] = [];
  if (node.state.scrutinyActive) chips.push(t('collectableStrategyLab.chips.scrutinyActive'));
  if (node.state.collectorsFocusActive) chips.push(t('collectableStrategyLab.chips.collectorsFocusActive'));
  if (node.state.primingTouchActive) chips.push(t('collectableStrategyLab.chips.primingTouchActive'));
  if (node.state.standardActive) chips.push(t('collectableStrategyLab.chips.standardActive'));
  if (node.state.wiseToTheWorldActive) chips.push(t('collectableStrategyLab.chips.wiseToTheWorldActive'));
  if (node.state.successBonus > 0) chips.push(t('collectableStrategyLab.chips.successBonus', { value: node.state.successBonus }));
  if (node.state.nextCollectSuccessBonus > 0) chips.push(t('collectableStrategyLab.chips.nextCollectSuccessBonus', { value: node.state.nextCollectSuccessBonus }));
  if (node.state.hasCollected) chips.push(t('collectableStrategyLab.chips.hasCollected'));
  return chips;
}

function managedNodeMeters(node: CollectableStrategyNode) {
  const meters: Array<{ key: ManagedNodeMeterKey; label: string; value: number; max: number; icon: string }> = [
    { key: 'gp', label: t('collectableStrategyLab.pendingOverview.gp'), value: node.state.gp, max: activeGpMax.value, icon: 'pi pi-bolt' },
    { key: 'integrity', label: t('collectableStrategyLab.pendingOverview.integrity'), value: node.state.integrity, max: activeIntegrityMax.value, icon: 'pi pi-shield' },
    { key: 'collectability', label: t('collectableStrategyLab.pendingOverview.collectability'), value: node.state.collectability, max: 1000, icon: 'pi pi-sparkles' }
  ];

  return meters.map((meter) => ({
    ...meter,
    percent: progressPercent(meter.value, meter.max)
  }));
}

function progressPercent(value: number, max: number) {
  if (max <= 0) return '0%';
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return `${percent}%`;
}

function pathStepIcon(index: number) {
  if (index === 0) return 'pi pi-play';
  return 'pi pi-arrow-right';
}

function formatDistributionPercent(percent: number) {
  if (percent > 0 && percent < 0.01) return '<0.01%';
  const formatted = Number.isInteger(percent)
    ? percent.toFixed(0)
    : percent.toFixed(2).replace(/\.?0+$/, '');
  return `${formatted}%`;
}

function distributionBarWidth(percent: number) {
  if (percent <= 0) return '0%';
  return `${Math.max(4, Math.min(100, percent))}%`;
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
          <Button
            icon="pi pi-plus"
            :label="t('collectableStrategyLab.addStrategy')"
            class="p-button-sm rounded-xl"
            :disabled="isCollectableLevelLocked"
            @click="addRule"
          />
        </div>

        <div v-if="rules.length === 0" class="strategy-empty" :class="{ 'is-locked': isCollectableLevelLocked }" :role="isCollectableLevelLocked ? 'alert' : undefined">
          <i :class="isCollectableLevelLocked ? 'pi pi-lock' : 'pi pi-sitemap'"></i>
          <strong>{{ isCollectableLevelLocked ? t('collectableStrategyLab.collectableLevelLockedTitle') : t('collectableStrategyLab.emptyStrategyTitle') }}</strong>
          <p>
            {{ isCollectableLevelLocked
              ? t('collectableStrategyLab.collectableLevelLockedDesc', { level: MIN_COLLECTABLE_LEVEL })
              : t('collectableStrategyLab.emptyStrategyDesc') }}
          </p>
          <Button
            v-if="!isCollectableLevelLocked"
            icon="pi pi-bolt"
            :label="t('collectableStrategyLab.loadSimpleExample')"
            class="p-button-sm p-button-primary rounded-xl strategy-empty-action"
            @click="loadSimpleExampleRules"
          />
        </div>

        <div v-if="rules.length > 0" class="strategy-list" :aria-label="t('collectableStrategyLab.strategyListAria')">
          <article
            v-for="(rule, ruleIndex) in rules"
            :key="rule.id"
            class="rule-card"
            :class="{ 'is-disabled': !rule.enabled, 'is-level-invalid': hasRuleLevelIssue(rule) }"
          >
            <header class="rule-card-header">
              <label class="rule-enabled">
                <input v-model="rule.enabled" type="checkbox" />
                <span>#{{ ruleIndex + 1 }}</span>
              </label>
              <strong class="rule-name-display">{{ rule.name }}</strong>
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
            <p v-if="hasRuleLevelIssue(rule)" class="rule-level-warning">
              {{ t('collectableStrategyLab.ruleLevelIssue', { level: effectiveStats.level }) }}
            </p>
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

        <div v-if="isCollectableLevelLocked" class="tree-empty">
          <i class="pi pi-lock"></i>
          <p>{{ t('collectableStrategyLab.collectableLevelLockedDesc', { level: MIN_COLLECTABLE_LEVEL }) }}</p>
        </div>

        <div v-else-if="!canBuildTree" class="tree-empty">
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

            <div v-else class="pending-overview" :aria-label="t('collectableStrategyLab.uncoveredTitle')">
              <article v-for="group in uncoveredStateGroups" :key="group.key" class="pending-overview-group">
                <div class="pending-overview-group-header">
                  <strong>{{ group.label }}</strong>
                  <small>{{ t('collectableStrategyLab.pendingOverview.uniqueValues', { count: group.entries.length }) }}</small>
                </div>

                <div class="pending-overview-values">
                  <div v-for="entry in group.entries" :key="`${group.key}-${entry.value}`" class="pending-overview-value">
                    <div class="pending-overview-value-main">
                      <span>{{ entry.value }}</span>
                      <strong>{{ formatDistributionPercent(entry.percentage) }}</strong>
                    </div>
                    <div class="pending-overview-bar" aria-hidden="true">
                      <span :style="{ width: distributionBarWidth(entry.percentage) }"></span>
                    </div>
                    <small>{{ t('collectableStrategyLab.pendingOverview.nodeCount', { count: entry.count }) }}</small>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </template>
      </aside>
    </section>

    <section class="collectable-analysis-panel">
      <div class="analysis-header">
        <div>
          <div class="analysis-title">
            <i class="pi pi-chart-bar"></i>
            <h2>{{ t('collectableStrategyLab.analysis.title') }}</h2>
          </div>
          <p>{{ t('collectableStrategyLab.analysis.subtitle') }}</p>
          <div class="analysis-scope-note" role="note">
            <i class="pi pi-info-circle"></i>
            <span>{{ t('collectableStrategyLab.analysis.noRevisitNotice') }}</span>
          </div>
          <div v-if="firstStrategyLevelIssue" class="strategy-level-alert" role="alert">
            <i class="pi pi-exclamation-triangle"></i>
            <div>
              <strong>{{ t('collectableStrategyLab.strategyLevelIssueTitle') }}</strong>
              <span>
                {{ t('collectableStrategyLab.strategyLevelIssueDesc', {
                  action: firstStrategyLevelIssue.actionName,
                  level: firstStrategyLevelIssue.minLevel
                }) }}
              </span>
            </div>
          </div>
        </div>
        <div class="analysis-action-group">
          <button
            type="button"
            class="analysis-run-button p-button p-button-outlined rounded-xl objective-run-button"
            :aria-label="t('collectableObjective.title')"
            :title="selectedObjectiveLabel"
            :disabled="!rewardTable"
            @click="isObjectiveDialogOpen = true"
          >
            <i class="pi pi-cog" aria-hidden="true"></i>
          </button>
          <Button
            class="analysis-run-button p-button-primary rounded-xl"
            :aria-label="t('collectableStrategyLab.analysis.run')"
            :disabled="isCollectableLevelLocked || !treeResult?.root || !rewardTable || rewardError || hasStrategyLevelIssue"
            @click="runAnalysis"
          >
            <i class="pi pi-play"></i>
            <span>{{ t('collectableStrategyLab.analysis.run') }}</span>
          </Button>
        </div>
      </div>

      <div v-if="isCollectableLevelLocked" class="analysis-empty" role="alert">
        <i class="pi pi-lock"></i>
        <p>{{ t('collectableStrategyLab.collectableLevelLockedDesc', { level: MIN_COLLECTABLE_LEVEL }) }}</p>
      </div>

      <div v-else-if="rewardError" class="analysis-empty" role="alert">
        <i class="pi pi-exclamation-circle"></i>
        <p>{{ t('collectableStrategyLab.analysis.unsupportedReward') }}</p>
      </div>

      <div v-else-if="!analysis" class="analysis-empty">
        <i class="pi pi-chart-line"></i>
        <p>{{ t('collectableStrategyLab.analysis.empty') }}</p>
      </div>

      <article v-else class="analysis-card total">
        <h3>{{ t('collectableStrategyLab.analysis.summary') }}</h3>
        <div class="metric-grid">
          <div>
            <span>{{ isTierCountObjective(collectableObjective) ? t('collectableSolver.results.expectedTierCounts') : t('collectableStrategyLab.analysis.expectedScore', { unit: scoreUnitLabel() }) }}</span>
            <div v-if="isTierCountObjective(collectableObjective) && visibleTierMetricEntries(analysis.expectedTierCounts).length > 1" class="tier-count-list">
              <div v-for="entry in visibleTierMetricEntries(analysis.expectedTierCounts)" :key="entry.key" class="tier-count-entry">
                <strong>{{ formatTierCountValue(entry.value) }}</strong>
                <small>{{ entry.label }}</small>
              </div>
            </div>
            <strong v-else-if="isTierCountObjective(collectableObjective)">{{ formatSingleTierCount(analysis.expectedTierCounts) }}</strong>
            <strong v-else>{{ analysis.expectedScore }}</strong>
          </div>
          <div>
            <span>{{ isTierCountObjective(collectableObjective) ? t('collectableSolver.results.maxTierCounts') : t('collectableStrategyLab.analysis.maxScore', { unit: scoreUnitLabel() }) }}</span>
            <div v-if="isTierCountObjective(collectableObjective) && visibleTierMetricEntries(analysis.maxScoreTierCounts).length > 1" class="tier-count-list">
              <div v-for="entry in visibleTierMetricEntries(analysis.maxScoreTierCounts)" :key="entry.key" class="tier-count-entry">
                <strong>{{ formatTierCountValue(entry.value) }}</strong>
                <small>{{ entry.label }}</small>
              </div>
            </div>
            <strong v-else-if="isTierCountObjective(collectableObjective)">{{ formatSingleTierCount(analysis.maxScoreTierCounts) }}</strong>
            <strong v-else>{{ analysis.maxScore }}</strong>
            <small>{{ t('simulator.analysis.chance', { chance: formatProbability(analysis.maxScoreChance, false, false) }) }}</small>
          </div>
          <div>
            <span>{{ isTierCountObjective(collectableObjective) ? t('collectableSolver.results.minTierCounts') : t('collectableStrategyLab.analysis.minScore', { unit: scoreUnitLabel() }) }}</span>
            <div v-if="isTierCountObjective(collectableObjective) && visibleTierMetricEntries(analysis.minScoreTierCounts).length > 1" class="tier-count-list">
              <div v-for="entry in visibleTierMetricEntries(analysis.minScoreTierCounts)" :key="entry.key" class="tier-count-entry">
                <strong>{{ formatTierCountValue(entry.value) }}</strong>
                <small>{{ entry.label }}</small>
              </div>
            </div>
            <strong v-else-if="isTierCountObjective(collectableObjective)">{{ formatSingleTierCount(analysis.minScoreTierCounts) }}</strong>
            <strong v-else>{{ analysis.minScore }}</strong>
            <small>{{ t('simulator.analysis.chance', { chance: formatProbability(analysis.minScoreChance, false, false) }) }}</small>
          </div>
        </div>
        <div class="distribution-header">
          <div>
            <h4>{{ distributionTitle() }}</h4>
            <p>{{ distributionUnitText() }}</p>
          </div>
          <span v-if="isTierCountObjective(collectableObjective)">{{ distributionTierColumnLabels() }}</span>
        </div>
        <div class="distribution" :class="distributionClass()" :aria-label="distributionTitle()">
          <div v-for="entry in analysis.outcomeDistribution" :key="outcomeDistributionKey(entry)" class="bar-row">
            <span
              v-if="isTierCountObjective(collectableObjective)"
              class="distribution-value tier-count-distribution-value"
              :class="{ 'is-vector': distributionTierColumns().length > 1 }"
            >
              <template v-if="distributionTierColumns().length === 1">
                <strong>{{ formatDistributionTierCount(entry, distributionTierColumns()[0]) }}</strong>
                <small>{{ t(`collectableObjective.tiers.${distributionTierColumns()[0]}`) }}</small>
              </template>
              <template v-else>
                <template v-for="(tierKey, index) in distributionTierColumns()" :key="tierKey">
                  <strong>{{ formatDistributionTierCount(entry, tierKey) }}</strong>
                  <small v-if="index < distributionTierColumns().length - 1">/</small>
                </template>
              </template>
            </span>
            <span v-else class="distribution-value">{{ entry.score }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: `${Math.max(2, Math.min(100, entry.probability))}%` }"></div>
            </div>
            <small class="probability-text">{{ formatProbability(entry.probability, true, true) }}</small>
          </div>
        </div>
        <p class="analysis-note">{{ t('collectableStrategyLab.analysis.scoringNote') }}</p>
      </article>

      <div v-if="analysis" class="collectable-analysis-actions">
        <Button
          class="w-full font-bold flex items-center justify-center gap-2 py-3 p-button-outlined rounded-xl transition-all"
          :class="{ '!bg-green-100/75 !text-green-700 !border-transparent dark:!bg-green-900/20 dark:!text-green-300': isReportCopied }"
          :aria-label="t('simulator.actions.copyReport')"
          :disabled="!analysis"
          @click="copyReport"
        >
          <i :class="isReportCopied ? 'pi pi-check' : 'pi pi-file-edit'"></i>
          <span>{{ isReportCopied ? t('simulator.actions.copied') : t('simulator.actions.copyReport') }}</span>
        </Button>
        <Button
          class="w-full font-bold flex items-center justify-center gap-2 py-3 p-button-outlined rounded-xl transition-all"
          :class="{ '!bg-green-100/75 !text-green-700 !border-transparent dark:!bg-green-900/20 dark:!text-green-300': isSaved }"
          :aria-label="t('simulator.actions.save')"
          :disabled="isSaved"
          @click="saveCurrentExperiment"
        >
          <i :class="isSaved ? 'pi pi-check' : 'pi pi-bookmark'"></i>
          <span>{{ isSaved ? t('simulator.actions.saved') : t('simulator.actions.save') }}</span>
        </Button>
      </div>
    </section>

    <SaveEntryDialog
      v-model="isSaveExperimentDialogOpen"
      :title="t('saveEntry.experiment.title')"
      :description="t('saveEntry.experiment.description')"
      :name-label="t('saveEntry.nameLabel')"
      :default-name="defaultExperimentName()"
      :confirm-label="t('saveEntry.experiment.confirm')"
      :cancel-label="t('saveEntry.cancel')"
      @confirm="confirmSaveExperiment"
    >
      <article v-if="analysis" class="collectable-save-preview-card">
        <div class="collectable-save-preview-item">
          <div class="collectable-save-preview-icon">
            <img v-if="activeItem.iconUrl" :src="activeItem.iconUrl" :alt="getItemName(activeItem.itemId)" />
            <i v-else class="pi pi-box"></i>
          </div>
          <div class="collectable-save-preview-info">
            <h4>{{ getItemName(activeItem.itemId) }}</h4>
            <div class="collectable-save-preview-badges">
              <span class="item-glv-badge">{{ t('createGuide.glv') }} {{ activeItem.glv ?? '-' }}</span>
              <span class="item-collectable-badge">
                <i class="pi pi-box"></i>
                {{ t('createGuide.collectableSystem') }}
              </span>
            </div>
          </div>
        </div>
        <div class="collectable-save-preview-metrics">
          <div>
            <span>{{ t('collectableStrategyLab.analysis.expectedScore', { unit: scoreUnitLabel() }) }}</span>
            <strong>{{ analysis.expectedScore }}</strong>
          </div>
          <div>
            <span>{{ t('collectableStrategyLab.analysis.maxScore', { unit: scoreUnitLabel() }) }}</span>
            <strong>{{ analysis.maxScore }}</strong>
            <small>{{ t('simulator.analysis.chance', { chance: formatProbability(analysis.maxScoreChance, false, false) }) }}</small>
          </div>
          <div>
            <span>{{ t('collectableStrategyLab.analysis.minScore', { unit: scoreUnitLabel() }) }}</span>
            <strong>{{ analysis.minScore }}</strong>
            <small>{{ t('simulator.analysis.chance', { chance: formatProbability(analysis.minScoreChance, false, false) }) }}</small>
          </div>
        </div>
        <div class="collectable-save-strategy-preview">
          <span>{{ t('experimentDatabase.rotations.strategyPreview') }}</span>
          <div class="collectable-save-rule-list">
            <div v-for="rule in rules.filter((entry) => entry.enabled).slice(0, 3)" :key="rule.id" class="collectable-save-rule">
              <strong>{{ rule.name }}</strong>
              <div class="collectable-save-icons">
                <template v-for="(action, index) in previewRuleActionIcons(rule)" :key="`${rule.id}-${action}-${index}`">
                  <span class="collectable-save-action-icon">
                    <img v-if="actionIcon(action)" :src="actionIcon(action)" :alt="actionName(action)" />
                    <i v-else class="pi pi-sparkles"></i>
                  </span>
                  <i v-if="index < previewRuleActionIcons(rule).length - 1" class="pi pi-angle-right collectable-save-arrow"></i>
                </template>
              </div>
            </div>
          </div>
        </div>
      </article>
    </SaveEntryDialog>

    <CollectableObjectivePreferenceDialog
      v-model="isObjectiveDialogOpen"
      :reward-table="rewardTable"
      :objective="collectableObjective"
      context="analysis"
      @change="handleObjectiveChange"
    />

    <Teleport to="body">
      <div v-if="editingRule" class="rule-editor-overlay" role="presentation" @click.self="closeRuleEditorFromBackdrop">
        <section class="rule-editor-dialog" role="dialog" aria-modal="true" aria-labelledby="collectable-rule-editor-title">
          <header class="rule-editor-dialog-header">
            <div>
              <h2 id="collectable-rule-editor-title">{{ t('collectableStrategyLab.editor.kicker') }}</h2>
            </div>
            <button v-if="ruleEditorView === 'main'" type="button" class="dialog-close-button" :aria-label="t('collectableStrategyLab.editor.close')" @click="closeRuleEditor">
              <i class="pi pi-times"></i>
            </button>
          </header>

          <div class="rule-editor-body" :class="{ 'managed-nodes-body': ruleEditorView === 'managedNodes' }">
            <template v-if="ruleEditorView === 'main'">
              <section class="editor-section">
                <div class="editor-section-title">
                  <i class="pi pi-id-card"></i>
                  <span>{{ t('collectableStrategyLab.editor.name') }}</span>
                </div>
                <label class="dialog-name-field">
                  <input v-model="editingRule.name" type="text" />
                </label>
              </section>

              <section class="editor-section">
                <div class="editor-section-title">
                  <i class="pi pi-filter"></i>
                  <span>{{ t('collectableStrategyLab.editor.conditionSection') }}</span>
                </div>
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
                      <input
                        v-model.number="condition.value"
                        type="number"
                        :min="conditionValueLimit(condition.field).min"
                        :max="conditionValueLimit(condition.field).max"
                        @change="clampConditionValue(condition)"
                        @blur="clampConditionValue(condition)"
                      />
                    </template>

                    <template v-else>
                      <select v-model="condition.value">
                        <option :value="true">{{ t('collectableStrategyLab.booleanValues.true') }}</option>
                        <option :value="false">{{ t('collectableStrategyLab.booleanValues.false') }}</option>
                      </select>
                    </template>

                    <button type="button" class="condition-remove-button" :title="t('collectableStrategyLab.editor.removeCondition')" @click="removeCondition(editingRule, condition.id)">
                      <i class="pi pi-minus condition-remove-icon-desktop"></i>
                      <i class="pi pi-trash condition-remove-icon-mobile"></i>
                    </button>

                    <p class="condition-help">
                      {{ fieldDescription(condition.field) }}
                    </p>
                  </div>
                  <button type="button" class="text-tool" @click="addCondition(editingRule)">
                    <i class="pi pi-plus"></i>
                    {{ t('collectableStrategyLab.editor.addCondition') }}
                  </button>
                </div>
              </section>

              <button type="button" class="managed-nodes-entry" @click="goRuleEditorView('managedNodes')">
                <i class="pi pi-sitemap"></i>
                <span>{{ t('collectableStrategyLab.editor.viewManagedNodes') }}</span>
                <strong>{{ editorCoverageText }}</strong>
              </button>

              <button type="button" class="managed-nodes-entry skill-entry" @click="goRuleEditorView('actions')">
                <i class="pi pi-sparkles"></i>
                <span>{{ t('collectableStrategyLab.editor.skillSection') }}</span>
                <div class="skill-icon-strip" :aria-label="t('collectableStrategyLab.editor.actionPreview')">
                  <template v-for="(action, index) in ruleActionPreview" :key="`${editingRule.id}-preview-${action}-${index}`">
                    <span class="skill-preview-icon" :title="actionName(action)">
                      <img v-if="actionIcon(action)" :src="actionIcon(action)" :alt="actionName(action)" />
                      <i v-else class="pi pi-sparkles"></i>
                    </span>
                    <i v-if="index < ruleActionPreview.length - 1" class="pi pi-angle-right skill-preview-arrow"></i>
                  </template>
                </div>
              </button>
            </template>

            <template v-else-if="ruleEditorView === 'managedNodes'">
              <div class="managed-node-toolbar">
                <div class="editor-segmented-control">
                  <button type="button" :class="{ active: managedNodesView === 'summary' }" @click="managedNodesView = 'summary'">
                    {{ t('collectableStrategyLab.editor.summaryMode') }}
                  </button>
                  <button type="button" :class="{ active: managedNodesView === 'individual' }" @click="managedNodesView = 'individual'">
                    {{ t('collectableStrategyLab.editor.individualMode') }}
                  </button>
                </div>
              </div>
              <p class="managed-node-notice">
                <i class="pi pi-info-circle"></i>
                <span>{{ t('collectableStrategyLab.editor.managedNodesNotice') }}</span>
              </p>

              <div v-if="managedNodes.length === 0" class="tree-empty compact">
                <i class="pi pi-search"></i>
                <p>{{ t('collectableStrategyLab.editor.noManagedNodes') }}</p>
              </div>

              <div v-else-if="managedNodesView === 'summary'" class="managed-summary-overview" :aria-label="t('collectableStrategyLab.editor.summaryMode')">
                <article class="managed-summary-card">
                  <div class="managed-summary-header">
                    <strong>{{ t('collectableStrategyLab.managedOverview.rangesTitle') }}</strong>
                    <small>{{ editorCoverageText }}</small>
                  </div>

                  <div class="managed-range-grid">
                    <div v-for="range in managedNodeOverview.ranges" :key="`managed-range-${range.key}`" class="managed-range-card">
                      <span><i :class="range.icon"></i>{{ range.label }}</span>
                      <strong>{{ range.value }}</strong>
                    </div>
                  </div>

                  <div class="managed-buff-overview" :aria-label="t('collectableStrategyLab.managedOverview.buffTitle')">
                    <span v-for="chip in managedNodeOverview.buffChips" :key="chip.key">{{ chip.label }}</span>
                  </div>
                </article>
              </div>

              <div v-else-if="currentManagedNode" class="uncovered-layout">
                <div class="node-pager">
                  <button type="button" :disabled="managedNodeIndex === 0" :aria-label="t('collectableStrategyLab.previousUncovered')" @click="moveManagedNode(-1)">
                    <i class="pi pi-chevron-left"></i>
                  </button>
                  <span>{{ t('collectableStrategyLab.nodePager', { current: managedNodeIndex + 1, total: managedNodes.length }) }}</span>
                  <button type="button" :disabled="managedNodeIndex >= managedNodes.length - 1" :aria-label="t('collectableStrategyLab.nextUncovered')" @click="moveManagedNode(1)">
                    <i class="pi pi-chevron-right"></i>
                  </button>
                </div>

                <article class="uncovered-detail">
                  <div class="managed-meter-list" :aria-label="formatNodeState(currentManagedNode)">
                    <div
                      v-for="meter in managedNodeMeters(currentManagedNode)"
                      :key="meter.key"
                      class="managed-meter"
                      :class="meter.key"
                    >
                      <div class="managed-meter-header">
                        <span><i :class="meter.icon"></i>{{ meter.label }}</span>
                        <strong>{{ meter.value }} / {{ meter.max }}</strong>
                      </div>
                      <div class="managed-meter-track" aria-hidden="true">
                        <span :style="{ width: meter.percent }"></span>
                      </div>
                    </div>
                  </div>
                  <div class="state-chip-list">
                    <span v-for="chip in stateChips(currentManagedNode)" :key="chip">{{ chip }}</span>
                    <span v-if="stateChips(currentManagedNode).length === 0">{{ t('collectableStrategyLab.noBuff') }}</span>
                  </div>
                  <div class="path-box">
                    <strong><i class="pi pi-sitemap"></i>{{ t('collectableStrategyLab.pathTitle') }}</strong>
                    <ol v-if="currentManagedNode.path.length" class="path-timeline">
                      <li v-for="(step, index) in currentManagedNode.path" :key="`${index}-${step}`">
                        <i :class="pathStepIcon(index)"></i>
                        <span>{{ step }}</span>
                      </li>
                    </ol>
                    <p v-else>{{ t('collectableStrategyLab.noPath') }}</p>
                  </div>
                </article>
              </div>
            </template>

            <template v-else>
              <section class="editor-section">
                <div class="editor-section-title">
                  <i class="pi pi-sparkles"></i>
                  <span>{{ editingRule.actions.length > 1 ? t('collectableStrategyLab.editor.actionChain') : t('collectableStrategyLab.editor.singleAction') }}</span>
                </div>
                <div class="action-list compact">
                  <div
                    v-for="(action, actionIndex) in editingRule.actions"
                    :key="`${editingRule.id}-${actionIndex}`"
                    class="action-select-row"
                    :class="{ 'is-level-invalid': isActionLevelLocked(action) }"
                  >
                    <span class="skill-preview-icon">
                      <img v-if="actionIcon(action)" :src="actionIcon(action)" :alt="actionName(action)" />
                      <i v-else class="pi pi-sparkles"></i>
                    </span>
                    <select
                      :value="action"
                      @change="setAction(editingRule, actionIndex, ($event.target as HTMLSelectElement).value as CollectableActionKind)"
                    >
                      <option
                        v-for="option in collectableStrategyActionKinds"
                        :key="option"
                        :value="option"
                        :disabled="isActionLevelLocked(option)"
                      >
                        {{ actionName(option) }}{{ isActionLevelLocked(option) ? ` (${actionLevelRequirement(option)})` : '' }}
                      </option>
                    </select>
                    <button type="button" :disabled="editingRule.actions.length <= 1" :title="t('collectableStrategyLab.editor.removeAction')" @click="removeAction(editingRule, actionIndex)">
                      <i class="pi pi-times"></i>
                    </button>
                    <small v-if="isActionLevelLocked(action)">{{ actionLevelRequirement(action) }}</small>
                  </div>
                </div>
                <button type="button" class="text-tool" @click="addAction(editingRule)">
                  <i class="pi pi-plus"></i>
                  {{ t('collectableStrategyLab.editor.addAction') }}
                </button>
              </section>

              <section class="editor-section muted">
                <div class="editor-section-title">
                  <i class="pi pi-chart-line"></i>
                  <span>{{ t('collectableStrategyLab.editor.effectPreview') }}</span>
                </div>
                <p class="editor-placeholder">{{ t('collectableStrategyLab.editor.effectPreviewPlaceholder') }}</p>
                <div class="skill-icon-strip">
                  <template v-for="(action, index) in editingRule.actions" :key="`${editingRule.id}-effect-${action}-${index}`">
                    <span class="skill-preview-icon" :title="actionName(action)">
                      <img v-if="actionIcon(action)" :src="actionIcon(action)" :alt="actionName(action)" />
                      <i v-else class="pi pi-sparkles"></i>
                    </span>
                    <i v-if="index < editingRule.actions.length - 1" class="pi pi-angle-right skill-preview-arrow"></i>
                  </template>
                </div>
              </section>
            </template>
          </div>

          <footer class="rule-editor-dialog-footer">
            <div class="rule-editor-footer-actions">
              <Button v-if="ruleEditorView === 'main'" :label="t('collectableStrategyLab.editor.save')" icon="pi pi-check" class="p-button-sm rounded-xl" @click="saveRuleEditor" />
              <Button v-else :label="t('collectableStrategyLab.editor.backToMain')" icon="pi pi-arrow-left" class="rule-editor-back-button p-button-sm p-button-outlined rounded-xl" @click="goRuleEditorView('main')" />
            </div>
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

:global(html.dark .collectable-analysis-panel),
:global(html.dark .analysis-card) {
  border-color: #334155;
  background: #0f172a;
}

:global(html.dark .column-header h2),
:global(html.dark .uncovered-panel h3),
:global(html.dark .rule-editor-dialog-header h2),
:global(html.dark .analysis-title h2),
:global(html.dark .analysis-card h3),
:global(html.dark .path-box strong) {
  color: #f8fafc;
}

:global(html.dark .tree-empty p),
:global(html.dark .analysis-header p),
:global(html.dark .analysis-empty p),
:global(html.dark .analysis-note),
:global(html.dark .limit-warning),
:global(html.dark .path-box p) {
  color: #94a3b8;
}

.column-header span,
.rule-editor-dialog-header span,
.summary-grid span,
.metric-grid span,
.uncovered-detail > span {
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 900;
}

.collectable-analysis-panel {
  display: grid;
  gap: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  background: white;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgb(15 23 42 / 0.04);
}

.analysis-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.analysis-title {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.analysis-title i {
  color: #52a890;
}

.analysis-title h2,
.analysis-card h3 {
  margin: 0;
  color: #334155;
  font-size: 1.05rem;
  font-weight: 900;
}

.analysis-header p {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.5;
}

.analysis-scope-note {
  width: fit-content;
  max-width: 100%;
  display: inline-flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin-top: 0.6rem;
  border: 1px solid rgb(82 168 144 / 0.22);
  border-radius: 0.85rem;
  background: #f0fdf4;
  padding: 0.55rem 0.7rem;
  color: #166534;
  font-size: 0.78rem;
  font-weight: 850;
  line-height: 1.45;
}

.analysis-scope-note i {
  margin-top: 0.12rem;
  color: #52a890;
}

:global(html.dark .analysis-scope-note) {
  border-color: rgb(94 234 212 / 0.22);
  background: rgb(20 83 45 / 0.22);
  color: #bbf7d0;
}

.strategy-level-alert {
  width: fit-content;
  max-width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  margin-top: 0.6rem;
  border: 1px solid rgb(251 146 60 / 0.75);
  border-radius: 0.85rem;
  background: rgb(255 247 237 / 0.96);
  padding: 0.65rem 0.8rem;
  color: #9a3412;
  line-height: 1.45;
}

.strategy-level-alert i {
  margin-top: 0.12rem;
  color: #f97316;
}

.strategy-level-alert strong,
.strategy-level-alert span {
  display: block;
}

.strategy-level-alert strong {
  font-size: 0.86rem;
  font-weight: 900;
}

.strategy-level-alert span {
  margin-top: 0.1rem;
  font-size: 0.78rem;
  font-weight: 800;
}

:global(html.dark .strategy-level-alert) {
  border-color: rgb(194 65 12 / 0.55);
  background: rgb(154 52 18 / 0.16);
  color: #fed7aa;
}

.analysis-run-button {
  min-width: 11rem;
  min-height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  font-weight: 900;
}

.analysis-action-group {
  display: inline-grid;
  grid-template-columns: 3rem minmax(8rem, 11rem);
  align-items: stretch;
  gap: 0.65rem;
  flex: 0 0 auto;
}

.analysis-action-group .analysis-run-button {
  width: 100%;
}

.objective-run-button {
  width: 3rem;
  min-width: 3rem;
  height: 3rem;
  min-height: 3rem;
  padding: 0;
  line-height: 1;
}

.analysis-empty {
  display: grid;
  justify-items: center;
  gap: 0.55rem;
  border: 2px dashed #e2e8f0;
  border-radius: 1rem;
  padding: 2.5rem 1rem;
  text-align: center;
}

:global(html.dark .analysis-empty) {
  border-color: #334155;
}

.analysis-empty i {
  color: #94a3b8;
  font-size: 1.8rem;
}

.analysis-empty p {
  margin: 0;
  color: #64748b;
  font-weight: 800;
}

.analysis-card {
  display: grid;
  gap: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  background: #f8fafc;
  padding: 1.25rem;
}

.analysis-card.total {
  border-color: rgb(82 168 144 / 0.5);
  background: #f0fdf4;
}

:global(html.dark .analysis-card.total) {
  background: rgb(20 83 45 / 0.2);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.tier-count-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.35rem;
}

.tier-count-entry {
  display: inline-grid;
  grid-template-columns: auto;
  align-items: start;
  min-width: 4.4rem;
}

.tier-count-entry strong {
  color: #0f172a;
  font-size: 0.92rem;
  font-weight: 950;
  line-height: 1;
}

.tier-count-entry small {
  color: #64748b;
  font-size: 0.66rem;
  font-weight: 800;
}

:global(html.dark .tier-count-entry strong) {
  color: #f8fafc;
}

:global(html.dark .tier-count-entry small) {
  color: #94a3b8;
}

.metric-grid div {
  min-width: 0;
  border-radius: 0.85rem;
  background: #ffffff;
  padding: 0.8rem;
}

:global(html.dark .metric-grid div) {
  background: rgb(30 41 59 / 0.65);
}

.metric-grid strong {
  display: block;
  margin-top: 0.2rem;
  color: #0f172a;
  font-size: 1.25rem;
  font-weight: 950;
}

:global(html.dark .metric-grid strong) {
  color: #f8fafc;
}

.metric-grid small {
  display: block;
  margin-top: 0.15rem;
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 800;
}

.distribution {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr) 3.75rem;
  gap: 0.45rem;
  column-gap: 0.5rem;
  align-items: center;
}

.distribution.is-score {
  grid-template-columns: minmax(2ch, max-content) minmax(0, 1fr) 3.75rem;
}

.distribution.is-tier-vector {
  grid-template-columns: max-content minmax(0, 1fr) 3.75rem;
}

.distribution-header {
  display: flex;
  align-items: end;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-top: 0.15rem;
  color: #64748b;
}

.distribution-header h4 {
  margin: 0;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 900;
}

:global(html.dark .distribution-header h4) {
  color: #e2e8f0;
}

.distribution-header p {
  margin: 0.15rem 0 0;
  font-size: 0.72rem;
  font-weight: 800;
}

.distribution-header > span {
  flex-shrink: 0;
  color: #0f766e;
  font-size: 0.72rem;
  font-weight: 900;
  text-align: left;
}

:global(html.dark .distribution-header > span) {
  color: #7dd3fc;
}

.bar-row {
  display: contents;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
}

.distribution-value {
  font-variant-numeric: tabular-nums;
}

.tier-count-distribution-value {
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
  white-space: nowrap;
}

.tier-count-distribution-value strong {
  min-width: 2ch;
  color: #334155;
  font: inherit;
  text-align: right;
}

:global(html.dark .tier-count-distribution-value strong) {
  color: #e2e8f0;
}

.tier-count-distribution-value small {
  color: #94a3b8;
  font: inherit;
}

.tier-count-distribution-value.is-vector {
  display: grid;
  grid-template-columns: minmax(1.35rem, max-content) auto minmax(1.35rem, max-content) auto minmax(1.35rem, max-content);
  column-gap: 0.2rem;
  width: auto;
  justify-content: start;
}

.tier-count-distribution-value.is-vector strong {
  min-width: 1.35rem;
}

.bar-track {
  height: 0.6rem;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

:global(html.dark .bar-track) {
  background: #1e293b;
}

.bar-fill {
  height: 100%;
  border-radius: inherit;
  background: #52a890;
}

.probability-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  white-space: pre;
}

.analysis-note {
  margin: 0;
  color: #15803d;
  font-size: 0.82rem;
  font-weight: 800;
}

.collectable-analysis-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.collectable-save-preview-card {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  display: grid;
  gap: 0.75rem;
  padding: 0.85rem;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

:global(html.dark .collectable-save-preview-card) {
  border-color: #334155;
  background: #0f172a;
}

.collectable-save-preview-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.collectable-save-preview-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0.7rem;
  background: #f1f5f9;
  color: #94a3b8;
}

:global(html.dark .collectable-save-preview-icon) {
  background: #1e293b;
}

.collectable-save-preview-icon img,
.collectable-save-action-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.collectable-save-preview-info {
  min-width: 0;
}

.collectable-save-preview-info h4 {
  margin: 0;
  color: #1e293b;
  font-size: 0.98rem;
  font-weight: 900;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

:global(html.dark .collectable-save-preview-info h4) {
  color: #f8fafc;
}

.collectable-save-preview-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.4rem;
}

.item-glv-badge,
.item-collectable-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 3px 9px;
  border-radius: 999px;
  color: white;
  font-size: 0.72rem;
  font-weight: 900;
  line-height: 1.35;
  white-space: nowrap;
}

.item-glv-badge {
  background: linear-gradient(135deg, #52a890, #3d8b75);
}

.item-collectable-badge {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.collectable-save-preview-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 8.5rem), 1fr));
  gap: 0.45rem;
}

.collectable-save-preview-metrics div {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  display: grid;
  gap: 0.25rem;
  padding: 0.62rem 0.7rem;
  border-radius: 0.75rem;
  background: #f8fafc;
}

.collectable-save-strategy-preview {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  display: grid;
  gap: 0.5rem;
  padding: 0.65rem 0.7rem;
  border: 1px solid #f1f5f9;
  border-radius: 0.85rem;
  background: #f8fafc;
}

.collectable-save-rule {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.38rem 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.65rem;
  background: #ffffff;
}

:global(html.dark .collectable-save-preview-metrics div),
:global(html.dark .collectable-save-rule) {
  background: rgb(30 41 59 / 0.55);
}

:global(html.dark .collectable-save-strategy-preview) {
  border-color: #1e293b;
  background: rgb(15 23 42 / 0.6);
}

.collectable-save-preview-metrics span,
.collectable-save-strategy-preview > span {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
}

:global(html.dark .collectable-save-preview-metrics span),
:global(html.dark .collectable-save-strategy-preview > span) {
  color: #94a3b8;
}

.collectable-save-preview-metrics strong,
.collectable-save-rule strong {
  min-width: 0;
  max-width: 8rem;
  color: #334155;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collectable-save-preview-metrics small {
  display: block;
  margin-top: 0.15rem;
  color: #64748b;
  font-size: 0.66rem;
  font-weight: 800;
}

:global(html.dark .collectable-save-preview-metrics strong),
:global(html.dark .collectable-save-rule strong) {
  color: #e2e8f0;
}

.collectable-save-rule-list {
  min-width: 0;
  max-height: 8rem;
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.collectable-save-icons {
  flex: 0 0 auto;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
}

.collectable-save-action-icon {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 0.5rem;
  background: #52a890;
  color: white;
}

.collectable-save-arrow {
  color: #cbd5e1;
  font-size: 0.72rem;
}

:global(html.dark .collectable-save-arrow) {
  color: #64748b;
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
  margin: 0;
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

.rule-card.is-level-invalid {
  border-color: rgb(248 113 113 / 0.75);
  box-shadow: 0 0 0 3px rgb(248 113 113 / 0.12);
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

.strategy-empty.is-locked {
  height: auto;
  min-height: 10rem;
  align-content: center;
  border-color: #fed7aa;
  background: #fff7ed;
}

:global(html.dark .strategy-empty) {
  border-color: #334155;
  background: rgb(2 6 23 / 0.38);
}

:global(html.dark .strategy-empty.is-locked) {
  border-color: rgb(194 65 12 / 0.42);
  background: rgb(154 52 18 / 0.14);
}

.strategy-empty i {
  color: #52a890;
  font-size: 1.6rem;
}

.strategy-empty.is-locked i {
  color: #f97316;
}

:global(html.dark .strategy-empty.is-locked i) {
  color: #fdba74;
}

.strategy-empty strong {
  color: #334155;
  font-weight: 900;
}

:global(html.dark .strategy-empty.is-locked strong) {
  color: #fed7aa;
}

.strategy-empty p {
  max-width: 26rem;
  margin: 0;
  color: #64748b;
  font-size: 0.86rem;
  line-height: 1.5;
}

.strategy-empty.is-locked p {
  color: #9a3412;
}

.strategy-empty-action {
  margin-top: 0.35rem;
  min-height: 2.35rem;
  font-weight: 900;
}

:global(html.dark .strategy-empty strong) {
  color: #f8fafc;
}

:global(html.dark .strategy-empty p) {
  color: #94a3b8;
}

:global(html.dark .strategy-empty.is-locked p) {
  color: #fdba74;
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
.rule-mode-row select,
.action-select-row select {
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
:global(html.dark .rule-mode-row select),
:global(html.dark .action-select-row select) {
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

.condition-remove-button {
  align-self: center;
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #fecdd3;
  border-radius: 0.65rem;
  background: #fff1f2;
  color: #be123c;
}

.condition-remove-button:hover {
  border-color: #fda4af;
  background: #ffe4e6;
  color: #9f1239;
}

.condition-remove-icon-mobile {
  display: none;
}

:global(html.dark .condition-remove-button) {
  border-color: rgb(244 63 94 / 0.35);
  background: rgb(127 29 29 / 0.28);
  color: #fda4af;
}

:global(html.dark .condition-remove-button:hover) {
  border-color: rgb(251 113 133 / 0.55);
  background: rgb(127 29 29 / 0.42);
  color: #fecdd3;
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

.rule-level-warning {
  margin: -0.15rem 0 0;
  color: #dc2626;
  font-size: 0.78rem;
  font-weight: 850;
  line-height: 1.45;
}

:global(html.dark .rule-summary-row) {
  background: rgb(30 41 59 / 0.42);
  color: #94a3b8;
}

:global(html.dark .rule-summary-row strong) {
  color: #99f6e4;
}

:global(html.dark .rule-level-warning) {
  color: #fca5a5;
}

.rule-editor-body {
  display: grid;
  gap: 0.8rem;
  align-content: start;
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.rule-editor-body.managed-nodes-body {
  gap: 0.5rem;
}

.editor-segmented-control button,
.editor-secondary-action,
.managed-nodes-entry {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border: 1px solid #d1fae5;
  border-radius: 0.75rem;
  background: #f8fafc;
  color: #0f766e;
  padding: 0.55rem 0.7rem;
  font-size: 0.82rem;
  font-weight: 900;
  line-height: 1.25;
}

.editor-segmented-control button.active,
.editor-secondary-action:hover,
.managed-nodes-entry:hover {
  border-color: #52a890;
  background: #ecfdf5;
  color: #0f766e;
}

.editor-secondary-action span,
.managed-nodes-entry span,
.managed-nodes-entry strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(html.dark .editor-segmented-control button),
:global(html.dark .editor-secondary-action),
:global(html.dark .managed-nodes-entry) {
  border-color: #334155;
  background: rgb(2 6 23 / 0.5);
  color: #99f6e4;
}

:global(html.dark .editor-segmented-control button.active),
:global(html.dark .editor-secondary-action:hover),
:global(html.dark .managed-nodes-entry:hover) {
  border-color: #5eead4;
  background: rgb(20 83 45 / 0.24);
  color: #ccfbf1;
}

.editor-section {
  min-width: 0;
  display: grid;
  gap: 0.65rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.9rem;
  background: #f8fafc;
  padding: 0.85rem;
}

.editor-section.muted {
  background: #ffffff;
}

:global(html.dark .editor-section) {
  border-color: #334155;
  background: rgb(30 41 59 / 0.42);
}

:global(html.dark .editor-section.muted) {
  background: rgb(2 6 23 / 0.36);
}

.editor-section-title,
.managed-node-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
}

.editor-section-title {
  justify-content: flex-start;
  color: #334155;
  font-size: 0.86rem;
  font-weight: 950;
}

.editor-section-title i {
  color: #52a890;
}

:global(html.dark .editor-section-title) {
  color: #f8fafc;
}

.skill-icon-strip {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.skill-icon-strip {
  flex-wrap: wrap;
}

.skill-preview-icon {
  width: 2.35rem;
  height: 2.35rem;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0.65rem;
  background: #52a890;
  color: white;
}

.skill-preview-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.skill-preview-arrow {
  color: #94a3b8;
  font-size: 0.76rem;
}

.managed-nodes-entry {
  width: 100%;
  justify-content: flex-start;
  border-color: rgb(82 168 144 / 0.35);
  background: #f0fdf4;
}

.managed-nodes-entry.skill-entry {
  align-items: center;
}

.managed-nodes-entry.skill-entry > span {
  justify-self: start;
  text-align: left;
}

.managed-nodes-entry.skill-entry .skill-icon-strip {
  margin-left: auto;
  justify-content: flex-end;
  flex: 0 1 auto;
}

.managed-nodes-entry strong {
  margin-left: auto;
  color: #166534;
}

:global(html.dark .managed-nodes-entry strong) {
  color: #bbf7d0;
}

.managed-node-toolbar {
  flex-wrap: wrap;
  justify-content: flex-start;
}

.managed-node-toolbar > span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 900;
}

.managed-node-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  border: 1px solid rgb(82 168 144 / 0.22);
  border-radius: 0.75rem;
  background: rgb(240 253 244 / 0.76);
  color: #166534;
  margin: 0;
  padding: 0.48rem 0.62rem;
  font-size: 0.76rem;
  font-weight: 850;
  line-height: 1.45;
}

.managed-node-notice i {
  flex: 0 0 auto;
  margin-top: 0.12rem;
  color: #0f766e;
  font-size: 0.82rem;
}

.managed-node-notice span {
  min-width: 0;
}

.rule-editor-dialog-header h2 {
  font-size: 1.18rem;
  line-height: 1.25;
}

:global(html.dark .managed-node-toolbar > span) {
  color: #94a3b8;
}

:global(html.dark .managed-node-notice) {
  border-color: rgb(94 234 212 / 0.18);
  background: rgb(20 83 45 / 0.22);
  color: #bbf7d0;
}

:global(html.dark .managed-node-notice i) {
  color: #99f6e4;
}

.editor-segmented-control {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35rem;
}

.action-list.compact {
  gap: 0.55rem;
}

.action-select-row {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.55rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.85rem;
  background: white;
  padding: 0.55rem;
}

.action-select-row.is-level-invalid {
  border-color: rgb(248 113 113 / 0.7);
  background: #fff7ed;
}

.action-select-row > button {
  width: 2.15rem;
  height: 2.15rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #fecdd3;
  border-radius: 0.65rem;
  background: #fff1f2;
  color: #be123c;
}

.action-select-row > button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.action-select-row small {
  grid-column: 2 / -1;
  color: #dc2626;
  font-size: 0.72rem;
  font-weight: 850;
}

:global(html.dark .action-select-row) {
  border-color: #334155;
  background: rgb(2 6 23 / 0.38);
}

:global(html.dark .action-select-row.is-level-invalid) {
  border-color: rgb(248 113 113 / 0.45);
  background: rgb(127 29 29 / 0.16);
}

:global(html.dark .action-select-row > button) {
  border-color: rgb(244 63 94 / 0.35);
  background: rgb(127 29 29 / 0.28);
  color: #fda4af;
}

.editor-placeholder {
  margin: 0;
  color: #64748b;
  font-size: 0.84rem;
  font-weight: 800;
  line-height: 1.5;
}

:global(html.dark .editor-placeholder) {
  color: #94a3b8;
}

.condition-list,
.action-chain {
  display: grid;
  gap: 0.5rem;
}

.condition-row {
  display: grid;
  grid-template-columns: minmax(9rem, 1.2fr) minmax(4.5rem, 0.45fr) minmax(5rem, 0.55fr) auto;
  align-items: start;
  gap: 0.45rem;
}

.condition-row select:first-child {
  grid-column: auto;
}

.condition-row.is-boolean .condition-remove-button {
  grid-column: 4;
}

.condition-row.is-boolean .condition-help {
  grid-column: 1 / -1;
}

.condition-help {
  grid-column: 1 / -1;
  margin: -0.15rem 0 0;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1.45;
}

:global(html.dark .condition-help) {
  color: #94a3b8;
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

.action-chip.is-level-invalid {
  border-color: rgb(248 113 113 / 0.7);
  background: #fff7ed;
}

:global(html.dark .action-chip) {
  border-color: #334155;
  background: rgb(30 41 59 / 0.42);
}

:global(html.dark .action-chip.is-level-invalid) {
  border-color: rgb(248 113 113 / 0.45);
  background: rgb(127 29 29 / 0.16);
}

.selected-action {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.55rem;
}

.selected-action strong {
  min-width: 0;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 900;
}

.selected-action small {
  grid-column: 2;
  margin-top: -0.25rem;
  color: #dc2626;
  font-size: 0.72rem;
  font-weight: 850;
}

:global(html.dark .selected-action strong) {
  color: #f8fafc;
}

:global(html.dark .selected-action small) {
  color: #fca5a5;
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

.action-option:disabled {
  cursor: not-allowed;
  opacity: 0.46;
}

.action-option:disabled:hover {
  border-color: #e2e8f0;
  background: white;
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

:global(html.dark .action-option:disabled:hover) {
  border-color: #334155;
  background: rgb(2 6 23 / 0.5);
  color: #e2e8f0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.55rem;
  align-items: stretch;
}

.summary-grid div {
  min-width: 0;
  min-height: 5.15rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.55rem;
  border: 1px solid transparent;
  border-radius: 0.85rem;
  background: #f8fafc;
  padding: 0.7rem 0.75rem;
}

.summary-grid div.warning {
  border-color: rgb(82 168 144 / 0.32);
  background: #ecfdf5;
}

:global(html.dark .summary-grid div) {
  border-color: rgb(51 65 85 / 0.62);
  background: rgb(30 41 59 / 0.55);
}

:global(html.dark .summary-grid div.warning) {
  border-color: rgb(94 234 212 / 0.24);
  background: rgb(20 83 73 / 0.24);
}

.summary-grid strong {
  display: block;
  color: #0f172a;
  font-size: 1.45rem;
  font-weight: 950;
  line-height: 1;
}

:global(html.dark .summary-grid strong) {
  color: #f8fafc;
}

:global(html.dark .summary-grid div.warning span) {
  color: #99f6e4;
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

.pending-overview {
  display: grid;
  gap: 0.7rem;
}

.pending-overview-group {
  display: grid;
  gap: 0.55rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.9rem;
  background: #f8fafc;
  padding: 0.78rem 0.85rem;
}

:global(html.dark .pending-overview-group) {
  border-color: #334155;
  background: rgb(30 41 59 / 0.38);
}

.pending-overview-group-header,
.pending-overview-value-main {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.pending-overview-group-header strong {
  color: #334155;
  font-size: 0.92rem;
  font-weight: 950;
}

.pending-overview-group-header small,
.pending-overview-value small {
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 850;
}

:global(html.dark .pending-overview-group-header strong) {
  color: #f8fafc;
}

:global(html.dark .pending-overview-group-header small),
:global(html.dark .pending-overview-value small) {
  color: #94a3b8;
}

.pending-overview-values {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}

.pending-overview-value {
  min-width: 0;
  display: grid;
  gap: 0.34rem;
  border-top: 1px solid #e2e8f0;
  padding: 0.58rem 0 0.1rem;
}

:global(html.dark .pending-overview-value) {
  border-top-color: rgb(51 65 85 / 0.78);
}

.pending-overview-value-main span {
  min-width: 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 950;
  line-height: 1;
  overflow-wrap: anywhere;
}

.pending-overview-value-main strong {
  flex: 0 0 auto;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 950;
  line-height: 1;
  white-space: nowrap;
}

:global(html.dark .pending-overview-value-main span) {
  color: #f8fafc;
}

:global(html.dark .pending-overview-value-main strong) {
  color: #cbd5e1;
}

.pending-overview-bar {
  height: 0.26rem;
  overflow: hidden;
  border-radius: 999px;
  background: #edf2f7;
}

.pending-overview-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #d5dedc;
}

:global(html.dark .pending-overview-bar) {
  background: #1e293b;
}

:global(html.dark .pending-overview-bar span) {
  background: #475569;
}

.managed-summary-overview {
  display: grid;
  gap: 0.7rem;
}

.managed-summary-card {
  display: grid;
  gap: 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.9rem;
  background: linear-gradient(180deg, #f8fafc 0%, #f0fdf4 100%);
  padding: 0.85rem;
}

:global(html.dark .managed-summary-card) {
  border-color: #334155;
  background: linear-gradient(180deg, rgb(30 41 59 / 0.5) 0%, rgb(20 83 45 / 0.2) 100%);
}

.managed-summary-header {
  min-width: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.managed-summary-header strong {
  color: #334155;
  font-size: 0.92rem;
  font-weight: 950;
}

.managed-summary-header small {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 850;
  white-space: nowrap;
}

:global(html.dark .managed-summary-header strong) {
  color: #f8fafc;
}

:global(html.dark .managed-summary-header small) {
  color: #94a3b8;
}

.managed-range-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
}

.managed-range-card {
  min-width: 0;
  display: grid;
  gap: 0.35rem;
  border: 1px solid rgb(82 168 144 / 0.22);
  border-radius: 0.75rem;
  background: rgb(255 255 255 / 0.78);
  padding: 0.62rem 0.68rem;
}

.managed-range-card span {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 900;
  line-height: 1.2;
}

.managed-range-card span i {
  color: #52a890;
  font-size: 0.78rem;
}

.managed-range-card strong {
  min-width: 0;
  color: #0f172a;
  font-size: 1.02rem;
  font-weight: 950;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

:global(html.dark .managed-range-card) {
  border-color: rgb(94 234 212 / 0.18);
  background: rgb(2 6 23 / 0.38);
}

:global(html.dark .managed-range-card span) {
  color: #cbd5e1;
}

:global(html.dark .managed-range-card span i) {
  color: #99f6e4;
}

:global(html.dark .managed-range-card strong) {
  color: #f8fafc;
}

.managed-buff-overview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  border-top: 1px solid rgb(203 213 225 / 0.75);
  padding-top: 0.72rem;
}

.managed-buff-overview span {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  border: 1px solid rgb(82 168 144 / 0.22);
  border-radius: 999px;
  background: #ecfdf5;
  color: #15803d;
  padding: 0.24rem 0.58rem;
  font-size: 0.72rem;
  font-weight: 900;
  line-height: 1.3;
}

:global(html.dark .managed-buff-overview) {
  border-top-color: rgb(51 65 85 / 0.75);
}

:global(html.dark .managed-buff-overview span) {
  border-color: rgb(94 234 212 / 0.22);
  background: rgb(20 83 45 / 0.28);
  color: #bbf7d0;
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
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #f8fafc;
  color: #64748b;
  padding: 0.2rem 0.55rem;
  font-size: 0.76rem;
  font-weight: 900;
}

:global(html.dark .panel-title-row span) {
  border-color: #334155;
  background: rgb(30 41 59 / 0.5);
  color: #94a3b8;
}

.uncovered-layout {
  display: grid;
  gap: 0.5rem;
  align-content: start;
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

@media (min-width: 640px) {
  .collectable-analysis-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

}

@media (max-width: 520px) {
  .collectable-save-preview-item {
    align-items: flex-start;
  }

  .collectable-save-rule {
    gap: 0.35rem;
  }
}

.uncovered-detail {
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
  align-self: start;
}

.managed-meter-list {
  display: grid;
  gap: 0.68rem;
}

.managed-meter {
  display: grid;
  gap: 0.38rem;
}

.managed-meter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
}

.managed-meter-header span,
.path-box strong {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #334155;
  font-size: 0.82rem;
  font-weight: 950;
}

.managed-meter-header span i,
.path-box strong i {
  color: #52a890;
}

.managed-meter-header strong {
  flex: 0 0 auto;
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 950;
  white-space: nowrap;
}

.managed-meter-track {
  height: 0.52rem;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.managed-meter-track span {
  display: block;
  height: 100%;
  min-width: 0.3rem;
  border-radius: inherit;
  background: #52a890;
}

.managed-meter.gp .managed-meter-track span {
  background: #38bdf8;
}

.managed-meter.collectability .managed-meter-track span {
  background: #a78bfa;
}

:global(html.dark .managed-meter-header span),
:global(html.dark .managed-meter-header strong) {
  color: #f8fafc;
}

:global(html.dark .managed-meter-track) {
  background: #1e293b;
}

:global(html.dark .managed-meter.gp .managed-meter-track span) {
  background: #0ea5e9;
}

:global(html.dark .managed-meter.integrity .managed-meter-track span) {
  background: #52a890;
}

:global(html.dark .managed-meter.collectability .managed-meter-track span) {
  background: #8b5cf6;
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

.path-timeline {
  display: grid;
  gap: 0.45rem;
  list-style: none;
  margin: 0;
  padding: 0;
  color: #475569;
  font-size: 0.8rem;
  line-height: 1.5;
}

.path-timeline li {
  min-width: 0;
  display: grid;
  grid-template-columns: 1.35rem minmax(0, 1fr);
  align-items: start;
  gap: 0.45rem;
}

.path-timeline li i {
  width: 1.35rem;
  height: 1.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.45rem;
  background: #f0fdf4;
  color: #0f766e;
  font-size: 0.72rem;
}

.path-timeline li span {
  min-width: 0;
  overflow-wrap: anywhere;
}

:global(html.dark .path-timeline) {
  color: #cbd5e1;
}

:global(html.dark .path-timeline li i) {
  background: rgb(20 83 45 / 0.28);
  color: #99f6e4;
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.85rem;
}

.rule-editor-dialog-header > div {
  min-width: 0;
  display: flex;
  align-items: center;
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
  flex-wrap: wrap;
}

.rule-editor-footer-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-left: auto;
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
  .analysis-header {
    flex-direction: column;
    align-items: stretch;
  }

  .rule-card-header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.65rem;
  }

  .rule-enabled {
    grid-column: 1;
    grid-row: 1;
    justify-self: start;
  }

  .rule-name-display {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .rule-name-display {
    width: 100%;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .rule-tools {
    grid-column: 3;
    grid-row: 1;
    justify-self: end;
    flex-wrap: nowrap;
  }

  .analysis-action-group {
    width: 100%;
    grid-template-columns: 3rem minmax(0, 1fr);
  }

  .condition-row {
    grid-template-columns: minmax(0, 1fr) 2.35rem;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 0.72rem;
  }

  .condition-row:last-of-type {
    border-bottom: 0;
    padding-bottom: 0;
  }

  :global(html.dark .condition-row) {
    border-bottom-color: #334155;
  }

  .condition-row > select,
  .condition-row > input {
    width: 100%;
  }

  .condition-row .condition-remove-button {
    grid-column: 2;
    grid-row: 1;
    width: 2.35rem;
    height: 2.35rem;
  }

  .condition-remove-icon-desktop {
    display: none;
  }

  .condition-remove-icon-mobile {
    display: inline-flex;
  }

  .condition-row.is-boolean .condition-remove-button {
    grid-column: 2;
    grid-row: 1;
  }

  .condition-row select:first-child,
  .condition-row.is-boolean select:first-child {
    grid-column: 1;
    grid-row: 1;
  }

  .condition-row select:nth-of-type(2),
  .condition-row input,
  .condition-row.is-boolean select:nth-of-type(2) {
    grid-column: 1;
  }

  .condition-row .condition-help,
  .condition-row.is-boolean .condition-help {
    grid-column: 1;
  }

  .managed-nodes-entry.skill-entry {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    row-gap: 0.45rem;
    text-align: left;
  }

  .managed-nodes-entry.skill-entry .skill-icon-strip {
    grid-column: 1 / -1;
    margin-left: 0;
    justify-content: flex-start;
    gap: 0.32rem;
  }

  .managed-nodes-entry.skill-entry .skill-preview-icon {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 0.5rem;
  }

  .managed-nodes-entry.skill-entry .skill-preview-arrow {
    font-size: 0.68rem;
  }

  .rule-editor-overlay {
    align-items: stretch;
    place-items: stretch;
    padding: 0.65rem;
  }

  .rule-editor-dialog {
    width: 100%;
    max-height: calc(100dvh - 1.3rem);
    padding: 0.85rem;
  }

  .rule-editor-dialog-header,
  .managed-node-toolbar,
  .rule-editor-dialog-footer {
    align-items: stretch;
  }

  .managed-node-toolbar {
    flex-direction: column;
  }

  .managed-range-grid {
    grid-template-columns: 1fr;
  }

  .editor-secondary-action,
  .managed-nodes-entry {
    justify-content: flex-start;
  }

  .editor-segmented-control,
  .rule-editor-footer-actions {
    width: 100%;
  }

  .rule-editor-back-button {
    width: 100%;
  }

  .rule-editor-footer-actions {
    display: grid;
    grid-template-columns: 1fr;
    margin-left: 0;
  }

  .action-select-row {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .action-select-row > button {
    grid-column: 1 / -1;
    width: 100%;
  }

  .action-select-row small {
    grid-column: 1 / -1;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
