import { computed, ref } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { shouldHideCrystalGatheringItem } from '../config/crystalGathering';
import type {
  FoodSelection,
  NodeBonuses,
  PlayerStats,
  SimulationResponse,
  StoredCollectableExperimentAnalysis,
  StoredCollectableStrategyRule,
  StoredExperiment,
  StoredTomeRotationStep
} from '../types/game';
import type { CollectableObjective, CollectableRewardTableSummary } from '../types/collectable';
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

function cloneStoragePayload<T>(payload: T): T {
  return JSON.parse(JSON.stringify(payload)) as T;
}

export function useExperimentLibrary() {
  const visibleExperiments = computed(() => experiments.value.filter((experiment) => !shouldHideCrystalGatheringItem({ itemId: experiment.itemId })));
  const experimentCount = computed(() => visibleExperiments.value.length);

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
    if (shouldHideCrystalGatheringItem({ itemId: payload.itemId })) {
      throw new Error('Crystal gathering items are hidden by configuration');
    }

    const now = new Date().toISOString();
    const experiment: StoredExperiment = {
      id: createExperimentId(),
      name: payload.name?.trim() || undefined,
      kind: 'regular',
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

  const saveCollectableExperiment = (payload: {
    name?: string;
    itemId: number;
    stats: PlayerStats;
    temporaryGp: number;
    food: FoodSelection;
    nodeBonuses: NodeBonuses;
    rules: StoredCollectableStrategyRule[];
    objective: CollectableObjective;
    rewardTableSummary?: CollectableRewardTableSummary;
    analysis: StoredCollectableExperimentAnalysis;
    hasRelicToolBonus?: boolean;
  }) => {
    if (shouldHideCrystalGatheringItem({ itemId: payload.itemId })) {
      throw new Error('Crystal gathering items are hidden by configuration');
    }

    const now = new Date().toISOString();
    const experiment: StoredExperiment = {
      id: createExperimentId(),
      name: payload.name?.trim() || undefined,
      kind: 'collectable',
      itemId: payload.itemId,
      stats: { ...payload.stats },
      temporaryGp: payload.temporaryGp,
      food: { ...payload.food },
      nodeBonuses: {
        gatheringCount: payload.nodeBonuses.gatheringCount,
        yieldCount: payload.nodeBonuses.yieldCount,
        extraRate: payload.nodeBonuses.extraRate
      },
      collectableRules: cloneStoragePayload(payload.rules),
      collectableObjective: cloneStoragePayload(payload.objective),
      collectableRewardTableSummary: payload.rewardTableSummary ? { ...payload.rewardTableSummary } : undefined,
      collectableAnalysis: cloneStoragePayload(payload.analysis),
      collectableHasRelicToolBonus: !!payload.hasRelicToolBonus,
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
    visibleExperiments,
    experimentCount,
    saveExperiment,
    saveCollectableExperiment,
    deleteExperiment,
    getExperiment,
    fromStoredRotationStep,
    searchQuery: persistentSearchQuery
  };
}
