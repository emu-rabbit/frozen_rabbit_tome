import { describe, expect, it } from 'vitest';
import { getCollectableScripRewardMeta } from './collectableScripRewards';

describe('collectableScripRewards', () => {
  it('辨識 Teamcraft 收藏品資料使用的大地橘票 id', () => {
    expect(getCollectableScripRewardMeta(41785)).toMatchObject({
      kind: 'orange',
      itemId: 41785,
      labelKey: 'collectableSolver.results.scripUnits.orange'
    });
  });

  it('辨識大地紫票 id', () => {
    expect(getCollectableScripRewardMeta(33914)).toMatchObject({
      kind: 'purple',
      itemId: 33914,
      labelKey: 'collectableSolver.results.scripUnits.purple'
    });
  });

  it('不把其他物品誤判成大地票券', () => {
    expect(getCollectableScripRewardMeta(34021)).toMatchObject({
      kind: 'unknown',
      labelKey: 'collectableSolver.results.scripUnits.unknown'
    });
  });
});
