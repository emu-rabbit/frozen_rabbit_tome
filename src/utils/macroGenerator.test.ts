import { describe, expect, it } from 'vitest';
import { buildGatheringMacro, buildGatheringMacroFromStoredRotation } from './macroGenerator';

const defaultSettings = {
  secondsPerGather: 4,
  bufferSeconds: 2
};

describe('macroGenerator', () => {
  it('會把連續採集壓成一行提示與等待', () => {
    const result = buildGatheringMacro([
      '沃土的饋贈II',
      '諾菲卡福音',
      '豐收II',
      '採集',
      '採集',
      '農夫之智'
    ], defaultSettings);

    expect(result.lines).toContain('/e 請採集 2 次，10 秒後巨集將繼續 <se.6> <wait.10>');
    expect(result.isComplete).toBe(true);
  });

  it('最後一段採集即使含理智觸發也只提醒採集到底，不額外等待', () => {
    const result = buildGatheringMacro([
      '農夫之智',
      '理智同興(若觸發)',
      '採集',
      '採集(理智觸發)'
    ], defaultSettings);

    expect(result.lines.at(-1)).toBe('/e 請採集到底 <se.6>');
  });

  it('可由秘笈書庫儲存格式產生巨集並保留條件技能名稱', () => {
    const result = buildGatheringMacroFromStoredRotation([
      { type: 'action', actionId: 215, actionName: '農夫之智' },
      { type: 'action', actionId: 26521, actionName: '理智同興(若觸發)' },
      { type: 'gather', actionName: '採集(理智觸發)' }
    ], defaultSettings);

    expect(result.lines).toEqual([
      '/merror off',
      '/ac "農夫之智" <wait.2>',
      '/ac "理智同興" <wait.2>',
      '/e 請採集到底 <se.6>'
    ]);
  });

  it('會用外部解析出的使用者語系技能名稱輸出 /ac', () => {
    const result = buildGatheringMacro([
      '沃土的饋贈II',
      '理智同興(若觸發)'
    ], defaultSettings, {
      resolveActionName: (_, actionId) => {
        const names: Record<number, string> = {
          25590: "Pioneer's Gift II",
          26521: 'Wise to the World'
        };
        return actionId ? names[actionId] : '';
      }
    });

    expect(result.lines).toContain('/ac "Pioneer\'s Gift II" <wait.2>');
    expect(result.lines).toContain('/ac "Wise to the World" <wait.2>');
  });

  it('語系名稱尚未載入時會回退到內部技能名稱', () => {
    const result = buildGatheringMacro(['沃土的饋贈II'], defaultSettings, {
      resolveActionName: () => ''
    });

    expect(result.lines).toContain('/ac "沃土的饋贈II" <wait.2>');
  });

  it('/e 提示文字可由外部多語系格式化', () => {
    const result = buildGatheringMacro([
      '採集',
      '採集',
      '農夫之智',
      '採集(理智觸發)'
    ], defaultSettings, {
      formatGatherPrompt: ({ count, isFinalRun, hasConditionalGather, waitSeconds }) => {
        if (isFinalRun) return 'Gather until depleted';
        const message = hasConditionalGather
          ? `If Wise procs, gather ${count} time(s)`
          : `Gather ${count} time(s)`;
        return `${message}. The macro will continue in ${waitSeconds}s`;
      }
    });

    expect(result.lines).toContain('/e Gather 2 time(s). The macro will continue in 10s <se.6> <wait.10>');
    expect(result.lines.at(-1)).toBe('/e Gather until depleted <se.6>');
  });

  it('超過遊戲巨集 15 行限制時會保留分段內容', () => {
    const result = buildGatheringMacro([
      '敏銳視野',
      '明晰視野',
      '高產',
      '採集',
      '明晰視野',
      '高產',
      '採集',
      '明晰視野',
      '高產',
      '採集',
      '明晰視野',
      '高產',
      '採集',
      '明晰視野',
      '高產',
      '採集'
    ], defaultSettings);

    expect(result.lines).toHaveLength(15);
    expect(result.parts).toHaveLength(2);
    expect(result.parts[0].lines).toHaveLength(15);
    expect(result.parts[1].lines.length).toBeGreaterThan(0);
    expect(result.fullLines).toHaveLength(17);
    expect(result.isComplete).toBe(false);
    expect(result.omittedLineCount).toBeGreaterThan(0);
  });
});
