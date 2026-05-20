import {
  addCollectableTierCounts,
  createZeroTierCounts,
  getCollectableTierCountForValue,
  scoreCollectability
} from './collectableMath';
import type { CollectableObjective, CollectableRewardTable, CollectableTierCounts } from '../types/collectable';
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
  expectedTierCounts: CollectableTierCounts;
  minScoreTierCounts: CollectableTierCounts;
  maxScoreTierCounts: CollectableTierCounts;
  outcomeDistribution: CollectableStrategyScoreDistributionEntry[];
}

const COLLECT_SUCCESS_LABEL = 'collectableSolver.branches.collectSuccess';

export function analyzeCollectableStrategyTree(
  root: CollectableStrategyNode,
  rewardTable: CollectableRewardTable,
  objective: CollectableObjective
): CollectableStrategyAnalysis {
  const outcomes = scoreNode(root, rewardTable, objective, new Map());
  const details = scoreNodeDetails(root, rewardTable, objective, new Map());
  const scores = [...outcomes.keys()].sort((left, right) => left - right);
  const minScore = scores[0] ?? 0;
  const maxScore = scores[scores.length - 1] ?? 0;

  return {
    expectedScore: roundScore(expectedValue(outcomes)),
    minScore,
    maxScore,
    minScoreChance: (outcomes.get(minScore) ?? 0) * 100,
    maxScoreChance: (outcomes.get(maxScore) ?? 0) * 100,
    expectedTierCounts: expectedTierCounts(details),
    minScoreTierCounts: representativeTierCountsForScore(details, minScore, 'min'),
    maxScoreTierCounts: representativeTierCountsForScore(details, maxScore, 'max'),
    outcomeDistribution: scores.map((score) => ({
      score,
      probability: (outcomes.get(score) ?? 0) * 100
    }))
  };
}

type OutcomeDetail = {
  score: number;
  probability: number;
  tierCounts: CollectableTierCounts;
};

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

  return scoreCollectability(node.state.collectability, rewardTable, objective);
}

function scoreNodeDetails(
  node: CollectableStrategyNode,
  rewardTable: CollectableRewardTable,
  objective: CollectableObjective,
  memo: Map<string, Map<string, OutcomeDetail>>
): Map<string, OutcomeDetail> {
  const cached = memo.get(node.id);
  if (cached) return cached;

  if (node.status !== 'decided' || !node.action || node.branches.length === 0) {
    const tierCounts = createZeroTierCounts();
    const terminal = new Map([[outcomeDetailKey(0, tierCounts), { score: 0, probability: 1, tierCounts }]]);
    memo.set(node.id, terminal);
    return terminal;
  }

  const details = new Map<string, OutcomeDetail>();
  memo.set(node.id, details);

  node.branches.forEach((branch) => {
    const branchProbability = branch.probability / 100;
    const immediateScore = scoreImmediateBranch(node, branch, rewardTable, objective);
    const immediateTierCounts = isSuccessfulCollect(node, branch)
      ? getCollectableTierCountForValue(node.state.collectability, rewardTable)
      : createZeroTierCounts();
    const childDetails = branch.child
      ? scoreNodeDetails(branch.child, rewardTable, objective, memo)
      : new Map([[outcomeDetailKey(0, createZeroTierCounts()), {
          score: 0,
          probability: 1,
          tierCounts: createZeroTierCounts()
        }]]);

    childDetails.forEach((child) => {
      const score = immediateScore + child.score;
      const tierCounts = addCollectableTierCounts(immediateTierCounts, child.tierCounts);
      const key = outcomeDetailKey(score, tierCounts);
      const current = details.get(key);
      details.set(key, {
        score,
        probability: (current?.probability ?? 0) + branchProbability * child.probability,
        tierCounts
      });
    });
  });

  return details;
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

function expectedTierCounts(details: Map<string, OutcomeDetail>) {
  let counts = createZeroTierCounts();
  details.forEach((detail) => {
    counts = addCollectableTierCounts(counts, detail.tierCounts, detail.probability);
  });
  return counts;
}

function representativeTierCountsForScore(
  details: Map<string, OutcomeDetail>,
  score: number,
  direction: 'min' | 'max'
) {
  const matches = [...details.values()].filter((detail) => detail.score === score);
  if (matches.length === 0) return createZeroTierCounts();

  return matches.sort((left, right) => {
    if (right.probability !== left.probability) return right.probability - left.probability;
    const highDiff = direction === 'max'
      ? right.tierCounts.high - left.tierCounts.high
      : left.tierCounts.high - right.tierCounts.high;
    if (highDiff !== 0) return highDiff;
    const midDiff = direction === 'max'
      ? right.tierCounts.mid - left.tierCounts.mid
      : left.tierCounts.mid - right.tierCounts.mid;
    if (midDiff !== 0) return midDiff;
    return direction === 'max'
      ? right.tierCounts.low - left.tierCounts.low
      : left.tierCounts.low - right.tierCounts.low;
  })[0].tierCounts;
}

function outcomeDetailKey(score: number, tierCounts: CollectableTierCounts) {
  return [score, tierCounts.none, tierCounts.low, tierCounts.mid, tierCounts.high].join('|');
}

function roundScore(score: number) {
  return Number(score.toFixed(2));
}
