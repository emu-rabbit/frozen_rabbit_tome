import { describe, expect, it } from 'vitest';
import {
  buildCollectableStrategyTree,
  collectableStrategyFields,
  collectMatchingUncoveredStrategyNodes,
  createSimpleCollectableStrategyRules,
  summarizeAppliedRuleOutcome,
  type CollectableStrategyNode,
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

function collectMatchedNodes(root: CollectableStrategyNode, ruleId: string) {
  const nodes: CollectableStrategyNode[] = [];
  const visited = new Set<string>();

  function walk(node: CollectableStrategyNode | undefined) {
    if (!node || visited.has(node.id)) return;
    visited.add(node.id);
    if (node.matchedRuleId === ruleId) nodes.push(node);
    node.branches.forEach((branch) => walk(branch.child));
  }

  walk(root);
  return nodes;
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

  it('納管節點只統計目前尚未決策且被條件命中的節點，不包含套用後才展開出的後續節點', () => {
    const improveRule = createSimpleCollectableStrategyRules({
      highTierCollectability: 800,
      improveName: '提高價值',
      collectName: '採集'
    })[0];

    const frontier = buildCollectableStrategyTree({
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
      temporaryGp: 930,
      jobType: 'miner',
      isTimedNode: false,
      rules: []
    });
    const expanded = buildCollectableStrategyTree({
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
      temporaryGp: 930,
      jobType: 'miner',
      isTimedNode: false,
      rules: [improveRule],
      maxNodes: 80
    });

    const managedFrontier = collectMatchingUncoveredStrategyNodes(frontier.uncoveredNodes, improveRule);

    expect(managedFrontier).toHaveLength(1);
    expect(managedFrontier[0].status).toBe('uncovered');
    expect(collectMatchedNodes(expanded.root, improveRule.id).length).toBeGreaterThan(managedFrontier.length);
  });

  it('套用後摘要會循環套用同一策略直到終結', () => {
    const collectRule = rule('collect-final', 'collect');
    const request = {
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
        baseIntegrity: 3,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      temporaryGp: 930,
      jobType: 'miner' as const,
      isTimedNode: false
    };
    const frontier = buildCollectableStrategyTree({
      ...request,
      rules: []
    });
    const mechanics = createCollectableMechanicsContext(request);

    const summary = summarizeAppliedRuleOutcome(frontier.uncoveredNodes, collectRule, mechanics);

    expect(summary.totalBranches).toBe(1);
    expect(summary.completeBranches).toBe(1);
    expect(summary.openStates).toHaveLength(0);
  });

  it('套用後摘要會保留未終結的唯一後續狀態供範圍卡使用', () => {
    const improveRule: CollectableStrategyRule = {
      id: 'improve',
      name: 'improve',
      enabled: true,
      mode: 'all',
      conditions: [
        {
          id: 'low-value',
          field: 'collectability',
          comparator: '<',
          value: 200
        }
      ],
      actions: ['meticulous']
    };
    const request = {
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
      temporaryGp: 930,
      jobType: 'miner' as const,
      isTimedNode: false
    };
    const frontier = buildCollectableStrategyTree({
      ...request,
      rules: []
    });
    const mechanics = createCollectableMechanicsContext(request);

    const summary = summarizeAppliedRuleOutcome(frontier.uncoveredNodes, improveRule, mechanics);

    expect(summary.totalBranches).toBeGreaterThan(1);
    expect(summary.completeBranches).toBe(0);
    expect(summary.openStates.length).toBeGreaterThan(1);
    expect(summary.openStates.every((state) => state.integrity > 0)).toBe(true);
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
