/**
 * FFXIV 採集底層公式實作
 */

/** 成功率計算 */
export function calculateSuccessRate(
  gathering: number,
  baseGathering: number,
  playerLevel: number,
  itemLevel: number
): number {
  if (!baseGathering) return 0;

  const score = Math.floor((100 * gathering) / baseGathering);
  let rate = 0;

  if (score >= 80) rate = 100;
  else if (score >= 76) rate = 94 + (score - 75) * 1;
  else if (score >= 64) rate = 72 + (score - 64) * 2;
  else if (score >= 46) rate = 60 + Math.floor(((score - 45) * 5) / 9);
  else if (score === 45) rate = 60;
  else if (score === 44) rate = 58;
  else if (score >= 41) rate = 52 + (score - 40) * 2;
  else if (score >= 21) rate = Math.floor(20 + (score - 20) * 1.6);
  else if (score >= 11) rate = 2 + (score - 11) * 2;
  else if (score >= 1) rate = 1;
  else rate = 0;

  // 等級修正
  if (itemLevel > 0 && rate > 0 && rate < 100) {
    const diff = playerLevel - itemLevel;
    if (diff > 0) {
      rate += Math.min(5, diff);
    } else if (diff < 0) {
      rate += Math.max(-25, diff * 5);
    }
  }

  return Math.min(100, Math.max(0, rate));
}

/** 獲得力加成率 (Boon Chance) 計算 */
export function calculateBoonChance(
  perception: number,
  basePerception: number
): number {
  if (!basePerception) return 0;

  const boonScore = Math.min(150, Math.floor((100 * perception) / basePerception));
  let rate = 0;

  if (boonScore >= 100) rate = ((boonScore - 100) / 50) * 25 + 35;
  else if (boonScore >= 80) rate = ((boonScore - 80) / 20) * 20 + 15;
  else if (boonScore >= 70) rate = ((boonScore - 70) / 10) * 5 + 10;
  else if (boonScore >= 60) rate = ((boonScore - 60) / 10) * 10;
  else rate = 0;

  return Math.min(60, Math.max(0, Math.floor(rate)));
}

/** 高產/豐收加成量 (+1/+2/+3) */
export function calculateBountifulYield(
  gathering: number,
  baseGathering: number
): number {
  if (!baseGathering) return 1;
  if (gathering >= Math.floor(baseGathering * 1.1)) return 3;
  if (gathering >= Math.floor(baseGathering * 0.9)) return 2;
  return 1;
}
