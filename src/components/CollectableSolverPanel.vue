<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import type { GatherableItem, NodeBonuses, PlayerStats } from '../types/game';
import type { CollectableSolverResult } from '../types/collectable';
import { useCollectableSolver } from '../composables/useCollectableSolver';
import CollectablePolicyView from './CollectablePolicyView.vue';
import CollectableDebugDialog from './CollectableDebugDialog.vue';

const props = defineProps<{
  activeItem: GatherableItem;
  effectiveStats: PlayerStats;
  baseValues: { Gathering: number; Perception: number } | null;
  itemRealLevel: number;
  nodeBonuses: NodeBonuses;
  temporaryGp: number;
  debugMode: boolean;
}>();

const emit = defineEmits<{
  save: [result: CollectableSolverResult];
}>();

const { t } = useI18n();
const {
  collectableResult,
  isCollectableSolving,
  collectableError,
  solveCollectable,
  clearCollectableResult
} = useCollectableSolver();
const isDebugDialogOpen = ref(false);
const isSaved = ref(false);
let savedTimer: ReturnType<typeof window.setTimeout> | null = null;

const canSolve = computed(() => !!props.baseValues && !!props.activeItem.itemId);

watch(() => [
  props.activeItem.itemId,
  props.effectiveStats.level,
  props.effectiveStats.gathering,
  props.effectiveStats.perception,
  props.effectiveStats.gp,
  props.temporaryGp,
  props.nodeBonuses.baseIntegrity,
  props.nodeBonuses.gatheringCount
], () => {
  clearCollectableResult();
  isSaved.value = false;
}, { deep: true });

async function handleSolve() {
  if (!props.baseValues || !canSolve.value) return;

  await solveCollectable({
    activeItem: props.activeItem,
    stats: { ...props.effectiveStats },
    baseValues: {
      Gathering: props.baseValues.Gathering,
      Perception: props.baseValues.Perception
    },
    itemLevel: props.itemRealLevel,
    nodeBonuses: { ...props.nodeBonuses },
    temporaryGp: Math.min(props.temporaryGp, props.effectiveStats.gp),
    debugMode: props.debugMode
  });
}

function handleSave() {
  if (!collectableResult.value || isSaved.value) return;

  emit('save', collectableResult.value);
  isSaved.value = true;
  if (savedTimer) {
    window.clearTimeout(savedTimer);
  }
  savedTimer = window.setTimeout(() => {
    isSaved.value = false;
    savedTimer = null;
  }, 1600);
}
</script>

<template>
  <div class="collectable-panel">
    <header class="collectable-panel-header">
      <div>
        <span>{{ t('collectableSolver.badge') }}</span>
        <h2>{{ t('collectableSolver.title') }}</h2>
        <p>{{ t('collectableSolver.description') }}</p>
      </div>
      <Button
        class="p-button-primary collectable-solve-button"
        :label="t('collectableSolver.actions.solve')"
        :icon="isCollectableSolving ? 'pi pi-spin pi-spinner' : 'pi pi-play'"
        :loading="isCollectableSolving"
        :disabled="!canSolve"
        @click="handleSolve"
      />
    </header>

    <div v-if="collectableError" class="collectable-alert" role="alert">
      <i class="pi pi-exclamation-circle"></i>
      <div>
        <strong>{{ t(`collectableSolver.errors.${collectableError}.title`) }}</strong>
        <p>{{ t(`collectableSolver.errors.${collectableError}.desc`) }}</p>
      </div>
    </div>

    <div v-if="collectableResult" class="collectable-result">
      <div class="collectable-toolbar">
        <button
          v-if="debugMode && collectableResult.debug"
          type="button"
          class="collectable-tool-button"
          :title="t('collectableSolver.debug.open')"
          :aria-label="t('collectableSolver.debug.open')"
          @click="isDebugDialogOpen = true"
        >
          <i class="pi pi-info-circle"></i>
        </button>
        <Button
          class="p-button-outlined collectable-save-button"
          :icon="isSaved ? 'pi pi-check' : 'pi pi-bookmark'"
          :label="isSaved ? t('solver.strategy.savedTome') : t('solver.strategy.saveTome')"
          :disabled="isSaved"
          @click="handleSave"
        />
      </div>

      <CollectablePolicyView
        :policy="collectableResult.policy"
        :expected-reward="collectableResult.expectedReward"
        :expected-score="collectableResult.expectedScore"
        :job-type="activeItem.jobType || 'miner'"
      />
    </div>

    <div v-else-if="isCollectableSolving" class="collectable-empty">
      <i class="pi pi-spin pi-spinner"></i>
      <p>{{ t('collectableSolver.solving') }}</p>
    </div>

    <div v-else class="collectable-empty">
      <i class="pi pi-sitemap"></i>
      <p>{{ t('collectableSolver.empty') }}</p>
    </div>

    <CollectableDebugDialog v-model="isDebugDialogOpen" :debug="collectableResult?.debug" />
  </div>
</template>

<style scoped>
.collectable-panel {
  display: grid;
  gap: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  background: white;
  padding: 1.25rem;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
}

:global(html.dark .collectable-panel) {
  border-color: #1e293b;
  background: rgb(15 23 42);
}

.collectable-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.collectable-panel-header span {
  color: #52a890;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
}

.collectable-panel-header h2 {
  margin: 0.25rem 0;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 900;
}

:global(html.dark .collectable-panel-header h2) {
  color: #f8fafc;
}

.collectable-panel-header p,
.collectable-alert p,
.collectable-empty p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.5;
}

:global(html.dark .collectable-panel-header p),
:global(html.dark .collectable-alert p),
:global(html.dark .collectable-empty p) {
  color: #94a3b8;
}

.collectable-solve-button,
.collectable-save-button {
  flex-shrink: 0;
  border-radius: 0.85rem;
}

.collectable-alert {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  border: 1px solid #fed7aa;
  border-radius: 0.85rem;
  background: #fff7ed;
  padding: 0.9rem;
  color: #c2410c;
}

:global(html.dark .collectable-alert) {
  border-color: rgb(154 52 18 / 0.6);
  background: rgb(67 20 7 / 0.34);
  color: #fdba74;
}

.collectable-alert strong {
  display: block;
  margin-bottom: 0.15rem;
}

.collectable-result {
  display: grid;
  gap: 0.85rem;
}

.collectable-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.collectable-tool-button {
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid #d1fae5;
  border-radius: 0.85rem;
  background: #f0fdf4;
  color: #0f766e;
}

:global(html.dark .collectable-tool-button) {
  border-color: rgb(51 65 85);
  background: rgb(2 6 23 / 0.38);
  color: #99f6e4;
}

.collectable-empty {
  display: grid;
  justify-items: center;
  gap: 0.6rem;
  border: 2px dashed #e2e8f0;
  border-radius: 1rem;
  padding: 2.5rem 1rem;
  text-align: center;
}

:global(html.dark .collectable-empty) {
  border-color: #334155;
}

.collectable-empty i {
  color: #94a3b8;
  font-size: 2rem;
}

@media (max-width: 640px) {
  .collectable-panel-header,
  .collectable-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
