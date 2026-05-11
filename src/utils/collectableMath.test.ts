import { describe, it, expect } from 'vitest';
import {
  computeScourValue,
  computeValueIncreaseRate,
  computeCollectorsFocusRate,
  computeMeticulousNoDurRate,
  computePrimingTouchRate,
  computeScrutinyMultiplier,
  computeScrutinyBonus,
  computeValueBonus,
  computeScourOutcome,
  computeMeticulousOutcome,
} from './collectableMath';

// 最大值 case 的 base 值（ActionScore/RateScore = 95/100）
// 以 baseGathering = 100, playerGathering = 100 → RateScore 100, ActionScore 95
const MAX_BASE = 100;
const MAX_PLAYER = 100; // score = floor(100 * 100 / 100) = 100 → clamped to 95 for ActionScore, 100 for RateScore

// ─── computeScourValue ────────────────────────────────────────────────────────

describe('computeScourValue', () => {
  // score <= 66 → 150
  it('returns 150 when score = 0', () => {
    expect(computeScourValue(0, 100)).toBe(150);
  });

  it('returns 150 when score = 66', () => {
    // playerGathering = 66, baseGathering = 100 → score = 66
    expect(computeScourValue(66, 100)).toBe(150);
  });

  // score = 67 → floor((67 - 66) * 40 / 19 + 150) = floor(40/19 + 150) = floor(2.1... + 150) = 152
  it('returns 152 when score = 67', () => {
    expect(computeScourValue(67, 100)).toBe(152);
  });

  // score = 85 → floor((85 - 66) * 40 / 19 + 150) = floor(19 * 40 / 19 + 150) = floor(40 + 150) = 190
  it('returns 190 when score = 85', () => {
    expect(computeScourValue(85, 100)).toBe(190);
  });

  // score = 86 → 86 - 85 + 190 = 191
  it('returns 191 when score = 86', () => {
    expect(computeScourValue(86, 100)).toBe(191);
  });

  // score = 95 (ActionScore max, from rawScore 100 or higher) → 95 - 85 + 190 = 200
  it('returns 200 at maximum (score=95, actionScore clamped)', () => {
    expect(computeScourValue(MAX_PLAYER, MAX_BASE)).toBe(200);
  });

  it('still returns 200 when playerGathering greatly exceeds base', () => {
    expect(computeScourValue(5000, 100)).toBe(200);
  });
});

// ─── computeValueIncreaseRate ─────────────────────────────────────────────────

describe('computeValueIncreaseRate', () => {
  it('returns 10 when rateScore = 0', () => {
    expect(computeValueIncreaseRate(0, 100)).toBe(10);
  });

  it('returns 10 when rateScore = 66', () => {
    expect(computeValueIncreaseRate(66, 100)).toBe(10);
  });

  // rateScore = 67 → floor((67 - 66) * 10 / 19 + 10) = floor(0.526... + 10) = 10
  it('returns 10 when rateScore = 67', () => {
    expect(computeValueIncreaseRate(67, 100)).toBe(10);
  });

  // rateScore = 85 → floor((85 - 66) * 10 / 19 + 10) = floor(19 * 10 / 19 + 10) = floor(10 + 10) = 20
  it('returns 20 when rateScore = 85', () => {
    expect(computeValueIncreaseRate(85, 100)).toBe(20);
  });

  // rateScore = 86 → floor((86 - 85) * 20 / 15 + 20) = floor(1.333... + 20) = 21
  it('returns 21 when rateScore = 86', () => {
    expect(computeValueIncreaseRate(86, 100)).toBe(21);
  });

  // rateScore = 100 (RateScore max) → floor((100 - 85) * 20 / 15 + 20) = floor(15 * 20 / 15 + 20) = floor(20 + 20) = 40
  it('returns 40 at maximum (rateScore = 100)', () => {
    expect(computeValueIncreaseRate(MAX_PLAYER, MAX_BASE)).toBe(40);
  });

  it('still returns 40 when playerGathering greatly exceeds base', () => {
    expect(computeValueIncreaseRate(5000, 100)).toBe(40);
  });
});

// ─── computeCollectorsFocusRate ───────────────────────────────────────────────

describe('computeCollectorsFocusRate', () => {
  it('returns floor(10 * 175 / 100) = 17 for rate=10', () => {
    expect(computeCollectorsFocusRate(10)).toBe(17);
  });

  it('returns 70 for max rate=40', () => {
    expect(computeCollectorsFocusRate(40)).toBe(70);
  });
});

// ─── computeMeticulousNoDurRate ───────────────────────────────────────────────

describe('computeMeticulousNoDurRate', () => {
  it('returns 5 when rateScore = 0', () => {
    expect(computeMeticulousNoDurRate(0, 100)).toBe(5);
  });

  it('returns 5 when rateScore = 66', () => {
    expect(computeMeticulousNoDurRate(66, 100)).toBe(5);
  });

  // rateScore = 67 → floor((67-66) * 5 / 19 + 5) = floor(0.263 + 5) = 5
  it('returns 5 when rateScore = 67', () => {
    expect(computeMeticulousNoDurRate(67, 100)).toBe(5);
  });

  // rateScore = 85 → floor((85-66) * 5 / 19 + 5) = floor(5 + 5) = 10
  it('returns 10 when rateScore = 85', () => {
    expect(computeMeticulousNoDurRate(85, 100)).toBe(10);
  });

  // rateScore = 86 → 86 - 85 + 10 = 11
  it('returns 11 when rateScore = 86', () => {
    expect(computeMeticulousNoDurRate(86, 100)).toBe(11);
  });

  // rateScore = 100 → 100 - 85 + 10 = 25
  it('returns 25 at maximum (rateScore = 100)', () => {
    expect(computeMeticulousNoDurRate(MAX_PLAYER, MAX_BASE)).toBe(25);
  });
});

// ─── computePrimingTouchRate ──────────────────────────────────────────────────

describe('computePrimingTouchRate', () => {
  it('doubles the rate for rate=5', () => {
    expect(computePrimingTouchRate(5)).toBe(10);
  });

  it('returns 50 for max rate=25 (no High Standard)', () => {
    expect(computePrimingTouchRate(25)).toBe(50);
  });

  it('caps at 100', () => {
    expect(computePrimingTouchRate(60)).toBe(100);
  });
});

// ─── computeScrutinyMultiplier ────────────────────────────────────────────────

describe('computeScrutinyMultiplier', () => {
  it('returns 90 when actionScore = 0', () => {
    expect(computeScrutinyMultiplier(0, 100)).toBe(90);
  });

  it('returns 90 when actionScore = 66', () => {
    expect(computeScrutinyMultiplier(66, 100)).toBe(90);
  });

  // actionScore = 67 → floor((67-66) * 25 / 19 + 90) = floor(1.315 + 90) = 91
  it('returns 91 when actionScore = 67', () => {
    expect(computeScrutinyMultiplier(67, 100)).toBe(91);
  });

  // actionScore = 85 → floor((85-66) * 25 / 19 + 90) = floor(25 + 90) = 115
  it('returns 115 when actionScore = 85', () => {
    expect(computeScrutinyMultiplier(85, 100)).toBe(115);
  });

  // actionScore = 86 → 86 - 85 + 115 = 116
  it('returns 116 when actionScore = 86', () => {
    expect(computeScrutinyMultiplier(86, 100)).toBe(116);
  });

  // actionScore = 95 (max, clamped from score=100) → 95 - 85 + 115 = 125
  it('returns 125 at maximum (actionScore clamped to 95)', () => {
    expect(computeScrutinyMultiplier(MAX_PLAYER, MAX_BASE)).toBe(125);
  });

  it('still returns 125 when playerPerception greatly exceeds base', () => {
    expect(computeScrutinyMultiplier(5000, 100)).toBe(125);
  });
});

// ─── computeScoutOutcome (最大值 case 實測驗證) ───────────────────────────────

describe('computeScourOutcome — max value case verification', () => {
  const scour = 200;          // computeScourValue at max
  const multiplier = 125;     // computeScrutinyMultiplier at max
  const scrutinyBonus = computeScrutinyBonus(scour, multiplier); // floor(200 * 125 / 100) = 250
  const valueBonus = computeValueBonus(scour);                   // floor(200 * 50 / 100) = 100

  it('computeScrutinyBonus at max = 250', () => {
    expect(scrutinyBonus).toBe(250);
  });

  it('computeValueBonus at max = 100', () => {
    expect(valueBonus).toBe(100);
  });

  // 無 buff + Scour：+200 / +300
  it('no buff: base=200, withValueUp=300', () => {
    const result = computeScourOutcome(scour, false, multiplier);
    expect(result.base).toBe(200);
    expect(result.withValueUp).toBe(300);
  });

  // Scrutiny + Scour：+450 / +550
  it('Scrutiny: base=450, withValueUp=550', () => {
    const result = computeScourOutcome(scour, true, multiplier);
    expect(result.base).toBe(450);
    expect(result.withValueUp).toBe(550);
  });
});

// ─── computeMeticulousOutcome (最大值 case 實測驗證) ─────────────────────────

describe('computeMeticulousOutcome — max value case verification', () => {
  const scour = 200;
  const multiplier = 125;

  // 無 buff + Meticulous：+150 / +250
  it('no buff: base=150, withValueUp=250', () => {
    const result = computeMeticulousOutcome(scour, false, multiplier, false);
    expect(result.base).toBe(150);
    expect(result.withValueUp).toBe(250);
  });

  // Collector's Standard + Meticulous：+200 / +300
  it('Collector Standard only: base=200, withValueUp=300', () => {
    const result = computeMeticulousOutcome(scour, false, multiplier, true);
    expect(result.base).toBe(200);
    expect(result.withValueUp).toBe(300);
  });

  // Scrutiny + Meticulous (無 Standard)：+400 / +500
  it('Scrutiny only: base=400, withValueUp=500', () => {
    const result = computeMeticulousOutcome(scour, true, multiplier, false);
    expect(result.base).toBe(400);
    expect(result.withValueUp).toBe(500);
  });

  // Scrutiny + Collector's Standard + Meticulous：+450 / +550
  it('Scrutiny + Collector Standard: base=450, withValueUp=550', () => {
    const result = computeMeticulousOutcome(scour, true, multiplier, true);
    expect(result.base).toBe(450);
    expect(result.withValueUp).toBe(550);
  });
});
