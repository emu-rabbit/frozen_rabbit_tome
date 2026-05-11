import { describe, expect, it } from 'vitest';
import { solveCollectableRotation } from './collectableSolver';
import type { CollectableSolverRequest } from '../types/collectable';

function createRequest(overrides: Partial<CollectableSolverRequest> = {}): CollectableSolverRequest {
  return {
    stats: {
      level: 100,
      gathering: 1000,
      perception: 1000,
      gp: 930
    },
    baseValues: {
      Gathering: 1000,
      Perception: 1000
    },
    itemLevel: 100,
    nodeBonuses: {
      baseIntegrity: 4,
      gatheringCount: 0,
      yieldCount: 0,
      extraRate: 0
    },
    temporaryGp: 930,
    jobType: 'miner',
    rewardTable: {
      itemId: 1,
      source: 'collectables',
      tiers: {
        low: {
          collectability: 200,
          reward: { exp: 0, gil: 0, scrip: 1, items: {} }
        },
        mid: {
          collectability: 600,
          reward: { exp: 0, gil: 0, scrip: 10, items: {} }
        },
        high: {
          collectability: 1000,
          reward: { exp: 0, gil: 0, scrip: 20, items: {} }
        }
      }
    },
    objective: { kind: 'scrip' },
    ...overrides
  };
}

function collectKinds(
  node: { id?: string; recommendedAction: { kind: string }; branches: Array<{ next?: any }> },
  depth = 0,
  visited = new Set<string>()
): string[] {
  if (depth > 16) return [];
  if (node.id && visited.has(node.id)) return [];
  if (node.id) visited.add(node.id);

  return [
    node.recommendedAction.kind,
    ...node.branches.flatMap((branch) => branch.next ? collectKinds(branch.next, depth + 1, visited) : [])
  ];
}

describe('solveCollectableRotation', () => {
  it('沒有 GP 時仍可用 0 GP 提煉與收藏建立策略', () => {
    const result = solveCollectableRotation(createRequest({
      temporaryGp: 0,
      stats: {
        level: 100,
        gathering: 1000,
        perception: 1000,
        gp: 930
      }
    }));

    const kinds = collectKinds(result.policy);
    expect(kinds).toContain('scour');
    expect(kinds).toContain('collect');
    expect(result.expectedScore).toBeGreaterThan(0);
  });

  it('GP 足夠時會考慮集中檢查或價值矚目等 buff', () => {
    const result = solveCollectableRotation(createRequest({
      stats: {
        level: 24,
        gathering: 1000,
        perception: 1000,
        gp: 930
      },
      temporaryGp: 200,
      nodeBonuses: {
        baseIntegrity: 2,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      }
    }));

    const kinds = collectKinds(result.policy);
    expect(kinds.some((kind) => ['scrutiny', 'collectorsFocus', 'primingTouch'].includes(kind))).toBe(true);
  });

  it('預備碰觸會在 Meticulous 後被消耗', () => {
    const result = solveCollectableRotation(createRequest({
      stats: {
        level: 24,
        gathering: 1000,
        perception: 1000,
        gp: 100
      },
      temporaryGp: 100,
      nodeBonuses: {
        baseIntegrity: 3,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      rewardTable: {
        itemId: 1,
        source: 'collectables',
        tiers: {
          low: { collectability: 150, reward: { exp: 0, gil: 0, scrip: 1, items: {} } },
          mid: { collectability: 350, reward: { exp: 0, gil: 0, scrip: 10, items: {} } },
          high: { collectability: 550, reward: { exp: 0, gil: 0, scrip: 80, items: {} } }
        }
      }
    }));

    const rootKinds = collectKinds(result.policy);
    expect(rootKinds).toContain('primingTouch');

    function findMeticulousAfterPriming(node: any): any | null {
      if (node.state.primingTouchActive && node.recommendedAction.kind === 'meticulous') return node;
      for (const branch of node.branches) {
        const found = branch.next ? findMeticulousAfterPriming(branch.next) : null;
        if (found) return found;
      }
      return null;
    }

    const meticulousNode = findMeticulousAfterPriming(result.policy);
    expect(meticulousNode).not.toBeNull();
    expect(meticulousNode.branches.every((branch: any) => !branch.next || !branch.next.state.primingTouchActive)).toBe(true);
  });

  it('成功率不足 100% 時會評估成功率補強技能', () => {
    const result = solveCollectableRotation(createRequest({
      stats: {
        level: 100,
        gathering: 760,
        perception: 1000,
        gp: 930
      },
      nodeBonuses: {
        baseIntegrity: 1,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      temporaryGp: 930,
      rewardTable: {
        itemId: 1,
        source: 'collectables',
        tiers: {
          low: { collectability: 0, reward: { exp: 0, gil: 0, scrip: 100, items: {} } },
          mid: { collectability: 1, reward: { exp: 0, gil: 0, scrip: 100, items: {} } },
          high: { collectability: 2, reward: { exp: 0, gil: 0, scrip: 100, items: {} } }
        }
      }
    }));

    expect(['successI', 'successII', 'successIII', 'nextCollectSuccess']).toContain(result.policy.recommendedAction.kind);
  });

  it('成功率已 100% 時不施放成功率補強技能', () => {
    const result = solveCollectableRotation(createRequest({
      stats: {
        level: 100,
        gathering: 1000,
        perception: 1000,
        gp: 930
      },
      nodeBonuses: {
        baseIntegrity: 1,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      rewardTable: {
        itemId: 1,
        source: 'collectables',
        tiers: {
          low: { collectability: 0, reward: { exp: 0, gil: 0, scrip: 100, items: {} } },
          mid: { collectability: 1, reward: { exp: 0, gil: 0, scrip: 100, items: {} } },
          high: { collectability: 2, reward: { exp: 0, gil: 0, scrip: 100, items: {} } }
        }
      }
    }));

    expect(['successI', 'successII', 'successIII', 'nextCollectSuccess']).not.toContain(result.policy.recommendedAction.kind);
  });

  it('耐久不足時會評估石工之理恢復採集次數', () => {
    const result = solveCollectableRotation(createRequest({
      stats: {
        level: 89,
        gathering: 1000,
        perception: 0,
        gp: 300
      },
      nodeBonuses: {
        baseIntegrity: 2,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      temporaryGp: 300,
      rewardTable: {
        itemId: 1,
        source: 'collectables',
        tiers: {
          low: { collectability: 200, reward: { exp: 0, gil: 0, scrip: 0, items: {} } },
          mid: { collectability: 250, reward: { exp: 0, gil: 0, scrip: 0, items: {} } },
          high: { collectability: 400, reward: { exp: 0, gil: 0, scrip: 100, items: {} } }
        }
      }
    }));

    expect(collectKinds(result.policy)).toContain('restoreIntegrity');
  });

  it('90 級以上石工之理會建立理智同興的後續分支', () => {
    const result = solveCollectableRotation(createRequest({
      stats: {
        level: 100,
        gathering: 1000,
        perception: 0,
        gp: 300
      },
      nodeBonuses: {
        baseIntegrity: 2,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      temporaryGp: 300,
      rewardTable: {
        itemId: 1,
        source: 'collectables',
        tiers: {
          low: { collectability: 200, reward: { exp: 0, gil: 0, scrip: 1, items: {} } },
          mid: { collectability: 400, reward: { exp: 0, gil: 0, scrip: 10, items: {} } },
          high: { collectability: 600, reward: { exp: 0, gil: 0, scrip: 200, items: {} } }
        }
      }
    }));

    const kinds = collectKinds(result.policy);
    expect(kinds).toContain('restoreIntegrity');
    expect(kinds).toContain('wiseToTheWorld');
  });

  it('debug mode 回傳公式、搜尋統計與第一版限制', () => {
    const result = solveCollectableRotation(createRequest({ debugMode: true }));

    expect(result.debug?.formulas.collectable).toMatchObject({
      scourValue: 200,
      valueIncreaseRate: 40,
      focusedValueIncreaseRate: 70,
      meticulousRate: 25,
      primedMeticulousRate: 50,
      scrutinyMultiplier: 125,
      scrutinyBonus: 250
    });
    expect(result.debug?.search.statesSolved).toBeGreaterThan(0);
    expect(result.debug?.limitations).toEqual(expect.arrayContaining([
      'brazen-excluded',
      'high-standard-excluded'
    ]));
  });
});
