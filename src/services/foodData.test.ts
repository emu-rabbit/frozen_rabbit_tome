import { describe, expect, it } from 'vitest';
import { applyFoodBonus, calculateFoodBonus } from './foodData';
import type { GatheringFood, PlayerStats } from '../types/game';

const stats: PlayerStats = {
  level: 100,
  gathering: 5000,
  perception: 4000,
  gp: 900
};

const food: GatheringFood = {
  id: 1,
  levelItem: 1,
  levelEquip: 1,
  bonuses: {
    Gathering: {
      nq: { value: 6, max: 150 },
      hq: { value: 7, max: 188 }
    },
    GP: {
      nq: { value: 4, max: 25 },
      hq: { value: 5, max: 31 }
    }
  }
};

describe('foodData', () => {
  it('依照品質套用比例並受上限限制', () => {
    expect(calculateFoodBonus(stats, food, 'nq')).toEqual({
      gathering: 150,
      perception: 0,
      gp: 25
    });

    expect(calculateFoodBonus(stats, food, 'hq')).toEqual({
      gathering: 188,
      perception: 0,
      gp: 31
    });
  });

  it('將食物加成加到演算用玩家數值，但保留等級不變', () => {
    const bonus = calculateFoodBonus(stats, food, 'hq');

    expect(applyFoodBonus(stats, bonus)).toEqual({
      level: 100,
      gathering: 5188,
      perception: 4000,
      gp: 931
    });
  });
});
