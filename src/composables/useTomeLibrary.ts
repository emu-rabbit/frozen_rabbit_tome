import { computed } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { shouldHideCrystalGatheringItem } from '../config/crystalGathering';
import type { FoodSelection, NodeBonuses, PlayerStats, SolverResponse, StoredTome, StoredTomeRotationPlan, StoredTomeRotationStep } from '../types/game';
import type { CollectableSolverResult } from '../types/collectable';
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
  const visibleTomes = computed(() => tomes.value.filter((tome) => !shouldHideCrystalGatheringItem({ itemId: tome.itemId })));
  const tomeCount = computed(() => visibleTomes.value.length);

  const saveTome = (payload: {
    name?: string;
    itemId: number;
    stats: PlayerStats;
    temporaryGp: number;
    food: FoodSelection;
    nodeBonuses: NodeBonuses;
    rotationResult?: SolverResponse;
    collectableResult?: CollectableSolverResult;
  }) => {
    if (shouldHideCrystalGatheringItem({ itemId: payload.itemId })) {
      throw new Error('Crystal gathering items are hidden by configuration');
    }

    if (payload.collectableResult) {
      const tome: StoredTome = {
        kind: 'collectable',
        id: createTomeId(),
        name: payload.name?.trim() || undefined,
        itemId: payload.itemId,
        stats: { ...payload.stats },
        temporaryGp: payload.temporaryGp,
        food: { ...payload.food },
        nodeBonuses: {
          baseIntegrity: payload.nodeBonuses.baseIntegrity,
          gatheringCount: payload.nodeBonuses.gatheringCount,
          yieldCount: payload.nodeBonuses.yieldCount,
          extraRate: payload.nodeBonuses.extraRate
        },
        rotation: [],
        objectiveMode: payload.collectableResult.objectiveMode,
        collectableObjective: payload.collectableResult.objective,
        collectableRewardTableSummary: payload.collectableResult.debug
          ? payload.collectableResult.debug.formulas.rewardTable
          : undefined,
        collectablePolicy: {
          rootAction: payload.collectableResult.policy.recommendedAction,
          previewBranches: payload.collectableResult.policy.branches.slice(0, 4).map((branch) => ({
            labelKey: branch.labelKey,
            conditionKey: branch.conditionKey,
            probability: branch.probability,
            actionKind: branch.next?.recommendedAction.kind
          }))
        },
        collectableRewardItemId: payload.collectableResult.rewardItemId,
        collectableExpectedScore: payload.collectableResult.expectedScore,
        collectableMinScore: payload.collectableResult.minScore,
        collectableMaxScore: payload.collectableResult.maxScore,
        collectableMinScoreChance: payload.collectableResult.minScoreChance,
        collectableMaxScoreChance: payload.collectableResult.maxScoreChance,
        collectableExpectedReward: payload.collectableResult.expectedReward,
        createdAt: new Date().toISOString()
      };

      tomes.value = [tome, ...tomes.value];
      return tome;
    }

    if (!payload.rotationResult) {
      throw new Error('saveTome requires either rotationResult or collectableResult');
    }

    const rotationPlans = payload.rotationResult.rotationPlans
      .map((plan): StoredTomeRotationPlan => ({
        kind: plan.kind,
        rotation: plan.rotation
          .map(toStoredRotationStep)
          .filter((step): step is StoredTomeRotationStep => step !== null)
      }))
      .filter((plan) => plan.rotation.length > 0);
    const rotation = (rotationPlans[0]?.rotation ?? payload.rotationResult.bestRotation
      .map(toStoredRotationStep)
      .filter((step): step is StoredTomeRotationStep => step !== null));

    const tome: StoredTome = {
      id: createTomeId(),
      kind: 'regular',
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
      rotation,
      rotationPlans,
      revisit: payload.rotationResult.revisit,
      objectiveMode: payload.rotationResult.objectiveMode,
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
    visibleTomes,
    tomeCount,
    saveTome,
    deleteTome
  };
}
