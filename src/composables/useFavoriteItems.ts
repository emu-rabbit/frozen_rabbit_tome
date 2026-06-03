import { computed } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { shouldHideCrystalGatheringItem } from '../config/crystalGathering';
import type { GatherableItem, StoredFavoriteItem } from '../types/game';
import { trackFavoriteItemAdded } from '../services/analytics';

const STORAGE_KEY = 'frozen-rabbit-tome-favorite-items';
const favoriteItems = useLocalStorage<StoredFavoriteItem[]>(STORAGE_KEY, []);

export function useFavoriteItems() {
  const visibleFavoriteItems = computed(() => favoriteItems.value.filter((item) => !shouldHideCrystalGatheringItem(item)));
  const favoriteCount = computed(() => visibleFavoriteItems.value.length);
  const favoriteItemIds = computed(() => new Set(visibleFavoriteItems.value.map((item) => item.itemId)));

  const isFavorite = (itemId: number) => favoriteItemIds.value.has(itemId);

  const addFavorite = (item: GatherableItem) => {
    if (shouldHideCrystalGatheringItem(item)) return;
    if (isFavorite(item.itemId)) return;

    favoriteItems.value = [
      {
        itemId: item.itemId,
        isCollectable: item.isCollectable,
        isCrystalGathering: item.isCrystalGathering,
        createdAt: new Date().toISOString()
      },
      ...favoriteItems.value
    ];
    trackFavoriteItemAdded(item);
  };

  const removeFavorite = (itemId: number) => {
    favoriteItems.value = favoriteItems.value.filter((item) => item.itemId !== itemId);
  };

  const toggleFavorite = (item: GatherableItem) => {
    if (isFavorite(item.itemId)) {
      removeFavorite(item.itemId);
      return;
    }

    addFavorite(item);
  };

  return {
    favoriteItems,
    visibleFavoriteItems,
    favoriteCount,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite
  };
}
