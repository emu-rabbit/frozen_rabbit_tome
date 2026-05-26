import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { solveCollectableRotation } from '../src/utils/collectableSolver';
import { solveCollectableRotationWithWasm } from '../src/utils/collectableWasmSolver';
import { buildCollectablePolicyFromWasmCore } from '../src/utils/collectableWasmPolicy';
import type { CollectableSolverRequest } from '../src/types/collectable';

const MEMO_CAPACITY_POWER = 22;

type WasmExports = {
  memory: WebAssembly.Memory;
  solveExpected: (
    playerLevel: number,
    gathering: number,
    perception: number,
    playerGp: number,
    baseGathering: number,
    basePerception: number,
    itemLevel: number,
    integrity: number,
    temporaryGp: number,
    isTimedNode: number,
    lowThreshold: number,
    lowRewardScore: number,
    midThreshold: number,
    midRewardScore: number,
    highThreshold: number,
    highRewardScore: number,
    hasRelicToolBonus: number,
    memoCapacityPower: number
  ) => number;
  solvePlanObjective: (
    playerLevel: number,
    gathering: number,
    perception: number,
    playerGp: number,
    baseGathering: number,
    basePerception: number,
    itemLevel: number,
    integrity: number,
    temporaryGp: number,
    isTimedNode: number,
    lowThreshold: number,
    lowRewardScore: number,
    midThreshold: number,
    midRewardScore: number,
    highThreshold: number,
    highRewardScore: number,
    hasRelicToolBonus: number,
    memoCapacityPower: number,
    objectiveMode: number
  ) => number;
  getStatesSolved: () => bigint;
  getMemoHits: () => bigint;
  getActionsEvaluated: () => bigint;
  getCandidateComparisons: () => bigint;
  getTerminalStates: () => bigint;
  getBranchCount: () => bigint;
  getFailed: () => number;
  getFailureReason: () => number;
  getBaseSuccessRate: () => number;
  getScourValue: () => number;
  getScoreForState: (
    gp: number,
    integrity: number,
    collectability: number,
    flags: number,
    successBonus: number,
    nextBonus: number
  ) => number;
  getBestActionForState: (
    gp: number,
    integrity: number,
    collectability: number,
    flags: number,
    successBonus: number,
    nextBonus: number
  ) => number;
};

const slowCaseRequest: CollectableSolverRequest = {
  stats: {
    level: 100,
    gathering: 2000,
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
  debugMode: true
};

const fastCaseRequest: CollectableSolverRequest = {
  ...slowCaseRequest,
  stats: {
    level: 100,
    gathering: 5345,
    perception: 5173,
    gp: 930
  }
};

const glv700LowGatheringRequest: CollectableSolverRequest = {
  ...slowCaseRequest,
  rewardTable: {
    itemId: 700001,
    source: 'collectables',
    tiers: {
      low: { collectability: 240, reward: { exp: 0, gil: 0, scrip: 107, items: {} } },
      mid: { collectability: 450, reward: { exp: 0, gil: 0, scrip: 124, items: {} } },
      high: { collectability: 600, reward: { exp: 0, gil: 0, scrip: 140, items: {} } }
    }
  }
};

const memoLoadLimitRequest: CollectableSolverRequest = {
  ...slowCaseRequest,
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
};

function mb(bytes: number): number {
  return Number((bytes / 1024 / 1024).toFixed(1));
}

function elapsed<T>(fn: () => T): { elapsedMs: number; heapDeltaMb: number; heapAfterMb: number; value: T } {
  const before = process.memoryUsage();
  const start = performance.now();
  const value = fn();
  const after = process.memoryUsage();
  return {
    elapsedMs: Math.round(performance.now() - start),
    heapDeltaMb: mb(after.heapUsed - before.heapUsed),
    heapAfterMb: mb(after.heapUsed),
    value
  };
}

async function elapsedAsync<T>(fn: () => Promise<T>): Promise<{ elapsedMs: number; heapDeltaMb: number; heapAfterMb: number; value: T }> {
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

function toNumber(value: bigint): number {
  return Number(value);
}

async function loadWasm(): Promise<WasmExports> {
  const bytes = await readFile('src/wasm/collectable-solver-core.wasm');
  const module = await WebAssembly.instantiate(bytes, {
    env: {
      abort() {
        throw new Error('AssemblyScript abort');
      }
    }
  });
  return module.instance.exports as unknown as WasmExports;
}

function runWasm(exports: WasmExports, request: CollectableSolverRequest) {
  const high = request.rewardTable.tiers.high;
  const expectedScore = exports.solveExpected(
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
    MEMO_CAPACITY_POWER
  );

  return {
    expectedScore,
    counters: {
      statesSolved: toNumber(exports.getStatesSolved()),
      memoHits: toNumber(exports.getMemoHits()),
      actionsEvaluated: toNumber(exports.getActionsEvaluated()),
      candidateComparisons: toNumber(exports.getCandidateComparisons()),
      terminalStates: toNumber(exports.getTerminalStates()),
      branchCount: toNumber(exports.getBranchCount())
    },
    failure: {
      failed: exports.getFailed(),
      reason: exports.getFailureReason()
    },
    formulas: {
      baseSuccessRate: exports.getBaseSuccessRate(),
      scourValue: exports.getScourValue()
    }
  };
}

function runPlanObjective(
  exports: WasmExports,
  request: CollectableSolverRequest,
  memoCapacityPower: number,
  objectiveMode = 0
) {
  const high = request.rewardTable.tiers.high;
  const objectiveScore = exports.solvePlanObjective(
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
    memoCapacityPower,
    objectiveMode
  );

  return {
    objectiveScore,
    counters: {
      statesSolved: toNumber(exports.getStatesSolved()),
      memoHits: toNumber(exports.getMemoHits()),
      actionsEvaluated: toNumber(exports.getActionsEvaluated()),
      candidateComparisons: toNumber(exports.getCandidateComparisons()),
      terminalStates: toNumber(exports.getTerminalStates()),
      branchCount: toNumber(exports.getBranchCount())
    },
    failure: {
      failed: exports.getFailed(),
      reason: exports.getFailureReason()
    }
  };
}

function summarizeJs(request: CollectableSolverRequest) {
  const result = solveCollectableRotation(request);
  return {
    expectedScore: result.expectedScore,
    primaryExpectedScore: result.policyPlans[0].expectedScore,
    counters: result.debug?.plans[0].search,
    policyPlans: result.policyPlans.length
  };
}

function countPolicyNodes(node: { id: string; branches: Array<{ next?: any }> }, visited = new Set<string>()): number {
  if (visited.has(node.id)) return 0;
  visited.add(node.id);
  return 1 + node.branches.reduce((sum, branch) => sum + (branch.next ? countPolicyNodes(branch.next, visited) : 0), 0);
}

describe('collectable WASM benchmark', () => {
  it('compares current JS solver and compact WASM core on fast and slow collectable cases', async () => {
    const wasm = await loadWasm();
    const fastJs = elapsed(() => summarizeJs(fastCaseRequest));
    const fastWasm = elapsed(() => runWasm(wasm, fastCaseRequest));
    const fastPolicy = elapsed(() => buildCollectablePolicyFromWasmCore(fastCaseRequest, wasm, { nodeLimit: 200000 }));
    const fastFullWasm = await elapsedAsync(() => solveCollectableRotationWithWasm(fastCaseRequest, wasm));
    const slowJs = elapsed(() => summarizeJs(slowCaseRequest));
    const slowWasm = elapsed(() => runWasm(wasm, slowCaseRequest));
    const slowPolicy = elapsed(() => buildCollectablePolicyFromWasmCore(slowCaseRequest, wasm, { nodeLimit: 500000 }));
    const slowFullWasm = await elapsedAsync(() => solveCollectableRotationWithWasm(slowCaseRequest, wasm));
    const glv700Js = elapsed(() => solveCollectableRotation(glv700LowGatheringRequest));
    const glv700FullWasm = await elapsedAsync(() => solveCollectableRotationWithWasm(glv700LowGatheringRequest, wasm));
    const memoLoadLimit = elapsed(() => runPlanObjective(wasm, memoLoadLimitRequest, 25));

    console.log(JSON.stringify({
      wasmMemoryMb: mb(wasm.memory.buffer.byteLength),
      fast: {
        js: fastJs,
        wasm: fastWasm,
        wasmPolicy: {
          elapsedMs: fastPolicy.elapsedMs,
          heapDeltaMb: fastPolicy.heapDeltaMb,
          rootAction: fastPolicy.value.recommendedAction.kind,
          expectedScore: fastPolicy.value.expectedScore,
          nodeCount: countPolicyNodes(fastPolicy.value)
        },
        wasmFull: {
          elapsedMs: fastFullWasm.elapsedMs,
          heapDeltaMb: fastFullWasm.heapDeltaMb,
          expectedScore: fastFullWasm.value.expectedScore,
          rootAction: fastFullWasm.value.policy.recommendedAction.kind
        },
        scoreDelta: Number((fastWasm.value.expectedScore - fastJs.value.expectedScore).toFixed(6))
      },
      slow: {
        js: slowJs,
        wasm: slowWasm,
        wasmPolicy: {
          elapsedMs: slowPolicy.elapsedMs,
          heapDeltaMb: slowPolicy.heapDeltaMb,
          rootAction: slowPolicy.value.recommendedAction.kind,
          expectedScore: slowPolicy.value.expectedScore,
          nodeCount: countPolicyNodes(slowPolicy.value)
        },
        wasmFull: {
          elapsedMs: slowFullWasm.elapsedMs,
          heapDeltaMb: slowFullWasm.heapDeltaMb,
          expectedScore: slowFullWasm.value.expectedScore,
          rootAction: slowFullWasm.value.policy.recommendedAction.kind
        },
        scoreDelta: Number((slowWasm.value.expectedScore - slowJs.value.expectedScore).toFixed(6))
      },
      pressure: {
        glv700LowGathering: {
          js: {
            elapsedMs: glv700Js.elapsedMs,
            heapDeltaMb: glv700Js.heapDeltaMb,
            expectedScore: glv700Js.value.expectedScore,
            rootAction: glv700Js.value.policy.recommendedAction.kind,
            statesSolved: glv700Js.value.debug?.plans[0].search.statesSolved
          },
          wasmFull: {
            elapsedMs: glv700FullWasm.elapsedMs,
            heapDeltaMb: glv700FullWasm.heapDeltaMb,
            expectedScore: glv700FullWasm.value.expectedScore,
            rootAction: glv700FullWasm.value.policy.recommendedAction.kind,
            statesSolved: glv700FullWasm.value.debug?.plans[0].search.statesSolved
          }
        },
        memoLoadLimit2Power25: {
          elapsedMs: memoLoadLimit.elapsedMs,
          heapDeltaMb: memoLoadLimit.heapDeltaMb,
          result: memoLoadLimit.value
        }
      }
    }, null, 2));

    expect(fastWasm.value.expectedScore).toBeCloseTo(fastJs.value.expectedScore, 5);
    expect(fastPolicy.value.expectedScore).toBeCloseTo(fastJs.value.primaryExpectedScore, 5);
    expect(fastFullWasm.value.expectedScore).toBeCloseTo(fastJs.value.expectedScore, 5);
    expect(slowWasm.value.expectedScore).toBeCloseTo(slowJs.value.expectedScore, 5);
    expect(slowPolicy.value.expectedScore).toBeCloseTo(slowJs.value.primaryExpectedScore, 5);
    expect(slowFullWasm.value.expectedScore).toBeCloseTo(slowJs.value.expectedScore, 5);
    expect(glv700FullWasm.value.expectedScore).toBeCloseTo(glv700Js.value.expectedScore, 5);
    expect(glv700FullWasm.value.debug?.plans[0].search.statesSolved).toBeLessThanOrEqual(
      glv700Js.value.debug?.plans[0].search.statesSolved ?? 0
    );
    expect(memoLoadLimit.value.objectiveScore).toBeGreaterThan(0);
    expect(memoLoadLimit.value.failure).toEqual({ failed: 0, reason: 0 });
    expect(memoLoadLimit.value.counters.statesSolved).toBeGreaterThan(1_000_000);
  }, 180000);
});
