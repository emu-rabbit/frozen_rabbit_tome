<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getItemIcon, getItemName } from '../services/gameData';
import { getRotationActionIconById } from '../services/actionIcons';
import { getCollectableActionIcon, getCollectableActionName } from '../services/collectableActions';
import { getCollectableScripRewardMeta } from '../services/collectableScripRewards';
import type { StoredCollectableStrategyRule, StoredTomeRotationStep } from '../types/game';
import type { CollectableActionKind, CollectableObjective } from '../types/collectable';
import { isCustomTierObjective, isTierCountObjective } from '../utils/collectableObjectivePresets';
import type { TomeJsonImportProjection } from '../utils/tomeJsonImport';
import { getFrontierCollectableActionIcon, getFrontierCollectableActionName } from '../frontier/collectable/frontierCollectableActions';
import type {
  FrontierCollectableJsonImportProjection
} from '../frontier/collectable/frontierCollectableExport';
import type { FrontierCollectableActionKind } from '../frontier/collectable/frontierCollectableTypes';

type JsonImportProjection = TomeJsonImportProjection | FrontierCollectableJsonImportProjection;

const props = defineProps<{
  projection: JsonImportProjection;
}>();

const { t } = useI18n();

const itemName = computed(() => {
  const itemId = props.projection.item.itemId;
  return props.projection.item.nameLocale || getItemName(itemId) || props.projection.item.nameEn || `Item ${itemId}`;
});

const isTomeImport = computed(() => !isFrontierProjection(props.projection) && props.projection.sourceType === 'tome');
const isCollectable = computed(() => (
  isFrontierProjection(props.projection)
    ? true
    : isTomeImport.value
    ? props.projection.tome.kind === 'collectable'
    : props.projection.experiment.kind === 'collectable'
));

const rows = computed(() => {
  const input = isFrontierProjection(props.projection)
    ? props.projection.study.input
    : isTomeImport.value
      ? props.projection.tome.input
      : props.projection.experiment.input;

  return [
    {
      label: t('tomeLibrary.rows.playerStats'),
      value: `${input.stats.level}/${input.stats.gathering}/${input.stats.perception}`
    },
    {
      label: t('tomeLibrary.rows.gpState'),
      value: `${input.temporaryGp}/${input.stats.gp}`
    },
    {
      label: t('tomeLibrary.rows.food'),
      value: input.food?.foodId
        ? `${getItemName(input.food.foodId)} ${t(`solver.food.${input.food.quality}`)}`
        : t('tomeLibrary.noFood')
    },
    {
      label: t('tomeLibrary.rows.nodeBonuses'),
      value: isCollectable.value
        ? t('tomeLibrary.nodeState.collectable', { gathering: input.nodeBonuses.gatheringCount })
        : t('tomeLibrary.nodeState.regular', {
            gathering: input.nodeBonuses.gatheringCount,
            yield: input.nodeBonuses.yieldCount,
            extra: input.nodeBonuses.extraRate
          })
    }
  ];
});

const metrics = computed(() => {
  if (isFrontierProjection(props.projection)) {
    const snapshot = props.projection.study.lastAnalysisSnapshot;
    if (!snapshot) return [];
    return [
      { label: t('frontier.analysis.expectedScore'), value: formatNumber(snapshot.expectedScore) },
      { label: t('frontier.analysis.maxScore'), value: formatNumber(snapshot.maxScore) },
      { label: t('frontier.analysis.minScore'), value: formatNumber(snapshot.minScore) }
    ];
  }

  if (isTomeImport.value) {
    const snapshot = props.projection.tome.lastSolvedSnapshot;
    if (!snapshot) return [];

    if (snapshot.kind === 'collectable') {
      const unit = collectableMetricUnit(snapshot.objective, snapshot.rewardItemId ?? snapshot.rewardTableSummary?.rewardItemId);
      return [
        { label: collectableMetricLabel('expected', snapshot.objective, unit), value: collectableMetricValue(snapshot.expectedScore, snapshot.expectedTierCounts, snapshot.objective) },
        { label: collectableMetricLabel('max', snapshot.objective, unit), value: collectableMetricValue(snapshot.maxScore, snapshot.maxScoreTierCounts, snapshot.objective) },
        { label: collectableMetricLabel('min', snapshot.objective, unit), value: collectableMetricValue(snapshot.minScore, snapshot.minScoreTierCounts, snapshot.objective) }
      ];
    }

    return [
      { label: t('solver.strategy.expectedYield'), value: formatNumber(snapshot.expectedYield) },
      { label: t('solver.strategy.maxYield'), value: formatNumber(snapshot.maxYield) },
      { label: t('solver.strategy.minYield'), value: formatNumber(snapshot.minYield) }
    ];
  }

  const snapshot = props.projection.experiment.lastAnalysisSnapshot;
  if (!snapshot) return [];
  if (snapshot.kind === 'collectable') {
    const strategy = props.projection.experiment.strategy.kind === 'collectable'
      ? props.projection.experiment.strategy
      : null;
    const unit = collectableMetricUnit(strategy?.objective, strategy?.rewardTableSummary?.rewardItemId);
    return [
      { label: collectableMetricLabel('expected', strategy?.objective, unit), value: collectableMetricValue(snapshot.expectedScore, snapshot.expectedTierCounts, strategy?.objective) },
      { label: collectableMetricLabel('max', strategy?.objective, unit), value: collectableMetricValue(snapshot.maxScore, snapshot.maxScoreTierCounts, strategy?.objective) },
      { label: collectableMetricLabel('min', strategy?.objective, unit), value: collectableMetricValue(snapshot.minScore, snapshot.minScoreTierCounts, strategy?.objective) }
    ];
  }

  return [
    { label: t('simulator.analysis.expectedYield'), value: formatNumber(snapshot.expectedYield) },
    { label: t('simulator.analysis.maxYield'), value: formatNumber(snapshot.maxYield) },
    { label: t('simulator.analysis.minYield'), value: formatNumber(snapshot.minYield) }
  ];
});

const regularRotation = computed(() => {
  if (isFrontierProjection(props.projection)) return [];

  if (props.projection.sourceType === 'tome') {
    const snapshot = props.projection.tome.lastSolvedSnapshot;
    return snapshot?.kind === 'regular' ? snapshot.rotation : [];
  }

  const strategy = props.projection.experiment.strategy;
  return strategy.kind === 'regular' ? strategy.primaryRotation : [];
});

const collectableActions = computed(() => {
  if (isFrontierProjection(props.projection)) {
    return props.projection.study.strategy
      .filter((rule) => rule.enabled)
      .slice(0, 3)
      .flatMap((rule) => rule.actions.slice(0, 4));
  }

  if (isTomeImport.value) {
    const snapshot = props.projection.tome.lastSolvedSnapshot;
    return snapshot?.kind === 'collectable' && snapshot.rootAction ? [snapshot.rootAction.kind] : [];
  }

  const strategy = props.projection.experiment.strategy;
  if (strategy.kind !== 'collectable') return [];
  return strategy.rules.filter((rule) => rule.enabled).slice(0, 3).flatMap((rule) => rule.actions.slice(0, 4));
});

function itemJobs() {
  return props.projection.item.jobTypes?.length
    ? props.projection.item.jobTypes
    : props.projection.item.jobType
      ? [props.projection.item.jobType]
      : [];
}

function scenarioLabel() {
  if (isFrontierProjection(props.projection)) return t('frontier.json.scenario');

  const key = props.projection.sourceScenario.replace('.', '');
  if (key === 'tomeregular') return t('jsonExport.scenarios.tomeRegular');
  if (key === 'tomecollectable') return t('jsonExport.scenarios.tomeCollectable');
  if (key === 'experimentregular') return t('jsonExport.scenarios.experimentRegular');
  return t('jsonExport.scenarios.experimentCollectable');
}

function rotationIcon(step: StoredTomeRotationStep) {
  if (step.type === 'gather') return getItemIcon(props.projection.item.itemId);
  return getRotationActionIconById(step.actionId);
}

function collectableIcon(action: CollectableActionKind | FrontierCollectableActionKind) {
  if (isFrontierProjection(props.projection)) {
    return getFrontierCollectableActionIcon(action as FrontierCollectableActionKind, props.projection.item.jobType ?? 'miner');
  }

  return getCollectableActionIcon(action as CollectableActionKind, props.projection.item.jobType ?? 'miner');
}

function collectableLabel(action: CollectableActionKind | FrontierCollectableActionKind) {
  if (isFrontierProjection(props.projection)) {
    return getFrontierCollectableActionName(action as FrontierCollectableActionKind, props.projection.item.jobType ?? 'miner');
  }

  return getCollectableActionName(action as CollectableActionKind, props.projection.item.jobType ?? 'miner');
}

function isFrontierProjection(projection: JsonImportProjection): projection is FrontierCollectableJsonImportProjection {
  return projection.sourceScenario === 'frontier.collectable';
}

function collectableMetricUnit(objective?: CollectableObjective, rewardItemId?: number) {
  if (isCustomTierObjective(objective)) return t('collectableSolver.results.pointUnit');
  if (isTierCountObjective(objective)) return '';
  return t(getCollectableScripRewardMeta(rewardItemId).labelKey);
}

function collectableMetricLabel(metric: 'expected' | 'max' | 'min', objective: CollectableObjective | undefined, unit: string) {
  if (isTierCountObjective(objective)) {
    if (metric === 'expected') return t('collectableSolver.results.expectedTierCounts');
    if (metric === 'max') return t('collectableSolver.results.maxTierCounts');
    return t('collectableSolver.results.minTierCounts');
  }

  return t(`collectableSolver.results.${metric}Score`, { unit });
}

function collectableMetricValue(score: number | undefined, tierCounts: unknown, objective?: CollectableObjective) {
  if (isTierCountObjective(objective)) {
    const counts = tierCounts as { low?: number; mid?: number; high?: number } | undefined;
    return [
      counts?.high ? `${formatNumber(counts.high)} ${t('collectableObjective.tiers.high')}` : '',
      counts?.mid ? `${formatNumber(counts.mid)} ${t('collectableObjective.tiers.mid')}` : '',
      counts?.low ? `${formatNumber(counts.low)} ${t('collectableObjective.tiers.low')}` : ''
    ].filter(Boolean).join(' / ') || '0';
  }

  return formatNumber(score);
}

function formatNumber(value?: number) {
  return typeof value === 'number' ? Number(value.toFixed(2)).toString() : '-';
}
</script>

<template>
  <article class="json-import-preview-card">
    <div class="json-import-preview-item">
      <div class="json-import-preview-icon">
        <img v-if="getItemIcon(projection.item.itemId)" :src="getItemIcon(projection.item.itemId)" :alt="itemName" />
        <i v-else class="pi pi-box"></i>
      </div>
      <div class="json-import-preview-info">
        <h4>{{ itemName }}</h4>
        <div class="json-import-preview-badges">
          <span class="item-glv-badge">{{ t('createGuide.glv') }} {{ projection.item.glv ?? '-' }}</span>
          <span v-for="job in itemJobs()" :key="job" class="item-job-badge">{{ t(`game.jobs.${job}`) }}</span>
          <span v-if="itemJobs().length === 0" class="item-job-badge">-</span>
          <span class="item-system-badge" :class="{ 'is-collectable': isCollectable }">
            <i :class="isCollectable ? 'pi pi-box' : 'pi pi-compass'"></i>
            {{ isCollectable ? t('createGuide.collectableSystem') : t('createGuide.regularSystem') }}
          </span>
          <span class="item-source-badge">{{ scenarioLabel() }}</span>
        </div>
      </div>
    </div>

    <div class="json-import-preview-rows">
      <div v-for="row in rows" :key="row.label" class="json-import-preview-row">
        <span>{{ row.label }}</span>
        <strong>{{ row.value }}</strong>
      </div>
    </div>

    <div v-if="metrics.length" class="json-import-preview-metrics">
      <div v-for="metric in metrics" :key="metric.label">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </div>
    </div>

    <div v-if="!isCollectable && regularRotation.length" class="json-import-preview-rotation">
      <span>{{ isTomeImport ? t('solver.strategy.rotationTitles.primary') : t('experimentDatabase.rotations.primary') }}</span>
      <div class="json-import-preview-icons">
        <template v-for="(step, index) in regularRotation" :key="`${step.type}-${index}`">
          <span class="json-import-preview-action-icon" :class="{ 'is-gather': step.type === 'gather' }">
            <img v-if="rotationIcon(step)" :src="rotationIcon(step)" :alt="step.actionName || ''" />
            <i v-else class="pi pi-sparkles"></i>
          </span>
          <i v-if="index < regularRotation.length - 1" class="pi pi-angle-right json-import-preview-arrow"></i>
        </template>
      </div>
    </div>

    <div v-else-if="isCollectable" class="json-import-preview-rotation">
      <span>{{ isTomeImport ? t('tomeLibrary.startFromAction', { action: collectableActions[0] ? collectableLabel(collectableActions[0]) : '-' }) : t('experimentDatabase.rotations.strategyPreview') }}</span>
      <div v-if="collectableActions.length" class="json-import-preview-icons">
        <template v-for="(action, index) in collectableActions" :key="`${action}-${index}`">
          <span class="json-import-preview-action-icon">
            <img v-if="collectableIcon(action)" :src="collectableIcon(action)" :alt="collectableLabel(action)" />
            <i v-else class="pi pi-sparkles"></i>
          </span>
          <i v-if="index < collectableActions.length - 1" class="pi pi-angle-right json-import-preview-arrow"></i>
        </template>
      </div>
    </div>
  </article>
</template>

<style scoped>
.json-import-preview-card {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  display: grid;
  gap: 0.85rem;
  padding: 0.95rem;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  box-shadow: 0 2px 8px rgb(15 23 42 / 0.04);
}

:global(html.dark .json-import-preview-card) {
  border-color: #334155;
  background: #0f172a;
}

.json-import-preview-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.json-import-preview-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 10px;
  background: #f1f5f9;
  color: #94a3b8;
}

:global(html.dark .json-import-preview-icon) {
  background: #1e293b;
}

.json-import-preview-icon img,
.json-import-preview-action-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.json-import-preview-info {
  min-width: 0;
}

.json-import-preview-info h4 {
  margin: 0;
  color: #1e293b;
  font-size: 1.02rem;
  font-weight: 900;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

:global(html.dark .json-import-preview-info h4) {
  color: #f8fafc;
}

.json-import-preview-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.4rem;
}

.item-glv-badge,
.item-job-badge,
.item-system-badge,
.item-source-badge {
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 3px 10px;
  border-radius: 20px;
  color: white;
  font-size: 0.72rem;
  font-weight: 900;
  line-height: 1.35;
}

.item-glv-badge {
  background: linear-gradient(135deg, #52a890, #3d8b75);
}

.item-job-badge {
  background: linear-gradient(135deg, #64748b, #475569);
}

.item-system-badge {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.item-system-badge.is-collectable {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.item-source-badge {
  background: linear-gradient(135deg, #0f766e, #115e59);
}

.json-import-preview-rows,
.json-import-preview-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 8.5rem), 1fr));
  gap: 0.5rem;
}

.json-import-preview-row,
.json-import-preview-metrics div,
.json-import-preview-rotation {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  display: grid;
  gap: 0.25rem;
  padding: 0.65rem 0.75rem;
  border-radius: 12px;
  background: #f8fafc;
}

:global(html.dark .json-import-preview-row),
:global(html.dark .json-import-preview-metrics div),
:global(html.dark .json-import-preview-rotation) {
  background: rgb(30 41 59 / 0.55);
}

.json-import-preview-row span,
.json-import-preview-metrics span,
.json-import-preview-rotation span {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
}

:global(html.dark .json-import-preview-row span),
:global(html.dark .json-import-preview-metrics span),
:global(html.dark .json-import-preview-rotation span) {
  color: #94a3b8;
}

.json-import-preview-row strong,
.json-import-preview-metrics strong {
  min-width: 0;
  color: #334155;
  font-weight: 900;
  overflow-wrap: anywhere;
}

.json-import-preview-metrics div:first-child {
  border: 1px solid rgb(82 168 144 / 0.55);
  background: rgb(240 253 244 / 0.86);
}

:global(html.dark .json-import-preview-metrics div:first-child) {
  border-color: rgb(74 222 128 / 0.42);
  background: rgb(20 83 45 / 0.22);
}

:global(html.dark .json-import-preview-row strong),
:global(html.dark .json-import-preview-metrics strong) {
  color: #e2e8f0;
}

.json-import-preview-icons {
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  align-items: center;
  gap: 0.35rem;
  padding-bottom: 0.15rem;
  scrollbar-width: thin;
}

.json-import-preview-action-icon {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 9px;
  background: #52a890;
  color: white;
}

.json-import-preview-action-icon.is-gather {
  background: #e2e8f0;
  color: #64748b;
}

:global(html.dark .json-import-preview-action-icon.is-gather) {
  background: #1e293b;
  color: #94a3b8;
}

.json-import-preview-arrow {
  color: #cbd5e1;
  font-size: 0.78rem;
  flex-shrink: 0;
}

:global(html.dark .json-import-preview-arrow) {
  color: #64748b;
}
</style>
