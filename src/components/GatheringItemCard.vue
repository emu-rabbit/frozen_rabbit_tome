<script setup lang="ts">
import type { GatherableItem } from '../types/game';

interface Props {
  item: GatherableItem;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'select', item: GatherableItem): void;
}>();

function onImageError(e: Event) {
  (e.target as HTMLImageElement).style.display = 'none';
}
</script>

<template>
  <div class="item-card bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-[#52a890]" :id="`item-card-${props.item.itemId}`" @click="emit('select', props.item)">
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
  padding: 16px 20px;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
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
