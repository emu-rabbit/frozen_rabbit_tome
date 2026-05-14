import { computed } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import type { GatherableItem, StoredFavoriteItem } from '../types/game';

const STORAGE_KEY = 'frozen-rabbit-tome-favorite-items';
const favoriteItems = useLocalStorage<StoredFavoriteItem[]>(STORAGE_KEY, []);

export function useFavoriteItems() {
  const favoriteCount = computed(() => favoriteItems.value.length);
  const favoriteItemIds = computed(() => new Set(favoriteItems.value.map((item) => item.itemId)));

  const isFavorite = (itemId: number) => favoriteItemIds.value.has(itemId);

  const addFavorite = (item: GatherableItem) => {
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
    favoriteCount,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite
  };
}
