import type {
  CollectableRewardTable,
  CollectableRewardTableSummary,
  CollectableRewardVector
} from '../types/collectable';

const TEAMCRAFT_BRANCH = import.meta.env.VITE_TEAMCRAFT_BRANCH ?? 'staging';
const BASE_URL = `https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/${TEAMCRAFT_BRANCH}/libs/data/src/lib/json`;
const COLLECTABLES_URL = `${BASE_URL}/collectables.json`;
const DATAMINING_BASE_URL = 'https://raw.githubusercontent.com/xivapi/ffxiv-datamining/master/csv/en';
const SATISFACTION_SUPPLY_URL = `${DATAMINING_BASE_URL}/SatisfactionSupply.csv`;
const SATISFACTION_SUPPLY_REWARD_URL = `${DATAMINING_BASE_URL}/SatisfactionSupplyReward.csv`;
const SHARLAYAN_SUPPLY_URL = `${DATAMINING_BASE_URL}/SharlayanCraftWorksSupply.csv`;
const BANKA_SUPPLY_URL = `${DATAMINING_BASE_URL}/BankaCraftWorksSupply.csv`;
const COLLECTABLES_REFINE_URL = `${DATAMINING_BASE_URL}/CollectablesRefine.csv`;
const PURPLE_GATHERERS_SCRIP_ITEM_ID = 33914;
const ORANGE_GATHERERS_SCRIP_ITEM_ID = 41785;
const CUSTOM_DELIVERY_PURPLE_CURRENCY = 4;
const CUSTOM_DELIVERY_ORANGE_CURRENCY = 7;

type TeamcraftCollectableTier = {
  rating?: number;
  exp?: number;
  scrip?: number;
};

type TeamcraftCollectableEntry = {
  reward?: number;
  base?: TeamcraftCollectableTier;
  mid?: TeamcraftCollectableTier;
  high?: TeamcraftCollectableTier;
};

let collectableRewardCache = new Map<number, CollectableRewardTable>();
let collectableRewardLoadPromise: Promise<Map<number, CollectableRewardTable>> | null = null;

type CsvRow = Record<string, string>;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
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

function toCsvRows(text: string): CsvRow[] {
  const rows = parseCsv(text);
  const headers = rows[0] ?? [];
  return rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
}

function intValue(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toRewardVector(tier: TeamcraftCollectableTier | undefined): CollectableRewardVector {
  return {
    // Teamcraft collectables.json stores a compact EXP ratio/value here, not the in-game
    // absolute EXP reward. Keep EXP out of the reward vector until we load the proper
    // CollectablesShopRewardScrip/level EXP data.
    exp: 0,
    gil: 0,
    scrip: Number(tier?.scrip ?? 0),
    items: {}
  };
}

function toRewardTable(itemId: number, entry: TeamcraftCollectableEntry): CollectableRewardTable | null {
  if (!entry.base || !entry.mid) return null;

  const highCollectability = Number(entry.high?.rating ?? 0);

  return {
    itemId,
    source: 'collectables',
    rewardItemId: Number(entry.reward ?? 0) || undefined,
    tiers: {
      low: {
        collectability: Number(entry.base.rating ?? 0),
        reward: toRewardVector(entry.base)
      },
      mid: {
        collectability: Number(entry.mid.rating ?? 0),
        reward: toRewardVector(entry.mid)
      },
      ...(entry.high
        ? {
            high: {
              collectability: highCollectability,
              reward: toRewardVector(entry.high)
            }
          }
        : {})
    }
  };
}

function pruneCollectables(raw: Record<string, TeamcraftCollectableEntry>): Map<number, CollectableRewardTable> {
  const tables = new Map<number, CollectableRewardTable>();

  Object.entries(raw).forEach(([itemIdText, entry]) => {
    const itemId = Number(itemIdText);
    if (!Number.isFinite(itemId)) return;

    const table = toRewardTable(itemId, entry);
    if (table) {
      tables.set(itemId, table);
    }
  });

  return tables;
}

async function fetchCsvRows(url: string): Promise<CsvRow[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load CSV: ${url} (${response.status})`);
  }

  return toCsvRows(await response.text());
}

function mergeRewardTables(
  target: Map<number, CollectableRewardTable>,
  source: Map<number, CollectableRewardTable>
) {
  source.forEach((table, itemId) => {
    if (!target.has(itemId)) {
      target.set(itemId, table);
    }
  });
}

function scaledRewardVector(exp: number, gil: number, scrip: number, multiplier = 100): CollectableRewardVector {
  return {
    exp: Math.floor(exp * multiplier / 100),
    gil: Math.floor(gil * multiplier / 100),
    scrip: Math.floor(scrip * multiplier / 100),
    items: {}
  };
}

function buildTwoTierTable(options: {
  itemId: number;
  source: CollectableRewardTable['source'];
  lowCollectability: number;
  highCollectability: number;
  exp: number;
  gil: number;
  scrip: number;
  highExpMultiplier: number;
  highGilMultiplier: number;
  highScripMultiplier: number;
  rewardItemId: number;
}): CollectableRewardTable | null {
  if (!options.itemId || !options.lowCollectability || !options.highCollectability) return null;

  return {
    itemId: options.itemId,
    source: options.source,
    rewardItemId: options.rewardItemId,
    tiers: {
      low: {
        collectability: options.lowCollectability,
        reward: scaledRewardVector(options.exp, options.gil, options.scrip)
      },
      mid: {
        collectability: options.highCollectability,
        reward: {
          exp: Math.floor(options.exp * options.highExpMultiplier / 100),
          gil: Math.floor(options.gil * options.highGilMultiplier / 100),
          scrip: Math.floor(options.scrip * options.highScripMultiplier / 100),
          items: {}
        }
      }
    }
  };
}

function parseSharlayanRewards(rows: CsvRow[]): Map<number, CollectableRewardTable> {
  const tables = new Map<number, CollectableRewardTable>();

  rows.forEach((row) => {
    for (let index = 0; index < 4; index += 1) {
      const prefix = `Item[${index}]`;
      const table = buildTwoTierTable({
        itemId: intValue(row[`${prefix}.ItemId`]),
        source: 'sharlayanStudium',
        lowCollectability: intValue(row[`${prefix}.CollectabilityMid`]),
        highCollectability: intValue(row[`${prefix}.CollectabilityHigh`]),
        exp: intValue(row[`${prefix}.XPReward`]),
        gil: intValue(row[`${prefix}.GilReward`]),
        scrip: intValue(row[`${prefix}.ScripReward`]),
        highExpMultiplier: intValue(row[`${prefix}.HighXPMultiplier`]) || 100,
        highGilMultiplier: intValue(row[`${prefix}.HighGilMultiplier`]) || 100,
        highScripMultiplier: intValue(row[`${prefix}.HighScripMultiplier`]) || 100,
        rewardItemId: PURPLE_GATHERERS_SCRIP_ITEM_ID
      });

      if (table) tables.set(table.itemId, table);
    }
  });

  return tables;
}

function parseCollectablesRefineRows(rows: CsvRow[]): Map<number, { low: number; mid: number; high: number }> {
  const refine = new Map<number, { low: number; mid: number; high: number }>();

  rows.forEach((row) => {
    const id = intValue(row['#']);
    if (!id) return;

    refine.set(id, {
      low: intValue(row.CollectabilityLow),
      mid: intValue(row.CollectabilityMid),
      high: intValue(row.CollectabilityHigh)
    });
  });

  return refine;
}

function parseBankaRewards(
  rows: CsvRow[],
  refineRows: Map<number, { low: number; mid: number; high: number }>
): Map<number, CollectableRewardTable> {
  const tables = new Map<number, CollectableRewardTable>();

  rows.forEach((row) => {
    for (let index = 0; index < 4; index += 1) {
      const prefix = `Item[${index}]`;
      const itemId = intValue(row[`${prefix}.ItemId`]);
      const thresholds = refineRows.get(intValue(row[`${prefix}.Collectability`]));
      if (!itemId || !thresholds?.low || !thresholds.mid) continue;

      const exp = intValue(row[`${prefix}.XPReward`]);
      const gil = intValue(row[`${prefix}.GilReward`]);
      const scrip = intValue(row[`${prefix}.ScripReward`]);
      const highExpMultiplier = intValue(row[`${prefix}.HighXPMultiplier`]) || 100;
      const highGilMultiplier = intValue(row[`${prefix}.HighGilMultiplier`]) || 100;
      const highScripMultiplier = intValue(row[`${prefix}.HighScripMultiplier`]) || 100;
      const highReward = {
        exp: Math.floor(exp * highExpMultiplier / 100),
        gil: Math.floor(gil * highGilMultiplier / 100),
        scrip: Math.floor(scrip * highScripMultiplier / 100),
        items: {}
      };

      tables.set(itemId, {
        itemId,
        source: 'wachumeqimeqi',
        rewardItemId: ORANGE_GATHERERS_SCRIP_ITEM_ID,
        tiers: {
          low: {
            collectability: thresholds.low,
            reward: scaledRewardVector(exp, gil, scrip)
          },
          mid: {
            collectability: thresholds.mid,
            reward: highReward
          },
          ...(thresholds.high > 0
            ? {
                high: {
                  collectability: thresholds.high,
                  reward: highReward
                }
              }
            : {})
        }
      });
    }
  });

  return tables;
}

function getCustomDeliveryScrip(row: CsvRow, tier: 'Low' | 'Mid' | 'High') {
  const rewards = [0, 1]
    .map((index) => ({
      currency: intValue(row[`SatisfactionSupplyRewardData[${index}].RewardCurrency`]),
      quantity: intValue(row[`SatisfactionSupplyRewardData[${index}].Quantity${tier}`])
    }))
    .filter((reward) => (
      reward.quantity > 0
      && (reward.currency === CUSTOM_DELIVERY_ORANGE_CURRENCY || reward.currency === CUSTOM_DELIVERY_PURPLE_CURRENCY)
    ));

  return rewards.find((reward) => reward.currency === CUSTOM_DELIVERY_ORANGE_CURRENCY)
    ?? rewards.find((reward) => reward.currency === CUSTOM_DELIVERY_PURPLE_CURRENCY)
    ?? null;
}

function parseCustomDeliveryRewards(
  supplyRows: CsvRow[],
  rewardRows: CsvRow[]
): Map<number, CollectableRewardTable> {
  const tables = new Map<number, CollectableRewardTable>();
  const rewardById = new Map(rewardRows.map((row) => [intValue(row['#']), row] as const));

  supplyRows.forEach((row) => {
    const itemId = intValue(row.Item);
    const rewardRow = rewardById.get(intValue(row.Reward));
    if (!itemId || !rewardRow) return;

    const lowScrip = getCustomDeliveryScrip(rewardRow, 'Low');
    const midScrip = getCustomDeliveryScrip(rewardRow, 'Mid');
    const highScrip = getCustomDeliveryScrip(rewardRow, 'High');
    if (!lowScrip || !midScrip || !highScrip) return;

    const rewardItemId = highScrip.currency === CUSTOM_DELIVERY_ORANGE_CURRENCY
      ? ORANGE_GATHERERS_SCRIP_ITEM_ID
      : PURPLE_GATHERERS_SCRIP_ITEM_ID;

    tables.set(itemId, {
      itemId,
      source: 'customDelivery',
      rewardItemId,
      tiers: {
        low: {
          collectability: intValue(row.CollectabilityLow),
          reward: {
            exp: 0,
            gil: intValue(rewardRow.GilLow),
            scrip: lowScrip.quantity,
            items: {}
          }
        },
        mid: {
          collectability: intValue(row.CollectabilityMid),
          reward: {
            exp: 0,
            gil: intValue(rewardRow.GilMid),
            scrip: midScrip.quantity,
            items: {}
          }
        },
        high: {
          collectability: intValue(row.CollectabilityHigh),
          reward: {
            exp: 0,
            gil: intValue(rewardRow.GilHigh),
            scrip: highScrip.quantity,
            items: {}
          }
        }
      }
    });
  });

  return tables;
}

async function loadSupplementalRewardTables(): Promise<Map<number, CollectableRewardTable>> {
  const [
    satisfactionSupplyRows,
    satisfactionRewardRows,
    sharlayanRows,
    bankaRows,
    refineRows
  ] = await Promise.all([
    fetchCsvRows(SATISFACTION_SUPPLY_URL),
    fetchCsvRows(SATISFACTION_SUPPLY_REWARD_URL),
    fetchCsvRows(SHARLAYAN_SUPPLY_URL),
    fetchCsvRows(BANKA_SUPPLY_URL),
    fetchCsvRows(COLLECTABLES_REFINE_URL)
  ]);
  const tables = new Map<number, CollectableRewardTable>();

  mergeRewardTables(tables, parseCustomDeliveryRewards(satisfactionSupplyRows, satisfactionRewardRows));
  mergeRewardTables(tables, parseSharlayanRewards(sharlayanRows));
  mergeRewardTables(tables, parseBankaRewards(bankaRows, parseCollectablesRefineRows(refineRows)));

  return tables;
}

export async function loadCollectableRewardTables(): Promise<Map<number, CollectableRewardTable>> {
  if (collectableRewardCache.size > 0) return collectableRewardCache;
  if (collectableRewardLoadPromise) return collectableRewardLoadPromise;

  collectableRewardLoadPromise = (async () => {
    const response = await fetch(COLLECTABLES_URL);
    if (!response.ok) {
      throw new Error(`Failed to load collectables.json: ${response.status}`);
    }

    const raw = await response.json() as Record<string, TeamcraftCollectableEntry>;
    collectableRewardCache = pruneCollectables(raw);
    try {
      mergeRewardTables(collectableRewardCache, await loadSupplementalRewardTables());
    } catch (error) {
      console.error('Supplemental collectable reward tables failed to load:', error);
    }
    collectableRewardLoadPromise = null;
    return collectableRewardCache;
  })().catch((error) => {
    collectableRewardLoadPromise = null;
    throw error;
  });

  return collectableRewardLoadPromise;
}

export async function getCollectableRewardTable(itemId: number): Promise<CollectableRewardTable | null> {
  const tables = await loadCollectableRewardTables();
  return tables.get(itemId) ?? null;
}

export function summarizeCollectableRewardTable(
  rewardTable: CollectableRewardTable
): CollectableRewardTableSummary {
  return {
    source: rewardTable.source,
    rewardItemId: rewardTable.rewardItemId,
    lowCollectability: rewardTable.tiers.low.collectability,
    lowScrip: rewardTable.tiers.low.reward.scrip,
    midCollectability: rewardTable.tiers.mid.collectability,
    midScrip: rewardTable.tiers.mid.reward.scrip,
    highCollectability: rewardTable.tiers.high?.collectability,
    highScrip: rewardTable.tiers.high?.reward.scrip
  };
}

export function __setCollectableRewardTablesForTest(tables: Map<number, CollectableRewardTable>) {
  collectableRewardCache = tables;
  collectableRewardLoadPromise = null;
}

export function __parseCollectableRewardsForTest(raw: Record<string, TeamcraftCollectableEntry>) {
  return pruneCollectables(raw);
}

export function __parseCsvForTest(text: string) {
  return toCsvRows(text);
}

export function __parseCustomDeliveryRewardsForTest(supplyCsv: string, rewardCsv: string) {
  return parseCustomDeliveryRewards(toCsvRows(supplyCsv), toCsvRows(rewardCsv));
}

export function __parseSharlayanRewardsForTest(csv: string) {
  return parseSharlayanRewards(toCsvRows(csv));
}

export function __parseBankaRewardsForTest(supplyCsv: string, refineCsv: string) {
  return parseBankaRewards(toCsvRows(supplyCsv), parseCollectablesRefineRows(toCsvRows(refineCsv)));
}
