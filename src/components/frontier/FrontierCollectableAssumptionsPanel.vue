<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import {
  FRONTIER_BRAZEN_BUCKET_COUNTS,
  createFrontierBrazenBuckets,
  detectFrontierBrazenBucketOptions
} from '../../frontier/collectable/frontierCollectableProbabilityProfile';
import type {
  FrontierBrazenBucketCount,
  FrontierBrazenDistributionCurve,
  FrontierCollectableProbabilityProfile
} from '../../frontier/collectable/frontierCollectableTypes';

const profile = defineModel<FrontierCollectableProbabilityProfile>({ required: true });

const { t } = useI18n();

const detectedBrazenOptions = detectFrontierBrazenBucketOptions(profile.value.brazenBuckets);
const selectedBrazenCurve = ref<FrontierBrazenDistributionCurve>(detectedBrazenOptions?.curve ?? 'uniform');
const selectedBrazenBucketCount = ref<FrontierBrazenBucketCount>(detectedBrazenOptions?.bucketCount ?? normalizeBucketCount(profile.value.brazenBuckets.length));
let isApplyingBrazenOptions = false;

type CurveOption = {
  value: FrontierBrazenDistributionCurve;
  label: string;
  description: string;
  iconValues: number[];
};

const curveIconValues: Record<FrontierBrazenDistributionCurve, number[]> = {
  uniform: [20, 20, 20, 20, 20],
  triangular: [10, 20, 40, 20, 10],
  normal: [6, 24, 40, 24, 6],
  skewLow: [40, 25, 18, 11, 6],
  skewHigh: [6, 11, 18, 25, 40],
  uShape: [30, 10, 4, 10, 30]
};

const brazenCurveOptions = computed<CurveOption[]>(() => [
  buildCurveOption('uniform'),
  buildCurveOption('triangular'),
  buildCurveOption('normal'),
  buildCurveOption('skewLow'),
  buildCurveOption('skewHigh'),
  buildCurveOption('uShape')
]);

const brazenBucketCountOptions = computed(() => FRONTIER_BRAZEN_BUCKET_COUNTS.map((count) => ({
  label: t('frontier.profile.granularityOption', { count }),
  value: count
})));

applyBrazenOptions();

watch(
  () => profile.value.brazenBuckets,
  (buckets) => {
    if (isApplyingBrazenOptions) {
      isApplyingBrazenOptions = false;
      return;
    }

    const detected = detectFrontierBrazenBucketOptions(buckets);
    selectedBrazenCurve.value = detected?.curve ?? 'uniform';
    selectedBrazenBucketCount.value = detected?.bucketCount ?? normalizeBucketCount(buckets.length);
    applyBrazenOptions();
  },
  { deep: true }
);

function updateHighStandardRate(value: number | null) {
  profile.value = {
    ...profile.value,
    highStandardProcRatePercent: value === null ? null : clampPercent(value)
  };
}

function updateBrazenCurve(value: unknown) {
  if (!isBrazenCurve(value)) return;
  selectedBrazenCurve.value = value;
  applyBrazenOptions();
}

function updateBrazenBucketCount(value: unknown) {
  if (!isBrazenBucketCount(value)) return;
  selectedBrazenBucketCount.value = value;
  applyBrazenOptions();
}

function applyBrazenOptions() {
  isApplyingBrazenOptions = true;
  profile.value = {
    ...profile.value,
    brazenBuckets: createFrontierBrazenBuckets(selectedBrazenCurve.value, selectedBrazenBucketCount.value)
  };
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function buildCurveOption(value: FrontierBrazenDistributionCurve): CurveOption {
  return {
    value,
    label: t(`frontier.profile.curves.${value}.label`),
    description: t(`frontier.profile.curves.${value}.description`),
    iconValues: curveIconValues[value]
  };
}

function selectedCurveOption(value: unknown) {
  const curve = isBrazenCurve(value) ? value : selectedBrazenCurve.value;
  return brazenCurveOptions.value.find((option) => option.value === curve) ?? brazenCurveOptions.value[0];
}

function curveBarHeight(value: number, values: number[]) {
  const maxValue = Math.max(...values, 1);
  return `${Math.max(18, (value / maxValue) * 100)}%`;
}

function normalizeBucketCount(value: number): FrontierBrazenBucketCount {
  return FRONTIER_BRAZEN_BUCKET_COUNTS.find((count) => count === value) ?? 5;
}

function isBrazenCurve(value: unknown): value is FrontierBrazenDistributionCurve {
  return typeof value === 'string' && curveIconValues[value as FrontierBrazenDistributionCurve] !== undefined;
}

function isBrazenBucketCount(value: unknown): value is FrontierBrazenBucketCount {
  return FRONTIER_BRAZEN_BUCKET_COUNTS.some((count) => count === value);
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

      <article class="frontier-assumption-card">
        <div class="assumption-card-copy">
          <span class="assumption-card-icon"><i class="pi pi-sliders-h"></i></span>
          <div>
            <h3>{{ t('frontier.profile.brazenTitle') }}</h3>
            <p>{{ t('frontier.profile.brazenShortDescription') }}</p>
          </div>
        </div>
        <label class="assumption-card-control">
          <Select
            :model-value="selectedBrazenCurve"
            :options="brazenCurveOptions"
            optionLabel="label"
            optionValue="value"
            :aria-label="t('frontier.profile.curveLabel')"
            fluid
            @update:model-value="updateBrazenCurve"
          >
            <template #value="{ value }">
              <div class="curve-option is-selected">
                <span class="curve-mini-chart" aria-hidden="true">
                  <span
                    v-for="(bar, index) in selectedCurveOption(value).iconValues"
                    :key="index"
                    :style="{ height: curveBarHeight(bar, selectedCurveOption(value).iconValues) }"
                  ></span>
                </span>
                <span class="curve-option-text">
                  <strong>{{ selectedCurveOption(value).label }}</strong>
                </span>
              </div>
            </template>
            <template #option="{ option }">
              <div class="curve-option">
                <span class="curve-mini-chart" aria-hidden="true">
                  <span
                    v-for="(bar, index) in option.iconValues"
                    :key="index"
                    :style="{ height: curveBarHeight(bar, option.iconValues) }"
                  ></span>
                </span>
                <span class="curve-option-text">
                  <strong>{{ option.label }}</strong>
                  <small>{{ option.description }}</small>
                </span>
              </div>
            </template>
          </Select>
        </label>
      </article>

      <article class="frontier-assumption-card">
        <div class="assumption-card-copy">
          <span class="assumption-card-icon"><i class="pi pi-sitemap"></i></span>
          <div>
            <h3>{{ t('frontier.profile.granularityLabel') }}</h3>
            <p>{{ t('frontier.profile.granularityHint') }}</p>
          </div>
        </div>
        <label class="assumption-card-control">
          <Select
            :model-value="selectedBrazenBucketCount"
            :options="brazenBucketCountOptions"
            optionLabel="label"
            optionValue="value"
            :aria-label="t('frontier.profile.granularityLabel')"
            fluid
            @update:model-value="updateBrazenBucketCount"
          />
        </label>
      </article>
    </div>
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.frontier-assumption-card {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto 1fr;
  gap: 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  background: #f8fafc;
  padding: 0.9rem;
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

.assumption-card-copy h3 {
  margin: 0;
  color: #334155;
  font-size: 0.98rem;
  font-weight: 900;
}

.assumption-card-copy p {
  margin: 0.2rem 0 0;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.45;
}

.assumption-card-control {
  min-width: 0;
  display: grid;
  align-self: end;
}

.assumption-card-control :deep(.p-inputnumber),
.assumption-card-control :deep(.p-select),
.assumption-card-control :deep(input) {
  width: 100% !important;
  min-width: 0 !important;
}

.curve-option {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.curve-option.is-selected {
  min-height: 1.4rem;
}

.curve-mini-chart {
  width: 2.4rem;
  height: 1.35rem;
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: end;
  gap: 0.12rem;
  border-bottom: 1px solid rgb(82 168 144 / 0.42);
}

.curve-mini-chart span {
  display: block;
  min-height: 0.18rem;
  border-radius: 999px 999px 0 0;
  background: #52a890;
}

.curve-option-text {
  min-width: 0;
  display: grid;
  gap: 0.1rem;
}

.curve-option-text strong {
  overflow: hidden;
  color: #334155;
  font-size: 0.84rem;
  font-weight: 900;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.curve-option-text small {
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 750;
  line-height: 1.25;
}

:global(html.dark .frontier-assumption-card) {
  border-color: #334155;
  background: #0f172a;
}

:global(html.dark .assumption-card-icon) {
  background: rgb(20 83 45 / 0.28);
  color: #86efac;
}

:global(html.dark .frontier-assumption-card h3),
:global(html.dark .curve-option-text strong) {
  color: #f8fafc;
}

:global(html.dark .frontier-assumption-card p),
:global(html.dark .curve-option-text small) {
  color: #94a3b8;
}

:global(html.dark .curve-mini-chart) {
  border-bottom-color: rgb(94 234 212 / 0.38);
}

:global(html.dark .curve-mini-chart span) {
  background: #5eead4;
}

@media (max-width: 560px) {
  .frontier-assumption-cards {
    grid-template-columns: 1fr;
  }
}
</style>
