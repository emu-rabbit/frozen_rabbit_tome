<script setup lang="ts">
import { useSettings } from '../composables/useSettings';
import SelectButton from 'primevue/selectbutton';
import InputNumber from 'primevue/inputnumber';
import { useI18n } from 'vue-i18n';

const { isDarkMode, language, userStats } = useSettings();
const { t } = useI18n();

const langOptions = [
  { label: t('settings.langOptions.tw'), value: 'tw' },
  { label: t('settings.langOptions.cn'), value: 'cn' },
  { label: t('settings.langOptions.en'), value: 'en' },
  { label: t('settings.langOptions.ja'), value: 'ja' },
];
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

      <!-- Player Stats Settings -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-5 md:p-8 hover:shadow-md transition-shadow">
          <div class="flex flex-col gap-4">
              <div class="flex items-center gap-3 text-soft-green-900 dark:text-soft-green-400 mb-1">
                <i class="pi pi-user text-xl"></i>
                <label class="font-bold text-lg">{{ $t('settings.statsTitle') }}</label>
              </div>

              <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed -mt-3 px-1">{{ $t('settings.statsDesc') }}</p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  <!-- Miner -->
                  <div class="flex flex-col gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 mb-1">
                          <i class="pi pi-hammer text-slate-600 dark:text-slate-400"></i>
                          <span class="font-bold text-slate-700 dark:text-slate-200">{{ $t('game.jobs.miner') }}</span>
                      </div>
                      <div class="grid grid-cols-1 gap-3">
                          <div class="flex flex-col gap-1">
                              <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ $t('game.stats.level') }}</label>
                              <InputNumber v-model="userStats.miner.level" :min="1" :max="100" :useGrouping="false" class="w-full" />
                          </div>
                          <div class="flex flex-col gap-1">
                              <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ $t('game.stats.gathering') }}</label>
                              <InputNumber v-model="userStats.miner.gathering" :min="0" :useGrouping="false" class="w-full" />
                          </div>
                          <div class="flex flex-col gap-1">
                              <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ $t('game.stats.perception') }}</label>
                              <InputNumber v-model="userStats.miner.perception" :min="0" :useGrouping="false" class="w-full" />
                          </div>
                          <div class="flex flex-col gap-1">
                              <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ $t('game.stats.gp') }}</label>
                              <InputNumber v-model="userStats.miner.gp" :min="0" :useGrouping="false" class="w-full" />
                          </div>
                      </div>
                  </div>

                  <!-- Botanist -->
                  <div class="flex flex-col gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 mb-1">
                          <i class="pi pi-box text-slate-600 dark:text-slate-400"></i>
                          <span class="font-bold text-slate-700 dark:text-slate-200">{{ $t('game.jobs.botanist') }}</span>
                      </div>
                      <div class="grid grid-cols-1 gap-3">
                          <div class="flex flex-col gap-1">
                              <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ $t('game.stats.level') }}</label>
                              <InputNumber v-model="userStats.botanist.level" :min="1" :max="100" :useGrouping="false" class="w-full" />
                          </div>
                          <div class="flex flex-col gap-1">
                              <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ $t('game.stats.gathering') }}</label>
                              <InputNumber v-model="userStats.botanist.gathering" :min="0" :useGrouping="false" class="w-full" />
                          </div>
                          <div class="flex flex-col gap-1">
                              <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ $t('game.stats.perception') }}</label>
                              <InputNumber v-model="userStats.botanist.perception" :min="0" :useGrouping="false" class="w-full" />
                          </div>
                          <div class="flex flex-col gap-1">
                              <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ $t('game.stats.gp') }}</label>
                              <InputNumber v-model="userStats.botanist.gp" :min="0" :useGrouping="false" class="w-full" />
                          </div>
                      </div>
                  </div>
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