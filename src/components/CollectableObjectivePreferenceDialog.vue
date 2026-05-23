<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import type {
  CollectableObjective,
  CollectableObjectivePresetId,
  CollectableRewardTable,
  CollectableTierScoreWeights
} from '../types/collectable';
import {
  DEFAULT_CUSTOM_TIER_WEIGHTS,
  createCollectableObjectiveOptions,
  createTierScoreObjective,
  getDefaultCollectableObjectivePresetId
} from '../utils/collectableObjectivePresets';
import {
  COLLECTABLE_INPUT_LIMITS,
  normalizeCollectableTierScoreWeights
} from '../config/inputLimits';

const props = defineProps<{
  modelValue: boolean;
  rewardTable: CollectableRewardTable | null;
  objective: CollectableObjective;
  context?: 'solver' | 'analysis';
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  change: [objective: CollectableObjective];
}>();

const { t } = useI18n();
const selectedPresetId = ref<CollectableObjectivePresetId>('highValue');
const customWeights = ref<Required<CollectableTierScoreWeights>>({ ...DEFAULT_CUSTOM_TIER_WEIGHTS });
const customTierScoreLimit = COLLECTABLE_INPUT_LIMITS.customTierScore;

const options = computed(() => props.rewardTable
  ? createCollectableObjectiveOptions(props.rewardTable, customWeights.value)
  : []);
const selectedOption = computed(() => options.value.find((option) => option.id === selectedPresetId.value));

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetDraft(props.objective);
  }
});

watch(() => props.objective, (objective) => {
  if (props.modelValue) return;
  resetDraft(objective);
}, { immediate: true, deep: true });

function resetDraft(objective: CollectableObjective) {
  selectedPresetId.value = objective.presetId ?? (objective.kind === 'scrip' ? 'scrip' : 'highValue');
  customWeights.value = normalizeCollectableTierScoreWeights(
    objective.presetId === 'customTier' ? objective.tierWeights : undefined,
    DEFAULT_CUSTOM_TIER_WEIGHTS
  );
}

watch(customWeights, (weights) => {
  const normalized = normalizeCollectableTierScoreWeights(weights, DEFAULT_CUSTOM_TIER_WEIGHTS);
  if (JSON.stringify(weights) !== JSON.stringify(normalized)) {
    customWeights.value = normalized;
  }
}, { deep: true });

watch(() => props.rewardTable, (rewardTable) => {
  if (!rewardTable) return;
  const available = createCollectableObjectiveOptions(rewardTable, customWeights.value);
  if (!available.some((option) => option.id === selectedPresetId.value)) {
    selectedPresetId.value = getDefaultCollectableObjectivePresetId(rewardTable);
  }
}, { immediate: true });

function close() {
  resetDraft(props.objective);
  emit('update:modelValue', false);
}

function selectPreset(id: CollectableObjectivePresetId) {
  selectedPresetId.value = id;
}

function applySelected() {
  if (selectedPresetId.value === 'customTier') {
    emit('change', createTierScoreObjective('customTier', customWeights.value));
    closeAfterApply();
    return;
  }

  if (selectedOption.value) {
    emit('change', selectedOption.value.objective);
    closeAfterApply();
  }
}

function closeAfterApply() {
  emit('update:modelValue', false);
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="objective-overlay" role="presentation" @click.self="close">
      <section class="objective-dialog" role="dialog" aria-modal="true" aria-labelledby="collectable-objective-title">
        <header class="objective-dialog-header">
          <div>
            <span>{{ t('collectableObjective.kicker') }}</span>
            <h2 id="collectable-objective-title">{{ t('collectableObjective.title') }}</h2>
          </div>
          <button type="button" class="dialog-close-button" :aria-label="t('collectableObjective.close')" @click="close">
            <i class="pi pi-times"></i>
          </button>
        </header>

        <p class="objective-intro">{{ t(props.context === 'analysis' ? 'collectableObjective.analysisIntro' : 'collectableObjective.solverIntro') }}</p>

        <div v-if="rewardTable" class="preset-list">
          <button
            v-for="option in options"
            :key="option.id"
            type="button"
            class="preset-option"
            :class="{ 'is-selected': selectedPresetId === option.id }"
            @click="selectPreset(option.id)"
          >
            <span>{{ t(option.labelKey) }}</span>
            <small>{{ t(option.descKey) }}</small>
          </button>
        </div>

        <div v-if="selectedPresetId === 'customTier'" class="custom-weight-grid">
          <label>
            <span>{{ t('collectableObjective.tiers.none') }}</span>
            <input v-model.number="customWeights.none" type="number" :min="customTierScoreLimit.min" :max="customTierScoreLimit.max" />
          </label>
          <label>
            <span>{{ t('collectableObjective.tiers.low') }}</span>
            <input v-model.number="customWeights.low" type="number" :min="customTierScoreLimit.min" :max="customTierScoreLimit.max" />
          </label>
          <label>
            <span>{{ t('collectableObjective.tiers.mid') }}</span>
            <input v-model.number="customWeights.mid" type="number" :min="customTierScoreLimit.min" :max="customTierScoreLimit.max" />
          </label>
          <label>
            <span>{{ t('collectableObjective.tiers.high') }}</span>
            <input v-model.number="customWeights.high" type="number" :min="customTierScoreLimit.min" :max="customTierScoreLimit.max" />
          </label>
        </div>

        <footer class="objective-dialog-actions">
          <Button class="p-button-sm rounded-xl p-button-text" :label="t('collectableObjective.cancel')" icon="pi pi-times" @click="close" />
          <Button class="p-button-sm rounded-xl" :label="t('collectableObjective.apply')" icon="pi pi-check" @click="applySelected" />
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.objective-overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  background: rgb(15 23 42 / 0.42);
  padding: 5rem 1rem 2rem;
}

.objective-dialog {
  width: min(100%, 29rem);
  display: grid;
  gap: 1rem;
  border: 1px solid #d1fae5;
  border-radius: 1rem;
  background: white;
  padding: 1.1rem;
  box-shadow: 0 24px 60px rgb(15 23 42 / 0.22);
}

:global(html.dark .objective-dialog) {
  border-color: #334155;
  background: #0f172a;
}

.objective-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.objective-dialog-header span {
  color: #3f8f79;
  font-size: 0.72rem;
  font-weight: 900;
}

.objective-dialog-header h2 {
  margin: 0.15rem 0 0;
  color: #0f172a;
  font-size: 1.25rem;
  font-weight: 950;
}

:global(html.dark .objective-dialog-header h2) {
  color: #f8fafc;
}

.dialog-close-button {
  width: 2.2rem;
  height: 2.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d1fae5;
  border-radius: 0.75rem;
  background: #f0fdf4;
  color: #0f766e;
}

:global(html.dark .dialog-close-button) {
  border-color: #334155;
  background: rgb(2 6 23 / 0.62);
  color: #99f6e4;
}

.objective-intro {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.55;
}

:global(html.dark .objective-intro) {
  color: #94a3b8;
}

.preset-list,
.custom-weight-grid {
  display: grid;
  gap: 0.65rem;
}

.objective-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 0.85rem;
}

:global(html.dark .objective-dialog-actions) {
  border-top-color: #334155;
}

.preset-option {
  display: grid;
  gap: 0.2rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.8rem;
  background: #f8fafc;
  padding: 0.75rem 0.85rem;
  text-align: left;
}

.preset-option.is-selected {
  border-color: #52a890;
  background: #ecfdf5;
  box-shadow: 0 0 0 3px rgb(82 168 144 / 0.13);
}

:global(html.dark .preset-option) {
  border-color: #334155;
  background: rgb(2 6 23 / 0.42);
}

:global(html.dark .preset-option.is-selected) {
  border-color: #5eead4;
  background: rgb(20 83 45 / 0.28);
}

.preset-option span,
.custom-weight-grid span {
  color: #0f172a;
  font-weight: 900;
}

:global(html.dark .preset-option span),
:global(html.dark .custom-weight-grid span) {
  color: #f8fafc;
}

.preset-option small {
  color: #64748b;
  line-height: 1.35;
}

:global(html.dark .preset-option small) {
  color: #94a3b8;
}

.custom-weight-grid label {
  display: grid;
  grid-template-columns: minmax(6rem, 1fr) minmax(0, 8rem);
  align-items: center;
  gap: 0.75rem;
}

.custom-weight-grid input {
  width: 100%;
  border: 1px solid #d1fae5;
  border-radius: 0.65rem;
  padding: 0.55rem 0.65rem;
  color: #0f172a;
}

:global(html.dark .custom-weight-grid input) {
  border-color: #334155;
  background: rgb(2 6 23 / 0.62);
  color: #f8fafc;
}
</style>
