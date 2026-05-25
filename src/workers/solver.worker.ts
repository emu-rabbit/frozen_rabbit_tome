import { solveGatheringRotation } from '../utils/rotationSolver';
import {
  RegularGatheringWasmMemoryAllocationError,
  RegularGatheringWasmMemoCapacityError,
  solveGatheringRotationWithWasm
} from '../utils/regularGatheringWasmSolver';
import type { SolverRequest, SolverResponse, SolverWorkerErrorResponse, SolverWorkerResponse } from '../types/game';

interface SolverWorkerRuntime {
  solveWithWasm?: (request: SolverRequest) => Promise<SolverResponse>;
  solveWithTs?: (request: SolverRequest) => SolverResponse;
}

const workerScope = globalThis as typeof globalThis & {
  onmessage: ((event: MessageEvent<SolverRequest>) => void) | null;
  postMessage: (message: SolverWorkerResponse) => void;
};

workerScope.onmessage = (e: MessageEvent<SolverRequest>) => {
  void handleSolverMessage(e).catch(rethrowWorkerError);
};

function rethrowWorkerError(error: unknown) {
  setTimeout(() => {
    throw error;
  }, 0);
}

async function handleSolverMessage(e: MessageEvent<SolverRequest>) {
  workerScope.postMessage(await solveGatheringWorkerRequest(e.data));
}

export async function solveGatheringWorkerRequest(
  request: SolverRequest,
  runtime: SolverWorkerRuntime = {}
): Promise<SolverWorkerResponse> {
  const startTime = performance.now();
  let result: SolverResponse;

  try {
    result = await (runtime.solveWithWasm ?? solveGatheringRotationWithWasm)(request);
  } catch (error) {
    const typedError = createTypedWasmErrorResponse(error, request);
    if (typedError) return typedError;

    if (request.manualMemoCapacityPower !== undefined) {
      console.warn('Manual high-memory regular gathering WASM solve failed before completion:', error);
      return {
        errorType: 'memoAllocationFailed',
        memoCapacityPower: request.manualMemoCapacityPower
      };
    }

    console.warn('Regular gathering WASM solver failed, falling back to JS solver:', error);
    result = (runtime.solveWithTs ?? solveGatheringRotation)(request);
  }

  const calculationTime = Math.floor(performance.now() - startTime);

  result.debug?.plans.forEach((plan) => {
    plan.search.workerCalculationTime = calculationTime;
  });

  return {
    modelVersions: result.modelVersions,
    bestRotation: result.bestRotation,
    rotationPlans: result.rotationPlans,
    revisit: result.revisit,
    expectedYield: Number(result.expectedYield.toFixed(2)),
    minYield: result.minYield,
    maxYield: result.maxYield,
    minYieldChance: result.minYieldChance,
    maxYieldChance: result.maxYieldChance,
    objectiveMode: result.objectiveMode,
    calculationTime,
    debug: result.debug
  } as SolverResponse;
}

function createTypedWasmErrorResponse(
  error: unknown,
  request: SolverRequest
): SolverWorkerErrorResponse | null {
  if (error instanceof RegularGatheringWasmMemoCapacityError) {
    console.warn('Regular gathering WASM solver exceeded the device memo budget:', error);
    return {
      errorType: 'memoCapacity',
      memoCapacityPower: error.memoCapacityPower,
      nextMemoCapacityPower: error.nextMemoCapacityPower
    };
  }

  if (error instanceof RegularGatheringWasmMemoryAllocationError) {
    console.warn('Regular gathering WASM solver could not allocate the requested memory:', error);
    return {
      errorType: 'memoAllocationFailed',
      memoCapacityPower: error.memoCapacityPower
    };
  }

  if (request.manualMemoCapacityPower !== undefined) {
    return {
      errorType: 'memoAllocationFailed',
      memoCapacityPower: request.manualMemoCapacityPower
    };
  }

  return null;
}
