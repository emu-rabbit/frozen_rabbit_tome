/**
 * 收藏品採集系統底層公式實作
 *
 * 公式來源：.agents/skills/business/collectable_solver_v1_implementation.md
 * 所有公式已於 2026-05-10 使用者遊戲內最大值 case 實測驗證。
 *
 * 重要命名說明：
 *   valueIncreaseRate = Collector's Intuition 機率（不是洞察 Buff 觸發率）
 *   standardActive    = 洞察 Buff (Collector's Standard) 是否已觸發
 */

// ─── 通用分數輔助 ─────────────────────────────────────────────────────────────

function rawScore(currentStat: number, baseStat: number): number {
  if (!baseStat) return 0;
  return Math.floor((100 * currentStat) / baseStat);
}

/** ActionScore = min(95, floor(100 * stat / base)) */
function actionScore(currentStat: number, baseStat: number): number {
  return Math.min(95, rawScore(currentStat, baseStat));
}

/** RateScore = min(100, floor(100 * stat / base)) */
function rateScore(currentStat: number, baseStat: number): number {
  return Math.min(100, rawScore(currentStat, baseStat));
}

// ─── 公開公式 ─────────────────────────────────────────────────────────────────

/**
 * Scour 提煉量（使用 gathering / baseGathering）
 * 回傳值域：[150, 200]
 */
export function computeScourValue(playerGathering: number, baseGathering: number): number {
  const score = actionScore(playerGathering, baseGathering);
  if (score <= 66) return 150;
  if (score <= 85) return Math.floor((score - 66) * 40 / 19 + 150);
  return score - 85 + 190; // max 200 at score 95
}

/**
 * 價值提升率 / Collector's Intuition 機率（%，使用 gathering / baseGathering）
 * 回傳值域：[10, 40]
 */
export function computeValueIncreaseRate(playerGathering: number, baseGathering: number): number {
  const score = rateScore(playerGathering, baseGathering);
  if (score <= 66) return 10;
  if (score <= 85) return Math.floor((score - 66) * 10 / 19 + 10);
  return Math.floor((score - 85) * 20 / 15 + 20); // max 40 at score 100
}

/**
 * 開啟 Collector's Focus 後的價值提升率（%）
 * 最大值：40 → 70
 */
export function computeCollectorsFocusRate(valueIncreaseRate: number): number {
  return Math.floor(valueIncreaseRate * 175 / 100);
}

/**
 * Meticulous 不耗耐久率（%，使用 gathering / baseGathering）
 * 回傳值域：[5, 25]
 */
export function computeMeticulousNoDurRate(playerGathering: number, baseGathering: number): number {
  const score = rateScore(playerGathering, baseGathering);
  if (score <= 66) return 5;
  if (score <= 85) return Math.floor((score - 66) * 5 / 19 + 5);
  return score - 85 + 10; // max 25 at score 100
}

/**
 * 開啟 Priming Touch 後的 Meticulous 不耗耐久率（%）
 * 第一版不含強化洞察（Collector's High Standard）
 * 最大值：25 → 50
 */
export function computePrimingTouchRate(meticulousNoDurRate: number): number {
  return Math.min(100, meticulousNoDurRate * 2);
}

/**
 * Scrutiny 倍率（使用 perception / basePerception）
 * 回傳值域：[90, 125]
 */
export function computeScrutinyMultiplier(playerPerception: number, basePerception: number): number {
  const score = actionScore(playerPerception, basePerception);
  if (score <= 66) return 90;
  if (score <= 85) return Math.floor((score - 66) * 25 / 19 + 90);
  return score - 85 + 115; // max 125 at score 95
}

/**
 * Scrutiny 加成量（套用到下一次提煉技能的額外收藏值）
 * scrutinyBonus = floor(scourValue * scrutinyMultiplier / 100)
 */
export function computeScrutinyBonus(scourValue: number, scrutinyMultiplier: number): number {
  return Math.floor(scourValue * scrutinyMultiplier / 100);
}

/**
 * 價值提升額外加成量（固定為 floor(scourValue * 50 / 100)，與 Scrutiny 無關）
 */
export function computeValueBonus(scourValue: number): number {
  return Math.floor(scourValue * 50 / 100);
}

// ─── Outcome 計算 ─────────────────────────────────────────────────────────────

export interface ScourOutcome {
  /** 未觸發價值提升 */
  base: number;
  /** 觸發價值提升 */
  withValueUp: number;
}

/**
 * Scour 的收藏值增加量（含或不含 Scrutiny buff）
 *
 * 最大值 case 驗證：
 *   無 Scrutiny：+200 / +300
 *   Scrutiny：+450 / +550
 */
export function computeScourOutcome(
  scourValue: number,
  scrutinyActive: boolean,
  scrutinyMultiplier: number
): ScourOutcome {
  const bonus = scrutinyActive ? computeScrutinyBonus(scourValue, scrutinyMultiplier) : 0;
  const valueBonus = computeValueBonus(scourValue);
  return {
    base: scourValue + bonus,
    withValueUp: scourValue + bonus + valueBonus,
  };
}

export interface MeticulousOutcome {
  /** 未觸發價值提升 */
  base: number;
  /** 觸發價值提升 */
  withValueUp: number;
}

/**
 * Meticulous 的收藏值增加量（含 Scrutiny / Collector's Standard 狀態）
 *
 * Collector's Standard 令 Meticulous 等同 Scour 的基礎量。
 *
 * 最大值 case 驗證：
 *   無 buff：+150 / +250
 *   Standard：+200 / +300
 *   Scrutiny：+400 / +500
 *   Scrutiny + Standard：+450 / +550
 */
export function computeMeticulousOutcome(
  scourValue: number,
  scrutinyActive: boolean,
  scrutinyMultiplier: number,
  standardActive: boolean
): MeticulousOutcome {
  const bonus = scrutinyActive ? computeScrutinyBonus(scourValue, scrutinyMultiplier) : 0;
  const valueBonus = computeValueBonus(scourValue);
  // Standard 使 Meticulous 基礎量等同 Scour（否則為 floor(scour * 75/100)）
  const meticulousBase = standardActive
    ? scourValue
    : Math.floor(scourValue * 75 / 100);
  return {
    base: meticulousBase + bonus,
    withValueUp: meticulousBase + bonus + valueBonus,
  };
}

// ─── 完整公式參數（供 Debug 顯示） ───────────────────────────────────────────

export interface CollectableMathParams {
  actionScore: number;
  rateScore: number;
  perceptionActionScore: number;
  scourValue: number;
  valueIncreaseRate: number;
  collectorsFocusRate: number;
  meticulousNoDurRate: number;
  primingTouchRate: number;
  scrutinyMultiplier: number;
  scrutinyBonus: number;
  valueBonus: number;
}

export function computeAllParams(
  playerGathering: number,
  baseGathering: number,
  playerPerception: number,
  basePerception: number
): CollectableMathParams {
  const scour = computeScourValue(playerGathering, baseGathering);
  const virRate = computeValueIncreaseRate(playerGathering, baseGathering);
  const metRate = computeMeticulousNoDurRate(playerGathering, baseGathering);
  const scrMultiplier = computeScrutinyMultiplier(playerPerception, basePerception);

  return {
    actionScore: actionScore(playerGathering, baseGathering),
    rateScore: rateScore(playerGathering, baseGathering),
    perceptionActionScore: actionScore(playerPerception, basePerception),
    scourValue: scour,
    valueIncreaseRate: virRate,
    collectorsFocusRate: computeCollectorsFocusRate(virRate),
    meticulousNoDurRate: metRate,
    primingTouchRate: computePrimingTouchRate(metRate),
    scrutinyMultiplier: scrMultiplier,
    scrutinyBonus: computeScrutinyBonus(scour, scrMultiplier),
    valueBonus: computeValueBonus(scour),
  };
}
