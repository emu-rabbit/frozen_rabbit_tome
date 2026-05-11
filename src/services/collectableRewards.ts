/**
 * 收藏品報酬資料服務
 * 從 Teamcraft raw GitHub CDN 取得 collectables.json，並以 localStorage 快取 24 小時。
 */

import type { CollectableRewardThreshold, CollectableRewardVector } from '../types/collectable';

const CACHE_KEY = 'frozen-rabbit-tome-collectable-rewards-cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const TEAMCRAFT_URL =
  'https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/master/libs/data/src/lib/json/collectables.json';

interface CacheEntry {
  fetchedAt: number;
  data: Record<string, unknown>;
}

let _memoryCache: Record<string, unknown> | null = null;

function emptyReward(): CollectableRewardVector {
  return { exp: 0, gil: 0, scrip: 0, items: {} };
}

function parseRewardVector(raw: unknown): CollectableRewardVector {
  if (!raw || typeof raw !== 'object') return emptyReward();
  const r = raw as Record<string, unknown>;
  return {
    exp: typeof r.exp === 'number' ? r.exp : 0,
    gil: typeof r.gil === 'number' ? r.gil : 0,
    scrip: typeof r.scrip === 'number' ? r.scrip : 0,
    items: {}
  };
}

function parseFromShopEntry(entry: Record<string, unknown>): CollectableRewardThreshold | null {
  // Format A: { thresholds: [low, mid, high], reward: { low, mid, high } }
  if (Array.isArray(entry.thresholds) && entry.thresholds.length >= 2) {
    const [low = 0, mid = 0, high = 0] = entry.thresholds as number[];
    const rewardObj = (entry.reward ?? {}) as Record<string, unknown>;
    return {
      low,
      mid,
      high,
      rewards: {
        low: parseRewardVector(rewardObj.low),
        mid: parseRewardVector(rewardObj.mid),
        high: parseRewardVector(rewardObj.high)
      }
    };
  }
  return null;
}

function extractItemReward(rawItem: unknown): CollectableRewardThreshold | null {
  if (!rawItem || typeof rawItem !== 'object') return null;
  const item = rawItem as Record<string, unknown>;

  // Try direct thresholds on item
  const direct = parseFromShopEntry(item);
  if (direct) return direct;

  // shops as array
  if (Array.isArray(item.shops)) {
    for (const shop of item.shops) {
      const result = parseFromShopEntry(shop as Record<string, unknown>);
      if (result) return result;
    }
  }

  // shops as object
  if (item.shops && typeof item.shops === 'object' && !Array.isArray(item.shops)) {
    for (const shop of Object.values(item.shops as Record<string, unknown>)) {
      const result = parseFromShopEntry(shop as Record<string, unknown>);
      if (result) return result;
    }
  }

  return null;
}

async function fetchAndCache(): Promise<Record<string, unknown>> {
  const response = await fetch(TEAMCRAFT_URL);
  if (!response.ok) throw new Error(`Teamcraft fetch failed: ${response.status}`);
  const data = await response.json() as Record<string, unknown>;

  _memoryCache = data;
  try {
    const entry: CacheEntry = { fetchedAt: Date.now(), data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage 滿或禁用時忽略，使用記憶體快取
  }

  return data;
}

async function getRewardData(): Promise<Record<string, unknown>> {
  if (_memoryCache) return _memoryCache;

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const entry = JSON.parse(raw) as CacheEntry;
      if (Date.now() - entry.fetchedAt < CACHE_TTL_MS) {
        _memoryCache = entry.data;
        return entry.data;
      }
    }
  } catch {
    // 忽略解析錯誤，重新 fetch
  }

  return fetchAndCache();
}

/** 取得指定物品的報酬門檻資訊，找不到時回傳 null */
export async function getCollectableRewardInfo(itemId: number): Promise<CollectableRewardThreshold | null> {
  const data = await getRewardData();
  return extractItemReward(data[String(itemId)]);
}

/** 強制清除快取，下次使用時重新 fetch */
export async function refreshCollectableRewardsCache(): Promise<void> {
  _memoryCache = null;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
  await fetchAndCache();
}
