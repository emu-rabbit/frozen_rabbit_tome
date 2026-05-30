import {
  applyCollectableAction,
  canUseCollectableAction,
  collectableDecisionKey,
  collectableStateKey,
  createCollectableMechanicsContext,
  createInitialCollectableMechanicsState,
  type CollectableMechanicsContext,
  type CollectableMechanicsState
} from './collectableMechanics';
import { createCooperativeScheduler, type CooperativeSchedulerOptions } from './cooperativeScheduler';
import { COLLECTABLE_ACTION_DEFINITIONS } from '../services/collectableActions';
import type { CollectableActionKind } from '../types/collectable';
import type { NodeBonuses, PlayerStats } from '../types/game';

export type CollectableStrategyNumericField =
  | 'gp'
  | 'integrity'
  | 'collectability'
  | 'successBonus'
  | 'nextCollectSuccessBonus';

export type CollectableStrategyBooleanField =
  | 'scrutinyActive'
  | 'collectorsFocusActive'
  | 'primingTouchActive'
  | 'standardActive'
  | 'highStandardActive'
  | 'anyStandardActive'
  | 'hasUsedCollectableAction'
  | 'hasCollected'
  | 'successIActive'
  | 'successIIActive'
  | 'successIIIActive'
  | 'wiseToTheWorldActive';

export type CollectableStrategyField = CollectableStrategyNumericField | CollectableStrategyBooleanField;
export type CollectableStrategyComparator = '<' | '<=' | '=' | '>=' | '>';
export type CollectableStrategyConditionMode = 'all' | 'any';

export interface CollectableStrategyCondition {
  id: string;
  field: CollectableStrategyField;
  comparator: CollectableStrategyComparator;
  value: number | boolean;
}

export interface CollectableStrategyRule {
  id: string;
  name: string;
  mode: CollectableStrategyConditionMode;
  conditions: CollectableStrategyCondition[];
  actions: CollectableActionKind[];
  enabled: boolean;
}

export type CollectableExperimentState = CollectableMechanicsState;

export interface CollectableStrategyBranch {
  label: string;
  labelKeys: string[];
  probability: number;
  state: CollectableExperimentState;
  child?: CollectableStrategyNode;
}

export interface CollectableStrategyNode {
  id: string;
  state: CollectableExperimentState;
  path: string[];
  status: 'decided' | 'uncovered' | 'terminal' | 'limited';
  matchedRuleId?: string;
  matchedRuleName?: string;
  action?: CollectableActionKind;
  pendingActions: CollectableActionKind[];
  branches: CollectableStrategyBranch[];
}

export interface CollectableStrategyTreeSummary {
  totalNodes: number;
  decidedNodes: number;
  uncoveredNodes: number;
  terminalNodes: number;
  limitedNodes: number;
  maxDepth: number;
}

export interface CollectableStrategyTreeResult {
  root: CollectableStrategyNode;
  summary: CollectableStrategyTreeSummary;
  uncoveredNodes: CollectableStrategyNode[];
  limited: boolean;
}

export interface CollectableStrategyRuleApplicationSummary {
  openStates: CollectableExperimentState[];
  completeBranches: number;
  totalBranches: number;
  limited: boolean;
}

export interface CollectableStrategyBuildRequest {
  stats: PlayerStats;
  baseValues: {
    Gathering: number;
    Perception: number;
  };
  itemLevel: number;
  nodeBonuses: NodeBonuses;
  temporaryGp: number;
  jobType: 'miner' | 'botanist';
  isTimedNode: boolean;
  hasRelicToolBonus?: boolean;
  rules: CollectableStrategyRule[];
  maxNodes?: number;
  formatActionLabel?: (action: CollectableActionKind) => string;
  formatBranchLabel?: (labelKeys: string[]) => string;
  formatPathStep?: (payload: { ruleName?: string; actionLabel: string; branchLabel: string; branchLabelKeys: string[] }) => string;
}

interface BuildContext {
  mechanics: CollectableMechanicsContext;
  rules: CollectableStrategyRule[];
  maxNodes: number;
  nodeCache: Map<string, CollectableStrategyNode>;
  limited: boolean;
  summary: CollectableStrategyTreeSummary;
  uncoveredNodes: CollectableStrategyNode[];
  formatActionLabel: (action: CollectableActionKind) => string;
  formatBranchLabel: (labelKeys: string[]) => string;
  formatPathStep: (payload: { ruleName?: string; actionLabel: string; branchLabel: string; branchLabelKeys: string[] }) => string;
}

interface AsyncBuildContext extends BuildContext {
  scheduler: ReturnType<typeof createCooperativeScheduler>;
}

export const collectableStrategyNumericFields: CollectableStrategyNumericField[] = [
  'gp',
  'integrity',
  'collectability',
  'successBonus',
  'nextCollectSuccessBonus'
];

export const collectableStrategyBooleanFields: CollectableStrategyBooleanField[] = [
  'scrutinyActive',
  'collectorsFocusActive',
  'primingTouchActive',
  'standardActive',
  'highStandardActive',
  'anyStandardActive',
  'hasUsedCollectableAction',
  'hasCollected',
  'successIActive',
  'successIIActive',
  'successIIIActive',
  'wiseToTheWorldActive'
];

export const collectableStrategyFields: CollectableStrategyField[] = [
  'collectability',
  'integrity',
  'gp',
  'scrutinyActive',
  'collectorsFocusActive',
  'primingTouchActive',
  'standardActive',
  'wiseToTheWorldActive',
  'successIActive',
  'successIIActive',
  'successIIIActive',
  'successBonus',
  'nextCollectSuccessBonus',
  'hasUsedCollectableAction',
  'hasCollected'
];

export const collectableStrategyActionKinds: CollectableActionKind[] = [
  'collect',
  'scour',
  'meticulous',
  'scrutiny',
  'collectorsFocus',
  'primingTouch',
  'successI',
  'successII',
  'successIII',
  'nextCollectSuccess',
  'restoreIntegrity',
  'wiseToTheWorld'
];

export function createDefaultCollectableStrategyRules(): CollectableStrategyRule[] {
  return [];
}

export function createSimpleCollectableStrategyRules(payload: {
  highTierCollectability: number;
  improveName: string;
  collectName: string;
}): CollectableStrategyRule[] {
  return [
    {
      id: 'simple-improve-value',
      name: payload.improveName,
      mode: 'all',
      enabled: true,
      conditions: [
        {
          id: 'simple-improve-value-condition',
          field: 'collectability',
          comparator: '<',
          value: payload.highTierCollectability
        }
      ],
      actions: ['meticulous']
    },
    {
      id: 'simple-collect',
      name: payload.collectName,
      mode: 'all',
      enabled: true,
      conditions: [
        {
          id: 'simple-collect-condition',
          field: 'collectability',
          comparator: '>=',
          value: payload.highTierCollectability
        }
      ],
      actions: ['collect']
    }
  ];
}

export function buildCollectableStrategyTree(request: CollectableStrategyBuildRequest): CollectableStrategyTreeResult {
  const mechanics = createCollectableMechanicsContext(request);
  const context: BuildContext = {
    mechanics,
    rules: request.rules.filter((rule) => rule.enabled),
    maxNodes: request.maxNodes ?? 1200,
    nodeCache: new Map(),
    limited: false,
    uncoveredNodes: [],
    summary: {
      totalNodes: 0,
      decidedNodes: 0,
      uncoveredNodes: 0,
      terminalNodes: 0,
      limitedNodes: 0,
      maxDepth: 0
    },
    formatActionLabel: request.formatActionLabel ?? defaultActionLabel,
    formatBranchLabel: request.formatBranchLabel ?? defaultBranchLabel,
    formatPathStep: request.formatPathStep ?? defaultPathStep
  };
  const rootState = createInitialCollectableMechanicsState(mechanics, request.temporaryGp);
  const root = expandNode(rootState, [], [], context);

  return {
    root,
    summary: context.summary,
    uncoveredNodes: context.uncoveredNodes,
    limited: context.limited
  };
}

export function isNumericStrategyField(field: CollectableStrategyField): field is CollectableStrategyNumericField {
  return collectableStrategyNumericFields.includes(field as CollectableStrategyNumericField);
}

export function collectMatchingUncoveredStrategyNodes(
  nodes: CollectableStrategyNode[],
  rule: CollectableStrategyRule | null | undefined
): CollectableStrategyNode[] {
  if (!rule?.enabled) return [];
  return nodes.filter((node) => node.status === 'uncovered' && matchesRule(rule, node.state));
}

export function summarizeAppliedRuleOutcome(
  nodes: CollectableStrategyNode[],
  rule: CollectableStrategyRule | null | undefined,
  mechanics: CollectableMechanicsContext | null | undefined
): CollectableStrategyRuleApplicationSummary {
  if (!rule?.enabled || !mechanics) {
    return {
      openStates: [],
      completeBranches: 0,
      totalBranches: 0,
      limited: false
    };
  }

  const matchedNodes = collectMatchingUncoveredStrategyNodes(nodes, rule);
  const endpointStates = matchedNodes.flatMap((node) => (
    applyRuleUntilUnmanaged(node.state, rule, mechanics)
  ));

  return {
    openStates: uniqueCollectableStates(endpointStates.filter((state) => state.integrity > 0)),
    completeBranches: endpointStates.filter((state) => state.integrity <= 0).length,
    totalBranches: endpointStates.length,
    limited: false
  };
}

export async function buildCollectableStrategyTreeAsync(
  request: CollectableStrategyBuildRequest,
  options: CooperativeSchedulerOptions = {}
): Promise<CollectableStrategyTreeResult> {
  const mechanics = createCollectableMechanicsContext(request);
  const scheduler = createCooperativeScheduler(options);
  const context: AsyncBuildContext = {
    mechanics,
    rules: request.rules.filter((rule) => rule.enabled),
    maxNodes: request.maxNodes ?? 1200,
    nodeCache: new Map(),
    limited: false,
    uncoveredNodes: [],
    summary: {
      totalNodes: 0,
      decidedNodes: 0,
      uncoveredNodes: 0,
      terminalNodes: 0,
      limitedNodes: 0,
      maxDepth: 0
    },
    formatActionLabel: request.formatActionLabel ?? defaultActionLabel,
    formatBranchLabel: request.formatBranchLabel ?? defaultBranchLabel,
    formatPathStep: request.formatPathStep ?? defaultPathStep,
    scheduler
  };
  await scheduler.yieldNow();
  const rootState = createInitialCollectableMechanicsState(mechanics, request.temporaryGp);
  const root = await expandNodeAsync(rootState, [], [], context);

  return {
    root,
    summary: context.summary,
    uncoveredNodes: context.uncoveredNodes,
    limited: context.limited
  };
}

function expandNode(
  state: CollectableExperimentState,
  path: string[],
  pendingActions: CollectableActionKind[],
  context: BuildContext
): CollectableStrategyNode {
  const decisionKey = collectableDecisionKey(state, pendingActions);
  const cached = context.nodeCache.get(decisionKey);
  if (cached) return cached;

  context.summary.totalNodes += 1;
  context.summary.maxDepth = Math.max(context.summary.maxDepth, path.length);

  if (context.summary.totalNodes > context.maxNodes) {
    context.limited = true;
    context.summary.limitedNodes += 1;
    const node = createNode(state, path, 'limited', pendingActions);
    context.nodeCache.set(decisionKey, node);
    return node;
  }

  if (state.integrity <= 0) {
    context.summary.terminalNodes += 1;
    const node = createNode(state, path, 'terminal', pendingActions);
    context.nodeCache.set(decisionKey, node);
    return node;
  }

  const pendingAction = pendingActions[0];
  if (pendingAction && canUseAction(pendingAction, state, context)) {
    const node = createNode(state, path, 'decided', pendingActions.slice(1), undefined, undefined, pendingAction);
    context.nodeCache.set(decisionKey, node);
    context.summary.decidedNodes += 1;
    node.branches = applyAction(pendingAction, state, context).map((branch) => ({
      ...branch,
      child: expandNode(
        branch.state,
        [...path, context.formatPathStep({ actionLabel: context.formatActionLabel(pendingAction), branchLabel: branch.label, branchLabelKeys: branch.labelKeys })],
        pendingActions.slice(1),
        context
      )
    }));
    return node;
  }

  const executableMatch = findExecutableRule(context.rules, state, context);
  const matchedRule = executableMatch?.rule;
  const action = executableMatch?.action;

  if (!matchedRule || !action) {
    const node = createNode(state, path, 'uncovered', [], matchedRule?.id, matchedRule?.name);
    context.nodeCache.set(decisionKey, node);
    context.summary.uncoveredNodes += 1;
    context.uncoveredNodes.push(node);
    return node;
  }

  const nextPending = matchedRule.actions.slice(matchedRule.actions.indexOf(action) + 1);
  const node = createNode(state, path, 'decided', nextPending, matchedRule.id, matchedRule.name, action);
  context.nodeCache.set(decisionKey, node);
  context.summary.decidedNodes += 1;
  node.branches = applyAction(action, state, context).map((branch) => ({
    ...branch,
    child: expandNode(
      branch.state,
      [...path, context.formatPathStep({ ruleName: matchedRule.name, actionLabel: context.formatActionLabel(action), branchLabel: branch.label, branchLabelKeys: branch.labelKeys })],
      nextPending,
      context
    )
  }));

  return node;
}

async function expandNodeAsync(
  state: CollectableExperimentState,
  path: string[],
  pendingActions: CollectableActionKind[],
  context: AsyncBuildContext
): Promise<CollectableStrategyNode> {
  await context.scheduler.step();

  const decisionKey = collectableDecisionKey(state, pendingActions);
  const cached = context.nodeCache.get(decisionKey);
  if (cached) return cached;

  context.summary.totalNodes += 1;
  context.summary.maxDepth = Math.max(context.summary.maxDepth, path.length);

  if (context.summary.totalNodes > context.maxNodes) {
    context.limited = true;
    context.summary.limitedNodes += 1;
    const node = createNode(state, path, 'limited', pendingActions);
    context.nodeCache.set(decisionKey, node);
    return node;
  }

  if (state.integrity <= 0) {
    context.summary.terminalNodes += 1;
    const node = createNode(state, path, 'terminal', pendingActions);
    context.nodeCache.set(decisionKey, node);
    return node;
  }

  const pendingAction = pendingActions[0];
  if (pendingAction && canUseAction(pendingAction, state, context)) {
    const node = createNode(state, path, 'decided', pendingActions.slice(1), undefined, undefined, pendingAction);
    context.nodeCache.set(decisionKey, node);
    context.summary.decidedNodes += 1;
    const branches: CollectableStrategyBranch[] = [];
    for (const branch of applyAction(pendingAction, state, context)) {
      await context.scheduler.step();
      branches.push({
        ...branch,
        child: await expandNodeAsync(
          branch.state,
          [...path, context.formatPathStep({ actionLabel: context.formatActionLabel(pendingAction), branchLabel: branch.label, branchLabelKeys: branch.labelKeys })],
          pendingActions.slice(1),
          context
        )
      });
    }
    node.branches = branches;
    return node;
  }

  const executableMatch = findExecutableRule(context.rules, state, context);
  const matchedRule = executableMatch?.rule;
  const action = executableMatch?.action;

  if (!matchedRule || !action) {
    const node = createNode(state, path, 'uncovered', [], matchedRule?.id, matchedRule?.name);
    context.nodeCache.set(decisionKey, node);
    context.summary.uncoveredNodes += 1;
    context.uncoveredNodes.push(node);
    return node;
  }

  const nextPending = matchedRule.actions.slice(matchedRule.actions.indexOf(action) + 1);
  const node = createNode(state, path, 'decided', nextPending, matchedRule.id, matchedRule.name, action);
  context.nodeCache.set(decisionKey, node);
  context.summary.decidedNodes += 1;
  const branches: CollectableStrategyBranch[] = [];
  for (const branch of applyAction(action, state, context)) {
    await context.scheduler.step();
    branches.push({
      ...branch,
      child: await expandNodeAsync(
        branch.state,
        [...path, context.formatPathStep({ ruleName: matchedRule.name, actionLabel: context.formatActionLabel(action), branchLabel: branch.label, branchLabelKeys: branch.labelKeys })],
        nextPending,
        context
      )
    });
  }
  node.branches = branches;

  return node;
}

function createNode(
  state: CollectableExperimentState,
  path: string[],
  status: CollectableStrategyNode['status'],
  pendingActions: CollectableActionKind[],
  matchedRuleId?: string,
  matchedRuleName?: string,
  action?: CollectableActionKind
): CollectableStrategyNode {
  return {
    id: stateKey(state, path.length, pendingActions),
    state: { ...state },
    path,
    status,
    matchedRuleId,
    matchedRuleName,
    action,
    pendingActions,
    branches: []
  };
}

function matchesRule(rule: CollectableStrategyRule, state: CollectableExperimentState): boolean {
  if (rule.conditions.length === 0) return true;
  const results = rule.conditions.map((condition) => matchesCondition(condition, state));
  return rule.mode === 'all' ? results.every(Boolean) : results.some(Boolean);
}

function findExecutableRule(
  rules: CollectableStrategyRule[],
  state: CollectableExperimentState,
  context: BuildContext
): { rule: CollectableStrategyRule; action: CollectableActionKind } | undefined {
  for (const rule of rules) {
    if (!matchesRule(rule, state)) continue;

    const action = rule.actions.find((candidate) => canUseAction(candidate, state, context));
    if (action) return { rule, action };
  }

  return undefined;
}

function matchesCondition(condition: CollectableStrategyCondition, state: CollectableExperimentState): boolean {
  if (condition.field === 'highStandardActive') {
    const active = (state as any).frontierStandardMode === 'highStandard';
    return active === Boolean(condition.value);
  }
  if (condition.field === 'anyStandardActive') {
    const active = state.standardActive;
    return active === Boolean(condition.value);
  }

  const left = state[condition.field];
  if (typeof left === 'boolean') return left === Boolean(condition.value);
  const right = Number(condition.value);
  if (condition.comparator === '<') return left < right;
  if (condition.comparator === '<=') return left <= right;
  if (condition.comparator === '>=') return left >= right;
  if (condition.comparator === '>') return left > right;
  return left === right;
}

function canUseAction(action: CollectableActionKind, state: CollectableExperimentState, context: BuildContext): boolean {
  return canUseCollectableAction(action, state, context.mechanics);
}

function applyAction(
  action: CollectableActionKind,
  state: CollectableExperimentState,
  context: BuildContext
): Array<Omit<CollectableStrategyBranch, 'child'>> {
  return applyCollectableAction(action, state, context.mechanics).map((transition) => ({
    state: transition.state,
    probability: transition.probability * 100,
    label: context.formatBranchLabel(transition.labelKeys ?? [transition.labelKey]),
    labelKeys: transition.labelKeys ?? [transition.labelKey]
  }));
}

function applyRuleActionChain(
  state: CollectableExperimentState,
  actions: CollectableActionKind[],
  mechanics: CollectableMechanicsContext
): CollectableExperimentState[] {
  return actions.reduce<CollectableExperimentState[]>((states, action) => {
    return states.flatMap((currentState) => {
      if (currentState.integrity <= 0) return [currentState];
      if (!canUseCollectableAction(action, currentState, mechanics)) return [currentState];

      return applyCollectableAction(action, currentState, mechanics).map((transition) => transition.state);
    });
  }, [state]);
}

function applyRuleUntilUnmanaged(
  state: CollectableExperimentState,
  rule: CollectableStrategyRule,
  mechanics: CollectableMechanicsContext
): CollectableExperimentState[] {
  const endpoints: CollectableExperimentState[] = [];

  function walk(currentState: CollectableExperimentState) {
    if (currentState.integrity <= 0 || !matchesRule(rule, currentState)) {
      endpoints.push(currentState);
      return;
    }

    const nextStates = applyRuleActionChain(currentState, rule.actions, mechanics);
    const didAdvance = nextStates.some((nextState) => collectableStateKey(nextState) !== collectableStateKey(currentState));
    if (!didAdvance) {
      endpoints.push(currentState);
      return;
    }

    nextStates.forEach(walk);
  }

  walk(state);
  return endpoints;
}

function uniqueCollectableStates(states: CollectableExperimentState[]): CollectableExperimentState[] {
  const seen = new Set<string>();
  const uniqueStates: CollectableExperimentState[] = [];

  states.forEach((state) => {
    const key = collectableStateKey(state);
    if (seen.has(key)) return;
    seen.add(key);
    uniqueStates.push(state);
  });

  return uniqueStates;
}

function stateKey(
  state: CollectableExperimentState,
  _depth: number,
  pendingActions: CollectableActionKind[]
): string {
  return collectableDecisionKey(state, pendingActions);
}

function defaultActionLabel(action: CollectableActionKind): string {
  return COLLECTABLE_ACTION_DEFINITIONS[action].fallbackName instanceof Object
    ? 'Restore Integrity'
    : COLLECTABLE_ACTION_DEFINITIONS[action].fallbackName;
}

function cryptoId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

function defaultPathStep(payload: { ruleName?: string; actionLabel: string; branchLabel: string }) {
  return payload.ruleName
    ? `${payload.ruleName} -> ${payload.actionLabel}: ${payload.branchLabel}`
    : `${payload.actionLabel}: ${payload.branchLabel}`;
}

function defaultBranchLabel(labelKeys: string[]) {
  return labelKeys.map((key) => {
    const label = strategyBranchLabels[key];
    return label ?? key;
  }).join(' / ');
}

const strategyBranchLabels: Record<string, string> = {
  'collectableSolver.branches.applied': 'Applied',
  'collectableSolver.branches.collectSuccess': 'Collect succeeded',
  'collectableSolver.branches.collectFailed': 'Collect failed',
  'collectableSolver.branches.valueNormal': 'No collectability increase',
  'collectableSolver.branches.valueIncreased': 'Collectability increase',
  'collectableSolver.branches.integrityConsumed': 'Integrity consumed',
  'collectableSolver.branches.meticulousSaved': 'Meticulous saved integrity',
  'collectableSolver.branches.meticulousConsumed': 'Meticulous consumed integrity',
  'collectableSolver.branches.standardProc': "Collector's Standard proc",
  'collectableSolver.branches.standardNoProc': "No Collector's Standard",
  'collectableSolver.branches.integrityRestored': 'Integrity restored',
  'collectableSolver.branches.wiseProc': 'Wise to the World proc',
  'collectableSolver.branches.wiseNoProc': 'No Wise to the World'
};
