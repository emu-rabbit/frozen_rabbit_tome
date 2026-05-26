// @ts-expect-error Node-only Vitest fixture; keep Node globals out of the app tsconfig.
import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { solveGatheringRotation } from '../utils/rotationSolver';
import {
  RegularGatheringWasmMemoryAllocationError,
  RegularGatheringWasmMemoCapacityError,
  solveGatheringRotationWithWasm,
  type RegularGatheringWasmCore
} from '../utils/regularGatheringWasmSolver';
import type { SolverRequest, SolverResponse } from '../types/game';
import { solveGatheringWorkerRequest } from './solver.worker';

async function loadRegularWasmCore(): Promise<RegularGatheringWasmCore> {
  const bytes = await readFile(new URL('../wasm/regular-gathering-solver-core.wasm', import.meta.url));
  const module = await WebAssembly.instantiate(bytes, {
    env: {
      abort() {
        throw new Error('Regular gathering WASM core aborted.');
      }
    }
  });

  return module.instance.exports as unknown as RegularGatheringWasmCore;
}

function baseRequest(overrides: Partial<SolverRequest> = {}): SolverRequest {
  return {
    stats: {
      level: 100,
      gathering: 5345,
      perception: 5137,
      gp: 930
    },
    baseValues: {
      Gathering: 5085,
      Perception: 5085
    },
    itemLevel: 100,
    nodeBonuses: {
      baseIntegrity: 4,
      gatheringCount: 0,
      yieldCount: 0,
      extraRate: 0
    },
    temporaryGp: 930,
    jobType: 'miner',
    isTimedNode: false,
    objectiveMode: 'expected',
    debugMode: true,
    ...overrides
  };
}

async function expectWorkerParity(core: RegularGatheringWasmCore, request: SolverRequest, memoCapacityPower = 20) {
  const ts = solveGatheringRotation({ ...request, debugMode: true });
  const response = await solveGatheringWorkerRequest({ ...request, debugMode: true }, {
    solveWithWasm: (workerRequest) => solveGatheringRotationWithWasm(
      workerRequest,
      core,
      { memoCapacityPower, supportedMemoCapacityPower: memoCapacityPower }
    )
  });

  expect('errorType' in response).toBe(false);
  const wasm = response as SolverResponse;

  expect(wasm.bestRotation).toEqual(ts.bestRotation);
  expect(wasm.rotationPlans.map((plan) => plan.rotation)).toEqual(ts.rotationPlans.map((plan) => plan.rotation));
  expect(wasm.rotationPlans).toHaveLength(ts.rotationPlans.length);
  wasm.rotationPlans.forEach((wasmPlan, index) => {
    const tsPlan = ts.rotationPlans[index];
    expect(wasmPlan.expectedYield).toBeCloseTo(tsPlan.expectedYield, 8);
    expect(wasmPlan.minYield).toBe(tsPlan.minYield);
    expect(wasmPlan.maxYield).toBe(tsPlan.maxYield);
    expect(wasmPlan.minYieldChance).toBeCloseTo(tsPlan.minYieldChance, 8);
    expect(wasmPlan.maxYieldChance).toBeCloseTo(tsPlan.maxYieldChance, 8);
  });

  expect(wasm.expectedYield).toBeCloseTo(Number(ts.expectedYield.toFixed(2)), 8);
  expect(wasm.minYield).toBe(ts.minYield);
  expect(wasm.maxYield).toBe(ts.maxYield);
  expect(wasm.minYieldChance).toBeCloseTo(ts.minYieldChance, 8);
  expect(wasm.maxYieldChance).toBeCloseTo(ts.maxYieldChance, 8);
  expect(wasm.revisit).toEqual(ts.revisit);
  expect(wasm.debug?.combined).toEqual(ts.debug?.combined);
  expect(wasm.debug?.plans).toHaveLength(ts.debug?.plans.length ?? 0);
  wasm.debug?.plans.forEach((wasmPlan, index) => {
    const tsPlan = ts.debug?.plans[index];
    expect(tsPlan).toBeDefined();
    expect(wasmPlan.outcomeDistribution).toEqual(tsPlan?.outcomeDistribution);
  });
}

describe('regular gathering solver worker', () => {
  it('returns WASM worker results that preserve TS rotation shape and distributions', async () => {
    const core = await loadRegularWasmCore();
    await expectWorkerParity(core, baseRequest());
  });

  it('preserves Revisit worker summaries and per-plan action order', async () => {
    const core = await loadRegularWasmCore();
    await expectWorkerParity(core, baseRequest({
      temporaryGp: 300
    }));
  });

  it('returns memo capacity as a typed worker response without TS fallback', async () => {
    const fallback = vi.fn(() => solveGatheringRotation(baseRequest()));
    const response = await solveGatheringWorkerRequest(baseRequest(), {
      solveWithWasm: async () => {
        throw new RegularGatheringWasmMemoCapacityError(20, 21);
      },
      solveWithTs: fallback
    });

    expect(response).toEqual({
      errorType: 'memoCapacity',
      memoCapacityPower: 20,
      nextMemoCapacityPower: 21
    });
    expect(fallback).not.toHaveBeenCalled();
  });

  it('returns WASM allocation failure separately from memo capacity', async () => {
    const fallback = vi.fn(() => solveGatheringRotation(baseRequest()));
    const response = await solveGatheringWorkerRequest(baseRequest({ manualMemoCapacityPower: 22 }), {
      solveWithWasm: async () => {
        throw new RegularGatheringWasmMemoryAllocationError(22);
      },
      solveWithTs: fallback
    });

    expect(response).toEqual({
      errorType: 'memoAllocationFailed',
      memoCapacityPower: 22
    });
    expect(fallback).not.toHaveBeenCalled();
  });
});
