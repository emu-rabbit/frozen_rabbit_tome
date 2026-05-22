import { describe, expect, it } from 'vitest';
import {
  buildCollectableStrategyTree,
  collectableStrategyFields,
  createSimpleCollectableStrategyRules,
  type CollectableStrategyRule
} from './collectableStrategyTree';
import {
  canUseCollectableAction,
  createCollectableMechanicsContext,
  createInitialCollectableMechanicsState
} from './collectableMechanics';

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
  it('策略條件欄位會依常用決策順序排列，並集中成功率相關欄位', () => {
    expect(collectableStrategyFields).toEqual([
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
    ]);
  });

  it('簡單範例會在未達最高檔前慎重提煉，達最高檔後收藏品採集', () => {
    const rules = createSimpleCollectableStrategyRules({
      highTierCollectability: 800,
      improveName: '提高價值',
      collectName: '採集'
    });

    expect(rules).toMatchObject([
      {
        id: 'simple-improve-value',
        name: '提高價值',
        conditions: [{ field: 'collectability', comparator: '<', value: 800 }],
        actions: ['meticulous'],
        enabled: true
      },
      {
        id: 'simple-collect',
        name: '採集',
        conditions: [{ field: 'collectability', comparator: '>=', value: 800 }],
        actions: ['collect'],
        enabled: true
      }
    ]);
  });

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

  it('會依角色等級阻擋尚未學會的收藏品技能', () => {
    const mechanics = createCollectableMechanicsContext({
      stats: {
        level: 84,
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
      isTimedNode: false
    });
    const state = createInitialCollectableMechanicsState(mechanics, 930);

    expect(canUseCollectableAction('collectorsFocus', state, mechanics)).toBe(false);
    expect(canUseCollectableAction('collect', state, mechanics)).toBe(true);
  });

  it('策略樹遇到等級不足技能時，會改用下一條可執行策略', () => {
    const result = buildCollectableStrategyTree({
      stats: {
        level: 84,
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
      temporaryGp: 930,
      jobType: 'miner',
      isTimedNode: false,
      rules: [
        rule('focus-first', 'collectorsFocus'),
        rule('collect-fallback', 'collect')
      ]
    });

    expect(result.root.status).toBe('decided');
    expect(result.root.matchedRuleId).toBe('collect-fallback');
    expect(result.root.action).toBe('collect');
  });

  it('策略樹遇到基礎成功率不可補強的成功率技能時，會改用下一條可執行策略', () => {
    const result = buildCollectableStrategyTree({
      stats: {
        level: 100,
        gathering: 10,
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
      temporaryGp: 930,
      jobType: 'miner',
      isTimedNode: false,
      rules: [
        rule('success-first', 'successIII'),
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
