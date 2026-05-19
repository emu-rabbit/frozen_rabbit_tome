import { describe, expect, it } from 'vitest';
import { analyzeCollectableStrategyTree } from './collectableStrategyAnalysis';
import type { CollectableRewardTable } from '../types/collectable';
import type { CollectableStrategyNode } from './collectableStrategyTree';

let nodeId = 0;

const rewardTable: CollectableRewardTable = {
  itemId: 1,
  source: 'collectables',
  rewardItemId: 33914,
  tiers: {
    low: {
      collectability: 100,
      reward: { exp: 0, gil: 0, scrip: 10, items: {} }
    },
    mid: {
      collectability: 200,
      reward: { exp: 0, gil: 0, scrip: 20, items: {} }
    },
    high: {
      collectability: 300,
      reward: { exp: 0, gil: 0, scrip: 30, items: {} }
    }
  }
};

function node(
  partial: Omit<Partial<CollectableStrategyNode>, 'state'> & {
    state?: Partial<CollectableStrategyNode['state']>;
  }
): CollectableStrategyNode {
  return {
    id: partial.id ?? `node-${nodeId += 1}`,
    state: {
      gp: 0,
      integrity: 0,
      collectability: 0,
      scrutinyActive: false,
      collectorsFocusActive: false,
      primingTouchActive: false,
      standardActive: false,
      hasUsedCollectableAction: false,
      hasCollected: false,
      successBonus: 0,
      successIActive: false,
      successIIActive: false,
      successIIIActive: false,
      nextCollectSuccessBonus: 0,
      wiseToTheWorldActive: false,
      ...partial.state
    },
    path: [],
    status: partial.status ?? 'terminal',
    action: partial.action,
    pendingActions: [],
    branches: partial.branches ?? []
  };
}

describe('collectableStrategyAnalysis', () => {
  it('scores only successful collect branches and builds an outcome distribution', () => {
    const terminal = node({ id: 'terminal' });
    const root = node({
      id: 'root',
      status: 'decided',
      action: 'collect',
      state: { collectability: 250, integrity: 1 },
      branches: [
        {
          label: '成功',
          labelKeys: ['collectableSolver.branches.collectSuccess'],
          probability: 80,
          state: { ...terminal.state },
          child: terminal
        },
        {
          label: '失敗',
          labelKeys: ['collectableSolver.branches.collectFailed'],
          probability: 20,
          state: { ...terminal.state },
          child: terminal
        }
      ]
    });

    const result = analyzeCollectableStrategyTree(root, rewardTable, { kind: 'scrip' });

    expect(result.expectedScore).toBe(16);
    expect(result.minScore).toBe(0);
    expect(result.maxScore).toBe(20);
    expect(result.minScoreChance).toBeCloseTo(20);
    expect(result.maxScoreChance).toBeCloseTo(80);
    expect(result.outcomeDistribution).toEqual([
      { score: 0, probability: 20 },
      { score: 20, probability: 80 }
    ]);
  });

  it('adds scores from sequential collect actions', () => {
    const terminal = node({ id: 'terminal' });
    const secondCollect = node({
      id: 'second',
      status: 'decided',
      action: 'collect',
      state: { collectability: 300, integrity: 1 },
      branches: [
        {
          label: '成功',
          labelKeys: ['collectableSolver.branches.collectSuccess'],
          probability: 100,
          state: { ...terminal.state },
          child: terminal
        }
      ]
    });
    const root = node({
      id: 'root',
      status: 'decided',
      action: 'collect',
      state: { collectability: 100, integrity: 2 },
      branches: [
        {
          label: '成功',
          labelKeys: ['collectableSolver.branches.collectSuccess'],
          probability: 100,
          state: { ...secondCollect.state },
          child: secondCollect
        }
      ]
    });

    const result = analyzeCollectableStrategyTree(root, rewardTable, { kind: 'scrip' });

    expect(result.expectedScore).toBe(40);
    expect(result.outcomeDistribution).toEqual([{ score: 40, probability: 100 }]);
  });
});
