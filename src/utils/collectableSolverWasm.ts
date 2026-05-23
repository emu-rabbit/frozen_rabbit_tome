import { collectableStateKey, type CollectableMechanicsState } from './collectableMechanics';

export type CollectablePackedStateKey = number | string;
export type CollectableStateKeyEngine = 'wasm-packed' | 'js-packed' | 'string';

interface WasmPackStateExports extends WebAssembly.Exports {
  packState: (
    gp: number,
    integrity: number,
    collectability: number,
    flags: number,
    successBonus: number,
    nextCollectSuccessBonus: number
  ) => number;
}

export interface CollectableStateKeyFactory {
  engine: CollectableStateKeyEngine;
  build(state: CollectableMechanicsState): CollectablePackedStateKey;
  toPolicyId(key: CollectablePackedStateKey): string;
}

const GP_LIMIT = 4095;
const INTEGRITY_LIMIT = 15;
const COLLECTABILITY_LIMIT = 1023;
const FLAGS_LIMIT = 1023;
const SUCCESS_BONUS_LIMIT = 127;
const NEXT_COLLECT_SUCCESS_LIMIT = 31;

const INTEGRITY_FACTOR = 2 ** 12;
const COLLECTABILITY_FACTOR = 2 ** 16;
const FLAGS_FACTOR = 2 ** 26;
const SUCCESS_BONUS_FACTOR = 2 ** 36;
const NEXT_COLLECT_SUCCESS_FACTOR = 2 ** 43;

let cachedWasmExports: WasmPackStateExports | null | undefined;

declare global {
  var __FR_TOME_COLLECTABLE_KEY_ENGINE__: CollectableStateKeyEngine | undefined;
}

export function createCollectableStateKeyFactory(): CollectableStateKeyFactory {
  const overrideEngine = globalThis.__FR_TOME_COLLECTABLE_KEY_ENGINE__;

  if (overrideEngine === 'string') {
    return createStringStateKeyFactory();
  }

  if (overrideEngine === 'js-packed') {
    return createJsPackedStateKeyFactory();
  }

  const wasm = getCollectableSolverWasmExports();

  if (wasm) {
    return {
      engine: 'wasm-packed',
      build: (state) => buildPackedStateKey(state, wasm.packState),
      toPolicyId: (key) => String(key)
    };
  }

  if (overrideEngine === 'wasm-packed') {
    return createJsPackedStateKeyFactory();
  }

  if (typeof WebAssembly === 'undefined') {
    return createStringStateKeyFactory();
  }

  return createJsPackedStateKeyFactory();
}

function createStringStateKeyFactory(): CollectableStateKeyFactory {
  return {
    engine: 'string',
    build: (state) => collectableStateKey(state),
    toPolicyId: (key) => String(key)
  };
}

function createJsPackedStateKeyFactory(): CollectableStateKeyFactory {
  return {
    engine: 'js-packed',
    build: (state) => buildPackedStateKey(state, packStateInJs),
    toPolicyId: (key) => String(key)
  };
}

export function getCollectableSolverWasmStateKeyEngine(): CollectableStateKeyEngine {
  return createCollectableStateKeyFactory().engine;
}

function buildPackedStateKey(
  state: CollectableMechanicsState,
  packState: WasmPackStateExports['packState']
): CollectablePackedStateKey {
  const flags = buildStateFlags(state);

  if (!canPackState(state, flags)) {
    return collectableStateKey(state);
  }

  return packState(
    state.gp,
    state.integrity,
    state.collectability,
    flags,
    state.successBonus,
    state.nextCollectSuccessBonus
  );
}

function canPackState(state: CollectableMechanicsState, flags: number): boolean {
  return Number.isInteger(state.gp)
    && Number.isInteger(state.integrity)
    && Number.isInteger(state.collectability)
    && Number.isInteger(state.successBonus)
    && Number.isInteger(state.nextCollectSuccessBonus)
    && state.gp >= 0
    && state.gp <= GP_LIMIT
    && state.integrity >= 0
    && state.integrity <= INTEGRITY_LIMIT
    && state.collectability >= 0
    && state.collectability <= COLLECTABILITY_LIMIT
    && flags >= 0
    && flags <= FLAGS_LIMIT
    && state.successBonus >= 0
    && state.successBonus <= SUCCESS_BONUS_LIMIT
    && state.nextCollectSuccessBonus >= 0
    && state.nextCollectSuccessBonus <= NEXT_COLLECT_SUCCESS_LIMIT;
}

function buildStateFlags(state: CollectableMechanicsState): number {
  return (state.scrutinyActive ? 1 : 0)
    + (state.collectorsFocusActive ? 2 : 0)
    + (state.primingTouchActive ? 4 : 0)
    + (state.standardActive ? 8 : 0)
    + (state.hasUsedCollectableAction ? 16 : 0)
    + (state.hasCollected ? 32 : 0)
    + (state.successIActive ? 64 : 0)
    + (state.successIIActive ? 128 : 0)
    + (state.successIIIActive ? 256 : 0)
    + (state.wiseToTheWorldActive ? 512 : 0);
}

function packStateInJs(
  gp: number,
  integrity: number,
  collectability: number,
  flags: number,
  successBonus: number,
  nextCollectSuccessBonus: number
): number {
  return gp
    + integrity * INTEGRITY_FACTOR
    + collectability * COLLECTABILITY_FACTOR
    + flags * FLAGS_FACTOR
    + successBonus * SUCCESS_BONUS_FACTOR
    + nextCollectSuccessBonus * NEXT_COLLECT_SUCCESS_FACTOR;
}

function getCollectableSolverWasmExports(): WasmPackStateExports | null {
  if (cachedWasmExports !== undefined) return cachedWasmExports;

  try {
    if (typeof WebAssembly === 'undefined') {
      cachedWasmExports = null;
      return cachedWasmExports;
    }

    const bytes = buildCollectableSolverWasmBytes();
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const module = new WebAssembly.Module(buffer);
    const instance = new WebAssembly.Instance(module);
    cachedWasmExports = instance.exports as WasmPackStateExports;
  } catch (error) {
    console.warn('Collectable solver WASM state-key kernel unavailable; using JS fallback.', error);
    cachedWasmExports = null;
  }

  return cachedWasmExports;
}

function buildCollectableSolverWasmBytes(): Uint8Array {
  const typeSection = section(1, [
    1,
    0x60,
    6,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    0x7f,
    1,
    0x7c
  ]);
  const functionSection = section(3, [1, 0]);
  const exportSection = section(7, [
    1,
    ...encodeString('packState'),
    0,
    0
  ]);
  const functionBody = [
    0,
    ...shiftedLocal(0, 0),
    ...shiftedLocal(1, 12),
    0x84,
    ...shiftedLocal(2, 16),
    0x84,
    ...shiftedLocal(3, 26),
    0x84,
    ...shiftedLocal(4, 36),
    0x84,
    ...shiftedLocal(5, 43),
    0x84,
    0xba,
    0x0b
  ];
  const codeSection = section(10, [
    1,
    ...encodeU32(functionBody.length),
    ...functionBody
  ]);

  return new Uint8Array([
    0x00,
    0x61,
    0x73,
    0x6d,
    0x01,
    0x00,
    0x00,
    0x00,
    ...typeSection,
    ...functionSection,
    ...exportSection,
    ...codeSection
  ]);
}

function shiftedLocal(localIndex: number, shift: number): number[] {
  const instructions = [
    0x20,
    ...encodeU32(localIndex),
    0xad
  ];

  if (shift === 0) return instructions;

  return [
    ...instructions,
    0x42,
    ...encodeU32(shift),
    0x86
  ];
}

function section(id: number, bytes: number[]): number[] {
  return [
    id,
    ...encodeU32(bytes.length),
    ...bytes
  ];
}

function encodeString(value: string): number[] {
  const bytes = [...value].map((char) => char.charCodeAt(0));
  return [
    ...encodeU32(bytes.length),
    ...bytes
  ];
}

function encodeU32(value: number): number[] {
  const bytes: number[] = [];
  let remaining = value >>> 0;

  do {
    let byte = remaining & 0x7f;
    remaining >>>= 7;
    if (remaining !== 0) byte |= 0x80;
    bytes.push(byte);
  } while (remaining !== 0);

  return bytes;
}
