import { computed, ref } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import type { FoodSelection, NodeBonuses, PlayerStats, SimulationResponse, StoredExperiment, StoredTomeRotationStep } from '../types/game';
import { getRotationActionId } from '../services/actionIcons';

const STORAGE_KEY = 'frozen-rabbit-tome-experiments';
const SEARCH_KEY = 'frozen-rabbit-tome-experiment-search';
const experiments = useLocalStorage<StoredExperiment[]>(STORAGE_KEY, []);
const persistentSearchQuery = ref('');

function createExperimentId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toStoredRotationStep(action: string): StoredTomeRotationStep | null {
  if (action.startsWith('採集')) return { type: 'gather', actionName: action };

  const actionId = getRotationActionId(action);
  return actionId ? { type: 'action', actionId, actionName: action } : null;
}

function fromStoredRotationStep(step: StoredTomeRotationStep): string {
  return step.actionName ?? (step.type === 'gather' ? '採集' : '');
}

export function useExperimentLibrary() {
  const experimentCount = computed(() => experiments.value.length);

  const saveExperiment = (payload: {
    name?: string;
    itemId: number;
    stats: PlayerStats;
    temporaryGp: number;
    food: FoodSelection;
    nodeBonuses: NodeBonuses;
    primaryRotation: string[];
    revisitRotation: string[];
    analysis: SimulationResponse;
  }) => {
    const now = new Date().toISOString();
    const experiment: StoredExperiment = {
      id: createExperimentId(),
      name: payload.name?.trim() || undefined,
      itemId: payload.itemId,
      stats: { ...payload.stats },
      temporaryGp: payload.temporaryGp,
      food: { ...payload.food },
      nodeBonuses: {
        gatheringCount: payload.nodeBonuses.gatheringCount,
        yieldCount: payload.nodeBonuses.yieldCount,
        extraRate: payload.nodeBonuses.extraRate
      },
      primaryRotation: payload.primaryRotation
        .map(toStoredRotationStep)
        .filter((step): step is StoredTomeRotationStep => step !== null),
      revisitRotation: payload.revisitRotation
        .map(toStoredRotationStep)
        .filter((step): step is StoredTomeRotationStep => step !== null),
      analysis: payload.analysis,
      createdAt: now,
      updatedAt: now
    };

    experiments.value = [experiment, ...experiments.value];

    return experiment;
  };

  const deleteExperiment = (id: string) => {
    experiments.value = experiments.value.filter((experiment) => experiment.id !== id);
  };

  const getExperiment = (id: string) => experiments.value.find((experiment) => experiment.id === id) ?? null;

  return {
    experiments,
    experimentCount,
    saveExperiment,
    deleteExperiment,
    getExperiment,
    fromStoredRotationStep,
    searchQuery: persistentSearchQuery
  };
}
