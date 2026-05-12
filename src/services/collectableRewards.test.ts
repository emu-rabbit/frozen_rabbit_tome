import { describe, expect, it } from 'vitest';
import {
  __parseBankaRewardsForTest,
  __parseCustomDeliveryRewardsForTest,
  __parseCollectableRewardsForTest,
  __parseCsvForTest,
  __parseSharlayanRewardsForTest,
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

  it('可解析含引號與逗號的 CSV 欄位', () => {
    expect(__parseCsvForTest('#,Name,Value\n1,"A, B",10\n')).toEqual([
      { '#': '1', Name: 'A, B', Value: '10' }
    ]);
  });

  it('解析老主顧獎勵時優先採用大地橘票，其次才採用大地紫票', () => {
    const supplyCsv = [
      '#,Item,CollectabilityLow,CollectabilityMid,CollectabilityHigh,Reward',
      '1.1,17557,240,450,600,2'
    ].join('\n');
    const rewardCsv = [
      '#,SatisfactionSupplyRewardData[0].RewardCurrency,SatisfactionSupplyRewardData[0].QuantityLow,SatisfactionSupplyRewardData[0].QuantityMid,SatisfactionSupplyRewardData[0].QuantityHigh,SatisfactionSupplyRewardData[1].RewardCurrency,SatisfactionSupplyRewardData[1].QuantityLow,SatisfactionSupplyRewardData[1].QuantityMid,SatisfactionSupplyRewardData[1].QuantityHigh,SatisfactionLow,SatisfactionMid,SatisfactionHigh,GilLow,GilMid,GilHigh,BonusMultiplier,MinLevelForSecondReward',
      '2,4,94,117,140,7,82,100,116,30,30,30,670,840,1000,100,0'
    ].join('\n');

    expect(__parseCustomDeliveryRewardsForTest(supplyCsv, rewardCsv).get(17557)).toMatchObject({
      source: 'customDelivery',
      rewardItemId: 41785,
      tiers: {
        low: { collectability: 240, reward: { scrip: 82, gil: 670 } },
        mid: { collectability: 450, reward: { scrip: 100, gil: 840 } },
        high: { collectability: 600, reward: { scrip: 116, gil: 1000 } }
      }
    });
  });

  it('可解析薩雷安魔法大學採集收藏品的兩檔票據獎勵', () => {
    const csv = [
      '#,Item[0].ItemId,Item[0].XPReward,Item[0].CollectabilityMid,Item[0].CollectabilityHigh,Item[0].GilReward,Item[0].Level,Item[0].HighXPMultiplier,Item[0].HighGilMultiplier,Item[0].Unknown8,Item[0].ScripReward,Item[0].HighScripMultiplier',
      '3,35600,437416,240,600,213,80,150,150,4,100,150'
    ].join('\n');

    expect(__parseSharlayanRewardsForTest(csv).get(35600)).toMatchObject({
      source: 'sharlayanStudium',
      rewardItemId: 33914,
      tiers: {
        low: { collectability: 240, reward: { exp: 437416, gil: 213, scrip: 100 } },
        mid: { collectability: 600, reward: { exp: 656124, gil: 319, scrip: 150 } }
      }
    });
  });

  it('可解析珠串萬貨街採集收藏品並串接 CollectablesRefine 門檻', () => {
    const supplyCsv = [
      '#,Item[0].ItemId,Item[0].XPReward,Item[0].Collectability,Item[0].GilReward,Item[0].Level,Item[0].HighXPMultiplier,Item[0].HighGilMultiplier,Item[0].Unknown8,Item[0].ScripReward,Item[0].HighScripMultiplier',
      '3,43899,969294,13,240,90,150,150,4,100,150'
    ].join('\n');
    const refineCsv = [
      '#,CollectabilityLow,CollectabilityMid,CollectabilityHigh',
      '13,240,600,0'
    ].join('\n');

    expect(__parseBankaRewardsForTest(supplyCsv, refineCsv).get(43899)).toMatchObject({
      source: 'wachumeqimeqi',
      rewardItemId: 41785,
      tiers: {
        low: { collectability: 240, reward: { exp: 969294, gil: 240, scrip: 100 } },
        mid: { collectability: 600, reward: { exp: 1453941, gil: 360, scrip: 150 } }
      }
    });
  });
});
