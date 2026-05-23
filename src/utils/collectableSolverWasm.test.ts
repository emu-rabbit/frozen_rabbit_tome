import { describe, expect, it } from 'vitest';
import {
  createCollectableStateKeyFactory,
  getCollectableSolverWasmStateKeyEngine
} from './collectableSolverWasm';
import type { CollectableMechanicsState } from './collectableMechanics';

function createState(overrides: Partial<CollectableMechanicsState> = {}): CollectableMechanicsState {
  return {
    gp: 930,
    integrity: 4,
    collectability: 250,
    scrutinyActive: false,
    collectorsFocusActive: false,
    primingTouchActive: false,
    standardActive: false,
    hasUsedCollectableAction: true,
    hasCollected: false,
    successBonus: 15,
    successIActive: false,
    successIIActive: true,
    successIIIActive: false,
    nextCollectSuccessBonus: 0,
    wiseToTheWorldActive: false,
    ...overrides
  };
}

describe('collectable solver WASM state-key kernel', () => {
  it('在 Vitest 環境會啟用 WASM packed key', () => {
    expect(getCollectableSolverWasmStateKeyEngine()).toBe('wasm-packed');
  });

  it('會將不同收藏品搜尋狀態打成不同 memo key', () => {
    const keyFactory = createCollectableStateKeyFactory();
    const baseKey = keyFactory.build(createState());

    expect(keyFactory.build(createState({ gp: 936 }))).not.toBe(baseKey);
    expect(keyFactory.build(createState({ gp: 1954 }))).not.toBe(baseKey);
    expect(keyFactory.build(createState({ gp: 2100 }))).not.toBe(baseKey);
    expect(keyFactory.build(createState({ gp: 2978 }))).not.toBe(baseKey);
    expect(keyFactory.build(createState({ collectability: 251 }))).not.toBe(baseKey);
    expect(keyFactory.build(createState({ standardActive: true }))).not.toBe(baseKey);
    expect(keyFactory.build(createState({ nextCollectSuccessBonus: 15 }))).not.toBe(baseKey);
  });

  it('超出固定寬度範圍時退回字串 key，避免碰撞', () => {
    const keyFactory = createCollectableStateKeyFactory();
    const key = keyFactory.build(createState({ gp: 5000 }));

    expect(typeof key).toBe('string');
    expect(keyFactory.toPolicyId(key)).toContain('|');
  });
});
