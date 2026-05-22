import { GATHERING_FOODS } from './foodData';
import { getItemEnglishName, getItemIcon, getItemName } from './gameData';
import type { FoodQuality, GatheringFood } from '../types/game';

type Translate = (key: string) => string;

export type FoodOption = {
  food: GatheringFood;
  quality: FoodQuality;
  label: string;
  name: string;
  summary: string;
  iconUrl: string;
  searchText: string;
};

export function buildFoodOption(food: GatheringFood, quality: FoodQuality, t: Translate): FoodOption {
  const name = getItemName(food.id);
  const englishName = getItemEnglishName(food.id);
  const qualityLabel = t(`solver.food.${quality}`);

  return {
    food,
    quality,
    label: `${name} ${qualityLabel}`,
    name,
    summary: formatFoodSummary(food, quality, t),
    iconUrl: getItemIcon(food.id),
    searchText: [name, englishName, food.id.toString(), quality].join(' ').toLowerCase()
  };
}

export function searchFoodOptions(query: string, t: Translate): FoodOption[] {
  const normalizedQuery = query.trim().toLowerCase();
  const options = GATHERING_FOODS.flatMap((food) => [
    buildFoodOption(food, 'hq', t),
    buildFoodOption(food, 'nq', t)
  ]);

  return (normalizedQuery
    ? options.filter((option) => option.searchText.includes(normalizedQuery))
    : options
  ).slice(0, 40);
}

export function formatFoodLabel(food: GatheringFood, quality: FoodQuality, t: Translate): string {
  return `${getItemName(food.id)} ${t(`solver.food.${quality}`)}`;
}

function formatFoodSummary(food: GatheringFood, quality: FoodQuality, t: Translate): string {
  return Object.entries(food.bonuses)
    .map(([stat, bonus]) => {
      const value = bonus[quality];
      return `${t(`game.stats.${foodStatKey(stat)}`)} +${value.value}% (${t('solver.food.max')} ${value.max})`;
    })
    .join(' / ');
}

function foodStatKey(stat: string) {
  if (stat === 'Gathering') return 'gathering';
  if (stat === 'Perception') return 'perception';
  return 'gp';
}
