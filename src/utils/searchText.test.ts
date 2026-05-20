import { describe, expect, it } from 'vitest';
import {
  applySanitizedPaste,
  normalizeGatherableSearchQuery,
  stripSpecialSearchCharacters
} from './searchText';

describe('searchText', () => {
  it('會移除遊戲複製收藏品名稱時附帶的私用區字元', () => {
    expect(stripSpecialSearchCharacters('收藏用鈦金礦')).toBe('收藏用鈦金礦');
  });

  it('會保留物品名稱中可能合法出現的標點', () => {
    expect(stripSpecialSearchCharacters("Ra'Kaznar Ore - High-grade")).toBe("Ra'Kaznar Ore - High-grade");
  });

  it('搜尋正規化會在比對前移除特殊字元並忽略大小寫', () => {
    expect(normalizeGatherableSearchQuery('  Titanium Ore  ')).toBe('titanium ore');
  });

  it('貼上清理會保留原本游標位置前後的文字', () => {
    expect(applySanitizedPaste('收藏用礦', '鈦金', 2, 2)).toBe('收藏鈦金用礦');
  });
});
