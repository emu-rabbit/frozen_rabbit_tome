import { describe, expect, it } from 'vitest';
import { __parseXivapiV2CollectableRowsForTest, __resolveXivapiIconUrlForTest } from './gameData';

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

describe('gameData icon URL resolution', () => {
  it('uses the XIVAPI v2 asset host for Teamcraft asset paths', () => {
    expect(__resolveXivapiIconUrlForTest('/api/asset?path=ui/icon/040000/040176_hr1.tex&format=png'))
      .toBe('https://v2.xivapi.com/api/asset?path=ui/icon/040000/040176_hr1.tex&format=png');
  });

  it('moves legacy asset URLs to the v2 host', () => {
    expect(__resolveXivapiIconUrlForTest('https://xivapi.com/api/asset?path=ui/icon/040000/040176_hr1.tex&format=png'))
      .toBe('https://v2.xivapi.com/api/asset?path=ui/icon/040000/040176_hr1.tex&format=png');
  });

  it('keeps legacy direct icon paths usable', () => {
    expect(__resolveXivapiIconUrlForTest('/i/005000/005446.png'))
      .toBe('https://xivapi.com/i/005000/005446.png');
  });

  it('turns numeric icon ids into v2 asset URLs', () => {
    expect(__resolveXivapiIconUrlForTest(5446))
      .toBe('https://v2.xivapi.com/api/asset?path=ui/icon/005000/005446_hr1.tex&format=png');
  });
});
