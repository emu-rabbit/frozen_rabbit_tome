<script setup lang="ts">
defineOptions({ name: 'Settings' });
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSettings } from '../composables/useSettings';
import SelectButton from 'primevue/selectbutton';
import InputNumber from 'primevue/inputnumber';
import { useI18n } from 'vue-i18n';
import type { SolverObjectiveMode } from '../types/game';

const { isDarkMode, language, macroSettings, solverSettings, frontierSettings } = useSettings();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const langOptions = [
  { label: '繁體中文', value: 'tw' },
  { label: '简体中文', value: 'cn' },
  { label: 'English', value: 'en' },
  { label: '日本語', value: 'ja' },
];

const solverModeOptions = computed<Array<{ label: string; value: SolverObjectiveMode }>>(() => [
  { label: t('settings.solverModes.expected'), value: 'expected' },
  { label: t('settings.solverModes.max'), value: 'max' },
  { label: t('settings.solverModes.min'), value: 'min' },
]);

function goGearProfiles() {
  router.push({
    path: '/settings/gear-profiles',
    query: { returnTo: route.fullPath }
  });
}
</script>

<template>
  <div class="px-4 py-8 md:p-8 max-w-4xl w-full mx-auto pb-24">
    <header class="mb-6 md:mb-8">
      <h2 class="text-2xl md:text-3xl font-bold text-soft-green-800 dark:text-soft-green-400 mb-2">{{ $t('settings.title') }}</h2>
      <p class="text-slate-500 dark:text-slate-400 text-sm">{{ $t('settings.description') }}</p>
    </header>

    <div class="flex flex-col gap-6">
      <!-- Appearance Settings -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-5 md:p-8 hover:shadow-md transition-shadow">
          <div class="flex flex-col gap-4">
              <div class="flex items-center gap-3 text-soft-green-900 dark:text-soft-green-400 mb-1">
                <i class="pi pi-palette text-xl"></i>
                <label class="font-bold text-lg">{{ $t('settings.appearanceTitle') }}</label>
              </div>

              <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed -mt-3 px-1">{{ $t('settings.appearanceDesc') }}</p>

              <div class="flex items-center justify-between gap-1 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  <div class="flex flex-col">
                      <span class="font-bold text-slate-700 dark:text-slate-200">{{ $t('settings.darkMode') }}</span>
                      <span class="text-xs text-slate-500 dark:text-slate-400">{{ $t('settings.darkModeDesc') }}</span>
                  </div>
                  <button 
                    @click="isDarkMode = !isDarkMode" 
                    class="w-14 h-8 rounded-full transition-all duration-300 relative flex-shrink-0"
                    :class="isDarkMode ? 'bg-soft-green-500' : 'bg-slate-300 dark:bg-slate-700'"
                  >
                    <div 
                        class="absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-300 flex items-center justify-center overflow-hidden"
                        :class="isDarkMode ? 'left-7' : 'left-1'"
                    >
                        <i :class="isDarkMode ? 'pi pi-moon text-soft-green-600' : 'pi pi-sun text-amber-500'" class="text-[10px]"></i>
                    </div>
                  </button>
              </div>
          </div>
      </div>

      <!-- Language Settings -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-5 md:p-8 hover:shadow-md transition-shadow">
          <div class="flex flex-col gap-4">
              <div class="flex items-center gap-3 text-soft-green-900 dark:text-soft-green-400 mb-1">
                <i class="pi pi-language text-xl"></i>
                <label class="font-bold text-lg">{{ $t('settings.language') }}</label>
              </div>

              <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed -mt-3 px-1">{{ $t('settings.languageDesc') }}</p>

              <div class="overflow-x-auto no-scrollbar -mx-1 px-1">
                  <SelectButton 
                    v-model="language" 
                    :options="langOptions" 
                    optionLabel="label" 
                    optionValue="value" 
                    aria-labelledby="basic" 
                    class="settings-lang-toggle whitespace-nowrap min-w-max"
                  />
              </div>
          </div>
      </div>

      <!-- Solver Objective Settings -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-5 md:p-8 hover:shadow-md transition-shadow">
          <div class="flex flex-col gap-4">
              <div class="flex items-center gap-3 text-soft-green-900 dark:text-soft-green-400 mb-1">
                <i class="pi pi-compass text-xl"></i>
                <label class="font-bold text-lg">{{ $t('settings.solverModeTitle') }}</label>
              </div>

              <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed -mt-3 px-1">{{ $t('settings.solverModeDesc') }}</p>

              <div class="overflow-x-auto no-scrollbar -mx-1 px-1">
                  <SelectButton
                    v-model="solverSettings.objectiveMode"
                    :options="solverModeOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="settings-lang-toggle whitespace-nowrap min-w-max"
                  />
              </div>

              <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-1">
                {{ $t(`settings.solverModeDetails.${solverSettings.objectiveMode}`) }}
              </p>
          </div>
      </div>

      <!-- Frontier Settings -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-5 md:p-8 hover:shadow-md transition-shadow">
          <div class="flex flex-col gap-4">
              <div class="flex items-center gap-3 text-soft-green-900 dark:text-soft-green-400 mb-1">
                <i class="pi pi-compass text-xl"></i>
                <label class="font-bold text-lg">{{ $t('settings.frontierTitle') }}</label>
              </div>

              <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed -mt-3 px-1">{{ $t('settings.frontierDesc') }}</p>

              <div class="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  <div class="flex flex-col">
                      <span class="font-bold text-slate-700 dark:text-slate-200">{{ $t('settings.frontierCollectable') }}</span>
                      <span class="text-xs text-slate-500 dark:text-slate-400">{{ $t('settings.frontierCollectableDesc') }}</span>
                  </div>
                  <button
                    type="button"
                    @click="frontierSettings.enabled = !frontierSettings.enabled"
                    class="w-14 h-8 rounded-full transition-all duration-300 relative flex-shrink-0"
                    :class="frontierSettings.enabled ? 'bg-soft-green-500' : 'bg-slate-300 dark:bg-slate-700'"
                    :aria-pressed="frontierSettings.enabled"
                  >
                    <div
                        class="absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-300 flex items-center justify-center overflow-hidden"
                        :class="frontierSettings.enabled ? 'left-7' : 'left-1'"
                    >
                        <i :class="frontierSettings.enabled ? 'pi pi-check text-soft-green-600' : 'pi pi-times text-slate-400'" class="text-[10px]"></i>
                    </div>
                  </button>
              </div>
          </div>
      </div>

      <!-- Gear Profile Settings -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-5 md:p-8 hover:shadow-md transition-shadow">
          <div class="flex flex-col gap-4">
              <div class="flex items-center gap-3 text-soft-green-900 dark:text-soft-green-400 mb-1">
                <i class="pi pi-user text-xl"></i>
                <label class="font-bold text-lg">{{ $t('settings.gearProfilesTitle') }}</label>
              </div>

              <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed -mt-3 px-1">{{ $t('settings.gearProfilesDesc') }}</p>

              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  <div class="flex flex-col">
                      <span class="font-bold text-slate-700 dark:text-slate-200">{{ $t('settings.gearProfilesEntryTitle') }}</span>
                      <span class="text-xs text-slate-500 dark:text-slate-400">{{ $t('settings.gearProfilesEntryDesc') }}</span>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-soft-green-500 text-white font-black hover:bg-soft-green-600 transition-colors"
                    @click="goGearProfiles"
                  >
                    <i class="pi pi-arrow-right"></i>
                    <span>{{ $t('settings.gearProfilesManage') }}</span>
                  </button>
              </div>
          </div>
      </div>

      <!-- Macro Settings -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-5 md:p-8 hover:shadow-md transition-shadow">
          <div class="flex flex-col gap-4">
              <div class="flex items-center gap-3 text-soft-green-900 dark:text-soft-green-400 mb-1">
                <i class="pi pi-copy text-xl"></i>
                <label class="font-bold text-lg">{{ $t('settings.macroTitle') }}</label>
              </div>

              <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed -mt-3 px-1">{{ $t('settings.macroDesc') }}</p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div class="flex flex-col gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                      <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ $t('settings.macroSecondsPerGather') }}</label>
                      <InputNumber v-model="macroSettings.secondsPerGather" :min="1" :max="60" :useGrouping="false" :suffix="t('game.units.secondsSuffix')" class="w-full" />
                  </div>
                  <div class="flex flex-col gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                      <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ $t('settings.macroBufferSeconds') }}</label>
                      <InputNumber v-model="macroSettings.bufferSeconds" :min="0" :max="60" :useGrouping="false" :suffix="t('game.units.secondsSuffix')" class="w-full" />
                  </div>
              </div>
          </div>
      </div>

      <!-- About & Credits Section -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-5 md:p-8 hover:shadow-md transition-shadow">
          <div class="flex flex-col gap-6">
              <div class="flex items-center gap-3 text-soft-green-900 dark:text-soft-green-400">
                <i class="pi pi-info-circle text-xl"></i>
                <label class="font-bold text-lg">{{ $t('settings.about.title') }}</label>
              </div>

              <p class="text-slate-500 dark:text-slate-400 text-sm -mt-3 leading-relaxed">{{ $t('settings.about.description') }}</p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-2">
                <a href="https://ffxivteamcraft.com" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800/50 hover:border-soft-green-200 dark:hover:border-soft-green-900 hover:shadow-sm transition-all group">
                  <div class="flex flex-col gap-0.5 min-w-0">
                    <span class="font-black text-slate-700 dark:text-slate-200 text-sm tracking-tight group-hover:text-soft-green-700 dark:group-hover:text-soft-green-400 truncate">Teamcraft</span>
                    <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{{ $t('settings.about.teamcraft') }}</span>
                  </div>
                  <i class="pi pi-external-link text-[10px] text-slate-300 dark:text-slate-600 group-hover:text-soft-green-500 shrink-0"></i>
                </a>

                <a href="https://xivapi.com" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800/50 hover:border-soft-green-200 dark:hover:border-soft-green-900 hover:shadow-sm transition-all group">
                  <div class="flex flex-col gap-0.5 min-w-0">
                    <span class="font-black text-slate-700 dark:text-slate-200 text-sm tracking-tight group-hover:text-soft-green-700 dark:group-hover:text-soft-green-400 truncate">XIVAPI</span>
                    <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{{ $t('settings.about.xivapi') }}</span>
                  </div>
                  <i class="pi pi-external-link text-[10px] text-slate-300 dark:text-slate-600 group-hover:text-soft-green-500 shrink-0"></i>
                </a>
              </div>
          </div>
      </div>

      <!-- Version & Updates Section -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-5 md:p-8 hover:shadow-md transition-shadow">
          <div class="flex flex-col gap-4">
              <div class="flex items-center gap-3 text-soft-green-900 dark:text-soft-green-400 mb-1">
                <i class="pi pi-history text-xl"></i>
                <label class="font-bold text-lg">{{ $t('settings.changelogTitle') }}</label>
              </div>

              <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed -mt-3 px-1">{{ $t('settings.changelogDesc') }}</p>

              <div class="flex mt-2">
                <router-link to="/changelog" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-soft-green-50 dark:bg-soft-green-900/30 text-soft-green-700 dark:text-soft-green-400 font-bold text-sm hover:bg-soft-green-100 dark:hover:bg-soft-green-900/50 hover:shadow-sm border border-soft-green-200 dark:border-soft-green-800 transition-all">
                  <i class="pi pi-external-link text-xs"></i>
                  {{ $t('settings.changelogLink') }}
                </router-link>
              </div>
          </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
