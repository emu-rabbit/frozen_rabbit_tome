<template>
  <div class="max-w-5xl mx-auto">
    <!-- Hero Section -->
    <div class="mb-12 relative">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-soft-green-100 dark:bg-soft-green-900/30 border border-soft-green-200 dark:border-soft-green-800/50 mb-4">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-soft-green-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-soft-green-500"></span>
        </span>
        <span class="text-[10px] font-black uppercase tracking-widest text-soft-green-700 dark:text-soft-green-400">FFXIV Dawntrail Ready</span>
      </div>
      <h2 class="text-4xl md:text-5xl font-black mb-4 text-slate-800 dark:text-white tracking-tight leading-tight">
        {{ $t('createGuide.title') }}
      </h2>
      <p class="text-slate-500 dark:text-slate-400 text-lg max-w-2xl leading-relaxed">
        {{ $t('createGuide.description') }}
      </p>
    </div>

    <!-- Feature Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
      <!-- Path Planning Card -->
      <div class="group relative p-8 rounded-3xl bg-white dark:bg-slate-900 border border-soft-green-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-soft-green-500/5 transition-all duration-500 cursor-pointer overflow-hidden">
        <!-- Background Pattern -->
        <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
          <i class="pi pi-map text-9xl text-soft-green-500"></i>
        </div>
        
        <div class="relative z-10">
          <div class="w-16 h-16 rounded-2xl bg-soft-green-50 dark:bg-soft-green-900/20 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
            <i class="pi pi-map text-soft-green-600 dark:text-soft-green-400 text-3xl"></i>
          </div>
          
          <h3 class="text-2xl font-black mb-3 text-slate-800 dark:text-white tracking-tight uppercase">
            {{ $t('createGuide.pathPlanning') }}
          </h3>
          <p class="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
            {{ $t('createGuide.pathPlanningDesc') }}
          </p>
          
          <div class="flex items-center gap-2 text-soft-green-600 dark:text-soft-green-400 font-bold group-hover:gap-3 transition-all">
            <span>{{ $t('common.getStarted') || '立即開始' }}</span>
            <i class="pi pi-arrow-right text-sm"></i>
          </div>
        </div>

        <!-- Hover Glow -->
        <div class="absolute inset-0 bg-gradient-to-br from-soft-green-500/0 via-soft-green-500/0 to-soft-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      <!-- Simulator Card -->
      <div class="group relative p-8 rounded-3xl bg-white dark:bg-slate-900 border border-soft-green-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-soft-green-500/5 transition-all duration-500 cursor-pointer overflow-hidden">
        <!-- Background Pattern -->
        <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
          <i class="pi pi-calculator text-9xl text-soft-green-500"></i>
        </div>

        <div class="relative z-10">
          <div class="w-16 h-16 rounded-2xl bg-soft-green-50 dark:bg-soft-green-900/20 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-inner">
            <i class="pi pi-calculator text-soft-green-600 dark:text-soft-green-400 text-3xl"></i>
          </div>
          
          <h3 class="text-2xl font-black mb-3 text-slate-800 dark:text-white tracking-tight uppercase">
            {{ $t('createGuide.simulator') }}
          </h3>
          <p class="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
            {{ $t('createGuide.simulatorDesc') }}
          </p>

          <div class="flex items-center gap-2 text-soft-green-600 dark:text-soft-green-400 font-bold group-hover:gap-3 transition-all">
            <span>{{ $t('common.getStarted') || '立即開始' }}</span>
            <i class="pi pi-arrow-right text-sm"></i>
          </div>
        </div>

        <!-- Hover Glow -->
        <div class="absolute inset-0 bg-gradient-to-br from-soft-green-500/0 via-soft-green-500/0 to-soft-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
    </div>

    <!-- Quick Stats or Tip (Optional Footer for aesthetics) -->
    <div class="mt-12 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-soft-green-500 flex items-center justify-center text-white">
          <i class="pi pi-info-circle"></i>
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          <strong>Tip:</strong> {{ $t('createGuide.tip') || '點擊上方卡片開始規劃您的採集路徑。' }}
        </p>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-center">
          <p class="text-[10px] uppercase font-black tracking-widest text-slate-400">Nodes</p>
          <p class="text-xl font-black text-soft-green-600">842+</p>
        </div>
        <div class="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
        <div class="text-center">
          <p class="text-[10px] uppercase font-black tracking-widest text-slate-400">Skills</p>
          <p class="text-xl font-black text-soft-green-600">12</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth entrance animation */
.max-w-5xl {
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
