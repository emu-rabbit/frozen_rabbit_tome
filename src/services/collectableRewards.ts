import type {
  CollectableRewardTable,
  CollectableRewardTableSummary,
  CollectableRewardVector
} from '../types/collectable';

const TEAMCRAFT_BRANCH = import.meta.env.VITE_TEAMCRAFT_BRANCH ?? 'staging';
const BASE_URL = `https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/${TEAMCRAFT_BRANCH}/libs/data/src/lib/json`;
const COLLECTABLES_URL = `${BASE_URL}/collectables.json`;

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
