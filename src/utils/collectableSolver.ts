/**
 * 收藏品採集求解器
 *
 * 以 DP + memoization 輸出 policy tree（CollectablePolicyNode）。
 * Phase 1 技能：Scour / Meticulous / Scrutiny / Collector's Focus / Priming Touch / Collect
 * 排除：Brazen / High Standard / Aetherial Reduction
 *
 * 公式來源：.agents/skills/business/collectable_solver_v1_implementation.md
 */

import type {
  CollectableSearchState,
  CollectablePolicyNode,
  CollectablePolicyBranch,
  CollectableSolverRequest,
  CollectableSolverResult,
  CollectableRewardThreshold,
  CollectableActionType,
  CollectableRewardTier,
  CollectableFormulaDebugInfo,
  CollectableDebugInfo
} from '../types/collectable';
import { STANDARD_PROC_RATES } from '../types/collectable';
import {
  computeScourValue,
  computeValueIncreaseRate,
  computeCollectorsFocusRate,
  computeMeticulousNoDurRate,
  computePrimingTouchRate,
  computeScrutinyMultiplier,
  computeScourOutcome,
  computeMeticulousOutcome,
  computeAllParams
} from './collectableMath';
import { calculateSuccessRate } from './gatheringMath';

// ─── 常數 ─────────────────────────────────────────────────────────────────────

const MAX_COLLECTABILITY = 1000;
const EV_EPSILON = 1e-8;
const MIN_BRANCH_PROBABILITY = 0.0001; // 裁剪機率極小的分支（< 0.01%）

// ─── 求解器內部型別 ───────────────────────────────────────────────────────────

interface SolverCtx {
  thresholds: CollectableRewardThreshold;
  standardProcRate: number;    // 整數百分比 (0-100)
  successRate: number;         // 整數百分比 (0-100)
  scourValue: number;
  valueIncreaseRate: number;
  collectorsFocusRate: number;
  meticulousNoDurRate: number;
  primingTouchRate: number;
  scrutinyMultiplier: number;
  memo: Map<string, CollectablePolicyNode>;
  statesExplored: number;
  memoHits: number;
}

interface EvaluatedAction {
  action: CollectableActionType;
  gpCost: number;
  expectedScrip: number;
  expectedCollectability: number;
  branches: CollectablePolicyBranch[];
}

// ─── Node ID ─────────────────────────────────────────────────────────────────

let _nodeIdCounter = 0;

function nextId(): string {
  return String(_nodeIdCounter++);
}

// ─── 輔助 ─────────────────────────────────────────────────────────────────────

function buildMemoKey(state: CollectableSearchState): string {
  return [
    state.gp,
    state.integrity,
    state.collectability,
    state.scrutinyActive ? 1 : 0,
    state.collectorsFocusActive ? 1 : 0,
    state.primingTouchActive ? 1 : 0,
    state.standardActive ? 1 : 0,
    state.hasUsedCollectableAction ? 1 : 0
  ].join('|');
}

function rewardTier(collectability: number, t: CollectableRewardThreshold): CollectableRewardTier {
  if (t.high > 0 && collectability >= t.high) return 'high';
  if (collectability >= t.mid) return 'mid';
  if (collectability >= t.low) return 'low';
  return 'none';
}

function collectScrip(collectability: number, t: CollectableRewardThreshold, successRate: number): number {
  const tier = rewardTier(collectability, t);
  if (tier === 'none') return 0;
  return (successRate / 100) * t.rewards[tier].scrip;
}

function cap(collectability: number): number {
  return Math.min(MAX_COLLECTABILITY, collectability);
}

/**
 * Standard 可否觸發：
 * - 必須已使用過至少一次收藏品技能（hasUsedCollectableAction）
 * - 收藏價值 < 1000
 * - 還有耐久可以繼續
 */
function canStandardProc(
  hasUsedBefore: boolean,
  collectabilityAfter: number,
  integrityAfter: number
): boolean {
  return hasUsedBefore && collectabilityAfter < MAX_COLLECTABILITY && integrityAfter > 0;
}

// ─── Terminal 節點 ────────────────────────────────────────────────────────────

function makeTerminalNode(
  state: CollectableSearchState,
  reason: CollectablePolicyNode['terminalReason'],
  expectedScrip: number
): CollectablePolicyNode {
  return {
    id: nextId(),
    state,
    recommendedAction: 'collect',
    gpCost: 0,
    expectedCollectability: state.collectability,
    expectedScrip,
    branches: [],
    isTerminal: true,
    terminalReason: reason
  };
}

// ─── Collect 動作評估 ─────────────────────────────────────────────────────────

function evaluateCollect(state: CollectableSearchState, ctx: SolverCtx): EvaluatedAction {
  const immediateScrip = collectScrip(state.collectability, ctx.thresholds, ctx.successRate);

  const nextState: CollectableSearchState = {
    gp: state.gp,
    integrity: state.integrity - 1,
    collectability: state.collectability,
    scrutinyActive: false,
    collectorsFocusActive: false,
    primingTouchActive: false,
    standardActive: false,
    hasUsedCollectableAction: true
  };

  const continuationNode = nextState.integrity > 0 ? solve(nextState, ctx) : null;
  const continuationScrip = continuationNode?.expectedScrip ?? 0;
  const continuationCollectability = continuationNode?.expectedCollectability ?? state.collectability;

  const branch: CollectablePolicyBranch = {
    label: 'collect',
    probability: 100,
    collectabilityDelta: 0,
    consumesDurability: true,
    next: continuationNode
  };

  return {
    action: 'collect',
    gpCost: 0,
    expectedScrip: immediateScrip + continuationScrip,
    expectedCollectability: continuationCollectability,
    branches: [branch]
  };
}

// ─── Buff 動作評估（純狀態轉換） ──────────────────────────────────────────────

function evaluateBuff(
  action: CollectableActionType,
  gpCost: number,
  patch: Partial<CollectableSearchState>,
  state: CollectableSearchState,
  ctx: SolverCtx
): EvaluatedAction {
  const nextState: CollectableSearchState = { ...state, ...patch, gp: state.gp - gpCost };
  const nextNode = solve(nextState, ctx);

  const branch: CollectablePolicyBranch = {
    label: 'buffApplied',
    probability: 100,
    collectabilityDelta: 0,
    consumesDurability: false,
    next: nextNode
  };

  return {
    action,
    gpCost,
    expectedScrip: nextNode.expectedScrip,
    expectedCollectability: nextNode.expectedCollectability,
    branches: [branch]
  };
}

// ─── 採集類動作分支建立 ────────────────────────────────────────────────────────

interface BranchSpec {
  probability: number;         // 0–100 浮點百分比
  collectabilityDelta: number;
  integrityDelta: number;      // -1 or 0
  standardProcced: boolean;
  labelKey: string;
}

function buildBranchNodes(
  state: CollectableSearchState,
  action: 'scour' | 'meticulous',
  specs: BranchSpec[],
  ctx: SolverCtx
): { branches: CollectablePolicyBranch[]; expectedScrip: number; expectedCollectability: number } {
  let expectedScrip = 0;
  let expectedCollectability = 0;
  const branches: CollectablePolicyBranch[] = [];

  for (const spec of specs) {
    if (spec.probability < MIN_BRANCH_PROBABILITY) continue;

    const collectabilityAfter = cap(state.collectability + spec.collectabilityDelta);
    const integrityAfter = state.integrity + spec.integrityDelta;

    const nextState: CollectableSearchState = {
      gp: state.gp,
      integrity: integrityAfter,
      collectability: collectabilityAfter,
      // Scrutiny: consumed by both Scour and Meticulous
      scrutinyActive: false,
      // Collector's Focus: consumed by both
      collectorsFocusActive: false,
      // Priming Touch: consumed by Meticulous only (conservative per spec)
      primingTouchActive: action === 'meticulous' ? false : state.primingTouchActive,
      // Standard: consumed by Meticulous; not by Scour (but new proc replaces it)
      standardActive: spec.standardProcced,
      hasUsedCollectableAction: true
    };

    const p = spec.probability / 100;

    if (integrityAfter <= 0) {
      const terminal = makeTerminalNode(nextState, 'no-durability', 0);
      branches.push({
        label: spec.labelKey,
        probability: spec.probability,
        collectabilityDelta: spec.collectabilityDelta,
        consumesDurability: spec.integrityDelta < 0,
        next: terminal
      });
      expectedCollectability += p * collectabilityAfter;
      // expectedScrip += 0 (terminal)
    } else {
      const nextNode = solve(nextState, ctx);
      branches.push({
        label: spec.labelKey,
        probability: spec.probability,
        collectabilityDelta: spec.collectabilityDelta,
        consumesDurability: spec.integrityDelta < 0,
        next: nextNode
      });
      expectedScrip += p * nextNode.expectedScrip;
      expectedCollectability += p * nextNode.expectedCollectability;
    }
  }

  return { branches, expectedScrip, expectedCollectability };
}

// ─── Scour ────────────────────────────────────────────────────────────────────

function evaluateScour(state: CollectableSearchState, ctx: SolverCtx): EvaluatedAction {
  const virFrac = (state.collectorsFocusActive ? ctx.collectorsFocusRate : ctx.valueIncreaseRate) / 100;
  const outcome = computeScourOutcome(ctx.scourValue, state.scrutinyActive, ctx.scrutinyMultiplier);
  const integrityAfter = state.integrity - 1;

  const specs: BranchSpec[] = [];
  for (const valueUp of [true, false]) {
    const delta = valueUp ? outcome.withValueUp : outcome.base;
    const collectabilityAfter = cap(state.collectability + delta);
    const sprFrac = canStandardProc(state.hasUsedCollectableAction, collectabilityAfter, integrityAfter)
      ? ctx.standardProcRate / 100
      : 0;
    const vFrac = valueUp ? virFrac : (1 - virFrac);

    for (const stdProc of [true, false]) {
      const sFrac = stdProc ? sprFrac : (1 - sprFrac);
      const prob = vFrac * sFrac * 100;
      if (prob < MIN_BRANCH_PROBABILITY) continue;

      specs.push({
        probability: prob,
        collectabilityDelta: delta,
        integrityDelta: -1,
        standardProcced: stdProc,
        labelKey: `${valueUp ? 'valueUp' : 'noValueUp'}.${stdProc ? 'standard' : 'noStandard'}`
      });
    }
  }

  const { branches, expectedScrip, expectedCollectability } = buildBranchNodes(state, 'scour', specs, ctx);
  return { action: 'scour', gpCost: 0, expectedScrip, expectedCollectability, branches };
}

// ─── Meticulous ───────────────────────────────────────────────────────────────

function evaluateMeticulous(state: CollectableSearchState, ctx: SolverCtx): EvaluatedAction {
  const virFrac = (state.collectorsFocusActive ? ctx.collectorsFocusRate : ctx.valueIncreaseRate) / 100;
  const metFrac = (state.primingTouchActive ? ctx.primingTouchRate : ctx.meticulousNoDurRate) / 100;
  const outcome = computeMeticulousOutcome(
    ctx.scourValue, state.scrutinyActive, ctx.scrutinyMultiplier, state.standardActive
  );

  const specs: BranchSpec[] = [];
  for (const valueUp of [true, false]) {
    const delta = valueUp ? outcome.withValueUp : outcome.base;
    const vFrac = valueUp ? virFrac : (1 - virFrac);

    for (const durRetained of [true, false]) {
      const dFrac = durRetained ? metFrac : (1 - metFrac);
      const integrityDelta = durRetained ? 0 : -1;
      const integrityAfter = state.integrity + integrityDelta;
      const collectabilityAfter = cap(state.collectability + delta);
      const sprFrac = canStandardProc(state.hasUsedCollectableAction, collectabilityAfter, integrityAfter)
        ? ctx.standardProcRate / 100
        : 0;

      for (const stdProc of [true, false]) {
        const sFrac = stdProc ? sprFrac : (1 - sprFrac);
        const prob = vFrac * dFrac * sFrac * 100;
        if (prob < MIN_BRANCH_PROBABILITY) continue;

        specs.push({
          probability: prob,
          collectabilityDelta: delta,
          integrityDelta,
          standardProcced: stdProc,
          labelKey: [
            valueUp ? 'valueUp' : 'noValueUp',
            durRetained ? 'durRetained' : 'durConsumed',
            stdProc ? 'standard' : 'noStandard'
          ].join('.')
        });
      }
    }
  }

  const { branches, expectedScrip, expectedCollectability } = buildBranchNodes(state, 'meticulous', specs, ctx);
  return { action: 'meticulous', gpCost: 0, expectedScrip, expectedCollectability, branches };
}

// ─── 選擇最優動作 ─────────────────────────────────────────────────────────────

function isBetter(candidate: EvaluatedAction, current: EvaluatedAction): boolean {
  // 主要：期望 scrip 高者優先
  if (candidate.expectedScrip > current.expectedScrip + EV_EPSILON) return true;
  if (candidate.expectedScrip < current.expectedScrip - EV_EPSILON) return false;
  // 次要：GP 消耗少者優先（保守策略）
  if (candidate.gpCost < current.gpCost) return true;
  if (candidate.gpCost > current.gpCost) return false;
  // 三次：優先採集（collect）以減少未來決策深度
  if (candidate.action === 'collect' && current.action !== 'collect') return true;
  return false;
}

// ─── 核心 DP ─────────────────────────────────────────────────────────────────

function solve(state: CollectableSearchState, ctx: SolverCtx): CollectablePolicyNode {
  if (state.integrity <= 0) {
    return makeTerminalNode(state, 'no-durability', 0);
  }

  // 收藏值已達上限：任何採集動作都無法增加報酬，直接採集是最優選擇
  if (state.collectability >= MAX_COLLECTABILITY) {
    const collectAction = evaluateCollect(state, ctx);
    const node: CollectablePolicyNode = {
      id: nextId(),
      state,
      recommendedAction: 'collect',
      gpCost: 0,
      expectedCollectability: collectAction.expectedCollectability,
      expectedScrip: collectAction.expectedScrip,
      branches: collectAction.branches,
      isTerminal: false
    };
    // 不放入 memo（不同 buff 狀態的 collectability=1000 行為相同，
    // 但 id 需唯一；若放入 memo 需確保 key 含 buff 狀態，這裡為安全起見略過）
    return node;
  }

  const key = buildMemoKey(state);
  const memoized = ctx.memo.get(key);
  if (memoized) {
    ctx.memoHits++;
    return memoized;
  }

  ctx.statesExplored++;

  const candidates: EvaluatedAction[] = [];

  // ── Buff 動作 ──
  // Scrutiny (-200 GP)
  if (state.gp >= 200 && !state.scrutinyActive) {
    candidates.push(evaluateBuff('scrutiny', 200, { scrutinyActive: true }, state, ctx));
  }

  // Collector's Focus (-100 GP)
  if (state.gp >= 100 && !state.collectorsFocusActive) {
    candidates.push(evaluateBuff('collectors-focus', 100, { collectorsFocusActive: true }, state, ctx));
  }

  // Priming Touch (-100 GP)
  if (state.gp >= 100 && !state.primingTouchActive) {
    candidates.push(evaluateBuff('priming-touch', 100, { primingTouchActive: true }, state, ctx));
  }

  // ── 採集動作 ──
  candidates.push(evaluateScour(state, ctx));
  candidates.push(evaluateMeticulous(state, ctx));
  candidates.push(evaluateCollect(state, ctx));

  // 選出最優動作
  let best = candidates[0];
  for (let i = 1; i < candidates.length; i++) {
    if (isBetter(candidates[i], best)) best = candidates[i];
  }

  const node: CollectablePolicyNode = {
    id: nextId(),
    state,
    recommendedAction: best.action,
    gpCost: best.gpCost,
    expectedCollectability: best.expectedCollectability,
    expectedScrip: best.expectedScrip,
    branches: best.branches,
    isTerminal: false
  };

  ctx.memo.set(key, node);
  return node;
}

// ─── 公開入口 ─────────────────────────────────────────────────────────────────

export function solveCollectable(request: CollectableSolverRequest): CollectableSolverResult {
  _nodeIdCounter = 0;

  const { stats, baseValues, itemLevel, integrity, rewardThresholds, nodeType, debugMode = false } = request;

  const successRate = calculateSuccessRate(
    stats.gathering,
    baseValues.Gathering,
    stats.level,
    itemLevel
  );

  const scourValue = computeScourValue(stats.gathering, baseValues.Gathering);
  const virRate = computeValueIncreaseRate(stats.gathering, baseValues.Gathering);
  const focusRate = computeCollectorsFocusRate(virRate);
  const metRate = computeMeticulousNoDurRate(stats.gathering, baseValues.Gathering);
  const primeRate = computePrimingTouchRate(metRate);
  const scrMultiplier = computeScrutinyMultiplier(stats.perception, baseValues.Perception);
  const standardProcRate = STANDARD_PROC_RATES[nodeType];

  const ctx: SolverCtx = {
    thresholds: rewardThresholds,
    standardProcRate,
    successRate,
    scourValue,
    valueIncreaseRate: virRate,
    collectorsFocusRate: focusRate,
    meticulousNoDurRate: metRate,
    primingTouchRate: primeRate,
    scrutinyMultiplier: scrMultiplier,
    memo: new Map(),
    statesExplored: 0,
    memoHits: 0
  };

  const initialState: CollectableSearchState = {
    gp: stats.gp,
    integrity,
    collectability: 0,
    scrutinyActive: false,
    collectorsFocusActive: false,
    primingTouchActive: false,
    standardActive: false,
    hasUsedCollectableAction: false
  };

  const policy = solve(initialState, ctx);

  // 計算報酬層次機率（簡化：以 expectedScrip 推算）
  const maxScrip = (() => {
    const t = rewardThresholds;
    if (t.high > 0) return (successRate / 100) * t.rewards.high.scrip;
    return (successRate / 100) * t.rewards.mid.scrip;
  })();
  const highFrac = maxScrip > 0 ? Math.min(1, policy.expectedScrip / maxScrip) : 0;
  const rewardTierProbabilities = {
    high: Math.round(highFrac * 100),
    mid: Math.round((1 - highFrac) * 60),
    low: Math.round((1 - highFrac) * 40),
    none: 0
  };

  let debug: CollectableDebugInfo | undefined;
  if (debugMode) {
    const allParams = computeAllParams(
      stats.gathering, baseValues.Gathering,
      stats.perception, baseValues.Perception
    );
    const formulas: CollectableFormulaDebugInfo = {
      ...allParams
    };
    debug = {
      playerStats: stats,
      baseStats: { baseGathering: baseValues.Gathering, basePerception: baseValues.Perception },
      formulas,
      rewardThresholds,
      standardProcRate,
      statesExplored: ctx.statesExplored,
      memoHits: ctx.memoHits
    };
  }

  return {
    expectedScrip: policy.expectedScrip,
    expectedCollectability: policy.expectedCollectability,
    rewardTierProbabilities,
    policy,
    debug
  };
}
