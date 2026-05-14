<script setup lang="ts">
import type { GatherableItem } from '../types/game';

interface Props {
  item: GatherableItem;
  favoriteable?: boolean;
  isFavorite?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'select', item: GatherableItem): void;
  (e: 'toggle-favorite', item: GatherableItem): void;
}>();

function onImageError(e: Event) {
  (e.target as HTMLImageElement).style.display = 'none';
}

function toggleFavorite() {
  emit('toggle-favorite', props.item);
}
</script>

<template>
  <div class="item-card bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-[#52a890]" :id="`item-card-${props.item.itemId}`" @click="emit('select', props.item)">
    <button
      v-if="props.favoriteable"
      class="favorite-button"
      :class="{ 'is-favorite': props.isFavorite }"
      type="button"
      :aria-label="props.isFavorite ? $t('favoriteItems.removeAction') : $t('favoriteItems.addAction')"
      :title="props.isFavorite ? $t('favoriteItems.removeAction') : $t('favoriteItems.addAction')"
      @click.stop="toggleFavorite"
    >
      <i class="pi" :class="props.isFavorite ? 'pi-heart-fill' : 'pi-heart'"></i>
    </button>

    <!-- 圖示區 -->
    <div class="item-icon-wrap bg-slate-100 dark:bg-slate-900">
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
        <span class="item-name text-slate-800 dark:text-slate-100">{{ props.item.nameLocale }}</span>
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
        <span v-else-if="props.item.isCrystalGathering" class="item-crystal-badge">
          <i class="pi pi-sparkles"></i>
          {{ $t('createGuide.crystalGatheringSystem') }}
        </span>
        <span v-else class="item-regular-badge">
          <i class="pi pi-compass"></i>
          {{ $t('createGuide.regularSystem') }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.item-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 52px 16px 20px;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.favorite-button {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(255, 255, 255, 0.9);
  color: #94a3b8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.favorite-button:hover,
.favorite-button:focus-visible,
.favorite-button.is-favorite {
  color: #e11d48;
  border-color: rgba(225, 29, 72, 0.28);
  background: rgba(255, 241, 242, 0.95);
}

.favorite-button:hover {
  transform: scale(1.05);
}

.favorite-button:focus-visible {
  outline: 3px solid rgba(225, 29, 72, 0.2);
  outline-offset: 2px;
}

:global(.dark .favorite-button) {
  background: rgba(15, 23, 42, 0.88);
  border-color: rgba(148, 163, 184, 0.28);
  color: #94a3b8;
}

:global(.dark .favorite-button:hover),
:global(.dark .favorite-button:focus-visible),
:global(.dark .favorite-button.is-favorite) {
  background: rgba(136, 19, 55, 0.35);
  border-color: rgba(244, 63, 94, 0.38);
  color: #fb7185;
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

:global(.dark .item-card:hover) {
  box-shadow: 0 4px 20px rgba(82, 168, 144, 0.2);
}

.item-card:hover::before {
  opacity: 1;
}

/* 圖示 */
.item-icon-wrap {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  image-rendering: pixelated; /* 遊戲像素圖清晰渲染 */
}

.item-icon-placeholder {
  color: #94a3b8;
  font-size: 20px;
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
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 320px;
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
  gap: 8px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.item-glv-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #52a890, #3d8b75);
  color: white;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.item-collectable-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.item-collectable-badge .pi {
  font-size: 0.65rem;
}

.item-crystal-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #06b6d4, #0284c7);
  color: white;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.item-crystal-badge .pi {
  font-size: 0.65rem;
}

.item-regular-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.item-regular-badge .pi {
  font-size: 0.65rem;
}
</style>
