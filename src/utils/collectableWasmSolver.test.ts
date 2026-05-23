// @ts-expect-error Node-only Vitest fixture; keep Node globals out of the app tsconfig.
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { solveCollectableRotation } from './collectableSolver';
import { CollectableWasmMemoCapacityError, solveCollectableRotationWithWasm } from './collectableWasmSolver';
import type { CollectableSolverRequest } from '../types/collectable';

type WasmCore = Parameters<typeof solveCollectableRotationWithWasm>[1];

async function loadWasmCore(): Promise<WasmCore> {
  const bytes = await readFile(new URL('../wasm/collectable-solver-core.wasm', import.meta.url));
  const module = await WebAssembly.instantiate(bytes, {
    env: {
      abort() {
        throw new Error('Collectable WASM core aborted.');
      }
    }
  });

  return module.instance.exports as unknown as WasmCore;
}

function baseRequest(overrides: Partial<CollectableSolverRequest> = {}): CollectableSolverRequest {
  return {
    stats: {
      level: 100,
      gathering: 5345,
      perception: 5173,
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
    rewardTable: {
      itemId: 43922,
      source: 'collectables',
      tiers: {
        low: { collectability: 600, reward: { exp: 0, gil: 0, scrip: 16, items: {} } },
        mid: { collectability: 800, reward: { exp: 0, gil: 0, scrip: 18, items: {} } },
        high: { collectability: 1000, reward: { exp: 0, gil: 0, scrip: 22, items: {} } }
      }
    },
    objective: { kind: 'scrip' },
    objectiveMode: 'expected',
    debugMode: true,
    ...overrides
  };
}

function expectTierCountsClose(
  wasm: Awaited<ReturnType<typeof solveCollectableRotationWithWasm>>['expectedTierCounts'],
  ts: ReturnType<typeof solveCollectableRotation>['expectedTierCounts']
) {
  expect(wasm.none).toBeCloseTo(ts.none, 6);
  expect(wasm.low).toBeCloseTo(ts.low, 6);
  expect(wasm.mid).toBeCloseTo(ts.mid, 6);
  expect(wasm.high).toBeCloseTo(ts.high, 6);
}

function expectSameSummary(
  wasm: Awaited<ReturnType<typeof solveCollectableRotationWithWasm>>,
  ts: ReturnType<typeof solveCollectableRotation>,
  options: { expectSameRoot?: boolean } = {}
) {
  expect(wasm.expectedScore).toBeCloseTo(ts.expectedScore, 6);
  expect(wasm.minScore).toBe(ts.minScore);
  expect(wasm.maxScore).toBe(ts.maxScore);
  expect(wasm.minScoreChance).toBeCloseTo(ts.minScoreChance, 6);
  expect(wasm.maxScoreChance).toBeCloseTo(ts.maxScoreChance, 6);
  expectTierCountsClose(wasm.expectedTierCounts, ts.expectedTierCounts);
  if (options.expectSameRoot !== false) {
    expect(wasm.policy.recommendedAction.kind).toBe(ts.policy.recommendedAction.kind);
  }
  expect(wasm.policyPlans.map((plan) => plan.kind)).toEqual(ts.policyPlans.map((plan) => plan.kind));
}

describe('collectable WASM solver core', () => {
  it.each(['expected', 'min', 'max'] as const)('matches the TS solver summary in %s mode', async (objectiveMode) => {
    const core = await loadWasmCore();
    const request = baseRequest({ objectiveMode });
    const ts = solveCollectableRotation(request);
    const wasm = await solveCollectableRotationWithWasm(request, core);

    expectSameSummary(wasm, ts);
  }, 30000);

  it('matches the TS solver when GP exceeds the old 10-bit WASM key width', async () => {
    const core = await loadWasmCore();
    const request = baseRequest({
      stats: {
        level: 100,
        gathering: 5345,
        perception: 5173,
        gp: 2100
      },
      temporaryGp: 2100
    });
    const ts = solveCollectableRotation(request);
    const wasm = await solveCollectableRotationWithWasm(request, core);

    expectSameSummary(wasm, ts);
  }, 30000);

  it('keeps the long Glv 700 low-gathering case aligned while using fewer JS allocations', async () => {
    const core = await loadWasmCore();
    const request = baseRequest({
      stats: {
        level: 100,
        gathering: 2000,
        perception: 5173,
        gp: 930
      },
      rewardTable: {
        itemId: 700001,
        source: 'collectables',
        tiers: {
          low: { collectability: 240, reward: { exp: 0, gil: 0, scrip: 107, items: {} } },
          mid: { collectability: 450, reward: { exp: 0, gil: 0, scrip: 124, items: {} } },
          high: { collectability: 600, reward: { exp: 0, gil: 0, scrip: 140, items: {} } }
        }
      }
    });
    const ts = solveCollectableRotation(request);
    const wasm = await solveCollectableRotationWithWasm(request, core);

    expectSameSummary(wasm, ts, { expectSameRoot: false });
    expect(wasm.debug?.plans[0].search.statesSolved).toBeLessThanOrEqual(ts.debug?.plans[0].search.statesSolved ?? 0);
  }, 90000);

  it('reports memo capacity failure without retrying a larger memo table', async () => {
    let calls = 0;
    const core = {
      solvePlanObjective() {
        calls += 1;
        throw new Error('Collectable WASM core aborted.');
      },
      getFailed() {
        return 1;
      }
    } as unknown as WasmCore;

    await expect(solveCollectableRotationWithWasm(baseRequest(), core))
      .rejects
      .toBeInstanceOf(CollectableWasmMemoCapacityError);
    expect(calls).toBe(1);
  });

  it('tries lower memo tables when the selected table cannot allocate', async () => {
    let calls = 0;
    const core = {
      solvePlanObjective() {
        calls += 1;
        throw new Error('WebAssembly memory allocation failed.');
      },
      getFailed() {
        return 0;
      }
    } as unknown as WasmCore;

    await expect(solveCollectableRotationWithWasm(baseRequest(), core))
      .rejects
      .toBeInstanceOf(CollectableWasmMemoCapacityError);
    expect(calls).toBe(3);
  });
});
