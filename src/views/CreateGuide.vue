<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
    <div class="w-24 h-24 mb-8 relative">
      <div class="absolute inset-0 bg-soft-green-500/20 rounded-full animate-ping"></div>
      <div class="relative w-full h-full bg-soft-green-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-soft-green-500/20">
        <i class="pi pi-hammer text-4xl animate-bounce"></i>
      </div>
    </div>
    
    <h2 class="text-3xl md:text-4xl font-black mb-4 text-slate-800 dark:text-white tracking-tight leading-tight uppercase">
      本頁面正在施工中
    </h2>
    
    <p class="text-slate-500 dark:text-slate-400 text-lg max-w-md leading-relaxed font-bold tracking-wider">
      COMING SOON
    </p>

    <div class="mt-12 h-1 w-24 bg-gradient-to-r from-transparent via-soft-green-500/50 to-transparent rounded-full"></div>
  </div>
</template>

<style scoped>
/* Smooth entrance animation */
div {
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
