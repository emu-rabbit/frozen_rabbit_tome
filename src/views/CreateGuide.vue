<template>
  <div class="max-w-4xl">
    <div class="mb-8">
      <h2 class="text-3xl font-bold mb-2 text-soft-green">建立新秘笈</h2>
      <p class="text-white/60">開始規劃您的 FFXIV 採集路徑與資源配置。</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-soft-green/30 transition-all cursor-pointer group">
        <div class="w-12 h-12 rounded-xl bg-soft-green/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <i class="pi pi-map text-soft-green text-xl"></i>
        </div>
        <h3 class="text-xl font-semibold mb-2">採集路線規劃</h3>
        <p class="text-white/40 text-sm">串接採集點，計算最優採集順序與時間分配。</p>
      </div>

      <div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-soft-green/30 transition-all cursor-pointer group">
        <div class="w-12 h-12 rounded-xl bg-soft-green/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <i class="pi pi-calculator text-soft-green text-xl"></i>
        </div>
        <h3 class="text-xl font-semibold mb-2">產量模擬器</h3>
        <p class="text-white/40 text-sm">輸入屬性值，模擬技能循環並預測最終獲取數量。</p>
      </div>
    </div>
  </div>
</template>
