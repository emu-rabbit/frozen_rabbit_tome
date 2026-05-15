<script setup lang="ts">
defineOptions({ name: 'GearProfiles' });

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import AutoComplete from 'primevue/autocomplete';
import type { FoodQuality, GatheringFood, GearStatProfile, GatheringJob } from '../types/game';
import { isDefaultGearProfile, useGearProfiles } from '../composables/useGearProfiles';
import { GATHERING_FOODS, getGatheringFood } from '../services/foodData';
import { getItemEnglishName, getItemName } from '../services/gameData';

type FoodOption = {
  food: GatheringFood;
  quality: FoodQuality;
  label: string;
  searchText: string;
};

type DraftProfile = {
  id: string | null;
  name: string;
  jobs: GatheringJob[];
  level: number;
  gathering: number;
  perception: number;
  currentGp: number;
  maxGp: number;
  foodId: number | null;
  foodQuality: FoodQuality;
  collectableRelicToolBonus: boolean;
};

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { orderedProfiles, createProfile, updateProfile, deleteProfile } = useGearProfiles();

const selectedId = ref<string | null>(orderedProfiles.value[0]?.id ?? null);
const foodSuggestions = ref<FoodOption[]>([]);

const selectedProfile = computed(() => orderedProfiles.value.find((profile) => profile.id === selectedId.value) ?? null);
const isEditingDefault = computed(() => !!selectedProfile.value && isDefaultGearProfile(selectedProfile.value));
const draft = ref<DraftProfile>(createDraft(selectedProfile.value));
const isSaveConfirmed = ref(false);
const editorPanel = ref<HTMLElement | null>(null);
const measuredEditorHeight = ref(0);
let saveConfirmedTimer: ReturnType<typeof window.setTimeout> | null = null;
let editorResizeObserver: ResizeObserver | null = null;
let isSyncingDraft = false;

const listPanelStyle = computed(() => (
  measuredEditorHeight.value > 0
    ? { '--gear-editor-height': `${measuredEditorHeight.value}px` }
    : {}
));

const selectedFoodModel = computed<FoodOption | null>({
  get: () => {
    if (!draft.value.foodId) return null;
    const food = getGatheringFood(draft.value.foodId);
    return food ? toFoodOption(food, draft.value.foodQuality) : null;
  },
  set: (option) => {
    draft.value.foodId = option?.food.id ?? null;
    if (option) draft.value.foodQuality = option.quality;
  }
});

function createDraft(profile: GearStatProfile | null = null): DraftProfile {
  return {
    id: profile?.id ?? null,
    name: profile?.name ?? '',
    jobs: profile?.jobs ? [...profile.jobs] : ['miner'],
    level: profile?.level ?? 100,
    gathering: profile?.gathering ?? 5345,
    perception: profile?.perception ?? 5173,
    currentGp: profile?.currentGp ?? profile?.maxGp ?? 930,
    maxGp: profile?.maxGp ?? 930,
    foodId: profile?.food.foodId ?? null,
    foodQuality: profile?.food.quality ?? 'hq',
    collectableRelicToolBonus: profile?.collectableRelicToolBonus ?? false
  };
}

function profileName(profile: GearStatProfile) {
  if (profile.kind === 'default-miner') return t('gearProfiles.defaults.miner');
  if (profile.kind === 'default-botanist') return t('gearProfiles.defaults.botanist');
  return profile.name || t('gearProfiles.unnamed');
}

function jobLabel(jobs: GatheringJob[]) {
  if (jobs.length === 2) return t('gearProfiles.jobs.universal');
  return t(`game.jobs.${jobs[0]}`);
}

function foodLabel(profile: GearStatProfile) {
  if (!profile.food.foodId) return t('tomeLibrary.noFood');
  const food = getGatheringFood(profile.food.foodId);
  return food ? `${getItemName(food.id)} ${t(`solver.food.${profile.food.quality}`)}` : t('tomeLibrary.noFood');
}

function toFoodOption(food: GatheringFood, quality: FoodQuality): FoodOption {
  const localizedName = getItemName(food.id);
  const englishName = getItemEnglishName(food.id);
  return {
    food,
    quality,
    label: `${localizedName} ${t(`solver.food.${quality}`)}`,
    searchText: [localizedName, englishName, food.id.toString()].join(' ').toLowerCase()
  };
}

function searchFoods(event: { query: string }) {
  const query = event.query.trim().toLowerCase();
  const allOptions = GATHERING_FOODS.flatMap((food) => [
    toFoodOption(food, 'hq'),
    toFoodOption(food, 'nq')
  ]);
  foodSuggestions.value = (query ? allOptions.filter((option) => option.searchText.includes(query)) : allOptions).slice(0, 40);
}

function selectProfile(profile: GearStatProfile) {
  selectedId.value = profile.id;
  setDraft(createDraft(profile));
  clearSaveConfirmed();
}

function startNewProfile() {
  const created = createProfile({
    name: '',
    jobs: ['miner'],
    level: 100,
    gathering: 5345,
    perception: 5173,
    currentGp: 930,
    maxGp: 930,
    food: {
      foodId: null,
      quality: 'hq'
    },
    collectableRelicToolBonus: false
  });
  selectedId.value = created.id;
  setDraft(createDraft(created));
  clearSaveConfirmed();
}

function toggleJob(job: GatheringJob) {
  if (isEditingDefault.value) return;
  const hasJob = draft.value.jobs.includes(job);
  const nextJobs = hasJob
    ? draft.value.jobs.filter((item) => item !== job)
    : [...draft.value.jobs, job];
  draft.value.jobs = nextJobs.length ? nextJobs : [job];
}

function saveDraft() {
  const maxGp = Math.max(0, Math.floor(draft.value.maxGp || 0));
  const currentGp = Math.max(0, Math.floor(draft.value.currentGp || 0));
  const payload = {
    name: draft.value.name.trim(),
    jobs: [...draft.value.jobs],
    level: draft.value.level,
    gathering: draft.value.gathering,
    perception: draft.value.perception,
    currentGp,
    maxGp,
    food: {
      foodId: draft.value.foodId,
      quality: draft.value.foodQuality
    },
    collectableRelicToolBonus: draft.value.collectableRelicToolBonus
  };

  if (draft.value.id) {
    updateProfile(draft.value.id, payload);
  } else {
    const created = createProfile(payload);
    selectedId.value = created.id;
  }

  const latest = selectedId.value
    ? orderedProfiles.value.find((profile) => profile.id === selectedId.value) ?? null
    : null;
  setDraft(createDraft(latest));
  showSaveConfirmed();
}

function removeSelected() {
  if (!selectedProfile.value || isDefaultGearProfile(selectedProfile.value)) return;
  deleteProfile(selectedProfile.value.id);
  const nextProfile = orderedProfiles.value[0] ?? null;
  selectedId.value = nextProfile?.id ?? null;
  setDraft(createDraft(nextProfile));
  clearSaveConfirmed();
}

function goBack() {
  const returnTo = typeof route.query.returnTo === 'string' ? route.query.returnTo : '/settings';
  router.push(returnTo);
}

function clearSaveConfirmed() {
  isSaveConfirmed.value = false;
  if (saveConfirmedTimer) {
    window.clearTimeout(saveConfirmedTimer);
    saveConfirmedTimer = null;
  }
}

function showSaveConfirmed() {
  clearSaveConfirmed();
  isSaveConfirmed.value = true;
  saveConfirmedTimer = window.setTimeout(() => {
    isSaveConfirmed.value = false;
    saveConfirmedTimer = null;
  }, 1800);
}

function setDraft(nextDraft: DraftProfile) {
  isSyncingDraft = true;
  draft.value = nextDraft;
  nextTick(() => {
    isSyncingDraft = false;
  });
}

function updateEditorHeight() {
  measuredEditorHeight.value = editorPanel.value?.offsetHeight ?? 0;
}

watch(draft, () => {
  if (isSyncingDraft) return;
  if (!isSaveConfirmed.value) return;
  clearSaveConfirmed();
}, { deep: true });

onBeforeUnmount(() => {
  clearSaveConfirmed();
  editorResizeObserver?.disconnect();
});

onMounted(async () => {
  await nextTick();
  updateEditorHeight();
  if (!editorPanel.value) return;

  editorResizeObserver = new ResizeObserver(() => updateEditorHeight());
  editorResizeObserver.observe(editorPanel.value);
});
</script>

<template>
  <div class="gear-page px-4 py-8 md:p-8 max-w-6xl w-full mx-auto pb-24">
    <header class="gear-page-header">
      <button type="button" class="gear-back-button" @click="goBack">
        <i class="pi pi-arrow-left"></i>
        <span>{{ t('gearProfiles.back') }}</span>
      </button>
      <div>
        <h2>{{ t('gearProfiles.title') }}</h2>
        <p>{{ t('gearProfiles.description') }}</p>
      </div>
    </header>

    <div class="gear-layout">
      <section class="gear-list-panel" :style="listPanelStyle">
        <div class="gear-panel-heading">
          <h3>{{ t('gearProfiles.listTitle') }}</h3>
          <Button icon="pi pi-plus" :label="t('gearProfiles.actions.add')" class="p-button-sm" @click="startNewProfile" />
        </div>

        <div class="gear-profile-list">
          <button
            v-for="profile in orderedProfiles"
            :key="profile.id"
            type="button"
            class="gear-profile-card"
            :class="{ active: selectedId === profile.id }"
            @click="selectProfile(profile)"
          >
            <span class="gear-card-title">
              <strong>{{ profileName(profile) }}</strong>
              <span v-if="isDefaultGearProfile(profile)">{{ t('gearProfiles.defaultBadge') }}</span>
            </span>
            <span class="gear-card-summary">{{ jobLabel(profile.jobs) }} · Lv {{ profile.level }} · GP {{ profile.currentGp }}/{{ profile.maxGp }}</span>
            <span class="gear-card-summary">{{ profile.gathering }} / {{ profile.perception }} · {{ foodLabel(profile) }}</span>
          </button>
        </div>
      </section>

      <section ref="editorPanel" class="gear-editor-panel">
        <div class="gear-panel-heading">
          <h3>{{ draft.id ? t('gearProfiles.editor.editTitle') : t('gearProfiles.editor.newTitle') }}</h3>
          <span v-if="isEditingDefault" class="gear-lock-note">{{ t('gearProfiles.editor.defaultLocked') }}</span>
        </div>

        <div class="gear-editor-grid">
          <label class="gear-field">
            <span>{{ t('gearProfiles.editor.name') }}</span>
            <InputText v-model="draft.name" :placeholder="selectedProfile ? profileName(selectedProfile) : t('gearProfiles.editor.namePlaceholder')" />
          </label>

          <div class="gear-field">
            <span>{{ t('gearProfiles.editor.jobs') }}</span>
            <div class="gear-job-options">
              <button
                type="button"
                class="gear-job-toggle"
                :class="{ active: draft.jobs.includes('miner') }"
                :disabled="isEditingDefault"
                @click="toggleJob('miner')"
              >
                <i class="pi pi-hammer"></i>
                {{ t('game.jobs.miner') }}
              </button>
              <button
                type="button"
                class="gear-job-toggle"
                :class="{ active: draft.jobs.includes('botanist') }"
                :disabled="isEditingDefault"
                @click="toggleJob('botanist')"
              >
                <i class="pi pi-box"></i>
                {{ t('game.jobs.botanist') }}
              </button>
            </div>
          </div>

          <label class="gear-field"><span>{{ t('game.stats.level') }}</span><InputNumber v-model="draft.level" :min="1" :max="100" fluid /></label>
          <label class="gear-field"><span>{{ t('game.stats.gathering') }}</span><InputNumber v-model="draft.gathering" :min="0" fluid /></label>
          <label class="gear-field"><span>{{ t('game.stats.perception') }}</span><InputNumber v-model="draft.perception" :min="0" fluid /></label>
          <label class="gear-field"><span>{{ t('gearProfiles.editor.currentGp') }}</span><InputNumber v-model="draft.currentGp" :min="0" fluid /></label>
          <label class="gear-field"><span>{{ t('gearProfiles.editor.maxGp') }}</span><InputNumber v-model="draft.maxGp" :min="0" fluid /></label>

          <label class="gear-field">
            <span>{{ t('solver.food.label') }}</span>
            <AutoComplete
              v-model="selectedFoodModel"
              :suggestions="foodSuggestions"
              optionLabel="label"
              :placeholder="t('solver.food.placeholder')"
              forceSelection
              dropdown
              showClear
              fluid
              @complete="searchFoods"
            />
          </label>

          <div class="gear-field gear-relic-field">
            <span>{{ t('gearProfiles.editor.relic') }}</span>
            <button
              type="button"
              role="switch"
              class="gear-relic-toggle"
              :class="{ active: draft.collectableRelicToolBonus }"
              :aria-checked="draft.collectableRelicToolBonus"
              @click="draft.collectableRelicToolBonus = !draft.collectableRelicToolBonus"
            >
              <span class="gear-relic-copy">{{ t('gearProfiles.editor.relicDesc') }}</span>
              <span class="gear-relic-control" aria-hidden="true">
                <span class="gear-relic-thumb">
                  <i :class="draft.collectableRelicToolBonus ? 'pi pi-check' : 'pi pi-times'"></i>
                </span>
              </span>
            </button>
          </div>
        </div>

        <footer class="gear-editor-actions">
          <button
            type="button"
            class="gear-action-button gear-save-button"
            :class="{ saved: isSaveConfirmed }"
            :disabled="isSaveConfirmed"
            @click="saveDraft"
          >
            <i :class="isSaveConfirmed ? 'pi pi-check' : 'pi pi-save'"></i>
            <span>{{ isSaveConfirmed ? t('gearProfiles.actions.saved') : t('gearProfiles.actions.save') }}</span>
          </button>
          <button
            v-if="selectedProfile && !isDefaultGearProfile(selectedProfile)"
            type="button"
            class="gear-action-button gear-delete-button"
            @click="removeSelected"
          >
            <i class="pi pi-trash"></i>
            <span>{{ t('gearProfiles.actions.delete') }}</span>
          </button>
        </footer>
      </section>
    </div>
  </div>
</template>

<style scoped>
.gear-page-header {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.gear-page-header h2 {
  margin: 0;
  color: #166534;
  font-size: clamp(1.6rem, 4vw, 2.25rem);
  font-weight: 950;
}

.gear-page-header p {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.92rem;
  font-weight: 650;
}

:global(html.dark .gear-page-header h2) { color: #4ade80; }
:global(html.dark .gear-page-header p) { color: #cbd5e1; }

.gear-back-button {
  width: max-content;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 0;
  border-radius: 999px;
  padding: 0.55rem 0.85rem;
  background: white;
  color: #166534;
  font-weight: 900;
  box-shadow: 0 1px 8px rgb(15 23 42 / 0.08);
}

:global(html.dark .gear-back-button) {
  background: #0f172a;
  color: #86efac;
}

.gear-layout {
  display: grid;
  gap: 1rem;
}

.gear-list-panel,
.gear-editor-panel {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border-radius: 18px;
  border: 1px solid #dcfce7;
  background: white;
  box-shadow: 0 1px 10px rgb(15 23 42 / 0.06);
}

.gear-editor-panel {
  grid-template-rows: auto auto;
  align-content: start;
}

:global(html.dark .gear-list-panel),
:global(html.dark .gear-editor-panel) {
  border-color: #1e293b;
  background: #0f172a;
}

.gear-panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.gear-panel-heading h3 {
  margin: 0;
  color: #334155;
  font-size: 1rem;
  font-weight: 950;
}

:global(html.dark .gear-panel-heading h3) { color: #f8fafc; }

.gear-lock-note {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
}

.gear-profile-list,
.gear-editor-grid {
  display: grid;
  gap: 0.75rem;
}

.gear-profile-list {
  min-height: 0;
  align-content: start;
  grid-auto-rows: max-content;
}

.gear-profile-card {
  display: grid;
  gap: 0.3rem;
  width: 100%;
  padding: 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
  color: #0f172a;
  text-align: left;
}

.gear-profile-card.active {
  border-color: #52a890;
  box-shadow: 0 0 0 3px rgb(82 168 144 / 0.14);
}

:global(html.dark .gear-profile-card) {
  border-color: #334155;
  background: rgb(30 41 59 / 0.7);
  color: #f8fafc;
}

.gear-card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.gear-card-title strong {
  overflow: hidden;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gear-card-title span {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 0.16rem 0.45rem;
  background: #dcfce7;
  color: #166534;
  font-size: 0.68rem;
  font-weight: 900;
}

.gear-card-summary {
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 750;
}

:global(html.dark .gear-card-summary) { color: #cbd5e1; }

.gear-field {
  display: grid;
  gap: 0.45rem;
}

.gear-field > span {
  color: #475569;
  font-size: 0.76rem;
  font-weight: 950;
}

:global(html.dark .gear-field > span) { color: #cbd5e1; }

.gear-job-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem;
}

.gear-job-toggle {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
  color: #475569;
  font-weight: 900;
}

.gear-job-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 2.75rem;
}

.gear-job-toggle.active {
  border-color: #52a890;
  background: #ecfdf5;
  color: #166534;
}

.gear-job-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.75;
}

:global(html.dark .gear-job-toggle) {
  border-color: #334155;
  background: rgb(30 41 59 / 0.7);
  color: #cbd5e1;
}

:global(html.dark .gear-job-toggle.active) {
  border-color: #52a890;
  background: rgb(20 83 45 / 0.35);
  color: #bbf7d0;
}

.gear-relic-field {
  grid-column: 1 / -1;
}

.gear-relic-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
  color: #475569;
  text-align: left;
  transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.gear-relic-toggle.active {
  border-color: #52a890;
  background: #ecfdf5;
  box-shadow: 0 0 0 3px rgb(82 168 144 / 0.12);
}

.gear-relic-copy {
  min-width: 0;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 800;
  line-height: 1.45;
}

.gear-relic-control {
  width: 3.5rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  border-radius: 999px;
  padding: 0.25rem;
  background: #cbd5e1;
  transition: background 0.18s ease;
}

.gear-relic-toggle.active .gear-relic-control {
  background: #52a890;
}

.gear-relic-thumb {
  width: 1.5rem;
  height: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: white;
  color: #94a3b8;
  font-size: 0.7rem;
  box-shadow: 0 1px 4px rgb(15 23 42 / 0.18);
  transform: translateX(0);
  transition: transform 0.18s ease, color 0.18s ease;
}

.gear-relic-toggle.active .gear-relic-thumb {
  color: #15803d;
  transform: translateX(1.5rem);
}

:global(html.dark .gear-relic-toggle) {
  border-color: #334155;
  background: rgb(30 41 59 / 0.7);
  color: #cbd5e1;
}

:global(html.dark .gear-relic-toggle.active) {
  border-color: #52a890;
  background: rgb(20 83 45 / 0.35);
}

:global(html.dark .gear-relic-copy) { color: #cbd5e1; }
:global(html.dark .gear-relic-control) { background: #475569; }
:global(html.dark .gear-relic-toggle.active .gear-relic-control) { background: #52a890; }

.gear-editor-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  align-self: start;
  gap: 0.65rem;
}

.gear-action-button {
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border-radius: 0.85rem;
  padding: 0.75rem 1rem;
  font-size: 0.92rem;
  font-weight: 950;
  transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.gear-action-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.gear-save-button {
  border: 1px solid #10b981;
  background: #10b981;
  color: white;
}

.gear-save-button:hover:not(:disabled) {
  border-color: #059669;
  background: #059669;
}

.gear-save-button.saved {
  border-color: #22c55e;
  background: #dcfce7;
  color: #15803d;
  cursor: default;
  opacity: 1;
}

.gear-delete-button {
  border: 1px solid #fecaca;
  background: #fff7f7;
  color: #b91c1c;
}

.gear-delete-button:hover {
  border-color: #fca5a5;
  background: #fee2e2;
}

:global(html.dark .gear-save-button.saved) {
  border-color: rgb(34 197 94 / 0.5);
  background: rgb(20 83 45 / 0.35);
  color: #bbf7d0;
}

:global(html.dark .gear-save-button) {
  border-color: #2f7d6c;
  background: #2f7d6c;
  color: #f8fafc;
}

:global(html.dark .gear-save-button:hover:not(:disabled)) {
  border-color: #52a890;
  background: #3f8f7a;
}

:global(html.dark .gear-delete-button) {
  border-color: rgb(127 29 29 / 0.55);
  background: rgb(127 29 29 / 0.16);
  color: #fecaca;
}

:global(html.dark .gear-delete-button:hover) {
  border-color: rgb(248 113 113 / 0.55);
  background: rgb(127 29 29 / 0.28);
}

@media (min-width: 820px) {
  .gear-layout {
    grid-template-columns: minmax(18rem, 0.85fr) minmax(0, 1.3fr);
    align-items: start;
  }

  .gear-list-panel {
    grid-template-rows: auto minmax(0, 1fr);
    height: min(var(--gear-editor-height, calc(100vh - 12rem)), calc(100vh - 12rem));
    min-height: 0;
    position: sticky;
    top: 1.25rem;
  }

  .gear-profile-list {
    overflow-y: auto;
    padding-right: 0.25rem;
    scrollbar-gutter: stable;
  }

  .gear-profile-list::-webkit-scrollbar {
    width: 0.45rem;
  }

  .gear-profile-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .gear-profile-list::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgb(82 168 144 / 0.35);
  }

  .gear-editor-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .gear-relic-toggle {
    grid-column: 1 / -1;
  }

  .gear-editor-actions {
    flex-direction: row;
    justify-content: end;
  }

  .gear-delete-button {
    order: 1;
  }

  .gear-save-button {
    order: 2;
  }
}
</style>
