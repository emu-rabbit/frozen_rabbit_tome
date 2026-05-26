import { computed } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { shouldHideCrystalGatheringItem } from '../config/crystalGathering';
import type {
  FoodSelection,
  LegacyStoredTome,
  NodeBonuses,
  PlayerStats,
  SolverResponse,
  StoredGatheringInput,
  StoredTome,
  StoredTomeRotationPlan,
  StoredTomeRotationStep
} from '../types/game';
import type { CollectableSolverResult } from '../types/collectable';
import { getRotationActionId } from '../services/actionIcons';

const STORAGE_KEY = 'frozen-rabbit-tome-library';
const STORAGE_SCHEMA_VERSION = 2;
const tomes = useLocalStorage<StoredTome[]>(STORAGE_KEY, []);

migrateStoredTomes();

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

function cloneStoragePayload<T>(payload: T): T {
  return JSON.parse(JSON.stringify(payload)) as T;
}

function isStoredTomeV2(tome: StoredTome | LegacyStoredTome): tome is StoredTome {
  return tome.schemaVersion === STORAGE_SCHEMA_VERSION && !!(tome as StoredTome).input;
}

function toStoredInput(payload: {
  itemId: number;
  stats: PlayerStats;
  temporaryGp: number;
  food: FoodSelection;
  nodeBonuses: NodeBonuses;
  hasRelicToolBonus?: boolean;
}): StoredGatheringInput {
  return {
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
    hasRelicToolBonus: payload.hasRelicToolBonus
  };
}

function createRegularSnapshot(result: SolverResponse) {
  const rotationPlans = result.rotationPlans
    .map((plan): StoredTomeRotationPlan => ({
      kind: plan.kind,
      rotation: plan.rotation
        .map(toStoredRotationStep)
        .filter((step): step is StoredTomeRotationStep => step !== null)
    }))
    .filter((plan) => plan.rotation.length > 0);
  const rotation = rotationPlans[0]?.rotation ?? result.bestRotation
    .map(toStoredRotationStep)
    .filter((step): step is StoredTomeRotationStep => step !== null);

  return {
    kind: 'regular' as const,
    modelVersions: result.modelVersions,
    objectiveMode: result.objectiveMode,
    rotation,
    rotationPlans,
    revisit: result.revisit,
    expectedYield: result.expectedYield,
    minYield: result.minYield,
    maxYield: result.maxYield,
    minYieldChance: result.minYieldChance,
    maxYieldChance: result.maxYieldChance
  };
}

function createCollectableSnapshot(result: CollectableSolverResult) {
  return {
    kind: 'collectable' as const,
    modelVersions: result.modelVersions,
    objectiveMode: result.objectiveMode,
    rootAction: cloneStoragePayload(result.policy.recommendedAction),
    previewBranches: result.policy.branches.slice(0, 4).map((branch) => ({
      labelKey: branch.labelKey,
      conditionKey: branch.conditionKey,
      probability: branch.probability,
      actionKind: branch.next?.recommendedAction.kind
    })),
    rewardItemId: result.rewardItemId,
    rewardTableSummary: result.debug?.formulas.rewardTable ? { ...result.debug.formulas.rewardTable } : undefined,
    objective: cloneStoragePayload(result.objective),
    expectedScore: result.expectedScore,
    minScore: result.minScore,
    maxScore: result.maxScore,
    minScoreChance: result.minScoreChance,
    maxScoreChance: result.maxScoreChance,
    expectedReward: cloneStoragePayload(result.expectedReward),
    expectedTierCounts: { ...result.expectedTierCounts },
    minScoreTierCounts: { ...result.minScoreTierCounts },
    maxScoreTierCounts: { ...result.maxScoreTierCounts }
  };
}

function migrateStoredTomes() {
  const rawTomes = tomes.value as Array<StoredTome | LegacyStoredTome>;
  const migrated = rawTomes
    .map((tome) => isStoredTomeV2(tome) ? tome : migrateLegacyTome(tome))
    .filter((tome): tome is StoredTome => tome !== null);

  if (migrated.length !== rawTomes.length || migrated.some((tome, index) => tome !== rawTomes[index])) {
    tomes.value = migrated;
  }
}

function migrateLegacyTome(tome: LegacyStoredTome): StoredTome | null {
  if (!tome.itemId || !tome.stats || !tome.food || !tome.nodeBonuses) return null;

  const kind = tome.kind === 'collectable' ? 'collectable' : 'regular';
  const input: StoredGatheringInput = {
    itemId: tome.itemId,
    stats: { ...tome.stats },
    temporaryGp: tome.temporaryGp ?? tome.stats.gp,
    food: { ...tome.food },
    nodeBonuses: {
      baseIntegrity: tome.nodeBonuses.baseIntegrity,
      gatheringCount: tome.nodeBonuses.gatheringCount ?? 0,
      yieldCount: tome.nodeBonuses.yieldCount ?? 0,
      extraRate: tome.nodeBonuses.extraRate ?? 0
    },
    hasRelicToolBonus: kind === 'collectable'
      ? tome.collectableHasRelicToolBonus ?? false
      : undefined
  };
  const createdAt = tome.createdAt || new Date().toISOString();

  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    kind,
    id: tome.id || createTomeId(),
    name: tome.name,
    itemId: tome.itemId,
    input,
    lastSolvedSnapshot: kind === 'collectable'
      ? migrateLegacyCollectableSnapshot(tome)
      : migrateLegacyRegularSnapshot(tome),
    createdAt,
    updatedAt: tome.updatedAt || createdAt
  };
}

function migrateLegacyRegularSnapshot(tome: LegacyStoredTome) {
  const rotation = tome.rotation ?? [];
  const rotationPlans = tome.rotationPlans?.length
    ? tome.rotationPlans
    : rotation.length
      ? [{ kind: 'primary' as const, rotation }]
      : [];

  if (!rotation.length && !rotationPlans.length && !tome.modelVersions) return undefined;

  return {
    kind: 'regular' as const,
    modelVersions: tome.modelVersions,
    objectiveMode: tome.objectiveMode,
    rotation,
    rotationPlans,
    revisit: tome.revisit
  };
}

function migrateLegacyCollectableSnapshot(tome: LegacyStoredTome) {
  if (
    !tome.collectablePolicy
    && tome.collectableExpectedScore === undefined
    && !tome.collectableExpectedReward
    && !tome.modelVersions
  ) {
    return undefined;
  }

  return {
    kind: 'collectable' as const,
    modelVersions: tome.modelVersions,
    objectiveMode: tome.objectiveMode,
    rootAction: tome.collectablePolicy?.rootAction,
    previewBranches: tome.collectablePolicy?.previewBranches,
    rewardItemId: tome.collectableRewardItemId,
    rewardTableSummary: tome.collectableRewardTableSummary,
    objective: tome.collectableObjective,
    expectedScore: tome.collectableExpectedScore,
    minScore: tome.collectableMinScore,
    maxScore: tome.collectableMaxScore,
    minScoreChance: tome.collectableMinScoreChance,
    maxScoreChance: tome.collectableMaxScoreChance,
    expectedReward: tome.collectableExpectedReward
  };
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
    hasRelicToolBonus?: boolean;
    rotationResult?: SolverResponse;
    collectableResult?: CollectableSolverResult;
  }) => {
    if (shouldHideCrystalGatheringItem({ itemId: payload.itemId })) {
      throw new Error('Crystal gathering items are hidden by configuration');
    }

    if (!payload.rotationResult && !payload.collectableResult) {
      throw new Error('saveTome requires either rotationResult or collectableResult');
    }

    const now = new Date().toISOString();
    const kind = payload.collectableResult ? 'collectable' : 'regular';
    const tome: StoredTome = {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      id: createTomeId(),
      kind,
      name: payload.name?.trim() || undefined,
      itemId: payload.itemId,
      input: toStoredInput(payload),
      lastSolvedSnapshot: payload.collectableResult
        ? createCollectableSnapshot(payload.collectableResult)
        : createRegularSnapshot(payload.rotationResult as SolverResponse),
      createdAt: now,
      updatedAt: now
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
