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

function collectBranchLabels(
  node: { id?: string; branches: Array<{ labelKey: string; next?: any }> },
  depth = 0,
  visited = new Set<string>()
): string[] {
  if (depth > 16) return [];
  if (node.id && visited.has(node.id)) return [];
  if (node.id) visited.add(node.id);

  return [
    ...node.branches.map((branch) => branch.labelKey),
    ...node.branches.flatMap((branch) => branch.next ? collectBranchLabels(branch.next, depth + 1, visited) : [])
  ];
}

function findActionNode(
  node: { id?: string; recommendedAction: { kind: string }; branches: Array<{ next?: any }> },
  actionKind: string,
  depth = 0,
  visited = new Set<string>()
): any | null {
  if (depth > 16) return null;
  if (node.id && visited.has(node.id)) return null;
  if (node.id) visited.add(node.id);
  if (node.recommendedAction.kind === actionKind) return node;

  for (const branch of node.branches) {
    const found = branch.next ? findActionNode(branch.next, actionKind, depth + 1, visited) : null;
    if (found) return found;
  }

  return null;
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

  it('第一個提煉類動作結算後就會建立洞察分支', () => {
    const result = solveCollectableRotation(createRequest({
      temporaryGp: 0,
      rewardTable: {
        itemId: 1,
        source: 'collectables',
        tiers: {
          low: { collectability: 1000, reward: { exp: 0, gil: 0, scrip: 100, items: {} } },
          mid: { collectability: 1000, reward: { exp: 0, gil: 0, scrip: 100, items: {} } },
          high: { collectability: 1000, reward: { exp: 0, gil: 0, scrip: 100, items: {} } }
        }
      }
    }));

    expect(['scour', 'meticulous']).toContain(result.policy.recommendedAction.kind);
    expect(collectBranchLabels(result.policy)).toContain('collectableSolver.branches.standardProc');
  });

  it('慎重提煉會把價值提升、耐久消耗與洞察建成 8 個獨立組合分支', () => {
    const result = solveCollectableRotation(createRequest({
      temporaryGp: 0
    }));
    const meticulousNode = findActionNode(result.policy, 'meticulous');

    expect(meticulousNode).not.toBeNull();
    expect(meticulousNode.branches).toHaveLength(8);
    expect(meticulousNode.branches).toEqual(expect.arrayContaining([
      expect.objectContaining({
        labelKeys: [
          'collectableSolver.branches.valueIncreased',
          'collectableSolver.branches.meticulousConsumed',
          'collectableSolver.branches.standardNoProc'
        ],
        outcome: expect.objectContaining({
          collectability: 250,
          integrity: 3
        })
      })
    ]));
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
    expect(result.debug?.formulas.rewardTable).toMatchObject({
      lowCollectability: 200,
      lowScrip: 1,
      midCollectability: 600,
      midScrip: 10,
      highCollectability: 1000,
      highScrip: 20
    });
    expect(result.debug?.search.statesSolved).toBeGreaterThan(0);
    expect(result.debug?.search.memoHitRate).toBeGreaterThanOrEqual(0);
    expect(result.debug?.outcomeDistribution.length).toBeGreaterThan(0);
    expect(result.debug?.limitations).toEqual(expect.arrayContaining([
      'brazen-excluded',
      'high-standard-excluded'
    ]));
  });
});
