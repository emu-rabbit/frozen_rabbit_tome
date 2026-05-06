<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Sidebar from './components/Sidebar.vue';
import LanguageModal from './components/LanguageModal.vue';
import { useSettings } from './composables/useSettings';

const { locale, t } = useI18n();
const isMobileMenuOpen = ref(false);
const { isDarkMode, language } = useSettings();

// 同步語系
watch(language, (newLang) => {
  locale.value = newLang;
}, { immediate: true });

// 同步深色模式
watch(isDarkMode, (newVal) => {
  if (newVal) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}, { immediate: true });

// 更新網頁標題
watch(language, () => {
  document.title = `${t('app.title')} | ${t('app.description')}`;
}, { immediate: true });
</script>

<template>
  <LanguageModal />
  <div class="flex h-screen w-screen bg-soft-green-50 dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-100 font-sans relative">
    
    <!-- Mobile Header -->
    <header class="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-soft-green-100/50 dark:border-slate-800/50 flex items-center justify-between px-6 z-50">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8">
          <img src="/assets/logo.png" class="w-full h-full object-contain" alt="Logo" />
        </div>
        <div class="flex flex-col">
          <span class="font-black text-soft-green-800 dark:text-soft-green-400 tracking-tight leading-none uppercase">{{ $t('app.title') }}</span>
        </div>
      </div>
      
      <!-- Logo as Menu Toggle on mobile (optional, but keep the bar for now) -->
      <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="w-10 h-10 rounded-xl bg-soft-green-50/50 dark:bg-slate-800/50 text-soft-green-600 dark:text-soft-green-400 flex items-center justify-center border border-soft-green-100/50 dark:border-slate-700/50 active:scale-95 transition-all">
        <i class="pi" :class="isMobileMenuOpen ? 'pi-times' : 'pi-bars'"></i>
      </button>
    </header>

    <!-- Sidebar Overlay (Mobile) -->
    <div 
      class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
      :class="isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
      @click="isMobileMenuOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside 
      class="fixed inset-y-0 left-0 w-80 bg-white dark:bg-slate-900 z-[70] lg:relative lg:w-72 lg:z-0 lg:translate-x-0 transition-transform duration-300 ease-in-out flex shadow-2xl lg:shadow-none"
      :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <Sidebar @close-mobile="isMobileMenuOpen = false" />
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-y-auto relative pt-16 pb-12 lg:pt-0 lg:pb-0 scroll-smooth">
      <!-- Background Decoration -->
      <div class="fixed top-0 right-0 w-full max-w-[500px] aspect-square bg-gradient-to-br from-soft-green-200/40 via-transparent to-transparent dark:from-soft-green-900/20 rounded-bl-full opacity-60 -z-10 blur-[100px] pointer-events-none"></div>
      <div class="fixed bottom-0 left-0 w-full max-w-[300px] aspect-square bg-gradient-to-tr from-lime-green-100/30 via-transparent to-transparent dark:from-lime-green-900/10 rounded-tr-full opacity-40 -z-10 blur-[80px] pointer-events-none"></div>

      <div class="w-full max-w-7xl mx-auto">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>


  </div>
</template>


<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

main {
  scrollbar-gutter: stable;
}
</style>
