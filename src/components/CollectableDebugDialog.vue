<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { CollectableDebugInfo } from '../types/collectable';

const props = defineProps<{
  modelValue: boolean;
  debug: CollectableDebugInfo | null | undefined;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { t } = useI18n();

function closeDialog() {
  emit('update:modelValue', false);
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
        aria-label="Collectable Solver Debug"
        @keydown.esc="closeDialog"
      >
        <button
          class="debug-dialog-backdrop"
          type="button"
          aria-label="Close debug dialog"
          @click="closeDialog"
        ></button>

        <section class="debug-dialog-panel">
          <header class="debug-dialog-header">
            <div>
              <span class="debug-dialog-kicker">Collectable Debug</span>
              <h2>收藏品求解器偵錯資訊</h2>
              <p>公式計算過程、求解統計與報酬門檻。</p>
            </div>
            <button class="debug-dialog-close" type="button" aria-label="Close" @click="closeDialog">
              <i class="pi pi-times"></i>
            </button>
          </header>

          <div class="debug-dialog-body">
            <!-- Formulas -->
            <section class="debug-section">
              <h3>公式計算</h3>
              <div class="debug-grid">
                <article class="debug-card">
                  <h4>分數 (Gathering)</h4>
                  <p>ActionScore = min(95, floor(100 × {{ debug.playerStats.gathering }} / {{ debug.baseStats.baseGathering }})) = {{ debug.formulas.actionScore }}</p>
                  <p>RateScore = min(100, floor(100 × {{ debug.playerStats.gathering }} / {{ debug.baseStats.baseGathering }})) = {{ debug.formulas.rateScore }}</p>
                </article>

                <article class="debug-card">
                  <h4>分數 (Perception)</h4>
                  <p>ActionScore = min(95, floor(100 × {{ debug.playerStats.perception }} / {{ debug.baseStats.basePerception }})) = {{ debug.formulas.perceptionActionScore }}</p>
                </article>

                <article class="debug-card">
                  <h4>Scour Value</h4>
                  <strong>{{ debug.formulas.scourValue }}</strong>
                  <p class="debug-muted">值域 [150, 200]</p>
                </article>

                <article class="debug-card">
                  <h4>Value Increase Rate</h4>
                  <strong>{{ debug.formulas.valueIncreaseRate }}%</strong>
                  <p>Collector's Focus: <strong>{{ debug.formulas.collectorsFocusRate }}%</strong></p>
                  <p class="debug-muted">值域 [10%, 40%]</p>
                </article>

                <article class="debug-card">
                  <h4>Meticulous No-Dur Rate</h4>
                  <strong>{{ debug.formulas.meticulousNoDurRate }}%</strong>
                  <p>Priming Touch: <strong>{{ debug.formulas.primingTouchRate }}%</strong></p>
                  <p class="debug-muted">值域 [5%, 25%]</p>
                </article>

                <article class="debug-card">
                  <h4>Scrutiny Multiplier</h4>
                  <strong>{{ debug.formulas.scrutinyMultiplier }}</strong>
                  <p>scrutinyBonus = floor({{ debug.formulas.scourValue }} × {{ debug.formulas.scrutinyMultiplier }} / 100) = {{ debug.formulas.scrutinyBonus }}</p>
                  <p>valueBonus = floor({{ debug.formulas.scourValue }} × 50 / 100) = {{ debug.formulas.valueBonus }}</p>
                  <p class="debug-muted">倍率值域 [90, 125]</p>
                </article>
              </div>
            </section>

            <!-- Reward thresholds -->
            <section class="debug-section">
              <h3>報酬門檻</h3>
              <div class="debug-grid">
                <article class="debug-card">
                  <h4>門檻</h4>
                  <p>低門檻：<strong>{{ debug.rewardThresholds.low }}</strong></p>
                  <p>中門檻：<strong>{{ debug.rewardThresholds.mid }}</strong></p>
                  <p v-if="debug.rewardThresholds.high > 0">高門檻：<strong>{{ debug.rewardThresholds.high }}</strong></p>
                </article>
                <article class="debug-card">
                  <h4>票券</h4>
                  <p>低：<strong>{{ debug.rewardThresholds.rewards.low.scrip }}</strong></p>
                  <p>中：<strong>{{ debug.rewardThresholds.rewards.mid.scrip }}</strong></p>
                  <p v-if="debug.rewardThresholds.high > 0">高：<strong>{{ debug.rewardThresholds.rewards.high.scrip }}</strong></p>
                </article>
                <article class="debug-card">
                  <h4>Collector's Standard 觸發率</h4>
                  <strong>{{ debug.standardProcRate }}%</strong>
                </article>
              </div>
            </section>

            <!-- Search stats -->
            <section class="debug-section">
              <h3>求解統計</h3>
              <div class="debug-stats">
                <span>探索狀態數 {{ debug.statesExplored }}</span>
                <span>Memo 命中 {{ debug.memoHits }}</span>
              </div>
            </section>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Reuse the exact same styles as SolverDebugDialog.vue */
.debug-dialog-root {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

@media (min-width: 640px) {
  .debug-dialog-root {
    align-items: center;
  }
}

.debug-dialog-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  border: none;
  cursor: pointer;
}

.debug-dialog-panel {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 680px;
  max-height: 90dvh;
  overflow-y: auto;
  border-radius: 24px 24px 0 0;
  background: #0f172a;
  color: #e2e8f0;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

@media (min-width: 640px) {
  .debug-dialog-panel {
    border-radius: 24px;
    max-height: 85dvh;
  }
}

.debug-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}

.debug-dialog-kicker {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #52a890;
  margin-bottom: 0.25rem;
}

.debug-dialog-header h2 {
  font-size: 1.1rem;
  font-weight: 800;
  color: #f1f5f9;
  margin: 0 0 0.25rem;
}

.debug-dialog-header p {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
}

.debug-dialog-close {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #94a3b8;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}

.debug-dialog-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
}

.debug-dialog-body {
  padding: 1.25rem 1.5rem 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.debug-section h3 {
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #52a890;
  margin: 0 0 0.75rem;
}

.debug-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.debug-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.debug-card h4 {
  font-size: 0.72rem;
  font-weight: 800;
  color: #94a3b8;
  margin: 0 0 0.3rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.debug-card p {
  font-size: 0.8rem;
  color: #cbd5e1;
  margin: 0;
  line-height: 1.5;
}

.debug-card strong {
  font-size: 0.88rem;
  color: #f1f5f9;
}

.debug-muted {
  color: #475569 !important;
  font-size: 0.72rem !important;
}

.debug-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.debug-stats span {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.3rem 0.75rem;
  font-size: 0.78rem;
  color: #94a3b8;
}

/* Dialog transition */
.debug-dialog-enter-active,
.debug-dialog-leave-active {
  transition: opacity 0.2s ease;
}
.debug-dialog-enter-active .debug-dialog-panel,
.debug-dialog-leave-active .debug-dialog-panel {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.debug-dialog-enter-from,
.debug-dialog-leave-to {
  opacity: 0;
}

.debug-dialog-enter-from .debug-dialog-panel,
.debug-dialog-leave-to .debug-dialog-panel {
  transform: translateY(24px);
}

@media (min-width: 640px) {
  .debug-dialog-enter-from .debug-dialog-panel,
  .debug-dialog-leave-to .debug-dialog-panel {
    transform: scale(0.96) translateY(8px);
  }
}
</style>
