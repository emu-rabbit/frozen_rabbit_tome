// === FFXIV 採集物品 型別定義 ===
// 對應姊妹站 frozen_rabbit_workshop 的 MockItem 擴展版本

/** 可採集物品（僅限採礦師/園藝師，排除漁師與收藏品） */
export interface GatherableItem {
  /** FFXIV 物品 ID */
  itemId: number;
  /** 英文名稱（永遠存在，作為 fallback） */
  nameEn: string;
  /** 當前語系名稱，若無翻譯則與 nameEn 相同 */
  nameLocale: string;
  /** GatheringItem Level (Glv)，來自 GatheringItem.csv */
  glv: number;
  /** xivapi.com 完整圖示 URL */
  iconUrl: string;
  /** 是否缺乏本地語系翻譯（顯示英文 fallback 時為 true） */
  isFallback: boolean;
  /** 是否為收藏品系統物品（由 XIVAPI 動態判定） */
  isCollectable?: boolean;
  /** 是否為碎晶、水晶或晶簇的水晶採集系統物品 */
  isCrystalGathering?: boolean;
  /** 採集職業類型 */
  jobType?: 'miner' | 'botanist';
  perceptionReq?: number;
  /** GatheringItem ID (用於關聯 GatheringPointBase) */
  gatheringItemId?: number;
  /** 是否推定為限時採集點（再起機率使用） */
  isTimedNode?: boolean;
}

/** 玩家核心屬性數值 */
export interface PlayerStats {
  /** 等級 (Level) */
  level: number;
  /** 獲得力 (Gathering) */
  gathering: number;
  /** 鑑別力 (Perception) */
  perception: number;
  /** 採集力 (GP) */
  gp: number;
}

export type FoodStat = 'gathering' | 'perception' | 'gp';
export type FoodQuality = 'nq' | 'hq';

export interface FoodBonusValue {
  value: number;
  max: number;
}

export interface FoodBonus {
  nq: FoodBonusValue;
  hq: FoodBonusValue;
}

export interface GatheringFood {
  id: number;
  levelItem: number;
  levelEquip: number;
  bonuses: Partial<Record<'Gathering' | 'Perception' | 'GP', FoodBonus>>;
}

export interface FoodSelection {
  foodId: number | null;
  quality: FoodQuality;
}

export interface AppliedFoodBonus {
  gathering: number;
  perception: number;
  gp: number;
}

/** 採集點獎勵 (Node Bonuses) */
export interface NodeBonuses {
  /** 節點基礎耐久/採集次數 (Base Integrity) */
  baseIntegrity: number;
  /** 採集次數增加 (Gathering Count Increase) */
  gatheringCount: number;
  /** 獲得數增加 (Yield Increase) */
  yieldCount: number;
  /** 額外率增加 (Extra Rate Increase) */
  extraRate: number;
}

/** 使用者各職業的裝備數值狀態 */
export interface UserStats {
  /** 採掘師 */
  miner: PlayerStats;
  /** 園藝師 */
  botanist: PlayerStats;
}

export interface MacroSettings {
  secondsPerGather: number;
  bufferSeconds: number;
}

/** 採集動作類型 */
export type GatheringAction = 'Gather' | 'BountifulYield' | 'KingsYield' | 'SolidReason' | 'WiseToTheWorld';

/** 求解器請求 */
export interface SolverRequest {
  stats: PlayerStats;
  baseValues: {
    Gathering: number;
    Perception: number;
  };
  itemLevel: number;
  nodeBonuses: NodeBonuses;
  temporaryGp: number;
  jobType: 'miner' | 'botanist';
  isTimedNode?: boolean;
}

export type SolverRotationPlanKind = 'primary' | 'revisit';

export interface SolverRotationPlan {
  kind: SolverRotationPlanKind;
  rotation: string[];
  expectedYield: number;
}

export interface SolverRevisitInfo {
  enabled: boolean;
  chance: number;
  isFullGp: boolean;
}

/** 求解器回應 */
export interface SolverResponse {
  bestRotation: string[];
  rotationPlans: SolverRotationPlan[];
  revisit: SolverRevisitInfo;
  expectedYield: number;
  minYield: number;
  maxYield: number;
  minYieldChance: number;
  maxYieldChance: number;
  calculationTime: number;
}

export interface StoredTomeNodeBonuses {
  gatheringCount: number;
  yieldCount: number;
  extraRate: number;
}

export type StoredTomeRotationStep =
  | { type: 'gather'; actionName?: string }
  | { type: 'action'; actionId: number; actionName?: string };

export interface StoredTomeRotationPlan {
  kind: SolverRotationPlanKind;
  rotation: StoredTomeRotationStep[];
}

export interface StoredTome {
  id: string;
  itemId: number;
  stats: PlayerStats;
  temporaryGp: number;
  food: FoodSelection;
  nodeBonuses: StoredTomeNodeBonuses;
  rotation: StoredTomeRotationStep[];
  rotationPlans?: StoredTomeRotationPlan[];
  revisit?: SolverRevisitInfo;
  createdAt: string;
}
