<script setup lang="ts">
defineOptions({ name: 'Solver' });
import { onMounted, watch, onActivated } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSolver } from '../composables/useSolver';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import { useSettings } from '../composables/useSettings';

const { t } = useI18n();
const {
  activeItem,
  solverStats,
  isDataLoading,
  fetchItemLevelData,
  saveToSettings,
  successRate,
  boonChance,
  isPerceptionMet,
  baseValues,
  syncFromSettings,
  itemRealLevel,
  displayName,
  temporaryGp,
  nodeBonuses,
  solve,
  rotationResult,
  isSolving
} = useSolver();

const { userStats } = useSettings();

onMounted(() => {
  fetchItemLevelData();
});

// 當使用者從設定頁切換回來時，觸發同步以獲取最新數值
onActivated(() => {
  syncFromSettings();
});

// 當全域設定變更時，若在求解器頁面，也應觸發同步
watch(userStats, () => {
  syncFromSettings();
}, { deep: true });

function handleSync() {
  saveToSettings();
  // 這裡可以加入提示
}
</script>

<template>
  <div class="solver-page p-6 max-w-4xl mx-auto">
    <!-- === 未選擇物品 (引導畫面) === -->
    <div v-if="!activeItem?.itemId" class="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div class="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-8 border-2 border-dashed border-slate-200 dark:border-slate-700">
        <i class="pi pi-map text-4xl text-slate-300"></i>
      </div>
      <h2 class="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-3">{{ t('solver.noItemTitle') }}</h2>
      <p class="text-slate-500 dark:text-slate-400 mb-10 max-w-sm mx-auto leading-relaxed">
        {{ t('solver.noItemDesc') }}
      </p>
      <router-link to="/">
        <Button 
          :label="t('solver.goToCreate')" 
          icon="pi pi-search" 
          class="p-button-primary p-button-lg rounded-2xl px-10 shadow-lg shadow-emerald-200 dark:shadow-none" 
        />
      </router-link>
    </div>

    <!-- === 收藏品警告 === -->
    <div v-else-if="activeItem.isCollectable" class="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div class="w-20 h-20 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-6">
        <i class="pi pi-hammer text-3xl text-purple-500"></i>
      </div>
      <h2 class="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">{{ displayName }}</h2>
      <p class="text-purple-600 dark:text-purple-400 font-semibold">{{ t('solver.collectableWarning') }}</p>
    </div>

    <!-- === 求解器主畫面 === -->
    <div v-else class="space-y-6 animate-page-in">
      <!-- 物品標題卡 -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        <div class="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-4 sm:gap-6 text-center sm:text-left">
          <div class="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
            <img v-if="activeItem.iconUrl" :src="activeItem.iconUrl" class="w-12 h-12 pixelated" />
            <i v-else class="pi pi-box text-2xl text-slate-400"></i>
          </div>
          <div class="flex-1">
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <span class="text-xs font-bold px-2 py-0.5 bg-soft-green-500 text-white rounded-md uppercase tracking-wider">
                {{ t(`game.jobs.${activeItem.jobType}`) }}
              </span>
              <span class="text-xs font-bold px-2 py-0.5 bg-slate-700 text-slate-100 rounded-md">
                GLV {{ activeItem.glv }}
              </span>
              <span v-if="itemRealLevel > 0" class="text-xs font-bold px-2 py-0.5 bg-amber-500 text-white rounded-md">
                Lv {{ itemRealLevel }}
              </span>
            </div>
            <h1 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{{ displayName }}</h1>
          </div>
        </div>

        <!-- 鑑別力不足警告 -->
        <div v-if="!isPerceptionMet" class="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl animate-shake">
          <i class="pi pi-exclamation-circle text-red-500 text-lg"></i>
          <div class="flex flex-col">
            <span class="text-red-600 dark:text-red-400 font-bold text-sm">鑑別力不達標，無法採集</span>
            <span class="text-red-500/80 dark:text-red-400/60 text-[10px]">最低需求: {{ activeItem.perceptionReq }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <!-- 數值調整區 -->
        <div class="md:col-span-2">
          <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h3 class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <i class="pi pi-user-edit text-soft-green-500"></i>
                {{ t('solver.statsTitle') }}
              </h3>
              <Button 
                icon="pi pi-save" 
                :label="t('solver.syncToSettings', { job: t(`game.jobs.${activeItem.jobType}`) })" 
                class="p-button-text p-button-sm text-xs" 
                @click="handleSync"
              />
            </div>
            
            <div class="flex flex-col sm:grid sm:grid-cols-2 gap-x-6 gap-y-4 flex-1">
              <!-- 第一排：等級 (手機版滿寬，桌面版跨兩欄) -->
              <div class="sm:col-span-2 flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t('game.stats.level') }}</label>
                <InputNumber v-model="solverStats.level" :min="1" :max="100" class="w-full" fluid />
              </div>

              <!-- 第二排：獲得力 與 鑑別力 -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t('game.stats.gathering') }}</label>
                <InputNumber v-model="solverStats.gathering" :min="0" class="w-full" fluid />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t('game.stats.perception') }}</label>
                <InputNumber v-model="solverStats.perception" :min="0" class="w-full" fluid />
              </div>

              <!-- 第三排：當前 GP 與 最大 GP -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider flex flex-wrap items-center justify-between gap-1">
                  <span>{{ t('solver.currentGp') }}</span>
                  <span class="text-[10px] text-amber-600">MAX: {{ solverStats.gp }}</span>
                </label>
                <InputNumber v-model="temporaryGp" :min="0" :max="solverStats.gp" class="w-full" fluid />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-wider truncate" :title="t('solver.maxGp')">{{ t('solver.maxGp') }}</label>
                <InputNumber v-model="solverStats.gp" :min="0" class="w-full" fluid />
              </div>
            </div>
          </div>
        </div>

        <!-- 結果顯示區 -->
        <div class="flex flex-col gap-4">
          <!-- 成功率卡片 -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group flex-1 flex flex-col justify-center">
            <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <i class="pi pi-check-circle text-6xl text-soft-green-500"></i>
            </div>
            <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">{{ t('solver.results.gatheringRate') }}</p>
            <div class="flex items-baseline gap-1 relative z-10">
              <template v-if="isPerceptionMet">
                <span class="text-4xl font-black text-slate-800 dark:text-slate-100">{{ successRate }}</span>
                <span class="text-xl font-bold text-slate-400">%</span>
              </template>
              <span v-else class="text-3xl font-black text-red-500 dark:text-red-400">未知</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full mt-4 overflow-hidden border border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
              <div 
                class="h-full rounded-full" 
                :style="`width: ${isPerceptionMet ? successRate : 0}%; background-color: #52a890;`"
              ></div>
            </div>
          </div>

          <!-- 加成率卡片 -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group flex-1 flex flex-col justify-center">
            <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <i class="pi pi-star text-6xl text-amber-500"></i>
            </div>
            <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">{{ t('solver.results.boonRate') }}</p>
            <div class="flex items-baseline gap-1 relative z-10">
              <template v-if="isPerceptionMet">
                <span class="text-4xl font-black text-slate-800 dark:text-slate-100">{{ boonChance }}</span>
                <span class="text-xl font-bold text-slate-400">%</span>
              </template>
              <span v-else class="text-3xl font-black text-red-500 dark:text-red-400">未知</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full mt-4 overflow-hidden border border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
              <div 
                class="h-full rounded-full" 
                :style="`width: ${isPerceptionMet ? (boonChance / 60 * 100).toFixed(1) : 0}%; background-color: #f59e0b;`"
              ></div>
            </div>
            <p class="text-[9px] text-slate-400 mt-2 font-bold text-right">MAX 60%</p>
          </div>
        </div>
      </div>

      <!-- 採集點獎勵區 -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm animate-page-in" style="animation-delay: 0.1s;">
        <h3 class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-6">
          <i class="pi pi-gift text-amber-500"></i>
          {{ t('solver.nodeBonusesTitle') }}
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
              {{ t('solver.nodeBonuses.baseIntegrity') }}
              <span class="text-slate-300 dark:text-slate-600 font-medium">({{ t('game.units.times') }})</span>
            </label>
            <InputNumber v-model="nodeBonuses.baseIntegrity" :min="1" :max="10" fluid class="w-full" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
              {{ t('solver.nodeBonuses.gatheringCount') }}
              <span class="text-slate-300 dark:text-slate-600 font-medium">({{ t('game.units.times') }})</span>
            </label>
            <InputNumber v-model="nodeBonuses.gatheringCount" :min="0" :max="10" fluid class="w-full" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
              {{ t('solver.nodeBonuses.yieldCount') }}
              <span class="text-slate-300 dark:text-slate-600 font-medium">({{ t('game.units.count') }})</span>
            </label>
            <InputNumber v-model="nodeBonuses.yieldCount" :min="0" :max="50" fluid class="w-full" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
              {{ t('solver.nodeBonuses.extraRate') }}
              <span class="text-slate-300 dark:text-slate-600 font-medium">({{ t('game.units.percent') }})</span>
            </label>
            <InputNumber v-model="nodeBonuses.extraRate" :min="0" :max="100" fluid class="w-full" />
          </div>
        </div>
      </div>

      <!-- 策略演算區 -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm animate-page-in" style="animation-delay: 0.2s;">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          <div class="flex flex-col gap-1 text-center sm:text-left">
            <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center sm:justify-start gap-2">
              <i class="pi pi-bolt text-amber-500"></i>
              最佳採集策略演算
            </h3>
            <p class="text-sm text-slate-500">基於當前 GP 與屬性，由背景 Worker 進行窮舉演算</p>
          </div>
          <Button 
            label="開始演算" 
            icon="pi pi-play" 
            class="p-button-primary p-button-lg rounded-2xl px-8 shadow-md"
            :loading="isSolving"
            @click="solve"
          />
        </div>

        <!-- 演算結果 -->
        <div v-if="rotationResult" class="space-y-6">
          <div class="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">建議手法順序</p>
            <div class="flex flex-wrap items-center gap-2">
              <template v-for="(action, index) in rotationResult.bestRotation" :key="index">
                <span 
                  class="px-4 py-2 rounded-xl text-sm font-bold shadow-sm"
                  :class="action === '採集' ? 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700' : 'bg-soft-green-500 text-white'"
                >
                  {{ action }}
                </span>
                <i v-if="index < rotationResult.bestRotation.length - 1" class="pi pi-angle-right text-slate-300"></i>
              </template>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 flex flex-col items-center justify-center">
              <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">預估總產量 (EV)</span>
              <span class="text-2xl font-black text-emerald-700 dark:text-emerald-300">{{ rotationResult.expectedYield }}</span>
            </div>
            <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">演算耗時</span>
              <span class="text-2xl font-black text-slate-600 dark:text-slate-400">{{ rotationResult.calculationTime }}<span class="text-xs ml-1">ms</span></span>
            </div>
          </div>
        </div>

        <!-- 初始狀態或計算中 -->
        <div v-else-if="isSolving" class="py-12 flex flex-col items-center justify-center gap-4 text-slate-400">
          <i class="pi pi-spin pi-spinner text-4xl"></i>
          <p class="font-medium animate-pulse">正在為您尋找最優解...</p>
        </div>
        
        <div v-else class="py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-3 text-slate-400">
          <i class="pi pi-calculator text-3xl opacity-20"></i>
          <p class="text-sm">點擊上方按鈕開始計算最佳策略</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pixelated {
  image-rendering: pixelated;
}
.animate-page-in {
  animation: pageIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}
@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
  40%, 60% { transform: translate3d(3px, 0, 0); }
}
</style>
