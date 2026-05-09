import { computed } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import type { FoodSelection, NodeBonuses, PlayerStats, SolverResponse, StoredTome, StoredTomeRotationStep } from '../types/game';
import { getRotationActionId } from '../services/actionIcons';

const STORAGE_KEY = 'frozen-rabbit-tome-library';
const tomes = useLocalStorage<StoredTome[]>(STORAGE_KEY, []);

function createTomeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toStoredRotationStep(action: string): StoredTomeRotationStep | null {
  if (action.startsWith('採集')) {
    return { type: 'gather', actionName: action };
  }

  const actionId = getRotationActionId(action);
  return actionId ? { type: 'action', actionId, actionName: action } : null;
}

export function useTomeLibrary() {
  const tomeCount = computed(() => tomes.value.length);

  const saveTome = (payload: {
    itemId: number;
    stats: PlayerStats;
    temporaryGp: number;
    food: FoodSelection;
    nodeBonuses: NodeBonuses;
    rotationResult: SolverResponse;
  }) => {
    const rotation = payload.rotationResult.bestRotation
      .map(toStoredRotationStep)
      .filter((step): step is StoredTomeRotationStep => step !== null);

    const tome: StoredTome = {
      id: createTomeId(),
      itemId: payload.itemId,
      stats: { ...payload.stats },
      temporaryGp: payload.temporaryGp,
      food: { ...payload.food },
      nodeBonuses: {
        gatheringCount: payload.nodeBonuses.gatheringCount,
        yieldCount: payload.nodeBonuses.yieldCount,
        extraRate: payload.nodeBonuses.extraRate
      },
      rotation,
      createdAt: new Date().toISOString()
    };

    tomes.value = [tome, ...tomes.value];
    return tome;
  };

  const deleteTome = (id: string) => {
    tomes.value = tomes.value.filter((tome) => tome.id !== id);
  };

  return {
    tomes,
    tomeCount,
    saveTome,
    deleteTome
  };
}
