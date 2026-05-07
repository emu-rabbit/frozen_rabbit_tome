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

// ─── Module-level Singleton Cache ──────────────────────────────────────────

/** items.json 全量 */
let rawEnglishNames: Record<string, any> = {};
/** 當前語系字典 */
let rawTargetNames: Record<string, any> = {};
/** item-icons.json */
let rawIcons: Record<string, string> = {};
/** ItemID -> {Glv, JobType, PerceptionReq} */
let itemInfoMap = new Map<number, { glv: number; jobType: 'miner' | 'botanist'; perceptionReq: number }>();
/** item-level.json */
let rawItemLevels: Record<string, any> = {};
/** gathering-items.json */
let rawGatheringItems: Record<string, any> = {};
/** gathering-search-index.json: itemId -> { types: number[] } */
let rawGatheringSearchIndex: Record<string, { types: number[] }> = {};

/** 當前已載入的語言 */
export const currentLanguage = ref('');
/** 靜態資料是否已完成載入 */
let staticDataLoaded = false;
/** 靜態資料正在載入的 Promise */
let staticLoadPromise: Promise<void> | null = null;
/** 語系字典正在載入的 Promise */
let langLoadPromise: Promise<void> | null = null;

// ─── 公開響應式狀態 ──────────────────────────────────────────────────────────

export const isGameDataLoading = ref(false);

// ─── 輔助函數 ────────────────────────────────────────────────────────────────

function extractName(entry: any, lang: string): string {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object') {
    return entry[lang] || entry['en'] || (Object.values(entry)[0] as string) || '';
  }
  return '';
}

/** 解析 GatheringItem.csv 建立 ItemID -> {glv, jobType} 對照表
 *  職業分類優先使用 rawGatheringSearchIndex (Teamcraft)，
 *  其次以 CSV 欄位 7 (GatheringType) 作為備援：0,1=採掘師；2,3=園藝師。
 */
async function parseGatheringItemCsv(csvText: string): Promise<Map<number, { glv: number; jobType: 'miner' | 'botanist'; perceptionReq: number }>> {
  const map = new Map<number, { glv: number; jobType: 'miner' | 'botanist'; perceptionReq: number }>();
  const lines = csvText.split('\n');
  // 跳過前 3 行標頭
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 8) continue;
    const itemId = parseInt(parts[3], 10);
    const glvId = parseInt(parts[4], 10);
    const perceptionReq = parseInt(parts[5], 10) || 0;
    const typeId = parseInt(parts[7], 10);

    if (!isNaN(itemId) && !isNaN(glvId) && itemId > 0) {
      // 優先從 gathering-search-index 判斷 (最可靠)
      const searchEntry = rawGatheringSearchIndex[itemId.toString()];
      let jobType: 'miner' | 'botanist';

      if (searchEntry && searchEntry.types && searchEntry.types.length > 0) {
        // type 0=Mining, 1=Quarrying -> miner; 2=Logging, 3=Harvesting -> botanist
        const firstType = searchEntry.types[0];
        jobType = (firstType === 0 || firstType === 1) ? 'miner' : 'botanist';
      } else {
        // 備援：使用 CSV 的 GatheringType 欄位
        jobType = (typeId === 0 || typeId === 1) ? 'miner' : 'botanist';
      }

      map.set(itemId, { glv: glvId, jobType, perceptionReq });
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
      console.log('[GameData] Loading static assets...');

      // 第一階段：先載入 search index 與其他靜態資源（並行）
      const [iconsRes, csvRes, searchIndexRes, itemLevelRes, gatheringItemsRes] = await Promise.all([
        fetch(ICONS_URL),
        fetch(XIVAPI_CSV_URL),
        fetch(`${BASE_URL}/gathering-search-index.json`),
        fetch(`${BASE_URL}/item-level.json`),
        fetch(`${BASE_URL}/gathering-items.json`)
      ]);

      if (!iconsRes.ok) throw new Error(`[GameData] item-icons.json failed: ${iconsRes.status}`);
      rawIcons = await iconsRes.json();

      // 第二階段：必須先解析 search index，才能正確分類 CSV 中的職業
      if (searchIndexRes.ok) {
        rawGatheringSearchIndex = await searchIndexRes.json();
        console.log(`[GameData] gathering-search-index loaded, ${Object.keys(rawGatheringSearchIndex).length} entries`);
      }

      // 現在 rawGatheringSearchIndex 已就緒，可以解析 CSV
      if (csvRes.ok) {
        const csvText = await csvRes.text();
        itemInfoMap = await parseGatheringItemCsv(csvText);
        console.log(`[GameData] itemInfoMap built: ${itemInfoMap.size} items`);
      }

      if (itemLevelRes.ok) {
        rawItemLevels = await itemLevelRes.json();
      }

      if (gatheringItemsRes.ok) {
        rawGatheringItems = await gatheringItemsRes.json();
      }

      staticDataLoaded = true;
    } catch (err) {
      console.error('[GameData] Static data load failed:', err);
    } finally {
      staticLoadPromise = null;
    }
  })();

  return staticLoadPromise;
}

// ─── 語系字典載入 ────────────────────────────────────────────────────────────

async function loadLangData(lang: string): Promise<void> {
  if (currentLanguage.value === lang && Object.keys(rawTargetNames).length > 0) return;
  if (langLoadPromise) await langLoadPromise;
  if (currentLanguage.value === lang && Object.keys(rawTargetNames).length > 0) return;

  langLoadPromise = (async () => {
    try {
      const dictUrl = DICT_URLS[lang] || DICT_URLS.tw;
      const needsEnglish = lang !== 'en' && Object.keys(rawEnglishNames).length === 0;

      const fetchList: Promise<Response>[] = [fetch(dictUrl)];
      if (needsEnglish) fetchList.push(fetch(ENGLISH_URL));

      const results = await Promise.all(fetchList);

      if (results[0].ok) {
        rawTargetNames = await results[0].json();
      }

      if (needsEnglish && results[1]?.ok) {
        rawEnglishNames = await results[1].json();
      } else if (lang === 'en') {
        rawEnglishNames = rawTargetNames;
      }

      currentLanguage.value = lang;
      console.log(`[GameData] Language dict loaded: ${lang}`);
    } catch (err) {
      console.error('[GameData] Language dict load failed:', err);
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

/**
 * 搜尋採掘師/園藝師可採集的物品。
 * 以 GatheringItem.csv 的物品清單為範圍，確保只有這兩個職業能採集到的物品才會出現在結果中。
 * 在本地找出匹配結果後，會向 XIVAPI 批次查詢 IsCollectable 屬性。
 */
export async function searchGatherables(query: string): Promise<GatherableItem[]> {
  const q = query.trim().toLowerCase();
  if (!q || itemInfoMap.size === 0) return [];

  const results: GatherableItem[] = [];

  // 以 GatheringItem.csv 的 ItemID 清單為遍歷基準（僅採掘師/園藝師的採集物）
  for (const [itemId, info] of itemInfoMap) {
    const itemIdStr = itemId.toString();
    const targetEntry = rawTargetNames[itemIdStr];
    const enEntry = rawEnglishNames[itemIdStr];

    const localeLang = currentLanguage.value === 'en' ? 'en' : currentLanguage.value;
    const localeRaw = extractName(targetEntry, localeLang);
    const enRaw = extractName(enEntry, 'en');

    const nameLocale = localeRaw || enRaw;
    const nameEn = enRaw || localeRaw;

    if (!nameLocale && !nameEn) continue;

    const localeMatch = nameLocale.toLowerCase().includes(q);
    const enMatch = nameEn.toLowerCase().includes(q);

    if (localeMatch || enMatch) {
      const iconPath = rawIcons[itemIdStr];
      results.push({
        itemId,
        nameLocale,
        nameEn,
        glv: info.glv,
        jobType: info.jobType,
        perceptionReq: info.perceptionReq,
        iconUrl: iconPath ? `https://xivapi.com${iconPath}` : '',
        isFallback: !localeRaw && !!enRaw,
      });
    }

    if (results.length >= 50) break;
  }

  if (results.length === 0) return [];

  // 提取 itemId 準備向 XIVAPI 批次查詢 IsCollectable 與 GatheringType
  const itemIds = results.map(r => r.itemId).join(',');
  const resp = await fetch(`https://xivapi.com/Item?ids=${itemIds}&columns=ID,IsCollectable`);

  if (!resp.ok) {
    throw new Error(`[GameData] XIVAPI batch query failed: ${resp.status}`);
  }

  const data = await resp.json();
  const collectableMap = new Map<number, boolean>();

  if (data.Results) {
    for (const item of data.Results) {
      if (item.ID && item.IsCollectable !== undefined) {
        collectableMap.set(item.ID, item.IsCollectable === 1);
      }
    }
  }

  for (const r of results) {
    r.isCollectable = collectableMap.get(r.itemId) ?? false;
  }

  return results;
}

export function getItemName(itemId: number): string {
  const idStr = itemId.toString();
  const localeName = extractName(rawTargetNames[idStr], currentLanguage.value);
  const enName = extractName(rawEnglishNames[idStr], 'en');
  return localeName || enName || `Item #${itemId}`;
}

export function getItemIcon(itemId: number): string {
  const path = rawIcons[itemId.toString()];
  return path ? `https://xivapi.com${path}` : '';
}

/** 獲取採集成功率所需的基礎值對照表 (RAM Cache) */
export function getItemLevelData() {
  return rawItemLevels;
}

/** 獲取採集物品等級對照表 (RAM Cache) */
export function getGatheringItemsData() {
  return rawGatheringItems;
}
