import { createWriteStream } from 'node:fs';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CACHE_DIR = join(ROOT, 'scratch', 'collectable-audit-cache');
const BASE = 'https://raw.githubusercontent.com/xivapi/ffxiv-datamining/master/csv/en';

const SOURCES = {
  wksItemInfoCsv: `${BASE}/WKSItemInfo.csv`,
  wksMissionEvaluationItemCsv: `${BASE}/WKSMissionToDoEvalutionItem.csv`,
  wksMissionToDoCsv: `${BASE}/WKSMissionToDo.csv`,
  wksMissionUnitCsv: `${BASE}/WKSMissionUnit.csv`,
  wksMissionRewardCsv: `${BASE}/WKSMissionReward.csv`,
  wksMissionTextCsv: `${BASE}/WKSMissionText.csv`,
  itemCsv: `${BASE}/Item.csv`
};

function cachePath(sourceKey) {
  return join(CACHE_DIR, `${sourceKey}.csv`);
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
    headers: { 'User-Agent': 'frozen-rabbit-tome-wks-reward-trace/1.0' }
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

function key(row) {
  return String(row['#'] ?? '').trim();
}

function intValue(value) {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pick(row, fields) {
  const result = {};
  for (const field of fields) result[field] = row?.[field] ?? '';
  return result;
}

async function main() {
  const targetItemId = Number(process.argv[2] ?? 48652);
  const [
    itemRows,
    wksItemRows,
    evaluationRows,
    todoRows,
    unitRows,
    rewardRows,
    textRows
  ] = await Promise.all([
    readSource('itemCsv').then(toObjects),
    readSource('wksItemInfoCsv').then(toObjects),
    readSource('wksMissionEvaluationItemCsv').then(toObjects),
    readSource('wksMissionToDoCsv').then(toObjects),
    readSource('wksMissionUnitCsv').then(toObjects),
    readSource('wksMissionRewardCsv').then(toObjects),
    readSource('wksMissionTextCsv').then(toObjects)
  ]);

  const item = itemRows.find((row) => intValue(row['#']) === targetItemId);
  const wksItem = wksItemRows.find((row) => intValue(row.Item) === targetItemId);
  if (!wksItem) throw new Error(`No WKSItemInfo row for item ${targetItemId}`);

  const wksItemIndex = key(wksItem);
  const evaluationMatches = evaluationRows.filter((row) => intValue(row.Item) === intValue(wksItemIndex));
  const todoKeys = new Set(evaluationMatches.map((row) => key(row).split('.')[0]));
  const todoMatches = todoRows.filter((row) => todoKeys.has(key(row)));
  const unitMatches = unitRows.filter((row) => {
    return ['MissionToDo[0]', 'MissionToDo[1]', 'MissionToDo[2]'].some((field) => todoKeys.has(String(row[field] ?? '').trim()));
  });

  const traces = unitMatches.map((unit) => {
    const reward = rewardRows.find((row) => key(row) === String(unit.MissionReward ?? '').trim());
    const text = textRows.find((row) => key(row) === String(unit.WKSMissionText ?? '').trim());
    return {
      missionUnit: pick(unit, [
        '#',
        'Name',
        'SilverStarRequirement',
        'GoldStarRequirement',
        'WKSMissionText',
        'ClassJobCategory[0]',
        'ClassJobCategory[1]',
        'MissionTime',
        'MissionReward',
        'MissionToDo[0]',
        'MissionToDo[1]',
        'MissionToDo[2]',
        'WKSMissionSupplyItem',
        'LevelGroup',
        'IsSynced'
      ]),
      reward: pick(reward, [
        '#',
        'Item',
        'ExpModifier[0]',
        'ExpModifier[1]',
        'ExpModifier[2]',
        'CosmoCredits',
        'PlanetCredits',
        'BaseDronebits',
        'ResearchReward[0]',
        'ResearchReward[1]',
        'ResearchReward[2]',
        'ItemCount',
        'Tool[0]',
        'Tool[1]',
        'Tool[2]',
        'TypeIndex[0]',
        'TypeIndex[1]',
        'TypeIndex[2]'
      ]),
      missionText: pick(text, ['#', 'Text'])
    };
  });

  console.log(JSON.stringify({
    item: pick(item, ['#', 'Name', 'IsCollectable', 'AlwaysCollectable', 'ItemUICategory']),
    wksItemInfo: pick(wksItem, ['#', 'Item', 'Unknown1', 'Unknown2', 'WKSItemSubCategory', 'Unknown3']),
    evaluationMatches: evaluationMatches.map((row) => pick(row, ['#', 'Item'])),
    missionToDoMatches: todoMatches.map((row) => pick(row, [
      '#',
      'RequiredItem[0]',
      'RequiredItem[1]',
      'RequiredItem[2]',
      'RequiredItemQuantity[0]',
      'RequiredItemQuantity[1]',
      'RequiredItemQuantity[2]',
      'WKSMissionText',
      'MissionType'
    ])),
    traces
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
