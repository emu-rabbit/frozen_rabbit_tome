import {
  addCollectableTierCounts,
  createZeroTierCounts,
  getCollectableTierCountForValue,
  scoreCollectability
} from './collectableMath';
import type {
  CollectableObjective,
  CollectableOutcomeDebugEntry,
  CollectablePolicyBranch,
  CollectablePolicyNode,
  CollectableRewardTable,
  CollectableTierCounts
} from '../types/collectable';

type OutcomeDetail = {
  score: number;
  probability: number;
  tierCounts: CollectableTierCounts;
};

const COLLECT_SUCCESS_LABEL = 'collectableSolver.branches.collectSuccess';

export function serializeCollectableDebugOutcomes(
  outcomes: Map<number, number>,
  objective: CollectableObjective,
  options: {
    policy?: CollectablePolicyNode;
    rewardTable?: CollectableRewardTable;
  } = {}
): CollectableOutcomeDebugEntry[] {
  const policy = options.policy;
  const rewardTable = options.rewardTable;
  const shouldShowTierCounts = objective.kind === 'tierScore'
    && objective.presetId !== 'customTier'
    && policy
    && rewardTable;

  if (shouldShowTierCounts) {
    return [...buildPolicyTierDistribution(policy, rewardTable, objective).values()]
      .sort(compareOutcomeDetails)
      .map((detail) => ({
        score: detail.score,
        probability: detail.probability * 100,
        tierCounts: { ...detail.tierCounts }
      }));
  }

  return [...outcomes.entries()]
    .sort(([leftScore], [rightScore]) => leftScore - rightScore)
    .map(([score, probability]) => ({
      score,
      probability: probability * 100
    }));
}

function buildPolicyTierDistribution(
  policy: CollectablePolicyNode,
  rewardTable: CollectableRewardTable,
  objective: CollectableObjective
) {
  const memo = new Map<string, Map<string, OutcomeDetail>>();

  function evaluateNode(node: CollectablePolicyNode): Map<string, OutcomeDetail> {
    const cached = memo.get(node.id);
    if (cached) return cached;

    const details = new Map<string, OutcomeDetail>();
    memo.set(node.id, details);

    if (node.branches.length === 0) {
      addDetail(details, {
        score: 0,
        probability: 1,
        tierCounts: createZeroTierCounts()
      });
      return details;
    }

    node.branches.forEach((branch) => {
      const immediateScore = scoreImmediateBranch(node, branch, rewardTable, objective);
      const immediateTierCounts = tierCountsForBranch(node, branch, rewardTable);
      const childDetails = branch.next ? evaluateNode(branch.next) : terminalDetails();

      childDetails.forEach((child) => {
        addDetail(details, {
          score: immediateScore + child.score,
          probability: (branch.probability / 100) * child.probability,
          tierCounts: addCollectableTierCounts(immediateTierCounts, child.tierCounts)
        });
      });
    });

    return details;
  }

  return evaluateNode(policy);
}

function terminalDetails() {
  const details = new Map<string, OutcomeDetail>();
  addDetail(details, {
    score: 0,
    probability: 1,
    tierCounts: createZeroTierCounts()
  });
  return details;
}

function scoreImmediateBranch(
  node: CollectablePolicyNode,
  branch: CollectablePolicyBranch,
  rewardTable: CollectableRewardTable,
  objective: CollectableObjective
) {
  return isCollectSuccess(node, branch)
    ? scoreCollectability(node.state.collectability, rewardTable, objective)
    : 0;
}

function tierCountsForBranch(
  node: CollectablePolicyNode,
  branch: CollectablePolicyBranch,
  rewardTable: CollectableRewardTable
) {
  return isCollectSuccess(node, branch)
    ? getCollectableTierCountForValue(node.state.collectability, rewardTable)
    : createZeroTierCounts();
}

function isCollectSuccess(node: CollectablePolicyNode, branch: CollectablePolicyBranch) {
  return node.recommendedAction.kind === 'collect'
    && (branch.labelKeys ?? [branch.labelKey]).includes(COLLECT_SUCCESS_LABEL);
}

function addDetail(target: Map<string, OutcomeDetail>, detail: OutcomeDetail) {
  const key = outcomeDetailKey(detail.score, detail.tierCounts);
  const current = target.get(key);
  target.set(key, {
    score: detail.score,
    probability: (current?.probability ?? 0) + detail.probability,
    tierCounts: detail.tierCounts
  });
}

function outcomeDetailKey(score: number, tierCounts: CollectableTierCounts) {
  return [score, tierCounts.none, tierCounts.low, tierCounts.mid, tierCounts.high].join('|');
}

function compareOutcomeDetails(left: OutcomeDetail, right: OutcomeDetail) {
  return left.score - right.score
    || left.tierCounts.high - right.tierCounts.high
    || left.tierCounts.mid - right.tierCounts.mid
    || left.tierCounts.low - right.tierCounts.low;
}
