import { describe, expect, it } from 'vitest';
import { getCollectableActionIcon } from './collectableActions';

describe('collectableActions', () => {
  it('再起確認會依採集職業使用對應 trait 圖示', () => {
    expect(getCollectableActionIcon('revisitCheck', 'miner')).toBe('https://xivapi.com/i/005000/005446.png');
    expect(getCollectableActionIcon('revisitCheck', 'botanist')).toBe('https://xivapi.com/i/005000/005471.png');
  });
});
