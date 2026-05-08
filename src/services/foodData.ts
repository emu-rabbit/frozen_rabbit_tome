import gatheringFoods from '../data/gathering-foods.json';
import type { AppliedFoodBonus, FoodQuality, FoodStat, GatheringFood, PlayerStats } from '../types/game';

const STAT_KEYS: Record<FoodStat, keyof GatheringFood['bonuses']> = {
  gathering: 'Gathering',
  perception: 'Perception',
  gp: 'GP'
};

export const GATHERING_FOODS = gatheringFoods as GatheringFood[];

export function getGatheringFood(foodId: number | null): GatheringFood | null {
  if (!foodId) return null;
  return GATHERING_FOODS.find((food) => food.id === foodId) ?? null;
}

export function calculateFoodBonus(
  stats: PlayerStats,
  food: GatheringFood | null,
  quality: FoodQuality
): AppliedFoodBonus {
  return {
    gathering: calculateStatBonus(stats.gathering, food, quality, 'gathering'),
    perception: calculateStatBonus(stats.perception, food, quality, 'perception'),
    gp: calculateStatBonus(stats.gp, food, quality, 'gp')
  };
}

export function applyFoodBonus(stats: PlayerStats, bonus: AppliedFoodBonus): PlayerStats {
  return {
    level: stats.level,
    gathering: stats.gathering + bonus.gathering,
    perception: stats.perception + bonus.perception,
    gp: stats.gp + bonus.gp
  };
}

function calculateStatBonus(
  baseValue: number,
  food: GatheringFood | null,
  quality: FoodQuality,
  stat: FoodStat
): number {
  const bonus = food?.bonuses[STAT_KEYS[stat]];
  if (!bonus) return 0;

  const value = bonus[quality];
  return Math.min(Math.floor(baseValue * value.value / 100), value.max);
}
