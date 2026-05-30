import type {
  CollectableStrategyBranch,
  CollectableStrategyNode,
  CollectableStrategyTreeResult,
  CollectableStrategyTreeSummary
} from '../../utils/collectableStrategyTree';
import { createCooperativeScheduler, type CooperativeSchedulerOptions } from '../../utils/cooperativeScheduler';
import type { CollectableActionKind } from '../../types/collectable';
import type { GatheringJob, NodeBonuses, PlayerStats } from '../../types/game';
import type {
  FrontierCollectableActionKind,
  FrontierCollectableProbabilityProfile,
  FrontierCollectableState,
  FrontierCollectableStrategyRule
} from './frontierCollectableTypes';
import {
  applyFrontierCollectableAction,
  canUseFrontierCollectableAction,
  createFrontierCollectableContext,
  createInitialFrontierCollectableState,
  frontierCollectableStateKey,
  matchesFrontierCollectableStrategyRule,
  type FrontierCollectableContext
} from './frontierCollectableSimulator';

export interface FrontierCollectableStrategyTreeRequest {
  itemId: number;
  stats: PlayerStats;
  baseValues: {
    Gathering: number;
    Perception: number;
  };
  itemLevel: number;
  nodeBonuses: NodeBonuses;
  temporaryGp: number;
  jobType: GatheringJob;
  isTimedNode: boolean;
  hasRelicToolBonus?: boolean;
  probabilityProfile: FrontierCollectableProbabilityProfile;
  strategy: FrontierCollectableStrategyRule[];
  maxNodes?: number;
  formatActionLabel?: (action: FrontierCollectableActionKind) => string;
  formatBranchLabel?: (labelKeys: string[]) => string;
  formatPathStep?: (payload: { ruleName?: string; actionLabel: string; branchLabel: string; branchLabelKeys: string[] }) => string;
}

interface BuildContext {
  mechanics: FrontierCollectableContext;
  rules: FrontierCollectableStrategyRule[];
  maxNodes: number;
  nodeCache: Map<string, CollectableStrategyNode>;
  limited: boolean;
  summary: CollectableStrategyTreeSummary;
  uncoveredNodes: CollectableStrategyNode[];
  formatActionLabel: (action: FrontierCollectableActionKind) => string;
  formatBranchLabel: (labelKeys: string[]) => string;
  formatPathStep: (payload: { ruleName?: string; actionLabel: string; branchLabel: string; branchLabelKeys: string[] }) => string;
}

interface AsyncBuildContext extends BuildContext {
  scheduler: ReturnType<typeof createCooperativeScheduler>;
}

export async function buildFrontierCollectableStrategyTreeAsync(
  request: FrontierCollectableStrategyTreeRequest,
  options: CooperativeSchedulerOptions = {}
): Promise<CollectableStrategyTreeResult> {
  const scheduler = createCooperativeScheduler(options);
  const context: AsyncBuildContext = {
    mechanics: createFrontierCollectableContext(request),
    rules: request.strategy.filter((rule) => rule.enabled),
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
    formatActionLabel: request.formatActionLabel ?? ((action) => action),
    formatBranchLabel: request.formatBranchLabel ?? ((labelKeys) => labelKeys.join(' / ')),
    formatPathStep: request.formatPathStep ?? defaultPathStep,
    scheduler
  };
  await scheduler.yieldNow();
  const rootState = createInitialFrontierCollectableState(context.mechanics, request.temporaryGp);
  const root = await expandNodeAsync(rootState, [], [], context);

  return {
    root,
    summary: context.summary,
    uncoveredNodes: context.uncoveredNodes,
    limited: context.limited
  };
}

function expandNodeAsync(
  state: FrontierCollectableState,
  path: string[],
  pendingActions: FrontierCollectableActionKind[],
  context: AsyncBuildContext
): Promise<CollectableStrategyNode> {
  return expandNodeAsyncInner(state, path, pendingActions, context);
}

async function expandNodeAsyncInner(
  state: FrontierCollectableState,
  path: string[],
  pendingActions: FrontierCollectableActionKind[],
  context: AsyncBuildContext
): Promise<CollectableStrategyNode> {
  await context.scheduler.step();

  const decisionKey = `${frontierCollectableStateKey(state)}|${pendingActions.join(',')}`;
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

  const pendingAction = pendingActions.find((action) => canUseFrontierCollectableAction(action, state, context.mechanics));
  if (pendingAction) {
    const nextPending = pendingActions.slice(pendingActions.indexOf(pendingAction) + 1);
    const node = createNode(state, path, 'decided', nextPending, undefined, undefined, pendingAction);
    context.nodeCache.set(decisionKey, node);
    context.summary.decidedNodes += 1;
    node.branches = await expandBranches(pendingAction, state, path, nextPending, context);
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
  node.branches = await expandBranches(action, state, path, nextPending, context, matchedRule.name);
  return node;
}

async function expandBranches(
  action: FrontierCollectableActionKind,
  state: FrontierCollectableState,
  path: string[],
  nextPending: FrontierCollectableActionKind[],
  context: AsyncBuildContext,
  ruleName?: string
): Promise<CollectableStrategyBranch[]> {
  const branches: CollectableStrategyBranch[] = [];

  for (const transition of applyFrontierCollectableAction(action, state, context.mechanics)) {
    await context.scheduler.step();
    const labelKeys = transition.labelKeys ?? [];
    const branchLabel = formatFrontierBranchLabel(transition.label, labelKeys, context);
    branches.push({
      state: toDisplayState(transition.state),
      probability: transition.probability * 100,
      label: branchLabel,
      labelKeys,
      child: await expandNodeAsyncInner(
        transition.state,
        [...path, context.formatPathStep({
          ruleName,
          actionLabel: context.formatActionLabel(action),
          branchLabel,
          branchLabelKeys: labelKeys
        })],
        nextPending,
        context
      )
    });
  }

  return branches;
}

function findExecutableRule(
  rules: FrontierCollectableStrategyRule[],
  state: FrontierCollectableState,
  context: BuildContext
): { rule: FrontierCollectableStrategyRule; action: FrontierCollectableActionKind } | undefined {
  for (const rule of rules) {
    if (!matchesFrontierCollectableStrategyRule(rule, state)) continue;

    const action = rule.actions.find((candidate) => canUseFrontierCollectableAction(candidate, state, context.mechanics));
    if (action) return { rule, action };
  }

  return undefined;
}

function createNode(
  state: FrontierCollectableState,
  path: string[],
  status: CollectableStrategyNode['status'],
  pendingActions: FrontierCollectableActionKind[],
  matchedRuleId?: string,
  matchedRuleName?: string,
  action?: FrontierCollectableActionKind
): CollectableStrategyNode {
  const displayState = toDisplayState(state);

  return {
    id: `${frontierCollectableStateKey(state)}|${pendingActions.join(',')}`,
    state: displayState,
    path,
    status,
    matchedRuleId,
    matchedRuleName,
    action: action as CollectableActionKind,
    pendingActions: pendingActions as CollectableActionKind[],
    branches: []
  };
}

export function toDisplayState(state: FrontierCollectableState) {
  return {
    gp: state.gp,
    integrity: state.integrity,
    collectability: state.collectability,
    scrutinyActive: state.scrutinyActive,
    collectorsFocusActive: state.collectorsFocusActive,
    primingTouchActive: state.primingTouchActive,
    standardActive: state.standardMode !== 'none',
    hasUsedCollectableAction: state.hasUsedCollectableAction,
    hasCollected: state.hasCollected,
    successBonus: state.successBonus,
    successIActive: state.successIActive,
    successIIActive: state.successIIActive,
    successIIIActive: state.successIIIActive,
    nextCollectSuccessBonus: state.nextCollectSuccessBonus,
    wiseToTheWorldActive: state.wiseToTheWorldActive,
    frontierStandardMode: state.standardMode,
    frontierState: { ...state }
  } as any;
}

function formatFrontierBranchLabel(label: string | undefined, labelKeys: string[], context: BuildContext) {
  if (!label) return context.formatBranchLabel(labelKeys);

  return label.split(' / ').map((part) => (
    part.includes('.') ? context.formatBranchLabel([part]) : part
  )).join(' / ');
}

function defaultPathStep(payload: { ruleName?: string; actionLabel: string; branchLabel: string }) {
  return payload.ruleName
    ? `${payload.ruleName} -> ${payload.actionLabel}: ${payload.branchLabel}`
    : `${payload.actionLabel}: ${payload.branchLabel}`;
}
