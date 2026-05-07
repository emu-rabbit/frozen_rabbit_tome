<script setup lang="ts">
import { ref } from 'vue';
import { watchDebounced } from '@vueuse/core';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

const searchQuery = ref('');

watchDebounced(
  searchQuery,
  (newValue) => {
    console.log('Searching for:', newValue);
    // TODO: Implement search logic in the next stage
  },
  { debounce: 500 }
);
</script>

<template>
  <div class="px-4 py-8 md:p-8 max-w-4xl w-full mx-auto pb-24">
    <header class="mb-6 md:mb-8 transition-all duration-700">
      <h2 class="text-2xl md:text-3xl font-bold text-soft-green-800 dark:text-soft-green-400 mb-2">
        {{ $t('createGuide.title') }}
      </h2>
      <p class="text-slate-500 dark:text-slate-400 text-sm">
        {{ $t('createGuide.subtitle') }}
      </p>
    </header>

    <div class="transition-all duration-700 delay-100">
      <IconField>
        <InputIcon class="pi pi-search text-slate-400" />
        <InputText 
          v-model="searchQuery" 
          :placeholder="$t('createGuide.searchPlaceholder')" 
          class="w-full !py-4 !px-12 !rounded-2xl !bg-white dark:!bg-slate-900 !border-soft-green-100 dark:!border-slate-800 shadow-sm focus:!ring-soft-green-500/20 transition-shadow hover:shadow-md"
        />
      </IconField>
    </div>
  </div>
</template>

<style scoped>
/* Standard animation classes if Tailwind plugins aren't available, but we'll stick to clean transitions */
.transition-all {
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
