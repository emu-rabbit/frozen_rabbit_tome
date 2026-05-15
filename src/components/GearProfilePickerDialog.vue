<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import type { GearStatProfile, GatheringJob } from '../types/game';
import { isDefaultGearProfile, useGearProfiles } from '../composables/useGearProfiles';
import { getGatheringFood } from '../services/foodData';
import { getItemName } from '../services/gameData';

const props = defineProps<{
  modelValue: boolean;
  jobs: GatheringJob[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  apply: [profile: GearStatProfile];
}>();

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { orderedProfiles } = useGearProfiles();

const availableProfiles = computed(() => orderedProfiles.value.filter((profile) => (
  profile.jobs.some((job) => props.jobs.includes(job))
)));

function close() {
  emit('update:modelValue', false);
}

function profileName(profile: GearStatProfile) {
  if (profile.kind === 'default-miner') return t('gearProfiles.defaults.miner');
  if (profile.kind === 'default-botanist') return t('gearProfiles.defaults.botanist');
  return profile.name || t('gearProfiles.unnamed');
}

function jobLabel(profile: GearStatProfile) {
  if (profile.jobs.length === 2) return t('gearProfiles.jobs.universal');
  return t(`game.jobs.${profile.jobs[0]}`);
}

function foodLabel(profile: GearStatProfile) {
  if (!profile.food.foodId) return t('tomeLibrary.noFood');
  const food = getGatheringFood(profile.food.foodId);
  return food ? `${getItemName(food.id)} ${t(`solver.food.${profile.food.quality}`)}` : t('tomeLibrary.noFood');
}

function apply(profile: GearStatProfile) {
  emit('apply', profile);
  close();
}

function goManage() {
  router.push({
    path: '/settings/gear-profiles',
    query: { returnTo: route.fullPath }
  });
  close();
}
</script>

<template>
  <Teleport to="body">
    <Transition name="gear-picker">
      <div v-if="modelValue" class="gear-picker-dialog" role="dialog" aria-modal="true" :aria-label="t('gearProfiles.picker.title')">
        <button type="button" class="gear-picker-backdrop" :aria-label="t('common.cancel')" @click="close"></button>
        <section class="gear-picker-panel">
          <header class="gear-picker-header">
            <div>
              <h3>{{ t('gearProfiles.picker.title') }}</h3>
              <p>{{ t('gearProfiles.picker.description') }}</p>
            </div>
            <button type="button" class="gear-picker-close" :aria-label="t('common.cancel')" @click="close">
              <i class="pi pi-times"></i>
            </button>
          </header>

          <div class="gear-picker-list">
            <button
              v-for="profile in availableProfiles"
              :key="profile.id"
              type="button"
              class="gear-picker-card"
              @click="apply(profile)"
            >
              <span class="gear-picker-card-main">
                <strong>{{ profileName(profile) }}</strong>
                <span>{{ jobLabel(profile) }} · Lv {{ profile.level }} · GP {{ profile.currentGp }}/{{ profile.maxGp }}</span>
              </span>
              <span class="gear-picker-card-meta">
                <span>{{ profile.gathering }} / {{ profile.perception }}</span>
                <span>{{ foodLabel(profile) }}</span>
                <span v-if="profile.collectableRelicToolBonus">{{ t('gearProfiles.relicShort') }}</span>
                <span v-if="isDefaultGearProfile(profile)">{{ t('gearProfiles.defaultBadge') }}</span>
              </span>
              <i class="pi pi-download"></i>
            </button>
          </div>

          <p v-if="availableProfiles.length === 0" class="gear-picker-empty">{{ t('gearProfiles.picker.empty') }}</p>

          <footer class="gear-picker-actions">
            <Button class="gear-picker-action gear-picker-manage" icon="pi pi-cog" :label="t('gearProfiles.picker.manage')" @click="goManage" />
            <Button class="gear-picker-action gear-picker-cancel" :label="t('common.cancel')" @click="close" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.gear-picker-dialog {
  position: fixed;
  inset: 0;
  z-index: 82;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.gear-picker-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgb(15 23 42 / 0.46);
  backdrop-filter: blur(6px);
}

.gear-picker-panel {
  position: relative;
  z-index: 1;
  width: min(100%, 44rem);
  max-height: min(90vh, 48rem);
  display: grid;
  gap: 1rem;
  overflow: auto;
  padding: 1rem;
  border-radius: 18px;
  border: 1px solid #dbeafe;
  background: white;
  box-shadow: 0 24px 70px rgb(15 23 42 / 0.22);
}

:global(html.dark .gear-picker-panel) {
  border-color: #334155;
  background: #0f172a;
  box-shadow: 0 24px 70px rgb(0 0 0 / 0.5);
}

.gear-picker-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.gear-picker-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 900;
}

.gear-picker-header p {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.86rem;
  font-weight: 650;
  line-height: 1.55;
}

:global(html.dark .gear-picker-header h3) { color: #f8fafc; }
:global(html.dark .gear-picker-header p) { color: #cbd5e1; }

.gear-picker-close {
  width: 2.25rem;
  height: 2.25rem;
  border: 0;
  border-radius: 999px;
  background: #f8fafc;
  color: #64748b;
}

:global(html.dark .gear-picker-close) {
  background: rgb(30 41 59 / 0.72);
  color: #cbd5e1;
}

.gear-picker-list {
  display: grid;
  gap: 0.7rem;
}

.gear-picker-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  padding: 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
  color: #0f172a;
  text-align: left;
  transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
}

.gear-picker-card:hover {
  transform: translateY(-1px);
  border-color: #52a890;
  background: #ffffff;
}

:global(html.dark .gear-picker-card) {
  border-color: #334155;
  background: rgb(30 41 59 / 0.7);
  color: #f8fafc;
}

:global(html.dark .gear-picker-card:hover) {
  border-color: #52a890;
  background: #1e293b;
}

.gear-picker-card-main,
.gear-picker-card-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.gear-picker-card-main strong {
  overflow: hidden;
  color: inherit;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gear-picker-card-main span,
.gear-picker-card-meta span {
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 750;
}

:global(html.dark .gear-picker-card-main span),
:global(html.dark .gear-picker-card-meta span) {
  color: #cbd5e1;
}

.gear-picker-empty {
  margin: 0;
  padding: 1rem;
  border-radius: 14px;
  background: #f8fafc;
  color: #64748b;
  text-align: center;
  font-weight: 800;
}

.gear-picker-actions {
  display: grid;
  gap: 0.55rem;
}

:deep(.gear-picker-action) {
  width: 100%;
  justify-content: center;
  border-radius: 0.8rem;
  border: 1px solid transparent;
  min-height: 2.45rem;
  font-weight: 900;
  box-shadow: none;
}

:deep(.gear-picker-manage) {
  border-color: #52a890 !important;
  background: #52a890 !important;
  color: white !important;
}

:deep(.gear-picker-manage:hover) {
  border-color: #3f8f7a !important;
  background: #3f8f7a !important;
}

:deep(.gear-picker-cancel) {
  border-color: #cbd5e1 !important;
  background: #f8fafc !important;
  color: #475569 !important;
}

:deep(.gear-picker-cancel:hover) {
  border-color: #94a3b8 !important;
  background: #f1f5f9 !important;
}

:global(html.dark .gear-picker-manage) {
  border-color: #52a890 !important;
  background: #2f7d6c !important;
  color: #f8fafc !important;
}

:global(html.dark .gear-picker-cancel) {
  border-color: #475569 !important;
  background: #1e293b !important;
  color: #e2e8f0 !important;
}

.gear-picker-enter-active,
.gear-picker-leave-active {
  transition: opacity 0.16s ease;
}

.gear-picker-enter-from,
.gear-picker-leave-to {
  opacity: 0;
}

@media (min-width: 560px) {
  .gear-picker-panel {
    padding: 1.15rem;
  }

  .gear-picker-card {
    grid-template-columns: 1fr minmax(9rem, auto) auto;
  }

  .gear-picker-actions {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
