// @vitest-environment jsdom

import { nextTick, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GatherableItem } from '../types/game';

const minerItem: GatherableItem = {
  itemId: 1,
  nameEn: 'Test Ore',
  nameLocale: '測試礦石',
  glv: 100,
  iconUrl: '',
  isFallback: false,
  jobType: 'miner',
  gatheringItemId: 10
};

async function createSolverContext() {
  vi.resetModules();
  localStorage.clear();

  vi.doMock('../services/gameData', () => ({
    currentLanguage: ref('tw'),
    getItemLevelData: () => ({}),
    getGatheringItemsData: () => ({}),
    getItemName: () => '測試礦石',
    isGameDataLoading: ref(false),
    getItemBaseIntegrity: () => 4,
    getGatherableItemById: () => minerItem
  }));

  const { useSolver } = await import('./useSolver');
  const { useSettings } = await import('./useSettings');

  return {
    solver: useSolver(),
    settings: useSettings()
  };
}

describe('useSolver 同步機制', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('切換頁面回來重新同步時，保留使用者手填的不滿 GP', async () => {
    const { solver, settings } = await createSolverContext();

    solver.activeItem.value = minerItem;
    settings.userStats.value.miner = {
      level: 100,
      gathering: 5345,
      perception: 5173,
      gp: 930
    };
    solver.syncFromSettings();
    solver.temporaryGp.value = 300;

    solver.syncFromSettings();

    expect(solver.temporaryGp.value).toBe(300);
    expect(solver.solverStats.value.gp).toBe(930);
  });

  it('選擇新物品時，會用目前設定初始化並回到滿 GP 規劃情境', async () => {
    const { solver, settings } = await createSolverContext();

    settings.userStats.value.miner = {
      level: 100,
      gathering: 5400,
      perception: 5200,
      gp: 950
    };
    solver.temporaryGp.value = 300;

    solver.setSelectedItem(minerItem);

    expect(solver.solverStats.value).toEqual(settings.userStats.value.miner);
    expect(solver.temporaryGp.value).toBe(950);
  });

  it('全域設定真的變動時同步最大 GP，但不覆蓋仍在上限內的起始 GP', async () => {
    const { solver, settings } = await createSolverContext();

    solver.activeItem.value = minerItem;
    solver.syncFromSettings();
    solver.temporaryGp.value = 300;
    settings.userStats.value.miner = {
      level: 100,
      gathering: 5400,
      perception: 5200,
      gp: 950
    };

    solver.syncFromSettings();
    await nextTick();

    expect(solver.solverStats.value.gp).toBe(950);
    expect(solver.temporaryGp.value).toBe(300);
  });

  it('全域設定降低最大 GP 時，會把起始 GP 夾到新的有效上限', async () => {
    const { solver, settings } = await createSolverContext();

    solver.activeItem.value = minerItem;
    solver.syncFromSettings();
    solver.temporaryGp.value = 900;
    settings.userStats.value.miner = {
      level: 100,
      gathering: 5200,
      perception: 5000,
      gp: 850
    };

    solver.syncFromSettings();
    await nextTick();

    expect(solver.solverStats.value.gp).toBe(850);
    expect(solver.temporaryGp.value).toBe(850);
  });
});
