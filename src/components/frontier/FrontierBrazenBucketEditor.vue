<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  DEFAULT_FRONTIER_BRAZEN_BUCKETS,
  normalizeFrontierBrazenBuckets,
  validateFrontierProbabilityProfile
} from '../../frontier/collectable/frontierCollectableProbabilityProfile';
import type { FrontierCollectableProbabilityProfile } from '../../frontier/collectable/frontierCollectableTypes';

const profile = defineModel<FrontierCollectableProbabilityProfile>({ required: true });
const { t } = useI18n();

const validation = computed(() => validateFrontierProbabilityProfile(profile.value));

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

function applyDefaultTemplate() {
  profile.value = {
    ...profile.value,
    brazenBuckets: DEFAULT_FRONTIER_BRAZEN_BUCKETS.map((bucket) => ({ ...bucket }))
  };
}

function normalizeBuckets() {
  profile.value = {
    ...profile.value,
    brazenBuckets: normalizeFrontierBrazenBuckets(profile.value.brazenBuckets)
  };
}

function clearBuckets() {
  profile.value = {
    ...profile.value,
    brazenBuckets: []
  };
}
</script>

<template>
  <section class="rounded-2xl border border-soft-green-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h3 class="text-lg font-black text-slate-800 dark:text-slate-100">
            {{ t('frontier.profile.brazenTitle') }}
          </h3>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {{ t('frontier.profile.brazenDescription') }}
          </p>
        </div>
        <div
          class="grid grid-cols-3 gap-2 text-center rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-2 min-w-64"
          aria-live="polite"
        >
          <div>
            <span class="block text-[11px] font-bold uppercase text-slate-400">{{ t('frontier.profile.bucketCount') }}</span>
            <strong class="text-sm text-slate-700 dark:text-slate-100">{{ profile.brazenBuckets.length }}</strong>
          </div>
          <div>
            <span class="block text-[11px] font-bold uppercase text-slate-400">{{ t('frontier.profile.totalRate') }}</span>
            <strong class="text-sm" :class="validation.valid ? 'text-soft-green-700 dark:text-soft-green-300' : 'text-rose-600 dark:text-rose-300'">
              {{ validation.totalProbabilityPercent.toFixed(2) }}%
            </strong>
          </div>
          <div>
            <span class="block text-[11px] font-bold uppercase text-slate-400">{{ t('frontier.profile.average') }}</span>
            <strong class="text-sm text-slate-700 dark:text-slate-100">{{ validation.averageMultiplierPercent.toFixed(2) }}%</strong>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <button type="button" class="frontier-tool-button" @click="addBucket">
          <i class="pi pi-plus text-xs"></i>
          <span>{{ t('frontier.profile.addBucket') }}</span>
        </button>
        <button type="button" class="frontier-tool-button" @click="applyDefaultTemplate">
          <i class="pi pi-table text-xs"></i>
          <span>{{ t('frontier.profile.applyTemplate') }}</span>
        </button>
        <button type="button" class="frontier-tool-button" @click="normalizeBuckets">
          <i class="pi pi-percentage text-xs"></i>
          <span>{{ t('frontier.profile.normalize') }}</span>
        </button>
        <button type="button" class="frontier-tool-button danger" @click="clearBuckets">
          <i class="pi pi-trash text-xs"></i>
          <span>{{ t('frontier.profile.clear') }}</span>
        </button>
      </div>

      <p v-if="!validation.valid" class="text-sm font-semibold text-rose-600 dark:text-rose-300">
        {{ t('frontier.profile.invalidTotal') }}
      </p>

      <div class="space-y-2">
        <div
          v-for="(bucket, index) in profile.brazenBuckets"
          :key="bucket.id"
          class="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
        >
          <label class="frontier-bucket-field">
            <span>{{ t('frontier.profile.multiplier') }}</span>
            <input
              type="number"
              min="50"
              max="150"
              step="0.01"
              :value="bucket.multiplierPercent"
              @input="updateBucket(index, { multiplierPercent: Number(($event.target as HTMLInputElement).value) })"
            >
          </label>
          <label class="frontier-bucket-field">
            <span>{{ t('frontier.profile.probability') }}</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              :value="bucket.probabilityPercent"
              @input="updateBucket(index, { probabilityPercent: Number(($event.target as HTMLInputElement).value) })"
            >
          </label>
          <button
            type="button"
            class="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors self-end"
            :aria-label="t('frontier.profile.removeBucket')"
            @click="removeBucket(index)"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.frontier-tool-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.25rem;
  padding: 0.45rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(82, 168, 144, 0.28);
  color: rgb(15 118 110);
  background: rgba(232, 245, 233, 0.72);
  font-size: 0.8125rem;
  font-weight: 800;
  transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease;
}

.frontier-tool-button:hover {
  background: rgba(82, 168, 144, 0.16);
  border-color: rgba(82, 168, 144, 0.45);
}

.frontier-tool-button.danger {
  color: rgb(190 18 60);
  border-color: rgba(244, 63, 94, 0.24);
  background: rgba(255, 241, 242, 0.8);
}

.frontier-bucket-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.frontier-bucket-field span {
  font-size: 0.75rem;
  font-weight: 800;
  color: rgb(100 116 139);
}

.frontier-bucket-field input {
  width: 100%;
  min-height: 2.5rem;
  border-radius: 0.75rem;
  border: 1px solid rgb(226 232 240);
  background: white;
  padding: 0.45rem 0.65rem;
  font-weight: 800;
  color: rgb(51 65 85);
}

:global(.dark .frontier-tool-button) {
  color: rgb(94 234 212);
  background: rgba(15, 23, 42, 0.75);
  border-color: rgba(94, 234, 212, 0.22);
}

:global(.dark .frontier-tool-button.danger) {
  color: rgb(253 164 175);
  background: rgba(76, 5, 25, 0.36);
  border-color: rgba(253, 164, 175, 0.2);
}

:global(.dark .frontier-bucket-field span) {
  color: rgb(148 163 184);
}

:global(.dark .frontier-bucket-field input) {
  background: rgb(15 23 42);
  border-color: rgb(51 65 85);
  color: rgb(226 232 240);
}
</style>
