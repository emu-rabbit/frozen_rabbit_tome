import { describe, expect, it } from 'vitest';
import {
  calculateBoonChance,
  calculateBountifulYield,
  calculateSuccessRate
} from './gatheringMath';

describe('gathering math', () => {
  it.each([
    [0, 0],
    [1, 1],
    [10, 1],
    [11, 2],
    [20, 20],
    [21, 21],
    [40, 52],
    [41, 54],
    [43, 58],
    [44, 58],
    [45, 60],
    [46, 60],
    [63, 70],
    [64, 72],
    [75, 94],
    [76, 95],
    [79, 98],
    [80, 100],
    [120, 100]
  ])('依獲得力分數 %i 計算無等級差基礎成功率 %i%%', (score, expectedRate) => {
    expect(calculateSuccessRate(score, 100, 100, 100)).toBe(expectedRate);
  });

  it('成功率公式會套用等級修正並限制在 0 到 100', () => {
    expect(calculateSuccessRate(45, 100, 105, 100)).toBe(65);
    expect(calculateSuccessRate(45, 100, 110, 100)).toBe(65);
    expect(calculateSuccessRate(45, 100, 99, 100)).toBe(55);
    expect(calculateSuccessRate(45, 100, 90, 100)).toBe(35);
    expect(calculateSuccessRate(1, 100, 90, 100)).toBe(0);
    expect(calculateSuccessRate(80, 100, 90, 100)).toBe(100);
  });

  it('缺少基礎獲得力時成功率為 0', () => {
    expect(calculateSuccessRate(5000, 0, 100, 100)).toBe(0);
  });

  it.each([
    [59, 0],
    [60, 0],
    [61, 1],
    [69, 9],
    [70, 10],
    [79, 14],
    [80, 15],
    [99, 34],
    [100, 35],
    [125, 47],
    [150, 60],
    [200, 60]
  ])('依鑑別力分數 %i 計算獲得力加成率 %i%%', (score, expectedRate) => {
    expect(calculateBoonChance(score, 100)).toBe(expectedRate);
  });

  it('缺少基礎鑑別力時獲得力加成率為 0', () => {
    expect(calculateBoonChance(5000, 0)).toBe(0);
  });

  it('依基礎獲得力門檻計算高產/豐收加成量', () => {
    expect(calculateBountifulYield(899, 1000)).toBe(1);
    expect(calculateBountifulYield(900, 1000)).toBe(2);
    expect(calculateBountifulYield(1099, 1000)).toBe(2);
    expect(calculateBountifulYield(1100, 1000)).toBe(3);
  });

  it('缺少基礎獲得力時高產/豐收保留基礎 +1', () => {
    expect(calculateBountifulYield(5000, 0)).toBe(1);
  });
});
