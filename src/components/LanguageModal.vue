<script setup lang="ts">
import { ref } from 'vue';
import { useSettings, type Language } from '../composables/useSettings';
import SelectButton from 'primevue/selectbutton';

const { language, initialized } = useSettings();

const langOptions = [
  { label: '繁體中文', value: 'tw' },
  { label: '简体中文', value: 'cn' },
  { label: 'English', value: 'en' },
  { label: '日本語', value: 'ja' },
];

const selectedLang = ref<Language>(language.value);

const confirm = () => {
  language.value = selectedLang.value;
  initialized.value = true;
};
</script>

<template>
  <div v-if="!initialized" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
    <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-soft-green-100 dark:border-slate-800 p-8 max-w-md w-full animate-modal-in">
      <div class="flex flex-col items-center text-center gap-6">
        <div class="w-20 h-20 rounded-2xl bg-soft-green-50 dark:bg-soft-green-900/30 flex items-center justify-center shadow-inner">
          <img src="/assets/logo.png" class="w-14 h-14" alt="Logo" />
        </div>
        
        <div>
          <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Welcome to Tome</h2>
          <p class="text-slate-500 dark:text-slate-400 text-sm">Please select your preferred language to begin.</p>
        </div>

        <div class="w-full">
          <SelectButton 
            v-model="selectedLang" 
            :options="langOptions" 
            optionLabel="label" 
            optionValue="value" 
            class="first-time-lang-select flex flex-col gap-2"
          />
        </div>

        <button 
          @click="confirm"
          class="w-full py-4 bg-soft-green-500 hover:bg-soft-green-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-soft-green-500/20 active:scale-[0.98]"
        >
          Get Started
        </button>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.animate-modal-in {
  animation: modal-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.first-time-lang-select .p-button {
  @apply w-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold py-3 rounded-xl transition-all !important;
}
.first-time-lang-select .p-highlight {
  @apply border-soft-green-500 bg-soft-green-50 dark:bg-soft-green-900/20 text-soft-green-600 dark:text-soft-green-400 !important;
}
</style>
