import {
  getCollectableRewardForValue,
  scoreCollectableReward
} from './collectableMath';
import type { CollectableObjective, CollectableRewardTable } from '../types/collectable';
import type { CollectableStrategyNode } from './collectableStrategyTree';

export interface CollectableStrategyScoreDistributionEntry {
  score: number;
  probability: number;
}

export interface CollectableStrategyAnalysis {
  expectedScore: number;
  minScore: number;
  maxScore: number;
  minScoreChance: number;
  maxScoreChance: number;
  outcomeDistribution: CollectableStrategyScoreDistributionEntry[];
}

const COLLECT_SUCCESS_LABEL = 'collectableSolver.branches.collectSuccess';

export function analyzeCollectableStrategyTree(
  root: CollectableStrategyNode,
  rewardTable: CollectableRewardTable,
  objective: CollectableObjective
): CollectableStrategyAnalysis {
  const outcomes = scoreNode(root, rewardTable, objective, new Map());
  const scores = [...outcomes.keys()].sort((left, right) => left - right);
  const minScore = scores[0] ?? 0;
  const maxScore = scores[scores.length - 1] ?? 0;

  return {
    expectedScore: roundScore(expectedValue(outcomes)),
    minScore,
    maxScore,
    minScoreChance: (outcomes.get(minScore) ?? 0) * 100,
    maxScoreChance: (outcomes.get(maxScore) ?? 0) * 100,
    outcomeDistribution: scores.map((score) => ({
      score,
      probability: (outcomes.get(score) ?? 0) * 100
    }))
  };
}

function scoreNode(
  node: CollectableStrategyNode,
  rewardTable: CollectableRewardTable,
  objective: CollectableObjective,
  memo: Map<string, Map<number, number>>
): Map<number, number> {
  const cached = memo.get(node.id);
  if (cached) return cached;

  if (node.status !== 'decided' || !node.action || node.branches.length === 0) {
    const terminal = new Map([[0, 1]]);
    memo.set(node.id, terminal);
    return terminal;
  }

  const outcomes = new Map<number, number>();
  memo.set(node.id, outcomes);

  node.branches.forEach((branch) => {
    const branchProbability = branch.probability / 100;
    const immediateScore = scoreImmediateBranch(node, branch, rewardTable, objective);
    const childOutcomes = branch.child
      ? scoreNode(branch.child, rewardTable, objective, memo)
      : new Map([[0, 1]]);

    childOutcomes.forEach((childProbability, childScore) => {
      const totalScore = immediateScore + childScore;
      outcomes.set(totalScore, (outcomes.get(totalScore) ?? 0) + branchProbability * childProbability);
    });
  });

  return outcomes;
}

function scoreImmediateBranch(
  node: CollectableStrategyNode,
  branch: CollectableStrategyNode['branches'][number],
  rewardTable: CollectableRewardTable,
  objective: CollectableObjective
): number {
  if (!isSuccessfulCollect(node, branch)) {
    return 0;
  }

  return scoreCollectableReward(
    getCollectableRewardForValue(node.state.collectability, rewardTable),
    objective
  );
}

function isSuccessfulCollect(
  node: CollectableStrategyNode,
  branch: CollectableStrategyNode['branches'][number]
) {
  return node.action === 'collect' && branch.labelKeys.includes(COLLECT_SUCCESS_LABEL);
}

function expectedValue(outcomes: Map<number, number>) {
  let total = 0;
  outcomes.forEach((probability, score) => {
    total += score * probability;
  });
  return total;
}

function roundScore(score: number) {
  return Number(score.toFixed(2));
}
