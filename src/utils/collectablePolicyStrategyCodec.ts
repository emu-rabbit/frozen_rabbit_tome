import {
  addCollectableRewards,
  addCollectableTierCounts,
  createZeroReward,
  createZeroTierCounts,
  getCollectableRewardForValue,
  getCollectableTierCountForValue,
  scoreCollectability
} from './collectableMath';
import {
  applyCollectableAction,
  canUseCollectableAction,
  collectableStateKey,
  createCollectableMechanicsContext,
  createInitialCollectableMechanicsState,
  type CollectableMechanicsState
} from './collectableMechanics';
import { COLLECTABLE_ACTION_DEFINITIONS, getCollectableActionId } from '../services/collectableActions';
import type { StoredCollectableStrategyCondition } from '../types/game';
import type {
  CollectableActionKind,
  CollectableActionSummary,
  CollectablePolicyNode,
  CollectablePolicyPlanKind,
  CollectableRewardVector,
  CollectableSolverRequest,
  CollectableStateSummary,
  CollectableTierCounts
} from '../types/collectable';

const CODEC_VERSION = 'collectable-policy-strategy-rules-v1' as const;
export const COLLECTABLE_POLICY_STRATEGY_CODEC_ENCODING = CODEC_VERSION;
const COLLECT_SUCCESS_LABEL = 'collectableSolver.branches.collectSuccess';
const REVISIT_ACTION: CollectableActionKind = 'revisitCheck';
type EncodableCollectableActionKind = Exclude<CollectableActionKind, 'revisitCheck'>;
type ExactRuleField = StoredCollectableStrategyCondition['field'];
type PrimitiveCondition = Omit<StoredCollectableStrategyCondition, 'id'>;
type StrategyConditionTuple = [
  field: ExactRuleField,
  comparator: StoredCollectableStrategyCondition['comparator'],
  value: number | boolean
];

type DiffPath = string;
const DEFAULT_YIELD_EVERY = 50;

export interface CollectablePolicyCodecProgress {
  phase: 'compress' | 'inflate' | 'compare';
  planKind?: CollectablePolicyPlanKind;
  visitedNodes: number;
}

export interface CollectablePolicyCodecAsyncOptions {
  yieldEvery?: number;
  yieldToEventLoop?: () => Promise<void>;
  onProgress?: (progress: CollectablePolicyCodecProgress) => void;
}

export interface CollectableExactStrategyEntry {
  stateKey: string;
  nodeId: string;
  state: CollectableMechanicsState;
  action: EncodableCollectableActionKind;
}

export interface CollectablePolicyStrategyRule {
  action: EncodableCollectableActionKind;
  conditions?: StrategyConditionTuple[];
  mode?: 'all' | 'any';
  enabled?: boolean;
  stateKey?: string;
}

export interface CollectableExactStrategyPlan {
  codec: typeof CODEC_VERSION;
  kind?: CollectablePolicyPlanKind;
  startingGp: number;
  rootStateKey: string;
  rootNodeId: string;
  nodeCount: number;
  compression: {
    ruleCount: number;
    broadRuleCount: number;
    exactRuleCount: number;
  };
  rules: CollectablePolicyStrategyRule[];
}

export interface CollectablePolicyStrategyRoundTripResult {
  ok: boolean;
  differences: string[];
  inflatedPolicy: CollectablePolicyNode;
}

export function compressCollectablePolicyToExactStrategy(
  policy: CollectablePolicyNode,
  options: {
    kind?: CollectablePolicyPlanKind;
    startingGp: number;
  }
): CollectableExactStrategyPlan {
  const visited = new Set<string>();
  const entries: CollectableExactStrategyEntry[] = [];
  const rootState = decodeFullState(policy);
  const rootStateKey = collectableStateKey(rootState);

  function visit(node: CollectablePolicyNode) {
    const state = decodeFullState(node);
    const stateKey = collectableStateKey(state);
    if (visited.has(stateKey)) return;
    visited.add(stateKey);

    const action = node.recommendedAction.kind;
    if (action === REVISIT_ACTION) {
      throw new Error('Cannot encode a combined collectable policy with revisit gates. Encode policyPlans separately.');
    }

    if (node.branches.length > 0) {
      entries.push({
        stateKey,
        nodeId: node.id,
        state,
        action: action as EncodableCollectableActionKind
      });
    }

    node.branches.forEach((branch) => {
      if (branch.next) visit(branch.next);
    });
  }

  visit(policy);

  return {
    codec: CODEC_VERSION,
    kind: options.kind,
    startingGp: options.startingGp,
    rootStateKey,
    rootNodeId: policy.id,
    nodeCount: entries.length,
    ...compressEntriesToRules(entries)
  };
}

export async function compressCollectablePolicyToExactStrategyAsync(
  policy: CollectablePolicyNode,
  options: {
    kind?: CollectablePolicyPlanKind;
    startingGp: number;
  },
  asyncOptions: CollectablePolicyCodecAsyncOptions = {}
): Promise<CollectableExactStrategyPlan> {
  const visited = new Set<string>();
  const entries: CollectableExactStrategyEntry[] = [];
  const rootState = decodeFullState(policy);
  const rootStateKey = collectableStateKey(rootState);
  const yieldControl = createYieldControl(asyncOptions);

  async function visit(node: CollectablePolicyNode) {
    const state = decodeFullState(node);
    const stateKey = collectableStateKey(state);
    if (visited.has(stateKey)) return;
    visited.add(stateKey);
    await yieldControl({
      phase: 'compress',
      planKind: options.kind,
      visitedNodes: visited.size
    });

    const action = node.recommendedAction.kind;
    if (action === REVISIT_ACTION) {
      throw new Error('Cannot encode a combined collectable policy with revisit gates. Encode policyPlans separately.');
    }

    if (node.branches.length > 0) {
      entries.push({
        stateKey,
        nodeId: node.id,
        state,
        action: action as EncodableCollectableActionKind
      });
    }

    for (const branch of node.branches) {
      if (branch.next) await visit(branch.next);
    }
  }

  await visit(policy);

  return {
    codec: CODEC_VERSION,
    kind: options.kind,
    startingGp: options.startingGp,
    rootStateKey,
    rootNodeId: policy.id,
    nodeCount: entries.length,
    ...compressEntriesToRules(entries)
  };
}

export function inflateCollectablePolicyFromExactStrategy(
  request: CollectableSolverRequest,
  strategy: CollectableExactStrategyPlan
): CollectablePolicyNode {
  if (strategy.codec !== CODEC_VERSION) {
    throw new Error(`Unsupported collectable policy codec "${strategy.codec}".`);
  }

  const mechanics = createCollectableMechanicsContext(request);
  const visited = new Map<string, { node: CollectablePolicyNode; rawExpectedScore: number }>();
  const rootState = createInitialCollectableMechanicsState(mechanics, strategy.startingGp);
  const rootStateKey = collectableStateKey(rootState);
  if (rootStateKey !== strategy.rootStateKey) {
    throw new Error(`Strategy root state does not match request start state: ${strategy.rootStateKey} !== ${rootStateKey}.`);
  }

  function inflate(state: CollectableMechanicsState): { node: CollectablePolicyNode; rawExpectedScore: number } {
    const stateKey = collectableStateKey(state);
    const cached = visited.get(stateKey);
    if (cached) return cached;

    const action = resolveStrategyAction(strategy.rules, state, mechanics);
    if (!action) {
      if (state.integrity <= 0) {
        const terminal = {
          node: emptyPolicyNode(state, stateKey, request.jobType),
          rawExpectedScore: 0
        };
        visited.set(stateKey, terminal);
        return terminal;
      }

      throw new Error(`Strategy rules are missing a decision for state ${stateKey}.`);
    }

    const node: CollectablePolicyNode = {
      id: stateKey,
      state: summarizeState(state),
      recommendedAction: actionSummary(action, request.jobType),
      expectedScore: 0,
      expectedReward: createZeroReward(),
      expectedTierCounts: createZeroTierCounts(),
      branches: []
    };
    const cachedEntry = { node, rawExpectedScore: 0 };
    visited.set(stateKey, cachedEntry);

    let rawExpectedScore = 0;
    let expectedReward = createZeroReward();
    let expectedTierCounts = createZeroTierCounts();
    node.branches = applyCollectableAction(action, state, mechanics).map((transition) => {
      const immediateReward = isSuccessfulCollect(action, transition.labelKey)
        ? getCollectableRewardForValue(state.collectability, request.rewardTable)
        : createZeroReward();
      const immediateTierCounts = isSuccessfulCollect(action, transition.labelKey)
        ? getCollectableTierCountForValue(state.collectability, request.rewardTable)
        : createZeroTierCounts();
      const immediateScore = isSuccessfulCollect(action, transition.labelKey)
        ? scoreCollectability(state.collectability, request.rewardTable, request.objective)
        : 0;
      const transitionStateKey = collectableStateKey(transition.state);
      const hasChildDecision = !!resolveStrategyAction(strategy.rules, transition.state, mechanics);
      const child = hasChildDecision
        ? inflate(transition.state)
        : transition.state.integrity <= 0
          ? undefined
          : (() => {
              throw new Error(`Strategy rules stop before terminal state ${transitionStateKey}.`);
            })();
      const childReward = child?.node.expectedReward ?? createZeroReward();
      const childTierCounts = child?.node.expectedTierCounts ?? createZeroTierCounts();
      const childRawScore = child?.rawExpectedScore ?? 0;
      const branchReward = addCollectableRewards(immediateReward, childReward);
      const branchTierCounts = addCollectableTierCounts(immediateTierCounts, childTierCounts);
      const branchScore = immediateScore + childRawScore;

      rawExpectedScore += branchScore * transition.probability;
      expectedReward = addCollectableRewards(expectedReward, branchReward, transition.probability);
      expectedTierCounts = addCollectableTierCounts(expectedTierCounts, branchTierCounts, transition.probability);

      return {
        labelKey: transition.labelKey,
        labelKeys: transition.labelKeys,
        conditionKey: transition.conditionKey,
        probability: transition.probability * 100,
        outcome: {
          gp: transition.state.gp,
          integrity: transition.state.integrity,
          collectability: transition.state.collectability,
          reward: branchReward,
          score: Number(branchScore.toFixed(6))
        },
        next: child?.node
      };
    });

    node.expectedScore = Number(rawExpectedScore.toFixed(6));
    node.expectedReward = expectedReward;
    node.expectedTierCounts = expectedTierCounts;
    cachedEntry.rawExpectedScore = rawExpectedScore;
    return cachedEntry;
  }

  return inflate(rootState).node;
}

export async function inflateCollectablePolicyFromExactStrategyAsync(
  request: CollectableSolverRequest,
  strategy: CollectableExactStrategyPlan,
  asyncOptions: CollectablePolicyCodecAsyncOptions = {}
): Promise<CollectablePolicyNode> {
  if (strategy.codec !== CODEC_VERSION) {
    throw new Error(`Unsupported collectable policy codec "${strategy.codec}".`);
  }

  const mechanics = createCollectableMechanicsContext(request);
  const visited = new Map<string, { node: CollectablePolicyNode; rawExpectedScore: number }>();
  const rootState = createInitialCollectableMechanicsState(mechanics, strategy.startingGp);
  const rootStateKey = collectableStateKey(rootState);
  const yieldControl = createYieldControl(asyncOptions);
  if (rootStateKey !== strategy.rootStateKey) {
    throw new Error(`Strategy root state does not match request start state: ${strategy.rootStateKey} !== ${rootStateKey}.`);
  }

  async function inflate(state: CollectableMechanicsState): Promise<{ node: CollectablePolicyNode; rawExpectedScore: number }> {
    const stateKey = collectableStateKey(state);
    const cached = visited.get(stateKey);
    if (cached) return cached;

    const action = resolveStrategyAction(strategy.rules, state, mechanics);
    if (!action) {
      if (state.integrity <= 0) {
        const terminal = {
          node: emptyPolicyNode(state, stateKey, request.jobType),
          rawExpectedScore: 0
        };
        visited.set(stateKey, terminal);
        return terminal;
      }

      throw new Error(`Strategy rules are missing a decision for state ${stateKey}.`);
    }

    const node: CollectablePolicyNode = {
      id: stateKey,
      state: summarizeState(state),
      recommendedAction: actionSummary(action, request.jobType),
      expectedScore: 0,
      expectedReward: createZeroReward(),
      expectedTierCounts: createZeroTierCounts(),
      branches: []
    };
    const cachedEntry = { node, rawExpectedScore: 0 };
    visited.set(stateKey, cachedEntry);
    await yieldControl({
      phase: 'inflate',
      planKind: strategy.kind,
      visitedNodes: visited.size
    });

    let rawExpectedScore = 0;
    let expectedReward = createZeroReward();
    let expectedTierCounts = createZeroTierCounts();
    const branches: CollectablePolicyNode['branches'] = [];

    for (const transition of applyCollectableAction(action, state, mechanics)) {
      const immediateReward = isSuccessfulCollect(action, transition.labelKey)
        ? getCollectableRewardForValue(state.collectability, request.rewardTable)
        : createZeroReward();
      const immediateTierCounts = isSuccessfulCollect(action, transition.labelKey)
        ? getCollectableTierCountForValue(state.collectability, request.rewardTable)
        : createZeroTierCounts();
      const immediateScore = isSuccessfulCollect(action, transition.labelKey)
        ? scoreCollectability(state.collectability, request.rewardTable, request.objective)
        : 0;
      const transitionStateKey = collectableStateKey(transition.state);
      const hasChildDecision = !!resolveStrategyAction(strategy.rules, transition.state, mechanics);
      const child = hasChildDecision
        ? await inflate(transition.state)
        : transition.state.integrity <= 0
          ? undefined
          : (() => {
              throw new Error(`Strategy rules stop before terminal state ${transitionStateKey}.`);
            })();
      const childReward = child?.node.expectedReward ?? createZeroReward();
      const childTierCounts = child?.node.expectedTierCounts ?? createZeroTierCounts();
      const childRawScore = child?.rawExpectedScore ?? 0;
      const branchReward = addCollectableRewards(immediateReward, childReward);
      const branchTierCounts = addCollectableTierCounts(immediateTierCounts, childTierCounts);
      const branchScore = immediateScore + childRawScore;

      rawExpectedScore += branchScore * transition.probability;
      expectedReward = addCollectableRewards(expectedReward, branchReward, transition.probability);
      expectedTierCounts = addCollectableTierCounts(expectedTierCounts, branchTierCounts, transition.probability);

      branches.push({
        labelKey: transition.labelKey,
        labelKeys: transition.labelKeys,
        conditionKey: transition.conditionKey,
        probability: transition.probability * 100,
        outcome: {
          gp: transition.state.gp,
          integrity: transition.state.integrity,
          collectability: transition.state.collectability,
          reward: branchReward,
          score: Number(branchScore.toFixed(6))
        },
        next: child?.node
      });
    }

    node.branches = branches;
    node.expectedScore = Number(rawExpectedScore.toFixed(6));
    node.expectedReward = expectedReward;
    node.expectedTierCounts = expectedTierCounts;
    cachedEntry.rawExpectedScore = rawExpectedScore;
    return cachedEntry;
  }

  return (await inflate(rootState)).node;
}

export function verifyCollectablePolicyExactStrategyRoundTrip(
  request: CollectableSolverRequest,
  policy: CollectablePolicyNode,
  strategy: CollectableExactStrategyPlan
): CollectablePolicyStrategyRoundTripResult {
  const inflatedPolicy = inflateCollectablePolicyFromExactStrategy(request, strategy);
  const differences: string[] = [];
  comparePolicies(policy, inflatedPolicy, 'root', differences, new Set());

  return {
    ok: differences.length === 0,
    differences,
    inflatedPolicy
  };
}

export async function verifyCollectablePolicyExactStrategyRoundTripAsync(
  request: CollectableSolverRequest,
  policy: CollectablePolicyNode,
  strategy: CollectableExactStrategyPlan,
  asyncOptions: CollectablePolicyCodecAsyncOptions = {}
): Promise<CollectablePolicyStrategyRoundTripResult> {
  const inflatedPolicy = await inflateCollectablePolicyFromExactStrategyAsync(request, strategy, asyncOptions);
  const differences: string[] = [];
  await comparePoliciesAsync(policy, inflatedPolicy, 'root', differences, new Set(), createYieldControl(asyncOptions), strategy.kind);

  return {
    ok: differences.length === 0,
    differences,
    inflatedPolicy
  };
}

function emptyPolicyNode(
  state: CollectableMechanicsState,
  id: string,
  jobType: CollectableSolverRequest['jobType']
): CollectablePolicyNode {
  return {
    id,
    state: summarizeState(state),
    recommendedAction: actionSummary('collect', jobType),
    expectedScore: 0,
    expectedReward: createZeroReward(),
    expectedTierCounts: createZeroTierCounts(),
    branches: []
  };
}

function actionSummary(kind: CollectableActionKind, jobType: CollectableSolverRequest['jobType']): CollectableActionSummary {
  const definition = COLLECTABLE_ACTION_DEFINITIONS[kind];
  return {
    kind,
    actionId: getCollectableActionId(kind, jobType),
    nameKey: `collectableSolver.actions.${kind}`,
    gpCost: definition.gpCost
  };
}

function summarizeState(state: CollectableMechanicsState): CollectableStateSummary {
  return {
    gp: state.gp,
    integrity: state.integrity,
    collectability: state.collectability,
    scrutinyActive: state.scrutinyActive,
    collectorsFocusActive: state.collectorsFocusActive,
    primingTouchActive: state.primingTouchActive,
    standardActive: state.standardActive,
    successBonus: state.successBonus,
    nextCollectSuccessBonus: state.nextCollectSuccessBonus,
    wiseToTheWorldActive: state.wiseToTheWorldActive
  };
}

function isSuccessfulCollect(action: CollectableActionKind, labelKey: string): boolean {
  return action === 'collect' && labelKey === COLLECT_SUCCESS_LABEL;
}

const STRATEGY_FIELDS: ExactRuleField[] = [
  'gp',
  'integrity',
  'collectability',
  'scrutinyActive',
  'collectorsFocusActive',
  'primingTouchActive',
  'standardActive',
  'hasUsedCollectableAction',
  'hasCollected',
  'successBonus',
  'successIActive',
  'successIIActive',
  'successIIIActive',
  'nextCollectSuccessBonus',
  'wiseToTheWorldActive'
];

function compressEntriesToRules(entries: CollectableExactStrategyEntry[]): Pick<CollectableExactStrategyPlan, 'compression' | 'rules'> {
  const remaining = [...entries];
  const rules: CollectablePolicyStrategyRule[] = [];
  let broadRuleCount = 0;

  while (remaining.length > 0) {
    const candidate = findBestBroadRule(remaining);
    if (!candidate || candidate.coveredEntries.length < 2) break;

    rules.push(candidate.rule);
    broadRuleCount += 1;
    const covered = new Set(candidate.coveredEntries.map((entry) => entry.stateKey));
    for (let index = remaining.length - 1; index >= 0; index -= 1) {
      if (covered.has(remaining[index].stateKey)) remaining.splice(index, 1);
    }
  }

  const exactRuleCount = remaining.length;
  remaining.forEach((entry) => {
    rules.push(exactEntryToRule(entry));
  });

  return {
    compression: {
      ruleCount: rules.length,
      broadRuleCount,
      exactRuleCount
    },
    rules
  };
}

function findBestBroadRule(
  entries: CollectableExactStrategyEntry[]
): { rule: CollectablePolicyStrategyRule; coveredEntries: CollectableExactStrategyEntry[] } | null {
  let best: { rule: CollectablePolicyStrategyRule; coveredEntries: CollectableExactStrategyEntry[] } | null = null;

  [...new Set(entries.map((entry) => entry.action))].forEach((action) => {
    const candidate = buildBroadRuleForAction(entries, action);
    if (!candidate) return;
    if (!best || candidate.coveredEntries.length > best.coveredEntries.length || (
      candidate.coveredEntries.length === best.coveredEntries.length
      && ruleConditionCount(candidate.rule) < ruleConditionCount(best.rule)
    )) {
      best = candidate;
    }
  });

  return best;
}

function buildBroadRuleForAction(
  entries: CollectableExactStrategyEntry[],
  action: EncodableCollectableActionKind
): { rule: CollectablePolicyStrategyRule; coveredEntries: CollectableExactStrategyEntry[] } | null {
  const actionEntries = entries.filter((entry) => entry.action === action);
  const negatives = entries.filter((entry) => entry.action !== action);
  let best: { conditions: PrimitiveCondition[]; coveredEntries: CollectableExactStrategyEntry[] } | null = null;

  if (actionEntries.length < 2) return null;

  for (const seed of actionEntries) {
    let positives = [...actionEntries];
    let remainingNegatives = [...negatives];
    const conditions: PrimitiveCondition[] = [];

    while (remainingNegatives.length > 0) {
      const next = chooseBestSeedCondition(seed.state, positives, remainingNegatives, conditions);
      if (!next) break;
      conditions.push(next.condition);
      positives = next.positives;
      remainingNegatives = next.negatives;
      if (remainingNegatives.length === 0) break;
    }

    if (remainingNegatives.length > 0 || positives.length < 2) continue;
    if (!best || positives.length > best.coveredEntries.length || (
      positives.length === best.coveredEntries.length
      && conditions.length < best.conditions.length
    )) {
      best = {
        conditions,
        coveredEntries: positives
      };
    }
  }

  if (!best || best.conditions.length === 0 || best.coveredEntries.length < 2) return null;

  return {
    rule: {
      action,
      conditions: best.conditions.map(conditionToTuple)
    },
    coveredEntries: best.coveredEntries
  };
}

function chooseBestSeedCondition(
  seed: CollectableMechanicsState,
  positives: CollectableExactStrategyEntry[],
  negatives: CollectableExactStrategyEntry[],
  selectedConditions: PrimitiveCondition[]
) {
  let best: {
    condition: PrimitiveCondition;
    positives: CollectableExactStrategyEntry[];
    negatives: CollectableExactStrategyEntry[];
    score: number;
  } | null = null;

  for (const condition of seedConditions(seed)) {
    if (selectedConditions.some((selected) => sameCondition(selected, condition))) continue;
    const nextPositives = positives.filter((entry) => conditionMatchesState(condition, entry.state));
    if (nextPositives.length < 2) continue;
    const nextNegatives = negatives.filter((entry) => conditionMatchesState(condition, entry.state));
    const removedNegatives = negatives.length - nextNegatives.length;
    if (removedNegatives <= 0) continue;

    const score = removedNegatives * 100000 + nextPositives.length * 100 - conditionCost(condition);
    if (!best || score > best.score) {
      best = {
        condition,
        positives: nextPositives,
        negatives: nextNegatives,
        score
      };
    }
  }

  return best;
}

function seedConditions(state: CollectableMechanicsState): PrimitiveCondition[] {
  const conditions: PrimitiveCondition[] = [];
  STRATEGY_FIELDS.forEach((field) => {
    const value = stateFieldValue(state, field);
    if (typeof value === 'boolean') {
      conditions.push({ field, comparator: '=', value });
      return;
    }
    conditions.push(
      { field, comparator: '=', value },
      { field, comparator: '<=', value },
      { field, comparator: '>=', value }
    );
  });
  return conditions;
}

function sameCondition(a: PrimitiveCondition, b: PrimitiveCondition) {
  return a.field === b.field && a.comparator === b.comparator && a.value === b.value;
}

function conditionCost(condition: PrimitiveCondition) {
  return condition.comparator === '=' ? 2 : 1;
}

function exactEntryToRule(entry: CollectableExactStrategyEntry): CollectablePolicyStrategyRule {
  return {
    stateKey: entry.stateKey,
    action: entry.action
  };
}

function resolveStrategyAction(
  rules: CollectablePolicyStrategyRule[],
  state: CollectableMechanicsState,
  mechanics: ReturnType<typeof createCollectableMechanicsContext>
): EncodableCollectableActionKind | null {
  for (const rule of rules) {
    if (rule.enabled === false || !ruleMatchesState(rule, state)) continue;
    if (canUseCollectableAction(rule.action, state, mechanics)) return rule.action;
  }

  return null;
}

function ruleMatchesState(rule: CollectablePolicyStrategyRule, state: CollectableMechanicsState) {
  if (rule.stateKey && rule.stateKey !== collectableStateKey(state)) return false;
  const conditions = rule.conditions ?? [];
  if (conditions.length === 0) return true;
  const results = conditions.map((condition) => conditionMatchesState(condition, state));
  return rule.mode === 'any'
    ? results.some(Boolean)
    : results.every(Boolean);
}

function conditionMatchesState(
  condition: PrimitiveCondition | StrategyConditionTuple,
  state: CollectableMechanicsState
) {
  const normalized = Array.isArray(condition)
    ? tupleToCondition(condition)
    : condition;
  const actual = stateFieldValue(state, normalized.field);
  if (typeof actual === 'boolean' || typeof normalized.value === 'boolean') {
    return normalized.comparator === '=' && actual === normalized.value;
  }

  switch (normalized.comparator) {
    case '<':
      return actual < normalized.value;
    case '<=':
      return actual <= normalized.value;
    case '=':
      return actual === normalized.value;
    case '>=':
      return actual >= normalized.value;
    case '>':
      return actual > normalized.value;
    default:
      return false;
  }
}

function conditionToTuple(condition: PrimitiveCondition): StrategyConditionTuple {
  return [condition.field, condition.comparator, condition.value];
}

function tupleToCondition(condition: StrategyConditionTuple): PrimitiveCondition {
  return {
    field: condition[0],
    comparator: condition[1],
    value: condition[2]
  };
}

function ruleConditionCount(rule: CollectablePolicyStrategyRule): number {
  return rule.conditions?.length ?? 0;
}

function stateFieldValue(state: CollectableMechanicsState, field: string): number | boolean {
  switch (field) {
    case 'gp':
      return state.gp;
    case 'integrity':
      return state.integrity;
    case 'collectability':
      return state.collectability;
    case 'scrutinyActive':
      return state.scrutinyActive;
    case 'collectorsFocusActive':
      return state.collectorsFocusActive;
    case 'primingTouchActive':
      return state.primingTouchActive;
    case 'standardActive':
      return state.standardActive;
    case 'hasUsedCollectableAction':
      return state.hasUsedCollectableAction;
    case 'hasCollected':
      return state.hasCollected;
    case 'successBonus':
      return state.successBonus;
    case 'successIActive':
      return state.successIActive;
    case 'successIIActive':
      return state.successIIActive;
    case 'successIIIActive':
      return state.successIIIActive;
    case 'nextCollectSuccessBonus':
      return state.nextCollectSuccessBonus;
    case 'wiseToTheWorldActive':
      return state.wiseToTheWorldActive;
    default:
      throw new Error(`Unsupported collectable strategy field "${field}".`);
  }
}

function decodeFullState(node: CollectablePolicyNode): CollectableMechanicsState {
  if (node.id.includes('|revisit|')) {
    throw new Error('Cannot decode a synthetic revisit gate as an exact collectable strategy state.');
  }

  const fromStringKey = parseStringStateKey(node.id);
  if (fromStringKey) return fromStringKey;

  const fromPackedKey = parsePackedStateKey(node.id);
  if (fromPackedKey) return fromPackedKey;

  throw new Error(`Cannot decode full collectable state from policy node id "${node.id}".`);
}

function parseStringStateKey(value: string): CollectableMechanicsState | null {
  const parts = value.split('|');
  if (parts.length !== 15 || !parts.every((part) => /^-?\d+$/.test(part))) return null;
  const numbers = parts.map(Number);
  if (numbers.some((part) => !Number.isFinite(part))) return null;

  return {
    gp: numbers[0],
    integrity: numbers[1],
    collectability: numbers[2],
    scrutinyActive: numbers[3] === 1,
    collectorsFocusActive: numbers[4] === 1,
    primingTouchActive: numbers[5] === 1,
    standardActive: numbers[6] === 1,
    hasUsedCollectableAction: numbers[7] === 1,
    hasCollected: numbers[8] === 1,
    successBonus: numbers[9],
    successIActive: numbers[10] === 1,
    successIIActive: numbers[11] === 1,
    successIIIActive: numbers[12] === 1,
    nextCollectSuccessBonus: numbers[13],
    wiseToTheWorldActive: numbers[14] === 1
  };
}

function parsePackedStateKey(value: string): CollectableMechanicsState | null {
  if (!/^\d+$/.test(value)) return null;
  const packed = BigInt(value);
  const flags = Number((packed >> 26n) & 1023n);

  return {
    gp: Number(packed & 4095n),
    integrity: Number((packed >> 12n) & 15n),
    collectability: Number((packed >> 16n) & 1023n),
    scrutinyActive: (flags & (1 << 0)) !== 0,
    collectorsFocusActive: (flags & (1 << 1)) !== 0,
    primingTouchActive: (flags & (1 << 2)) !== 0,
    standardActive: (flags & (1 << 3)) !== 0,
    hasUsedCollectableAction: (flags & (1 << 4)) !== 0,
    hasCollected: (flags & (1 << 5)) !== 0,
    successBonus: Number((packed >> 36n) & 127n),
    successIActive: (flags & (1 << 6)) !== 0,
    successIIActive: (flags & (1 << 7)) !== 0,
    successIIIActive: (flags & (1 << 8)) !== 0,
    nextCollectSuccessBonus: Number((packed >> 43n) & 31n),
    wiseToTheWorldActive: (flags & (1 << 9)) !== 0
  };
}

function comparePolicies(
  expected: CollectablePolicyNode,
  actual: CollectablePolicyNode,
  path: DiffPath,
  differences: string[],
  visited: Set<string>
) {
  const key = `${expected.id}->${actual.id}`;
  if (visited.has(key)) return;
  visited.add(key);

  compareValue(`${path}.state`, expected.state, actual.state, differences);
  compareValue(`${path}.action`, expected.recommendedAction, actual.recommendedAction, differences);
  compareNumber(`${path}.expectedScore`, expected.expectedScore, actual.expectedScore, differences);
  compareReward(`${path}.expectedReward`, expected.expectedReward, actual.expectedReward, differences);
  compareTierCounts(`${path}.expectedTierCounts`, expected.expectedTierCounts, actual.expectedTierCounts, differences);
  compareValue(`${path}.branchCount`, expected.branches.length, actual.branches.length, differences);

  expected.branches.forEach((branch, index) => {
    const actualBranch = actual.branches[index];
    const branchPath = `${path}.branches[${index}]`;
    if (!actualBranch) return;

    compareValue(`${branchPath}.labelKey`, branch.labelKey, actualBranch.labelKey, differences);
    compareValue(`${branchPath}.labelKeys`, branch.labelKeys ?? [], actualBranch.labelKeys ?? [], differences);
    compareValue(`${branchPath}.conditionKey`, branch.conditionKey, actualBranch.conditionKey, differences);
    compareNumber(`${branchPath}.probability`, branch.probability, actualBranch.probability, differences);
    compareValue(`${branchPath}.outcome.gp`, branch.outcome.gp, actualBranch.outcome.gp, differences);
    compareValue(`${branchPath}.outcome.integrity`, branch.outcome.integrity, actualBranch.outcome.integrity, differences);
    compareValue(`${branchPath}.outcome.collectability`, branch.outcome.collectability, actualBranch.outcome.collectability, differences);
    compareNumber(`${branchPath}.outcome.score`, branch.outcome.score, actualBranch.outcome.score, differences);
    compareReward(`${branchPath}.outcome.reward`, branch.outcome.reward, actualBranch.outcome.reward, differences);
    compareValue(`${branchPath}.hasNext`, !!branch.next, !!actualBranch.next, differences);
    if (branch.next && actualBranch.next) {
      comparePolicies(branch.next, actualBranch.next, `${branchPath}.next`, differences, visited);
    }
  });
}

async function comparePoliciesAsync(
  expected: CollectablePolicyNode,
  actual: CollectablePolicyNode,
  path: DiffPath,
  differences: string[],
  visited: Set<string>,
  yieldControl: (progress: CollectablePolicyCodecProgress) => Promise<void>,
  planKind?: CollectablePolicyPlanKind
) {
  const key = `${expected.id}->${actual.id}`;
  if (visited.has(key)) return;
  visited.add(key);
  await yieldControl({
    phase: 'compare',
    planKind,
    visitedNodes: visited.size
  });

  compareValue(`${path}.state`, expected.state, actual.state, differences);
  compareValue(`${path}.action`, expected.recommendedAction, actual.recommendedAction, differences);
  compareNumber(`${path}.expectedScore`, expected.expectedScore, actual.expectedScore, differences);
  compareReward(`${path}.expectedReward`, expected.expectedReward, actual.expectedReward, differences);
  compareTierCounts(`${path}.expectedTierCounts`, expected.expectedTierCounts, actual.expectedTierCounts, differences);
  compareValue(`${path}.branchCount`, expected.branches.length, actual.branches.length, differences);

  for (let index = 0; index < expected.branches.length; index += 1) {
    const branch = expected.branches[index];
    const actualBranch = actual.branches[index];
    const branchPath = `${path}.branches[${index}]`;
    if (!actualBranch) continue;

    compareValue(`${branchPath}.labelKey`, branch.labelKey, actualBranch.labelKey, differences);
    compareValue(`${branchPath}.labelKeys`, branch.labelKeys ?? [], actualBranch.labelKeys ?? [], differences);
    compareValue(`${branchPath}.conditionKey`, branch.conditionKey, actualBranch.conditionKey, differences);
    compareNumber(`${branchPath}.probability`, branch.probability, actualBranch.probability, differences);
    compareValue(`${branchPath}.outcome.gp`, branch.outcome.gp, actualBranch.outcome.gp, differences);
    compareValue(`${branchPath}.outcome.integrity`, branch.outcome.integrity, actualBranch.outcome.integrity, differences);
    compareValue(`${branchPath}.outcome.collectability`, branch.outcome.collectability, actualBranch.outcome.collectability, differences);
    compareNumber(`${branchPath}.outcome.score`, branch.outcome.score, actualBranch.outcome.score, differences);
    compareReward(`${branchPath}.outcome.reward`, branch.outcome.reward, actualBranch.outcome.reward, differences);
    compareValue(`${branchPath}.hasNext`, !!branch.next, !!actualBranch.next, differences);
    if (branch.next && actualBranch.next) {
      await comparePoliciesAsync(branch.next, actualBranch.next, `${branchPath}.next`, differences, visited, yieldControl, planKind);
    }
  }
}

function createYieldControl(options: CollectablePolicyCodecAsyncOptions) {
  const yieldEvery = Math.max(1, options.yieldEvery ?? DEFAULT_YIELD_EVERY);
  let counter = 0;

  return async (progress: CollectablePolicyCodecProgress) => {
    counter += 1;
    if (counter % yieldEvery !== 0) return;

    options.onProgress?.(progress);
    await (options.yieldToEventLoop ?? yieldToEventLoop)();
  };
}

function yieldToEventLoop() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

function compareValue(path: string, expected: unknown, actual: unknown, differences: string[]) {
  if (JSON.stringify(expected) === JSON.stringify(actual)) return;
  differences.push(`${path}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function compareNumber(path: string, expected: number, actual: number, differences: string[]) {
  if (Math.abs(expected - actual) <= 0.000001) return;
  differences.push(`${path}: expected ${expected}, got ${actual}`);
}

function compareReward(path: string, expected: CollectableRewardVector, actual: CollectableRewardVector, differences: string[]) {
  compareNumber(`${path}.exp`, expected.exp, actual.exp, differences);
  compareNumber(`${path}.gil`, expected.gil, actual.gil, differences);
  compareNumber(`${path}.scrip`, expected.scrip, actual.scrip, differences);
  compareValue(`${path}.items`, expected.items, actual.items, differences);
}

function compareTierCounts(path: string, expected: CollectableTierCounts, actual: CollectableTierCounts, differences: string[]) {
  compareNumber(`${path}.none`, expected.none, actual.none, differences);
  compareNumber(`${path}.low`, expected.low, actual.low, differences);
  compareNumber(`${path}.mid`, expected.mid, actual.mid, differences);
  compareNumber(`${path}.high`, expected.high, actual.high, differences);
}
