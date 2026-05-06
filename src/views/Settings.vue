<template>
  <div class="max-w-2xl">
    <div class="mb-8">
      <h2 class="text-3xl font-bold mb-2 text-soft-green">設定</h2>
      <p class="text-white/60">自定義您的工具體驗與偏好設定。</p>
    </div>

    <div class="space-y-6">
      <div class="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 class="text-lg font-medium mb-4 flex items-center gap-2">
          <i class="pi pi-user text-soft-green"></i>
          個人設定
        </h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span>顯示角色名稱</span>
            <div class="w-10 h-6 bg-soft-green/20 rounded-full relative cursor-pointer">
              <div class="absolute left-1 top-1 w-4 h-4 bg-soft-green rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 class="text-lg font-medium mb-4 flex items-center gap-2">
          <i class="pi pi-globe text-soft-green"></i>
          語言與地區
        </h3>
        <div class="text-sm text-white/40">
          目前預設：繁體中文 (Traditional Chinese)
        </div>
      </div>
    </div>
  </div>
</template>
