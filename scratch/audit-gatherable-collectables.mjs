import { createWriteStream } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CACHE_DIR = join(ROOT, 'scratch', 'collectable-audit-cache');
const REPORT_DIR = join(ROOT, 'scratch', 'collectable-audit-report');

const DATAMINING_BASE = 'https://raw.githubusercontent.com/xivapi/ffxiv-datamining/master/csv/en';
const TEAMCRAFT_BASE = 'https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/staging/libs/data/src/lib/json';

const SOURCES = {
  itemCsv: `${DATAMINING_BASE}/Item.csv`,
  gatheringItemCsv: `${DATAMINING_BASE}/GatheringItem.csv`,
  collectablesShopCsv: `${DATAMINING_BASE}/CollectablesShop.csv`,
  collectablesShopItemCsv: `${DATAMINING_BASE}/CollectablesShopItem.csv`,
  satisfactionSupplyCsv: `${DATAMINING_BASE}/SatisfactionSupply.csv`,
  sharlayanCraftWorksSupplyCsv: `${DATAMINING_BASE}/SharlayanCraftWorksSupply.csv`,
  bankaCraftWorksSupplyCsv: `${DATAMINING_BASE}/BankaCraftWorksSupply.csv`,
  teamcraftCollectablesJson: `${TEAMCRAFT_BASE}/collectables.json`,
  gatheringSearchIndexJson: `${TEAMCRAFT_BASE}/gathering-search-index.json`,
  twItemsJson: `${TEAMCRAFT_BASE}/tw/tw-items.json`,
  wksItemInfoCsv: `${DATAMINING_BASE}/WKSItemInfo.csv`,
  wksMissionSupplyItemCsv: `${DATAMINING_BASE}/WKSMissionSupplyItem.csv`,
  wksMissionEvaluationItemCsv: `${DATAMINING_BASE}/WKSMissionToDoEvalutionItem.csv`,
  reductionJson: `${TEAMCRAFT_BASE}/reduction.json`
};

const CATEGORIES = [
  'generalCollectableTurnIn',
  'customDelivery',
  'sharlayanStudium',
  'wachumeqimeqi',
  'aetherialReduction',
  'cosmicExploration'
];

function cachePath(sourceKey) {
  const url = new URL(SOURCES[sourceKey]);
  return join(CACHE_DIR, `${sourceKey}${url.pathname.endsWith('.json') ? '.json' : '.csv'}`);
}

async function isCached(path) {
  try {
    const info = await stat(path);
    return info.size > 0;
  } catch {
    return false;
  }
}

async function downloadOnce(sourceKey) {
  const target = cachePath(sourceKey);
  if (await isCached(target)) return target;

  await mkdir(dirname(target), { recursive: true });
  const response = await fetch(SOURCES[sourceKey], {
    headers: {
      'User-Agent': 'frozen-rabbit-tome-collectable-audit/1.0'
    }
  });

  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${sourceKey}: HTTP ${response.status}`);
  }

  await pipeline(response.body, createWriteStream(target));
  return target;
}

async function readSource(sourceKey) {
  const path = await downloadOnce(sourceKey);
  return readFile(path, 'utf8');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value !== '')) rows.push(row);
  }

  return rows;
}

function toObjects(csvText) {
  const rows = parseCsv(csvText);
  const headers = rows[0] ?? [];
  return rows.slice(1).map((row) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = row[index] ?? '';
    });
    return entry;
  });
}

function intValue(value) {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function boolValue(value) {
  return String(value ?? '').trim().toLowerCase() === 'true';
}

function addCategory(categoryMap, itemId, category) {
  if (!itemId) return;
  if (!categoryMap.has(itemId)) categoryMap.set(itemId, new Set());
  categoryMap.get(itemId).add(category);
}

function parseGatheringItems(rows, searchIndex) {
  const items = new Map();
  for (const row of rows) {
    const itemId = intValue(row.Item);
    if (!itemId) continue;

    const gatheringItemId = intValue(row['#']);
    const typeId = intValue(row.Unknown3);
    const searchTypes = searchIndex[String(itemId)]?.types ?? [];
    const searchType = searchTypes[0];
    const jobType = Number.isFinite(searchType)
      ? (searchType === 0 || searchType === 1 ? 'miner' : 'botanist')
      : (typeId === 0 || typeId === 1 ? 'miner' : 'botanist');

    items.set(itemId, {
      itemId,
      gatheringItemId,
      glv: intValue(row.GatheringItemLevel),
      perceptionReq: intValue(row.PerceptionReq),
      jobType,
      isHidden: boolValue(row.IsHidden)
    });
  }
  return items;
}

function parseItems(rows) {
  const items = new Map();
  for (const row of rows) {
    const itemId = intValue(row['#']);
    if (!itemId) continue;

    items.set(itemId, {
      itemId,
      name: row.Name || row.Singular || `Item #${itemId}`,
      isCollectable: boolValue(row.IsCollectable) || boolValue(row.AlwaysCollectable),
      aetherialReduce: intValue(row.AetherialReduce),
      itemUICategory: intValue(row.ItemUICategory),
      itemSearchCategory: intValue(row.ItemSearchCategory),
      isUntradable: boolValue(row.IsUntradable)
    });
  }
  return items;
}

function collectGeneralTurnIns(shopRows, shopItemRows) {
  const shopItemToItems = new Map();
  for (const row of shopItemRows) {
    const fullKey = String(row['#'] ?? '').trim();
    const groupKey = fullKey.split('.')[0];
    const itemId = intValue(row.Item);
    if (!groupKey || !itemId) continue;

    if (!shopItemToItems.has(groupKey)) shopItemToItems.set(groupKey, new Set());
    shopItemToItems.get(groupKey).add(itemId);
  }

  const itemIds = new Set();
  for (const row of shopRows) {
    for (const [header, value] of Object.entries(row)) {
      if (!header.startsWith('ShopItems[')) continue;
      const shopItemId = String(value ?? '').trim();
      const items = shopItemToItems.get(shopItemId);
      if (items) {
        for (const itemId of items) itemIds.add(itemId);
      }
    }
  }
  return itemIds;
}

function collectSimpleItemColumn(rows, column = 'Item') {
  const itemIds = new Set();
  for (const row of rows) {
    const itemId = intValue(row[column]);
    if (itemId) itemIds.add(itemId);
  }
  return itemIds;
}

function collectIndexedItemColumns(rows) {
  const itemIds = new Set();
  for (const row of rows) {
    for (const [header, value] of Object.entries(row)) {
      if (!/^Item\[\d+\]\.ItemId$/.test(header)) continue;
      const itemId = intValue(value);
      if (itemId) itemIds.add(itemId);
    }
  }
  return itemIds;
}

function collectWksMissionItems(wksItemInfoRows, supplyRows, evaluationRows) {
  const wksItemToItemId = new Map();
  for (const row of wksItemInfoRows) {
    const wksItemId = intValue(row['#']);
    const itemId = intValue(row.Item);
    if (wksItemId && itemId) wksItemToItemId.set(wksItemId, itemId);
  }

  const wksItemIds = new Set();
  for (const row of supplyRows) {
    for (const [header, value] of Object.entries(row)) {
      if (!/^Item\[\d+\]$/.test(header)) continue;
      const wksItemId = intValue(value);
      if (wksItemId) wksItemIds.add(wksItemId);
    }
  }
  for (const row of evaluationRows) {
    const wksItemId = intValue(row.Item);
    if (wksItemId) wksItemIds.add(wksItemId);
  }

  const itemIds = new Set();
  for (const wksItemId of wksItemIds) {
    const itemId = wksItemToItemId.get(wksItemId);
    if (itemId) itemIds.add(itemId);
  }
  return itemIds;
}

function formatCsvValue(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(rows) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => formatCsvValue(row[header])).join(','))
  ];
  return `${lines.join('\n')}\n`;
}

function describeCandidate(itemId, itemInfo, gatheringInfo, categories) {
  return {
    itemId,
    name: itemInfo?.name ?? `Item #${itemId}`,
    nameTw: itemInfo?.nameTw ?? '',
    jobType: gatheringInfo.jobType,
    gatheringItemId: gatheringInfo.gatheringItemId,
    glv: gatheringInfo.glv,
    isCollectable: itemInfo?.isCollectable ?? false,
    aetherialReduce: itemInfo?.aetherialReduce ?? 0,
    itemUICategory: itemInfo?.itemUICategory ?? 0,
    itemSearchCategory: itemInfo?.itemSearchCategory ?? 0,
    isUntradable: itemInfo?.isUntradable ?? false,
    categories: [...categories].join('|')
  };
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });
  await mkdir(REPORT_DIR, { recursive: true });

  const [
    itemRows,
    gatheringRows,
    shopRows,
    shopItemRows,
    satisfactionRows,
    sharlayanRows,
    bankaRows,
    teamcraftCollectablesText,
    gatheringSearchIndexText,
    twItemsText,
    wksItemInfoRows,
    wksMissionSupplyItemRows,
    wksMissionEvaluationItemRows,
    reductionText
  ] = await Promise.all([
    readSource('itemCsv').then(toObjects),
    readSource('gatheringItemCsv').then(toObjects),
    readSource('collectablesShopCsv').then(toObjects),
    readSource('collectablesShopItemCsv').then(toObjects),
    readSource('satisfactionSupplyCsv').then(toObjects),
    readSource('sharlayanCraftWorksSupplyCsv').then(toObjects),
    readSource('bankaCraftWorksSupplyCsv').then(toObjects),
    readSource('teamcraftCollectablesJson'),
    readSource('gatheringSearchIndexJson'),
    readSource('twItemsJson'),
    readSource('wksItemInfoCsv').then(toObjects),
    readSource('wksMissionSupplyItemCsv').then(toObjects),
    readSource('wksMissionEvaluationItemCsv').then(toObjects),
    readSource('reductionJson')
  ]);

  const itemMap = parseItems(itemRows);
  const twItems = JSON.parse(twItemsText);
  for (const [itemId, itemInfo] of itemMap) {
    const twEntry = twItems[String(itemId)];
    itemInfo.nameTw = typeof twEntry === 'string' ? twEntry : (twEntry?.tw ?? twEntry?.zh ?? '');
  }
  const gatheringMap = parseGatheringItems(gatheringRows, JSON.parse(gatheringSearchIndexText));
  const categoryMap = new Map();

  for (const itemId of collectGeneralTurnIns(shopRows, shopItemRows)) {
    addCategory(categoryMap, itemId, 'generalCollectableTurnIn');
  }
  for (const itemIdText of Object.keys(JSON.parse(teamcraftCollectablesText))) {
    addCategory(categoryMap, intValue(itemIdText), 'generalCollectableTurnIn');
  }
  for (const itemId of collectSimpleItemColumn(satisfactionRows)) {
    addCategory(categoryMap, itemId, 'customDelivery');
  }
  for (const itemId of collectIndexedItemColumns(sharlayanRows)) {
    addCategory(categoryMap, itemId, 'sharlayanStudium');
  }
  for (const itemId of collectIndexedItemColumns(bankaRows)) {
    addCategory(categoryMap, itemId, 'wachumeqimeqi');
  }

  const reduction = JSON.parse(reductionText);
  for (const itemIdText of Object.keys(reduction)) {
    addCategory(categoryMap, intValue(itemIdText), 'aetherialReduction');
  }
  for (const [itemId, itemInfo] of itemMap) {
    if (itemInfo.aetherialReduce > 0) addCategory(categoryMap, itemId, 'aetherialReduction');
  }
  for (const itemId of collectWksMissionItems(wksItemInfoRows, wksMissionSupplyItemRows, wksMissionEvaluationItemRows)) {
    addCategory(categoryMap, itemId, 'cosmicExploration');
  }

  const candidates = [];
  for (const [itemId, gatheringInfo] of gatheringMap) {
    const itemInfo = itemMap.get(itemId);
    const categories = categoryMap.get(itemId) ?? new Set();
    if (itemInfo?.isCollectable || categories.size > 0) {
      candidates.push(describeCandidate(itemId, itemInfo, gatheringInfo, categories));
    }
  }

  const collectableCandidates = candidates.filter((item) => item.isCollectable);
  const categoryCandidates = candidates.filter((item) => item.categories !== '');
  const uncategorized = collectableCandidates.filter((item) => item.categories === '');
  const multiCategorized = collectableCandidates.filter((item) => item.categories.includes('|'));
  const categorizedButNotCollectable = categoryCandidates.filter((item) => !item.isCollectable);

  const byCategory = Object.fromEntries(CATEGORIES.map((category) => [category, 0]));
  for (const item of collectableCandidates) {
    for (const category of item.categories.split('|').filter(Boolean)) {
      byCategory[category] += 1;
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    sourceCount: Object.keys(SOURCES).length,
    gatherableMinerBotanistItems: gatheringMap.size,
    collectableGatherableCandidates: collectableCandidates.length,
    categorizedCollectableCandidates: collectableCandidates.length - uncategorized.length,
    uncategorizedCollectableCandidates: uncategorized.length,
    multiCategorizedCollectableCandidates: multiCategorized.length,
    categorizedButNotCollectable: categorizedButNotCollectable.length,
    byCategory
  };

  await writeFile(join(REPORT_DIR, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  await writeFile(join(REPORT_DIR, 'all-candidates.csv'), writeCsv(candidates), 'utf8');
  await writeFile(join(REPORT_DIR, 'uncategorized.csv'), writeCsv(uncategorized), 'utf8');
  await writeFile(join(REPORT_DIR, 'multi-categorized.csv'), writeCsv(multiCategorized), 'utf8');
  await writeFile(join(REPORT_DIR, 'categorized-but-not-collectable.csv'), writeCsv(categorizedButNotCollectable), 'utf8');

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
