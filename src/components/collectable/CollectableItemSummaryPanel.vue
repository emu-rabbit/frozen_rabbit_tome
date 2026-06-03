<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import type { GatherableItem, GatheringJob } from '../../types/game';

const props = withDefaults(defineProps<{
  item: GatherableItem;
  itemName: string;
  jobs: GatheringJob[];
  itemRealLevel: number;
  successRate: number;
  boonChance?: number | null;
  collectableScourValue?: number | null;
  modelLabel?: string | null;
  changeItemLabel?: string | null;
  showChangeItem?: boolean;
}>(), {
  boonChance: null,
  collectableScourValue: null,
  modelLabel: null,
  changeItemLabel: null,
  showChangeItem: false
});

const emit = defineEmits<{
  changeItem: [];
}>();

const { t } = useI18n();
</script>

<template>
  <section class="panel item-panel">
    <div class="item-heading">
      <div class="item-icon-wrap">
        <img v-if="props.item.iconUrl" :src="props.item.iconUrl" class="item-icon" alt="" />
        <i v-else class="pi pi-box text-slate-400"></i>
      </div>
      <div class="min-w-0">
        <div class="item-badges">
          <span v-for="job in props.jobs" :key="job">{{ t(`game.jobs.${job}`) }}</span>
          <span>{{ t('createGuide.glv') }} {{ props.item.glv }}</span>
          <span>Lv {{ props.itemRealLevel || '-' }}</span>
          <span v-if="props.modelLabel">{{ props.modelLabel }}</span>
        </div>
        <h1>{{ props.itemName }}</h1>
      </div>
    </div>
    <div class="item-side">
      <div class="rate-grid">
        <div><span>{{ t('simulator.rates.success') }}</span><strong>{{ props.successRate }}%</strong></div>
        <div v-if="!props.item.isCollectable"><span>{{ t('simulator.rates.boon') }}</span><strong>{{ props.boonChance ?? '-' }}%</strong></div>
        <div v-else><span>{{ t('collectableSolver.stats.scourValue') }}</span><strong>{{ props.collectableScourValue ?? '-' }}</strong></div>
      </div>
      <Button
        v-if="props.showChangeItem"
        icon="pi pi-search"
        :label="props.changeItemLabel ?? t('frontier.workspace.changeItem')"
        class="p-button-text p-button-sm item-change-button"
        @click="emit('changeItem')"
      />
    </div>
  </section>
</template>

<style scoped>
.panel {
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: white;
  padding: 1rem;
  box-shadow: 0 2px 10px rgb(15 23 42 / 0.04);
}

:global(html.dark .panel) {
  border-color: #334155;
  background: #0f172a;
}

.item-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.25rem;
  align-items: center;
}

.item-heading {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.item-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  overflow: hidden;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-icon {
  width: 48px;
  height: 48px;
  image-rendering: pixelated;
}

.item-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.item-badges span {
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: #ecfdf5;
  color: #15803d;
  font-size: 0.75rem;
  font-weight: 900;
}

.item-heading h1 {
  margin: 0.35rem 0 0;
  color: #1e293b;
  font-size: 1.45rem;
  font-weight: 900;
  overflow-wrap: anywhere;
}

:global(html.dark .item-heading h1) {
  color: #f8fafc;
}

.item-side {
  display: grid;
  gap: 0.65rem;
  align-items: center;
}

.rate-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  align-items: stretch;
}

.rate-grid div {
  min-height: 74px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  background: #f8fafc;
  padding: 0.85rem 1rem;
}

:global(html.dark .rate-grid div) {
  border-color: rgb(51 65 85 / 0.7);
  background: rgb(30 41 59 / 0.65);
}

.rate-grid span {
  display: block;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
  line-height: 1.25;
  white-space: nowrap;
}

.rate-grid strong {
  display: block;
  margin-top: 0.2rem;
  color: #0f172a;
  font-size: 1.32rem;
  font-weight: 900;
  line-height: 1.15;
}

:global(html.dark .rate-grid strong) {
  color: #f8fafc;
}

.item-change-button {
  justify-self: start;
}

@media (min-width: 768px) {
  .item-panel {
    grid-template-columns: minmax(0, 1fr) minmax(18rem, 0.48fr);
  }

  .item-change-button {
    justify-self: end;
  }
}

@media (max-width: 520px) {
  .rate-grid {
    grid-template-columns: 1fr;
  }
}
</style>
