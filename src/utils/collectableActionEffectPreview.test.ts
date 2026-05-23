import { describe, expect, it } from 'vitest';
import {
  buildCollectableActionEffectPreviews,
  type CollectableActionEffectPreview
} from './collectableActionEffectPreview';
import {
  createCollectableMechanicsContext,
  createInitialCollectableMechanicsState,
  type CollectableMechanicsState
} from './collectableMechanics';

function createMechanics() {
  return createCollectableMechanicsContext({
    stats: {
      level: 100,
      gathering: 5345,
      perception: 5173,
      gp: 930
    },
    baseValues: {
      Gathering: 4860,
      Perception: 4860
    },
    itemLevel: 700,
    nodeBonuses: {
      baseIntegrity: 6,
      gatheringCount: 0,
      yieldCount: 0,
      extraRate: 0
    },
    isTimedNode: false
  });
}

function metric(preview: CollectableActionEffectPreview, kind: string) {
  const entry = preview.metrics.find((item) => item.kind === kind);
  expect(entry).toBeTruthy();
  return entry!;
}

describe('collectable action effect preview', () => {
  it('summarizes refine gain from expanded strategy states', () => {
    const mechanics = createMechanics();
    const state = createInitialCollectableMechanicsState(mechanics, 930);
    const [scour] = buildCollectableActionEffectPreviews({
      actions: ['scour'],
      states: [state],
      mechanics
    });

    expect(metric(scour, 'collectabilityGain').range).toEqual({ min: 200, max: 300 });
    expect(metric(scour, 'integrityDelta').range).toEqual({ min: -1, max: -1 });
  });

  it('uses prior actions before summarizing the next single cast', () => {
    const mechanics = createMechanics();
    const state = createInitialCollectableMechanicsState(mechanics, 930);
    const [, scour] = buildCollectableActionEffectPreviews({
      actions: ['scrutiny', 'scour'],
      states: [state],
      mechanics
    });

    expect(metric(scour, 'collectabilityGain').range).toEqual({ min: 450, max: 550 });
  });

  it('reports fixed buff ranges and restores only when not capped', () => {
    const mechanics = createMechanics();
    const state: CollectableMechanicsState = {
      ...createInitialCollectableMechanicsState(mechanics, 930),
      integrity: 5,
      wiseToTheWorldActive: true
    };
    const [focus, priming] = buildCollectableActionEffectPreviews({
      actions: ['collectorsFocus', 'primingTouch'],
      states: [state],
      mechanics
    });
    const [restore] = buildCollectableActionEffectPreviews({
      actions: ['restoreIntegrity'],
      states: [state],
      mechanics
    });
    const [wise] = buildCollectableActionEffectPreviews({
      actions: ['wiseToTheWorld'],
      states: [state],
      mechanics
    });

    expect(metric(focus, 'valueIncreaseRate')).toMatchObject({ from: 40, to: 70, delta: 30 });
    expect(metric(priming, 'meticulousSaveRate')).toMatchObject({ from: 25, to: 50, delta: 25 });
    expect(metric(restore, 'integrityDelta').range).toEqual({ min: 1, max: 1 });
    expect(metric(wise, 'integrityDelta').range).toEqual({ min: 1, max: 1 });
  });

  it('includes capped nodes in restore summaries without treating all-capped states as castable', () => {
    const mechanics = createMechanics();
    const capped = createInitialCollectableMechanicsState(mechanics, 930);
    const recoverable: CollectableMechanicsState = {
      ...capped,
      integrity: 5
    };
    const [partial] = buildCollectableActionEffectPreviews({
      actions: ['restoreIntegrity'],
      states: [capped, recoverable],
      mechanics
    });
    const [allCapped] = buildCollectableActionEffectPreviews({
      actions: ['restoreIntegrity'],
      states: [capped],
      mechanics
    });

    expect(metric(partial, 'integrityDelta').range).toEqual({ min: 0, max: 1 });
    expect(partial.castableStateCount).toBe(1);
    expect(allCapped.castableStateCount).toBe(0);
    expect(allCapped.metrics).toEqual([]);
  });

  it('shows the actual GP delta after collect success and GP cap are applied', () => {
    const mechanics = createMechanics();
    const capped = createInitialCollectableMechanicsState(mechanics, 930);
    const belowCap: CollectableMechanicsState = {
      ...capped,
      gp: 924
    };
    const [cappedCollect] = buildCollectableActionEffectPreviews({
      actions: ['collect'],
      states: [capped],
      mechanics
    });
    const [belowCapCollect] = buildCollectableActionEffectPreviews({
      actions: ['collect'],
      states: [belowCap],
      mechanics
    });

    expect(metric(cappedCollect, 'collectSuccessRate').range).toEqual({ min: 100, max: 100 });
    expect(metric(cappedCollect, 'collectSuccessGp').range).toEqual({ min: 0, max: 0 });
    expect(metric(belowCapCollect, 'collectSuccessGp').range).toEqual({ min: 6, max: 6 });
  });
});
