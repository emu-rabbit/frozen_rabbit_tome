import { describe, expect, it } from 'vitest';
import {
  __parseCollectableRewardsForTest,
  summarizeCollectableRewardTable
} from './collectableRewards';

describe('collectableRewards', () => {
  it('將 Teamcraft collectables.json 剪枝成求解器需要的 reward table', () => {
    const tables = __parseCollectableRewardsForTest({
      '12713': {
        reward: 33914,
        base: {
          rating: 49,
          exp: 66,
          scrip: 6
        },
        mid: {
          rating: 81,
          exp: 72,
          scrip: 7
        },
        high: {
          rating: 114,
          exp: 79,
          scrip: 11
        }
      }
    });

    const table = tables.get(12713);

    expect(table).toMatchObject({
      itemId: 12713,
      source: 'collectables',
      rewardItemId: 33914,
      tiers: {
        low: {
          collectability: 49,
          reward: { exp: 0, gil: 0, scrip: 6, items: {} }
        },
        mid: {
          collectability: 81,
          reward: { exp: 0, gil: 0, scrip: 7, items: {} }
        },
        high: {
          collectability: 114,
          reward: { exp: 0, gil: 0, scrip: 11, items: {} }
        }
      }
    });
  });

  it('忽略缺少 base 或 mid 的資料列', () => {
    const tables = __parseCollectableRewardsForTest({
      '1': {
        base: {
          rating: 100,
          scrip: 1
        }
      },
      '2': {
        mid: {
          rating: 200,
          scrip: 2
        }
      }
    });

    expect(tables.size).toBe(0);
  });

  it('可建立藏書庫使用的 reward table summary', () => {
    const tables = __parseCollectableRewardsForTest({
      '12713': {
        reward: 33914,
        base: { rating: 49, scrip: 6 },
        mid: { rating: 81, scrip: 7 },
        high: { rating: 114, scrip: 11 }
      }
    });

    expect(summarizeCollectableRewardTable(tables.get(12713)!)).toEqual({
      source: 'collectables',
      rewardItemId: 33914,
      lowCollectability: 49,
      lowScrip: 6,
      midCollectability: 81,
      midScrip: 7,
      highCollectability: 114,
      highScrip: 11
    });
  });
});
