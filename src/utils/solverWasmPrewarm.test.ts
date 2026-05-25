import { beforeEach, describe, expect, it, vi } from 'vitest';

async function importPrewarmModule(options: {
  regularLoader?: () => Promise<unknown>;
  collectableLoader?: () => Promise<unknown>;
} = {}) {
  vi.resetModules();

  const regularLoader = vi.fn(options.regularLoader ?? (() => Promise.resolve({})));
  const collectableLoader = vi.fn(options.collectableLoader ?? (() => Promise.resolve({})));

  vi.doMock('./regularGatheringWasmSolver', () => ({
    loadRegularGatheringWasmCore: regularLoader
  }));
  vi.doMock('./collectableWasmSolver', () => ({
    loadCollectableWasmCore: collectableLoader
  }));

  const module = await import('./solverWasmPrewarm');
  return { ...module, regularLoader, collectableLoader };
}

describe('solver WASM prewarm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('preloads each solver WASM once per successful kind', async () => {
    const { prewarmSolverWasm, regularLoader, collectableLoader } = await importPrewarmModule();

    prewarmSolverWasm('regular');
    prewarmSolverWasm('regular');
    prewarmSolverWasm('collectable');
    await Promise.resolve();

    expect(regularLoader).toHaveBeenCalledTimes(1);
    expect(collectableLoader).toHaveBeenCalledTimes(1);
  });

  it('allows retry after a quiet preload failure', async () => {
    const regularLoader = vi.fn()
      .mockRejectedValueOnce(new Error('transient fetch failure'))
      .mockResolvedValueOnce({});
    const { prewarmSolverWasm } = await importPrewarmModule({ regularLoader });

    prewarmSolverWasm('regular');
    await Promise.resolve();
    await Promise.resolve();
    prewarmSolverWasm('regular');
    await Promise.resolve();

    expect(regularLoader).toHaveBeenCalledTimes(2);
  });

  it('schedules prewarm work with requestIdleCallback when available', async () => {
    const requestIdleCallback = vi.fn((callback: () => void) => {
      callback();
      return 1;
    });
    vi.stubGlobal('window', { setTimeout: vi.fn() });
    vi.stubGlobal('requestIdleCallback', requestIdleCallback);
    const { scheduleSolverWasmPrewarm, collectableLoader } = await importPrewarmModule();

    scheduleSolverWasmPrewarm('collectable');
    await Promise.resolve();

    expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 1500 });
    expect(collectableLoader).toHaveBeenCalledTimes(1);
  });
});
