import { describe, expect, it } from 'vitest';
import { solveGatheringRotation } from './rotationSolver';
import type { SolverRequest } from '../types/game';

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
    ...overrides
  };
}

describe('solveGatheringRotation', () => {
  it('不會疊加敏銳視野系列', () => {
    const result = solveGatheringRotation(createRequest({
      stats: {
        level: 100,
        gathering: 700,
        perception: 1000,
        gp: 400
      },
      temporaryGp: 400
    }));

    const successBuffs = result.bestRotation.filter((action) => action.startsWith('敏銳視野'));
    expect(successBuffs.length).toBeLessThanOrEqual(1);
  });

  it('不會疊加富礦的饋贈 I 與 II', () => {
    const result = solveGatheringRotation(createRequest({
      stats: {
        level: 100,
        gathering: 1200,
        perception: 800,
        gp: 150
      },
      temporaryGp: 150
    }));

    const giftBuffs = result.bestRotation.filter((action) => action.startsWith('富礦的饋贈'));
    expect(giftBuffs.length).toBeLessThanOrEqual(1);
  });

  it('90 級以上會在耐久缺 2 點後把理智同興視為 0 GP 條件動作', () => {
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

    const restoreIndex = result.bestRotation.indexOf('石工之理');
    const wiseIndex = result.bestRotation.indexOf('理智同興(若觸發)');
    const wiseProcGatherIndex = result.bestRotation.indexOf('採集(理智觸發)');

    expect(restoreIndex).toBeGreaterThan(1);
    expect(wiseIndex).toBe(restoreIndex + 1);
    expect(wiseProcGatherIndex).toBeGreaterThan(wiseIndex);
  });

  it('莫非王土系列只會選擇一種整點獲得量加成', () => {
    const result = solveGatheringRotation(createRequest({
      stats: {
        level: 100,
        gathering: 1200,
        perception: 1000,
        gp: 900
      },
      temporaryGp: 900
    }));

    const kingBuffs = result.bestRotation.filter((action) => action.startsWith('莫非王土'));
    expect(kingBuffs.length).toBeLessThanOrEqual(1);
  });

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

    expect(result.bestRotation[0]).toBe('高產II');
  });

  it('等價時會讓饋贈與福音緊鄰，並先饋贈再福音', () => {
    const result = solveGatheringRotation(createRequest({
      stats: {
        level: 100,
        gathering: 800,
        perception: 1000,
        gp: 300
      },
      nodeBonuses: {
        baseIntegrity: 10,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      temporaryGp: 300
    }));

    const giftIndex = result.bestRotation.findIndex((action) => action.startsWith('富礦的饋贈'));
    const tidingsIndex = result.bestRotation.indexOf('納爾札爾福音');

    expect(giftIndex).toBeGreaterThanOrEqual(0);
    expect(tidingsIndex).toBe(giftIndex + 1);
  });

  it('等價時會優先施放全域技能，再施放下一次採集技能', () => {
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

    const giftIndex = result.bestRotation.indexOf('沃土的饋贈II');
    const tidingsIndex = result.bestRotation.indexOf('諾菲卡福音');
    const bountifulIndex = result.bestRotation.indexOf('豐收II');

    expect(giftIndex).toBeGreaterThanOrEqual(0);
    expect(tidingsIndex).toBe(giftIndex + 1);
    expect(bountifulIndex).toBeGreaterThan(tidingsIndex);
  });
});
