<script setup lang="ts">
defineOptions({
  name: 'FoodAutoComplete',
  inheritAttrs: false
});

import { ref, useAttrs } from 'vue';
import { useI18n } from 'vue-i18n';
import AutoComplete from 'primevue/autocomplete';
import { searchFoodOptions, type FoodOption } from '../services/foodOptions';

defineProps<{
  modelValue: FoodOption | null;
  placeholder?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: FoodOption | null];
}>();

const attrs = useAttrs();
const { t } = useI18n();
const suggestions = ref<FoodOption[]>([]);

function searchFoods(event: { query: string }) {
  suggestions.value = searchFoodOptions(event.query, t);
}

function updateModel(value: FoodOption | null) {
  emit('update:modelValue', value);
}
</script>

<template>
  <AutoComplete
    v-bind="attrs"
    :model-value="modelValue"
    :suggestions="suggestions"
    optionLabel="label"
    :placeholder="placeholder"
    forceSelection
    dropdown
    showClear
    @update:modelValue="updateModel"
    @complete="searchFoods"
  >
    <template #option="{ option }">
      <div class="food-option">
        <span class="food-option-icon">
          <img v-if="option.iconUrl" :src="option.iconUrl" :alt="option.name" />
          <i v-else class="pi pi-box"></i>
        </span>
        <span
          class="food-option-quality"
          :class="option.quality === 'hq' ? 'is-hq' : 'is-nq'"
        >
          {{ t(`solver.food.${option.quality}`) }}
        </span>
        <span class="food-option-copy">
          <span class="food-option-name">{{ option.name }}</span>
          <span class="food-option-summary">{{ option.summary }}</span>
        </span>
      </div>
    </template>
  </AutoComplete>
</template>

<style scoped>
.food-option {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
}

.food-option-icon {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0.5rem;
  background: #f1f5f9;
  color: #94a3b8;
}

.food-option-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.food-option-quality {
  flex-shrink: 0;
  padding: 0.125rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.68rem;
  font-weight: 900;
  line-height: 1.35;
}

.food-option-quality.is-hq {
  background: #fef3c7;
  color: #b45309;
}

.food-option-quality.is-nq {
  background: #dcfce7;
  color: #15803d;
}

.food-option-copy {
  min-width: 0;
  display: grid;
  gap: 0.1rem;
}

.food-option-name {
  min-width: 0;
  overflow: hidden;
  color: #334155;
  font-size: 0.875rem;
  font-weight: 750;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.food-option-summary {
  min-width: 0;
  overflow: hidden;
  color: #94a3b8;
  font-size: 0.68rem;
  font-weight: 650;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(html.dark .food-option-icon) {
  background: #1e293b;
}

:global(html.dark .food-option-quality.is-hq) {
  background: rgb(120 53 15 / 0.42);
  color: #fde68a;
}

:global(html.dark .food-option-quality.is-nq) {
  background: rgb(20 83 45 / 0.42);
  color: #bbf7d0;
}

:global(html.dark .food-option-name) {
  color: #f1f5f9;
}

:global(html.dark .food-option-summary) {
  color: #94a3b8;
}
</style>
