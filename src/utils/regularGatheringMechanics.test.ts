import { describe, expect, it } from 'vitest';
import {
  applyRegularGatheringAction,
  createInitialRegularGatheringMechanicsState,
  createRegularGatheringMechanicsContext
} from './regularGatheringMechanics';
import {
  applyCollectableAction,
  createCollectableMechanicsContext,
  createInitialCollectableMechanicsState
} from './collectableMechanics';

describe('regularGatheringMechanics', () => {
  it('普通採集只有成功分支會恢復 GP，失敗分支不恢復 GP', () => {
    const context = createRegularGatheringMechanicsContext({
      stats: {
        level: 100,
        gathering: 450,
        perception: 1000,
        gp: 930
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
    const state = createInitialRegularGatheringMechanicsState(context, 0);
    const branches = applyRegularGatheringAction('gather', state, context);
    const failedBranch = branches.find((branch) => branch.labelKey === 'regularGathering.branches.gatherFailed');
    const successBranches = branches.filter((branch) => (
      branch.labelKey === 'regularGathering.branches.gatherSuccess'
        || branch.labelKey === 'regularGathering.branches.boonSuccess'
    ));

    expect(failedBranch?.state.gp).toBe(0);
    expect(successBranches.length).toBeGreaterThan(0);
    successBranches.forEach((branch) => {
      expect(branch.state.gp).toBe(6);
    });
  });

  it('收藏品採集同樣只有成功分支會恢復 GP，失敗分支不恢復 GP', () => {
    const context = createCollectableMechanicsContext({
      stats: {
        level: 100,
        gathering: 450,
        perception: 1000,
        gp: 930
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
    const state = createInitialCollectableMechanicsState(context, 0);
    const branches = applyCollectableAction('collect', state, context);
    const failedBranch = branches.find((branch) => branch.labelKey === 'collectableSolver.branches.collectFailed');
    const successBranch = branches.find((branch) => branch.labelKey === 'collectableSolver.branches.collectSuccess');

    expect(failedBranch?.state.gp).toBe(0);
    expect(successBranch?.state.gp).toBe(6);
  });
});
