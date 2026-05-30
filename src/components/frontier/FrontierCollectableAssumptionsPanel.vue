<script setup lang="ts">
import { computed, ref } from 'vue';
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
const isBrazenDialogOpen = ref(false);

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

    <div class="frontier-assumption-cards">
      <article class="frontier-assumption-card">
        <div class="assumption-card-copy">
          <span class="assumption-card-icon"><i class="pi pi-bolt"></i></span>
          <div>
            <h3>{{ t('frontier.profile.highStandardRate') }}</h3>
            <p>{{ t('frontier.profile.highStandardDescription') }}</p>
          </div>
        </div>
        <label class="assumption-card-control">
          <InputNumber :model-value="profile.highStandardProcRatePercent" suffix="%" :min="0" :max="100" fluid @update:model-value="updateHighStandardRate" />
        </label>
      </article>

      <article class="frontier-assumption-card" :class="{ 'has-warning': !validation.valid }">
        <div class="assumption-card-copy">
          <span class="assumption-card-icon"><i class="pi pi-sliders-h"></i></span>
          <div>
            <h3>{{ t('frontier.profile.brazenTitle') }}</h3>
            <p>{{ t('frontier.profile.brazenShortDescription') }}</p>
          </div>
        </div>
        <div class="assumption-card-control assumption-card-control-action">
          <Button icon="pi pi-sliders-h" :label="t('frontier.profile.editBrazen')" class="p-button-sm p-button-outlined rounded-xl assumption-card-action" @click="isBrazenDialogOpen = true" />
        </div>
        <p v-if="!validation.valid" class="warning-text">{{ t('frontier.profile.invalidTotal') }} {{ validation.totalProbabilityPercent.toFixed(2) }}%</p>
      </article>
    </div>

    <Teleport to="body">
      <Transition name="frontier-brazen-dialog">
        <div
          v-if="isBrazenDialogOpen"
          class="frontier-brazen-dialog"
          role="dialog"
          aria-modal="true"
          :aria-label="t('frontier.profile.brazenTitle')"
        >
          <button
            type="button"
            class="frontier-brazen-backdrop"
            :aria-label="t('common.close')"
            @click="isBrazenDialogOpen = false"
          ></button>
          <section class="frontier-brazen-panel">
            <header class="frontier-brazen-panel-header">
              <div>
                <h3>{{ t('frontier.profile.brazenTitle') }}</h3>
                <p>{{ t('frontier.profile.brazenDescription') }}</p>
              </div>
              <button
                type="button"
                class="icon-button close-button"
                :aria-label="t('common.close')"
                @click="isBrazenDialogOpen = false"
              >
                <i class="pi pi-times"></i>
              </button>
            </header>

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
            <footer class="frontier-brazen-panel-actions">
              <Button :label="t('common.done')" icon="pi pi-check" class="p-button-sm rounded-xl" @click="isBrazenDialogOpen = false" />
            </footer>
          </section>
        </div>
      </Transition>
    </Teleport>
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

.frontier-assumption-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 21rem), 1fr));
  gap: 0.75rem;
}

.frontier-assumption-card {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.8rem;
  align-content: start;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  background: #f8fafc;
  padding: 0.9rem;
}

.frontier-assumption-card.has-warning {
  border-color: rgb(225 29 72 / 0.24);
  background: #fff7f7;
}

.assumption-card-copy {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
}

.assumption-card-icon {
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 0.75rem;
  background: #ecfdf5;
  color: #299273;
}

.assumption-card-copy h3,
.frontier-brazen-panel h3 {
  margin: 0;
  color: #334155;
  font-size: 0.98rem;
  font-weight: 900;
}

.assumption-card-copy p,
.frontier-brazen-panel p {
  margin: 0.2rem 0 0;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.45;
}

.assumption-card-control,
.frontier-bucket-row label {
  min-width: 0;
  display: grid;
  gap: 0.35rem;
}

.assumption-card-control span,
.frontier-bucket-row span,
.summary-grid span,
.assumption-card-summary span {
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 900;
}

.assumption-card-control :deep(.p-inputnumber),
.assumption-card-control :deep(input),
.frontier-bucket-row :deep(.p-inputnumber),
.frontier-bucket-row :deep(input) {
  width: 100% !important;
  min-width: 0 !important;
}

.assumption-card-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

.assumption-card-summary div {
  min-width: 0;
  display: grid;
  gap: 0.3rem;
  border-radius: 0.85rem;
  background: white;
  padding: 0.62rem 0.7rem;
}

.assumption-card-summary strong {
  color: #0f172a;
  font-size: 1.18rem;
  font-weight: 950;
  line-height: 1;
}

.assumption-card-action {
  justify-self: start;
}

.assumption-card-control-action {
  align-self: end;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
  align-items: stretch;
}

.summary-grid div {
  min-width: 0;
  min-height: 4.1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.4rem;
  border: 1px solid transparent;
  border-radius: 0.85rem;
  background: white;
  padding: 0.62rem 0.7rem;
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
  font-size: 1.18rem;
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

.frontier-brazen-dialog {
  position: fixed;
  inset: 0;
  z-index: 95;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.frontier-brazen-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgb(15 23 42 / 0.48);
  cursor: pointer;
}

.frontier-brazen-panel {
  position: relative;
  z-index: 1;
  width: min(100%, 42rem);
  max-height: min(88vh, 45rem);
  overflow: auto;
  display: grid;
  gap: 1rem;
  border: 1px solid #dbe3ee;
  border-radius: 1rem;
  background: white;
  padding: 1rem;
  box-shadow: 0 24px 60px rgb(15 23 42 / 0.22);
}

.frontier-brazen-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
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

.close-button {
  flex: 0 0 auto;
}

.frontier-brazen-panel-actions {
  display: flex;
  justify-content: flex-end;
}

.warning-text {
  margin: 0;
  color: #be123c;
  font-weight: 900;
}

:global(html.dark .frontier-assumption-card),
:global(html.dark .frontier-brazen-panel) {
  border-color: #334155;
  background: #0f172a;
}

:global(html.dark .frontier-assumption-card.has-warning) {
  border-color: rgb(251 113 133 / 0.28);
  background: rgb(76 29 29 / 0.22);
}

:global(html.dark .assumption-card-icon) {
  background: rgb(20 83 45 / 0.28);
  color: #86efac;
}

:global(html.dark .assumption-card-summary div) {
  background: rgb(30 41 59 / 0.55);
}

:global(html.dark .assumption-card-summary strong) {
  color: #f8fafc;
}

:global(html.dark .frontier-assumption-card h3),
:global(html.dark .frontier-brazen-panel h3) {
  color: #f8fafc;
}

:global(html.dark .frontier-assumption-card p),
:global(html.dark .frontier-brazen-panel p) {
  color: #94a3b8;
}

.frontier-brazen-dialog-enter-active,
.frontier-brazen-dialog-leave-active {
  transition: opacity 0.18s ease;
}

.frontier-brazen-dialog-enter-active .frontier-brazen-panel,
.frontier-brazen-dialog-leave-active .frontier-brazen-panel {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.frontier-brazen-dialog-enter-from,
.frontier-brazen-dialog-leave-to {
  opacity: 0;
}

.frontier-brazen-dialog-enter-from .frontier-brazen-panel,
.frontier-brazen-dialog-leave-to .frontier-brazen-panel {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

@media (max-width: 560px) {
  .frontier-bucket-row,
  .summary-grid,
  .assumption-card-summary {
    grid-template-columns: 1fr;
  }

  .frontier-brazen-panel {
    padding: 0.9rem;
  }
}
</style>
