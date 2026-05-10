<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { SolverDebugInfo, SolverPlanDebugInfo } from '../types/game';

const props = defineProps<{
  modelValue: boolean;
  debug: SolverDebugInfo | null | undefined;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { t } = useI18n();

const plans = computed(() => props.debug?.plans ?? []);
const stateFields = computed(() => props.debug?.optimality.stateKeyFields.join(', ') ?? '');

function closeDialog() {
  emit('update:modelValue', false);
}

function planTitle(plan: SolverPlanDebugInfo) {
  return plan.kind === 'revisit'
    ? t('solver.debug.revisitPlan')
    : t('solver.debug.primaryPlan');
}

function successScoreFormula() {
  if (!props.debug) return '';

  const success = props.debug.formulas.success;
  return t('solver.debug.successScoreFormula', {
    gathering: success.gathering,
    baseGathering: success.baseGathering,
    score: success.score
  });
}

function boonScoreFormula() {
  if (!props.debug) return '';

  const boon = props.debug.formulas.boon;
  return t('solver.debug.boonScoreFormula', {
    perception: boon.perception,
    basePerception: boon.basePerception,
    score: boon.score
  });
}

function formatProbability(probability: number) {
  if (probability > 0 && probability < 0.0001) return '<0.0001%';
  return `${Number(probability.toFixed(4))}%`;
}
</script>

<template>
  <Teleport to="body">
    <Transition name="debug-dialog">
      <div
        v-if="modelValue && debug"
        class="debug-dialog-root"
        role="dialog"
        aria-modal="true"
        :aria-label="t('solver.debug.title')"
        @keydown.esc="closeDialog"
      >
        <button class="debug-dialog-backdrop" type="button" :aria-label="t('solver.debug.close')" @click="closeDialog"></button>

        <section class="debug-dialog-panel">
          <header class="debug-dialog-header">
            <div>
              <span class="debug-dialog-kicker">{{ t('solver.debug.kicker') }}</span>
              <h2>{{ t('solver.debug.title') }}</h2>
              <p>{{ t('solver.debug.subtitle') }}</p>
            </div>
            <button class="debug-dialog-close" type="button" :aria-label="t('solver.debug.close')" @click="closeDialog">
              <i class="pi pi-times"></i>
            </button>
          </header>

          <div class="debug-dialog-body">
            <section class="debug-section">
              <h3>{{ t('solver.debug.formulas') }}</h3>
              <div class="debug-grid">
                <article class="debug-card">
                  <h4>{{ t('solver.debug.successFormula') }}</h4>
                  <p class="debug-code">{{ successScoreFormula() }}</p>
                  <p>{{ t('solver.debug.rawSuccess') }}: {{ debug.formulas.success.rawRate }}%</p>
                  <p>{{ t('solver.debug.levelModifier') }}: {{ debug.formulas.success.levelModifier }}% ({{ t('solver.debug.levelDifference') }} {{ debug.formulas.success.levelDifference }})</p>
                  <strong>{{ t('solver.debug.finalSuccess') }}: {{ debug.formulas.success.finalRate }}%</strong>
                </article>

                <article class="debug-card">
                  <h4>{{ t('solver.debug.boonFormula') }}</h4>
                  <p class="debug-code">{{ boonScoreFormula() }}</p>
                  <strong>{{ t('solver.debug.finalBoon') }}: {{ debug.formulas.boon.finalRate }}%</strong>
                </article>

                <article class="debug-card">
                  <h4>{{ t('solver.debug.bountifulFormula') }}</h4>
                  <p>{{ t('solver.debug.plusTwoThreshold') }}: {{ debug.formulas.bountiful.plusTwoThreshold }}</p>
                  <p>{{ t('solver.debug.plusThreeThreshold') }}: {{ debug.formulas.bountiful.plusThreeThreshold }}</p>
                  <strong>{{ t('solver.debug.bountifulAmount') }}: +{{ debug.formulas.bountiful.amount }}</strong>
                </article>

                <article class="debug-card">
                  <h4>{{ t('solver.debug.gatherFormula') }}</h4>
                  <p>{{ t('solver.debug.integrity') }}: {{ debug.formulas.gather.baseIntegrity }} + {{ debug.formulas.gather.bonusIntegrity }} = {{ debug.formulas.gather.maxIntegrity }}</p>
                  <p>{{ t('solver.debug.nodeYieldBonus') }}: +{{ debug.formulas.gather.nodeYieldBonus }}</p>
                  <p>{{ t('solver.debug.nodeBoonBonus') }}: +{{ debug.formulas.gather.nodeBoonBonus }}%</p>
                  <strong>{{ t('solver.debug.gpRecovered') }}: {{ debug.formulas.gather.gpRecoveredPerGather }} GP</strong>
                </article>
              </div>
            </section>

            <section class="debug-section">
              <h3>{{ t('solver.debug.expectedValue') }}</h3>
              <p class="debug-expression">E = {{ debug.combined.expression }} = {{ debug.combined.expectedYield }}</p>
              <p class="debug-muted">{{ t('solver.debug.revisitChance') }}: {{ (debug.combined.revisitChance * 100).toFixed(0) }}%</p>
            </section>

            <section class="debug-section">
              <h3>{{ t('solver.debug.plans') }}</h3>
              <div class="debug-plan-list">
                <article v-for="plan in plans" :key="plan.kind" class="debug-plan">
                  <div class="debug-plan-header">
                    <div>
                      <h4>{{ planTitle(plan) }}</h4>
                      <p>{{ t('solver.debug.startingGp') }}: {{ plan.startingGp }} GP</p>
                    </div>
                    <strong>E = {{ plan.expectedYield }}</strong>
                  </div>

                  <div class="debug-stats">
                    <span>{{ t('solver.debug.minYield') }} {{ plan.minYield }}</span>
                    <span>{{ t('solver.debug.maxYield') }} {{ plan.maxYield }}</span>
                    <span>{{ t('solver.debug.statesSolved') }} {{ plan.search.statesSolved }}</span>
                    <span>{{ t('solver.debug.memoHits') }} {{ plan.search.memoHits }}</span>
                    <span>{{ t('solver.debug.actionsEvaluated') }} {{ plan.search.actionsEvaluated }}</span>
                  </div>

                  <div class="debug-outcomes">
                    <div v-for="entry in plan.outcomeDistribution" :key="`${plan.kind}-${entry.yield}`" class="debug-outcome-row">
                      <span>{{ entry.yield }}</span>
                      <div class="debug-outcome-track">
                        <div :style="{ width: `${Math.min(100, entry.probability)}%` }"></div>
                      </div>
                      <span>{{ formatProbability(entry.probability) }}</span>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <section class="debug-section">
              <h3>{{ t('solver.debug.optimality') }}</h3>
              <p>{{ t('solver.debug.optimalityMethod') }}</p>
              <p class="debug-code">{{ stateFields }}</p>
              <p>{{ t('solver.debug.tieBreaker') }}</p>
              <p class="debug-muted">{{ t('solver.debug.caveat') }}</p>
            </section>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.debug-dialog-root {
  position: fixed;
  inset: 0;
  z-index: 95;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

.debug-dialog-backdrop {
  position: fixed;
  inset: 0;
  border: 0;
  background: rgb(15 23 42 / 0.58);
  backdrop-filter: blur(10px);
  cursor: pointer;
}

.debug-dialog-panel {
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

:global(html.dark .debug-dialog-panel) {
  border-color: rgb(51 65 85);
  background: rgb(15 23 42);
  box-shadow: 0 24px 72px rgb(0 0 0 / 0.46);
}

.debug-dialog-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

:global(html.dark .debug-dialog-header) {
  border-color: #334155;
}

.debug-dialog-kicker {
  color: #52a890;
  font-size: 0.75rem;
  font-weight: 900;
}

.debug-dialog-header h2 {
  margin: 0.25rem 0;
  color: #1e293b;
  font-size: 1.35rem;
  font-weight: 900;
}

:global(html.dark .debug-dialog-header h2) {
  color: #f8fafc;
}

.debug-dialog-header p,
.debug-muted {
  margin: 0;
  color: #64748b;
  font-size: 0.86rem;
  line-height: 1.5;
}

:global(html.dark .debug-dialog-header p),
:global(html.dark .debug-muted) {
  color: #94a3b8;
}

.debug-dialog-close {
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #f8fafc;
  color: #64748b;
}

:global(html.dark .debug-dialog-close) {
  border-color: #334155;
  background: rgb(30 41 59 / 0.78);
  color: #cbd5e1;
}

.debug-dialog-body {
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
.debug-card h4,
.debug-plan h4 {
  margin: 0;
  color: #334155;
  font-weight: 900;
}

:global(html.dark .debug-section h3),
:global(html.dark .debug-card h4),
:global(html.dark .debug-plan h4) {
  color: #e2e8f0;
}

.debug-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 0.75rem;
}

.debug-card,
.debug-plan,
.debug-section {
  min-width: 0;
}

.debug-card,
.debug-plan {
  display: grid;
  gap: 0.45rem;
  padding: 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.9rem;
  background: #f8fafc;
}

:global(html.dark .debug-card),
:global(html.dark .debug-plan) {
  border-color: #334155;
  background: rgb(2 6 23 / 0.34);
}

.debug-card p,
.debug-plan p,
.debug-card strong,
.debug-plan strong {
  margin: 0;
  color: #475569;
  font-size: 0.84rem;
  line-height: 1.45;
}

:global(html.dark .debug-card p),
:global(html.dark .debug-plan p),
:global(html.dark .debug-card strong),
:global(html.dark .debug-plan strong) {
  color: #cbd5e1;
}

.debug-code,
.debug-expression {
  overflow-wrap: anywhere;
  border-radius: 0.65rem;
  background: white;
  padding: 0.65rem;
  color: #0f766e;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 0.8rem;
}

:global(html.dark .debug-code),
:global(html.dark .debug-expression) {
  background: #020617;
  color: #99f6e4;
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

.debug-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.debug-stats span {
  border-radius: 999px;
  background: white;
  padding: 0.25rem 0.55rem;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 800;
}

:global(html.dark .debug-stats span) {
  background: rgb(15 23 42);
  color: #cbd5e1;
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

.debug-dialog-enter-active,
.debug-dialog-leave-active {
  transition: opacity 0.2s ease;
}

.debug-dialog-enter-active .debug-dialog-panel,
.debug-dialog-leave-active .debug-dialog-panel {
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

.debug-dialog-enter-from,
.debug-dialog-leave-to {
  opacity: 0;
}

.debug-dialog-enter-from .debug-dialog-panel,
.debug-dialog-leave-to .debug-dialog-panel {
  opacity: 0;
  transform: translateY(0.75rem) scale(0.98);
}
</style>
