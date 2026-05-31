import { TOME_EXPORT_SCHEMA_VERSION } from '../../config/modelVersions';
import type {
  FrontierCollectableJsonExportInput,
  FrontierCollectableSimulationRequest,
  FrontierCollectableStudy
} from './frontierCollectableTypes';
import { FRONTIER_COLLECTABLE_STUDY_SCHEMA_VERSION } from './frontierCollectableTypes';

export function buildFrontierCollectableJsonExport(input: FrontierCollectableJsonExportInput) {
  return compactJson({
    manifest: {
      app: 'frozen_rabbit_tome',
      schemaVersion: TOME_EXPORT_SCHEMA_VERSION,
      scenario: 'frontier.collectable',
      version: input.analysis.modelVersions.app ?? null,
      commit: input.commit ?? import.meta.env.VITE_APP_COMMIT ?? null,
      generatedAt: input.generatedAt ?? new Date().toISOString(),
      locale: input.locale ?? null,
      limitations: input.analysis.assumptionsUsed.filter((assumption) => !assumption.startsWith('frontier-calculation-ms:'))
    },
    modelVersions: input.analysis.modelVersions,
    subject: {
      surface: 'frontier',
      itemKind: 'collectable',
      item: {
        itemId: input.item.itemId,
        nameLocale: input.item.nameLocale,
        nameEn: input.item.nameEn,
        glv: input.item.glv,
        gatheringItemId: input.item.gatheringItemId,
        jobType: input.item.jobType,
        jobTypes: input.item.jobTypes,
        isTimedNode: input.item.isTimedNode ?? false,
        isCollectable: !!input.item.isCollectable
      }
    },
    input: {
      player: {
        baseStats: input.food?.baseStats ?? null,
        effectiveStats: input.request.stats,
        temporaryGp: input.request.temporaryGp,
        food: {
          selection: input.food?.selection ?? null
        }
      },
      itemLevel: input.request.itemLevel,
      baseValues: input.request.baseValues,
      jobType: input.request.jobType,
      isTimedNode: input.request.isTimedNode,
      node: {
        bonuses: input.request.nodeBonuses,
        maxIntegrity: input.request.nodeBonuses.baseIntegrity + input.request.nodeBonuses.gatheringCount
      },
      hasRelicToolBonus: !!input.request.hasRelicToolBonus,
      objective: input.request.objective,
      rewardTable: input.request.rewardTable
    },
    probabilityProfile: input.request.probabilityProfile,
    strategy: {
      rules: input.request.strategy
    },
    analyzer: input.analysis
  });
}

export class FrontierCollectableJsonImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FrontierCollectableJsonImportError';
  }
}

export interface FrontierCollectableJsonImportProjection {
  defaultName: string;
  study: FrontierCollectableStudy;
}

export function parseFrontierCollectableJsonImport(raw: string): FrontierCollectableJsonImportProjection {
  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new FrontierCollectableJsonImportError('invalidJson');
  }

  if (payload?.manifest?.scenario !== 'frontier.collectable') {
    throw new FrontierCollectableJsonImportError('unsupportedScenario');
  }

  const itemId = Number(payload?.subject?.item?.itemId ?? payload?.input?.itemId);
  if (!Number.isFinite(itemId) || itemId <= 0) {
    throw new FrontierCollectableJsonImportError('missingItem');
  }

  const request = buildRequestProjection(payload);
  const analysis = payload?.analyzer && typeof payload.analyzer === 'object'
    ? payload.analyzer
    : undefined;
  const now = new Date().toISOString();
  const itemName = payload?.subject?.item?.nameLocale || payload?.subject?.item?.nameEn || `Item ${itemId}`;
  const defaultName = payload?.name || `${itemName} 開拓研究`;

  return {
    defaultName,
    study: {
      schemaVersion: FRONTIER_COLLECTABLE_STUDY_SCHEMA_VERSION,
      kind: 'frontier.collectable',
      id: '',
      name: defaultName,
      itemId,
      input: {
        stats: request.stats,
        temporaryGp: request.temporaryGp,
        food: payload?.input?.player?.food?.selection ?? undefined,
        nodeBonuses: request.nodeBonuses,
        hasRelicToolBonus: request.hasRelicToolBonus
      },
      probabilityProfile: request.probabilityProfile,
      strategy: request.strategy,
      lastAnalysisSnapshot: analysis,
      createdAt: now,
      updatedAt: now
    }
  };
}

function buildRequestProjection(payload: any): Pick<
  FrontierCollectableSimulationRequest,
  'stats' | 'temporaryGp' | 'nodeBonuses' | 'hasRelicToolBonus' | 'probabilityProfile' | 'strategy'
> {
  const player = payload?.input?.player;
  const stats = player?.effectiveStats;
  const nodeBonuses = payload?.input?.node?.bonuses;
  const probabilityProfile = payload?.probabilityProfile;
  const strategy = payload?.strategy?.rules;

  if (!stats || !nodeBonuses || !probabilityProfile || !Array.isArray(strategy)) {
    throw new FrontierCollectableJsonImportError('invalidContent');
  }

  return {
    stats: {
      level: Number(stats.level),
      gathering: Number(stats.gathering),
      perception: Number(stats.perception),
      gp: Number(stats.gp)
    },
    temporaryGp: Number(player?.temporaryGp ?? stats.gp),
    nodeBonuses: {
      baseIntegrity: Number(nodeBonuses.baseIntegrity),
      gatheringCount: Number(nodeBonuses.gatheringCount ?? 0),
      yieldCount: Number(nodeBonuses.yieldCount ?? 0),
      extraRate: Number(nodeBonuses.extraRate ?? 0)
    },
    hasRelicToolBonus: !!payload?.input?.hasRelicToolBonus,
    probabilityProfile,
    strategy
  };
}

function compactJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
