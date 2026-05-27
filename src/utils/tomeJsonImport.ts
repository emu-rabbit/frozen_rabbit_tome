import { TOME_EXPORT_SCHEMA_VERSION, type TomeModelScenario, type TomeModelVersions } from '../config/modelVersions';
import { COLLECTABLE_ACTION_DEFINITIONS, getCollectableActionId } from '../services/collectableActions';
import type { CollectableActionKind, CollectableObjective, CollectableRewardTableSummary } from '../types/collectable';
import type {
  FoodSelection,
  GatheringJob,
  NodeBonuses,
  PlayerStats,
  SolverObjectiveMode,
  SolverRevisitInfo,
  SolverRotationPlanKind,
  StoredCollectableExperimentAnalysisSnapshotV2,
  StoredCollectableStrategyRule,
  StoredExperiment,
  StoredExperimentAnalysisSnapshot,
  StoredExperimentStrategy,
  StoredGatheringInput,
  StoredRegularExperimentAnalysisSnapshot,
  StoredRegularExperimentStrategy,
  StoredTome,
  StoredTomeRotationPlan,
  StoredTomeRotationStep,
  StoredTomeSnapshot
} from '../types/game';
import type { TomeRegularRotationExportStep } from './tomeJsonExport';
import { getSimulatorActions } from './rotationSimulator';

type JsonRecord = Record<string, unknown>;

export type TomeJsonImportSourceType = 'tome' | 'experiment';
export type TomeImportTarget = 'tomeLibrary' | 'experimentDatabase';

export type ImportedTomeDraft = Omit<StoredTome, 'schemaVersion' | 'id' | 'name' | 'createdAt' | 'updatedAt'>;
export type ImportedExperimentDraft = Omit<StoredExperiment, 'schemaVersion' | 'id' | 'name' | 'createdAt' | 'updatedAt'>;

export interface TomeJsonImportItemPreview {
  itemId: number;
  nameLocale?: string;
  nameEn?: string;
  glv?: number;
  jobType?: GatheringJob;
  jobTypes?: GatheringJob[];
  isCollectable?: boolean;
  isTimedNode?: boolean;
}

export interface TomeJsonImportProjection {
  sourceScenario: TomeModelScenario;
  sourceType: TomeJsonImportSourceType;
  item: TomeJsonImportItemPreview;
  defaultName: string;
  modelVersions?: TomeModelVersions;
  tome: ImportedTomeDraft;
  experiment: ImportedExperimentDraft;
}

export class TomeJsonImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TomeJsonImportError';
  }
}

const supportedScenarios = new Set<TomeModelScenario>([
  'tome.regular',
  'tome.collectable',
  'experiment.regular',
  'experiment.collectable'
]);

export function parseTomeJsonImport(text: string): TomeJsonImportProjection {
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new TomeJsonImportError('invalidJson');
  }

  const root = requiredRecord(payload, 'root');
  const manifest = requiredRecord(root.manifest, 'manifest');
  if (manifest.app !== 'frozen_rabbit_tome' || manifest.schemaVersion !== TOME_EXPORT_SCHEMA_VERSION) {
    throw new TomeJsonImportError('unsupportedSchema');
  }

  const sourceScenario = readScenario(manifest.scenario);
  const item = readSubjectItem(root);
  const input = readStoredInput(root, item.itemId);
  const modelVersions = asRecord(root.modelVersions) as TomeModelVersions | null;
  const defaultName = item.nameLocale || item.nameEn || `Item ${item.itemId}`;

  if (sourceScenario === 'tome.regular') {
    const tome = buildRegularTomeDraft(root, input, item, modelVersions ?? undefined);
    return {
      sourceScenario,
      sourceType: 'tome',
      item,
      defaultName,
      modelVersions: modelVersions ?? undefined,
      tome,
      experiment: buildRegularExperimentDraftFromTome(root, input, item, modelVersions ?? undefined)
    };
  }

  if (sourceScenario === 'tome.collectable') {
    const tome = buildCollectableTomeDraft(root, input, item, modelVersions ?? undefined);
    return {
      sourceScenario,
      sourceType: 'tome',
      item,
      defaultName,
      modelVersions: modelVersions ?? undefined,
      tome,
      experiment: buildCollectableExperimentDraftFromTome(root, input, item, modelVersions ?? undefined)
    };
  }

  if (sourceScenario === 'experiment.regular') {
    const experiment = buildRegularExperimentDraft(root, input, item, modelVersions ?? undefined);
    return {
      sourceScenario,
      sourceType: 'experiment',
      item,
      defaultName,
      modelVersions: modelVersions ?? undefined,
      tome: buildRegularTomeDraftFromExperiment(root, input, item, modelVersions ?? undefined),
      experiment
    };
  }

  const experiment = buildCollectableExperimentDraft(root, input, item, modelVersions ?? undefined);
  return {
    sourceScenario,
    sourceType: 'experiment',
    item,
    defaultName,
    modelVersions: modelVersions ?? undefined,
    tome: buildCollectableTomeDraftFromExperiment(root, input, item, modelVersions ?? undefined),
    experiment
  };
}

export function isImportMismatch(target: TomeImportTarget, projection: TomeJsonImportProjection) {
  return (target === 'tomeLibrary' && projection.sourceType === 'experiment')
    || (target === 'experimentDatabase' && projection.sourceType === 'tome');
}

function buildRegularTomeDraft(
  root: JsonRecord,
  input: StoredGatheringInput,
  item: TomeJsonImportItemPreview,
  modelVersions?: TomeModelVersions
): ImportedTomeDraft {
  const solver = requiredRecord(root.solver, 'solver');
  const combined = requiredRecord(solver.combined, 'solver.combined');
  const rotations = readRotationPlans(solver.rotations, input, item.jobType ?? 'miner');

  return {
    kind: 'regular',
    itemId: item.itemId,
    input,
    lastSolvedSnapshot: {
      kind: 'regular',
      modelVersions,
      objectiveMode: readObjectiveMode(solver.objectiveMode),
      rotation: rotations[0]?.rotation ?? [],
      rotationPlans: rotations,
      revisit: readRevisit(combined.revisit),
      expectedYield: optionalNumber(combined.expectedYield),
      minYield: optionalNumber(combined.minYield),
      maxYield: optionalNumber(combined.maxYield),
      minYieldChance: optionalNumber(combined.minYieldChance),
      maxYieldChance: optionalNumber(combined.maxYieldChance)
    }
  };
}

function buildRegularTomeDraftFromExperiment(
  root: JsonRecord,
  input: StoredGatheringInput,
  item: TomeJsonImportItemPreview,
  modelVersions?: TomeModelVersions
): ImportedTomeDraft {
  const strategy = requiredRecord(root.strategy, 'strategy');
  const analyzer = requiredRecord(root.analyzer, 'analyzer');
  const total = requiredRecord(analyzer.total, 'analyzer.total');
  const rotations = [{
    kind: 'primary' as const,
    rotation: readRegularRotation(strategy.primaryRotation, input, item.jobType ?? 'miner')
  }];

  return {
    kind: 'regular',
    itemId: item.itemId,
    input,
    lastSolvedSnapshot: {
      kind: 'regular',
      modelVersions,
      objectiveMode: 'expected',
      rotation: rotations[0].rotation,
      rotationPlans: rotations,
      revisit: {
        enabled: optionalNumber(analyzer.revisitChance) !== undefined && optionalNumber(analyzer.revisitChance)! > 0,
        chance: optionalNumber(analyzer.revisitChance) ?? 0,
        isFullGp: false
      },
      expectedYield: optionalNumber(total.expectedYield),
      minYield: optionalNumber(total.minYield),
      maxYield: optionalNumber(total.maxYield),
      minYieldChance: optionalNumber(total.minYieldChance),
      maxYieldChance: optionalNumber(total.maxYieldChance)
    }
  };
}

function buildCollectableTomeDraft(
  root: JsonRecord,
  input: StoredGatheringInput,
  item: TomeJsonImportItemPreview,
  modelVersions?: TomeModelVersions
): ImportedTomeDraft {
  const solver = requiredRecord(root.solver, 'solver');
  const combined = requiredRecord(solver.combined, 'solver.combined');
  const importInput = requiredRecord(root.input, 'input');

  return {
    kind: 'collectable',
    itemId: item.itemId,
    input,
    lastSolvedSnapshot: {
      kind: 'collectable',
      modelVersions,
      objectiveMode: readObjectiveMode(importInput.objectiveMode),
      rootAction: readCollectableRootAction(root, item.jobType ?? 'miner'),
      previewBranches: readCollectablePreviewBranches(root),
      rewardItemId: optionalNumber(readRewardTableSummary(importInput.rewardTable)?.rewardItemId),
      rewardTableSummary: readRewardTableSummary(importInput.rewardTable),
      objective: asRecord(importInput.objective) as unknown as CollectableObjective | undefined,
      expectedScore: optionalNumber(combined.expectedScore),
      minScore: optionalNumber(combined.minScore),
      maxScore: optionalNumber(combined.maxScore),
      minScoreChance: optionalNumber(combined.minScoreChance),
      maxScoreChance: optionalNumber(combined.maxScoreChance),
      expectedReward: asRecord(combined.expectedReward) as never,
      expectedTierCounts: asRecord(combined.expectedTierCounts) as never,
      minScoreTierCounts: asRecord(combined.minScoreTierCounts) as never,
      maxScoreTierCounts: asRecord(combined.maxScoreTierCounts) as never
    }
  };
}

function buildCollectableTomeDraftFromExperiment(
  root: JsonRecord,
  input: StoredGatheringInput,
  item: TomeJsonImportItemPreview,
  modelVersions?: TomeModelVersions
): ImportedTomeDraft {
  const importInput = requiredRecord(root.input, 'input');
  const strategy = requiredRecord(root.strategy, 'strategy');
  const analyzer = requiredRecord(root.analyzer, 'analyzer');
  const firstAction = firstCollectableRuleAction(strategy.rules) ?? 'collect';

  return {
    kind: 'collectable',
    itemId: item.itemId,
    input,
    lastSolvedSnapshot: {
      kind: 'collectable',
      modelVersions,
      objectiveMode: 'expected',
      rootAction: collectableActionSummary(firstAction, item.jobType ?? 'miner'),
      previewBranches: [],
      rewardItemId: optionalNumber(readRewardTableSummary(importInput.rewardTable)?.rewardItemId),
      rewardTableSummary: readRewardTableSummary(importInput.rewardTable),
      objective: asRecord(importInput.objective) as unknown as CollectableObjective | undefined,
      expectedScore: optionalNumber(analyzer.expectedScore),
      minScore: optionalNumber(analyzer.minScore),
      maxScore: optionalNumber(analyzer.maxScore),
      minScoreChance: optionalNumber(analyzer.minScoreChance),
      maxScoreChance: optionalNumber(analyzer.maxScoreChance),
      expectedTierCounts: asRecord(analyzer.expectedTierCounts) as never,
      minScoreTierCounts: asRecord(analyzer.minScoreTierCounts) as never,
      maxScoreTierCounts: asRecord(analyzer.maxScoreTierCounts) as never
    }
  };
}

function buildRegularExperimentDraft(
  root: JsonRecord,
  input: StoredGatheringInput,
  item: TomeJsonImportItemPreview,
  modelVersions?: TomeModelVersions
): ImportedExperimentDraft {
  const strategy = requiredRecord(root.strategy, 'strategy');
  const analyzer = requiredRecord(root.analyzer, 'analyzer');

  return {
    kind: 'regular',
    itemId: item.itemId,
    input,
    strategy: {
      kind: 'regular',
      primaryRotation: readRegularRotation(strategy.primaryRotation, input, item.jobType ?? 'miner'),
      revisitRotation: readRegularRotation(strategy.revisitRotation, input, item.jobType ?? 'miner')
    },
    lastAnalysisSnapshot: readRegularAnalysisSnapshot(analyzer, modelVersions)
  };
}

function buildRegularExperimentDraftFromTome(
  root: JsonRecord,
  input: StoredGatheringInput,
  item: TomeJsonImportItemPreview,
  modelVersions?: TomeModelVersions
): ImportedExperimentDraft {
  const solver = requiredRecord(root.solver, 'solver');
  const combined = requiredRecord(solver.combined, 'solver.combined');
  const plans = readRotationPlans(solver.rotations, input, item.jobType ?? 'miner');
  const primary = plans.find((plan) => plan.kind === 'primary')?.rotation ?? plans[0]?.rotation ?? [];
  const revisit = plans.find((plan) => plan.kind === 'revisit')?.rotation ?? [];

  return {
    kind: 'regular',
    itemId: item.itemId,
    input,
    strategy: {
      kind: 'regular',
      primaryRotation: primary,
      revisitRotation: revisit
    },
    lastAnalysisSnapshot: {
      kind: 'regular',
      modelVersions,
      expectedYield: optionalNumber(combined.expectedYield),
      minYield: optionalNumber(combined.minYield),
      maxYield: optionalNumber(combined.maxYield),
      minYieldChance: optionalNumber(combined.minYieldChance),
      maxYieldChance: optionalNumber(combined.maxYieldChance),
      revisitChance: optionalNumber(readRevisit(combined.revisit)?.chance)
    }
  };
}

function buildCollectableExperimentDraft(
  root: JsonRecord,
  input: StoredGatheringInput,
  item: TomeJsonImportItemPreview,
  modelVersions?: TomeModelVersions
): ImportedExperimentDraft {
  const importInput = requiredRecord(root.input, 'input');
  const strategy = requiredRecord(root.strategy, 'strategy');
  const analyzer = requiredRecord(root.analyzer, 'analyzer');
  const rules = readStoredCollectableRules(strategy.rules);

  return {
    kind: 'collectable',
    itemId: item.itemId,
    input,
    strategy: {
      kind: 'collectable',
      rules,
      objective: asRecord(importInput.objective) as unknown as CollectableObjective | undefined,
      rewardTableSummary: readRewardTableSummary(importInput.rewardTable),
      hasRelicToolBonus: !!input.hasRelicToolBonus
    },
    lastAnalysisSnapshot: readCollectableAnalysisSnapshot(analyzer, rules, modelVersions)
  };
}

function buildCollectableExperimentDraftFromTome(
  root: JsonRecord,
  input: StoredGatheringInput,
  item: TomeJsonImportItemPreview,
  modelVersions?: TomeModelVersions
): ImportedExperimentDraft {
  const importInput = requiredRecord(root.input, 'input');
  const solver = requiredRecord(root.solver, 'solver');
  const combined = requiredRecord(solver.combined, 'solver.combined');
  const rules = readCodecCollectableRules(root.strategyCodec);

  return {
    kind: 'collectable',
    itemId: item.itemId,
    input,
    strategy: {
      kind: 'collectable',
      rules,
      objective: asRecord(importInput.objective) as unknown as CollectableObjective | undefined,
      rewardTableSummary: readRewardTableSummary(importInput.rewardTable),
      hasRelicToolBonus: !!input.hasRelicToolBonus
    },
    lastAnalysisSnapshot: readCollectableAnalysisSnapshot(combined, rules, modelVersions)
  };
}

function readScenario(value: unknown): TomeModelScenario {
  if (typeof value !== 'string' || !supportedScenarios.has(value as TomeModelScenario)) {
    throw new TomeJsonImportError('unsupportedScenario');
  }

  return value as TomeModelScenario;
}

function readSubjectItem(root: JsonRecord): TomeJsonImportItemPreview {
  const subject = requiredRecord(root.subject, 'subject');
  const item = requiredRecord(subject.item, 'subject.item');
  const itemId = requiredNumber(item.itemId, 'subject.item.itemId');

  return {
    itemId,
    nameLocale: optionalString(item.nameLocale),
    nameEn: optionalString(item.nameEn),
    glv: optionalNumber(item.glv),
    jobType: readJobType(item.jobType),
    jobTypes: readJobTypes(item.jobTypes),
    isCollectable: optionalBoolean(item.isCollectable),
    isTimedNode: optionalBoolean(item.isTimedNode)
  };
}

function readStoredInput(root: JsonRecord, itemId: number): StoredGatheringInput {
  const input = requiredRecord(root.input, 'input');
  const player = requiredRecord(input.player, 'input.player');
  const baseStats = asRecord(player.baseStats);
  const effectiveStats = requiredRecord(player.effectiveStats, 'input.player.effectiveStats');
  const stats = readPlayerStats(baseStats ?? effectiveStats, 'input.player.stats');
  const node = requiredRecord(input.node, 'input.node');
  const nodeBonuses = readNodeBonuses(requiredRecord(node.bonuses, 'input.node.bonuses'));
  const food = asRecord(player.food);
  const foodSelection = readFoodSelection(food ? asRecord(food.selection) : null);

  return {
    itemId,
    stats,
    temporaryGp: optionalNumber(player.temporaryGp) ?? stats.gp,
    food: foodSelection,
    nodeBonuses: {
      baseIntegrity: nodeBonuses.baseIntegrity,
      gatheringCount: nodeBonuses.gatheringCount,
      yieldCount: nodeBonuses.yieldCount,
      extraRate: nodeBonuses.extraRate
    },
    hasRelicToolBonus: optionalBoolean(input.hasRelicToolBonus)
  };
}

function readPlayerStats(record: JsonRecord, fieldName: string): PlayerStats {
  return {
    level: requiredNumber(record.level, `${fieldName}.level`),
    gathering: requiredNumber(record.gathering, `${fieldName}.gathering`),
    perception: requiredNumber(record.perception, `${fieldName}.perception`),
    gp: requiredNumber(record.gp, `${fieldName}.gp`)
  };
}

function readNodeBonuses(record: JsonRecord): NodeBonuses {
  return {
    baseIntegrity: requiredNumber(record.baseIntegrity, 'nodeBonuses.baseIntegrity'),
    gatheringCount: optionalNumber(record.gatheringCount) ?? 0,
    yieldCount: optionalNumber(record.yieldCount) ?? 0,
    extraRate: optionalNumber(record.extraRate) ?? 0
  };
}

function readFoodSelection(record: JsonRecord | null): FoodSelection {
  const quality = record?.quality === 'nq' || record?.quality === 'hq' ? record.quality : 'hq';
  return {
    foodId: optionalNumber(record?.foodId) ?? null,
    quality
  };
}

function readRotationPlans(value: unknown, input: StoredGatheringInput, jobType: GatheringJob): StoredTomeRotationPlan[] {
  if (!Array.isArray(value)) return [];

  return value.map((plan): StoredTomeRotationPlan | null => {
    const record = asRecord(plan);
    if (!record) return null;
    const kind = record.kind === 'revisit' ? 'revisit' : 'primary';
    return {
      kind: kind as SolverRotationPlanKind,
      rotation: readRegularRotation(record.rotation, input, jobType)
    };
  }).filter((plan): plan is StoredTomeRotationPlan => !!plan);
}

function readRegularRotation(value: unknown, input: StoredGatheringInput, jobType: GatheringJob): StoredTomeRotationStep[] {
  if (!Array.isArray(value)) return [];

  return value.map((step) => decodeRegularRotationStep(step, input, jobType))
    .filter((step): step is StoredTomeRotationStep => !!step);
}

function decodeRegularRotationStep(
  step: unknown,
  input: StoredGatheringInput,
  jobType: GatheringJob
): StoredTomeRotationStep | null {
  const record = asRecord(step);
  if (!record) return null;
  const typedStep = record as Partial<TomeRegularRotationExportStep>;

  if (typedStep.type === 'gather' || typedStep.code === 'gather') {
    return {
      type: 'gather',
      actionName: typedStep.condition === 'wiseToTheWorld' ? '採集（理智觸發）' : '採集'
    };
  }

  if (typedStep.type !== 'action' || typeof typedStep.code !== 'string') return null;

  const action = getSimulatorActions(jobType).find((candidate) => candidate.kind === typedStep.code);
  const actionId = optionalNumber(record.actionId);
  if (!action || !actionId) return null;

  return {
    type: 'action',
    actionId,
    actionName: typedStep.condition === 'wiseToTheWorld' ? `${action.name}(若觸發)` : action.name
  };
}

function readRegularAnalysisSnapshot(analyzer: JsonRecord, modelVersions?: TomeModelVersions): StoredRegularExperimentAnalysisSnapshot {
  const total = requiredRecord(analyzer.total, 'analyzer.total');
  const primary = asRecord(analyzer.primary);
  const revisit = asRecord(analyzer.revisit);

  return {
    kind: 'regular',
    modelVersions,
    expectedYield: optionalNumber(total.expectedYield),
    minYield: optionalNumber(total.minYield),
    maxYield: optionalNumber(total.maxYield),
    minYieldChance: optionalNumber(total.minYieldChance),
    maxYieldChance: optionalNumber(total.maxYieldChance),
    revisitChance: optionalNumber(analyzer.revisitChance),
    primary: primary ? readRotationAnalysisSummary(primary) : undefined,
    revisit: revisit ? readRotationAnalysisSummary(revisit) : undefined
  };
}

function readRotationAnalysisSummary(record: JsonRecord) {
  const expectedYield = optionalNumber(record.expectedYield);
  const minYield = optionalNumber(record.minYield);
  const maxYield = optionalNumber(record.maxYield);
  if (expectedYield === undefined || minYield === undefined || maxYield === undefined) return undefined;

  return {
    expectedYield,
    minYield,
    maxYield
  };
}

function readCollectableAnalysisSnapshot(
  source: JsonRecord,
  rules: StoredCollectableStrategyRule[],
  modelVersions?: TomeModelVersions
): StoredCollectableExperimentAnalysisSnapshotV2 {
  return {
    kind: 'collectable',
    modelVersions,
    expectedScore: optionalNumber(source.expectedScore),
    minScore: optionalNumber(source.minScore),
    maxScore: optionalNumber(source.maxScore),
    minScoreChance: optionalNumber(source.minScoreChance),
    maxScoreChance: optionalNumber(source.maxScoreChance),
    expectedTierCounts: asRecord(source.expectedTierCounts) as never,
    minScoreTierCounts: asRecord(source.minScoreTierCounts) as never,
    maxScoreTierCounts: asRecord(source.maxScoreTierCounts) as never,
    enabledRuleCount: rules.filter((rule) => rule.enabled).length,
    ruleCount: rules.length
  };
}

function readStoredCollectableRules(value: unknown): StoredCollectableStrategyRule[] {
  if (!Array.isArray(value)) return [];
  return value.map((rule, index) => normalizeStoredCollectableRule(rule, index))
    .filter((rule): rule is StoredCollectableStrategyRule => !!rule);
}

function normalizeStoredCollectableRule(rule: unknown, index: number): StoredCollectableStrategyRule | null {
  const record = asRecord(rule);
  if (!record || !Array.isArray(record.actions)) return null;
  const actions = record.actions.filter(isCollectableActionKind);
  if (!actions.length) return null;

  return {
    id: optionalString(record.id) ?? `import-rule-${index + 1}`,
    name: optionalString(record.name) ?? `Rule ${index + 1}`,
    mode: record.mode === 'any' ? 'any' : 'all',
    enabled: record.enabled !== false,
    conditions: Array.isArray(record.conditions)
      ? record.conditions.map((condition, conditionIndex) => {
          const conditionRecord = asRecord(condition);
          if (!conditionRecord || typeof conditionRecord.field !== 'string') return null;
          return {
            id: optionalString(conditionRecord.id) ?? `import-rule-${index + 1}-condition-${conditionIndex + 1}`,
            field: conditionRecord.field,
            comparator: readComparator(conditionRecord.comparator),
            value: readConditionValue(conditionRecord.value)
          };
        }).filter((condition): condition is StoredCollectableStrategyRule['conditions'][number] => !!condition)
      : [],
    actions
  };
}

function readCodecCollectableRules(value: unknown): StoredCollectableStrategyRule[] {
  const codec = asRecord(value);
  const plans = Array.isArray(codec?.plans) ? codec.plans : [];
  const primaryPlan = plans.map(asRecord).find((plan) => plan?.kind !== 'revisit') ?? asRecord(plans[0]);
  const rules = Array.isArray(primaryPlan?.rules) ? primaryPlan.rules : [];

  return rules.map((rule, index) => {
    const record = asRecord(rule);
    if (!record || !isCollectableActionKind(record.action)) return null;
    const conditions = Array.isArray(record.conditions)
      ? record.conditions.map((condition, conditionIndex) => {
          if (!Array.isArray(condition)) return null;
          const [field, comparator, value] = condition;
          if (typeof field !== 'string') return null;
          return {
            id: `import-codec-rule-${index + 1}-condition-${conditionIndex + 1}`,
            field,
            comparator: readComparator(comparator),
            value: readConditionValue(value)
          };
        }).filter((condition): condition is StoredCollectableStrategyRule['conditions'][number] => !!condition)
      : [];

    if (!conditions.length && typeof record.stateKey === 'string') return null;

    return {
      id: `import-codec-rule-${index + 1}`,
      name: `Rule ${index + 1}`,
      mode: record.mode === 'any' ? 'any' : 'all',
      enabled: record.enabled !== false,
      conditions,
      actions: [record.action]
    };
  }).filter((rule): rule is StoredCollectableStrategyRule => !!rule);
}

function readCollectableRootAction(root: JsonRecord, jobType: GatheringJob) {
  const fullPolicyAction = firstFullPolicyAction(root.strategyCodec);
  return collectableActionSummary(fullPolicyAction ?? firstCodecAction(root.strategyCodec) ?? 'collect', jobType);
}

function readCollectablePreviewBranches(root: JsonRecord) {
  const codec = asRecord(root.strategyCodec);
  const fullPolicy = Array.isArray(codec?.fullPolicy) ? asRecord(codec.fullPolicy[0]) : null;
  const policy = asRecord(fullPolicy?.policy);
  const branches = Array.isArray(policy?.branches) ? policy.branches.slice(0, 4) : [];

  return branches.map((branch) => {
    const record = asRecord(branch);
    const next = asRecord(record?.next);
    const action = asRecord(next?.recommendedAction);
    return {
      labelKey: optionalString(record?.labelKey) ?? 'collectableSolver.policy.outcome',
      conditionKey: optionalString(record?.conditionKey) ?? '',
      probability: optionalNumber(record?.probability) ?? 0,
      actionKind: isCollectableActionKind(action?.kind) ? action.kind : undefined
    };
  });
}

function firstFullPolicyAction(value: unknown): CollectableActionKind | null {
  const codec = asRecord(value);
  const fullPolicy = Array.isArray(codec?.fullPolicy) ? asRecord(codec.fullPolicy[0]) : null;
  const policy = asRecord(fullPolicy?.policy);
  const action = asRecord(policy?.recommendedAction);
  return isCollectableActionKind(action?.kind) ? action.kind : null;
}

function firstCodecAction(value: unknown): CollectableActionKind | null {
  const codec = asRecord(value);
  const plans = Array.isArray(codec?.plans) ? codec.plans : [];
  const firstPlan = asRecord(plans[0]);
  const rules = Array.isArray(firstPlan?.rules) ? firstPlan.rules : [];
  const firstRule = asRecord(rules[0]);
  return isCollectableActionKind(firstRule?.action) ? firstRule.action : null;
}

function firstCollectableRuleAction(value: unknown): CollectableActionKind | null {
  const rules = readStoredCollectableRules(value);
  return rules[0]?.actions[0] ?? null;
}

function collectableActionSummary(kind: CollectableActionKind, jobType: GatheringJob) {
  const definition = COLLECTABLE_ACTION_DEFINITIONS[kind];
  return {
    kind,
    actionId: getCollectableActionId(kind, jobType),
    nameKey: `collectableSolver.actions.${kind}`,
    gpCost: definition.gpCost
  };
}

function readRewardTableSummary(value: unknown): CollectableRewardTableSummary | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  const source = optionalString(record.source) as CollectableRewardTableSummary['source'] | undefined;
  if (!source) return undefined;

  if (optionalNumber(record.lowCollectability) !== undefined && optionalNumber(record.midCollectability) !== undefined) {
    return {
      source,
      rewardItemId: optionalNumber(record.rewardItemId),
      lowCollectability: optionalNumber(record.lowCollectability) ?? 0,
      lowScrip: optionalNumber(record.lowScrip) ?? 0,
      midCollectability: optionalNumber(record.midCollectability) ?? 0,
      midScrip: optionalNumber(record.midScrip) ?? 0,
      highCollectability: optionalNumber(record.highCollectability),
      highScrip: optionalNumber(record.highScrip)
    };
  }

  const tiers = asRecord(record.tiers);
  const low = asRecord(tiers?.low);
  const mid = asRecord(tiers?.mid);
  if (!low || !mid) return undefined;
  const high = asRecord(tiers?.high);

  return {
    source,
    rewardItemId: optionalNumber(record.rewardItemId),
    lowCollectability: optionalNumber(low.collectability) ?? 0,
    lowScrip: optionalNumber(asRecord(low.reward)?.scrip) ?? 0,
    midCollectability: optionalNumber(mid.collectability) ?? 0,
    midScrip: optionalNumber(asRecord(mid.reward)?.scrip) ?? 0,
    highCollectability: optionalNumber(high?.collectability),
    highScrip: optionalNumber(asRecord(high?.reward)?.scrip)
  };
}

function readRevisit(value: unknown): SolverRevisitInfo | undefined {
  const record = asRecord(value);
  if (!record) return undefined;

  return {
    enabled: !!record.enabled,
    chance: optionalNumber(record.chance) ?? 0,
    isFullGp: !!record.isFullGp
  };
}

function readObjectiveMode(value: unknown): SolverObjectiveMode {
  return value === 'max' || value === 'min' || value === 'expected' ? value : 'expected';
}

function readJobType(value: unknown): GatheringJob | undefined {
  return value === 'miner' || value === 'botanist' ? value : undefined;
}

function readJobTypes(value: unknown): GatheringJob[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((entry): entry is GatheringJob => entry === 'miner' || entry === 'botanist');
}

function readComparator(value: unknown): StoredCollectableStrategyRule['conditions'][number]['comparator'] {
  if (value === '<' || value === '<=' || value === '=' || value === '>=' || value === '>') return value;
  return '=';
}

function readConditionValue(value: unknown): number | boolean {
  if (typeof value === 'boolean') return value;
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function isCollectableActionKind(value: unknown): value is CollectableActionKind {
  return typeof value === 'string' && value in COLLECTABLE_ACTION_DEFINITIONS;
}

function requiredRecord(value: unknown, fieldName: string): JsonRecord {
  const record = asRecord(value);
  if (!record) throw new TomeJsonImportError(`missing:${fieldName}`);
  return record;
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : null;
}

function requiredNumber(value: unknown, fieldName: string): number {
  const numberValue = optionalNumber(value);
  if (numberValue === undefined) throw new TomeJsonImportError(`missing:${fieldName}`);
  return numberValue;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export type {
  StoredExperimentAnalysisSnapshot,
  StoredExperimentStrategy,
  StoredRegularExperimentStrategy,
  StoredTomeSnapshot
};
