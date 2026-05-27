<script setup lang="ts">
defineOptions({ name: 'Changelog' });

import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  buildModelVersionCatalogForScenario,
  type TomeModelVersionKey,
  type TomeModelScenario,
  type TomeModelVersionCatalogEntry
} from '../config/modelVersions';
import { changelogData } from '../data/changelog';
import type { LocalizedString } from '../data/changelog';

const { t, locale } = useI18n();

const modelVersionScenarios: TomeModelScenario[] = [
  'tome.regular',
  'tome.collectable',
  'experiment.regular',
  'experiment.collectable'
];

type ModelVersionGroupKey =
  | 'overall'
  | 'jsonExport'
  | 'tomeSolver'
  | 'experimentSimulator'
  | 'experimentAnalyzer'
  | 'strategyCodec';

type CurrentModelVersionEntry = TomeModelVersionCatalogEntry;

interface CurrentModelVersionGroup {
  key: ModelVersionGroupKey;
  entries: CurrentModelVersionEntry[];
}

const modelVersionGroups: { key: ModelVersionGroupKey; entries: TomeModelVersionKey[] }[] = [
  {
    key: 'overall',
    entries: ['app']
  },
  {
    key: 'jsonExport',
    entries: ['exportSchema']
  },
  {
    key: 'tomeSolver',
    entries: ['regularSolver', 'collectableSolver']
  },
  {
    key: 'experimentSimulator',
    entries: ['regularSimulator', 'collectableSimulator']
  },
  {
    key: 'experimentAnalyzer',
    entries: ['regularAnalyzer', 'collectableAnalyzer']
  },
  {
    key: 'strategyCodec',
    entries: ['collectableStrategyCodec']
  }
];

const currentModelVersionEntries = modelVersionScenarios.reduce<CurrentModelVersionEntry[]>((entries, scenario) => {
  buildModelVersionCatalogForScenario(scenario).forEach((catalogEntry) => {
    const existingEntry = entries.find((entry) => entry.key === catalogEntry.key);

    if (existingEntry) return;

    entries.push(catalogEntry);
  });

  return entries;
}, []);

const currentModelVersionGroups = modelVersionGroups
  .map<CurrentModelVersionGroup>((group) => ({
    key: group.key,
    entries: group.entries
      .map((entryKey) => currentModelVersionEntries.find((entry) => entry.key === entryKey))
      .filter((entry): entry is CurrentModelVersionEntry => Boolean(entry))
  }))
  .filter((group) => group.entries.length > 0);

const currentModelVersionCount = currentModelVersionEntries.length;
const isModelVersionDialogOpen = ref(false);

function getLocalized(text: string | LocalizedString) {
  if (typeof text === 'string') return text;

  const currentLocale = locale.value as keyof LocalizedString;
  return text[currentLocale] || text.tw || text.en || text.ja || Object.values(text)[0];
}

function modelVersionText(version: string | number) {
  return String(version);
}

function openModelVersionDialog() {
  isModelVersionDialogOpen.value = true;
}

function closeModelVersionDialog() {
  isModelVersionDialogOpen.value = false;
}
</script>

<template>
  <div class="px-4 py-8 md:p-8 max-w-3xl w-full mx-auto pb-24">
    <header class="mb-8 md:mb-10">
      <div class="flex items-center gap-3 mb-2">
        <router-link to="/settings" class="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-soft-green-500 hover:shadow-sm flex items-center justify-center transition-all border border-slate-100 dark:border-slate-700">
          <i class="pi pi-arrow-left text-xs"></i>
        </router-link>
        <h2 class="text-2xl md:text-3xl font-bold text-soft-green-800 dark:text-soft-green-400">{{ t('changelog.title') }}</h2>
      </div>
      <p class="text-slate-500 dark:text-slate-400 text-sm ml-11">{{ t('changelog.description') }}</p>
    </header>

    <div class="relative ml-4 md:ml-6 border-l-2 border-soft-green-200 dark:border-slate-800 flex flex-col gap-8 pb-8">
      <div
        v-for="(release, index) in changelogData"
        :key="release.version"
        class="relative pl-8 md:pl-10"
      >
        <div
          class="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-soft-green-50 dark:border-slate-950 flex items-center justify-center"
          :class="index === 0 ? 'bg-soft-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-slate-400 dark:bg-slate-600'"
        ></div>

        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow group">
          <div class="px-5 py-4 border-b border-soft-green-50 dark:border-slate-800 flex flex-wrap gap-3 items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <h3 class="text-lg font-black tracking-tight" :class="index === 0 ? 'text-soft-green-600 dark:text-soft-green-400' : 'text-slate-700 dark:text-slate-300'">
              {{ t('changelog.version', { v: release.version }) }}
              <span v-if="index === 0" class="ml-2 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-soft-green-100 dark:bg-soft-green-900/50 text-soft-green-700 dark:text-soft-green-300">{{ t('changelog.latest') }}</span>
            </h3>
            <span class="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <i class="pi pi-calendar text-[10px]"></i>
              {{ release.date }}
            </span>
          </div>
          <div class="p-5">
            <ul class="flex flex-col gap-3">
              <li v-for="(change, changeIndex) in release.changes" :key="changeIndex" class="flex items-start gap-3">
                <i class="pi pi-check-circle text-soft-green-500 dark:text-soft-green-600 mt-0.5 shrink-0 text-sm"></i>
                <span class="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{{ getLocalized(change) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="model-version-fab"
      :aria-label="t('changelog.modelVersionsButton')"
      :title="t('changelog.modelVersionsButton')"
      @click="openModelVersionDialog"
    >
      <i class="pi pi-code" aria-hidden="true"></i>
    </button>

    <div
      v-if="isModelVersionDialogOpen"
      class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm md:items-center"
      role="presentation"
      @click.self="closeModelVersionDialog"
      @keyup.esc="closeModelVersionDialog"
    >
      <section
        class="w-full max-w-2xl max-h-[82dvh] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-soft-green-100 dark:border-slate-800"
        role="dialog"
        aria-modal="true"
        :aria-label="t('changelog.currentModelVersionsTitle')"
      >
        <div class="px-5 py-4 border-b border-soft-green-50 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div class="flex items-start gap-3">
            <span class="w-9 h-9 rounded-full bg-soft-green-100 dark:bg-soft-green-900/40 text-soft-green-700 dark:text-soft-green-300 flex items-center justify-center shrink-0">
              <i class="pi pi-code text-sm"></i>
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-lg font-black text-soft-green-700 dark:text-soft-green-300">
                  {{ t('changelog.currentModelVersionsTitle') }}
                </h3>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-soft-green-100 dark:border-slate-700">
                  {{ t('changelog.currentModelVersionsSummary', { count: currentModelVersionCount }) }}
                </span>
              </div>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {{ t('changelog.currentModelVersionsDescription') }}
              </p>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-full text-slate-400 hover:text-soft-green-600 hover:bg-soft-green-50 dark:hover:bg-slate-800 dark:hover:text-soft-green-300 focus:outline-none focus:ring-2 focus:ring-soft-green-200 dark:focus:ring-soft-green-900 transition-colors flex items-center justify-center shrink-0"
              :aria-label="t('changelog.modelVersionsClose')"
              @click="closeModelVersionDialog"
            >
              <i class="pi pi-times text-xs"></i>
            </button>
          </div>
        </div>

        <div class="model-version-dialog-body max-h-[calc(82dvh-96px)] overflow-y-auto px-5 pt-5">
          <div class="space-y-6">
            <div
              v-for="group in currentModelVersionGroups"
              :key="group.key"
            >
              <h4 class="mb-3 text-xs font-black uppercase tracking-normal text-slate-400 dark:text-slate-500">
                {{ t(`changelog.modelVersionGroups.${group.key}`) }}
              </h4>

              <div class="divide-y divide-soft-green-50 dark:divide-slate-800 border border-soft-green-50 dark:border-slate-800 rounded-xl overflow-hidden">
                <div
                  v-for="entry in group.entries"
                  :key="entry.key"
                  class="px-4 py-3 bg-white dark:bg-slate-900"
                >
                  <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div class="min-w-0">
                      <span class="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {{ t(`changelog.modelVersionKeys.${entry.key}`) }}
                      </span>
                    </div>
                    <code class="self-start max-w-full break-all rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                      {{ modelVersionText(entry.version) }}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.model-version-fab {
  position: fixed;
  right: max(1.35rem, calc(env(safe-area-inset-right) + 0.9rem));
  bottom: max(1.35rem, calc(env(safe-area-inset-bottom) + 0.9rem));
  z-index: 45;
  width: 4rem;
  height: 4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(82 168 144 / 0.38);
  border-radius: 999px;
  background: #52a890;
  color: white;
  box-shadow: 0 16px 34px rgb(15 23 42 / 0.21);
  font-size: 1.38rem;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.model-version-fab:hover,
.model-version-fab:focus-visible {
  border-color: rgb(82 168 144 / 0.7);
  background: #3f8f79;
  box-shadow: 0 20px 40px rgb(15 23 42 / 0.25);
  transform: translateY(-2px);
  outline: none;
}

.model-version-fab:focus-visible {
  box-shadow:
    0 20px 40px rgb(15 23 42 / 0.25),
    0 0 0 4px rgb(82 168 144 / 0.22);
}

:global(html.dark .model-version-fab) {
  border-color: rgb(94 234 212 / 0.28);
  background: #047857;
  box-shadow: 0 18px 38px rgb(0 0 0 / 0.35);
}

:global(html.dark .model-version-fab:hover),
:global(html.dark .model-version-fab:focus-visible) {
  border-color: rgb(94 234 212 / 0.52);
  background: #059669;
}

.model-version-dialog-body {
  padding-bottom: max(2rem, calc(env(safe-area-inset-bottom) + 1.5rem));
}

@media (max-width: 640px) {
  .model-version-fab {
    right: max(1.15rem, calc(env(safe-area-inset-right) + 0.75rem));
    bottom: max(1.15rem, calc(env(safe-area-inset-bottom) + 0.75rem));
    width: 3.6rem;
    height: 3.6rem;
    font-size: 1.2rem;
  }
}
</style>
