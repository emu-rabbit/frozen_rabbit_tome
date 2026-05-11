// === 收藏品採集系統型別定義 ===

import type { PlayerStats, FoodSelection } from './game'

// ─── 搜尋狀態 ────────────────────────────────────────────────────────────────

export interface CollectableSearchState {
  gp: number
  /** 剩餘耐久 */
  integrity: number
  /** 當前收藏值 (0–1000) */
  collectability: number
  scrutinyActive: boolean
  collectorsFocusActive: boolean
  primingTouchActive: boolean
  /** 下一次 Meticulous 受 Collector's Standard 影響 */
  standardActive: boolean
  /** 是否已使用過至少一次收藏品技能（Standard 觸發前提） */
  hasUsedCollectableAction: boolean
}

// ─── 動作類型 ─────────────────────────────────────────────────────────────────

export type CollectableActionType =
  | 'scour'
  | 'meticulous'
  | 'scrutiny'
  | 'collectors-focus'
  | 'priming-touch'
  | 'collect'

// ─── 節點類型（影響 Collector's Standard 觸發率） ──────────────────────────

export type CollectableNodeType =
  | 'normal'       // 一般非限時收藏品點，25%
  | 'satisfaction' // 精選點，20%
  | 'legendary'    // 傳說點，13%
  | 'unknown'      // 預設使用 normal 機率

export const STANDARD_PROC_RATES: Record<CollectableNodeType, number> = {
  normal: 25,
  satisfaction: 20,
  legendary: 13,
  unknown: 25,
}

// ─── 報酬 ─────────────────────────────────────────────────────────────────────

export interface CollectableRewardVector {
  exp: number
  gil: number
  scrip: number
  /** itemId → 數量 */
  items: Record<number, number>
}

export interface CollectableRewardThreshold {
  low: number
  mid: number
  high: number
  rewards: {
    low: CollectableRewardVector
    mid: CollectableRewardVector
    high: CollectableRewardVector
  }
}

export type CollectableRewardTier = 'high' | 'mid' | 'low' | 'none'

// ─── Policy Tree ──────────────────────────────────────────────────────────────

export interface CollectablePolicyBranch {
  /** 顯示標籤，例如「價值提升觸發 (40%)」 */
  label: string
  /** 機率 (0–100)，整數百分比 */
  probability: number
  /** 此分支產生的收藏值變化量 */
  collectabilityDelta: number
  /** 是否消耗耐久（Meticulous 保留耐久時為 false） */
  consumesDurability: boolean
  /** 後續狀態的 policy；null 表示終止 */
  next: CollectablePolicyNode | null
}

export interface CollectablePolicyNode {
  /** 唯一 ID，用於 Vue key */
  id: string
  /** 此節點對應的狀態 */
  state: CollectableSearchState
  /** 建議執行的動作 */
  recommendedAction: CollectableActionType
  /** 此動作消耗的 GP */
  gpCost: number
  /** 從此節點出發的期望收藏值 */
  expectedCollectability: number
  /** 從此節點出發的期望 scrip */
  expectedScrip: number
  /** 此動作產生的結果分支 */
  branches: CollectablePolicyBranch[]
  /** 是否為終止節點 */
  isTerminal: boolean
  /** 終止原因 */
  terminalReason?: 'collect' | 'no-durability' | 'no-gp' | 'suboptimal'
}

// ─── 求解器輸入 ───────────────────────────────────────────────────────────────

export interface CollectablePlayerStats {
  level: number
  gathering: number
  perception: number
  /** 起始 GP */
  gp: number
}

export interface CollectableSolverRequest {
  stats: CollectablePlayerStats
  baseValues: {
    Gathering: number
    Perception: number
  }
  itemLevel: number
  /** 含獎勵的總耐久度 */
  integrity: number
  rewardThresholds: CollectableRewardThreshold
  nodeType: CollectableNodeType
  debugMode?: boolean
}

// ─── 求解器輸出 ───────────────────────────────────────────────────────────────

export interface CollectableFormulaDebugInfo {
  actionScore: number
  rateScore: number
  perceptionActionScore: number
  scourValue: number
  valueIncreaseRate: number
  collectorsFocusRate: number
  meticulousNoDurRate: number
  primingTouchRate: number
  scrutinyMultiplier: number
  scrutinyBonus: number
  valueBonus: number
}

export interface CollectableDebugInfo {
  playerStats: CollectablePlayerStats
  baseStats: { baseGathering: number; basePerception: number }
  formulas: CollectableFormulaDebugInfo
  rewardThresholds: CollectableRewardThreshold
  standardProcRate: number
  statesExplored: number
  memoHits: number
}

export interface CollectableSolverResult {
  expectedScrip: number
  expectedCollectability: number
  rewardTierProbabilities: { high: number; mid: number; low: number; none: number }
  policy: CollectablePolicyNode
  debug?: CollectableDebugInfo
}

// ─── 儲存型別（藏書庫） ───────────────────────────────────────────────────────

export interface StoredCollectableTome {
  tomeType: 'collectable'
  id: string
  itemId: number
  stats: PlayerStats
  temporaryGp: number
  food: FoodSelection
  /** 求解時使用的總耐久（基礎 + 獎勵） */
  integrity: number
  policy: CollectablePolicyNode
  expectedScrip: number
  expectedCollectability: number
  createdAt: string
}

/** 預留：水晶採集系統（TBD） */
export interface StoredCrystalTome {
  tomeType: 'crystal'
  id: string
  itemId: number
  stats: PlayerStats
  temporaryGp: number
  food: FoodSelection
  createdAt: string
}
