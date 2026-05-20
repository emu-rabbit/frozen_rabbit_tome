<script setup lang="ts">
defineOptions({ name: 'CreateExperiment' });

import { ref, watch, onActivated } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import GatheringItemCard from '../components/GatheringItemCard.vue';
import {
  searchGatherables,
  isGameDataLoading,
  currentLanguage,
} from '../services/gameData';
import type { GatherableItem } from '../types/game';
import { useRouter } from 'vue-router';
import { useSimulatorStats } from '../composables/useSimulatorStats';
import { useSearchStore } from '../composables/useSearchStore';
import { useFavoriteItems } from '../composables/useFavoriteItems';
import { applySanitizedPaste, stripSpecialSearchCharacters } from '../utils/searchText';

const { t } = useI18n();
const router = useRouter();
const { setSelectedItem } = useSimulatorStats();
const { isFavorite, toggleFavorite } = useFavoriteItems();

function handleItemSelect(item: GatherableItem) {
  setSelectedItem(item);
  router.push({ path: '/simulator', query: { new: '1' } });
}

// === 搜尋狀態 ===
// 使用 module-level ref（而非 reactive 物件）讓 KeepAlive 能保留狀態。
// 即使 KeepAlive 未生效（例如路由配置變動），這些 ref 也會常駐於記憶體中。
const { createExperimentSearchQuery: searchQuery } = useSearchStore();
const searchResults = ref<GatherableItem[]>([]);
const hasSearched = ref(false);
const isSearching = ref(false);
const apiError = ref(false);
/** 記錄上次執行搜尋時的語言，用於 onActivated 比對是否需要重搜 */
let lastSearchedLang = '';

async function doSearch(query: string) {
  if (!query.trim()) {
    searchResults.value = [];
    apiError.value = false;
    return;
  }
  isSearching.value = true;
  hasSearched.value = true;
  apiError.value = false;
  lastSearchedLang = currentLanguage.value;
  try {
    searchResults.value = await searchGatherables(query);
  } catch (err) {
    console.error('[CreateGuide] Search failed:', err);
    apiError.value = true;
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
}

// Debounced 搜尋 — 使用者輸入後 450ms 執行
watchDebounced(
  searchQuery,
  (query) => doSearch(query),
  { debounce: 450 }
);

// === 語言切換：自動重新搜尋以更新顯示名稱 ===
// 監聽 gameData service 的 currentLanguage ref：
// 語言切換且字典載入完成後，立即重算搜尋結果（更新顯示名稱）
watch(currentLanguage, async (newLang) => {
  if (searchQuery.value.trim()) {
    lastSearchedLang = newLang;
    isSearching.value = true;
    apiError.value = false;
    try {
      searchResults.value = await searchGatherables(searchQuery.value);
    } catch (err) {
      console.error('[CreateGuide] Search failed on language change:', err);
      apiError.value = true;
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  }
});

// === KeepAlive 回來時的語言檢查 ===
// 使用者在設定頁修改語言後返回時，若語言已變動則重新搜尋
// 這是雙重保障：watch(currentLanguage) 在同頁面有效，onActivated 覆蓋跨頁面情境
onActivated(async () => {
  if (
    searchQuery.value.trim() &&
    currentLanguage.value &&
    currentLanguage.value !== lastSearchedLang
  ) {
    lastSearchedLang = currentLanguage.value;
    isSearching.value = true;
    apiError.value = false;
    try {
      searchResults.value = await searchGatherables(searchQuery.value);
    } catch (err) {
      console.error('[CreateGuide] Search failed on activated:', err);
      apiError.value = true;
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  }
});

function clearSearch() {
  searchQuery.value = '';
  hasSearched.value = false;
  isSearching.value = false;
  apiError.value = false;
  searchResults.value = [];
  lastSearchedLang = '';
}

function handleSearchPaste(event: ClipboardEvent) {
  const pastedText = event.clipboardData?.getData('text') ?? '';
  if (!pastedText || stripSpecialSearchCharacters(pastedText) === pastedText) return;

  event.preventDefault();
  searchQuery.value = applySanitizedPaste(
    searchQuery.value,
    pastedText,
    (event.target as HTMLInputElement | null)?.selectionStart,
    (event.target as HTMLInputElement | null)?.selectionEnd
  );
}

// 搜尋 UI 狀態機
function getUiState() {
  if (apiError.value) return 'error';
  if (isGameDataLoading.value || isSearching.value) return 'loading';
  if (!hasSearched.value || !searchQuery.value.trim()) return 'idle';
  if (searchResults.value.length === 0) return 'empty';
  return 'results';
}
</script>

<template>
  <div class="create-guide-page">
    <!-- === Header === -->
    <header class="page-header">
      <div class="header-content">
        <h2 class="page-title text-soft-green-800 dark:text-soft-green-400">{{ t('createExperiment.title') }}</h2>
        <p class="page-description text-sm text-slate-600 dark:text-slate-300 font-medium mb-4">{{ t('createExperiment.description') }}</p>
        <div class="data-scope-badge">
          <i class="pi pi-info-circle"></i>
          <span>{{ t('createExperiment.dataScope') }}</span>
        </div>
      </div>
    </header>

    <!-- === 搜尋列 === -->
    <div class="search-section">
      <IconField class="search-field">
        <InputIcon>
          <i v-if="isGameDataLoading" class="pi pi-spin pi-spinner search-spinner"></i>
          <i v-else class="pi pi-search search-icon"></i>
        </InputIcon>
        <InputText
          id="item-search-input"
          v-model="searchQuery"
          :placeholder="isGameDataLoading ? t('createGuide.loading') : t('createGuide.searchPlaceholder')"
          :disabled="isGameDataLoading"
          class="search-input"
          autocomplete="off"
          @paste="handleSearchPaste"
        />
        <InputIcon v-if="searchQuery" style="cursor:pointer" @click="clearSearch">
          <i class="pi pi-times clear-icon"></i>
        </InputIcon>
      </IconField>
    </div>

    <!-- === 結果區域 === -->
    <div class="results-section">

      <!-- 載入中 -->
      <transition name="state-fade" mode="out-in">
        <div v-if="getUiState() === 'loading'" key="loading" class="state-container">
          <div class="loading-animation">
            <div class="loading-orb"></div>
            <div class="loading-orb delay-1"></div>
            <div class="loading-orb delay-2"></div>
          </div>
          <p class="state-text">{{ t('createGuide.loading') }}</p>
        </div>

        <!-- 初始狀態（未搜尋） -->
        <div v-else-if="getUiState() === 'idle'" key="idle" class="state-container">
          <div class="idle-icon">
            <i class="pi pi-search"></i>
          </div>
          <p class="state-text">{{ t('createGuide.typeToSearch') }}</p>
        </div>

        <!-- 無結果 -->
        <div v-else-if="getUiState() === 'empty'" key="empty" class="state-container">
          <div class="empty-icon">
            <i class="pi pi-inbox"></i>
          </div>
          <p class="state-text">{{ t('createGuide.noResults') }}</p>
        </div>

        <!-- 錯誤狀態 -->
        <div v-else-if="getUiState() === 'error'" key="error" class="state-container error-state">
          <div class="error-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <p class="state-text error-text">{{ t('createGuide.apiError') }}</p>
          <button class="retry-btn" @click="doSearch(searchQuery)">
            <i class="pi pi-refresh"></i> {{ t('createGuide.retrySearch') }}
          </button>
        </div>

        <!-- 搜尋結果 -->
        <div v-else key="results">
          <div class="results-count">
            <span>{{ t('createGuide.resultCount', { count: searchResults.length, plus: searchResults.length >= 50 ? '+' : '' }) }}</span>
          </div>
          <div class="results-grid">
            <GatheringItemCard
              v-for="item in searchResults"
              :key="item.itemId"
              :item="item"
              favoriteable
              :is-favorite="isFavorite(item.itemId)"
              @toggle-favorite="toggleFavorite"
              @select="handleItemSelect"
            />
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<style scoped>
.create-guide-page {
  padding: 2rem 1.5rem;
  max-width: 860px;
  margin: 0 auto;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: pageIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@media (min-width: 768px) {
  .create-guide-page {
    padding: 2.5rem 2rem;
  }
}

@keyframes pageIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* === Header === */
.page-header {
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0 0 0.35rem 0;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

@media (min-width: 768px) {
  .page-title { font-size: 2.1rem; }
}

.page-subtitle {
  font-size: 0.9rem;
  margin: 0 0 0.85rem 0;
}

.data-scope-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(82, 168, 144, 0.1);
  border: 1px solid rgba(82, 168, 144, 0.25);
  border-radius: 20px;
  font-size: 0.78rem;
  color: #3d8b75;
  align-self: flex-start;
}

:global(.dark .data-scope-badge) {
  background: rgba(82, 168, 144, 0.12);
  border-color: rgba(82, 168, 144, 0.3);
  color: #52a890;
}

.data-scope-badge .pi {
  font-size: 0.78rem;
}

/* === 搜尋列 === */
.search-section {
  position: relative;
}

.search-field {
  width: 100%;
}

.search-spinner,
.search-icon {
  color: #52a890;
}

.search-icon {
  color: #94a3b8;
}

.clear-icon {
  color: #94a3b8;
  transition: color 0.15s;
}

.clear-icon:hover {
  color: #64748b;
}

:deep(.search-input) {
  width: 100% !important;
  padding: 1rem 3rem !important;
  border-radius: 16px !important;
  background: white !important;
  border: 1.5px solid #e2e8f0 !important;
  font-size: 1rem !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
  transition: all 0.2s !important;
}

:global(.dark .search-input) {
  background: #1e293b !important;
  border-color: #334155 !important;
  color: #f1f5f9 !important;
}

:deep(.search-input:focus) {
  border-color: #52a890 !important;
  box-shadow: 0 0 0 4px rgba(82, 168, 144, 0.15), 0 2px 8px rgba(0, 0, 0, 0.06) !important;
}

:deep(.search-input:disabled) {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
}

/* === 狀態切換動畫 === */
.state-fade-enter-active,
.state-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.state-fade-enter-from,
.state-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* === 結果區域 === */
.results-section {
  flex: 1;
}

/* 狀態容器（loading/idle/empty） */
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 1rem;
}

.state-text {
  font-size: 0.9rem;
  color: #94a3b8;
  text-align: center;
  margin: 0;
}

/* Loading 動畫球 */
.loading-animation {
  display: flex;
  gap: 8px;
  align-items: center;
}

.loading-orb {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #52a890;
  animation: bounce 1.2s ease-in-out infinite;
}

.loading-orb.delay-1 { animation-delay: 0.2s; }
.loading-orb.delay-2 { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* Idle/Empty 圖示 */
.idle-icon,
.empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.idle-icon {
  background: rgba(82, 168, 144, 0.1);
  color: #52a890;
}

.empty-icon {
  background: #f1f5f9;
  color: #94a3b8;
}

:global(.dark .empty-icon) {
  background: #1e293b;
  color: #64748b;
}

/* Error 狀態 */
.error-state {
  max-width: 400px;
  margin: 0 auto;
}

.error-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.error-text {
  color: #ef4444;
  line-height: 1.5;
}

.retry-btn {
  margin-top: 0.5rem;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  border: none;
  background: #52a890;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #3d8b75;
}

/* === 搜尋結果 === */
.results-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 1024px) {
  .results-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.results-count {
  font-size: 0.78rem;
  color: #94a3b8;
  padding: 0 4px 4px;
}

:global(.dark .results-count) {
  color: #94a3b8;
}

:global(.dark .state-text) {
  color: #94a3b8;
}
</style>
