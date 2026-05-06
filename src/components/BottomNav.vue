<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <nav class="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-soft-green-100/50 dark:border-slate-800/50 px-6 pb-6 pt-2 flex justify-around items-center z-50">
    <router-link 
      to="/" 
      class="flex flex-col items-center gap-1 transition-all duration-300 relative group"
      :class="route.path === '/' ? 'text-soft-green-600 dark:text-soft-green-400 scale-110' : 'text-slate-400 dark:text-slate-500'"
    >
      <div 
        class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
        :class="route.path === '/' ? 'bg-soft-green-100/50 dark:bg-soft-green-900/30 shadow-sm shadow-soft-green-200/20' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'"
      >
        <i class="pi pi-pencil text-xl"></i>
      </div>
      <span class="text-[10px] font-bold tracking-wider uppercase">{{ $t('nav.createGuide') }}</span>
      
      <!-- Active Indicator Dot -->
      <div 
        v-if="route.path === '/'"
        class="absolute -bottom-1 w-1 h-1 rounded-full bg-soft-green-500"
      ></div>
    </router-link>

    <router-link 
      to="/settings" 
      class="flex flex-col items-center gap-1 transition-all duration-300 relative group"
      :class="route.path === '/settings' ? 'text-soft-green-600 dark:text-soft-green-400 scale-110' : 'text-slate-400 dark:text-slate-500'"
    >
      <div 
        class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
        :class="route.path === '/settings' ? 'bg-soft-green-100/50 dark:bg-soft-green-900/30 shadow-sm shadow-soft-green-200/20' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'"
      >
        <i class="pi pi-cog text-xl"></i>
      </div>
      <span class="text-[10px] font-bold tracking-wider uppercase">{{ $t('nav.settings') }}</span>

      <!-- Active Indicator Dot -->
      <div 
        v-if="route.path === '/settings'"
        class="absolute -bottom-1 w-1 h-1 rounded-full bg-soft-green-500"
      ></div>
    </router-link>
  </nav>
</template>

<style scoped>
.router-link-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
