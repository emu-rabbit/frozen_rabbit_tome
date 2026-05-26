// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const stats = { level: 100, gathering: 5345, perception: 5137, gp: 930 };
const food = { foodId: null, quality: 'hq' as const };
const nodeBonuses = { gatheringCount: 1, yieldCount: 2, extraRate: 3 };

describe('library storage migration', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('會把舊版秘笈轉成 input 加輕量 snapshot，並保留 regular 手法', async () => {
    localStorage.setItem('frozen-rabbit-tome-library', JSON.stringify([{
      id: 'legacy-tome',
      kind: 'regular',
      itemId: 123,
      stats,
      temporaryGp: 850,
      food,
      nodeBonuses,
      rotation: [{ type: 'gather', actionName: '採集' }],
      modelVersions: { app: '0.8.0', regularSolver: 'regular-solver-v0' },
      objectiveMode: 'expected',
      createdAt: '2026-05-01T00:00:00.000Z'
    }]));

    const { useTomeLibrary } = await import('./useTomeLibrary');
    const { tomes } = useTomeLibrary();
    const migrated = tomes.value[0];

    expect(migrated).toMatchObject({
      schemaVersion: 2,
      kind: 'regular',
      input: {
        itemId: 123,
        stats,
        temporaryGp: 850,
        food,
        nodeBonuses
      },
      lastSolvedSnapshot: {
        kind: 'regular',
        objectiveMode: 'expected',
        rotation: [{ type: 'gather', actionName: '採集' }]
      }
    });
  });

  it('會把舊版實驗轉成 input 加 strategy，並移除完整 outcome distribution', async () => {
    localStorage.setItem('frozen-rabbit-tome-experiments', JSON.stringify([{
      id: 'legacy-experiment',
      kind: 'regular',
      itemId: 456,
      stats,
      temporaryGp: 800,
      food,
      nodeBonuses,
      primaryRotation: [{ type: 'gather', actionName: '採集' }],
      revisitRotation: [],
      analysis: {
        modelVersions: { app: '0.8.0', regularSimulator: 'regular-simulator-v0', regularAnalyzer: 'regular-analyzer-v0' },
        primary: { expectedYield: 10, minYield: 8, maxYield: 12, minYieldChance: 20, maxYieldChance: 30, outcomeDistribution: [], finalIntegrityRange: [0, 1], finalGpRange: [0, 930] },
        total: { expectedYield: 10, minYield: 8, maxYield: 12, minYieldChance: 20, maxYieldChance: 30, outcomeDistribution: [{ yield: 10, probability: 1 }], finalIntegrityRange: [0, 1], finalGpRange: [0, 930] },
        revisitChance: 0
      },
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z'
    }]));

    const { useExperimentLibrary } = await import('./useExperimentLibrary');
    const { experiments } = useExperimentLibrary();
    const migrated = experiments.value[0] as any;

    expect(migrated).toMatchObject({
      schemaVersion: 2,
      kind: 'regular',
      input: {
        itemId: 456,
        stats,
        temporaryGp: 800,
        food,
        nodeBonuses
      },
      strategy: {
        kind: 'regular',
        primaryRotation: [{ type: 'gather', actionName: '採集' }],
        revisitRotation: []
      },
      lastAnalysisSnapshot: {
        kind: 'regular',
        expectedYield: 10,
        minYield: 8,
        maxYield: 12
      }
    });
    expect(migrated.analysis).toBeUndefined();
    expect(migrated.lastAnalysisSnapshot.outcomeDistribution).toBeUndefined();
  });

  it('會保留舊版收藏品實驗的策略規則作為 canonical strategy', async () => {
    const rules = [{
      id: 'rule-1',
      name: 'Collect',
      mode: 'all',
      enabled: true,
      conditions: [{ id: 'condition-1', field: 'collectability', comparator: '>=', value: 1000 }],
      actions: ['collect']
    }];

    localStorage.setItem('frozen-rabbit-tome-experiments', JSON.stringify([{
      id: 'legacy-collectable-experiment',
      kind: 'collectable',
      itemId: 789,
      stats,
      temporaryGp: 780,
      food,
      nodeBonuses: { baseIntegrity: 4, ...nodeBonuses },
      collectableRules: rules,
      collectableObjective: { kind: 'scrip', presetId: 'scrip' },
      collectableHasRelicToolBonus: true,
      collectableAnalysis: {
        modelVersions: { app: '0.8.0', collectableSimulator: 'old', collectableAnalyzer: 'old' },
        expectedScore: 120,
        minScore: 80,
        maxScore: 150,
        minScoreChance: 10,
        maxScoreChance: 15,
        expectedTierCounts: { none: 0, low: 0, mid: 1, high: 2 },
        minScoreTierCounts: { none: 1, low: 0, mid: 0, high: 0 },
        maxScoreTierCounts: { none: 0, low: 0, mid: 0, high: 3 },
        outcomeDistribution: [{ score: 120, probability: 1 }]
      },
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z'
    }]));

    const { useExperimentLibrary } = await import('./useExperimentLibrary');
    const { experiments } = useExperimentLibrary();
    const migrated = experiments.value[0] as any;

    expect(migrated.strategy).toMatchObject({
      kind: 'collectable',
      rules,
      objective: { kind: 'scrip', presetId: 'scrip' },
      hasRelicToolBonus: true
    });
    expect(migrated.input.hasRelicToolBonus).toBe(true);
    expect(migrated.lastAnalysisSnapshot).toMatchObject({
      kind: 'collectable',
      expectedScore: 120,
      enabledRuleCount: 1,
      ruleCount: 1
    });
    expect(migrated.collectableAnalysis).toBeUndefined();
    expect(migrated.lastAnalysisSnapshot.outcomeDistribution).toBeUndefined();
  });
});
