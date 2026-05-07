<script setup lang="ts">
import { ref } from 'vue';
import type { GatherableItem } from '../types/game';

interface Props {
  item: GatherableItem;
}

const props = defineProps<Props>();
const isFavorite = ref(false);

const emit = defineEmits<{
  (e: 'select', item: GatherableItem): void;
}>();

function toggleFavorite() {
  isFavorite.value = !isFavorite.value;
}

function onImageError(e: Event) {
  (e.target as HTMLImageElement).style.display = 'none';
}
</script>

<template>
  <div class="item-card" :id="`item-card-${props.item.itemId}`" @click="emit('select', props.item)">
    <!-- 圖示區 -->
    <div class="item-icon-wrap">
      <img
        v-if="props.item.iconUrl"
        :src="props.item.iconUrl"
        :alt="props.item.nameEn"
        class="item-icon"
        loading="lazy"
        @error="onImageError"
      />
      <div v-else class="item-icon-placeholder">
        <i class="pi pi-box"></i>
      </div>
    </div>

    <!-- 資訊區 -->
    <div class="item-info">
      <div class="item-name-row">
        <span class="item-name">{{ props.item.nameLocale }}</span>
        <span v-if="props.item.isFallback" class="item-no-translation">
          {{ $t('createGuide.noTranslation') }}
        </span>
      </div>
      <div class="item-meta">
        <span class="item-glv-badge">{{ $t('createGuide.glv') }} {{ props.item.glv }}</span>
        <span v-if="props.item.isCollectable" class="item-collectable-badge">
          <i class="pi pi-box"></i>
          {{ $t('createGuide.collectableSystem') }}
        </span>
        <span v-else class="item-regular-badge">
          <i class="pi pi-compass"></i>
          {{ $t('createGuide.regularSystem') }}
        </span>
      </div>
    </div>

    <!-- 收藏按鈕 -->
    <button
      class="item-favorite-btn"
      :class="{ active: isFavorite }"
      :aria-label="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
      @click.stop="toggleFavorite"
    >
      <i :class="isFavorite ? 'pi pi-star-fill' : 'pi pi-star'"></i>
    </button>
  </div>
</template>

<style scoped>
.item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  dark: background #1e293b; /* dark mode handled below */
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

:global(.dark) .item-card {
  background: #1e293b;
  border-color: #334155;
}

.item-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 60%, rgba(82, 168, 144, 0.05));
  opacity: 0;
  transition: opacity 0.2s;
}

.item-card:hover {
  border-color: #52a890;
  box-shadow: 0 4px 20px rgba(82, 168, 144, 0.15);
  transform: translateY(-1px);
}

:global(.dark) .item-card:hover {
  border-color: #52a890;
  box-shadow: 0 4px 20px rgba(82, 168, 144, 0.2);
}

.item-card:hover::before {
  opacity: 1;
}

/* 圖示 */
.item-icon-wrap {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

:global(.dark) .item-icon-wrap {
  background: #0f172a;
}

.item-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  image-rendering: pixelated; /* 遊戲像素圖清晰渲染 */
}

.item-icon-placeholder {
  color: #94a3b8;
  font-size: 18px;
}

/* 資訊區 */
.item-info {
  flex: 1;
  min-width: 0;
}

.item-name-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}

.item-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

:global(.dark) .item-name {
  color: #f1f5f9;
}

.item-no-translation {
  font-size: 0.7rem;
  color: #94a3b8;
  white-space: nowrap;
  flex-shrink: 0;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.item-glv-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  background: linear-gradient(135deg, #52a890, #3d8b75);
  color: white;
  letter-spacing: 0.02em;
}

.item-collectable-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  letter-spacing: 0.02em;
}

.item-collectable-badge .pi {
  font-size: 0.65rem;
}

.item-regular-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  letter-spacing: 0.02em;
}

.item-regular-badge .pi {
  font-size: 0.65rem;
}

/* 收藏按鈕 */
.item-favorite-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s;
  position: relative;
  z-index: 1;
}

.item-favorite-btn:hover {
  background: rgba(234, 179, 8, 0.1);
  color: #eab308;
  transform: scale(1.15);
}

.item-favorite-btn.active {
  color: #eab308;
}

.item-favorite-btn.active:hover {
  color: #ca8a04;
}
</style>
