// @vitest-environment jsdom

import { nextTick, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GatherableItem, PlayerStats, SolverWorkerResponse } from '../types/game';

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
    getItemLevelData: () => ({
      100: {
        Gathering: 1000,
        Perception: 1000
      }
    }),
    getGatheringItemsData: () => ({
      10: {
        itemId: 1,
        level: 100
      }
    }),
    getItemName: () => '測試礦石',
    isGameDataLoading: ref(false),
    getItemBaseIntegrity: () => 4,
    getGatherableItemById: () => minerItem
  }));

  const { useSolver } = await import('./useSolver');
  const { useSettings } = await import('./useSettings');
  const { useGearProfiles } = await import('./useGearProfiles');

  return {
    solver: useSolver(),
    settings: useSettings(),
    gearProfiles: useGearProfiles()
  };
}

class MockSolverWorker {
  static instances: MockSolverWorker[] = [];

  onmessage: ((event: MessageEvent<SolverWorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  postedMessage: unknown = null;
  terminated = false;

  constructor() {
    MockSolverWorker.instances.push(this);
  }

  postMessage(message: unknown) {
    this.postedMessage = message;
  }

  terminate() {
    this.terminated = true;
  }

  resolve(data: SolverWorkerResponse) {
    this.onmessage?.({ data } as MessageEvent<SolverWorkerResponse>);
  }
}

function updateMinerProfile(gearProfiles: { updateProfile: (id: string, patch: Record<string, unknown>) => void }, stats: PlayerStats) {
  gearProfiles.updateProfile('default-miner', {
    level: stats.level,
    gathering: stats.gathering,
    perception: stats.perception,
    currentGp: stats.gp,
    maxGp: stats.gp
  });
}

describe('useSolver 同步機制', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    MockSolverWorker.instances = [];
  });

  it('切換頁面回來重新同步時，保留使用者手填的不滿 GP', async () => {
    const { solver, gearProfiles } = await createSolverContext();

    solver.activeItem.value = minerItem;
    updateMinerProfile(gearProfiles, {
      level: 100,
      gathering: 5345,
      perception: 5173,
      gp: 930
    });
    solver.syncFromSettings();
    solver.temporaryGp.value = 300;

    solver.syncFromSettings();

    expect(solver.temporaryGp.value).toBe(300);
    expect(solver.solverStats.value.gp).toBe(930);
  });

  it('選擇新物品時，會用目前設定初始化並回到滿 GP 規劃情境', async () => {
    const { solver, settings, gearProfiles } = await createSolverContext();

    updateMinerProfile(gearProfiles, {
      level: 100,
      gathering: 5400,
      perception: 5200,
      gp: 950
    });
    solver.temporaryGp.value = 300;

    solver.setSelectedItem(minerItem);

    expect(solver.solverStats.value).toEqual(settings.userStats.value.miner);
    expect(solver.temporaryGp.value).toBe(950);
  });

  it('再次選擇同一物品時，會保留目前編輯中的輸入草稿', async () => {
    const { solver, gearProfiles } = await createSolverContext();

    updateMinerProfile(gearProfiles, {
      level: 100,
      gathering: 5400,
      perception: 5200,
      gp: 950
    });
    solver.setSelectedItem(minerItem);
    solver.solverStats.value = {
      level: 99,
      gathering: 5100,
      perception: 5050,
      gp: 920
    };
    solver.selectedFood.value = { foodId: 123, quality: 'nq' };
    solver.nodeBonuses.value = {
      baseIntegrity: 6,
      gatheringCount: 2,
      yieldCount: 3,
      extraRate: 4
    };
    solver.temporaryGp.value = 300;

    solver.setSelectedItem({ ...minerItem, nameLocale: '更新後的測試礦石' });

    expect(solver.activeItem.value?.nameLocale).toBe('更新後的測試礦石');
    expect(solver.solverStats.value).toEqual({
      level: 99,
      gathering: 5100,
      perception: 5050,
      gp: 920
    });
    expect(solver.selectedFood.value).toEqual({ foodId: 123, quality: 'nq' });
    expect(solver.nodeBonuses.value).toEqual({
      baseIntegrity: 6,
      gatheringCount: 2,
      yieldCount: 3,
      extraRate: 4
    });
    expect(solver.temporaryGp.value).toBe(300);
  });

  it('全域設定真的變動時同步最大 GP，但不覆蓋仍在上限內的起始 GP', async () => {
    const { solver, gearProfiles } = await createSolverContext();

    solver.activeItem.value = minerItem;
    solver.syncFromSettings();
    solver.temporaryGp.value = 300;
    updateMinerProfile(gearProfiles, {
      level: 100,
      gathering: 5400,
      perception: 5200,
      gp: 950
    });

    solver.syncFromSettings();
    await nextTick();

    expect(solver.solverStats.value.gp).toBe(950);
    expect(solver.temporaryGp.value).toBe(300);
  });

  it('全域設定降低最大 GP 時，會把起始 GP 夾到新的有效上限', async () => {
    const { solver, gearProfiles } = await createSolverContext();

    solver.activeItem.value = minerItem;
    solver.syncFromSettings();
    solver.temporaryGp.value = 900;
    updateMinerProfile(gearProfiles, {
      level: 100,
      gathering: 5200,
      perception: 5000,
      gp: 850
    });

    solver.syncFromSettings();
    await nextTick();

    expect(solver.solverStats.value.gp).toBe(850);
    expect(solver.temporaryGp.value).toBe(850);
  });

  it('一般採集 worker memo capacity 會成為受控錯誤，並只在使用者確認後送出提高記憶體重跑', async () => {
    vi.stubGlobal('Worker', MockSolverWorker);
    const { solver } = await createSolverContext();

    solver.activeItem.value = minerItem;
    solver.solverStats.value = {
      level: 100,
      gathering: 1100,
      perception: 1100,
      gp: 930
    };
    solver.temporaryGp.value = 930;
    await nextTick();

    await solver.solve();
    const firstWorker = MockSolverWorker.instances[0];
    expect(firstWorker.postedMessage).toMatchObject({
      temporaryGp: 930
    });
    expect((firstWorker.postedMessage as { manualMemoCapacityPower?: number }).manualMemoCapacityPower).toBeUndefined();

    firstWorker.resolve({
      errorType: 'memoCapacity',
      memoCapacityPower: 20,
      nextMemoCapacityPower: 21
    });

    expect(solver.solverError.value).toBe('memoCapacity');
    expect(solver.solverErrorDetail.value?.nextMemoCapacityPower).toBe(21);
    expect(solver.rotationResult.value).toBeNull();
    expect(solver.isSolving.value).toBe(false);

    await solver.solveWithMemoCapacity(21);
    const retryWorker = MockSolverWorker.instances[1];
    expect(retryWorker.postedMessage).toMatchObject({
      manualMemoCapacityPower: 21
    });
  });
});
