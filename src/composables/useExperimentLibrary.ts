import { computed, ref } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { shouldHideCrystalGatheringItem } from '../config/crystalGathering';
import type {
  FoodSelection,
  LegacyStoredExperiment,
  NodeBonuses,
  PlayerStats,
  SimulationResponse,
  StoredCollectableExperimentAnalysis,
  StoredCollectableStrategyRule,
  StoredExperiment,
  StoredGatheringInput,
  StoredTomeRotationStep
} from '../types/game';
import type { CollectableObjective, CollectableRewardTableSummary } from '../types/collectable';
import { getRotationActionId } from '../services/actionIcons';
import type { ImportedExperimentDraft } from '../utils/tomeJsonImport';
import { trackExperimentDatabaseEntryAdded } from '../services/analytics';

const STORAGE_KEY = 'frozen-rabbit-tome-experiments';
const STORAGE_SCHEMA_VERSION = 2;
const experiments = useLocalStorage<StoredExperiment[]>(STORAGE_KEY, []);
const persistentSearchQuery = ref('');

migrateStoredExperiments();

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

function isStoredExperimentV2(experiment: StoredExperiment | LegacyStoredExperiment): experiment is StoredExperiment {
  return experiment.schemaVersion === STORAGE_SCHEMA_VERSION && !!(experiment as StoredExperiment).input;
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

function createRegularAnalysisSnapshot(analysis: SimulationResponse) {
  return {
    kind: 'regular' as const,
    modelVersions: analysis.modelVersions,
    expectedYield: analysis.total.expectedYield,
    minYield: analysis.total.minYield,
    maxYield: analysis.total.maxYield,
    minYieldChance: analysis.total.minYieldChance,
    maxYieldChance: analysis.total.maxYieldChance,
    revisitChance: analysis.revisitChance,
    primary: {
      expectedYield: analysis.primary.expectedYield,
      minYield: analysis.primary.minYield,
      maxYield: analysis.primary.maxYield
    },
    revisit: analysis.revisit
      ? {
          expectedYield: analysis.revisit.expectedYield,
          minYield: analysis.revisit.minYield,
          maxYield: analysis.revisit.maxYield
        }
      : undefined
  };
}

function createCollectableAnalysisSnapshot(
  analysis: StoredCollectableExperimentAnalysis,
  rules: StoredCollectableStrategyRule[]
) {
  return {
    kind: 'collectable' as const,
    modelVersions: analysis.modelVersions,
    expectedScore: analysis.expectedScore,
    minScore: analysis.minScore,
    maxScore: analysis.maxScore,
    minScoreChance: analysis.minScoreChance,
    maxScoreChance: analysis.maxScoreChance,
    expectedTierCounts: { ...analysis.expectedTierCounts },
    minScoreTierCounts: { ...analysis.minScoreTierCounts },
    maxScoreTierCounts: { ...analysis.maxScoreTierCounts },
    enabledRuleCount: rules.filter((rule) => rule.enabled).length,
    ruleCount: rules.length
  };
}

function migrateStoredExperiments() {
  const rawExperiments = experiments.value as Array<StoredExperiment | LegacyStoredExperiment>;
  const migrated = rawExperiments
    .map((experiment) => isStoredExperimentV2(experiment) ? experiment : migrateLegacyExperiment(experiment))
    .filter((experiment): experiment is StoredExperiment => experiment !== null);

  if (
    migrated.length !== rawExperiments.length
    || migrated.some((experiment, index) => experiment !== rawExperiments[index])
  ) {
    experiments.value = migrated;
  }
}

function migrateLegacyExperiment(experiment: LegacyStoredExperiment): StoredExperiment | null {
  if (!experiment.itemId || !experiment.stats || !experiment.food || !experiment.nodeBonuses) return null;

  const kind = experiment.kind === 'collectable' ? 'collectable' : 'regular';
  const input: StoredGatheringInput = {
    itemId: experiment.itemId,
    stats: { ...experiment.stats },
    temporaryGp: experiment.temporaryGp ?? experiment.stats.gp,
    food: { ...experiment.food },
    nodeBonuses: {
      baseIntegrity: experiment.nodeBonuses.baseIntegrity,
      gatheringCount: experiment.nodeBonuses.gatheringCount ?? 0,
      yieldCount: experiment.nodeBonuses.yieldCount ?? 0,
      extraRate: experiment.nodeBonuses.extraRate ?? 0
    },
    hasRelicToolBonus: kind === 'collectable'
      ? !!experiment.collectableHasRelicToolBonus
      : undefined
  };
  const createdAt = experiment.createdAt || new Date().toISOString();

  if (kind === 'collectable') {
    const rules = cloneStoragePayload(experiment.collectableRules ?? []);
    return {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      kind,
      id: experiment.id || createExperimentId(),
      name: experiment.name,
      itemId: experiment.itemId,
      input,
      strategy: {
        kind: 'collectable',
        rules,
        objective: experiment.collectableObjective ? cloneStoragePayload(experiment.collectableObjective) : undefined,
        rewardTableSummary: experiment.collectableRewardTableSummary ? { ...experiment.collectableRewardTableSummary } : undefined,
        hasRelicToolBonus: !!experiment.collectableHasRelicToolBonus
      },
      lastAnalysisSnapshot: experiment.collectableAnalysis
        ? createCollectableAnalysisSnapshot(experiment.collectableAnalysis, rules)
        : undefined,
      createdAt,
      updatedAt: experiment.updatedAt || createdAt
    };
  }

  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    kind,
    id: experiment.id || createExperimentId(),
    name: experiment.name,
    itemId: experiment.itemId,
    input,
    strategy: {
      kind: 'regular',
      primaryRotation: cloneStoragePayload(experiment.primaryRotation ?? []),
      revisitRotation: cloneStoragePayload(experiment.revisitRotation ?? [])
    },
    lastAnalysisSnapshot: experiment.analysis ? createRegularAnalysisSnapshot(experiment.analysis) : undefined,
    createdAt,
    updatedAt: experiment.updatedAt || createdAt
  };
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
      schemaVersion: STORAGE_SCHEMA_VERSION,
      id: createExperimentId(),
      name: payload.name?.trim() || undefined,
      kind: 'regular',
      itemId: payload.itemId,
      input: toStoredInput(payload),
      strategy: {
        kind: 'regular',
        primaryRotation: payload.primaryRotation
          .map(toStoredRotationStep)
          .filter((step): step is StoredTomeRotationStep => step !== null),
        revisitRotation: payload.revisitRotation
          .map(toStoredRotationStep)
          .filter((step): step is StoredTomeRotationStep => step !== null)
      },
      lastAnalysisSnapshot: createRegularAnalysisSnapshot(payload.analysis),
      createdAt: now,
      updatedAt: now
    };

    experiments.value = [experiment, ...experiments.value];
    trackExperimentDatabaseEntryAdded({
      itemId: experiment.itemId,
      kind: experiment.kind,
      source: 'analysis'
    });

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
    const rules = cloneStoragePayload(payload.rules);
    const experiment: StoredExperiment = {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      id: createExperimentId(),
      name: payload.name?.trim() || undefined,
      kind: 'collectable',
      itemId: payload.itemId,
      input: toStoredInput({ ...payload, hasRelicToolBonus: !!payload.hasRelicToolBonus }),
      strategy: {
        kind: 'collectable',
        rules,
        objective: cloneStoragePayload(payload.objective),
        rewardTableSummary: payload.rewardTableSummary ? { ...payload.rewardTableSummary } : undefined,
        hasRelicToolBonus: !!payload.hasRelicToolBonus
      },
      lastAnalysisSnapshot: createCollectableAnalysisSnapshot(payload.analysis, rules),
      createdAt: now,
      updatedAt: now
    };

    experiments.value = [experiment, ...experiments.value];
    trackExperimentDatabaseEntryAdded({
      itemId: experiment.itemId,
      kind: experiment.kind,
      source: 'analysis'
    });

    return experiment;
  };

  const saveImportedExperiment = (payload: ImportedExperimentDraft & { name?: string }) => {
    if (shouldHideCrystalGatheringItem({ itemId: payload.itemId })) {
      throw new Error('Crystal gathering items are hidden by configuration');
    }

    const now = new Date().toISOString();
    const experiment: StoredExperiment = {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      id: createExperimentId(),
      name: payload.name?.trim() || undefined,
      kind: payload.kind,
      itemId: payload.itemId,
      input: cloneStoragePayload(payload.input),
      strategy: cloneStoragePayload(payload.strategy),
      lastAnalysisSnapshot: payload.lastAnalysisSnapshot ? cloneStoragePayload(payload.lastAnalysisSnapshot) : undefined,
      createdAt: now,
      updatedAt: now
    };

    experiments.value = [experiment, ...experiments.value];
    trackExperimentDatabaseEntryAdded({
      itemId: experiment.itemId,
      kind: experiment.kind,
      source: 'import'
    });
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
    saveImportedExperiment,
    deleteExperiment,
    getExperiment,
    fromStoredRotationStep,
    searchQuery: persistentSearchQuery
  };
}
