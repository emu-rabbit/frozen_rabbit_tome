import { describe, expect, it } from 'vitest';
import { buildCollectableStrategyTree, type CollectableStrategyRule } from './collectableStrategyTree';

function rule(id: string, action: CollectableStrategyRule['actions'][number]): CollectableStrategyRule {
  return {
    id,
    name: id,
    enabled: true,
    mode: 'all',
    conditions: [],
    actions: [action]
  };
}

describe('collectableStrategyTree', () => {
  it('符合上方規則但技能不可用時，會繼續套用下一條可執行策略', () => {
    const result = buildCollectableStrategyTree({
      stats: {
        level: 100,
        gathering: 5345,
        perception: 5173,
        gp: 930
      },
      baseValues: {
        Gathering: 4860,
        Perception: 4860
      },
      itemLevel: 100,
      nodeBonuses: {
        baseIntegrity: 6,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      temporaryGp: 236,
      jobType: 'miner',
      isTimedNode: false,
      rules: [
        rule('restore-first', 'restoreIntegrity'),
        rule('collect-fallback', 'collect')
      ]
    });

    expect(result.root.status).toBe('decided');
    expect(result.root.matchedRuleId).toBe('collect-fallback');
    expect(result.root.action).toBe('collect');
  });

  it('低成功率連續採集會合併等價決策狀態，避免成功失敗排列爆炸', () => {
    const result = buildCollectableStrategyTree({
      stats: {
        level: 100,
        gathering: 400,
        perception: 1000,
        gp: 930
      },
      baseValues: {
        Gathering: 1000,
        Perception: 1000
      },
      itemLevel: 100,
      nodeBonuses: {
        baseIntegrity: 6,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      temporaryGp: 0,
      jobType: 'miner',
      isTimedNode: false,
      rules: [
        rule('collect-fallback', 'collect')
      ],
      maxNodes: 1200
    });

    expect(result.limited).toBe(false);
    expect(result.summary.totalNodes).toBeLessThan(40);
    expect(result.summary.terminalNodes).toBe(7);
  });
});
