const CRYSTAL_GATHERING_ITEM_IDS = new Set([
  2, 3, 4, 5, 6, 7,
  8, 9, 10, 11, 12, 13,
  14, 15, 16, 17, 18, 19
]);

export const showCrystalGathering = import.meta.env.VITE_SHOW_CRYSTAL_GATHERING === 'true';

export function isCrystalGatheringItemId(itemId: number): boolean {
  return CRYSTAL_GATHERING_ITEM_IDS.has(itemId);
}

export function shouldHideCrystalGatheringItem(item: {
  itemId?: number;
  isCrystalGathering?: boolean;
} | null | undefined): boolean {
  if (showCrystalGathering || !item) return false;
  return !!item.isCrystalGathering || (typeof item.itemId === 'number' && isCrystalGatheringItemId(item.itemId));
}
