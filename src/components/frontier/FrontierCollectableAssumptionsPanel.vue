<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import {
  DEFAULT_FRONTIER_BRAZEN_BUCKETS,
  normalizeFrontierBrazenBuckets,
  validateFrontierProbabilityProfile
} from '../../frontier/collectable/frontierCollectableProbabilityProfile';
import type { FrontierCollectableProbabilityProfile } from '../../frontier/collectable/frontierCollectableTypes';

const profile = defineModel<FrontierCollectableProbabilityProfile>({ required: true });

const { t } = useI18n();

const validation = computed(() => validateFrontierProbabilityProfile(profile.value));

function updateStandardRate(value: number | null) {
  profile.value = {
    ...profile.value,
    standardProcRatePercent: clampPercent(value ?? 0)
  };
}

function updateHighStandardRate(value: number | null) {
  profile.value = {
    ...profile.value,
    highStandardProcRatePercent: value === null ? null : clampPercent(value)
  };
}

function updateBucket(index: number, patch: { multiplierPercent?: number; probabilityPercent?: number }) {
  profile.value = {
    ...profile.value,
    brazenBuckets: profile.value.brazenBuckets.map((bucket, bucketIndex) => (
      bucketIndex === index ? { ...bucket, ...patch } : bucket
    ))
  };
}

function addBucket() {
  profile.value = {
    ...profile.value,
    brazenBuckets: [
      ...profile.value.brazenBuckets,
      {
        id: `bucket-${Date.now()}`,
        multiplierPercent: 100,
        probabilityPercent: 0
      }
    ]
  };
}

function removeBucket(index: number) {
  profile.value = {
    ...profile.value,
    brazenBuckets: profile.value.brazenBuckets.filter((_, bucketIndex) => bucketIndex !== index)
  };
}

function applyDefaultBrazenTemplate() {
  profile.value = {
    ...profile.value,
    brazenBuckets: DEFAULT_FRONTIER_BRAZEN_BUCKETS.map((bucket) => ({ ...bucket }))
  };
}

function normalizeBrazenBuckets() {
  profile.value = {
    ...profile.value,
    brazenBuckets: normalizeFrontierBrazenBuckets(profile.value.brazenBuckets)
  };
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
</script>

<template>
  <section class="collectable-analysis-panel frontier-assumption-panel">
    <div class="analysis-header">
      <div>
        <div class="analysis-title">
          <i class="pi pi-percentage"></i>
          <h2>{{ t('frontier.profile.title') }}</h2>
        </div>
        <p>{{ t('frontier.profile.description') }}</p>
        <div class="analysis-scope-note" role="note">
          <i class="pi pi-info-circle"></i>
          <span>{{ t('frontier.workspace.assumptionNote') }}</span>
        </div>
      </div>
    </div>

    <div class="frontier-assumption-grid">
      <label>
        <span>{{ t('frontier.profile.standardRate') }}</span>
        <InputNumber :model-value="profile.standardProcRatePercent" suffix="%" :min="0" :max="100" fluid @update:model-value="updateStandardRate" />
      </label>
      <label>
        <span>{{ t('frontier.profile.highStandardRate') }}</span>
        <InputNumber :model-value="profile.highStandardProcRatePercent" suffix="%" :min="0" :max="100" fluid @update:model-value="updateHighStandardRate" />
      </label>
    </div>

    <article class="analysis-card frontier-brazen-card">
      <div class="frontier-brazen-header">
        <div>
          <h3>{{ t('frontier.profile.brazenTitle') }}</h3>
          <p>{{ t('frontier.profile.brazenDescription') }}</p>
        </div>
        <div class="summary-grid compact">
          <div>
            <span>{{ t('frontier.profile.bucketCount') }}</span>
            <strong>{{ profile.brazenBuckets.length }}</strong>
          </div>
          <div :class="{ warning: !validation.valid }">
            <span>{{ t('frontier.profile.totalRate') }}</span>
            <strong>{{ validation.totalProbabilityPercent.toFixed(2) }}%</strong>
          </div>
          <div>
            <span>{{ t('frontier.profile.average') }}</span>
            <strong>{{ validation.averageMultiplierPercent.toFixed(2) }}%</strong>
          </div>
        </div>
      </div>
      <div class="frontier-brazen-tools">
        <Button icon="pi pi-plus" :label="t('frontier.profile.addBucket')" class="p-button-sm p-button-outlined rounded-xl" @click="addBucket" />
        <Button icon="pi pi-table" :label="t('frontier.profile.applyTemplate')" class="p-button-sm p-button-outlined rounded-xl" @click="applyDefaultBrazenTemplate" />
        <Button icon="pi pi-percentage" :label="t('frontier.profile.normalize')" class="p-button-sm p-button-outlined rounded-xl" @click="normalizeBrazenBuckets" />
      </div>
      <p v-if="!validation.valid" class="warning-text">{{ t('frontier.profile.invalidTotal') }}</p>
      <div class="frontier-bucket-list">
        <div v-for="(bucket, index) in profile.brazenBuckets" :key="bucket.id" class="frontier-bucket-row">
          <label>
            <span>{{ t('frontier.profile.multiplier') }}</span>
            <InputNumber :model-value="bucket.multiplierPercent" suffix="%" :min="50" :max="150" :min-fraction-digits="0" :max-fraction-digits="2" fluid @update:model-value="updateBucket(index, { multiplierPercent: Number($event ?? 0) })" />
          </label>
          <label>
            <span>{{ t('frontier.profile.probability') }}</span>
            <InputNumber :model-value="bucket.probabilityPercent" suffix="%" :min="0" :max="100" :min-fraction-digits="0" :max-fraction-digits="2" fluid @update:model-value="updateBucket(index, { probabilityPercent: Number($event ?? 0) })" />
          </label>
          <button type="button" class="icon-button" :aria-label="t('frontier.profile.removeBucket')" @click="removeBucket(index)">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.collectable-analysis-panel {
  display: grid;
  gap: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  background: white;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgb(15 23 42 / 0.04);
}

:global(html.dark .collectable-analysis-panel),
:global(html.dark .analysis-card) {
  border-color: #334155;
  background: #0f172a;
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

:global(html.dark .analysis-title h2),
:global(html.dark .analysis-card h3) {
  color: #f8fafc;
}

.analysis-header p,
.analysis-card p {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.5;
}

:global(html.dark .analysis-header p),
:global(html.dark .analysis-card p) {
  color: #94a3b8;
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

.frontier-assumption-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
  gap: 0.75rem;
}

.frontier-assumption-grid label,
.frontier-bucket-row label {
  min-width: 0;
  display: grid;
  gap: 0.35rem;
}

.frontier-assumption-grid span,
.frontier-bucket-row span,
.summary-grid span {
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 900;
}

.frontier-assumption-grid :deep(.p-inputnumber),
.frontier-assumption-grid :deep(input),
.frontier-bucket-row :deep(.p-inputnumber),
.frontier-bucket-row :deep(input) {
  width: 100% !important;
  min-width: 0 !important;
}

.analysis-card {
  display: grid;
  gap: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  background: #f8fafc;
  padding: 1.25rem;
}

.frontier-brazen-card {
  display: grid;
  gap: 1rem;
}

.frontier-brazen-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.85rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  background: white;
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

.frontier-brazen-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.frontier-bucket-list {
  display: grid;
  gap: 0.6rem;
}

.frontier-bucket-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 0.65rem;
  align-items: end;
  border: 1px solid #e2e8f0;
  border-radius: 0.85rem;
  background: #f8fafc;
  padding: 0.75rem;
}

:global(html.dark .frontier-bucket-row) {
  border-color: #334155;
  background: rgb(30 41 59 / 0.55);
}

.icon-button {
  width: 2.35rem;
  height: 2.35rem;
  border: 0;
  border-radius: 10px;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
}

:global(html.dark .icon-button) {
  background: #1e293b;
  color: #cbd5e1;
}

.warning-text {
  margin: 0;
  color: #be123c;
  font-weight: 900;
}

@media (min-width: 860px) {
  .frontier-brazen-header {
    grid-template-columns: minmax(0, 1fr) minmax(20rem, 0.64fr);
    align-items: start;
  }
}

@media (max-width: 560px) {
  .frontier-bucket-row,
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
