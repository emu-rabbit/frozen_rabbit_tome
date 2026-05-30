import { describe, expect, it } from 'vitest';
import { buildFrontierModelVersionsForScenario } from '../frontierModelVersions';
import {
  FrontierCollectableJsonImportError,
  buildFrontierCollectableJsonExport,
  parseFrontierCollectableJsonImport
} from './frontierCollectableExport';
import type {
  FrontierCollectableAnalysisResult,
  FrontierCollectableSimulationRequest
} from './frontierCollectableTypes';
import type { CollectableRewardTable } from '../../types/collectable';
import type { GatherableItem } from '../../types/game';

const item: GatherableItem = {
  itemId: 123,
  nameEn: 'Test Collectable',
  nameLocale: '測試收藏品',
  glv: 700,
  iconUrl: '',
  isFallback: false,
  isCollectable: true,
  jobType: 'miner',
  jobTypes: ['miner'],
  gatheringItemId: 456,
  perceptionReq: 0,
  isTimedNode: false
};

const rewardTable: CollectableRewardTable = {
  itemId: 123,
  source: 'collectables',
  rewardItemId: 33914,
  tiers: {
    low: { collectability: 100, reward: { exp: 0, gil: 0, scrip: 10, items: {} } },
    mid: { collectability: 200, reward: { exp: 0, gil: 0, scrip: 20, items: {} } },
    high: { collectability: 300, reward: { exp: 0, gil: 0, scrip: 30, items: {} } }
  }
};

const request: FrontierCollectableSimulationRequest = {
  itemId: 123,
  stats: { level: 100, gathering: 5000, perception: 5000, gp: 930 },
  baseValues: { Gathering: 4800, Perception: 4800 },
  itemLevel: 100,
  nodeBonuses: { baseIntegrity: 4, gatheringCount: 0, yieldCount: 0, extraRate: 0 },
  temporaryGp: 930,
  jobType: 'miner',
  isTimedNode: false,
  hasRelicToolBonus: true,
  rewardTable,
  objective: { kind: 'scrip' },
  probabilityProfile: {
    brazenBuckets: [{ id: '100', multiplierPercent: 100, probabilityPercent: 100 }],
    standardProcRatePercent: 25,
    highStandardProcRatePercent: null
  },
  strategy: [{
    id: 'collect',
    name: 'Collect',
    enabled: true,
    mode: 'all',
    conditions: [],
    actions: ['collect']
  }]
};

const analysis: FrontierCollectableAnalysisResult = {
  modelVersions: buildFrontierModelVersionsForScenario('frontier.collectable'),
  expectedScore: 10,
  minScore: 0,
  maxScore: 10,
  minScoreChance: 10,
  maxScoreChance: 90,
  expectedTierCounts: { none: 0, low: 1, mid: 0, high: 0 },
  outcomeDistribution: [{ score: 10, probability: 100 }],
  collectabilityDistribution: [{ collectability: 100, probability: 100 }],
  terminalStateSummary: { terminalStates: 1, uncoveredStates: 0, limitedStates: 0 },
  limited: false,
  stateCount: 1,
  transitionCount: 1,
  assumptionsUsed: ['frontier-user-supplied-probabilities', 'brazen-distribution-user-supplied', 'not-a-solver']
};

describe('frontierCollectableExport', () => {
  it('round-trips a Frontier collectable JSON payload into a study draft', () => {
    const payload = buildFrontierCollectableJsonExport({
      item,
      request,
      analysis,
      food: {
        selection: { foodId: null, quality: 'hq' },
        baseStats: request.stats
      },
      generatedAt: '2026-05-30T00:00:00.000Z'
    });

    const projection = parseFrontierCollectableJsonImport(JSON.stringify(payload));

    expect(projection.defaultName).toBe('測試收藏品 開拓研究');
    expect(projection.study.schemaVersion).toBe(2);
    expect(projection.study.itemId).toBe(123);
    expect(projection.study.input.hasRelicToolBonus).toBe(true);
    expect(projection.study.probabilityProfile.brazenBuckets).toEqual(request.probabilityProfile.brazenBuckets);
    expect(projection.study.strategy).toEqual(request.strategy);
    expect(projection.study.lastAnalysisSnapshot?.expectedScore).toBe(10);
  });

  it('rejects non-Frontier scenarios', () => {
    expect(() => parseFrontierCollectableJsonImport(JSON.stringify({
      manifest: { scenario: 'experiment.collectable' }
    }))).toThrow(FrontierCollectableJsonImportError);
  });
});
