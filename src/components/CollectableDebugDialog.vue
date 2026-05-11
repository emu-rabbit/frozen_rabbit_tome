<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CollectableSolverDebugInfo } from '../types/collectable';

const props = defineProps<{
  modelValue: boolean;
  debug: CollectableSolverDebugInfo | null | undefined;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { t } = useI18n();
const stateFields = computed(() => props.debug?.optimality.stateKeyFields.join(', ') ?? '');

function closeDialog() {
  emit('update:modelValue', false);
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
                  <p>{{ t('collectableSolver.debug.meticulousRate') }}: {{ debug.formulas.collectable.meticulousRate }}% / {{ debug.formulas.collectable.primedMeticulousRate }}%</p>
                  <p>{{ t('collectableSolver.debug.scrutiny') }}: {{ debug.formulas.collectable.scrutinyMultiplier }}%, +{{ debug.formulas.collectable.scrutinyBonus }}</p>
                  <strong>{{ t('collectableSolver.debug.standardRate') }}: {{ (debug.formulas.collectable.standardProcRate * 100).toFixed(0) }}%</strong>
                </article>
                <article class="debug-card">
                  <h4>{{ t('collectableSolver.debug.rewardTable') }}</h4>
                  <p>{{ t('collectableSolver.debug.low') }}: {{ debug.formulas.rewardTable.lowCollectability }}</p>
                  <p>{{ t('collectableSolver.debug.mid') }}: {{ debug.formulas.rewardTable.midCollectability }}</p>
                  <p>{{ t('collectableSolver.debug.high') }}: {{ debug.formulas.rewardTable.highCollectability ?? '-' }}</p>
                </article>
              </div>
            </section>

            <section class="debug-section">
              <h3>{{ t('collectableSolver.debug.search') }}</h3>
              <div class="debug-stats">
                <span>{{ t('solver.debug.statesSolved') }} {{ debug.search.statesSolved }}</span>
                <span>{{ t('solver.debug.memoHits') }} {{ debug.search.memoHits }}</span>
                <span>{{ t('solver.debug.actionsEvaluated') }} {{ debug.search.actionsEvaluated }}</span>
                <span>{{ t('collectableSolver.debug.branchCount') }} {{ debug.search.branchCount }}</span>
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
              <p class="debug-code">{{ stateFields }}</p>
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

.debug-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
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
</style>
