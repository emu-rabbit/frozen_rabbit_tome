<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getCollectableScripRewardMeta } from '../services/collectableScripRewards';
import type { CollectableObjective, CollectableRewardWeights, CollectableSolverDebugInfo, CollectableTierScoreWeights } from '../types/collectable';

const props = defineProps<{
  modelValue: boolean;
  debug: CollectableSolverDebugInfo | null | undefined;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { t } = useI18n();
const plans = computed(() => props.debug?.plans ?? []);
const stateFields = computed(() => props.debug?.optimality.stateKeyFields ?? []);
const objectiveEntries = computed(() => buildObjectiveEntries(props.debug?.objective));
const objectiveLabel = computed(() => {
  const objective = props.debug?.objective;
  if (!objective) return '-';
  if (objective.kind === 'scrip') {
    const meta = getCollectableScripRewardMeta(props.debug?.formulas.rewardTable.rewardItemId);
    if (meta.kind === 'orange') return t('collectableObjective.presets.orangeScrip');
    if (meta.kind === 'purple') return t('collectableObjective.presets.purpleScrip');
    return t('collectableSolver.debug.objectiveKinds.scrip');
  }
  if (objective.presetId) return t(`collectableObjective.presets.${objective.presetId}`);
  return t(`collectableSolver.debug.objectiveKinds.${objective.kind}`);
});
const objectiveUnitLabel = computed(() => {
  const objective = props.debug?.objective;
  if (!objective) return '-';
  if (objective.kind === 'tierScore') {
    return objective.presetId === 'customTier'
      ? t('collectableSolver.results.pointUnit')
      : t('collectableSolver.debug.objectiveUnits.tierScore');
  }
  if (objective.kind === 'scrip') {
    return t(getCollectableScripRewardMeta(props.debug?.formulas.rewardTable.rewardItemId).labelKey);
  }
  return t(`collectableSolver.debug.objectiveUnits.${objective.kind}`);
});

function closeDialog() {
  emit('update:modelValue', false);
}

function formatProbability(probability: number, useSpacePadding = false, includePercent = true) {
  const percentSuffix = includePercent ? '%' : '';
  if (probability > 0 && probability < 0.01) {
    return useSpacePadding ? `< 0.01${percentSuffix}` : `<0.01${percentSuffix}`;
  }
  const formatted = probability.toFixed(2);
  if (useSpacePadding) {
    return formatted.padStart(6, ' ') + percentSuffix;
  }
  return formatted + percentSuffix;
}

function planTitle(kind: string) {
  return kind === 'revisit'
    ? t('collectableSolver.debug.revisitPlan')
    : t('collectableSolver.debug.primaryPlan');
}

function buildObjectiveEntries(objective?: CollectableObjective) {
  if (!objective) return [];
  if (objective.kind === 'tierScore') return buildTierWeightEntries(objective.tierWeights);
  return buildRewardWeightEntries(objective.weights, objective.kind);
}

function buildTierWeightEntries(weights: CollectableTierScoreWeights = {}) {
  const entries = [
    ['none', weights.none ?? 0],
    ['low', weights.low ?? 0],
    ['mid', weights.mid ?? 0],
    ['high', weights.high ?? 0]
  ] as const;
  return entries.map(([key, value]) => ({
    key,
    label: t(`collectableObjective.tiers.${key}`),
    value
  }));
}

function buildRewardWeightEntries(weights: CollectableRewardWeights = {}, kind: CollectableObjective['kind']) {
  const entries = [
    { key: 'scrip', value: kind === 'scrip' ? 1 : weights.scrip },
    { key: 'exp', value: kind === 'exp' ? 1 : weights.exp },
    { key: 'gil', value: kind === 'gil' ? 1 : weights.gil }
  ].filter((entry): entry is { key: 'scrip' | 'exp' | 'gil'; value: number } => typeof entry.value === 'number');
  const itemEntries = Object.entries(weights.items ?? {}).map(([itemId, value]) => ({
    key: `item-${itemId}`,
    label: t('collectableSolver.debug.itemWeight', { itemId }),
    value
  }));

  return [
    ...entries.map((entry) => ({
      key: entry.key,
      label: t(`collectableSolver.debug.rewardWeights.${entry.key}`),
      value: entry.value
    })),
    ...itemEntries
  ];
}
</script>

<template>
  <Teleport to="body">
    <Transition name="collectable-debug-dialog">
      <div
        v-if="modelValue && debug"
        class="collectable-debug-root"
        role="dialog"
        aria-modal="true"
        :aria-label="t('collectableSolver.debug.title')"
        @keydown.esc="closeDialog"
      >
        <button class="collectable-debug-backdrop" type="button" :aria-label="t('collectableSolver.debug.close')" @click="closeDialog"></button>
        <section class="collectable-debug-panel">
          <header class="collectable-debug-header">
            <div>
              <span>{{ t('collectableSolver.debug.kicker') }}</span>
              <h2>{{ t('collectableSolver.debug.title') }}</h2>
              <p>{{ t('collectableSolver.debug.subtitle') }}</p>
            </div>
            <button type="button" class="collectable-debug-close" :aria-label="t('collectableSolver.debug.close')" @click="closeDialog">
              <i class="pi pi-times"></i>
            </button>
          </header>

          <div class="collectable-debug-body">
            <section class="debug-section">
              <h3>{{ t('collectableSolver.debug.formulas') }}</h3>
              <div class="debug-grid">
                <article class="debug-card">
                  <h4>{{ t('collectableSolver.debug.success') }}</h4>
                  <p>{{ t('solver.debug.successScoreFormula', {
                    gathering: debug.formulas.success.gathering,
                    baseGathering: debug.formulas.success.baseGathering,
                    score: debug.formulas.success.score
                  }) }}</p>
                  <strong>{{ t('solver.debug.finalSuccess') }}: {{ debug.formulas.success.finalRate }}%</strong>
                </article>
                <article class="debug-card">
                  <h4>{{ t('collectableSolver.debug.collectableFormula') }}</h4>
                  <p>Scour: {{ debug.formulas.collectable.scourValue }}</p>
                  <p>{{ t('collectableSolver.debug.valueIncreaseRate') }}: {{ debug.formulas.collectable.valueIncreaseRate }}% / {{ debug.formulas.collectable.focusedValueIncreaseRate }}%</p>
                  <p v-if="debug.formulas.collectable.hasRelicToolBonus">
                    {{ t('collectableSolver.debug.relicToolBonus') }}: {{ debug.formulas.collectable.baseValueIncreaseRate }}% +20%
                  </p>
                  <p>{{ t('collectableSolver.debug.meticulousRate') }}: {{ debug.formulas.collectable.meticulousRate }}% / {{ debug.formulas.collectable.primedMeticulousRate }}%</p>
                  <p>{{ t('collectableSolver.debug.scrutiny') }}: {{ debug.formulas.collectable.scrutinyMultiplier }}%, +{{ debug.formulas.collectable.scrutinyBonus }}</p>
                  <strong>{{ t('collectableSolver.debug.standardRate') }}: {{ (debug.formulas.collectable.standardProcRate * 100).toFixed(0) }}%</strong>
                </article>
                <article class="debug-card">
                  <h4>{{ t('collectableSolver.debug.rewardTable') }}</h4>
                  <p>{{ t('collectableSolver.debug.low') }}: {{ debug.formulas.rewardTable.lowCollectability }} / {{ t('collectableSolver.debug.scripAmount', { scrip: debug.formulas.rewardTable.lowScrip }) }}</p>
                  <p>{{ t('collectableSolver.debug.mid') }}: {{ debug.formulas.rewardTable.midCollectability }} / {{ t('collectableSolver.debug.scripAmount', { scrip: debug.formulas.rewardTable.midScrip }) }}</p>
                  <p>{{ t('collectableSolver.debug.high') }}: {{ debug.formulas.rewardTable.highCollectability ?? '-' }} / {{ debug.formulas.rewardTable.highScrip == null ? '-' : t('collectableSolver.debug.scripAmount', { scrip: debug.formulas.rewardTable.highScrip }) }}</p>
                </article>
              </div>
            </section>

            <section class="debug-section">
              <h3>{{ t('collectableSolver.debug.objective') }}</h3>
              <div class="debug-card objective-debug-card">
                <div class="objective-debug-summary">
                  <div>
                    <span>{{ t('collectableSolver.debug.objectivePreset') }}</span>
                    <strong>{{ objectiveLabel }}</strong>
                  </div>
                  <div>
                    <span>{{ t('collectableSolver.debug.objectiveUnit') }}</span>
                    <strong>{{ objectiveUnitLabel }}</strong>
                  </div>
                </div>
                <p>{{ t('collectableSolver.debug.objectiveNote') }}</p>
                <div class="objective-weight-grid">
                  <div v-for="entry in objectiveEntries" :key="entry.key" class="objective-weight-row">
                    <span>{{ entry.label }}</span>
                    <strong>{{ entry.value }}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section class="debug-section">
              <h3>{{ t('solver.debug.expectedValue') }}</h3>
              <p class="debug-code">E = {{ debug.combined.expression }} = {{ debug.combined.expectedScore }}</p>
              <p>{{ t('solver.debug.revisitChance') }}: {{ (debug.combined.revisitChance * 100).toFixed(0) }}%</p>
            </section>

            <section class="debug-section">
              <h3>{{ t('collectableSolver.debug.search') }}</h3>
              <div class="debug-plan-list">
                <article v-for="plan in plans" :key="plan.kind" class="debug-card">
                  <div class="debug-plan-header">
                    <div>
                      <h4>{{ planTitle(plan.kind) }}</h4>
                      <p>{{ t('solver.debug.startingGp') }}: {{ plan.startingGp }} GP</p>
                    </div>
                    <strong>E = {{ Number(plan.expectedScore.toFixed(2)) }}</strong>
                  </div>
                  <div class="debug-stats">
                    <span>{{ t('solver.debug.workerCalculationTime') }} {{ plan.search.workerCalculationTime ?? '-' }} ms</span>
                    <span>{{ t('solver.debug.statesSolved') }} {{ plan.search.statesSolved }}</span>
                    <span>{{ t('solver.debug.actionsEvaluated') }} {{ plan.search.actionsEvaluated }}</span>
                    <span>{{ t('solver.debug.candidateComparisons') }} {{ plan.search.candidateComparisons }}</span>
                    <span>{{ t('solver.debug.branchCount') }} {{ plan.search.branchCount }}</span>
                    <span>{{ t('solver.debug.memoHits') }} {{ plan.search.memoHits }}</span>
                    <span>{{ t('solver.debug.memoHitRate') }} {{ formatProbability(plan.search.memoHitRate ?? 0) }}</span>
                    <span>{{ t('solver.debug.terminalStates') }} {{ plan.search.terminalStates }}</span>
                  </div>

                  <h5>{{ t('solver.debug.outcomeDistribution') }}</h5>
                  <div class="debug-outcomes">
                    <div v-for="entry in plan.outcomeDistribution" :key="`${plan.kind}-${entry.score}`" class="debug-outcome-row">
                      <span>{{ entry.score }}</span>
                      <div class="debug-outcome-track">
                        <div :style="{ width: `${Math.min(100, entry.probability)}%` }"></div>
                      </div>
                      <span class="probability-text">{{ formatProbability(entry.probability, true) }}</span>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <section class="debug-section">
              <h3>{{ t('collectableSolver.debug.limitations') }}</h3>
              <ul>
                <li v-for="limitation in debug.limitations" :key="limitation">{{ t(`collectableSolver.limitations.${limitation}`) }}</li>
              </ul>
            </section>

            <section class="debug-section">
              <h3>{{ t('solver.debug.optimality') }}</h3>
              <p>{{ t('collectableSolver.debug.stateKeyIntro') }}</p>
              <ul class="debug-state-list">
                <li v-for="field in stateFields" :key="field">
                  <code>{{ field }}</code>
                  <span>{{ t(`collectableSolver.debug.stateFields.${field}`) }}</span>
                </li>
              </ul>
              <p>{{ t('collectableSolver.debug.optimalityNote') }}</p>
            </section>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.collectable-debug-root {
  position: fixed;
  inset: 0;
  z-index: 96;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

.collectable-debug-backdrop {
  position: fixed;
  inset: 0;
  border: 0;
  background: rgb(15 23 42 / 0.58);
  backdrop-filter: blur(10px);
}

.collectable-debug-panel {
  position: relative;
  width: min(100%, 64rem);
  max-height: calc(100dvh - 1.5rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgb(209 250 229 / 0.86);
  border-radius: 1.25rem;
  background: white;
  box-shadow: 0 24px 60px rgb(15 23 42 / 0.24);
}

:global(html.dark .collectable-debug-panel) {
  border-color: rgb(51 65 85);
  background: rgb(15 23 42);
}

.collectable-debug-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

:global(html.dark .collectable-debug-header) {
  border-color: #334155;
}

.collectable-debug-header span {
  color: #52a890;
  font-size: 0.75rem;
  font-weight: 900;
}

.collectable-debug-header h2 {
  margin: 0.25rem 0;
  color: #1e293b;
  font-size: 1.35rem;
  font-weight: 900;
}

:global(html.dark .collectable-debug-header h2) {
  color: #f8fafc;
}

.collectable-debug-header p,
.debug-section p,
.debug-card p,
.debug-section li {
  margin: 0;
  color: #64748b;
  font-size: 0.86rem;
  line-height: 1.5;
}

:global(html.dark .collectable-debug-header p),
:global(html.dark .debug-section p),
:global(html.dark .debug-card p),
:global(html.dark .debug-section li) {
  color: #94a3b8;
}

.collectable-debug-close {
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #f8fafc;
  color: #64748b;
}

:global(html.dark .collectable-debug-close) {
  border-color: #334155;
  background: rgb(30 41 59 / 0.78);
  color: #cbd5e1;
}

.collectable-debug-body {
  display: grid;
  gap: 1rem;
  overflow-y: auto;
  padding: 1.25rem;
}

.debug-section {
  display: grid;
  gap: 0.75rem;
}

.debug-section h3,
.debug-card h4 {
  margin: 0;
  color: #334155;
  font-weight: 900;
}

:global(html.dark .debug-section h3),
:global(html.dark .debug-card h4) {
  color: #e2e8f0;
}

.debug-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 0.75rem;
}

.debug-card {
  display: grid;
  gap: 0.45rem;
  padding: 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.9rem;
  background: #f8fafc;
}

:global(html.dark .debug-card) {
  border-color: #334155;
  background: rgb(2 6 23 / 0.34);
}

.debug-card strong {
  color: #0f766e;
}

:global(html.dark .debug-card strong) {
  color: #99f6e4;
}

.objective-debug-card {
  gap: 0.75rem;
}

.objective-debug-summary,
.objective-weight-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 0.55rem;
}

.objective-debug-summary > div,
.objective-weight-row {
  min-width: 0;
  display: grid;
  gap: 0.2rem;
  border: 1px solid #dbeafe;
  border-radius: 0.7rem;
  background: #ffffff;
  padding: 0.55rem 0.65rem;
}

:global(html.dark .objective-debug-summary > div),
:global(html.dark .objective-weight-row) {
  border-color: #334155;
  background: rgb(15 23 42 / 0.72);
}

.objective-debug-summary span,
.objective-weight-row span {
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 800;
}

:global(html.dark .objective-debug-summary span),
:global(html.dark .objective-weight-row span) {
  color: #94a3b8;
}

.objective-debug-summary strong,
.objective-weight-row strong {
  overflow-wrap: anywhere;
  font-size: 0.95rem;
}

.debug-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.debug-plan-list {
  display: grid;
  gap: 0.75rem;
}

.debug-plan-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.debug-card h5 {
  margin: 0.2rem 0 0;
  color: #334155;
  font-weight: 900;
}

:global(html.dark .debug-card h5) {
  color: #e2e8f0;
}

.debug-stats span {
  border-radius: 999px;
  background: #f8fafc;
  padding: 0.25rem 0.55rem;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 800;
}

:global(html.dark .debug-stats span) {
  background: #020617;
  color: #cbd5e1;
}

.debug-state-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: 0.45rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.debug-state-list li {
  min-width: 0;
  display: grid;
  gap: 0.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.65rem;
  background: #f8fafc;
  padding: 0.55rem 0.65rem;
}

:global(html.dark .debug-state-list li) {
  border-color: #334155;
  background: rgb(2 6 23 / 0.34);
}

.debug-state-list code {
  overflow-wrap: anywhere;
  color: #0f766e;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 0.76rem;
  font-weight: 900;
}

.debug-state-list span {
  color: #475569;
  font-size: 0.8rem;
  line-height: 1.45;
}

:global(html.dark .debug-state-list code) {
  color: #99f6e4;
}

:global(html.dark .debug-state-list span) {
  color: #cbd5e1;
}

.debug-code {
  overflow-wrap: anywhere;
  border-radius: 0.65rem;
  background: #f8fafc;
  padding: 0.65rem;
  color: #0f766e;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 0.8rem;
}

:global(html.dark .debug-code) {
  background: #020617;
  color: #99f6e4;
}

.debug-outcomes {
  display: grid;
  gap: 0.35rem;
}

.debug-outcome-row {
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr) 5.25rem;
  align-items: center;
  gap: 0.55rem;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 800;
}

:global(html.dark .debug-outcome-row) {
  color: #cbd5e1;
}

.probability-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  white-space: pre;
}

.debug-outcome-track {
  height: 0.45rem;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

:global(html.dark .debug-outcome-track) {
  background: #334155;
}

.debug-outcome-track div {
  height: 100%;
  border-radius: inherit;
  background: #52a890;
}
</style>
