import {
  COLLECTABLE_POLICY_STRATEGY_CODEC_ENCODING,
  compressCollectablePolicyToExactStrategy,
  compressCollectablePolicyToExactStrategyAsync,
  verifyCollectablePolicyExactStrategyRoundTrip,
  verifyCollectablePolicyExactStrategyRoundTripAsync,
  type CollectablePolicyCodecAsyncOptions,
  type CollectableExactStrategyPlan,
  type CollectablePolicyStrategyRule
} from './collectablePolicyStrategyCodec';
import {
  TOME_EXPORT_SCHEMA_VERSION,
  TOME_MODEL_VERSION_CATALOG,
  buildModelVersionsForScenario,
  type TomeModelScenario
} from '../config/modelVersions';
import type {
  CollectableRewardTable,
  CollectableRewardTableSummary,
  CollectableSolverRequest,
  CollectableSolverResult
} from '../types/collectable';
import type {
  AppliedFoodBonus,
  FoodSelection,
  GatherableItem,
  NodeBonuses,
  PlayerStats,
  SimulationResponse,
  SolverRequest,
  SolverResponse,
  StoredCollectableStrategyRule
} from '../types/game';
import type { CollectableStrategyAnalysis } from './collectableStrategyAnalysis';
import type { CollectableStrategyTreeResult } from './collectableStrategyTree';
import type { SimulationRequest } from './rotationSimulator';
import { getSimulatorActions } from './rotationSimulator';
import type { RegularGatheringActionKind } from './regularGatheringMechanics';
import { getRotationActionId } from '../services/actionIcons';
import { trackJsonDownloaded } from '../services/analytics';

export type TomeJsonExportScenario = TomeModelScenario;

export interface TomeJsonExportMeta {
  scenario: TomeJsonExportScenario;
  generatedAt?: string;
  locale?: string;
  commit?: string | null;
}

export interface TomeJsonExportFoodState {
  selection: FoodSelection;
  appliedBonus?: AppliedFoodBonus;
  baseStats?: PlayerStats;
}

export interface TomeJsonExportItemMeta {
  itemId: number;
  nameLocale?: string;
  nameEn?: string;
  glv?: number;
  gatheringItemId?: number;
  jobType?: GatherableItem['jobType'];
  jobTypes?: GatherableItem['jobTypes'];
  isTimedNode?: boolean;
  isCollectable?: boolean;
}

export type TomeRegularRotationExportStep =
  | {
      type: 'gather';
      code: 'gather';
      condition?: 'wiseToTheWorld';
    }
  | {
      type: 'action';
      code: Exclude<RegularGatheringActionKind, 'gather'>;
      actionId: number;
      condition?: 'wiseToTheWorld';
    };

export interface RegularSolverJsonExportInput {
  meta: Omit<TomeJsonExportMeta, 'scenario'>;
  item: GatherableItem;
  request: SolverRequest;
  result: SolverResponse;
  food: TomeJsonExportFoodState;
}

export interface RegularExperimentJsonExportInput {
  meta: Omit<TomeJsonExportMeta, 'scenario'>;
  item: GatherableItem;
  request: Omit<SimulationRequest, 'primaryRotation' | 'revisitRotation'>;
  primaryRotation: string[];
  revisitRotation: string[];
  includeRevisit: boolean;
  analysis: SimulationResponse;
  food: TomeJsonExportFoodState;
}

export interface CollectableSolverJsonExportInput {
  meta: Omit<TomeJsonExportMeta, 'scenario'>;
  item: GatherableItem;
  request: CollectableSolverRequest;
  result: CollectableSolverResult;
  food: TomeJsonExportFoodState;
  includeFullPolicy?: boolean;
}

export interface CollectableExperimentJsonExportInput {
  meta: Omit<TomeJsonExportMeta, 'scenario'>;
  item: GatherableItem;
  request: Omit<CollectableSolverRequest, 'rewardTable' | 'objective' | 'debugMode' | 'manualMemoCapacityPower'>;
  rewardTable: CollectableRewardTable | null;
  rewardTableSummary?: CollectableRewardTableSummary;
  objective: CollectableSolverRequest['objective'];
  rules: StoredCollectableStrategyRule[];
  tree: CollectableStrategyTreeResult | null;
  analysis: CollectableStrategyAnalysis;
  food: TomeJsonExportFoodState;
}

export function buildRegularSolverJsonExport(input: RegularSolverJsonExportInput) {
  return compactJson({
    manifest: buildManifest({ ...input.meta, scenario: 'tome.regular' }),
    modelVersions: input.result.modelVersions,
    subject: buildSubject('solver', 'regular', input.item),
    input: buildGatheringInput(input.request, input.food),
    solver: {
      objectiveMode: input.result.objectiveMode,
      rotations: input.result.rotationPlans.map((plan) => ({
        ...plan,
        rotation: encodeRegularRotation(plan.rotation, input.request.jobType)
      })),
      combined: {
        expectedYield: input.result.expectedYield,
        minYield: input.result.minYield,
        maxYield: input.result.maxYield,
        minYieldChance: input.result.minYieldChance,
        maxYieldChance: input.result.maxYieldChance,
        revisit: input.result.revisit,
        calculationTime: input.result.calculationTime
      },
      formulas: input.result.debug?.formulas ?? null,
      plans: input.result.debug?.plans ?? null,
      search: input.result.debug?.optimality ?? null
    }
  });
}

export function buildRegularExperimentJsonExport(input: RegularExperimentJsonExportInput) {
  return compactJson({
    manifest: buildManifest({ ...input.meta, scenario: 'experiment.regular' }),
    modelVersions: input.analysis.modelVersions,
    subject: buildSubject('experiment', 'regular', input.item),
    input: buildGatheringInput(input.request, input.food),
    strategy: {
      primaryRotation: encodeRegularRotation(input.primaryRotation, input.request.jobType),
      revisitRotation: input.includeRevisit ? encodeRegularRotation(input.revisitRotation, input.request.jobType) : [],
      includeRevisit: input.includeRevisit
    },
    analyzer: input.analysis
  });
}

export function buildCollectableSolverJsonExport(input: CollectableSolverJsonExportInput) {
  const exactStrategies = input.result.policyPlans.map((plan) => {
    const strategy = compressCollectablePolicyToExactStrategy(plan.policy, {
      kind: plan.kind,
      startingGp: plan.startingGp
    });
    const roundTrip = verifyCollectablePolicyExactStrategyRoundTrip(input.request, plan.policy, strategy);
    if (!roundTrip.ok) {
      throw new Error([
        `Collectable policy codec round-trip failed for ${plan.kind} plan.`,
        ...roundTrip.differences.slice(0, 10)
      ].join('\n'));
    }

    return strategy;
  });

  return buildCollectableSolverPayload(input, exactStrategies);
}

export async function buildCollectableSolverJsonExportAsync(
  input: CollectableSolverJsonExportInput,
  asyncOptions: CollectablePolicyCodecAsyncOptions = {}
) {
  const exactStrategies: CollectableExactStrategyPlan[] = [];
  for (const plan of input.result.policyPlans) {
    const strategy = await compressCollectablePolicyToExactStrategyAsync(plan.policy, {
      kind: plan.kind,
      startingGp: plan.startingGp
    }, asyncOptions);
    const roundTrip = await verifyCollectablePolicyExactStrategyRoundTripAsync(input.request, plan.policy, strategy, asyncOptions);
    if (!roundTrip.ok) {
      throw new Error([
        `Collectable policy codec round-trip failed for ${plan.kind} plan.`,
        ...roundTrip.differences.slice(0, 10)
      ].join('\n'));
    }
    exactStrategies.push(strategy);
  }

  return buildCollectableSolverPayload(input, exactStrategies);
}

function buildCollectableSolverPayload(
  input: CollectableSolverJsonExportInput,
  exactStrategies: CollectableExactStrategyPlan[]
) {
  return compactJson({
    manifest: buildManifest({
      ...input.meta,
      scenario: 'tome.collectable',
      limitations: input.result.debug?.limitations ?? [
        'brazen-excluded',
        'high-standard-excluded',
        'reduction-reward-model-excluded'
      ]
    }),
    modelVersions: input.result.modelVersions,
    subject: buildSubject('solver', 'collectable', input.item),
    input: {
      ...buildGatheringInput(input.request, input.food),
      hasRelicToolBonus: !!input.request.hasRelicToolBonus,
      objective: input.result.objective,
      objectiveMode: input.result.objectiveMode,
      rewardTable: input.request.rewardTable,
      manualMemoCapacityPower: input.request.manualMemoCapacityPower ?? null
    },
    solver: {
      combined: {
        expectedScore: input.result.expectedScore,
        minScore: input.result.minScore,
        maxScore: input.result.maxScore,
        minScoreChance: input.result.minScoreChance,
        maxScoreChance: input.result.maxScoreChance,
        expectedReward: input.result.expectedReward,
        expectedTierCounts: input.result.expectedTierCounts,
        minScoreTierCounts: input.result.minScoreTierCounts,
        maxScoreTierCounts: input.result.maxScoreTierCounts,
        revisit: input.result.revisit,
        calculationTime: input.result.calculationTime
      },
      formulas: input.result.debug?.formulas ?? null,
      plans: input.result.debug?.plans ?? null,
      search: input.result.debug?.optimality ?? null
    },
    strategyCodec: {
      encoding: COLLECTABLE_POLICY_STRATEGY_CODEC_ENCODING,
      lossless: true,
      revisitPlanRef: input.result.revisit.enabled && input.result.revisit.isFullGp ? 'primary' : null,
      plans: exactStrategies,
      fullPolicy: input.includeFullPolicy ? input.result.policyPlans.map((plan) => ({
        kind: plan.kind,
        startingGp: plan.startingGp,
        policy: plan.policy
      })) : undefined
    }
  });
}

export function buildCollectableExperimentJsonExport(input: CollectableExperimentJsonExportInput) {
  return compactJson({
    manifest: buildManifest({ ...input.meta, scenario: 'experiment.collectable' }),
    modelVersions: input.analysis.modelVersions,
    subject: buildSubject('experiment', 'collectable', input.item),
    input: {
      ...buildGatheringInput(input.request, input.food),
      hasRelicToolBonus: !!input.request.hasRelicToolBonus,
      objective: input.objective,
      rewardTable: input.rewardTable ?? input.rewardTableSummary ?? null
    },
    strategy: {
      rules: input.rules,
      treeSummary: input.tree?.summary ?? null,
      limited: input.tree?.limited ?? null,
      uncoveredNodeCount: input.tree?.uncoveredNodes.length ?? null
    },
    analyzer: input.analysis
  });
}

export function downloadJsonFile(payload: unknown, fileName: string) {
  const sanitizedFileName = sanitizeJsonFileName(fileName);
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = sanitizedFileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  trackJsonDownloaded({
    scenario: getExportScenario(payload),
    fileName: sanitizedFileName
  });
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getExportScenario(payload: unknown) {
  if (!payload || typeof payload !== 'object') return undefined;
  const manifest = (payload as { manifest?: { scenario?: unknown } }).manifest;
  return typeof manifest?.scenario === 'string' ? manifest.scenario : undefined;
}

export function buildJsonExportFileName(payload: {
  item: Pick<GatherableItem, 'itemId' | 'nameLocale' | 'nameEn'>;
  scenario: TomeJsonExportScenario;
  scenarioLabel?: string;
  generatedAt?: Date;
}) {
  const itemName = payload.item.nameLocale || payload.item.nameEn || `item-${payload.item.itemId}`;
  const scenarioName = payload.scenarioLabel?.trim() || payload.scenario;
  const date = (payload.generatedAt ?? new Date()).toISOString().slice(0, 10);
  return sanitizeJsonFileName(`${itemName} - ${scenarioName} - ${date}.json`);
}

export function sanitizeJsonFileName(fileName: string) {
  return fileName
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/g, '')
    .slice(0, 160);
}

function buildManifest(input: TomeJsonExportMeta & { limitations?: string[] }) {
  return {
    app: 'frozen_rabbit_tome',
    schemaVersion: TOME_EXPORT_SCHEMA_VERSION,
    version: TOME_MODEL_VERSION_CATALOG.app.version,
    commit: input.commit ?? import.meta.env.VITE_APP_COMMIT ?? null,
    scenario: input.scenario,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    locale: input.locale ?? null,
    limitations: input.limitations ?? []
  };
}

function buildSubject(surface: 'solver' | 'experiment', itemKind: 'regular' | 'collectable', item: GatherableItem) {
  return {
    surface,
    itemKind,
    item: buildItemMeta(item)
  };
}

function buildItemMeta(item: GatherableItem): TomeJsonExportItemMeta {
  return {
    itemId: item.itemId,
    nameLocale: item.nameLocale,
    nameEn: item.nameEn,
    glv: item.glv,
    gatheringItemId: item.gatheringItemId,
    jobType: item.jobType,
    jobTypes: item.jobTypes,
    isTimedNode: item.isTimedNode ?? false,
    isCollectable: !!item.isCollectable
  };
}

function buildGatheringInput(
  request: {
    stats: PlayerStats;
    baseValues: SolverRequest['baseValues'];
    itemLevel: number;
    nodeBonuses: NodeBonuses;
    temporaryGp: number;
    jobType: SolverRequest['jobType'];
    isTimedNode?: boolean;
  },
  food: TomeJsonExportFoodState
) {
  return {
    player: {
      baseStats: food.baseStats ?? null,
      effectiveStats: request.stats,
      temporaryGp: request.temporaryGp,
      food: {
        selection: food.selection,
        appliedBonus: food.appliedBonus ?? null
      }
    },
    itemLevel: request.itemLevel,
    baseValues: {
      Gathering: request.baseValues.Gathering,
      Perception: request.baseValues.Perception
    },
    jobType: request.jobType,
    isTimedNode: !!request.isTimedNode,
    node: {
      bonuses: request.nodeBonuses,
      maxIntegrity: request.nodeBonuses.baseIntegrity + request.nodeBonuses.gatheringCount
    }
  };
}

function compactJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function encodeRegularRotation(
  rotation: string[],
  jobType: SolverRequest['jobType']
): TomeRegularRotationExportStep[] {
  return rotation.map((actionName) => encodeRegularRotationStep(actionName, jobType));
}

function encodeRegularRotationStep(
  actionName: string,
  jobType: SolverRequest['jobType']
): TomeRegularRotationExportStep {
  if (actionName.startsWith('採集')) {
    return actionName.includes('理智觸發')
      ? { type: 'gather', code: 'gather', condition: 'wiseToTheWorld' }
      : { type: 'gather', code: 'gather' };
  }

  const condition = actionName.includes('若觸發') ? 'wiseToTheWorld' : undefined;
  const normalizedName = actionName.replace(/\(若觸發\)$/, '');
  const action = getSimulatorActions(jobType).find((candidate) => candidate.name === normalizedName);
  const actionId = getRotationActionId(actionName);

  if (!action || action.kind === 'gather' || !actionId) {
    throw new Error(`Cannot encode regular gathering action "${actionName}" for JSON export.`);
  }

  return {
    type: 'action',
    code: action.kind,
    actionId,
    ...(condition ? { condition } : {})
  };
}

export type { CollectableExactStrategyPlan, CollectablePolicyStrategyRule };
