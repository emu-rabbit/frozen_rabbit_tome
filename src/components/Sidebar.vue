<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
const version = '0.1.0';
const githubUrl = 'https://github.com/emu-rabbit/frozen_rabbit_tome';

defineEmits(['close-mobile']);
</script>

<template>
  <aside class="w-full bg-white dark:bg-slate-900 flex flex-col transition-all overflow-y-auto border-r border-soft-green-100/50 dark:border-slate-800/50 h-full">
    <!-- Header -->
    <div class="p-8 pb-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 rounded-2xl bg-soft-green-50 dark:bg-soft-green-900/20 flex items-center justify-center p-2 shadow-sm border border-soft-green-100/50 dark:border-soft-green-800/30">
          <img src="/assets/logo.png" class="w-full h-full object-contain" alt="Logo" />
        </div>
        <div class="flex flex-col">
          <h1 class="text-xl font-black text-soft-green-800 dark:text-soft-green-400 tracking-tight leading-none uppercase">
            {{ $t('app.title') }}
          </h1>
          <span class="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-[0.2em] leading-none mt-1.5 uppercase">
            {{ $t('app.subtitle') }}
          </span>
        </div>
      </div>
      <div class="h-px w-full bg-gradient-to-r from-soft-green-100/50 via-transparent to-transparent dark:from-soft-green-800/30"></div>
    </div>

    <!-- Main Navigation -->
    <nav class="flex-1 px-4 flex flex-col gap-1.5">
      <router-link 
        to="/" 
        @click="$emit('close-mobile')"
        class="flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 text-left relative group overflow-hidden"
        :class="route.path === '/' ? 'bg-soft-green-50 dark:bg-soft-green-900/20 text-soft-green-800 dark:text-soft-green-300' : 'text-slate-500 dark:text-slate-400 hover:text-soft-green-600 dark:hover:text-soft-green-400'"
      >
        <!-- Active Background Glow -->
        <div v-if="route.path === '/'" class="absolute inset-0 bg-gradient-to-r from-soft-green-100/50 to-transparent dark:from-soft-green-800/10 opacity-50"></div>
        
        <i class="pi pi-pencil text-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" :class="route.path === '/' ? 'text-soft-green-600 dark:text-soft-green-400' : 'opacity-70'"></i>
        <span class="font-bold tracking-wide relative z-10">{{ $t('nav.createGuide') }}</span>
        
        <!-- Active Indicator -->
        <div v-if="route.path === '/'" class="absolute left-0 top-1/4 bottom-1/4 w-1 bg-soft-green-500 rounded-r-full shadow-[0_0_8px_rgba(82,168,144,0.4)]"></div>
      </router-link>

      <div class="mt-auto"></div>
    </nav>
    
    <!-- Footer / Settings -->
    <div class="p-6 mt-auto">
      <div class="flex flex-col gap-4">
        <!-- Settings -->
        <router-link 
          to="/settings" 
          @click="$emit('close-mobile')"
          class="flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 text-left relative group overflow-hidden"
          :class="route.path === '/settings' ? 'bg-soft-green-50 dark:bg-soft-green-900/20 text-soft-green-800 dark:text-soft-green-300' : 'text-slate-500 dark:text-slate-400 hover:text-soft-green-600 dark:hover:text-soft-green-400'"
        >
          <i class="pi pi-cog text-lg transition-transform duration-300 group-hover:rotate-45" :class="route.path === '/settings' ? 'text-soft-green-600 dark:text-soft-green-400' : 'opacity-70'"></i>
          <span class="font-bold tracking-wide">{{ $t('nav.settings') }}</span>
        </router-link>

        <div class="h-px w-full bg-slate-100 dark:bg-slate-800/50"></div>

        <!-- External Links -->
        <div class="flex flex-col gap-2">
          <a 
            :href="githubUrl" 
            target="_blank"
            class="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/30 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-all duration-300 group"
          >
            <div class="flex items-center gap-2.5">
              <i class="pi pi-github text-sm"></i>
              <span class="text-[11px] font-bold tracking-tight">{{ $t('nav.github') }}</span>
            </div>
            <i class="pi pi-external-link text-[10px] opacity-0 group-hover:opacity-50 transition-opacity"></i>
          </a>
        </div>

        <!-- Version -->
        <div class="flex items-center justify-center gap-2 opacity-30">
          <div class="h-px flex-1 bg-slate-300 dark:bg-slate-700"></div>
          <span class="text-[9px] font-black tracking-[0.3em] uppercase">v{{ version }}</span>
          <div class="h-px flex-1 bg-slate-300 dark:bg-slate-700"></div>
        </div>
      </div>
    </div>
  </aside>

</template>
