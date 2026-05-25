import { loadCollectableWasmCore } from './collectableWasmSolver';
import { loadRegularGatheringWasmCore } from './regularGatheringWasmSolver';

export type SolverWasmKind = 'regular' | 'collectable';

const prewarmPromises: Partial<Record<SolverWasmKind, Promise<void>>> = {};

export function prewarmSolverWasm(kind: SolverWasmKind): void {
  if (prewarmPromises[kind]) return;

  const loader = kind === 'collectable'
    ? loadCollectableWasmCore
    : loadRegularGatheringWasmCore;

  prewarmPromises[kind] = loader()
    .then(() => undefined)
    .catch(() => {
      prewarmPromises[kind] = undefined;
    });
}

export function scheduleSolverWasmPrewarm(kind: SolverWasmKind): void {
  if (typeof window === 'undefined') return;

  const run = () => prewarmSolverWasm(kind);
  const requestIdleCallback = (globalThis as {
    requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
  }).requestIdleCallback;

  if (requestIdleCallback) {
    requestIdleCallback(run, { timeout: 1500 });
    return;
  }

  window.setTimeout(run, 0);
}
