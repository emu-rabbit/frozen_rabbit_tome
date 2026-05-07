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
}

/** 玩家核心屬性數值 */
export interface PlayerStats {
  /** 獲得力 (Gathering) */
  gathering: number;
  /** 鑑別力 (Perception) */
  perception: number;
  /** 採集力 (GP) */
  gp: number;
}

/** 使用者各職業的裝備數值狀態 */
export interface UserStats {
  /** 採掘師 */
  miner: PlayerStats;
  /** 園藝師 */
  botanist: PlayerStats;
}
