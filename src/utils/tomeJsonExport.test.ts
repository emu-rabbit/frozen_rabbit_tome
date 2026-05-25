import { describe, expect, it } from 'vitest';
import {
  buildCollectableSolverJsonExport,
  buildJsonExportFileName,
  buildRegularSolverJsonExport
} from './tomeJsonExport';
import { solveCollectableRotation } from './collectableSolver';
import { TOME_MODEL_VERSION_CATALOG, buildModelVersionsForScenario } from '../config/modelVersions';
import type { CollectableSolverRequest } from '../types/collectable';
import type { GatherableItem, SolverRequest, SolverResponse } from '../types/game';

const item: GatherableItem = {
  itemId: 123,
  nameEn: 'Adamantite Ore',
  nameLocale: '堅鋼礦',
  glv: 150,
  iconUrl: '',
  isFallback: false,
  jobType: 'miner',
  jobTypes: ['miner']
};

const request: SolverRequest = {
  stats: {
    level: 100,
    gathering: 5345,
    perception: 5137,
    gp: 930
  },
  baseValues: {
    Gathering: 5085,
    Perception: 5085
  },
  itemLevel: 150,
  nodeBonuses: {
    baseIntegrity: 6,
    gatheringCount: 0,
    yieldCount: 0,
    extraRate: 0
  },
  temporaryGp: 930,
  jobType: 'miner',
  isTimedNode: false,
  objectiveMode: 'expected'
};

describe('tomeJsonExport', () => {
  it('uses localized scenario labels in file names', () => {
    const fileName = buildJsonExportFileName({
      item,
      scenario: 'tome.regular',
      scenarioLabel: '一般採集秘笈',
      generatedAt: new Date('2026-05-24T00:00:00.000Z')
    });

    expect(fileName).toBe('堅鋼礦 - 一般採集秘笈 - 2026-05-24.json');
  });

  it('exports regular rotations as stable action codes instead of localized names', () => {
    const resultModelVersions = {
      exportSchema: 1,
      app: '0.9.0-test',
      regularSolver: 'regular-solver-v0-test'
    };
    const result: SolverResponse = {
      modelVersions: resultModelVersions,
      bestRotation: ['採集', '理智同興(若觸發)', '採集(理智觸發)'],
      rotationPlans: [{
        kind: 'primary',
        rotation: ['採集', '理智同興(若觸發)', '採集(理智觸發)'],
        expectedYield: 1,
        minYield: 0,
        maxYield: 2,
        minYieldChance: 1,
        maxYieldChance: 1
      }],
      revisit: {
        enabled: false,
        chance: 0,
        isFullGp: false
      },
      expectedYield: 1,
      minYield: 0,
      maxYield: 2,
      minYieldChance: 1,
      maxYieldChance: 1,
      objectiveMode: 'expected',
      calculationTime: 1,
      debug: {
        modelVersions: buildModelVersionsForScenario('tome.regular'),
        formulas: {
          success: {
            gathering: 5345,
            baseGathering: 5085,
            score: 100,
            rawRate: 100,
            levelDifference: 0,
            levelModifier: 0,
            finalRate: 100
          },
          boon: {
            perception: 5137,
            basePerception: 5085,
            score: 100,
            finalRate: 100
          },
          bountiful: {
            gathering: 5345,
            baseGathering: 5085,
            plusTwoThreshold: 4576,
            plusThreeThreshold: 5593,
            amount: 2
          },
          gather: {
            gpRecoveredPerGather: 6,
            baseIntegrity: 6,
            bonusIntegrity: 0,
            maxIntegrity: 6,
            nodeYieldBonus: 0,
            nodeBoonBonus: 0
          }
        },
        plans: [{
          kind: 'primary',
          startingGp: 930,
          expectedYield: 1,
          minYield: 0,
          maxYield: 2,
          outcomeDistribution: [{ yield: 2, probability: 100 }],
          search: {
            startingGp: 930,
            statesSolved: 12,
            memoHits: 3,
            memoHitRate: 20,
            memoCapacityPower: 20,
            memoCapacity: 1048576,
            memoCapacityUsable: 891288,
            actionsEvaluated: 30,
            candidateComparisons: 24,
            terminalStates: 4,
            branchCount: 18
          }
        }],
        combined: {
          expectedYield: 1,
          revisitChance: 0,
          expression: '1'
        },
        optimality: {
          engine: 'wasm-core',
          method: 'dynamic-programming-exhaustive-search',
          stateKeyFields: ['gp'],
          stateKeyEngine: 'wasm-packed'
        }
      }
    };
    const payload = buildRegularSolverJsonExport({
      meta: {},
      item,
      request: {
        ...request,
        baseValues: {
          ...request.baseValues,
          unused: 999
        } as SolverRequest['baseValues']
      },
      result,
      food: {
        selection: { foodId: null, quality: 'nq' }
      }
    }) as any;

    expect(payload.solver.rotations[0].rotation).toEqual([
      { type: 'gather', code: 'gather' },
      { type: 'action', code: 'wise', actionId: 26521, condition: 'wiseToTheWorld' },
      { type: 'gather', code: 'gather', condition: 'wiseToTheWorld' }
    ]);
    expect(JSON.stringify(payload.solver.rotations[0].rotation)).not.toContain('採集');
    expect(JSON.stringify(payload.solver.rotations[0].rotation)).not.toContain('理智同興');
    expect(payload.input.baseValues).toEqual({
      Gathering: 5085,
      Perception: 5085
    });
    expect(payload.modelVersions).toEqual({
      exportSchema: 1,
      app: '0.9.0-test',
      regularSolver: 'regular-solver-v0-test'
    });
    expect(payload.solver.search).toMatchObject({
      engine: 'wasm-core',
      stateKeyEngine: 'wasm-packed'
    });
    expect(payload.solver.plans[0].search).toMatchObject({
      memoCapacityPower: 20,
      memoCapacity: 1048576,
      memoCapacityUsable: 891288
    });
    expect(payload.solver.plans[0].outcomeDistribution).toEqual([{ yield: 2, probability: 100 }]);
  });

  it('marks collectable solver output as strategy-rule codec', () => {
    const collectableRequest: CollectableSolverRequest = {
      stats: {
        level: 100,
        gathering: 5345,
        perception: 5173,
        gp: 930
      },
      baseValues: {
        Gathering: 5085,
        Perception: 5085
      },
      itemLevel: 100,
      nodeBonuses: {
        baseIntegrity: 3,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      temporaryGp: 930,
      jobType: 'miner',
      isTimedNode: false,
      rewardTable: {
        itemId: 43922,
        source: 'collectables',
        tiers: {
          low: { collectability: 600, reward: { exp: 0, gil: 0, scrip: 16, items: {} } },
          mid: { collectability: 800, reward: { exp: 0, gil: 0, scrip: 23, items: {} } },
          high: { collectability: 1000, reward: { exp: 0, gil: 0, scrip: 38, items: {} } }
        }
      },
      objective: { kind: 'scrip' },
      objectiveMode: 'expected',
      debugMode: true
    };
    const result = solveCollectableRotation(collectableRequest);
    const payload = buildCollectableSolverJsonExport({
      meta: {},
      item: {
        ...item,
        itemId: 43922,
        nameLocale: '收藏用黑鐵礦',
        nameEn: "Rarefied Ra'Kaznar Ore",
        isTimedNode: false,
        isCollectable: true
      },
      request: collectableRequest,
      result,
      food: {
        selection: { foodId: null, quality: 'nq' }
      }
    }) as any;

    expect(payload.strategyCodec.encoding).toBe('collectable-policy-strategy-rules-v1');
    expect(payload.modelVersions).toMatchObject({
      exportSchema: 1,
      app: TOME_MODEL_VERSION_CATALOG.app.version,
      collectableSolver: 'collectable-solver-v1',
      collectableStrategyCodec: 'collectable-policy-strategy-rules-v1'
    });
    expect('entries' in payload.strategyCodec.plans[0]).toBe(false);
  });
});
