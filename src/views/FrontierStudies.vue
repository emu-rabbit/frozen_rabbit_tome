<script setup lang="ts">
defineOptions({ name: 'FrontierStudies' });

import { useSettings } from '../composables/useSettings';

const { frontierSettings } = useSettings();
</script>

<template>
  <div class="px-4 py-8 md:p-8 max-w-5xl w-full mx-auto pb-24">
    <header class="mb-6 md:mb-8">
      <h2 class="text-2xl md:text-3xl font-bold text-soft-green-800 dark:text-soft-green-400 mb-2">
        {{ $t('frontier.studies.title') }}
      </h2>
      <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
        {{ $t('frontier.studies.description') }}
      </p>
    </header>

    <section
      v-if="!frontierSettings.enabled"
      class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-5 md:p-8"
    >
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-2xl bg-soft-green-100 dark:bg-soft-green-900/40 text-soft-green-700 dark:text-soft-green-300 flex items-center justify-center shrink-0">
            <i class="pi pi-lock text-lg"></i>
          </div>
          <div class="min-w-0">
            <h3 class="font-black text-lg text-slate-800 dark:text-slate-100 mb-1">
              {{ $t('frontier.disabled.title') }}
            </h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {{ $t('frontier.disabled.description') }}
            </p>
          </div>
        </div>

        <router-link
          to="/settings"
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-soft-green-500 text-white font-black hover:bg-soft-green-600 transition-colors shrink-0"
        >
          <i class="pi pi-cog text-sm"></i>
          <span>{{ $t('frontier.disabled.action') }}</span>
        </router-link>
      </div>
    </section>

    <section
      v-else
      class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-5 md:p-8"
    >
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-2xl bg-soft-green-100 dark:bg-soft-green-900/40 text-soft-green-700 dark:text-soft-green-300 flex items-center justify-center shrink-0">
          <i class="pi pi-folder-open text-lg"></i>
        </div>
        <div class="min-w-0">
          <h3 class="font-black text-lg text-slate-800 dark:text-slate-100 mb-1">
            {{ $t('frontier.studies.emptyTitle') }}
          </h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {{ $t('frontier.studies.emptyDescription') }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
