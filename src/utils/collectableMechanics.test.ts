import { describe, expect, it } from 'vitest';
import {
  MIN_COLLECTABLE_LEVEL,
  applyCollectableAction,
  createCollectableMechanicsContext,
  createInitialCollectableMechanicsState
} from './collectableMechanics';

function createContext(level: number, gp = 930) {
  return createCollectableMechanicsContext({
    stats: {
      level,
      gathering: 1000,
      perception: 1000,
      gp
    },
    baseValues: {
      Gathering: 1000,
      Perception: 1000
    },
    itemLevel: 100,
    nodeBonuses: {
      baseIntegrity: 4,
      gatheringCount: 0,
      yieldCount: 0,
      extraRate: 0
    }
  });
}

describe('collectableMechanics', () => {
  it('收藏品機制層會拒絕 50 級以下的輸入', () => {
    expect(() => createContext(MIN_COLLECTABLE_LEVEL - 1)).toThrow(
      /Collectable gathering requires level 50 or higher/
    );
  });

  it('機制層會拒絕尚未解鎖的價值矚目', () => {
    const context = createContext(84);
    const state = createInitialCollectableMechanicsState(context, 930);

    expect(() => applyCollectableAction('collectorsFocus', state, context)).toThrow(
      /Illegal collectable action "collectorsFocus"/
    );
  });

  it('機制層會拒絕尚未解鎖的預備碰觸', () => {
    const context = createContext(94, 100);
    const state = createInitialCollectableMechanicsState(context, 100);

    expect(() => applyCollectableAction('primingTouch', state, context)).toThrow(
      /Illegal collectable action "primingTouch"/
    );
  });
});
