<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import FoodAutoComplete from '../FoodAutoComplete.vue';
import {
  NODE_BONUS_INPUT_LIMITS,
  PLAYER_INPUT_LIMITS
} from '../../config/inputLimits';
import type { FoodOption } from '../../services/foodOptions';
import type { NodeBonuses, PlayerStats } from '../../types/game';

type RelicToolOption = {
  label: string;
  value: boolean;
};

const props = withDefaults(defineProps<{
  isCollectable?: boolean;
  effectiveGp: number;
  gatheringCountMax: number;
  showGearProfileButton?: boolean;
  showPerceptionWarning?: boolean;
}>(), {
  isCollectable: true,
  showGearProfileButton: false,
  showPerceptionWarning: false
});

const emit = defineEmits<{
  loadProfile: [];
}>();

const stats = defineModel<PlayerStats>('stats', { required: true });
const selectedFood = defineModel<FoodOption | null>('selectedFood', { required: true });
const temporaryGp = defineModel<number>('temporaryGp', { required: true });
const nodeBonuses = defineModel<NodeBonuses>('nodeBonuses', { required: true });
const relicToolBonus = defineModel<boolean>('relicToolBonus', { default: false });

const { t } = useI18n();

const collectableRelicToolBonusOptions = computed<RelicToolOption[]>(() => [
  { label: t('solver.nodeBonuses.enabled'), value: true },
  { label: t('solver.nodeBonuses.disabled'), value: false }
]);
</script>

<template>
  <section class="panel">
    <div class="section-title stats-section-title">
      <span>
        <i class="pi pi-sliders-h text-soft-green-500"></i>
        <h2>{{ t('simulator.statsTitle') }}</h2>
      </span>
      <Button
        v-if="props.showGearProfileButton"
        icon="pi pi-download"
        :label="t('gearProfiles.loadProfile')"
        class="p-button-text p-button-sm"
        @click="emit('loadProfile')"
      />
    </div>
    <div class="input-grid stats-input-grid" :class="{ 'is-collectable': props.isCollectable }">
      <label class="field-level"><span>{{ t('game.stats.level') }}</span><InputNumber v-model="stats.level" :min="PLAYER_INPUT_LIMITS.level.min" :max="PLAYER_INPUT_LIMITS.level.max" fluid /></label>
      <label class="field-gathering"><span>{{ t('game.stats.gathering') }}</span><InputNumber v-model="stats.gathering" :min="PLAYER_INPUT_LIMITS.gathering.min" :max="PLAYER_INPUT_LIMITS.gathering.max" fluid /></label>
      <label class="field-perception"><span>{{ t('game.stats.perception') }}</span><InputNumber v-model="stats.perception" :min="PLAYER_INPUT_LIMITS.perception.min" :max="PLAYER_INPUT_LIMITS.perception.max" fluid /></label>
      <label class="field-food">
        <span>{{ t('solver.food.label') }}</span>
        <FoodAutoComplete
          v-model="selectedFood"
          :placeholder="t('solver.food.placeholder')"
          forceSelection
          dropdown
          showClear
          fluid
        />
      </label>
      <span v-if="!props.isCollectable" class="stats-grid-spacer" aria-hidden="true"></span>
      <label class="field-current-gp"><span>{{ t('solver.currentGp') }}</span><InputNumber v-model="temporaryGp" :min="PLAYER_INPUT_LIMITS.gp.min" :max="props.effectiveGp" fluid /></label>
      <label class="field-max-gp"><span>{{ t('solver.maxGp') }}</span><InputNumber v-model="stats.gp" :min="PLAYER_INPUT_LIMITS.gp.min" :max="PLAYER_INPUT_LIMITS.gp.max" fluid /></label>
      <label class="field-gathering-count"><span>{{ t('solver.nodeBonuses.gatheringCount') }}</span><InputNumber v-model="nodeBonuses.gatheringCount" :min="NODE_BONUS_INPUT_LIMITS.gatheringCount.min" :max="props.gatheringCountMax" fluid /></label>
      <template v-if="!props.isCollectable">
        <label class="field-yield-count"><span>{{ t('solver.nodeBonuses.yieldCount') }}</span><InputNumber v-model="nodeBonuses.yieldCount" :min="NODE_BONUS_INPUT_LIMITS.yieldCount.min" :max="NODE_BONUS_INPUT_LIMITS.yieldCount.max" fluid /></label>
        <label class="field-extra-rate"><span>{{ t('solver.nodeBonuses.extraRate') }}</span><InputNumber v-model="nodeBonuses.extraRate" :min="NODE_BONUS_INPUT_LIMITS.extraRate.min" :max="NODE_BONUS_INPUT_LIMITS.extraRate.max" fluid /></label>
      </template>
      <template v-if="props.isCollectable">
        <label class="field-relic-tool">
          <span>{{ t('solver.nodeBonuses.collectableRelicToolBonus') }}</span>
          <Select
            v-model="relicToolBonus"
            :options="collectableRelicToolBonusOptions"
            optionLabel="label"
            optionValue="value"
            fluid
          />
        </label>
      </template>
    </div>
    <p v-if="props.showPerceptionWarning" class="warning">{{ t('simulator.perceptionWarning') }}</p>
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

.section-title {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.stats-section-title {
  justify-content: space-between;
  align-items: flex-start;
}

.stats-section-title > span {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
}

.section-title h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 900;
  color: #334155;
}

:global(html.dark .section-title h2) {
  color: #e2e8f0;
}

.input-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 10.5rem), 1fr));
  gap: 0.75rem;
}

.input-grid label {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
}

.stats-input-grid {
  align-content: start;
}

.stats-grid-spacer {
  display: none;
}

.input-grid span {
  display: block;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
}

.input-grid :deep(.p-inputnumber),
.input-grid :deep(.p-autocomplete),
.input-grid :deep(.p-select),
.input-grid :deep(.p-inputtext),
.input-grid :deep(input) {
  width: 100% !important;
  min-width: 0 !important;
}

.warning {
  margin: 1rem 0 0;
  color: #dc2626;
  font-weight: 800;
}

@media (min-width: 1024px) {
  .stats-input-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .stats-input-grid:not(.is-collectable) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .stats-grid-spacer {
    display: block;
  }

  .field-level {
    grid-column: 1;
    grid-row: 1;
  }

  .field-gathering {
    grid-column: 2;
    grid-row: 1;
  }

  .field-perception {
    grid-column: 3;
    grid-row: 1;
  }

  .field-food {
    grid-column: 4;
    grid-row: 1;
  }

  .stats-grid-spacer {
    grid-column: 5;
    grid-row: 1;
  }

  .field-current-gp {
    grid-column: 1;
    grid-row: 2;
  }

  .field-max-gp {
    grid-column: 2;
    grid-row: 2;
  }

  .field-gathering-count {
    grid-column: 3;
    grid-row: 2;
  }

  .field-relic-tool {
    grid-column: 4;
    grid-row: 2;
  }

  .field-yield-count {
    grid-column: 4;
    grid-row: 2;
  }

  .field-extra-rate {
    grid-column: 5;
    grid-row: 2;
  }
}
</style>
