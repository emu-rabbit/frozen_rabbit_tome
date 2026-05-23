import { describe, expect, it } from 'vitest';
import { filterCollectSuccessActionCandidates, solveCollectableRotation } from './collectableSolver';
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

function findActionDepth(
  node: { id?: string; recommendedAction: { kind: string }; branches: Array<{ next?: any }> },
  actionKind: string,
  depth = 0,
  visited = new Set<string>()
): number | null {
  if (depth > 16) return null;
  if (node.id && visited.has(node.id)) return null;
  if (node.id) visited.add(node.id);
  if (node.recommendedAction.kind === actionKind) return depth;

  const childDepths = node.branches
    .map((branch) => branch.next ? findActionDepth(branch.next, actionKind, depth + 1, visited) : null)
    .filter((childDepth): childDepth is number => childDepth !== null);

  return childDepths.length > 0 ? Math.min(...childDepths) : null;
}

function collectNodes(
  node: { id?: string; recommendedAction: { kind: string }; state: any; branches: Array<{ next?: any }> },
  depth = 0,
  visited = new Set<string>()
): any[] {
  if (depth > 24) return [];
  if (node.id && visited.has(node.id)) return [];
  if (node.id) visited.add(node.id);

  return [
    node,
    ...node.branches.flatMap((branch) => branch.next ? collectNodes(branch.next, depth + 1, visited) : [])
  ];
}

function policyActionByState(result: ReturnType<typeof solveCollectableRotation>): Map<string, string> {
  return new Map(collectNodes(result.policy).map((node) => [
    [
      node.state.gp,
      node.state.integrity,
      node.state.collectability,
      node.state.scrutinyActive ? 1 : 0,
      node.state.collectorsFocusActive ? 1 : 0,
      node.state.primingTouchActive ? 1 : 0,
      node.state.standardActive ? 1 : 0,
      node.state.successBonus,
      node.state.nextCollectSuccessBonus,
      node.state.wiseToTheWorldActive ? 1 : 0
    ].join('|'),
    node.recommendedAction.kind
  ]));
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

  it('50 級前直接呼叫收藏品求解器會被機制層拒絕', () => {
    expect(() => solveCollectableRotation(createRequest({
      stats: {
        level: 49,
        gathering: 1000,
        perception: 1000,
        gp: 930
      },
      itemLevel: 49,
      temporaryGp: 930
    }))).toThrow(/Collectable gathering requires level 50 or higher/);
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

  it('GP 與等級足夠時會考慮集中檢查或價值矚目等 buff', () => {
    const result = solveCollectableRotation(createRequest({
      stats: {
        level: 95,
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

  it('85 級前不會把價值矚目納入求解器候選', () => {
    const result = solveCollectableRotation(createRequest({
      stats: {
        level: 84,
        gathering: 1000,
        perception: 1000,
        gp: 930
      },
      temporaryGp: 930,
      nodeBonuses: {
        baseIntegrity: 3,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      }
    }));

    expect(collectKinds(result.policy)).not.toContain('collectorsFocus');
  });

  it('95 級前不會把預備碰觸納入求解器候選', () => {
    const result = solveCollectableRotation(createRequest({
      stats: {
        level: 94,
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

    expect(collectKinds(result.policy)).not.toContain('primingTouch');
  });

  it('收藏價值已滿時不會推薦遊戲內無法使用的提煉與提煉 buff', () => {
    const result = solveCollectableRotation(createRequest({
      stats: {
        level: 100,
        gathering: 5000,
        perception: 5000,
        gp: 930
      },
      baseValues: {
        Gathering: 1000,
        Perception: 1000
      },
      nodeBonuses: {
        baseIntegrity: 4,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      rewardTable: {
        itemId: 1,
        source: 'collectables',
        tiers: {
          low: { collectability: 1000, reward: { exp: 0, gil: 0, scrip: 1, items: {} } },
          mid: { collectability: 1000, reward: { exp: 0, gil: 0, scrip: 1, items: {} } },
          high: { collectability: 1000, reward: { exp: 0, gil: 0, scrip: 100, items: {} } }
        }
      }
    }));
    const illegalRefineActions = new Set(['scrutiny', 'collectorsFocus', 'primingTouch', 'scour', 'meticulous']);
    const cappedNodes = collectNodes(result.policy).filter((node) => node.state.collectability >= 1000);

    expect(cappedNodes.length).toBeGreaterThan(0);
    expect(cappedNodes.every((node) => !illegalRefineActions.has(node.recommendedAction.kind))).toBe(true);
  });

  it('預備碰觸會在 Meticulous 後被消耗', () => {
    const result = solveCollectableRotation(createRequest({
      stats: {
        level: 95,
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

  it('基礎成功率不可被技能補強時，不會把成功率技能納入收藏品求解器候選', () => {
    const result = solveCollectableRotation(createRequest({
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

    expect(collectKinds(result.policy)).not.toEqual(expect.arrayContaining([
      'successI',
      'successII',
      'successIII',
      'nextCollectSuccess'
    ]));
  });

  it('天選人模式只用最高分數評分，不為相同峰值施放成功率技能', () => {
    const result = solveCollectableRotation(createRequest({
      objectiveMode: 'max',
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

    expect(result.objectiveMode).toBe('max');
    expect(result.maxScore).toBe(200);
    expect(['successI', 'successII', 'successIII', 'nextCollectSuccess']).not.toContain(result.policy.recommendedAction.kind);
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

  it('低成功率多次採集仍能用 memo 結果重建決策圖，不因路徑數暴漲', () => {
    const result = solveCollectableRotation(createRequest({
      debugMode: true,
      stats: {
        level: 100,
        gathering: 450,
        perception: 1000,
        gp: 0
      },
      baseValues: {
        Gathering: 1000,
        Perception: 1000
      },
      nodeBonuses: {
        baseIntegrity: 6,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      temporaryGp: 0,
      rewardTable: {
        itemId: 1,
        source: 'collectables',
        tiers: {
          low: { collectability: 0, reward: { exp: 0, gil: 0, scrip: 100, items: {} } },
          mid: { collectability: 0, reward: { exp: 0, gil: 0, scrip: 100, items: {} } },
          high: { collectability: 0, reward: { exp: 0, gil: 0, scrip: 100, items: {} } }
        }
      }
    }));
    const policyNodes = collectNodes(result.policy);
    const distribution = result.debug?.plans[0].outcomeDistribution ?? [];
    const totalProbability = distribution.reduce((sum, entry) => sum + entry.probability, 0);

    expect(policyNodes.length).toBeLessThan(80);
    expect(result.debug?.plans[0].search.statesSolved).toBeLessThan(2000);
    expect(totalProbability).toBeCloseTo(100, 6);
  });

  it('明晰視野等價時會提前到收藏品採集前段施放', () => {
    const result = solveCollectableRotation(createRequest({
      stats: {
        level: 100,
        gathering: 760,
        perception: 1000,
        gp: 50
      },
      nodeBonuses: {
        baseIntegrity: 1,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      temporaryGp: 50,
      rewardTable: {
        itemId: 1,
        source: 'collectables',
        tiers: {
          low: { collectability: 0, reward: { exp: 0, gil: 0, scrip: 100, items: {} } },
          mid: { collectability: 0, reward: { exp: 0, gil: 0, scrip: 100, items: {} } },
          high: { collectability: 0, reward: { exp: 0, gil: 0, scrip: 100, items: {} } }
        }
      }
    }));

    const nextCollectSuccessDepth = findActionDepth(result.policy, 'nextCollectSuccess');
    const collectDepth = findActionDepth(result.policy, 'collect');

    expect(collectDepth).not.toBeNull();
    expect(findActionDepth(result.policy, 'successI')).not.toBeNull();
    expect(nextCollectSuccessDepth).toBeNull();
  });

  it('成功率習慣不會在同分時蓋過 GP 經濟', () => {
    const result = solveCollectableRotation(createRequest({
      stats: {
        level: 100,
        gathering: 760,
        perception: 1000,
        gp: 50
      },
      nodeBonuses: {
        baseIntegrity: 1,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      temporaryGp: 50,
      rewardTable: {
        itemId: 1,
        source: 'collectables',
        tiers: {
          low: { collectability: 1000, reward: { exp: 0, gil: 0, scrip: 0, items: {} } },
          mid: { collectability: 1000, reward: { exp: 0, gil: 0, scrip: 0, items: {} } },
          high: { collectability: 1000, reward: { exp: 0, gil: 0, scrip: 0, items: {} } }
        }
      }
    }));

    expect(result.expectedScore).toBe(0);
    expect(result.policy.recommendedAction.kind).toBe('collect');
  });

  it('成功率補強即使有補滿候選也保留較省 GP 的合法候選', () => {
    const candidates = filterCollectSuccessActionCandidates([
      { kind: 'successIII' as const, priority: 40, gpCost: 250, bonus: 50 },
      { kind: 'successII' as const, priority: 41, gpCost: 100, bonus: 15 },
      { kind: 'successI' as const, priority: 42, gpCost: 50, bonus: 5 },
      { kind: 'nextCollectSuccess' as const, priority: 50, gpCost: 50, bonus: 15 }
    ], 67, 0, false);

    expect(candidates.map((candidate) => candidate.kind)).toEqual([
      'successIII',
      'successII',
      'successI',
      'nextCollectSuccess'
    ]);
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
    const restoreNode = findActionNode(result.policy, 'restoreIntegrity');

    expect(kinds).toContain('restoreIntegrity');
    expect(kinds).toContain('wiseToTheWorld');
    expect(restoreNode?.state.integrity).toBe(1);
  });

  it('90 級以上石工之理分支仍會建立理智同興後續', () => {
    const result = solveCollectableRotation(createRequest({
      stats: {
        level: 100,
        gathering: 5345,
        perception: 5173,
        gp: 300
      },
      baseValues: {
        Gathering: 1000,
        Perception: 1000
      },
      nodeBonuses: {
        baseIntegrity: 6,
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
          mid: { collectability: 600, reward: { exp: 0, gil: 0, scrip: 10, items: {} } },
          high: { collectability: 1000, reward: { exp: 0, gil: 0, scrip: 20, items: {} } }
        }
      }
    }));

    const restoreNode = findActionNode(result.policy, 'restoreIntegrity');
    const wiseBranch = restoreNode?.branches.find((branch: any) => branch.labelKey === 'collectableSolver.branches.wiseProc');

    expect(restoreNode).not.toBeNull();
    expect(wiseBranch?.next?.recommendedAction.kind).toBe('wiseToTheWorld');
  });

  it('debug mode 回傳公式、搜尋統計與第一版限制', () => {
    const result = solveCollectableRotation(createRequest({ debugMode: true }));

    expect(result.debug?.formulas.collectable).toMatchObject({
      scourValue: 200,
      baseValueIncreaseRate: 40,
      valueIncreaseRate: 40,
      focusedValueIncreaseRate: 70,
      hasRelicToolBonus: false,
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
    expect(result.debug?.objective).toMatchObject({ kind: 'scrip' });
    expect(result.debug?.plans[0].search.statesSolved).toBeGreaterThan(0);
    expect(result.debug?.plans[0].search.memoHitRate).toBeGreaterThanOrEqual(0);
    expect(result.debug?.plans[0].outcomeDistribution.length).toBeGreaterThan(0);
    expect(result.debug?.limitations).toEqual(expect.arrayContaining([
      'brazen-excluded',
      'high-standard-excluded'
    ]));
  });

  it('滿 GP 時只回傳一棵收藏品決策樹，但總期望納入再起機率', () => {
    const result = solveCollectableRotation(createRequest({
      stats: {
        level: 91,
        gathering: 1000,
        perception: 1000,
        gp: 930
      },
      temporaryGp: 930
    }));

    expect(result.policyPlans).toHaveLength(1);
    expect(result.revisit).toMatchObject({ enabled: true, chance: 0.05, isFullGp: true });
    expect(result.expectedScore).toBeGreaterThan(result.policyPlans[0].expectedScore);
    expect(result.maxScore).toBeGreaterThanOrEqual(result.policyPlans[0].maxScore);
    expect(result.maxScoreChance).toBeLessThanOrEqual(result.policyPlans[0].maxScoreChance);
    expect(collectKinds(result.policy)).toContain('revisitCheck');
  });

  it('遺物工具效果會先把價值提升率直接加 20 點，再套用價值矚目倍率', () => {
    const result = solveCollectableRotation(createRequest({
      hasRelicToolBonus: true,
      debugMode: true
    }));

    expect(result.debug?.formulas.collectable).toMatchObject({
      baseValueIncreaseRate: 40,
      valueIncreaseRate: 60,
      focusedValueIncreaseRate: 100,
      hasRelicToolBonus: true
    });
  });

  it('GP 不滿時會建立原始與再起後滿 GP 收藏品決策樹', () => {
    const result = solveCollectableRotation(createRequest({
      temporaryGp: 0
    }));

    expect(result.policyPlans.map((plan) => plan.kind)).toEqual(['primary', 'revisit']);
    expect(result.policyPlans[1].startingGp).toBe(930);
    expect(result.expectedScore).toBeGreaterThan(result.policyPlans[0].expectedScore);
    expect(collectBranchLabels(result.policy)).toContain('collectableSolver.branches.revisitProc');
  });

  it('檔位權重會回傳期望檔位個數且不加入 DP state key', () => {
    const result = solveCollectableRotation(createRequest({
      objective: {
        kind: 'tierScore',
        presetId: 'highValue',
        tierWeights: { none: 0, low: 0, mid: 1, high: 100 }
      },
      debugMode: true
    }));
    const totalExpectedCounts = result.expectedTierCounts.none
      + result.expectedTierCounts.low
      + result.expectedTierCounts.mid
      + result.expectedTierCounts.high;

    expect(totalExpectedCounts).toBeGreaterThan(0);
    expect(result.policy.expectedTierCounts).toEqual(result.policyPlans[0].expectedTierCounts);
    expect(result.debug?.optimality.stateKeyFields).not.toContain('expectedTierCounts');
    expect(result.debug?.objective).toMatchObject({
      kind: 'tierScore',
      presetId: 'highValue',
      tierWeights: { none: 0, low: 0, mid: 1, high: 100 }
    });
    expect(result.debug?.plans[0].outcomeDistribution.some((entry) => entry.tierCounts)).toBe(true);
    expect(result.debug?.plans[0].outcomeDistribution[0].tierCounts).toEqual(expect.objectContaining({
      low: expect.any(Number),
      mid: expect.any(Number),
      high: expect.any(Number)
    }));
  });

  it('滿 GP 且有再起時，debug 的 primary 分布不會重複展開再起樹', () => {
    const result = solveCollectableRotation(createRequest({
      objective: {
        kind: 'tierScore',
        presetId: 'lowValue',
        tierWeights: { none: 0, low: 100, mid: 20, high: 10 }
      },
      debugMode: true
    }));
    const primaryPlan = result.policyPlans[0];
    const distribution = result.debug?.plans[0].outcomeDistribution ?? [];
    const maxDistributionEntry = distribution.reduce((current, entry) => (
      entry.score > current.score ? entry : current
    ), distribution[0]);

    expect(result.revisit).toMatchObject({ enabled: true, isFullGp: true });
    expect(result.maxScore).toBeGreaterThan(primaryPlan.maxScore);
    expect(maxDistributionEntry.score).toBe(primaryPlan.maxScore);
    expect(maxDistributionEntry.tierCounts).toEqual(primaryPlan.maxScoreTierCounts);
  });

});
