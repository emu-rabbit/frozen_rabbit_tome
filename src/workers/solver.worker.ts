import { calculateSuccessRate, calculateBoonChance, calculateBountifulYield } from '../utils/gatheringMath';
import type { SolverRequest, SolverResponse } from '../types/game';

/**
 * 採集策略搜尋 Worker (全技能與等級判定版)
 */

interface SearchState {
  gp: number;
  integrity: number;
  yieldAcc: number;
  buffs: {
    successRateBonus: number;
    boonRateBonus: number;
    boonYieldBonus: number;
    nextYieldBonus: number;
    allYieldBonus: number;
    wttwProc: boolean;
  };
  rotation: string[];
}

self.onmessage = (e: MessageEvent<SolverRequest>) => {
  const startTime = performance.now();
  const request = e.data;
  const { stats, baseValues, itemLevel, nodeBonuses, temporaryGp, jobType } = request;

  // 基礎值計算
  const baseSuccessRate = calculateSuccessRate(stats.gathering, baseValues.Gathering, stats.level, itemLevel);
  const baseBoonChance = calculateBoonChance(stats.perception, baseValues.Perception);
  const byAmount = calculateBountifulYield(stats.gathering, baseValues.Gathering);

  let bestYield = 0;
  let bestRotation: string[] = [];

  /**
   * 搜尋引擎
   */
  function solve(state: SearchState) {
    const { gp, integrity, yieldAcc, buffs, rotation } = state;

    // 終止條件
    if (integrity <= 0) {
      if (yieldAcc > bestYield) {
        bestYield = yieldAcc;
        bestRotation = [...rotation];
      }
      return;
    }

    // 剪枝
    const maxRemaining = integrity * (1 + 3 + 2 + 1);
    if (yieldAcc + maxRemaining < bestYield) return;

    // --- 動作列表 ---

    // 1. 採集 (Gather)
    {
      const currentSuccess = Math.min(100, baseSuccessRate + buffs.successRateBonus) / 100;
      const currentBoon = Math.min(60, baseBoonChance + buffs.boonRateBonus) / 100;
      const yieldPerGather = 1 + nodeBonuses.yieldCount + buffs.allYieldBonus + buffs.nextYieldBonus;
      const stepEV = currentSuccess * (yieldPerGather + currentBoon * (1 + buffs.boonYieldBonus));
      
      const nextGp = Math.min(stats.gp, gp + 6);
      solve({
        gp: nextGp,
        integrity: integrity - 1,
        yieldAcc: yieldAcc + stepEV,
        buffs: { ...buffs, nextYieldBonus: 0 },
        rotation: [...rotation, '採集']
      });
    }

    // 2. 獲得率技能 (Success Rate)
    // SV3 / FM3 (Lv 10, 250 GP, +50%)
    if (stats.level >= 10 && gp >= 250 && baseSuccessRate + buffs.successRateBonus < 100) {
      const name = jobType === 'miner' ? '敏銳視野III' : '環境探知III';
      solve({ ...state, gp: gp - 250, buffs: { ...buffs, successRateBonus: buffs.successRateBonus + 50 }, rotation: [...rotation, name] });
    }
    // SV2 / FM2 (Lv 5, 100 GP, +15%)
    if (stats.level >= 5 && gp >= 100 && baseSuccessRate + buffs.successRateBonus < 100) {
      const name = jobType === 'miner' ? '敏銳視野II' : '環境探知II';
      solve({ ...state, gp: gp - 100, buffs: { ...buffs, successRateBonus: buffs.successRateBonus + 15 }, rotation: [...rotation, name] });
    }
    // SV1 / FM1 (Lv 4, 50 GP, +5%)
    if (stats.level >= 4 && gp >= 50 && baseSuccessRate + buffs.successRateBonus < 100) {
      const name = jobType === 'miner' ? '敏銳視野' : '環境探知';
      solve({ ...state, gp: gp - 50, buffs: { ...buffs, successRateBonus: buffs.successRateBonus + 5 }, rotation: [...rotation, name] });
    }

    // 3. 獲得數技能 (Yield)
    // BY2 / BH2 (Lv 68, 100 GP, +1~3)
    if (stats.level >= 68 && gp >= 100 && buffs.nextYieldBonus === 0) {
      const name = jobType === 'miner' ? '高產II' : '豐收II';
      solve({ ...state, gp: gp - 100, buffs: { ...buffs, nextYieldBonus: byAmount }, rotation: [...rotation, name] });
    } 
    // BY1 / BH1 (Lv 24, 100 GP, +1) - 只有在沒學會 II 時才有意義，但為保險納入
    else if (stats.level >= 24 && gp >= 100 && buffs.nextYieldBonus === 0) {
      const name = jobType === 'miner' ? '高產' : '豐收';
      solve({ ...state, gp: gp - 100, buffs: { ...buffs, nextYieldBonus: 1 }, rotation: [...rotation, name] });
    }

    // KY2 / BH2 (Lv 40, 500 GP, +2)
    if (stats.level >= 40 && gp >= 500 && buffs.allYieldBonus < 2) {
      const name = jobType === 'miner' ? '莫非王土II' : '天賜收成II';
      solve({ ...state, gp: gp - 500, buffs: { ...buffs, allYieldBonus: 2 }, rotation: [...rotation, name] });
    }
    // KY1 / BH1 (Lv 30, 400 GP, +1)
    if (stats.level >= 30 && gp >= 400 && buffs.allYieldBonus < 1) {
      const name = jobType === 'miner' ? '莫非王土' : '天賜收成';
      solve({ ...state, gp: gp - 400, buffs: { ...buffs, allYieldBonus: 1 }, rotation: [...rotation, name] });
    }

    // 4. 加成率技能 (Boon)
    // MG2 / PG2 (Lv 50, 100 GP, +30%)
    if (stats.level >= 50 && gp >= 100 && baseBoonChance + buffs.boonRateBonus < 60) {
      const name = jobType === 'miner' ? '富礦的饋贈II' : '沃土的饋贈II';
      solve({ ...state, gp: gp - 100, buffs: { ...buffs, boonRateBonus: buffs.boonRateBonus + 30 }, rotation: [...rotation, name] });
    }
    // MG1 / PG1 (Lv 15, 50 GP, +10%)
    if (stats.level >= 15 && gp >= 50 && baseBoonChance + buffs.boonRateBonus < 60) {
      const name = jobType === 'miner' ? '富礦的饋贈' : '沃土的饋贈';
      solve({ ...state, gp: gp - 50, buffs: { ...buffs, boonRateBonus: buffs.boonRateBonus + 10 }, rotation: [...rotation, name] });
    }

    // 5. 額外加成 (Tidings)
    // NT / NT (Lv 81, 200 GP, +1)
    if (stats.level >= 81 && gp >= 200 && buffs.boonYieldBonus === 0) {
      const name = jobType === 'miner' ? '納爾札爾福音' : '諾菲卡福音';
      solve({ ...state, gp: gp - 200, buffs: { ...buffs, boonYieldBonus: 1 }, rotation: [...rotation, name] });
    }

    // 6. 回復次數 (Restore)
    // SR / AW (Lv 25, 300 GP, +1)
    if (stats.level >= 25 && gp >= 300) {
      const name = jobType === 'miner' ? '石工之理' : '農夫之智';
      const canProc = stats.level >= 90; // 90 級以上才有機率觸發理智同興預備
      
      if (canProc) {
        solve({ ...state, gp: gp - 300, integrity: integrity + 1, buffs: { ...buffs, wttwProc: true }, rotation: [...rotation, `${name}(觸發)`] });
      }
      solve({ ...state, gp: gp - 300, integrity: integrity + 1, buffs: { ...buffs, wttwProc: false }, rotation: [...rotation, name] });
    }

    // WttW (Lv 90, 200 GP, +1)
    if (stats.level >= 90 && gp >= 200 && buffs.wttwProc) {
      solve({ ...state, gp: gp - 200, integrity: integrity + 1, buffs: { ...buffs, wttwProc: false }, rotation: [...rotation, '理智同興'] });
    }
  }

  const initialIntegrity = nodeBonuses.baseIntegrity + nodeBonuses.gatheringCount;
  solve({
    gp: temporaryGp,
    integrity: initialIntegrity,
    yieldAcc: 0,
    buffs: {
      successRateBonus: 0,
      boonRateBonus: nodeBonuses.extraRate,
      boonYieldBonus: 0,
      nextYieldBonus: 0,
      allYieldBonus: 0,
      wttwProc: false
    },
    rotation: []
  });

  self.postMessage({
    bestRotation,
    expectedYield: Number(bestYield.toFixed(2)),
    calculationTime: Math.floor(performance.now() - startTime)
  } as SolverResponse);
};
