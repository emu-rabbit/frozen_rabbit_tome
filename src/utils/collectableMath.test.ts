import { describe, expect, it } from 'vitest';
import {
  calculateCollectableMeticulousGain,
  calculateCollectableScourGain,
  calculateCollectableScourValue,
  applyRelicToolValueIncreaseBonus,
  calculateFocusedValueIncreaseRate,
  calculateMeticulousProcRate,
  calculatePrimedMeticulousProcRate,
  calculateScrutinyMultiplier,
  calculateValueIncreaseRate,
  getCollectableRewardTier,
  scoreCollectableReward
} from './collectableMath';
import type { CollectableRewardTable } from '../types/collectable';

describe('collectable math', () => {
  it('依獲得力分段計算 Scour 提煉基礎值', () => {
    expect(calculateCollectableScourValue(66, 100)).toBe(150);
    expect(calculateCollectableScourValue(67, 100)).toBe(152);
    expect(calculateCollectableScourValue(85, 100)).toBe(190);
    expect(calculateCollectableScourValue(86, 100)).toBe(191);
    expect(calculateCollectableScourValue(95, 100)).toBe(200);
    expect(calculateCollectableScourValue(140, 100)).toBe(200);
  });

  it('依獲得力分段計算價值提升率與價值矚目倍率', () => {
    expect(calculateValueIncreaseRate(66, 100)).toBe(10);
    expect(calculateValueIncreaseRate(67, 100)).toBe(10);
    expect(calculateValueIncreaseRate(85, 100)).toBe(20);
    expect(calculateValueIncreaseRate(86, 100)).toBe(21);
    expect(calculateValueIncreaseRate(100, 100)).toBe(40);
    expect(calculateFocusedValueIncreaseRate(40)).toBe(70);
    expect(applyRelicToolValueIncreaseBonus(40)).toBe(60);
    expect(calculateFocusedValueIncreaseRate(applyRelicToolValueIncreaseBonus(40))).toBe(100);
  });

  it('依獲得力分段計算慎重提煉不耗耐久率與預備碰觸倍率', () => {
    expect(calculateMeticulousProcRate(66, 100)).toBe(5);
    expect(calculateMeticulousProcRate(67, 100)).toBe(5);
    expect(calculateMeticulousProcRate(85, 100)).toBe(10);
    expect(calculateMeticulousProcRate(86, 100)).toBe(11);
    expect(calculateMeticulousProcRate(100, 100)).toBe(25);
    expect(calculatePrimedMeticulousProcRate(25)).toBe(50);
  });

  it('依鑑別力分段計算集中檢查倍率', () => {
    expect(calculateScrutinyMultiplier(66, 100)).toBe(90);
    expect(calculateScrutinyMultiplier(67, 100)).toBe(91);
    expect(calculateScrutinyMultiplier(85, 100)).toBe(115);
    expect(calculateScrutinyMultiplier(86, 100)).toBe(116);
    expect(calculateScrutinyMultiplier(95, 100)).toBe(125);
  });

  it('符合最大值 case 的 Scour 與 Meticulous 提升量', () => {
    const scourValue = 200;
    const scrutinyMultiplier = 125;

    expect(calculateCollectableScourGain({
      scourValue,
      scrutinyMultiplier,
      scrutinyActive: false,
      valueIncrease: false
    })).toBe(200);
    expect(calculateCollectableScourGain({
      scourValue,
      scrutinyMultiplier,
      scrutinyActive: false,
      valueIncrease: true
    })).toBe(300);
    expect(calculateCollectableMeticulousGain({
      scourValue,
      scrutinyMultiplier,
      scrutinyActive: false,
      standardActive: false,
      valueIncrease: false
    })).toBe(150);
    expect(calculateCollectableMeticulousGain({
      scourValue,
      scrutinyMultiplier,
      scrutinyActive: false,
      standardActive: false,
      valueIncrease: true
    })).toBe(250);
    expect(calculateCollectableMeticulousGain({
      scourValue,
      scrutinyMultiplier,
      scrutinyActive: false,
      standardActive: true,
      valueIncrease: false
    })).toBe(200);
    expect(calculateCollectableMeticulousGain({
      scourValue,
      scrutinyMultiplier,
      scrutinyActive: false,
      standardActive: true,
      valueIncrease: true
    })).toBe(300);
  });

  it('符合最大值 case 的 Scrutiny 提升量', () => {
    const scourValue = 200;
    const scrutinyMultiplier = 125;

    expect(calculateCollectableScourGain({
      scourValue,
      scrutinyMultiplier,
      scrutinyActive: true,
      valueIncrease: false
    })).toBe(450);
    expect(calculateCollectableScourGain({
      scourValue,
      scrutinyMultiplier,
      scrutinyActive: true,
      valueIncrease: true
    })).toBe(550);
    expect(calculateCollectableMeticulousGain({
      scourValue,
      scrutinyMultiplier,
      scrutinyActive: true,
      standardActive: false,
      valueIncrease: false
    })).toBe(400);
    expect(calculateCollectableMeticulousGain({
      scourValue,
      scrutinyMultiplier,
      scrutinyActive: true,
      standardActive: false,
      valueIncrease: true
    })).toBe(500);
    expect(calculateCollectableMeticulousGain({
      scourValue,
      scrutinyMultiplier,
      scrutinyActive: true,
      standardActive: true,
      valueIncrease: false
    })).toBe(450);
    expect(calculateCollectableMeticulousGain({
      scourValue,
      scrutinyMultiplier,
      scrutinyActive: true,
      standardActive: true,
      valueIncrease: true
    })).toBe(550);
  });

  it('判定收藏品 reward tier 時不把 high=0 誤判成最高檔', () => {
    const table: CollectableRewardTable = {
      itemId: 1,
      source: 'collectables',
      tiers: {
        low: { collectability: 100, reward: { exp: 0, gil: 0, scrip: 1, items: {} } },
        mid: { collectability: 300, reward: { exp: 0, gil: 0, scrip: 2, items: {} } },
        high: { collectability: 0, reward: { exp: 0, gil: 0, scrip: 3, items: {} } }
      }
    };

    expect(getCollectableRewardTier(99, table)).toBe('none');
    expect(getCollectableRewardTier(100, table)).toBe('low');
    expect(getCollectableRewardTier(300, table)).toBe('mid');
    expect(getCollectableRewardTier(1000, table)).toBe('mid');
  });

  it('可依 objective 將 reward vector 轉成分數', () => {
    const reward = {
      exp: 100,
      gil: 25,
      scrip: 12,
      items: { 99: 3 }
    };

    expect(scoreCollectableReward(reward, { kind: 'scrip' })).toBe(12);
    expect(scoreCollectableReward(reward, { kind: 'exp' })).toBe(100);
    expect(scoreCollectableReward(reward, {
      kind: 'custom',
      weights: {
        scrip: 2,
        items: { 99: 10 }
      }
    })).toBe(54);
  });
});
