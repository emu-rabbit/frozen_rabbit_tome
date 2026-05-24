import { describe, expect, it } from 'vitest';
import { solveGatheringRotation } from './rotationSolver';
import type { SolverRequest, SolverRotationPlan } from '../types/game';

function createRequest(overrides: Partial<SolverRequest> = {}): SolverRequest {
  return {
    stats: {
      level: 100,
      gathering: 1200,
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
    debugMode: true,
    ...overrides
  };
}

function expectPlanSummary(
  plan: SolverRotationPlan,
  expected: Pick<SolverRotationPlan, 'rotation' | 'expectedYield' | 'minYield' | 'maxYield'>
) {
  expect(plan.rotation).toEqual(expected.rotation);
  expect(plan.expectedYield).toBeCloseTo(expected.expectedYield, 8);
  expect(plan.minYield).toBe(expected.minYield);
  expect(plan.maxYield).toBe(expected.maxYield);
}

describe('regular gathering rotation shape contract', () => {
  it('等價時會把下一次採集技能提前到採集前段施放', () => {
    const result = solveGatheringRotation(createRequest({
      stats: {
        level: 100,
        gathering: 1200,
        perception: 1000,
        gp: 100
      },
      nodeBonuses: {
        baseIntegrity: 2,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      temporaryGp: 100
    }));

    expectPlanSummary(result.rotationPlans[0], {
      rotation: ['高產II', '採集', '採集'],
      expectedYield: 5.7,
      minYield: 5,
      maxYield: 7
    });
  });

  it('等價時會先排全域技能，且饋贈與福音保持相鄰', () => {
    const result = solveGatheringRotation(createRequest({
      stats: {
        level: 100,
        gathering: 800,
        perception: 1000,
        gp: 400
      },
      nodeBonuses: {
        baseIntegrity: 10,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      temporaryGp: 400,
      jobType: 'botanist'
    }));

    expectPlanSummary(result.rotationPlans[0], {
      rotation: [
        '沃土的饋贈II',
        '沃土的饋贈I',
        '諾菲卡福音',
        '採集',
        '採集',
        '採集',
        '採集',
        '採集',
        '採集',
        '採集',
        '採集',
        '採集',
        '豐收II',
        '採集'
      ],
      expectedYield: 26,
      minYield: 11,
      maxYield: 31
    });
  });

  it('90 級以上會把理智同興排在觸發石工之理後面', () => {
    const result = solveGatheringRotation(createRequest({
      stats: {
        level: 90,
        gathering: 1200,
        perception: 1000,
        gp: 300
      },
      nodeBonuses: {
        baseIntegrity: 4,
        gatheringCount: 0,
        yieldCount: 50,
        extraRate: 0
      },
      temporaryGp: 300
    }));

    expectPlanSummary(result.rotationPlans[0], {
      rotation: [
        '採集',
        '採集',
        '石工之理',
        '理智同興(若觸發)',
        '採集',
        '採集',
        '採集',
        '採集(理智觸發)'
      ],
      expectedYield: 282.425,
      minYield: 255,
      maxYield: 312
    });
  });

  it('GP 不滿時會保留 primary 與 Revisit 兩組可見手法順序', () => {
    const result = solveGatheringRotation(createRequest({
      temporaryGp: 300
    }));

    expect(result.rotationPlans.map((plan) => plan.kind)).toEqual(['primary', 'revisit']);
    expectPlanSummary(result.rotationPlans[0], {
      rotation: [
        '高產II',
        '採集',
        '高產II',
        '採集',
        '高產II',
        '採集',
        '採集'
      ],
      expectedYield: 14.4,
      minYield: 13,
      maxYield: 17
    });
    expectPlanSummary(result.rotationPlans[1], {
      rotation: [
        '莫非王土II',
        '高產II',
        '採集',
        '高產II',
        '採集',
        '高產II',
        '採集',
        '高產II',
        '採集'
      ],
      expectedYield: 25.4,
      minYield: 24,
      maxYield: 28
    });
  });

  it('min 與 max 模式在同分時會保留短 rotation', () => {
    for (const objectiveMode of ['min', 'max'] as const) {
      const result = solveGatheringRotation(createRequest({
        stats: {
          level: 10,
          gathering: 280,
          perception: 1000,
          gp: 250
        },
        itemLevel: 10,
        nodeBonuses: {
          baseIntegrity: 4,
          gatheringCount: 0,
          yieldCount: 0,
          extraRate: 0
        },
        temporaryGp: 250,
        objectiveMode
      }));

      expect(result.objectiveMode).toBe(objectiveMode);
      expectPlanSummary(result.rotationPlans[0], {
        rotation: ['採集', '採集', '採集', '採集'],
        expectedYield: 1.728,
        minYield: 0,
        maxYield: 8
      });
    }
  });
});
