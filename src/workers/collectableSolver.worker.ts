import { solveCollectableRotation } from '../utils/collectableSolver';
import {
  CollectableWasmMemoryAllocationError,
  CollectableWasmMemoCapacityError,
  canUseCollectableWasmSolver,
  solveCollectableRotationWithWasm
} from '../utils/collectableWasmSolver';
import type {
  CollectableSolverRequest,
  CollectableSolverResult,
  CollectableWorkerErrorResponse
} from '../types/collectable';

function rethrowWorkerError(error: unknown) {
  setTimeout(() => {
    throw error;
  }, 0);
}

self.onmessage = (event: MessageEvent<CollectableSolverRequest>) => {
  void handleCollectableSolve(event).catch(rethrowWorkerError);
};

async function handleCollectableSolve(event: MessageEvent<CollectableSolverRequest>) {
  const startTime = performance.now();
  let result: CollectableSolverResult;

  try {
    result = canUseCollectableWasmSolver(event.data)
      ? await solveCollectableRotationWithWasm(event.data)
      : solveCollectableRotation(event.data);
  } catch (error) {
    if (error instanceof CollectableWasmMemoCapacityError) {
      console.warn('Collectable WASM solver exceeded the device memo budget:', error);
      self.postMessage({
        errorType: 'memoCapacity',
        memoCapacityPower: error.memoCapacityPower,
        nextMemoCapacityPower: error.nextMemoCapacityPower
      } satisfies CollectableWorkerErrorResponse);
      return;
    }

    if (error instanceof CollectableWasmMemoryAllocationError) {
      console.warn('Collectable WASM solver could not allocate the requested memory:', error);
      self.postMessage({
        errorType: 'memoAllocationFailed',
        memoCapacityPower: error.memoCapacityPower
      } satisfies CollectableWorkerErrorResponse);
      return;
    }

    if (event.data.manualMemoCapacityPower !== undefined) {
      console.warn('Manual high-memory collectable WASM solve failed before completion:', error);
      self.postMessage({
        errorType: 'memoAllocationFailed',
        memoCapacityPower: event.data.manualMemoCapacityPower
      } satisfies CollectableWorkerErrorResponse);
      return;
    }

    console.warn('Collectable WASM solver failed, falling back to JS solver:', error);
    result = solveCollectableRotation(event.data);
  }

  const calculationTime = Math.floor(performance.now() - startTime);

  if (result.debug) {
    result.debug.plans.forEach((plan) => {
      plan.search.workerCalculationTime = calculationTime;
    });
  }

  self.postMessage({
    ...result,
    expectedScore: Number(result.expectedScore.toFixed(6)),
    calculationTime
  } as CollectableSolverResult);
}
