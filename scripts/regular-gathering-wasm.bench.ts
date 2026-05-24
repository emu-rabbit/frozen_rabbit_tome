import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  solveGatheringRotationWithWasm,
  type RegularGatheringWasmCore
} from '../src/utils/regularGatheringWasmSolver';
import type { SolverRequest } from '../src/types/game';

const UNIT_PARITY_MEMO_CAPACITY_POWER = 21;
const PRESSURE_MEMO_CAPACITY_POWER = 22;

const unitParityCase: SolverRequest = {
  stats: {
    level: 91,
    gathering: 1200,
    perception: 1500,
    gp: 4000
  },
  baseValues: {
    Gathering: 1000,
    Perception: 1000
  },
  itemLevel: 91,
  nodeBonuses: {
    baseIntegrity: 4,
    gatheringCount: 1,
    yieldCount: 1,
    extraRate: 40
  },
  temporaryGp: 3500,
  objectiveMode: 'expected',
  jobType: 'miner',
  debugMode: true
};

const pressureCase: SolverRequest = {
  stats: {
    level: 91,
    gathering: 520,
    perception: 1500,
    gp: 4095
  },
  baseValues: {
    Gathering: 1000,
    Perception: 1000
  },
  itemLevel: 91,
  nodeBonuses: {
    baseIntegrity: 6,
    gatheringCount: 0,
    yieldCount: 1,
    extraRate: 40
  },
  temporaryGp: 3000,
  objectiveMode: 'expected',
  jobType: 'miner',
  debugMode: true
};

function mb(bytes: number): number {
  return Number((bytes / 1024 / 1024).toFixed(1));
}

async function elapsedAsync<T>(fn: () => Promise<T>): Promise<{
  elapsedMs: number;
  heapDeltaMb: number;
  heapAfterMb: number;
  value: T;
}> {
  const before = process.memoryUsage();
  const start = performance.now();
  const value = await fn();
  const after = process.memoryUsage();
  return {
    elapsedMs: Math.round(performance.now() - start),
    heapDeltaMb: mb(after.heapUsed - before.heapUsed),
    heapAfterMb: mb(after.heapUsed),
    value
  };
}

async function loadWasm(): Promise<RegularGatheringWasmCore> {
  const bytes = await readFile('src/wasm/regular-gathering-solver-core.wasm');
  const module = await WebAssembly.instantiate(bytes, {
    env: {
      abort() {
        throw new Error('Regular gathering WASM core aborted.');
      }
    }
  });
  return module.instance.exports as unknown as RegularGatheringWasmCore;
}

function summarize(result: Awaited<ReturnType<typeof solveGatheringRotationWithWasm>>) {
  return {
    expectedYield: result.expectedYield,
    minYield: result.minYield,
    maxYield: result.maxYield,
    minYieldChance: Number(result.minYieldChance.toFixed(8)),
    maxYieldChance: Number(result.maxYieldChance.toFixed(8)),
    rotationPlans: result.rotationPlans.map((plan) => ({
      kind: plan.kind,
      actions: plan.rotation.length,
      expectedYield: Number(plan.expectedYield.toFixed(6)),
      minYield: plan.minYield,
      maxYield: plan.maxYield,
      distributionBuckets: result.debug?.plans.find((debugPlan) => debugPlan.kind === plan.kind)
        ?.outcomeDistribution.length ?? 0,
      search: result.debug?.plans.find((debugPlan) => debugPlan.kind === plan.kind)?.search
    }))
  };
}

describe('regular gathering WASM benchmark', () => {
  it('records wrapper materialization cost and the high-GP pressure diagnostic', async () => {
    const wasm = await loadWasm();
    const unit = await elapsedAsync(() => solveGatheringRotationWithWasm(unitParityCase, wasm, {
      memoCapacityPower: UNIT_PARITY_MEMO_CAPACITY_POWER,
      supportedMemoCapacityPower: UNIT_PARITY_MEMO_CAPACITY_POWER
    }));
    const pressure = await elapsedAsync(() => solveGatheringRotationWithWasm(pressureCase, wasm, {
      memoCapacityPower: PRESSURE_MEMO_CAPACITY_POWER,
      supportedMemoCapacityPower: PRESSURE_MEMO_CAPACITY_POWER
    }));

    console.log(JSON.stringify({
      wasmMemoryMb: mb(wasm.memory.buffer.byteLength),
      unitParityCase: {
        elapsedMs: unit.elapsedMs,
        heapDeltaMb: unit.heapDeltaMb,
        heapAfterMb: unit.heapAfterMb,
        summary: summarize(unit.value)
      },
      pressureCase: {
        label: 'GP 4095 / integrity 6 / low success / high boon / Revisit',
        elapsedMs: pressure.elapsedMs,
        heapDeltaMb: pressure.heapDeltaMb,
        heapAfterMb: pressure.heapAfterMb,
        summary: summarize(pressure.value)
      }
    }, null, 2));

    expect(unit.value.rotationPlans.length).toBe(2);
    expect(pressure.value.rotationPlans.length).toBe(2);
    expect(pressure.value.debug?.plans[0].search.statesSolved).toBeGreaterThan(0);
  }, 180000);
});
