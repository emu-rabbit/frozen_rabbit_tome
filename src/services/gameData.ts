import { ref } from 'vue';
import type { GatherableItem } from '../types/game';

// ─── 常數設定 ───────────────────────────────────────────────────────────────

const TEAMCRAFT_BRANCH = import.meta.env.VITE_TEAMCRAFT_BRANCH ?? 'staging';
const BASE_URL = `https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/${TEAMCRAFT_BRANCH}/libs/data/src/lib/json`;

/** 語系字典 URL */
const DICT_URLS: Record<string, string> = {
  tw: `${BASE_URL}/tw/tw-items.json`,
  zh: `${BASE_URL}/zh/zh-items.json`,
  cn: `${BASE_URL}/zh/zh-items.json`,
  en: `${BASE_URL}/items.json`,
  ja: `${BASE_URL}/items.json`,
};

const ENGLISH_URL = `${BASE_URL}/items.json`;
const ICONS_URL = `${BASE_URL}/item-icons.json`;
const XIVAPI_CSV_URL = 'https://raw.githubusercontent.com/xivapi/ffxiv-datamining/master/csv/en/GatheringItem.csv';
const GATHERING_POINT_BASE_CSV_URL = 'https://raw.githubusercontent.com/xivapi/ffxiv-datamining/master/csv/en/GatheringPointBase.csv';
const GATHERING_POINT_CSV_URL = 'https://raw.githubusercontent.com/xivapi/ffxiv-datamining/master/csv/en/GatheringPoint.csv';

// ─── Module-level Singleton Cache ──────────────────────────────────────────

let rawEnglishNames: Record<string, any> = {};
let rawTargetNames: Record<string, any> = {};
let rawIcons: Record<string, string> = {};
let itemInfoMap = new Map<number, { glv: number; jobType: 'miner' | 'botanist'; perceptionReq: number; gatheringItemId: number }>();
let rawItemLevels: Record<string, any> = {};
let rawGatheringItems: Record<string, any> = {};
let rawGatheringSearchIndex: Record<string, { types: number[] }> = {};

/** 最終對照表：GatheringItemID -> Count */
let itemIntegrityMap = new Map<number, number>();

export const currentLanguage = ref('');
let staticDataLoaded = false;
let staticLoadPromise: Promise<void> | null = null;
let langLoadPromise: Promise<void> | null = null;
export const isGameDataLoading = ref(false);

// ─── 輔助解析函數 ────────────────────────────────────────────────────────────

function extractName(entry: any, lang: string): string {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object') {
    return entry[lang] || entry['en'] || (Object.values(entry)[0] as string) || '';
  }
  return '';
}

/** 核心解析：清除引號並轉換為數字 */
function cleanInt(val: string): number {
  if (!val) return 0;
  return parseInt(val.replace(/"/g, '').trim(), 10) || 0;
}

/** 1. 解析 GatheringItem.csv (ItemID -> GatheringItemID) */
async function parseGatheringItemCsv(csvText: string): Promise<Map<number, { glv: number; jobType: 'miner' | 'botanist'; perceptionReq: number; gatheringItemId: number }>> {
  const map = new Map<number, { glv: number; jobType: 'miner' | 'botanist'; perceptionReq: number; gatheringItemId: number }>();
  const lines = csvText.split('\n');
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 8) continue;

    const gItemId = cleanInt(parts[0]);
    const itemId = cleanInt(parts[3]);
    const glvId = cleanInt(parts[4]);
    const perceptionReq = cleanInt(parts[5]);
    const typeId = cleanInt(parts[7]);

    if (itemId > 0) {
      const searchEntry = rawGatheringSearchIndex[itemId.toString()];
      let jobType: 'miner' | 'botanist';
      if (searchEntry && searchEntry.types && searchEntry.types.length > 0) {
        const firstType = searchEntry.types[0];
        jobType = (firstType === 0 || firstType === 1) ? 'miner' : 'botanist';
      } else {
        jobType = (typeId === 0 || typeId === 1) ? 'miner' : 'botanist';
      }
      map.set(itemId, { glv: glvId, jobType, perceptionReq, gatheringItemId: gItemId });
    }
  }
  return map;
}

/** 2. 解析 GatheringPointBase.csv (GatheringItemID -> BaseID) */
async function parseGatheringPointBaseCsv(csvText: string): Promise<Map<number, number[]>> {
  const map = new Map<number, number[]>();
  const lines = csvText.split('\n');
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 10) continue;

    const baseId = cleanInt(parts[0]);
    if (baseId === 0) continue;

    for (let j = 2; j <= 9; j++) {
      const gItemId = cleanInt(parts[j]);
      if (gItemId > 0) {
        if (!map.has(gItemId)) map.set(gItemId, []);
        map.get(gItemId)!.push(baseId);
      }
    }
  }
  return map;
}

/** 3. 解析 GatheringPoint.csv (BaseID -> Count) */
async function parseGatheringPointCsv(csvText: string): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  const lines = csvText.split('\n');
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 10) continue;

    const baseId = cleanInt(parts[1]); // GatheringPointBase 關聯欄位
    const count = cleanInt(parts[9]);   // Count 欄位 (根據 Header 應為索引 9)

    if (baseId > 0 && count > 0) {
      const current = map.get(baseId) || 0;
      if (count > current) map.set(baseId, count);
    }
  }
  return map;
}

// ─── 靜態資料載入 ────────────────────────────────────────────────────────────

async function loadStaticData(): Promise<void> {
  if (staticDataLoaded) return;
  if (staticLoadPromise) return staticLoadPromise;

  staticLoadPromise = (async () => {
    try {
      console.log('[GameData] Loading assets and tracing CSV path...');
      const [iconsRes, gItemRes, gPointRes, gPointBaseRes, searchRes, levelRes, gItemsJsonRes] = await Promise.all([
        fetch(ICONS_URL),
        fetch(XIVAPI_CSV_URL),
        fetch(GATHERING_POINT_CSV_URL),
        fetch(GATHERING_POINT_BASE_CSV_URL),
        fetch(`${BASE_URL}/gathering-search-index.json`),
        fetch(`${BASE_URL}/item-level.json`),
        fetch(`${BASE_URL}/gathering-items.json`)
      ]);

      if (iconsRes.ok) rawIcons = await iconsRes.json();
      if (searchRes.ok) rawGatheringSearchIndex = await searchRes.json();
      if (levelRes.ok) rawItemLevels = await levelRes.json();
      if (gItemsJsonRes.ok) rawGatheringItems = await gItemsJsonRes.json();

      // 執行追蹤鏈條：Item -> GatherID -> BaseID -> Count
      if (gItemRes.ok && gPointRes.ok && gPointBaseRes.ok) {
        const itemInfo = await parseGatheringItemCsv(await gItemRes.text());
        itemInfoMap = itemInfo;

        const itemToBase = await parseGatheringPointBaseCsv(await gPointBaseRes.text());
        const baseToCount = await parseGatheringPointCsv(await gPointRes.text());

        // 整合映射
        itemToBase.forEach((baseIds, gItemId) => {
          let maxCount = 0;
          baseIds.forEach(bid => {
            const c = baseToCount.get(bid) || 0;
            if (c > maxCount) maxCount = c;
          });
          if (maxCount > 0) {
            itemIntegrityMap.set(gItemId, maxCount);
          }
        });
      }

      console.log(`[GameData] Trace complete. Integrity map built: ${itemIntegrityMap.size} items`);
      staticDataLoaded = true;
    } catch (err) {
      console.error('[GameData] Static data trace failed:', err);
    } finally {
      staticLoadPromise = null;
    }
  })();
  return staticLoadPromise;
}

async function loadLangData(lang: string): Promise<void> {
  if (currentLanguage.value === lang && Object.keys(rawTargetNames).length > 0) return;
  if (langLoadPromise) await langLoadPromise;
  langLoadPromise = (async () => {
    try {
      const dictUrl = DICT_URLS[lang] || DICT_URLS.tw;
      const needsEnglish = lang !== 'en' && Object.keys(rawEnglishNames).length === 0;
      const results = await Promise.all([fetch(dictUrl), ...(needsEnglish ? [fetch(ENGLISH_URL)] : [])]);
      if (results[0].ok) rawTargetNames = await results[0].json();
      if (needsEnglish && results[1]?.ok) rawEnglishNames = await results[1].json();
      else if (lang === 'en') rawEnglishNames = rawTargetNames;
      currentLanguage.value = lang;
    } finally {
      langLoadPromise = null;
    }
  })();
  return langLoadPromise;
}

// ─── 公開 API ────────────────────────────────────────────────────────────────

export async function loadGameData(lang: string): Promise<void> {
  isGameDataLoading.value = true;
  try {
    await Promise.all([loadStaticData(), loadLangData(lang)]);
  } finally {
    isGameDataLoading.value = false;
  }
}

export async function searchGatherables(query: string): Promise<GatherableItem[]> {
  const q = query.trim().toLowerCase();
  if (!q || itemInfoMap.size === 0) return [];
  const results: GatherableItem[] = [];
  for (const [itemId, info] of itemInfoMap) {
    const localeRaw = extractName(rawTargetNames[itemId.toString()], currentLanguage.value);
    const enRaw = extractName(rawEnglishNames[itemId.toString()], 'en');
    const nameLocale = localeRaw || enRaw;
    const nameEn = enRaw || localeRaw;
    if (!nameLocale && !nameEn) continue;
    if (nameLocale.toLowerCase().includes(q) || nameEn.toLowerCase().includes(q)) {
      results.push({
        itemId,
        nameLocale,
        nameEn,
        glv: info.glv,
        jobType: info.jobType,
        perceptionReq: info.perceptionReq,
        gatheringItemId: info.gatheringItemId,
        iconUrl: rawIcons[itemId.toString()] ? `https://xivapi.com${rawIcons[itemId.toString()]}` : '',
        isFallback: !localeRaw && !!enRaw,
      });
    }
    if (results.length >= 50) break;
  }
  if (results.length > 0) {
    const itemIds = results.map(r => r.itemId).join(',');
    const resp = await fetch(`https://xivapi.com/Item?ids=${itemIds}&columns=ID,IsCollectable`);
    if (resp.ok) {
      const data = await resp.json();
      const collectableMap = new Map<number, boolean>();
      data.Results?.forEach((item: any) => collectableMap.set(item.ID, item.IsCollectable === 1));
      results.forEach(r => r.isCollectable = collectableMap.get(r.itemId) ?? false);
    }
  }
  return results;
}

export function getItemName(itemId: number): string {
  const idStr = itemId.toString();
  return extractName(rawTargetNames[idStr], currentLanguage.value) || extractName(rawEnglishNames[idStr], 'en') || `Item #${itemId}`;
}

export function getItemEnglishName(itemId: number): string {
  return extractName(rawEnglishNames[itemId.toString()], 'en') || '';
}

export function getItemIcon(itemId: number): string {
  const path = rawIcons[itemId.toString()];
  return path ? `https://xivapi.com${path}` : '';
}

export function getItemLevelData() { return rawItemLevels; }
export function getGatheringItemsData() { return rawGatheringItems; }

/** 獲取特定物品的基礎耐久度 (根據 GatheringItem ID) */
export function getItemBaseIntegrity(gatheringItemId: number): number {
  return itemIntegrityMap.get(gatheringItemId) || 4;
}
