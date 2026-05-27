import { describe, expect, it } from 'vitest';
import { parseTomeJsonImport, isImportMismatch, TomeJsonImportError } from './tomeJsonImport';

const basePayload = {
  manifest: {
    app: 'frozen_rabbit_tome',
    schemaVersion: 1,
    version: '0.9.1',
    commit: null,
    generatedAt: '2026-05-27T00:00:00.000Z',
    locale: 'tw',
    limitations: []
  },
  modelVersions: {
    exportSchema: 1,
    app: '0.9.1'
  },
  subject: {
    surface: 'solver',
    itemKind: 'regular',
    item: {
      itemId: 123,
      nameLocale: '堅鋼礦',
      nameEn: 'Adamantite Ore',
      glv: 100,
      jobType: 'miner',
      jobTypes: ['miner'],
      isTimedNode: false,
      isCollectable: false
    }
  },
  input: {
    player: {
      baseStats: {
        level: 100,
        gathering: 5000,
        perception: 4900,
        gp: 930
      },
      effectiveStats: {
        level: 100,
        gathering: 5100,
        perception: 5000,
        gp: 980
      },
      temporaryGp: 900,
      food: {
        selection: {
          foodId: null,
          quality: 'hq'
        },
        appliedBonus: null
      }
    },
    itemLevel: 700,
    baseValues: {
      Gathering: 4800,
      Perception: 4800
    },
    jobType: 'miner',
    isTimedNode: false,
    node: {
      bonuses: {
        baseIntegrity: 6,
        gatheringCount: 1,
        yieldCount: 2,
        extraRate: 10
      },
      maxIntegrity: 7
    }
  }
};

describe('tomeJsonImport', () => {
  it('projects regular tome exports into a saved tome draft', () => {
    const projection = parseTomeJsonImport(JSON.stringify({
      ...basePayload,
      manifest: {
        ...basePayload.manifest,
        scenario: 'tome.regular'
      },
      solver: {
        objectiveMode: 'expected',
        rotations: [{
          kind: 'primary',
          expectedYield: 12,
          minYield: 8,
          maxYield: 16,
          rotation: [
            { type: 'gather', code: 'gather' },
            { type: 'action', code: 'wise', actionId: 26521, condition: 'wiseToTheWorld' }
          ]
        }],
        combined: {
          expectedYield: 12,
          minYield: 8,
          maxYield: 16,
          minYieldChance: 5,
          maxYieldChance: 10,
          revisit: {
            enabled: false,
            chance: 0,
            isFullGp: false
          }
        }
      }
    }));

    expect(projection.sourceType).toBe('tome');
    expect(projection.tome.kind).toBe('regular');
    expect(projection.tome.input.stats.gathering).toBe(5000);
    expect(projection.tome.lastSolvedSnapshot?.kind).toBe('regular');
    if (projection.tome.lastSolvedSnapshot?.kind !== 'regular') {
      throw new Error('Expected regular tome snapshot');
    }
    expect(projection.tome.lastSolvedSnapshot.rotation).toEqual([
      { type: 'gather', actionName: '採集' },
      { type: 'action', actionId: 26521, actionName: '理智同興(若觸發)' }
    ]);
    expect(isImportMismatch('tomeLibrary', projection)).toBe(false);
  });

  it('keeps experiment exports headed to the experiment database after a library upload warning', () => {
    const projection = parseTomeJsonImport(JSON.stringify({
      ...basePayload,
      manifest: {
        ...basePayload.manifest,
        scenario: 'experiment.regular'
      },
      subject: {
        ...basePayload.subject,
        surface: 'experiment'
      },
      strategy: {
        primaryRotation: [
          { type: 'gather', code: 'gather' }
        ],
        revisitRotation: [],
        includeRevisit: false
      },
      analyzer: {
        modelVersions: {
          exportSchema: 1,
          app: '0.9.1',
          regularAnalyzer: 'regular-analyzer-v1'
        },
        primary: {
          expectedYield: 6,
          minYield: 4,
          maxYield: 8
        },
        total: {
          expectedYield: 6,
          minYield: 4,
          maxYield: 8,
          minYieldChance: 12,
          maxYieldChance: 18
        },
        revisitChance: 0
      }
    }));

    expect(projection.sourceType).toBe('experiment');
    expect(projection.experiment.kind).toBe('regular');
    expect(projection.experiment.strategy.kind).toBe('regular');
    expect(isImportMismatch('tomeLibrary', projection)).toBe(true);
  });

  it('reports invalid JSON with a typed import error', () => {
    expect(() => parseTomeJsonImport('{')).toThrow(TomeJsonImportError);
  });
});
