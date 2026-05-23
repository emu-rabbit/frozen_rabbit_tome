// @ts-expect-error Node-only Vitest fixture; keep Node globals out of the app tsconfig.
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { solveCollectableRotation } from './collectableSolver';
import {
  CollectableWasmMemoryAllocationError,
  CollectableWasmMemoCapacityError,
  solveCollectableRotationWithWasm
} from './collectableWasmSolver';
import type { CollectableSolverRequest } from '../types/collectable';

type WasmCore = NonNullable<Parameters<typeof solveCollectableRotationWithWasm>[1]>;

function searchCounters(overrides: Partial<{
  getStatesSolved: () => bigint;
  getActionsEvaluated: () => bigint;
  getCandidateComparisons: () => bigint;
  getTerminalStates: () => bigint;
  getBranchCount: () => bigint;
  getFailureReason: () => number;
}> = {}) {
  return {
    getStatesSolved: () => BigInt(0),
    getActionsEvaluated: () => BigInt(0),
    getCandidateComparisons: () => BigInt(0),
    getTerminalStates: () => BigInt(0),
    getBranchCount: () => BigInt(0),
    getFailureReason: () => 0,
    ...overrides
  };
}

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

  it('includes tier-count details in debug distributions for tier priority objectives', async () => {
    const core = await loadWasmCore();
    const request = baseRequest({
      objective: {
        kind: 'tierScore',
        presetId: 'highValue',
        tierWeights: { none: 0, low: 0, mid: 1, high: 100 }
      }
    });
    const wasm = await solveCollectableRotationWithWasm(request, core);

    expect(wasm.debug?.plans[0].outcomeDistribution.some((entry) => entry.tierCounts)).toBe(true);
    expect(wasm.debug?.plans[0].outcomeDistribution[0].tierCounts).toEqual(expect.objectContaining({
      low: expect.any(Number),
      mid: expect.any(Number),
      high: expect.any(Number)
    }));
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

  it('does not overflow the memo load-limit check at 2^25 capacity', async () => {
    const core = await loadWasmCore();
    const request = baseRequest({
      stats: {
        level: 100,
        gathering: 2000,
        perception: 5173,
        gp: 1600
      },
      nodeBonuses: {
        baseIntegrity: 6,
        gatheringCount: 0,
        yieldCount: 0,
        extraRate: 0
      },
      temporaryGp: 1600
    });
    const high = request.rewardTable.tiers.high;
    const score = core.solvePlanObjective(
      request.stats.level,
      request.stats.gathering,
      request.stats.perception,
      request.stats.gp,
      request.baseValues.Gathering,
      request.baseValues.Perception,
      request.itemLevel,
      request.nodeBonuses.baseIntegrity + request.nodeBonuses.gatheringCount,
      request.temporaryGp,
      request.isTimedNode ? 1 : 0,
      request.rewardTable.tiers.low.collectability,
      request.rewardTable.tiers.low.reward.scrip,
      request.rewardTable.tiers.mid.collectability,
      request.rewardTable.tiers.mid.reward.scrip,
      high?.collectability ?? 0,
      high?.reward.scrip ?? 0,
      request.hasRelicToolBonus ? 1 : 0,
      25,
      0
    );

    expect(score).toBeGreaterThan(0);
    expect(core.getFailed()).toBe(0);
    expect(core.getFailureReason()).toBe(0);
    expect(Number(core.getStatesSolved())).toBeGreaterThan(1_000_000);
  }, 60000);

  it('reports memo capacity failure without retrying a larger memo table', async () => {
    let calls = 0;
    const core = {
      solvePlanObjective() {
        calls += 1;
        throw new Error('Collectable WASM core aborted.');
      },
      getFailed() {
        return 1;
      },
      ...searchCounters({
        getStatesSolved: () => BigInt(1),
        getFailureReason: () => 1
      })
    } as unknown as WasmCore;

    const rejection = await solveCollectableRotationWithWasm(baseRequest(), core)
      .then(() => null, (error: unknown) => error);

    expect(rejection).toBeInstanceOf(CollectableWasmMemoCapacityError);
    expect((rejection as CollectableWasmMemoCapacityError).nextMemoCapacityPower).toBe(23);
    expect(calls).toBe(1);
  });

  it('reports startup failure separately when the wasm core fails before search starts', async () => {
    let calls = 0;
    const core = {
      solvePlanObjective() {
        calls += 1;
        throw new WebAssembly.RuntimeError('unreachable');
      },
      getFailed() {
        return 1;
      },
      ...searchCounters()
    } as unknown as WasmCore;

    const rejection = await solveCollectableRotationWithWasm(baseRequest({ manualMemoCapacityPower: 24 }), core)
      .then(() => null, (error: unknown) => error);

    expect(rejection).toBeInstanceOf(CollectableWasmMemoryAllocationError);
    expect(rejection).not.toBeInstanceOf(CollectableWasmMemoCapacityError);
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
      .toBeInstanceOf(CollectableWasmMemoryAllocationError);
    expect(calls).toBe(3);
  });

  it('does not step down when a manual higher memo table cannot allocate', async () => {
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

    await expect(solveCollectableRotationWithWasm(baseRequest({ manualMemoCapacityPower: 24 }), core))
      .rejects
      .toBeInstanceOf(CollectableWasmMemoryAllocationError);
    expect(calls).toBe(1);
  });
});
