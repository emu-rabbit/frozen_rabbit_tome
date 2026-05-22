import { describe, expect, it } from 'vitest';
import { __parseXivapiV2CollectableRowsForTest } from './gameData';

describe('gameData XIVAPI v2 collectable parsing', () => {
  it('可解析 v2 sheet row list 的收藏品旗標', () => {
    const flags = __parseXivapiV2CollectableRowsForTest({
      rows: [
        { row_id: 46247, fields: { IsCollectable: true } },
        { row_id: 46248, fields: { IsCollectable: true } },
        { row_id: 2, fields: { IsCollectable: false } }
      ]
    });

    expect(flags.get(46247)).toBe(true);
    expect(flags.get(46248)).toBe(true);
    expect(flags.get(2)).toBe(false);
  });

  it('可相容數字型旗標並忽略無效 row', () => {
    const flags = __parseXivapiV2CollectableRowsForTest({
      rows: [
        { row_id: '100', fields: { IsCollectable: 1 } },
        { row_id: '101', fields: { IsCollectable: 0 } },
        { row_id: 'not-a-number', fields: { IsCollectable: true } }
      ]
    });

    expect(flags.get(100)).toBe(true);
    expect(flags.get(101)).toBe(false);
    expect(flags.has(Number.NaN)).toBe(false);
  });
});
